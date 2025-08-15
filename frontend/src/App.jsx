import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import McqList from './pages/McqList.jsx';
import McqForm from './pages/McqForm.jsx';
import Lobby from './pages/Lobby.jsx';
import GameRoom from './pages/GameRoom.jsx';
// If you added Leaderboard later, also import it here and add a route.

export default function App() {
  const location = useLocation();

  return (
    <div>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/lobby" />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Lobby / Game */}
          <Route
            path="/lobby"
            element={
              <ProtectedRoute>
                <Lobby />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/:id"
            element={
              <ProtectedRoute>
                <GameRoom />
              </ProtectedRoute>
            }
          />

          {/* MCQ management */}
          <Route
            path="/mcqs"
            element={
              <ProtectedRoute>
                <McqList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mcqs/new"
            element={
              <ProtectedRoute>
                <McqForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mcqs/:id/edit"
            element={
              <ProtectedRoute>
                <McqForm />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound from={location.pathname} />} />
        </Routes>
      </main>
    </div>
  );
}

function NotFound({ from }) {
  return (
    <div className="card text-center">
      <h1 className="text-2xl font-semibold mb-2">404</h1>
      <p className="text-gray-600 mb-4">
        No route for <code>{from}</code>
      </p>
      <Link to="/lobby" className="btn">
        Go to Lobby
      </Link>
    </div>
  );
}