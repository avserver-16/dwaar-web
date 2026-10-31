import { create } from 'zustand';
import { io } from 'socket.io-client';
import { BASE, tokens, api } from '../api';
import { queryClient } from '../queries/queryClient';
import { queryKeys } from '../queries/queryKeys';
import { toast } from './useToastStore';

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,
  online: [],
  lastLocation: null,
  activeGroupIds: [],

  connect: (token) => {
    const existing = get().socket;
    if (existing) {
      if (existing.connected) return existing;
      existing.disconnect();
    }

    const authToken = token || tokens.access;
    if (!authToken) return null;

    const s = io(BASE || window.location.origin, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      set({ connected: true });
      s.emit('register_user');
      s.emit('get_online_users');

      // Sync device location on socket connect if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            get().updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
          },
          () => {},
          { timeout: 8000, maximumAge: 60000 }
        );
      }
    });

    s.on('disconnect', () => {
      set({ connected: false });
    });

    s.on('online_users', (list) => {
      const ids = Array.isArray(list)
        ? list.map((u) => (typeof u === 'object' ? u._id || u.userId : u)).filter(Boolean)
        : [];
      set({ online: ids });
    });

    s.on('user_offline', (data) => {
      const offlineId = typeof data === 'object' ? data.userId || data._id : data;
      set((state) => ({ online: state.online.filter((id) => id !== offlineId) }));
    });

    s.on('groups_updated', (data) => {
      if (data?.joined?.length || data?.left?.length) {
        set({ activeGroupIds: data.joined || [] });
        queryClient.invalidateQueries({ queryKey: ['groups'] });
      }
    });

    s.on('friend_request_received', (data) => {
      const name = data?.requester?.name || 'Someone';
      toast(`New friend request from ${name}!`, 'ok');
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests });
    });

    s.on('friend_request_accepted', (data) => {
      const name = data?.user?.name || 'Someone';
      toast(`${name} accepted your friend request!`, 'ok');
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests });
    });

    s.on('group_error', (err) => {
      const code = err?.code;
      const msg = err?.message || 'Group action error';
      if (code === 'OUT_OF_RANGE') {
        toast('Outside group radius: ' + msg, 'err');
      } else if (code === 'LOCATION_STALE' || code === 'LOCATION_REQUIRED') {
        toast('Location expired: updating your GPS coordinates...', 'err');
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            get().updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
          });
        }
      } else if (code === 'TELEPORT_DETECTED') {
        toast('Speed threshold exceeded: location update rejected.', 'err');
      } else {
        toast(msg, 'err');
      }
    });

    s.on('private_message_error', (err) => {
      const msg = err?.error || err?.message || 'Private messaging error';
      if (err?.code === 'NOT_FRIENDS') {
        toast('You can only message accepted friends.', 'err');
      } else if (err?.code === 'BLOCKED') {
        toast('Cannot send message: blocked by user.', 'err');
      } else {
        toast(msg, 'err');
      }
    });

    set({ socket: s });
    return s;
  },

  disconnect: () => {
    const s = get().socket;
    if (s) {
      s.disconnect();
      set({ socket: null, connected: false, online: [] });
    }
  },

  updateLocation: async (lat, lng, accuracy = null) => {
    const s = get().socket;
    const loc = { lat: Number(lat), lng: Number(lng), accuracy, updatedAt: new Date().toISOString() };
    set({ lastLocation: loc });

    // Emit socket update for instant geo-fenced group membership
    if (s?.connected) {
      s.emit('update_location', { lat: Number(lat), lng: Number(lng), accuracy });
    }

    // Also persist via REST endpoint in backend
    try {
      await api.updateUserLocation({ lat: Number(lat), lng: Number(lng), accuracy });
    } catch {
      /* ignore */
    }
  },

  sendPrivateMessage: ({ toUserId, message, type = 'TEXT', attachment = null }) => {
    const s = get().socket;
    if (!s?.connected) {
      toast('Not connected to realtime server', 'err');
      return false;
    }
    s.emit('send_private_message', { toUserId, message, type, attachment });
    return true;
  },

  sendPrivateTyping: (toUserId, isTyping) => {
    const s = get().socket;
    if (s?.connected) {
      s.emit('private_typing', { toUserId, isTyping: !!isTyping });
    }
  },

  sendGroupMessage: ({ groupId, message, type = 'TEXT', attachment = null }) => {
    const s = get().socket;
    if (!s?.connected) {
      toast('Not connected to realtime server', 'err');
      return false;
    }
    s.emit('send_group_message', { groupId, message, type, attachment });
    return true;
  },

  sendGroupTyping: (groupId, isTyping) => {
    const s = get().socket;
    if (s?.connected) {
      s.emit('group_typing', { groupId, isTyping: !!isTyping });
    }
  },

  joinGroup: (groupId) => {
    const s = get().socket;
    if (s?.connected) {
      s.emit('join_group', { groupId });
    }
  },

  leaveGroup: (groupId) => {
    const s = get().socket;
    if (s?.connected) {
      s.emit('leave_group', { groupId });
    }
  },
}));
