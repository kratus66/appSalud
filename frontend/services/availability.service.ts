import api from '../lib/api';
import {
  DoctorSchedule,
  TimeBlock,
  RecurringAppointment,
  AvailabilityResponse,
  CreateScheduleDto,
  CreateBlockDto,
  CreateRecurringAppointmentDto,
} from '@/types';

export const availabilityService = {
  // ─── Schedules ────────────────────────────────────────────────

  async createOrUpdateSchedule(dto: CreateScheduleDto): Promise<DoctorSchedule> {
    const { data } = await api.post('/availability/schedule', dto);
    return data;
  },

  async getScheduleByDoctor(doctorId: string): Promise<DoctorSchedule[]> {
    const { data } = await api.get(`/availability/schedule/${doctorId}`);
    return data;
  },

  async deleteSchedule(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/availability/schedule/${id}`);
    return data;
  },

  // ─── Time Blocks ──────────────────────────────────────────────

  async createBlock(dto: CreateBlockDto): Promise<TimeBlock> {
    const { data } = await api.post('/availability/block', dto);
    return data;
  },

  async getBlocksByDoctor(doctorId: string, from?: string): Promise<TimeBlock[]> {
    const { data } = await api.get(`/availability/block/${doctorId}`, {
      params: from ? { from } : undefined,
    });
    return data;
  },

  async deleteBlock(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/availability/block/${id}`);
    return data;
  },

  // ─── Availability Slots ───────────────────────────────────────

  async getSlots(doctorId: string, date: string): Promise<AvailabilityResponse> {
    const { data } = await api.get(`/availability/slots/${doctorId}`, { params: { date } });
    return data;
  },

  // ─── Recurring Appointments ───────────────────────────────────

  async createRecurring(dto: CreateRecurringAppointmentDto): Promise<{
    recurring: RecurringAppointment;
    generatedAppointments: any[];
  }> {
    const { data } = await api.post('/availability/recurring', dto);
    return data;
  },

  async getRecurringByDoctor(doctorId: string): Promise<RecurringAppointment[]> {
    const { data } = await api.get(`/availability/recurring/${doctorId}`);
    return data;
  },

  async cancelRecurring(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/availability/recurring/${id}`);
    return data;
  },
};
