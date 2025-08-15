import mongoose from 'mongoose';

const mcqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2 && arr.length <= 6,
        message: 'Options must contain between 2 and 6 entries.',
      },
    },
    correctIndex: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return Number.isInteger(v) && v >= 0 && this.options && v < this.options.length;
        },
        message: 'correctIndex must be a valid index into options.',
      },
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    tags: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

mcqSchema.index({ question: 'text', tags: 1, difficulty: 1 });

export const Mcq = mongoose.model('Mcq', mcqSchema);