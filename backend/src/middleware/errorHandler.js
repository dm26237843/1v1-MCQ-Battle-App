// 404
export function notFound(req, res, next) {
  res.status(404).json({ error: { message: 'Route not found' } });
}

// Error handler (handles Zod, Mongoose, JWT, generic)
export function errorHandler(err, req, res, next) {
  // Zod
  if (err?.name === 'ZodError' || err?.issues) {
    const details = err.issues?.map(i => ({ path: i.path, message: i.message })) || undefined;
    return res.status(400).json({ error: { message: 'Validation failed', details } });
  }

  // Mongoose
  if (err?.name === 'CastError') {
    return res.status(400).json({ error: { message: 'Invalid id format' } });
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ error: { message: 'Database validation failed', details: err.errors } });
  }

  // JWT
  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }

  const status = err.status || 500;
  const message = err.message || 'Server error';
  res.status(status).json({ error: { message } });
}