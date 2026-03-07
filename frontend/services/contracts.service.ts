import api from '@/lib/api';
import { Contract } from '@/types';

export const contractsService = {
  async getAll(params?: { search?: string }) {
    const response = await api.get('/contracts', { params });
    return response.data;
  },

  async getById(id: string): Promise<Contract> {
    const response = await api.get(`/contracts/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Contract> {
    const response = await api.post('/contracts', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Contract> {
    const response = await api.put(`/contracts/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/contracts/${id}`);
  },
};
