import jwt from 'jsonwebtoken';

/**
 * Usage: app.get('/secure', auth(), handler)
 * Optionally restrict by role: auth(['admin'])
 */
export function auth(roles) {
  const allowed = Array.isArray(roles) ? new Set(roles) : null;

  return (req, res, next) => {
    const hdr = req.headers.authorization || '';
    const [, token] = hdr.split(' '); // "Bearer <token>"
    if (!token) return res.status(401).json({ error: { message: 'Unauthorized' } });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.sub, username: payload.username, role: payload.role || 'user' };
      if (allowed && !allowed.has(req.user.role)) {
        return res.status(403).json({ error: { message: 'Forbidden' } });
      }
      next();
    } catch {
      return res.status(401).json({ error: { message: 'Invalid or expired token' } });
    }
  };
}