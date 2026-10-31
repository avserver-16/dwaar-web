import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { toast } from '../stores/useToastStore';

export function useUserGroupsQuery(userId) {
  return useQuery({
    queryKey: queryKeys.groups.user(userId),
    queryFn: () => api.userGroups(userId),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

export function useNearbyGroupsQuery(lat, lng, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.nearby(lat, lng),
    queryFn: () => api.nearbyGroups(lat, lng),
    enabled: enabled && lat !== undefined && lng !== undefined && lat !== '' && lng !== '',
    staleTime: 1000 * 30,
  });
}

export function useGroupMessagesQuery(groupId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.messages(groupId),
    queryFn: () => api.groupMessages(groupId),
    enabled: enabled && !!groupId,
    staleTime: 1000 * 10,
    retry: false, // Don't keep retrying if OUT_OF_RANGE or LOCATION_STALE
  });
}

export function useCreateGroupMutation() {
  return useMutation({
    mutationFn: (groupData) => api.createGroup(groupData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast('Group created successfully!', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}

export function useJoinGroupMutation() {
  return useMutation({
    mutationFn: ({ groupId, userId }) => api.joinGroup(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast('Joined group!', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}

export function useAddGroupMemberMutation() {
  return useMutation({
    mutationFn: ({ groupId, userId }) => api.addGroupMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast('Member added', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}

export function useRemoveGroupMemberMutation() {
  return useMutation({
    mutationFn: ({ groupId, userId }) => api.removeGroupMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast('Member removed', 'ok');
    },
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}
