import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { queryKeys } from './queryKeys';

export function useHealthQuery() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.health(),
    refetchInterval: 15000, // auto check every 15s on status page
  });
}
