import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { queryKeys } from './queryKeys';

export function useConversationsQuery(userId) {
  return useQuery({
    queryKey: queryKeys.messages.conversations(userId),
    queryFn: () => api.conversations(userId),
    enabled: !!userId,
    staleTime: 1000 * 15,
  });
}

export function usePrivateMessagesQuery(toUserId, myId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.messages.private(toUserId),
    queryFn: () => api.privateMessages(toUserId, myId),
    enabled: enabled && !!toUserId,
    staleTime: 1000 * 10,
    retry: false, // Don't loop retry on NOT_FRIENDS or BLOCKED errors
  });
}
