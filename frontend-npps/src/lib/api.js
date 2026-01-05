import axios from 'axios';

// ✅ Base URL - ให้ใช้ env จาก Vercel ถ้าอยู่ใน Production
const api = axios.create({
  baseURL: import.meta.env.DEV
    ? 'http://localhost:4000/api'
    : (import.meta.env.VITE_API_BASE
        ? import.meta.env.VITE_API_BASE + '/api'
        : 'https://testfrontenddev-production.up.railway.app/api'),
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default api;
