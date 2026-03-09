import axios from 'axios';

// Configure via CRA env var in production: REACT_APP_API_BASE_URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const DEVELOPER_TOKEN_KEY = 'mm_developer_token';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const developerApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

const getDeveloperToken = () => {
  try {
    return window.sessionStorage.getItem(DEVELOPER_TOKEN_KEY) || '';
  } catch (_error) {
    return '';
  }
};

const setDeveloperToken = (token) => {
  try {
    if (token) {
      window.sessionStorage.setItem(DEVELOPER_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(DEVELOPER_TOKEN_KEY);
    }
  } catch (_error) {
    // ignore storage failures
  }
};

const clearDeveloperToken = () => setDeveloperToken('');

developerApiClient.interceptors.request.use((config) => {
  const token = getDeveloperToken();
  const nextConfig = { ...config };
  nextConfig.headers = {
    ...(config.headers || {}),
  };
  if (token) {
    nextConfig.headers['X-Developer-Token'] = token;
  }
  return nextConfig;
});

// ======================== AUTH SERVICE ========================
export const authService = {
  signup: (data) => apiClient.post('/auth/signup/', data),
  login: (data) => apiClient.post('/auth/login/', data),
  me: () => apiClient.get('/auth/me/'),
  logout: () => apiClient.post('/auth/logout/'),
};

export const developerAuthService = {
  login: async (data) => {
    const response = await developerApiClient.post('/developer/auth/login/', data);
    setDeveloperToken(response?.data?.developer_token || '');
    return response;
  },
  me: () => developerApiClient.get('/developer/auth/me/'),
  logout: async () => {
    clearDeveloperToken();
    return Promise.resolve({ data: { message: 'Developer logout successful' } });
  },
  clearToken: clearDeveloperToken,
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
  getNotifications: (customerId, options = {}) => apiClient.get('/user/notifications/', {
    params: { customer_id: customerId, ...options },
  }),
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
  changePassword: (data) => apiClient.post('/auth/admin/change-password/', data),
  getActive: () => apiClient.get('/admins/active_admins/'),
  deactivate: (id) => apiClient.post(`/admins/${id}/deactivate/`),
  getSubscriptionDeliveries: (params = {}) => apiClient.get('/deliveries/', { params }),
  markSubscriptionDeliveryPacked: (id) => apiClient.post(`/deliveries/${id}/mark_packed/`),
  markSubscriptionDeliveryOutForDelivery: (id) => apiClient.post(`/deliveries/${id}/mark_out_for_delivery/`),
  markSubscriptionDeliveryDelivered: (id) => apiClient.post(`/deliveries/${id}/mark_delivered/`),
  markSubscriptionDeliveryMissed: (id) => apiClient.post(`/deliveries/${id}/mark_missed/`),
  getOrderDeliveries: (params = {}) => apiClient.get('/admin-orders/', { params }),
  markOrderConfirmed: (id) => apiClient.post(`/admin-orders/${id}/mark_confirmed/`),
  markOrderPacked: (id) => apiClient.post(`/admin-orders/${id}/mark_packed/`),
  markOrderOutForDelivery: (id) => apiClient.post(`/admin-orders/${id}/mark_out_for_delivery/`),
  markOrderDelivered: (id) => apiClient.post(`/admin-orders/${id}/mark_delivered/`),
};

export const developerService = {
  listAdminApplications: (status = 'pending') => developerApiClient.get('/developer/admin-applications/', { params: { status } }),
  approveAdminApplication: (applicationId, note = '') => developerApiClient.post(`/developer/admin-applications/${applicationId}/approve/`, { note }),
  rejectAdminApplication: (applicationId, note = '') => developerApiClient.post(`/developer/admin-applications/${applicationId}/reject/`, { note }),
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
  deleteAnyway: (id) => apiClient.post(`/products/${id}/delete_anyway/`),
  getFeatured: () => apiClient.get('/products/featured_products/'),
  getByCategory: (categoryId) => apiClient.get('/products/', { params: { category: categoryId } }),
};

export default apiClient;
