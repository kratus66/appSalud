import api from '@/lib/api';
import { Holiday } from '@/types';

export const holidaysService = {
  async getAll(params?: { year?: number; month?: number; countryCode?: string }) {
    const response = await api.get('/holidays', { params });
    return response.data;
  },

  async getById(id: string): Promise<Holiday> {
    const response = await api.get(`/holidays/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Holiday> {
    const response = await api.post('/holidays', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Holiday> {
    const response = await api.put(`/holidays/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/holidays/${id}`);
  },
};
