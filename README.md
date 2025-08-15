# 1v1 MCQ Battle

A real-time **1 vs 1 quiz battle** web app. Players sign up, create or join a lobby game, and compete by answering MCQs in real time. The game ends when **10 minutes** expire or a player reaches **3 incorrect answers**. Built with **Node.js/Express + MongoDB** on the backend, **React + Vite** on the frontend, and **Pusher** for websockets.

> This README covers setup, environment, commands, API endpoints, realtime events, gameplay rules, testing, and deployment tips.

---

## ✨ Features

- **Auth**: signup/login with JWT
- **MCQ CRUD**: create, list, update, delete questions
- **Lobby**: live list of open games (websocket)
- **Matchmaking**: request/accept join, instant notifications
- **Gameplay**:
  - Real-time question delivery (no answer leakage)
  - Server-side scoring and validation
  - **10-minute match timer**
  - **3-wrong disqualification**
  - **Per-question deadline** (default 30s) with auto mark-wrong on timeout
- **Results**: final winner + per-player stats
- **Leaderboard**: global stats (matches, wins, total/best scores)
- **Resilience**: reconnect-safe `/state` + `/results`
- **DX**: clear file structure, validators, error handling, rate limiting
- **Tests**: backend (Jest + Supertest) and frontend (Vitest + RTL)

---

## 🧱 Tech Stack

- **Backend**: Node.js, Express, Mongoose, JWT, Zod, Helmet, CORS, Pusher
- **DB**: MongoDB (Docker optional)
- **Frontend**: React 18, Vite, React Router, Axios, TailwindCSS, Framer Motion, Pusher JS
- **Tests**: Jest + Supertest (backend), Vitest + Testing Library (frontend)

---

## 📁 Monorepo Structure

```
1v1-mcq-battle/
├─ README.md
├─ .gitignore
├─ docker-compose.yml            # Mongo + optional mongo-express
│
├─ backend/
│  ├─ package.json
│  ├─ .env.example
│  ├─ jest.config.js
│  ├─ tests/
│  │  ├─ app.test.js
│  │  └─ flow.test.js
│  └─ src/
│     ├─ index.js
│     ├─ config/db.js
│     ├─ models/
│     │  ├─ User.js  ├─ Mcq.js  ├─ Game.js  └─ Leaderboard.js
│     ├─ controllers/
│     │  ├─ auth.controller.js  ├─ mcq.controller.js  └─ game.controller.js
│     ├─ routes/
│     │  ├─ auth.routes.js  ├─ mcq.routes.js
│     │  ├─ game.routes.js  ├─ pusher.routes.js  └─ leaderboard.routes.js
│     ├─ middleware/ (auth, errorHandler)
│     ├─ services/ (pusher, gameTimers)
│     ├─ utils/ (asyncHandler)
│     └─ validators/ (auth.schema, mcq.schema)
│
└─ frontend/
   ├─ package.json
   ├─ .env.example
   ├─ index.html  vite.config.js  tailwind.config.js  postcss.config.js
   ├─ vitest.config.js  vitest.setup.js
   └─ src/
      ├─ main.jsx  App.jsx  styles.css
      ├─ api/ (http, auth, mcq, game)
      ├─ pusher/client.js
      ├─ context/AuthContext.jsx
      ├─ components/ (Navbar, ProtectedRoute, Spinner, Countdown)
      ├─ pages/
      │  ├─ Login.jsx  Signup.jsx  McqList.jsx  McqForm.jsx
      │  ├─ Lobby.jsx  GameRoom.jsx  Leaderboard.jsx
      │  └─ __tests__/ (Login.test.jsx, GameRoom.test.jsx)
```

---

## ⚙️ Prerequisites

- **Node.js** ≥ 18.17
- **npm** ≥ 9
- **Docker** (optional, for MongoDB)
- **Pusher** account (for realtime; app runs without realtime in “no-op” mode too)

---

## 🚀 Quick Start

1) **Clone & install**
```bash
git clone <your-repo-url> 1v1-mcq-battle
cd 1v1-mcq-battle
```

2) **Start Mongo (optional via Docker)**
```bash
docker compose up -d
# Mongo at mongodb://127.0.0.1:27017
# Optional UI at http://localhost:8081 (admin/admin)
```

3) **Backend**
```bash
cd backend
cp .env.example .env   # fill values below
npm install
npm run dev            # runs on http://localhost:4000
```

4) **Frontend**
```bash
cd ../frontend
cp .env.example .env   # fill values below
npm install
npm run dev            # runs on http://localhost:5173
```

Open **http://localhost:5173**

---

## 🔐 Environment Variables

### `backend/.env`
```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/mcq_battle

JWT_SECRET=replace-with-a-very-long-random-string
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200

# Pusher (server)
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=ap2

# Game knobs
GAME_DURATION_MS=600000
GAME_MAX_WRONG=3
GAME_DIFFICULTY=

# Bonus
QUESTION_DURATION_MS=30000
LEADERBOARD_LIMIT=20
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:4000
VITE_PUSHER_KEY=your-pusher-key
VITE_PUSHER_CLUSTER=ap2
```

> No Pusher creds? The backend falls back to a **no-op Pusher** client. The app works, but realtime won’t update.

---

## 🧭 API Overview

Base URL: `http://localhost:4000`

### Auth
- `POST /api/auth/signup` → `{ user, token }`
- `POST /api/auth/login` → `{ user, token }`
- `GET  /api/auth/me` (Bearer) → `{ user }`

### MCQs
- `GET  /api/mcqs` (q, difficulty, page, limit)
- `GET  /api/mcqs/:id`
- `POST /api/mcqs` (Bearer) – `{ question, options[], correctIndex, difficulty, tags[] }`
- `PUT  /api/mcqs/:id` (Bearer)
- `DELETE /api/mcqs/:id` (Bearer)

### Games & Lobby
- `GET  /api/games/waiting` – lobby list
- `POST /api/games` (Bearer) – create game (status `waiting`)
- `POST /api/games/:id/request-join` (Bearer) – challenger requests to join
- `POST /api/games/:id/accept` (Bearer owner) – accept challenger → game becomes `active`
- `POST /api/games/:id/submit-answer` (Bearer) – `{ questionId, selectedIndex }`
- `POST /api/games/:id/force-end` (Bearer owner) – end early
- `GET  /api/games/:id/state` – sanitized state (for reconnect)
- `GET  /api/games/:id/results` – after completion

### Leaderboard
- `GET  /api/leaderboard/top` – public top N
- `GET  /api/leaderboard/me` (Bearer) – current user’s stats

### Pusher Auth
- `POST /api/pusher/auth` (Bearer) – private channel auth for Pusher

---

## 🔌 Realtime Channels & Events

**Channels**
- Lobby: `public-lobby`
- User: `private-user-<userId>`
- Game: `private-game-<gameId>`

**Events**
- Lobby:
  - `lobby:game_created` `{ id, owner, createdAt }`
  - `lobby:game_updated` `{ id, status }`
  - `lobby:game_removed` `{ id }`
- Requests:
  - `game:join_request` `{ gameId, fromUser }` → to owner’s user channel
  - `game:join_accepted` `{ gameId }` → to challenger’s user channel
- Game:
  - `game:started` → sanitized game object
  - `game:question` `{ questionId, question, options, deadline? }` (no correctIndex)
  - `game:score_update` `{ participants[], answered? }`
  - `game:question_reveal` `{ questionId, correctIndex }`
  - `game:question_timeout` `{ questionId }` (bonus)
  - `game:ended` `{ reason, winner, participants[] }`

---

## 🎮 Gameplay Rules

- **Start**: Owner creates a game → Challenger sends join request → Owner accepts → `active`.
- **Duration**: **10 minutes** total (`GAME_DURATION_MS`).
- **Per-question timer**: default **30s** (`QUESTION_DURATION_MS`). Unanswered = wrong.
- **Scoring**: +1 for correct; **wrong++** for incorrect/timeout.
- **Disqualification**: at **3 wrong** (`GAME_MAX_WRONG`), player is DQ’d; opponent wins.
- **End conditions**:
  - Time up,
  - A DQ happens,
  - Or no more questions match the filter.
- **Results**: Winner (or draw) and per-player stats. Leaderboard updates.

---

## 🧪 Testing

### Backend
```bash
cd backend
npm test
# Runs Jest tests in /tests (requires API running on http://localhost:4000, or set API_URL)
```

### Frontend
```bash
cd frontend
npm test
# Runs Vitest + RTL unit tests
```

---

## 🛡️ Security & Production Notes

- JWT secrets must be **long & random**. Never commit `.env`.
- Enable HTTPS and secure cookies if you add sessions.
- Add Mongo auth/Atlas in production (docker-compose is for dev only).
- Replace in-memory per-question timers with:
  - A queue (BullMQ) or
  - Redis with TTL and a worker process for robustness at scale.
- Rate limits are applied to auth routes; tune for your environment.
- CORS: update `CORS_ORIGIN` to your frontend origin(s).

---

## 🛠️ Useful cURL Snippets

```bash
# Signup
curl -X POST http://localhost:4000/api/auth/signup   -H "content-type: application/json"   -d '{"username":"alice","email":"alice@test.dev","password":"StrongPass123"}'

# Login (get token)
curl -X POST http://localhost:4000/api/auth/login   -H "content-type: application/json"   -d '{"email":"alice@test.dev","password":"StrongPass123"}'

# Create MCQ
curl -X POST http://localhost:4000/api/mcqs   -H "authorization: Bearer <TOKEN>" -H "content-type: application/json"   -d '{"question":"2+2=?","options":["3","4","5"],"correctIndex":1,"difficulty":"easy","tags":["math"]}'

# Create Game
curl -X POST http://localhost:4000/api/games   -H "authorization: Bearer <TOKEN>"

# Request Join
curl -X POST http://localhost:4000/api/games/<GAME_ID>/request-join   -H "authorization: Bearer <TOKEN_OF_CHALLENGER>"

# Accept Join (owner)
curl -X POST http://localhost:4000/api/games/<GAME_ID>/accept   -H "authorization: Bearer <TOKEN_OF_OWNER>"   -H "content-type: application/json"   -d '{"userId":"<CHALLENGER_USER_ID>"}'

# Submit Answer
curl -X POST http://localhost:4000/api/games/<GAME_ID>/submit-answer   -H "authorization: Bearer <TOKEN>" -H "content-type: application/json"   -d '{"questionId":"<QUESTION_ID>","selectedIndex":0}'
```

---

## 🧭 Troubleshooting

- **Realtime not working?**
  - Verify frontend `.env` has `VITE_PUSHER_KEY` & `VITE_PUSHER_CLUSTER`.
  - Verify backend `.env` has Pusher server creds and your Pusher app is in the same cluster.
  - Check network: backend reachable from frontend (CORS).
- **JWT 401s?** Token missing/expired; re-login. Check `JWT_SECRET`.
- **Mongo errors?** Ensure Mongo is running and `MONGO_URI` correct.
- **Ports busy?** Change `PORT`/Vite port or stop other processes.

---

## 🗺️ Roadmap / Extras

- Presence channels (“who’s online”)
- Spectator mode (read-only game channel)
- Toaster notifications
- Question categories & matchmaking filters
- Redis-backed timers & job queue for scale
- CI workflow for test + lint + build

---

## 📜 License

MIT — do what you like, just keep the notice.

---

## 🙌 Credits

Built for a hackathon spec: **“1v1 MCQ Battle”** with real-time Pusher integration, Node/Express API, MongoDB models, and a React UI. Have fun, and good luck!