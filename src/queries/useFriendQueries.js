import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { toast } from '../stores/useToastStore';

export function useFriendsQuery() {
  return useQuery({
    queryKey: queryKeys.friends.all,
    queryFn: () => api.friends(),
    staleTime: 1000 * 30,
  });
}

export function useFriendRequestsQuery() {
  return useQuery({
    queryKey: queryKeys.friends.requests,
    queryFn: () => api.friendRequests(),
    staleTime: 1000 * 20,
  });
}

export function useSendFriendRequestMutation() {
  return useMutation({
    mutationFn: (userId) => api.sendFriendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests });
      toast('Friend request sent!', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}

export function useAcceptFriendRequestMutation() {
  return useMutation({
    mutationFn: (requestId) => api.acceptFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests });
      toast('Friend request accepted!', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}

export function useRejectFriendRequestMutation() {
  return useMutation({
    mutationFn: (requestId) => api.rejectFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests });
      toast('Friend request declined', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}

export function useUnfriendMutation() {
  return useMutation({
    mutationFn: (userId) => api.unfriend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      toast('Removed friend', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}

export function useBlockUserMutation() {
  return useMutation({
    mutationFn: (userId) => api.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      toast('User blocked', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}
