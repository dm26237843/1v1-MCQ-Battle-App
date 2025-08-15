import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getLeaderboard, getMyStats } from '../controllers/game.controller.js';

const router = Router();

router.get('/top', getLeaderboard); // public
router.get('/me', auth(), getMyStats); // requires auth

export default router;