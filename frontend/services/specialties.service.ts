import api from '../lib/api';
import type { Specialty, CreateSpecialtyDto, UpdateSpecialtyDto } from '../types';

export const specialtiesService = {
  async getAll(params?: {
    search?: string;
    includeInactive?: boolean;
  }): Promise<{ specialties: Specialty[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.includeInactive) query.set('includeInactive', 'true');
    const res = await api.get(`/specialties${query.size ? '?' + query : ''}`);
    return res.data;
  },

  async getById(id: string): Promise<Specialty> {
    const res = await api.get(`/specialties/${id}`);
    return res.data;
  },

  async create(dto: CreateSpecialtyDto): Promise<Specialty> {
    const res = await api.post('/specialties', dto);
    return res.data;
  },

  async update(id: string, dto: UpdateSpecialtyDto): Promise<Specialty> {
    const res = await api.put(`/specialties/${id}`, dto);
    return res.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const res = await api.delete(`/specialties/${id}`);
    return res.data;
  },
};
