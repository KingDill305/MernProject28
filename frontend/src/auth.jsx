import { createContext, useContext, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const KEY = 'quad.user';
const AuthContext = createContext(null);

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(load);

  const signIn = (u) => {
    setUser(u);
    try { localStorage.setItem(KEY, JSON.stringify(u)); } catch { /* storage blocked */ }
  };
  const signOut = () => {
    setUser(null);
    try { localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  };

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// Sends logged-out visitors to /login and remembers where they were headed.
export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
