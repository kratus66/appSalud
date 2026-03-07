import api from '@/lib/api';
import { Institution, Stats } from '@/types';

export const institutionsService = {
  async getAll(params?: { status?: string; search?: string }) {
    const response = await api.get('/institutions', { params });
    return response.data;
  },

  async getById(id: string): Promise<Institution> {
    const response = await api.get(`/institutions/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Institution> {
    const response = await api.post('/institutions', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Institution> {
    const response = await api.put(`/institutions/${id}`, data);
    return response.data;
  },

  async suspend(id: string): Promise<Institution> {
    const response = await api.patch(`/institutions/${id}/suspend`);
    return response.data;
  },

  async getStats(): Promise<Stats> {
    const response = await api.get('/institutions/stats');
    return response.data;
  },
};
