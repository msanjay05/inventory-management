import axios from 'axios';
import { getStoredToken } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('inventory_token');
      localStorage.removeItem('inventory_admin');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg).join(', ');
    }
  }
  return error.message || 'An unexpected error occurred';
}

export const api = {
  auth: {
    login: (data) => client.post('/auth/login', data),
  },
  products: {
    list: (params) => client.get('/products', { params }),
    search: (query, params = {}) =>
      client.get('/products', { params: { search: query, page: 1, page_size: 20, ...params } }),
    get: (id) => client.get(`/products/${id}`),
    create: (data) => client.post('/products', data),
    update: (id, data) => client.put(`/products/${id}`, data),
    addStock: (id, quantity) => client.post(`/products/${id}/add-stock`, { quantity }),
    stockLogs: (id) => client.get(`/products/${id}/stock-logs`),
    delete: (id) => client.delete(`/products/${id}`),
  },
  customers: {
    list: (params) => client.get('/customers', { params }),
    search: (query, params = {}) =>
      client.get('/customers', { params: { search: query, page: 1, page_size: 20, ...params } }),
    get: (id) => client.get(`/customers/${id}`),
    create: (data) => client.post('/customers', data),
    delete: (id) => client.delete(`/customers/${id}`),
  },
  orders: {
    list: (params) => client.get('/orders', { params }),
    get: (id) => client.get(`/orders/${id}`),
    create: (data) => client.post('/orders', data),
    delete: (id) => client.delete(`/orders/${id}`),
  },
  dashboard: {
    summary: () => client.get('/dashboard/summary'),
  },
};

export default client;
