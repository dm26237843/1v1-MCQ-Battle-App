import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPusher } from '../pusher/client';
import { forceEnd, getResults, getState, submitAnswer } from '../api/game';
import Countdown from '../components/Countdown';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [question, setQuestion] = useState(null); // {questionId, question, options, deadline}
  const [lastReveal, setLastReveal] = useState(null); // {questionId, correctIndex}
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const amOwner = useMemo(() => game && String(game.owner) === user?.id, [game, user]);

  // Initial fetch
  useEffect(() => {
    (async () => {
      const g = await getState(id);
      setGame(g);
    })();
  }, [id]);

  // Pusher
  useEffect(() => {
    const p = getPusher();
    const ch = p.subscribe(`private-game-${id}`);

    const onStarted = (g) => { setGame(g); setMessage('Match started!'); };
    const onQuestion = (q) => { setQuestion(q); setSelected(null); setLastReveal(null); setMessage('Answer the question'); };
    const onScore = (s) => { setGame((prev) => prev ? { ...prev, participants: s.participants } : prev); };
    const onReveal = (r) => { setLastReveal(r); };
    const onEnded = async () => {
      setMessage('Game ended');
      const data = await getResults(id).catch(() => null);
      if (data) setResults(data);
    };

    ch.bind('game:started', onStarted);
    ch.bind('game:question', onQuestion);
    ch.bind('game:score_update', onScore);
    ch.bind('game:question_reveal', onReveal);
    ch.bind('game:ended', onEnded);

    return () => {
      ch.unbind('game:started', onStarted);
      ch.unbind('game:question', onQuestion);
      ch.unbind('game:score_update', onScore);
      ch.unbind('game:question_reveal', onReveal);
      ch.unbind('game:ended', onEnded);
      p.unsubscribe(`private-game-${id}`);
    };
  }, [id]);

  const answer = async (idx) => {
    if (!question || submitting) return;
    setSubmitting(true);
    try {
      setSelected(idx);
      const res = await submitAnswer(id, question.questionId, idx);
      if (res.correct) setMessage('Correct!'); else setMessage('Oops, that was wrong.');
    } catch (e) {
      alert(e?.response?.data?.error?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const endNow = async () => {
    if (!confirm('End the game for everyone?')) return;
    await forceEnd(id);
  };

  if (!game) return <div className="card">Loading game…</div>;

  if (game.status === 'waiting') {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">Waiting for opponent…</h1>
        <p className="text-gray-600">Share the game ID <code>{game._id}</code> and ask them to send a join request from the lobby.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between card">
        <div>
          <h1 className="text-xl font-semibold">Game</h1>
          <div className="text-sm text-gray-600">ID: <code>{game._id}</code></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">Time left: <Countdown endsAt={game.endsAt} /></div>
          {amOwner && game.status === 'active' && (
            <button className="btn" onClick={endNow}>Force End</button>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="card">
        <h2 className="font-semibold mb-2">Scoreboard</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {game.participants?.map((p) => (
            <div key={p.user} className="rounded-lg border p-3">
              <div className="text-sm text-gray-600">User: <code>{p.user}</code></div>
              <div className="mt-1">Score: <span className="font-semibold">{p.score}</span> · Wrong: <span className="font-semibold">{p.wrong}</span>{p.disqualifiedAt ? ' · DQ' : ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Question */}
      {game.status === 'active' && (
        <div className="card">
          <div className="flex items-start justify-between">
            <h2 className="font-semibold">Current Question</h2>
            <div className="text-sm text-gray-500">{message}</div>
          </div>
          {!question ? (
            <div className="text-gray-600">Waiting for next question…</div>
          ) : (
            <div className="mt-3 space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={question.questionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-lg pr-4">{question.question}</div>
                    {question.deadline && (
                      <div className="text-sm text-gray-600">Time: <Deadline deadline={question.deadline} /></div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
              <ul className="space-y-2">
                {question.options.map((opt, i) => (
                  <li key={i}>
                    <button
                      className={`w-full text-left input ${selected === i ? 'ring-2 ring-indigo-500' : ''}`}
                      disabled={selected !== null || submitting || isExpired(question.deadline)}
                      onClick={() => answer(i)}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>

              {lastReveal && lastReveal.questionId === question.questionId && (
                <div className="mt-2 text-sm text-gray-700">Correct option index: <span className="font-semibold">#{lastReveal.correctIndex}</span></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="card">
          <motion.h2 className="font-semibold mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Results</motion.h2>
          <div className="mb-2">Winner: {results.winner ? <code>{results.winner}</code> : 'Draw'}</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {results.participants.map((p) => (
              <div key={p.user} className="rounded-lg border p-3">
                <div className="text-sm text-gray-600">User: <code>{p.user}</code></div>
                <div className="mt-1">Score: <span className="font-semibold">{p.score}</span> · Wrong: <span className="font-semibold">{p.wrong}</span>{p.disqualifiedAt ? ' · DQ' : ''}</div>
              </div>
            ))}
          </div>
          <button className="btn mt-3" onClick={() => navigate('/lobby')}>Back to Lobby</button>
        </div>
      )}
    </div>
  );
}

function isExpired(deadline) {
  if (!deadline) return false;
  return Date.now() > new Date(deadline).getTime();
}

function Deadline({ deadline }) {
  const [left, setLeft] = useState(() => Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))), 250);
    return () => clearInterval(t);
  }, [deadline]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return <span className={left <= 5 ? 'text-red-600 font-semibold' : ''}>{mm}:{ss}</span>;
}