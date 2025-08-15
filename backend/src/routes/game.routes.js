import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  createGame,
  listWaiting,
  requestJoin,
  acceptJoin,
  submitAnswer,
  forceEnd,
  getState,
  getResults,
} from '../controllers/game.controller.js';

const router = Router();

// lobby
router.get('/waiting', listWaiting);

// lifecycle
router.post('/', auth(), createGame);
router.post('/:id/request-join', auth(), requestJoin);
router.post('/:id/accept', auth(), acceptJoin); // owner accepts
router.post('/:id/submit-answer', auth(), submitAnswer);
router.post('/:id/force-end', auth(), forceEnd);

// read-only
router.get('/:id/state', getState);
router.get('/:id/results', getResults);

export default router;