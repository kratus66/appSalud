import api from '@/lib/api';
import { User, Stats } from '@/types';

export const usersService = {
  async getAll(params?: { role?: string; search?: string }) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/users', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async getStats(): Promise<Stats> {
    const response = await api.get('/users/stats');
    return response.data;
  },
};
