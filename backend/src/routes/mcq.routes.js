import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createMcq, listMcqs, getMcq, updateMcq, deleteMcq } from '../controllers/mcq.controller.js';

const router = Router();

router.get('/', listMcqs);
router.get('/:id', getMcq);
router.post('/', auth(), createMcq);
router.put('/:id', auth(), updateMcq);
router.delete('/:id', auth(), deleteMcq);

export default router;