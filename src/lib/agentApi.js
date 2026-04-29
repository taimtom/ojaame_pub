import axios from 'axios';

export const AGENT_TOKEN_KEY = 'agent_access_token';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

export const agentApi = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

agentApi.interceptors.request.use((config) => {
  const t = localStorage.getItem(AGENT_TOKEN_KEY);
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

agentApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem(AGENT_TOKEN_KEY);
      if (!window.location.pathname.startsWith('/agent/login')) {
        window.location.href = '/agent/login';
      }
    }
    return Promise.reject(err);
  }
);
