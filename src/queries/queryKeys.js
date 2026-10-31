export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  users: {
    all: ['users'],
    detail: (id) => ['users', id],
  },
  friends: {
    all: ['friends'],
    requests: ['friends', 'requests'],
  },
  spatial: {
    nearby: (lat, lon, radius) => ['spatial', 'nearby', { lat, lon, radius }],
    nearbyRooms: (lat, lon, radius) => ['spatial', 'nearby-rooms', { lat, lon, radius }],
    nearbyBuildings: (radius) => ['spatial', 'nearby-buildings', radius],
  },
  groups: {
    user: (userId) => ['groups', 'user', userId],
    nearby: (lat, lng) => ['groups', 'nearby', { lat, lng }],
    messages: (groupId) => ['groups', groupId, 'messages'],
  },
  rooms: {
    joined: ['rooms', 'joined'],
    messages: (roomId) => ['rooms', roomId, 'messages'],
  },
  messages: {
    conversations: (userId) => ['conversations', userId],
    private: (toUserId) => ['messages', 'private', toUserId],
  },
  health: ['health'],
};
