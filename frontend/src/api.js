import axios from 'axios';

const getBaseURL = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`;
  }

  // In development, use relative /api (vite will proxy to localhost:5000)
  if (import.meta.env.DEV) {
    return '/api';
  }

  // In production, use the Railway URL
  return 'https://accounting-app-production-20ce.up.railway.app/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
