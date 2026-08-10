import { apiClient, getAuthToken } from './api.client';
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

export async function updateMyProfile(payload: {
  name?: string;
  phone?: string;
  unitNumber?: string;
  password?: string;
  currentPassword?: string;
  avatar?: { uri: string; name?: string; type?: string } | null;
}): Promise<User> {
  const form = new FormData();
  if (payload.name !== undefined) form.append('name', payload.name);
  if (payload.phone !== undefined) form.append('phone', payload.phone);
  if (payload.unitNumber !== undefined) form.append('unitNumber', payload.unitNumber);
  if (payload.password) form.append('password', payload.password);
  if (payload.currentPassword) form.append('currentPassword', payload.currentPassword);
  if (payload.avatar) {
    form.append('avatar', {
      uri: payload.avatar.uri,
      name: payload.avatar.name || 'avatar.jpg',
      type: payload.avatar.type || 'image/jpeg',
    } as unknown as Blob);
  }

  const { data } = await apiClient.patch<ApiResponse<{ user: User }>>('/auth/me', form, {
    headers: {
      Authorization: getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });
  if (!data.success || !data.data?.user) {
    throw new Error(data.message ?? 'Failed to update profile');
  }
  return data.data.user;
}
