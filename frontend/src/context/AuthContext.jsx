import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login as apiLogin, signup as apiSignup } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  // Hydrate user on mount if token exists
  useEffect(() => {
    (async () => {
      if (!token || user) return;
      setLoading(true);
      try {
        const me = await getMe();
        setUser(me);
        localStorage.setItem('user', JSON.stringify(me));
      } catch {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const login = async (credentials) => {
    const res = await apiLogin(credentials); // { user, token }
    setToken(res.token);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    localStorage.setItem('user', JSON.stringify(res.user));
    return res.user;
  };

  const signup = async (payload) => {
    const res = await apiSignup(payload); // { user, token }
    setToken(res.token);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    localStorage.setItem('user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);