import api from '@/lib/api';
import { Service } from '@/types';

export const servicesService = {
  async getAll(params?: { search?: string; isActive?: boolean }) {
    const response = await api.get('/services', { params });
    return response.data.services || [];
  },

  async getById(id: string): Promise<Service> {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Service> {
    const response = await api.post('/services', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Service> {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/services/${id}`);
  },
};
