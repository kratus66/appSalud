import { api } from '../lib/api';
import type {
  WorkSchedule,
  CreateScheduleDto,
  BulkAssignDto,
  ShiftAssignment,
  ScheduleViolation,
  ScheduleSummary,
  ValidationResult,
  PeakHourConfig,
  GenerateScheduleDto,
  MarkAbsenceDto,
} from '../types/schedule.types';

const BASE = '/schedules';

export const schedulesService = {
  // ─── CRUD ────────────────────────────────────────────────────────────────

  getAll: async (): Promise<WorkSchedule[]> => {
    const { data } = await api.get<WorkSchedule[]>(BASE);
    return data;
  },

  getById: async (id: string): Promise<WorkSchedule> => {
    const { data } = await api.get<WorkSchedule>(`${BASE}/${id}`);
    return data;
  },

  create: async (dto: CreateScheduleDto): Promise<WorkSchedule> => {
    const { data } = await api.post<WorkSchedule>(BASE, dto);
    return data;
  },

  update: async (id: string, dto: Partial<CreateScheduleDto>): Promise<WorkSchedule> => {
    const { data } = await api.put<WorkSchedule>(`${BASE}/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  // ─── ASSIGNMENTS ─────────────────────────────────────────────────────────

  bulkAssign: async (
    scheduleId: string,
    dto: BulkAssignDto,
  ): Promise<{ created: number; assignments: ShiftAssignment[] }> => {
    const { data } = await api.post(`${BASE}/${scheduleId}/assignments/bulk`, {
      scheduleId,
      ...dto,
    });
    return data;
  },

  updateAssignment: async (
    scheduleId: string,
    assignmentId: string,
    dto: { shiftType: string; notes?: string },
  ): Promise<ShiftAssignment> => {
    const { data } = await api.put(
      `${BASE}/${scheduleId}/assignments/${assignmentId}`,
      dto,
    );
    return data;
  },

  deleteAssignment: async (scheduleId: string, assignmentId: string): Promise<void> => {
    await api.delete(`${BASE}/${scheduleId}/assignments/${assignmentId}`);
  },

  // ─── WORKFLOW ─────────────────────────────────────────────────────────────

  validate: async (id: string): Promise<ValidationResult> => {
    const { data } = await api.post<ValidationResult>(`${BASE}/${id}/validate`);
    return data;
  },

  submit: async (id: string): Promise<WorkSchedule> => {
    const { data } = await api.post<WorkSchedule>(`${BASE}/${id}/submit`);
    return data;
  },

  approve: async (id: string): Promise<WorkSchedule> => {
    const { data } = await api.post<WorkSchedule>(`${BASE}/${id}/approve`);
    return data;
  },

  reject: async (id: string, reason: string): Promise<WorkSchedule> => {
    const { data } = await api.post<WorkSchedule>(`${BASE}/${id}/reject`, { reason });
    return data;
  },


  // ─── QUERIES ──────────────────────────────────────────────────────────────

  getViolations: async (id: string): Promise<ScheduleViolation[]> => {
    const { data } = await api.get<ScheduleViolation[]>(`${BASE}/${id}/violations`);
    return data;
  },

  getSummary: async (id: string): Promise<ScheduleSummary> => {
    const { data } = await api.get<ScheduleSummary>(`${BASE}/${id}/summary`);
    return data;
  },

  // ─── GENERATE ─────────────────────────────────────────────────────────────

  generate: async (
    scheduleId: string,
    dto: GenerateScheduleDto,
  ): Promise<{ generated: number; workers: number }> => {
    const { data } = await api.post(`${BASE}/${scheduleId}/generate`, dto);
    return data;
  },

  // ─── ABSENCES ─────────────────────────────────────────────────────────────

  markAbsence: async (
    scheduleId: string,
    assignmentId: string,
    dto: MarkAbsenceDto,
  ): Promise<ShiftAssignment> => {
    const { data } = await api.put(
      `${BASE}/${scheduleId}/assignments/${assignmentId}/absence`,
      dto,
    );
    return data;
  },

  removeAbsence: async (scheduleId: string, assignmentId: string): Promise<ShiftAssignment> => {
    const { data } = await api.delete(
      `${BASE}/${scheduleId}/assignments/${assignmentId}/absence`,
    );
    return data;
  },

  // ─── PEAK HOURS ───────────────────────────────────────────────────────────

  getPeakHours: async (serviceId?: string): Promise<PeakHourConfig[]> => {
    const { data } = await api.get<PeakHourConfig[]>(`${BASE}/peak-hours`, {
      params: serviceId ? { serviceId } : {},
    });
    return data;
  },

  createPeakHour: async (dto: Partial<PeakHourConfig>): Promise<PeakHourConfig> => {
    const { data } = await api.post<PeakHourConfig>(`${BASE}/peak-hours`, dto);
    return data;
  },

  updatePeakHour: async (id: string, dto: Partial<PeakHourConfig>): Promise<PeakHourConfig> => {
    const { data } = await api.put<PeakHourConfig>(`${BASE}/peak-hours/${id}`, dto);
    return data;
  },

  deletePeakHour: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/peak-hours/${id}`);
  },
};
