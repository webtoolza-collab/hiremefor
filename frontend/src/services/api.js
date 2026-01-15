import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const workerToken = localStorage.getItem('workerToken');
  const adminToken = localStorage.getItem('adminToken');

  if (workerToken && config.url.includes('/worker')) {
    config.headers.Authorization = `Bearer ${workerToken}`;
  } else if (adminToken && config.url.includes('/admin')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }

  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect based on URL
      if (window.location.pathname.startsWith('/worker')) {
        localStorage.removeItem('workerToken');
        window.location.href = '/worker/login';
      } else if (window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  requestOTP: (phone_number) => api.post('/auth/request-otp', { phone_number }),
  verifyOTP: (phone_number, code) => api.post('/auth/verify-otp', { phone_number, code }),
  createPIN: (phone_number, pin) => api.post('/auth/create-pin', { phone_number, pin }),
  login: (phone_number, pin) => api.post('/auth/login', { phone_number, pin }),
  logout: () => api.post('/auth/logout'),
  resetPINRequest: (phone_number) => api.post('/auth/reset-pin-request', { phone_number }),
  resetPIN: (phone_number, code, new_pin) => api.post('/auth/reset-pin', { phone_number, code, new_pin })
};

// Worker API
export const workerAPI = {
  getProfile: () => api.get('/worker/profile'),
  updateProfile: (data) => api.put('/worker/profile', data),
  uploadPhoto: (formData) => api.post('/worker/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProfile: () => api.delete('/worker/profile'),
  getSkills: () => api.get('/worker/skills'),
  addSkills: (skills) => api.post('/worker/skills', { skills }),
  updateSkill: (id, years_experience) => api.put(`/worker/skills/${id}`, { years_experience }),
  removeSkill: (id) => api.delete(`/worker/skills/${id}`),
  getRatings: () => api.get('/worker/ratings'),
  getPendingRatings: () => api.get('/worker/ratings/pending'),
  acceptRating: (id) => api.put(`/worker/ratings/${id}/accept`),
  rejectRating: (id) => api.delete(`/worker/ratings/${id}`),
  getStats: () => api.get('/worker/stats'),
  register: (data) => api.post('/worker/register', data)
};

// Search API
export const searchAPI = {
  searchWorkers: (params) => api.get('/search/workers', { params }),
  getWorker: (id) => api.get(`/search/${id}`),
  rateWorker: (id, stars, comment) => api.post(`/search/${id}/rate`, { stars, comment })
};

// Autocomplete API
export const autocompleteAPI = {
  getSkills: () => api.get('/skills'),
  searchSkills: (q) => api.get('/skills/search', { params: { q } }),
  getAreas: () => api.get('/areas'),
  searchAreas: (q) => api.get('/areas/search', { params: { q } })
};

// Admin API
export const adminAPI = {
  login: (username, password) => api.post('/admin/login', { username, password }),
  logout: () => api.post('/admin/logout'),
  getDashboard: () => api.get('/admin/dashboard'),
  getWorkers: (params) => api.get('/admin/workers', { params }),
  getWorker: (id) => api.get(`/admin/workers/${id}`),
  removeWorker: (id) => api.delete(`/admin/workers/${id}`),
  getSkills: () => api.get('/admin/skills'),
  addSkill: (name) => api.post('/admin/skills', { name }),
  updateSkill: (id, name) => api.put(`/admin/skills/${id}`, { name }),
  deleteSkill: (id) => api.delete(`/admin/skills/${id}`),
  getAreas: () => api.get('/admin/areas'),
  addArea: (name, province) => api.post('/admin/areas', { name, province }),
  updateArea: (id, name, province) => api.put(`/admin/areas/${id}`, { name, province }),
  deleteArea: (id) => api.delete(`/admin/areas/${id}`),
  getRatings: (params) => api.get('/admin/ratings', { params })
};

export default api;
