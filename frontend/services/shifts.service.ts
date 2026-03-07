import api from '@/lib/api';
import { Shift } from '@/types';

export const shiftsService = {
  async getAll(params?: { search?: string; isActive?: boolean }) {
    const response = await api.get('/shifts', { params });
    return response.data.shifts || [];
  },

  async getById(id: string): Promise<Shift> {
    const response = await api.get(`/shifts/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Shift> {
    const response = await api.post('/shifts', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Shift> {
    const response = await api.put(`/shifts/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/shifts/${id}`);
  },
};
