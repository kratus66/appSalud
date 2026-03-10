import api from '@/lib/api';

export const analyticsService = {
  getOverview: () =>
    api.get('/analytics/overview').then((r) => r.data),

  getByStatus: () =>
    api.get('/analytics/appointments/by-status').then((r) => r.data),

  getByPeriod: (period: 'week' | 'month' | 'year' = 'month') =>
    api.get(`/analytics/appointments/by-period?period=${period}`).then((r) => r.data),

  getTopDoctors: (limit = 10) =>
    api.get(`/analytics/doctors/top?limit=${limit}`).then((r) => r.data),

  getPatientStats: () =>
    api.get('/analytics/patients/stats').then((r) => r.data),

  getBySpecialty: () =>
    api.get('/analytics/appointments/by-specialty').then((r) => r.data),

  getHourly: () =>
    api.get('/analytics/appointments/hourly').then((r) => r.data),
};
