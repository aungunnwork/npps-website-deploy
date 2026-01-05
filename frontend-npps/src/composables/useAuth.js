// frontend-npps/src/composables/useAuth.js
import { reactive, computed } from 'vue';
import api from '../lib/api';

const state = reactive({
  token: localStorage.getItem('token') || '',
  role: localStorage.getItem('role') || '',
  user_id: Number(localStorage.getItem('user_id') || 0),
  loading: false,
  error: '',
});

export function useAuth() {
  const isLoggedIn = computed(() => !!state.token);
  const isAdmin = computed(() => state.role === 'admin');

  async function login({ email, password }) {
    state.loading = true; state.error = '';
    try {
      const { data } = await api.post('/auth/login', { email, password });
      state.token = data.token;
      state.role = data.role;
      state.user_id = data.user_id;

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user_id', String(data.user_id));

      return { ok: true, role: data.role };
    } catch (e) {
      state.error = e?.response?.data?.message || 'Login failed';
      return { ok: false };
    } finally {
      state.loading = false;
    }
  }

  function logout() {
    state.token = ''; state.role = ''; state.user_id = 0;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
  }

  return { state, isLoggedIn, isAdmin, login, logout };
}
