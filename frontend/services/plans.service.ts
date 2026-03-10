import api from '@/lib/api';
import { SubscriptionPlan } from '@/types';

export const plansService = {
  async getAll(): Promise<SubscriptionPlan[]> {
    const { data } = await api.get('/plans');
    return data;
  },

  async getOne(id: string): Promise<SubscriptionPlan> {
    const { data } = await api.get(`/plans/${id}`);
    return data;
  },

  async create(payload: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const { data } = await api.post('/plans', payload);
    return data;
  },

  async update(id: string, payload: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const { data } = await api.put(`/plans/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/plans/${id}`);
  },
};
