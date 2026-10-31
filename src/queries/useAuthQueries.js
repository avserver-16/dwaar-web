import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { useAuthStore } from '../stores/useAuthStore';
import { toast } from '../stores/useToastStore';

export function useMeQuery() {
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const user = await api.me();
      setUser(user);
      return user;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateUserMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: ({ id, data }) => api.updateUser(id, data),
    onSuccess: (updated) => {
      setUser(updated);
      queryClient.setQueryData(queryKeys.auth.me, updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast('Profile updated successfully', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}

export function useSaveLocationMutation() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  return useMutation({
    mutationFn: (locationData) => api.addLocation(locationData),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast('Location saved successfully', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}

export function useDeleteUserMutation() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: (id) => api.deleteUser(id),
    onSuccess: () => {
      logout();
      toast('Account deleted permanently', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}
