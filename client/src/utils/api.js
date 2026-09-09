import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://hamsaad-lubricants-production.up.railway.app';

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('hamsaad_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired token globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hamsaad_token');
      localStorage.removeItem('hamsaad_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ────────────────────────────────────────────────────
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const changePassword = (data) => API.put('/auth/change-password', data);

// ─── USERS ───────────────────────────────────────────────────
export const getAllUsers = () => API.get('/users');
export const createUser = (data) => API.post('/users', data);
export const toggleUserAccess = (id) => API.patch(`/users/${id}/toggle`);
export const resetUserPassword = (id, data) => API.patch(`/users/${id}/reset-password`, data);

// ─── CLIENTS ─────────────────────────────────────────────────
export const getAllClients = () => API.get('/users/clients/all');
export const createClient = (data) => API.post('/users/clients', data);
export const toggleClientAccess = (id) => API.patch(`/users/clients/${id}/toggle-access`);

// ─── PRODUCTS ────────────────────────────────────────────────
export const getAllProducts = (params) => API.get('/products', { params });
export const getProductById = (id) => API.get(`/products/${id}`);
export const createProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const addStock = (id, data) => API.patch(`/products/${id}/add-stock`, data);
export const getLowStockProducts = () => API.get('/products/low-stock');
export const getStockMovements = (params) => API.get('/products/movements', { params });

// ─── BRANDS & CATEGORIES ─────────────────────────────────────
export const getAllBrands = () => API.get('/products/brands');
export const createBrand = (data) => API.post('/products/brands', data);
export const getAllCategories = () => API.get('/products/categories');
export const createCategory = (data) => API.post('/products/categories', data);

// ─── ORDERS ──────────────────────────────────────────────────
export const getAllOrders = (params) => API.get('/orders', { params });
export const getOrderById = (id) => API.get(`/orders/${id}`);
export const createOrder = (data) => API.post('/orders', data);
export const confirmOrder = (id, data) => API.patch(`/orders/${id}/confirm`, data);
export const approveWaybill = (id) => API.patch(`/orders/${id}/approve-waybill`);
export const confirmGoodsReleased = (id) => API.patch(`/orders/${id}/release`);

export const uploadScannedWaybill = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post(`/orders/${id}/upload-scanned-waybill`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const uploadSignedWaybill = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post(`/orders/${id}/upload-signed-waybill`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const downloadWaybillPDF = (orderId) =>
  window.open(`${BASE_URL}/api/pdf/waybill/${orderId}?token=${localStorage.getItem('hamsaad_token')}`, '_blank');

export const downloadInvoicePDF = (orderId) =>
  window.open(`${BASE_URL}/api/pdf/invoice/${orderId}?token=${localStorage.getItem('hamsaad_token')}`, '_blank');

export default API;