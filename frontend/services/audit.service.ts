import api from '@/lib/api';
import { AuditEvent } from '@/types';

export const auditService = {
  async getEvents(params?: { eventType?: string; limit?: number; offset?: number }) {
    const response = await api.get('/audit/events', { params });
    return response.data;
  },

  async getStats() {
    const response = await api.get('/audit/stats');
    return response.data;
  },
};
