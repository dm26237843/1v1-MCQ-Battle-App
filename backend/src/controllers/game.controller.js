import mongoose from 'mongoose';
import { Game } from '../models/Game.js';
import { Mcq } from '../models/Mcq.js';
import { Leader } from '../models/Leaderboard.js';
import { pusher, Channels, Events } from '../services/pusher.js';
import { scheduleQuestionTimeout, clearGameTimers } from '../services/gameTimers.js';

const DUR = Number(process.env.GAME_DURATION_MS || 10 * 60 * 1000);
const MAX_WRONG = Number(process.env.GAME_MAX_WRONG || 3);
const Q_DUR = Number(process.env.QUESTION_DURATION_MS || 30_000);
const LB_LIMIT = Number(process.env.LEADERBOARD_LIMIT || 20);

function sanitizeGame(gameDoc) {
  const g = gameDoc.toObject ? gameDoc.toObject() : gameDoc;
  return {
    _id: g._id,
    status: g.status,
    owner: g.owner,
    participants: g.participants?.map((p) => ({
      user: p.user,
      score: p.score,
      wrong: p.wrong,
      disqualifiedAt: p.disqualifiedAt,
    })),
    startedAt: g.startedAt,
    endsAt: g.endsAt,
    currentQuestion: g.currentQuestion,
    questionDeadline: g.questionDeadline,
    servedQuestionIds: g.servedQuestionIds,
    difficulty: g.difficulty,
    tags: g.tags,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

async function pickRandomQuestion(game) {
  const match = { _id: { $nin: game.servedQuestionIds || [] } };
  if (game.difficulty) match.difficulty = game.difficulty;
  if (game.tags && game.tags.length) match.tags = { $in: game.tags };
  const [doc] = await Mcq.aggregate([
    { $match: match },
    { $sample: { size: 1 } },
    { $project: { question: 1, options: 1 } }, // never expose correctIndex here
  ]);
  return doc || null; // {_id, question, options}
}

async function broadcastQuestion(gameId, qDoc, deadline) {
  await pusher.trigger(Channels.game(gameId), Events.QUESTION, {
    questionId: qDoc._id,
    question: qDoc.question,
    options: qDoc.options,
    deadline, // ISO string
  });
}

function winnerFromState(game) {
  const [a, b] = game.participants;
  if (!a || !b) return null;
  const aDQ = !!a.disqualifiedAt;
  const bDQ = !!b.disqualifiedAt;
  if (aDQ && !bDQ) return b.user.toString();
  if (bDQ && !aDQ) return a.user.toString();
  if (a.score > b.score) return a.user.toString();
  if (b.score > a.score) return b.user.toString();
  return null; // draw
}

async function updateLeaderboard(game) {
  const [p1, p2] = game.participants;
  const winner = winnerFromState(game);
  const updates = [p1, p2].map((p) => ({
    user: p.user,
    score: p.score,
    result: winner ? (String(p.user) === winner ? 'win' : 'loss') : 'draw',
  }));

  for (const u of updates) {
    const doc = await Leader.findOne({ user: u.user });
    if (!doc) {
      await Leader.create({
        user: u.user,
        username: 'user', // simple snapshot; you can populate from User if desired
        matches: 1,
        wins: u.result === 'win' ? 1 : 0,
        losses: u.result === 'loss' ? 1 : 0,
        draws: u.result === 'draw' ? 1 : 0,
        totalScore: u.score,
        bestScore: u.score,
      });
    } else {
      doc.matches += 1;
      if (u.result === 'win') doc.wins += 1;
      else if (u.result === 'loss') doc.losses += 1;
      else doc.draws += 1;
      doc.totalScore += u.score;
      if (u.score > doc.bestScore) doc.bestScore = u.score;
      await doc.save();
    }
  }
}

async function endGame(game, reason = 'time') {
  game.status = 'completed';
  await game.save();
  clearGameTimers(game._id);

  const winner = winnerFromState(game);
  const payload = {
    reason,
    winner, // null if draw
    participants: game.participants.map((p) => ({
      user: p.user,
      score: p.score,
      wrong: p.wrong,
      disqualifiedAt: p.disqualifiedAt,
    })),
  };
  await pusher.trigger(Channels.game(game._id), Events.GAME_ENDED, payload);
  await pusher.trigger(Channels.LOBBY, Events.LOBBY_GAME_UPDATED, { id: game._id, status: 'completed' });

  await updateLeaderboard(game);
}

async function startNextQuestion(game) {
  const q = await pickRandomQuestion(game);
  if (!q) {
    await endGame(game, 'no-questions');
    return;
  }
  const deadline = new Date(Date.now() + Q_DUR);
  game.currentQuestion = q._id;
  game.questionDeadline = deadline;
  game.servedQuestionIds.push(q._id);
  game.perQuestionAnswers.push({ question: q._id, answers: [] });
  await game.save();

  await broadcastQuestion(game._id, q, deadline.toISOString());

  // schedule timeout for this question
  scheduleQuestionTimeout(game._id, Q_DUR, async () => {
    const fresh = await Game.findById(game._id);
    if (!fresh || fresh.status !== 'active') return;
    if (!fresh.currentQuestion || fresh.questionDeadline?.getTime() > Date.now()) return;

    const qRec = fresh.perQuestionAnswers.find((x) => x.question.toString() === String(fresh.currentQuestion));
    for (const part of fresh.participants) {
      const answered = qRec.answers.some((a) => a.user.toString() === String(part.user));
      if (!answered && !part.disqualifiedAt) {
        part.wrong += 1;
        if (part.wrong >= MAX_WRONG) part.disqualifiedAt = new Date();
      }
    }
    await fresh.save();

    await pusher.trigger(Channels.game(fresh._id), Events.QUESTION_TIMEOUT, { questionId: fresh.currentQuestion });
    await pusher.trigger(Channels.game(fresh._id), Events.SCORE_UPDATE, {
      participants: fresh.participants.map((p) => ({
        user: p.user,
        score: p.score,
        wrong: p.wrong,
        disqualifiedAt: p.disqualifiedAt,
      })),
    });

    const dq = fresh.participants.some((p) => p.disqualifiedAt);
    if (dq) {
      await endGame(fresh, 'disqualification');
      return;
    }
    if (fresh.endsAt && Date.now() >= fresh.endsAt.getTime()) {
      await endGame(fresh, 'time');
      return;
    }
    await startNextQuestion(fresh);
  });
}

/* ================== Controllers ================== */

export const createGame = async (req, res, next) => {
  try {
    const { difficulty = process.env.GAME_DIFFICULTY || '', tags = [] } = req.body || {};
    const game = await Game.create({
      owner: req.user.id,
      participants: [{ user: req.user.id }],
      difficulty,
      tags,
    });
    await pusher.trigger(Channels.LOBBY, Events.LOBBY_GAME_CREATED, {
      id: game._id,
      owner: req.user.id,
      createdAt: game.createdAt,
    });
    res.status(201).json({ game: sanitizeGame(game) });
  } catch (e) {
    next(e);
  }
};

export const listWaiting = async (req, res, next) => {
  try {
    const items = await Game.find({ status: 'waiting' })
      .sort({ createdAt: -1 })
      .select('_id owner createdAt difficulty tags')
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
};

export const requestJoin = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game || game.status !== 'waiting') return res.status(404).json({ error: { message: 'Game not joinable' } });
    if (game.owner.toString() === req.user.id)
      return res.status(400).json({ error: { message: 'Owner cannot join own game' } });
    const alreadyRequested = game.pendingRequests.some((r) => r.user.toString() === req.user.id);
    const alreadyParticipant = game.participants.some((p) => p.user.toString() === req.user.id);
    if (alreadyRequested || alreadyParticipant) return res.json({ ok: true });

    game.pendingRequests.push({ user: req.user.id });
    await game.save();

    await pusher.trigger(Channels.user(game.owner), Events.JOIN_REQUEST, {
      gameId: game._id,
      fromUser: req.user.id,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

export const acceptJoin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const game = await Game.findById(req.params.id);
    if (!game || game.status !== 'waiting') return res.status(404).json({ error: { message: 'Game not joinable' } });
    if (game.owner.toString() !== req.user.id)
      return res.status(403).json({ error: { message: 'Only owner can accept' } });

    const reqIdx = game.pendingRequests.findIndex((r) => r.user.toString() === userId);
    if (reqIdx === -1) return res.status(400).json({ error: { message: 'No such join request' } });

    const players = new Set(game.participants.map((p) => p.user.toString()));
    players.add(userId);
    if (players.size !== 2) return res.status(400).json({ error: { message: 'Game must have exactly 2 unique players' } });

    game.pendingRequests = [];
    if (!game.participants.some((p) => p.user.toString() === userId)) {
      game.participants.push({ user: userId });
    }

    game.status = 'active';
    game.startedAt = new Date();
    game.endsAt = new Date(Date.now() + DUR);
    await game.save();

    await pusher.trigger(Channels.user(userId), Events.JOIN_ACCEPTED, { gameId: game._id });
    await pusher.trigger(Channels.LOBBY, Events.LOBBY_GAME_UPDATED, { id: game._id, status: 'active' });
    await pusher.trigger(Channels.game(game._id), Events.GAME_STARTED, sanitizeGame(game));

    await startNextQuestion(game);
    res.json({ game: sanitizeGame(game) });
  } catch (e) {
    next(e);
  }
};

export const submitAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedIndex } = req.body || {};
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ error: { message: 'Bad game id' } });
    const game = await Game.findById(req.params.id);
    if (!game || game.status !== 'active')
      return res.status(404).json({ error: { message: 'Game not active' } });

    if (game.endsAt && Date.now() >= game.endsAt.getTime()) {
      await endGame(game, 'time');
      return res.status(410).json({ error: { message: 'Game ended (time)' } });
    }

    const part = game.participants.find((p) => p.user.toString() === req.user.id);
    if (!part) return res.status(403).json({ error: { message: 'Not a participant' } });
    if (part.disqualifiedAt) return res.status(403).json({ error: { message: 'Disqualified' } });

    if (!game.currentQuestion || String(game.currentQuestion) !== String(questionId)) {
      return res.status(400).json({ error: { message: 'Not the current question' } });
    }

    if (game.questionDeadline && Date.now() > game.questionDeadline.getTime()) {
      return res.status(410).json({ error: { message: 'Question timed out' } });
    }

    const qRec = game.perQuestionAnswers.find((x) => String(x.question) === String(questionId));
    const already = qRec.answers.some((a) => String(a.user) === req.user.id);
    if (already) return res.status(409).json({ error: { message: 'Already answered' } });

    const mcq = await Mcq.findById(questionId).select('correctIndex');
    const correct = Number(selectedIndex) === mcq.correctIndex;

    qRec.answers.push({ user: req.user.id, selectedIndex, correct });
    if (correct) part.score += 1;
    else {
      part.wrong += 1;
      if (part.wrong >= MAX_WRONG) part.disqualifiedAt = new Date();
    }

    await game.save();

    await pusher.trigger(Channels.game(game._id), Events.SCORE_UPDATE, {
      participants: game.participants.map((p) => ({
        user: p.user,
        score: p.score,
        wrong: p.wrong,
        disqualifiedAt: p.disqualifiedAt,
      })),
      answered: { user: req.user.id },
    });

    if (game.participants.some((p) => p.disqualifiedAt)) {
      await endGame(game, 'disqualification');
      return res.json({ ok: true, correct });
    }

    const bothAnswered = game.participants.every((p) =>
      qRec.answers.some((a) => String(a.user) === String(p.user))
    );
    if (bothAnswered) {
      await pusher.trigger(Channels.game(game._id), Events.QUESTION_REVEAL, {
        questionId,
        correctIndex: mcq.correctIndex,
      });

      if (game.endsAt && Date.now() >= game.endsAt.getTime()) {
        await endGame(game, 'time');
        return res.json({ ok: true, correct });
      }

      await startNextQuestion(game);
    }

    res.json({ ok: true, correct });
  } catch (e) {
    next(e);
  }
};

export const forceEnd = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game || game.status !== 'active')
      return res.status(404).json({ error: { message: 'Game not active' } });
    if (game.owner.toString() !== req.user.id)
      return res.status(403).json({ error: { message: 'Only owner can end' } });
    await endGame(game, 'owner');
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

export const getState = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: { message: 'Not found' } });
    res.json({ game: sanitizeGame(game) });
  } catch (e) {
    next(e);
  }
};

export const getResults = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game || game.status !== 'completed')
      return res.status(400).json({ error: { message: 'Results available after completion' } });
    const winner = winnerFromState(game);
    res.json({
      winner,
      participants: game.participants.map((p) => ({
        user: p.user,
        score: p.score,
        wrong: p.wrong,
        disqualifiedAt: p.disqualifiedAt,
      })),
      perQuestion: game.perQuestionAnswers.map((pq) => ({
        question: pq.question,
        answers: pq.answers.map((a) => ({
          user: a.user,
          selectedIndex: a.selectedIndex,
          correct: a.correct,
        })),
      })),
    });
  } catch (e) {
    next(e);
  }
};

/* ===== Leaderboard endpoints ===== */

export const getLeaderboard = async (req, res, next) => {
  try {
    const items = await Leader.find({}).sort({ totalScore: -1, wins: -1 }).limit(LB_LIMIT).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
};

export const getMyStats = async (req, res, next) => {
  try {
    const me = await Leader.findOne({ user: req.user.id }).lean();
    res.json({ stats: me || null });
  } catch (e) {
    next(e);
  }
};