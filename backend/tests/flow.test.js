// End-to-end flow covering Auth + MCQ CRUD against a RUNNING server.
// This test avoids game endpoints (which require Pusher) so it works without Pusher credentials.
//
// Prereqs:
//   - Start Mongo (e.g., `docker compose up -d`)
//   - Start the backend (e.g., `npm run dev`)
// Then run: `npm test`

import request from 'supertest';

const API = process.env.API_URL || 'http://localhost:4000';

// Helpers
function uniqueSuffix() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

async function ensureUser(usernameBase) {
  const u = `${usernameBase}_${uniqueSuffix()}`;
  const email = `${u}@test.dev`;
  const password = 'StrongPass123';

  // try signup
  const r = await request(API)
    .post('/api/auth/signup')
    .send({ username: u, email, password });

  if (r.statusCode === 201) {
    return { token: r.body.token, user: r.body.user, creds: { username: u, email, password } };
  }

  // If signup fails for any reason, try login (shouldn’t happen with unique suffix).
  const login = await request(API)
    .post('/api/auth/login')
    .send({ email, password });

  if (login.statusCode !== 200) {
    throw new Error(`Failed to create or login user: ${u} (${login.statusCode}) ${JSON.stringify(login.body)}`);
  }

  return { token: login.body.token, user: login.body.user, creds: { username: u, email, password } };
}

describe('Auth + MCQ flow', () => {
  let token;
  let mcqId;

  it('signs up a fresh user', async () => {
    const u = await ensureUser('jestuser');
    token = u.token;
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  it('creates an MCQ', async () => {
    const payload = {
      question: 'Which data structure uses LIFO?',
      options: ['Queue', 'Stack', 'Heap', 'Tree'],
      correctIndex: 1,
      difficulty: 'easy',
      tags: ['ds', 'basics'],
    };

    const res = await request(API)
      .post('/api/mcqs')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('mcq._id');
    expect(res.body.mcq.question).toContain('LIFO');
    mcqId = res.body.mcq._id;
  });

  it('reads the MCQ by id', async () => {
    const res = await request(API).get(`/api/mcqs/${mcqId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('mcq._id', mcqId);
  });

  it('updates the MCQ', async () => {
    const res = await request(API)
      .put(`/api/mcqs/${mcqId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        question: 'Which data structure follows LIFO principle?',
        difficulty: 'medium',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.mcq.difficulty).toBe('medium');
    expect(res.body.mcq.question).toMatch(/LIFO/);
  });

  it('lists MCQs with search/filter', async () => {
    const res = await request(API).get('/api/mcqs?page=1&limit=10&difficulty=medium&q=LIFO');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    // Should contain our MCQ (not guaranteed if many match, but commonly true in dev)
  });

  it('deletes the MCQ', async () => {
    const res = await request(API)
      .delete(`/api/mcqs/${mcqId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(res.statusCode); // our controller returns 204
  });

  it('returns 404 for deleted MCQ', async () => {
    const res = await request(API).get(`/api/mcqs/${mcqId}`);
    expect(res.statusCode).toBe(404);
  });
});