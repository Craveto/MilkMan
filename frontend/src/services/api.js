import axios from 'axios';

// Configure via CRA env var in production: REACT_APP_API_BASE_URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ======================== AUTH SERVICE ========================
export const authService = {
  signup: (data) => apiClient.post('/auth/signup/', data),
  login: (data) => apiClient.post('/auth/login/', data),
  me: () => apiClient.get('/auth/me/'),
  logout: () => apiClient.post('/auth/logout/'),
};

export const developerAuthService = {
  login: (data) => apiClient.post('/developer/auth/login/', data),
};

// ======================== USER SERVICE ========================
export const userService = {
  getDashboardData: (customerId) => apiClient.get('/user/dashboard-data/', { params: { customer_id: customerId } }),
  subscribe: (data) => apiClient.post('/user/subscribe/', data),
  getPayments: (customerId) => apiClient.get('/user/payments/', { params: { customer_id: customerId } }),
  deactivateSubscription: (data) => apiClient.post('/user/deactivate-subscription/', data),
  cartCheckout: (data) => apiClient.post('/user/cart-checkout/', data),
  getOrders: (customerId) => apiClient.get('/user/orders/', { params: { customer_id: customerId } }),
  getSubscriptionBasket: (customerId) => apiClient.get('/user/subscription-basket/', { params: { customer_id: customerId } }),
  upsertSubscriptionBasket: (customerId, data) => apiClient.post('/user/subscription-basket/', { ...data, customer_id: customerId }),
  deleteSubscriptionBasket: (customerId, productId) => apiClient.delete('/user/subscription-basket/', { params: { customer_id: customerId, product_id: productId } }),
  getSubscriptionDeliveries: (customerId, days = 7) => apiClient.get('/user/subscription-deliveries/', { params: { customer_id: customerId, days } }),
  getProfile: () => apiClient.get('/user/profile/'),
  updateProfile: (data) => apiClient.patch('/user/profile/', data),
  getAddresses: () => apiClient.get('/user/addresses/'),
  createAddress: (data) => apiClient.post('/user/addresses/', data),
  updateAddress: (addressId, data) => apiClient.patch(`/user/addresses/${addressId}/`, data),
  deleteAddress: (addressId) => apiClient.delete(`/user/addresses/${addressId}/`),
  requestOtp: (data) => apiClient.post('/user/otp/request/', data),
  verifyOtp: (data) => apiClient.post('/user/otp/verify/', data),
};

// ======================== ADMIN SERVICE ========================
export const adminService = {
  getAll: (params = {}) => apiClient.get('/admins/', { params }),
  getById: (id) => apiClient.get(`/admins/${id}/`),
  create: (data) => apiClient.post('/admins/', data),
  update: (id, data) => apiClient.put(`/admins/${id}/`, data),
  delete: (id) => apiClient.delete(`/admins/${id}/`),
  getActive: () => apiClient.get('/admins/active_admins/'),
  deactivate: (id) => apiClient.post(`/admins/${id}/deactivate/`),
};

export const developerService = {
  listAdminApplications: (status = 'pending') => apiClient.get('/developer/admin-applications/', { params: { status } }),
  approveAdminApplication: (applicationId, note = '') => apiClient.post(`/developer/admin-applications/${applicationId}/approve/`, { note }),
  rejectAdminApplication: (applicationId, note = '') => apiClient.post(`/developer/admin-applications/${applicationId}/reject/`, { note }),
};

// ======================== CATEGORY SERVICE ========================
export const categoryService = {
  getAll: (params = {}) => apiClient.get('/categories/', { params }),
  getById: (id) => apiClient.get(`/categories/${id}/`),
  create: (data) => apiClient.post('/categories/', data),
  update: (id, data) => apiClient.put(`/categories/${id}/`, data),
  delete: (id) => apiClient.delete(`/categories/${id}/`),
  getActive: () => apiClient.get('/categories/active_categories/'),
  getProductCount: (id) => apiClient.get(`/categories/${id}/products_count/`),
};

// ======================== SUBSCRIPTION SERVICE ========================
export const subscriptionService = {
  getAll: (params = {}) => apiClient.get('/subscriptions/', { params }),
  getById: (id) => apiClient.get(`/subscriptions/${id}/`),
  create: (data) => apiClient.post('/subscriptions/', data),
  update: (id, data) => apiClient.put(`/subscriptions/${id}/`, data),
  delete: (id) => apiClient.delete(`/subscriptions/${id}/`),
  getActive: () => apiClient.get('/subscriptions/active_subscriptions/'),
  getMostPopular: () => apiClient.get('/subscriptions/most_popular/'),
};

// ======================== CUSTOMER SERVICE ========================
export const customerService = {
  getAll: (params = {}) => apiClient.get('/customers/', { params }),
  getById: (id) => apiClient.get(`/customers/${id}/`),
  create: (data) => apiClient.post('/customers/', data),
  update: (id, data) => apiClient.put(`/customers/${id}/`, data),
  delete: (id) => apiClient.delete(`/customers/${id}/`),
  getActive: () => apiClient.get('/customers/active_customers/'),
  getVerified: () => apiClient.get('/customers/verified_customers/'),
};

// ======================== PRODUCT SERVICE ========================
export const productService = {
  getAll: (params = {}) => apiClient.get('/products/', { params }),
  getById: (id) => apiClient.get(`/products/${id}/`),
  create: (data) => apiClient.post('/products/', data),
  update: (id, data) => apiClient.put(`/products/${id}/`, data),
  delete: (id) => apiClient.delete(`/products/${id}/`),
  getFeatured: () => apiClient.get('/products/featured_products/'),
  getByCategory: (categoryId) => apiClient.get('/products/', { params: { category: categoryId } }),
};

export default apiClient;
