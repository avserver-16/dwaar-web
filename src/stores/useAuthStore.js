import { create } from 'zustand';
import { api, tokens, setAuthLostHandler } from '../api';
import { queryClient } from '../queries/queryClient';
import { queryKeys } from '../queries/queryKeys';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: !!tokens.access,
  error: null,

  initAuth: async () => {
    setAuthLostHandler(() => {
      tokens.clear();
      set({ user: null, loading: false });
      queryClient.clear();
    });

    if (!tokens.access) {
      set({ user: null, loading: false });
      return null;
    }

    try {
      set({ loading: true, error: null });
      const user = await api.me();
      set({ user, loading: false });
      queryClient.setQueryData(queryKeys.auth.me, user);
      return user;
    } catch {
      tokens.clear();
      set({ user: null, loading: false });
      queryClient.clear();
      return null;
    }
  },

  setUser: (user) => {
    set({ user });
    if (user) {
      queryClient.setQueryData(queryKeys.auth.me, user);
    }
  },

  login: async (creds) => {
    set({ loading: true, error: null });
    try {
      const data = await api.login(creds);
      tokens.set(data.token, data.refreshToken);
      set({ user: data.user, loading: false });
      queryClient.setQueryData(queryKeys.auth.me, data.user);
      return data.user;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    } finally {
      tokens.clear();
      set({ user: null, loading: false, error: null });
      queryClient.clear();
    }
  },

  refreshUser: async () => {
    try {
      const user = await api.me();
      set({ user });
      queryClient.setQueryData(queryKeys.auth.me, user);
      return user;
    } catch (err) {
      if (err.message.includes('401')) {
        get().logout();
      }
      throw err;
    }
  },
}));
