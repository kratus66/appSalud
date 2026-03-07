import api from '../lib/api';
import { Appointment, AppointmentStatus } from '@/types';

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface UpdateAppointmentDto {
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface AppointmentFilters {
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  patientId?: string;
  status?: AppointmentStatus;
}

export const appointmentsService = {
  async getAll(filters?: AppointmentFilters): Promise<{ appointments: Appointment[]; total: number }> {
    const { data } = await api.get('/appointments', { params: filters });
    return data;
  },

  async getById(id: string): Promise<Appointment> {
    const { data } = await api.get(`/appointments/${id}`);
    return data;
  },

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const { data } = await api.post('/appointments', dto);
    return data;
  },

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const { data } = await api.put(`/appointments/${id}`, dto);
    return data;
  },

  async cancel(id: string): Promise<Appointment> {
    const { data } = await api.patch(`/appointments/${id}/cancel`);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },

  async getDoctorAvailability(doctorId: string, date: string): Promise<Appointment[]> {
    const { data } = await api.get(`/appointments/doctor/${doctorId}/availability`, {
      params: { date },
    });
    return data;
  },
};
