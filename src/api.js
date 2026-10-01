// Dev: same-origin (Vite proxies to VITE_API_URL, see vite.config.js). Prod: call the backend directly.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
export const BASE = import.meta.env.DEV ? '' : API_URL;

const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export const tokens = {
  get access() { return ls.get('token'); },
  get refresh() { return ls.get('refreshToken'); },
  set(access, refresh) {
    if (access) ls.set('token', access);
    if (refresh) ls.set('refreshToken', refresh);
  },
  clear() { ls.del('token'); ls.del('refreshToken'); },
};

let onAuthLost = () => {};
export const setAuthLostHandler = (fn) => { onAuthLost = fn; };

async function send(path, { method = 'GET', body, form, headers = {}, auth = true } = {}) {
  const h = { ...headers };
  if (auth && tokens.access) h.Authorization = `Bearer ${tokens.access}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { h['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  return fetch(BASE + path, { method, headers: h, body: payload });
}

async function refreshAccess() {
  if (!tokens.refresh) return false;
  try {
    const res = await send('/api/users/refresh-token', { method: 'POST', body: { refreshToken: tokens.refresh }, auth: false });
    if (!res.ok) return false;
    const data = await res.json();
    tokens.set(data.token);
    return true;
  } catch { return false; }
}

function errorMessage(data, status) {
  if (status === 429) return 'Too many requests, or the host blocked this request (429). Wait a moment and retry.';
  if (status === 502 || status === 503 || status === 504) return `The server is waking up or unavailable (${status}). Wait ~30s and retry.`;
  if (!data) return `Request failed (${status})`;
  if (Array.isArray(data.errors)) return data.errors.join(', ');
  return data.error || data.msg || data.message || `Request failed (${status})`;
}

// 502/503/504 = Render instance is asleep or restarting; 429 = Cloudflare/rate-limit hiccup.
// None of these reached the app, so retrying with backoff is safe.
const TRANSIENT = new Set([429, 502, 503, 504]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendWithRetry(path, opts, tries = 4) {
  let res;
  for (let i = 0; i < tries; i += 1) {
    try {
      res = await send(path, opts);
    } catch (err) {
      // Blocked responses (no CORS headers) and cold starts surface as network errors.
      if (i === tries - 1) throw new Error('Cannot reach the server. It may be starting up or blocking the request — try again in a moment.');
      await wait(1500 * 2 ** i);
      continue;
    }
    if (!TRANSIENT.has(res.status) || i === tries - 1) return res;
    const retryAfter = Number(res.headers.get('retry-after'));
    await wait(retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : 1500 * 2 ** i);
  }
  return res;
}

export async function request(path, opts = {}) {
  let res = await sendWithRetry(path, opts);
  if (res.status === 401 && opts.auth !== false && await refreshAccess()) {
    res = await send(path, opts);
  } else if (res.status === 401 && opts.auth !== false && tokens.access) {
    tokens.clear();
    onAuthLost();
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new Error(errorMessage(data, res.status));
  return data;
}

const post = (path, body, opts) => request(path, { method: 'POST', body, ...opts });

export const api = {
  health: () => request('/health', { auth: false }),

  // users
  register: (b) => post('/api/users/', b, { auth: false }),
  checkPhone: (phone) => post('/api/users/check-phone', { phone }, { auth: false }),
  login: (b) => post('/api/users/login', b, { auth: false }),
  me: () => request('/api/users/me'),
  users: () => request('/api/users/'),
  user: (id) => request(`/api/users/${id}`),
  updateUser: (id, b) => request(`/api/users/${id}`, { method: 'PUT', body: b }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
  logout: () => post('/api/users/logout'),
  getLocation: () => request('/api/users/get-location'),
  addLocation: (b) => post('/api/users/add-location', b),
  nearbyBuildings: (radius) => post('/api/users/nearby-buildings', { radius }),
  joinRoom: (roomId) => post('/api/users/join-room', { roomId }),
  joinedRooms: () => request('/api/users/joined-rooms'),

  // spatial
  spatialNearby: (b) => post('/api/spatial/nearby', b, { auth: false }),
  spatialNearbyRooms: (b) => post('/api/spatial/nearby-rooms', b, { auth: false }),

  // groups
  createGroup: (b) => post('/api/groups/', b),
  userGroups: (uid) => request(`/api/groups/user/${uid}`),
  addGroupMember: (gid, userId) => post(`/api/groups/${gid}/members`, { userId }),
  removeGroupMember: (gid, uid) => request(`/api/groups/${gid}/members/${uid}`, { method: 'DELETE' }),
  groupMessages: (gid) => request(`/api/groups/${gid}/messages`),
  joinGroup: (gid, userId) => post(`/api/groups/${gid}/join`, { userId }),

  // messages / conversations
  roomMessages: (rid) => request(`/api/messages/rooms/${rid}`),
  privateMessages: (toId, myId) => request(`/api/messages/private/${toId}`, { headers: { 'X-User-Id': myId } }),
  conversations: (uid) => request(`/api/conversations/${uid}`),

  // upload
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/api/upload/', { method: 'POST', form, auth: false });
  },
};

/** Convert an upload response into the message attachment shape + message type. */
export function toAttachment(file, original) {
  const rt = file.resource_type;
  const type = rt === 'image' ? 'IMAGE' : rt === 'video' ? 'VIDEO' : 'DOCUMENT';
  return {
    type,
    attachment: {
      url: file.url,
      publicId: file.public_id,
      fileName: original?.name || file.public_id,
      mimeType: original?.type || `${rt}/${file.format}`,
      size: file.bytes,
    },
  };
}
