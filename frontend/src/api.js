// Thin JSON client for the Express API. Every call is async (fetch), so pages
// update without reloading. The request/response shapes are in frontend/README.md.
const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Check that the API is running.");
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
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
  return s ? `?${s}` : '';
};
const enc = encodeURIComponent;

export const api = {
  // Accounts
  register: (u) => request('/api/register', { method: 'POST', body: u }),
  login: (Login, Password) => request('/api/login', { method: 'POST', body: { Login, Password } }),
  verifyEmail: (token) => request('/api/verify-email', { method: 'POST', body: { token } }),
  resendVerification: (Email) => request('/api/resend-verification', { method: 'POST', body: { Email } }),
  forgotPassword: (Email) => request('/api/forgot-password', { method: 'POST', body: { Email } }),
  resetPassword: (token, Password) => request('/api/reset-password', { method: 'POST', body: { token, Password } }),

  // Clubs. `mine` is member | officer to limit to clubs you're in.
  listClubs: (userId, { search, category, mine } = {}) => request(`/api/clubs${q({ userId, search, category, mine })}`),
  getClub: (id, userId) => request(`/api/clubs/${enc(id)}${q({ userId })}`),
  createClub: (UserId, fields) => request('/api/clubs', { method: 'POST', body: { ...fields, UserId } }),
  updateClub: (id, UserId, fields) => request(`/api/clubs/${enc(id)}`, { method: 'PUT', body: { ...fields, UserId } }),
  deleteClub: (id, UserId) => request(`/api/clubs/${enc(id)}`, { method: 'DELETE', body: { UserId } }),
  joinClub: (id, UserId) => request(`/api/clubs/${enc(id)}/join`, { method: 'POST', body: { UserId } }),
  leaveClub: (id, UserId) => request(`/api/clubs/${enc(id)}/leave`, { method: 'POST', body: { UserId } }),
  setRole: (id, UserId, MemberId, Role) => request(`/api/clubs/${enc(id)}/role`, { method: 'POST', body: { UserId, MemberId, Role } }),

  // Events. `view` is all | clubs | going | past.
  listEvents: (userId, view) => request(`/api/events${q({ userId, view })}`),
  getEvent: (code, userId) => request(`/api/events/${enc(code)}${q({ userId })}`),
  createEvent: (UserId, fields) => request('/api/events', { method: 'POST', body: { ...fields, UserId } }),
  updateEvent: (code, UserId, fields) => request(`/api/events/${enc(code)}`, { method: 'PUT', body: { ...fields, UserId } }),
  cancelEvent: (code, UserId) => request(`/api/events/${enc(code)}`, { method: 'DELETE', body: { UserId } }),

  // Guests. Status is going | maybe | no.
  rsvp: (code, UserId, Status, PlusOnes = 0) =>
    request(`/api/events/${enc(code)}/rsvp`, { method: 'POST', body: { UserId, Status, PlusOnes } }),

  // Comments
  listComments: (code) => request(`/api/events/${enc(code)}/comments`),
  addComment: (code, UserId, Text) => request(`/api/events/${enc(code)}/comments`, { method: 'POST', body: { UserId, Text } }),
};
