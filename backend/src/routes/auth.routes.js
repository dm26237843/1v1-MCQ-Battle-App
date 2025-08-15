import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, me } from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 50 });

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/me', auth(), me);

export default router;