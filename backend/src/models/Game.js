import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    disqualifiedAt: { type: Date },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    selectedIndex: { type: Number, required: true },
    correct: { type: Boolean, required: true },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const perQuestionSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Mcq', required: true },
    answers: { type: [answerSchema], default: [] },
  },
  { _id: false }
);

const pendingReqSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const gameSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed', 'cancelled'],
      default: 'waiting',
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    participants: { type: [participantSchema], default: [] },
    pendingRequests: { type: [pendingReqSchema], default: [] },

    // gameplay state
    startedAt: { type: Date },
    endsAt: { type: Date },
    currentQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'Mcq' },
    questionDeadline: { type: Date }, // bonus feature: per-question timer
    servedQuestionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    perQuestionAnswers: { type: [perQuestionSchema], default: [] },

    // optional filters for selecting questions
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', ''], default: '' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

gameSchema.index({ status: 1, createdAt: -1 });

export const Game = mongoose.model('Game', gameSchema);