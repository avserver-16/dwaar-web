import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { queryKeys } from './queryKeys';

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => api.users(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUserDetailQuery(userId) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => api.user(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
