import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    username: { type: String, required: true }, // store a snapshot username for quick display

    matches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },

    totalScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

leaderboardSchema.index({ totalScore: -1, wins: -1 });

export const Leader = mongoose.model('Leader', leaderboardSchema);