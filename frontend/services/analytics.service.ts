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

// ─── Reports module endpoints ─────────────────────────────────────────────────

const dateQuery = (start?: string, end?: string) => {
  const params = new URLSearchParams();
  if (start) params.set('startDate', start);
  if (end) params.set('endDate', end);
  const q = params.toString();
  return q ? `?${q}` : '';
};

export const reportsService = {
  getOverview: () =>
    api.get('/reports/overview').then((r) => r.data),

  getAppointmentsByDay: (startDate?: string, endDate?: string) =>
    api.get(`/reports/appointments-by-day${dateQuery(startDate, endDate)}`).then((r) => r.data),

  getAppointmentsByDoctor: (startDate?: string, endDate?: string) =>
    api.get(`/reports/appointments-by-doctor${dateQuery(startDate, endDate)}`).then((r) => r.data),

  getPatientsAttended: (startDate?: string, endDate?: string) =>
    api.get(`/reports/patients-attended${dateQuery(startDate, endDate)}`).then((r) => r.data),

  getTable: (startDate?: string, endDate?: string) =>
    api.get(`/reports/table${dateQuery(startDate, endDate)}`).then((r) => r.data),

  getExportUrl: (
    type: 'appointments' | 'patients' | 'doctors',
    startDate?: string,
    endDate?: string,
  ): string => {
    const params = new URLSearchParams({ type });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const base = (api.defaults.baseURL ?? '').replace(/\/$/, '');
    return `${base}/reports/export?${params.toString()}`;
  },
};
