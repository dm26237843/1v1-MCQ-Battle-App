import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { pusher } from '../services/pusher.js';

const router = Router();

// Pusher private/presence channel auth
router.post('/auth', auth(), (req, res) => {
  const { socket_id, channel_name } = req.body || {};
  if (!socket_id || !channel_name) {
    return res.status(400).json({ error: { message: 'Bad auth payload' } });
  }
  const authResponse = pusher.authorizeChannel(socket_id, channel_name);
  res.send(authResponse);
});

export default router;