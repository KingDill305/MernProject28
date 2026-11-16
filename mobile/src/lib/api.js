// JSON client for the Express API. Same endpoints as frontend/src/api.js.
// Set EXPO_PUBLIC_API_URL in mobile/.env to point at the deployed server,
// e.g. EXPO_PUBLIC_API_URL=https://your-domain.com
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://kp-mern-api.duckdns.org').replace(/\/$/, '');

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const q = (params) => {
  const s = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return s ? `?${s}` : '';
};
const enc = encodeURIComponent;

export const api = {
  // Accounts
  register: (u) => request('/api/register', { method: 'POST', body: u }),
  login: (Login, Password) => request('/api/login', { method: 'POST', body: { Login, Password } }),
  resendVerification: (Email) => request('/api/resend-verification', { method: 'POST', body: { Email } }),
  forgotPassword: (Email) => request('/api/forgot-password', { method: 'POST', body: { Email } }),

  // Clubs. `mine` is member | officer.
  listClubs: (userId, { search, category, mine } = {}) => request(`/api/clubs${q({ userId, search, category, mine })}`),
  getClub: (id, userId) => request(`/api/clubs/${enc(id)}${q({ userId })}`),
  joinClub: (id, UserId) => request(`/api/clubs/${enc(id)}/join`, { method: 'POST', body: { UserId } }),
  leaveClub: (id, UserId) => request(`/api/clubs/${enc(id)}/leave`, { method: 'POST', body: { UserId } }),

  // Events. `view` is all | clubs | going | past.
  listEvents: (userId, view) => request(`/api/events${q({ userId, view })}`),
  getEvent: (code, userId) => request(`/api/events/${enc(code)}${q({ userId })}`),

  // RSVP. Status is going | maybe | no.
  rsvp: (code, UserId, Status, PlusOnes = 0) =>
    request(`/api/events/${enc(code)}/rsvp`, { method: 'POST', body: { UserId, Status, PlusOnes } }),

  // Comments
  listComments: (code) => request(`/api/events/${enc(code)}/comments`),
  addComment: (code, UserId, Text) =>
    request(`/api/events/${enc(code)}/comments`, { method: 'POST', body: { UserId, Text } }),
};
