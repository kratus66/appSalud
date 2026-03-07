import api from '@/lib/api';
import { LoginCredentials, LoginResponse, User } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refresh(): Promise<{ accessToken: string }> {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  async getMe(): Promise<{ user: User }> {
    const response = await api.post('/auth/me');
    return response.data;
  },
};
