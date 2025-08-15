import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const active = ({ isActive }) =>
    isActive ? 'text-indigo-700 font-semibold' : 'text-gray-700 hover:text-indigo-700';

  return (
    <header className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-indigo-700">1v1 MCQ Battle</Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <NavLink to="/lobby" className={active}>Lobby</NavLink>
              <NavLink to="/leaderboard" className={active}>Leaderboard</NavLink>
              <NavLink to="/mcqs" className={active}>MCQs</NavLink>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700">Hi, {user.username}</span>
              <button
                className="btn"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={active}>Log in</NavLink>
              <NavLink to="/signup" className={active}>Sign up</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}