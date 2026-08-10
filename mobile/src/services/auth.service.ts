import { apiClient } from './api.client';
import type { ApiResponse, LoginResponse, User } from '../types';

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
    email,
    password,
  });

  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Login failed');
  }

  return data.data;
}

export async function signupBuildingAdmin(payload: {
  name: string;
  email: string;
  password: string;
  buildingName: string;
  phone?: string;
}): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/signup', payload);

  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Signup failed');
  }

  return data.data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
  if (!data.success || !data.data?.user) {
    throw new Error(data.message ?? 'Failed to load profile');
  }
  return data.data.user;
}
