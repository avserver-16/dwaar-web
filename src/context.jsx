import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, BASE, tokens, setAuthLostHandler } from './api';

/* ---------- Auth ---------- */
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokens.access);

  useEffect(() => {
    setAuthLostHandler(() => setUser(null));
    if (!tokens.access) return;
    api.me().then(setUser).catch(() => tokens.clear()).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (creds) => {
    const data = await api.login(creds);
    tokens.set(data.token, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    tokens.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => setUser(await api.me()), []);

  const value = useMemo(() => ({ user, loading, login, logout, refreshUser }), [user, loading, login, logout, refreshUser]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

/* ---------- Socket ---------- */
const SocketCtx = createContext({ socket: null, online: [] });
export const useSocket = () => useContext(SocketCtx);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [online, setOnline] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    const s = io(BASE || window.location.origin, { auth: { token: tokens.access } });
    const register = () => { setConnected(true); s.emit('register_user', { userId: user._id }); };
    s.on('connect', register);
    s.on('disconnect', () => setConnected(false));
    s.on('online_users', (list) => setOnline(Array.isArray(list) ? list.map((u) => (typeof u === 'object' ? u._id || u.userId : u)) : []));
    s.on('user_offline', (id) => setOnline((o) => o.filter((x) => x !== id)));
    setSocket(s);
    return () => { s.disconnect(); setSocket(null); setConnected(false); };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({ socket, online, connected }), [socket, online, connected]);
  return <SocketCtx.Provider value={value}>{children}</SocketCtx.Provider>;
}

/* ---------- Toasts ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, kind = 'ok') => {
    const id = Math.random();
    setItems((i) => [...i, { id, text, kind }]);
    setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts">
        {items.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}
