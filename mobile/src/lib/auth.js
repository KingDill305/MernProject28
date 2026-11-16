import { createContext, createElement, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Logged-in user { id, FirstName, LastName }, saved so the app stays logged in.
const KEY = 'quad.user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((s) => { if (s) setUser(JSON.parse(s)); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const signIn = async (u) => {
    setUser(u);
    try { await AsyncStorage.setItem(KEY, JSON.stringify(u)); } catch { /* still logged in for this session */ }
  };
  const signOut = async () => {
    setUser(null);
    try { await AsyncStorage.removeItem(KEY); } catch { /* ignore */ }
  };

  return createElement(AuthContext.Provider, { value: { user, ready, signIn, signOut } }, children);
}

export const useAuth = () => useContext(AuthContext);
