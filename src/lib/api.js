import { apiFetch } from './apiClient';

const handle = async (response) => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

const request = (path, options = {}) => apiFetch(path, options).then(handle);

const buildQuery = (params) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
};

export const api = {
  // Reference data
  getReferenceData: (country) =>
    request(`/reference-data?country=${encodeURIComponent(country || '')}`),

  // Auth
  login: (payload) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () =>
    request('/auth/logout', { method: 'POST' }),
  forgotPassword: (payload) =>
    request('/auth/forgot', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: ({ token, password }) =>
    request('/auth/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),

  // Purchase Orders
  listPurchaseOrders: (params = {}) =>
    request(`/purchase-orders${buildQuery(params)}`),
  getPurchaseOrder: (id) =>
    request(`/purchase-orders/${id}`),
  createPurchaseOrder: (payload) =>
    request('/purchase-orders', { method: 'POST', body: JSON.stringify(payload) }),
  updatePurchaseOrder: (id, payload) =>
    request(`/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deletePurchaseOrder: (id) =>
    request(`/purchase-orders/${id}`, { method: 'DELETE' }),
  approvePurchaseOrder: (id, comment = '') =>
    request(`/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'approve', comment }) }),
  rejectPurchaseOrder: (id, comment = '') =>
    request(`/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'reject', comment }) }),
  submitPurchaseOrder: (id) =>
    request(`/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'submit' }) }),
  cancelPurchaseOrder: (id) =>
    request(`/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'cancel' }) }),
  listApprovals: (params = {}) =>
    request(`/purchase-orders/approvals${buildQuery(params)}`),

  // Suppliers
  listSuppliers: (params = {}) =>
    request(`/suppliers${buildQuery(params)}`),
  getSupplier: (id) =>
    request(`/suppliers/${id}`),
  createSupplier: (payload) =>
    request('/suppliers', { method: 'POST', body: JSON.stringify(payload) }),
  updateSupplier: (id, payload) =>
    request(`/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteSupplier: (id) =>
    request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Addresses
  listAddresses: (params = {}) =>
    request(`/addresses${buildQuery(params)}`),
  getAddress: (id) =>
    request(`/addresses/${id}`),
  createAddress: (payload) =>
    request('/addresses', { method: 'POST', body: JSON.stringify(payload) }),
  updateAddress: (id, payload) =>
    request(`/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteAddress: (id) =>
    request(`/addresses/${id}`, { method: 'DELETE' }),

  // PO PDF & Email
  emailPOToSupplier: (id, payload = {}) =>
    request(`/purchase-orders/${id}/email`, { method: 'POST', body: JSON.stringify(payload) }),

  // PO Comments
  listPOComments: (poId) =>
    request(`/purchase-orders/${poId}/comments`),
  addPOComment: (poId, message) =>
    request(`/purchase-orders/${poId}/comments`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Bulk PO Actions
  bulkPOAction: (payload) =>
    request('/purchase-orders/bulk', { method: 'POST', body: JSON.stringify(payload) }),

  // GRN
  listGRNs: (params = {}) =>
    request(`/grn${buildQuery(params)}`),
  getGRN: (id) =>
    request(`/grn/${id}`),
  createGRN: (payload) =>
    request('/grn', { method: 'POST', body: JSON.stringify(payload) }),

  // Notifications
  listNotifications: (params = {}) =>
    request(`/notifications${buildQuery(params)}`),
  markNotificationsRead: (payload) =>
    request('/notifications', { method: 'PATCH', body: JSON.stringify(payload) }),

  // Supplier Portal
  getSupplierPortal: (params = {}) =>
    request(`/supplier-portal${buildQuery(params)}`),

  // Dashboard
  getDashboard: () =>
    request('/dashboard'),

  // Workspace invites
  sendWorkspaceInvite: ({ workspaceId, email, role, inviterUserId }) =>
    request(`/workspaces/${workspaceId}/invite`, { method: 'POST', body: JSON.stringify({ email, role, inviterUserId }) }),

  // Workspaces
  createWorkspace: (payload) =>
    request('/workspaces', { method: 'POST', body: JSON.stringify(payload) }),
  joinWorkspace: (payload) =>
    request('/workspaces/join', { method: 'POST', body: JSON.stringify(payload) }),
  regenerateJoinCode: ({ workspaceId, requesterUserId }) =>
    request(`/workspaces/${workspaceId}`, { method: 'PATCH', body: JSON.stringify({ requesterUserId }) }),
  listWorkspaceMembers: (workspaceId) =>
    request(`/workspaces/${workspaceId}/members`),

  // Users
  getUser: (userId) => request(`/users/${userId}`),
  updateUser: (userId, payload) =>
    request(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Upload signing
  signUpload: (payload) =>
    request('/uploads', { method: 'POST', body: JSON.stringify(payload) }),
};

export default api;
