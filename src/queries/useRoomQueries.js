import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { toast } from '../stores/useToastStore';

export function useJoinedRoomsQuery() {
  return useQuery({
    queryKey: queryKeys.rooms.joined,
    queryFn: async () => {
      const res = await api.joinedRooms();
      return res?.joinedRooms || [];
    },
    staleTime: 1000 * 30,
  });
}

export function useRoomMessagesQuery(roomId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.rooms.messages(roomId),
    queryFn: () => api.roomMessages(roomId),
    enabled: enabled && !!roomId,
    staleTime: 1000 * 10,
  });
}

export function useJoinRoomMutation() {
  return useMutation({
    mutationFn: (roomId) => api.joinRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.joined });
      toast('Joined room!', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}
