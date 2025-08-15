import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';

import authRoutes from './routes/auth.routes.js';
import mcqRoutes from './routes/mcq.routes.js';
import gameRoutes from './routes/game.routes.js';
import pusherRoutes from './routes/pusher.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';

import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

/* ---------- Security & Parsers ---------- */
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean) || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

/* ---------- Global rate limit ---------- */
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

/* ---------- DB ---------- */
await connectDB();

/* ---------- Routes ---------- */
app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/mcqs', mcqRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/pusher', pusherRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

/* ---------- 404 & Error Handling ---------- */
app.use(notFound);
app.use(errorHandler);

/* ---------- Start ---------- */
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});