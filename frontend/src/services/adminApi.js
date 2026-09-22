/**
 * Admin API service — thin wrapper around the base api client.
 * All calls require the current user to have is_admin = true.
 */
import { api } from './api';

export const adminApi = {
  // ── Identity ──────────────────────────────────────────────────────────
  me: () => api.get('/admin/me'),

  // ── Stats ─────────────────────────────────────────────────────────────
  getStats: () => api.get('/admin/stats'),

  // ── Growth chart ──────────────────────────────────────────────────────
  getGrowth: (days = 30) => api.get('/admin/growth', { days }),

  // ── Activity chart ────────────────────────────────────────────────────
  getActivity: (days = 14) => api.get('/admin/activity', { days }),

  // ── Users ─────────────────────────────────────────────────────────────
  listUsers: (params = {}) => api.get('/admin/users', params),
  getUser:   (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  resetPassword: (id, newPassword) =>
    api.post(`/admin/users/${id}/reset-password`, { new_password: newPassword }),

  // ── User activity ─────────────────────────────────────────────────────
  getUserActivity: (id, days = 30) =>
    api.get(`/admin/users/${id}/activity`, { days }),

  // ── Broadcast ─────────────────────────────────────────────────────────
  broadcast: (title, message, userId = null) =>
    api.post('/admin/broadcast', { title, message, user_id: userId }),
};
