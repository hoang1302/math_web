import axios from 'axios';
import { resolveApiUrl, getStaticBaseUrl } from './apiUrl';
import { clearSession, SESSION_EXPIRED_EVENT } from './session';

const API_URL = resolveApiUrl(import.meta.env.VITE_API_URL);
export const getBaseUrl = () => getStaticBaseUrl(API_URL);

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = /^\/auth\/(login|register)$/.test(error.config?.url || '');
    if (error.response?.status === 401 && !isAuthRequest && error.config?.headers?.Authorization) {
      clearSession(localStorage);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default api;
