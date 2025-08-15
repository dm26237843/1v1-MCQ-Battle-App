import { Mcq } from '../models/Mcq.js';
import { mcqCreateSchema, mcqUpdateSchema } from '../validators/mcq.schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createMcq = asyncHandler(async (req, res) => {
  const data = mcqCreateSchema.parse(req.body);
  if (data.correctIndex >= data.options.length) {
    return res.status(400).json({ error: { message: 'correctIndex out of range for options' } });
  }
  const mcq = await Mcq.create({ ...data, createdBy: req.user.id });
  return res.status(201).json({ mcq });
});

export const listMcqs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page ?? '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit ?? '20', 10), 1), 100);
  const skip = (page - 1) * limit;

  const { difficulty, q } = req.query;
  const filter = {};
  if (difficulty) filter.difficulty = difficulty;
  if (q) filter.$text = { $search: q };

  const [items, total] = await Promise.all([
    Mcq.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Mcq.countDocuments(filter),
  ]);

  return res.json({ page, limit, total, items });
});

export const getMcq = asyncHandler(async (req, res) => {
  const mcq = await Mcq.findById(req.params.id).lean();
  if (!mcq) return res.status(404).json({ error: { message: 'MCQ not found' } });
  return res.json({ mcq });
});

export const updateMcq = asyncHandler(async (req, res) => {
  const data = mcqUpdateSchema.parse(req.body);
  const mcq = await Mcq.findById(req.params.id);
  if (!mcq) return res.status(404).json({ error: { message: 'MCQ not found' } });
  if (mcq.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Forbidden' } });
  }

  if (data.options && typeof data.correctIndex === 'number' && data.correctIndex >= data.options.length) {
    return res.status(400).json({ error: { message: 'correctIndex out of range for new options' } });
  }

  Object.assign(mcq, data);
  await mcq.save();
  return res.json({ mcq });
});

export const deleteMcq = asyncHandler(async (req, res) => {
  const mcq = await Mcq.findById(req.params.id);
  if (!mcq) return res.status(404).json({ error: { message: 'MCQ not found' } });
  if (mcq.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Forbidden' } });
  }
  await mcq.deleteOne();
  return res.status(204).send();
});