export { api, extractError } from './apiClient.js';

/** Thin endpoint wrappers — keeps thunks/components free of URL strings. */
export const authApi = {
  login: (body) => api.post('/auth/login', body).then((r) => r.data.data),
  register: (body) => api.post('/auth/register', body).then((r) => r.data.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  logoutAll: () => api.post('/auth/logout-all').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data.data),
};

export const productApi = {
  list: (params, signal) => api.get('/products', { params, signal }).then((r) => r.data.data),
  get: (idOrSlug) => api.get(`/products/${idOrSlug}`).then((r) => r.data.data),
  categories: () => api.get('/products/meta/categories').then((r) => r.data.data),
  create: (formData) =>
    api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data),
  update: (id, formData) =>
    api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};

// Cart mutations accept an AbortSignal: the slice supersedes superseded ops so
// rapid stepper clicks never let stale responses overwrite newer state.
export const cartApi = {
  get: (signal) => api.get('/cart', { signal }).then((r) => r.data.data),
  addItem: (productId, qty, signal) =>
    api.post('/cart/items', { productId, qty }, { signal }).then((r) => r.data.data),
  updateItem: (productId, qty, signal) =>
    api.patch(`/cart/items/${productId}`, { qty }, { signal }).then((r) => r.data.data),
  removeItem: (productId, signal) =>
    api.delete(`/cart/items/${productId}`, { signal }).then((r) => r.data.data),
  clear: (signal) => api.delete('/cart', { signal }).then((r) => r.data.data),
};

export const orderApi = {
  create: (body) => api.post('/orders', body).then((r) => r.data.data),
  myOrders: (params) => api.get('/orders/my-orders', { params }).then((r) => r.data.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data.data),
  all: (params) => api.get('/orders', { params }).then((r) => r.data.data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then((r) => r.data.data),
};
