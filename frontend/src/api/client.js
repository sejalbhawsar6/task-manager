import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL, timeout: 70000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // A 401 while we hold a token means the session is no longer valid.
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export const getErrorMessage = (err) => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The server is taking too long. Please try again.';
  if (err?.request && !err?.response) return 'Cannot reach the server. Check your connection.';
  return 'Something went wrong. Please try again.';
};

export default api;
