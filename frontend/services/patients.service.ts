import api from '../lib/api';
import { Patient, DocumentType } from '@/types';

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  institutionId?: string;
}

export interface UpdatePatientDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
}

export const patientsService = {
  async getAll(search?: string): Promise<{ patients: Patient[]; total: number }> {
    const params = search ? { search } : {};
    const { data } = await api.get('/patients', { params });
    return data;
  },

  async getById(id: string): Promise<Patient> {
    const { data } = await api.get(`/patients/${id}`);
    return data;
  },

  async create(dto: CreatePatientDto): Promise<Patient> {
    const { data } = await api.post('/patients', dto);
    return data;
  },

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const { data } = await api.put(`/patients/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  },
};
