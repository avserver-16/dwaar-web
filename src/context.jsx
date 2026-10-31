import { useEffect } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useSocketStore } from './stores/useSocketStore';
import { useToastStore } from './stores/useToastStore';
import { tokens } from './api';

export const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  return { user, loading, login, logout, refreshUser };
};

export const useSocket = () => {
  const socket = useSocketStore((s) => s.socket);
  const online = useSocketStore((s) => s.online);
  const connected = useSocketStore((s) => s.connected);
  const lastLocation = useSocketStore((s) => s.lastLocation);
  const updateLocation = useSocketStore((s) => s.updateLocation);
  return { socket, online, connected, lastLocation, updateLocation };
};

export const useToast = () => {
  return useToastStore((s) => s.push);
};

export function AuthProvider({ children }) {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return children;
}

export function SocketProvider({ children }) {
  const user = useAuthStore((s) => s.user);
  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);

  useEffect(() => {
    if (user && tokens.access) {
      connect(tokens.access);
    } else {
      disconnect();
    }
  }, [user?._id, connect, disconnect]);

  return children;
}

export function ToastProvider({ children }) {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.kind}`}
            onClick={() => remove(t.id)}
            role="alert"
          >
            {t.text}
          </div>
        ))}
      </div>
    </>
  );
}
