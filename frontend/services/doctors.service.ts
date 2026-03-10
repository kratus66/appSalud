import api from '../lib/api';
import type { Doctor, CreateDoctorDto, UpdateDoctorDto } from '../types';

export const doctorsService = {
  async getAll(params?: {
    search?: string;
    specialtyId?: string;
    includeInactive?: boolean;
  }): Promise<{ doctors: Doctor[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.specialtyId) query.set('specialtyId', params.specialtyId);
    if (params?.includeInactive) query.set('includeInactive', 'true');
    const res = await api.get(`/doctors${query.size ? '?' + query : ''}`);
    return res.data;
  },

  async getById(id: string): Promise<Doctor> {
    const res = await api.get(`/doctors/${id}`);
    return res.data;
  },

  async create(dto: CreateDoctorDto): Promise<Doctor> {
    const res = await api.post('/doctors', dto);
    return res.data;
  },

  async update(id: string, dto: UpdateDoctorDto): Promise<Doctor> {
    const res = await api.put(`/doctors/${id}`, dto);
    return res.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const res = await api.delete(`/doctors/${id}`);
    return res.data;
  },
};
