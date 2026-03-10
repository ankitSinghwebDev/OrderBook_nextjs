import { apiFetch } from './apiClient';

// Shared response handler: parses JSON and throws on non-2xx.
const handle = async (response) => {
  const data = await response
    .json()
    .catch(() => null); // allow endpoints that return no JSON

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// Convenience wrapper to reduce repetition in endpoint helpers.
const request = (path, options = {}) => apiFetch(path, options).then(handle);

export const api = {
  // Reference data
  getReferenceData: (country) =>
    request(`/reference-data?country=${encodeURIComponent(country || '')}`, {
      method: 'GET',
      cache: 'no-store',
    }),

  // Auth
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  forgotPassword: (payload) =>
    request('/auth/forgot', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resetPassword: ({ token, password }) =>
    request('/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  // Purchase orders
  listPurchaseOrders: ({ workspaceId, approverUserId } = {}) => {
    const params = new URLSearchParams();
    if (workspaceId) params.set('workspaceId', workspaceId);
    if (approverUserId) params.set('approverUserId', approverUserId);
    const qs = params.toString();
    return request(`/purchase-orders${qs ? `?${qs}` : ''}`);
  },

  createPurchaseOrder: (payload) =>
    request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listApprovals: (userId) =>
    request(`/purchase-orders/approvals?userId=${userId}`),

  // Workspace invites
  sendWorkspaceInvite: ({ workspaceId, email, role, inviterUserId }) =>
    request(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role, inviterUserId }),
    }),

  // Workspaces
  createWorkspace: (payload) =>
    request('/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  joinWorkspace: (payload) =>
    request('/workspaces/join', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  regenerateJoinCode: ({ workspaceId, requesterUserId }) =>
    request(`/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ requesterUserId }),
    }),

  listWorkspaceMembers: (workspaceId) =>
    request(`/workspaces/${workspaceId}/members`),

  // Users
  getUser: (userId) => request(`/users/${userId}`),

  updateUser: (userId, payload) =>
    request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Upload signing
  signUpload: (payload) =>
    request('/uploads', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export default api;
