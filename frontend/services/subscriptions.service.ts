import api from '@/lib/api';
import { Subscription } from '@/types';

export const subscriptionsService = {
  async getAll(filters?: { institutionId?: string; status?: string }): Promise<Subscription[]> {
    const { data } = await api.get('/subscriptions', { params: filters });
    return data;
  },

  async getOne(id: string): Promise<Subscription> {
    const { data } = await api.get(`/subscriptions/${id}`);
    return data;
  },

  async create(payload: {
    institutionId: string;
    planId: string;
    startDate: string;
    endDate?: string;
    status?: string;
  }): Promise<Subscription> {
    const { data } = await api.post('/subscriptions', payload);
    return data;
  },

  async update(id: string, payload: Partial<Subscription>): Promise<Subscription> {
    const { data } = await api.put(`/subscriptions/${id}`, payload);
    return data;
  },

  async getMetrics(): Promise<{
    total: number;
    active: number;
    trial: number;
    cancelled: number;
    expired: number;
    monthlyRevenue: number;
  }> {
    const { data } = await api.get('/subscriptions/metrics');
    return data;
  },
};
