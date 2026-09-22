import { apiClient, getAuthToken } from './api.client';
import type { ApiResponse, Building, LoginResponse, User } from '../types';

export async function loginRequest(identifier: string, password: string): Promise<LoginResponse> {
  const trimmed = identifier.trim();
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
    identifier: trimmed,
    // Keep email for older API builds that only read this field.
    email: trimmed.includes('@') ? trimmed.toLowerCase() : undefined,
    phone: trimmed.includes('@') ? undefined : trimmed,
    password,
  });

  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Login failed');
  }

  return data.data;
}

export async function signupResident(payload: {
  buildingCode: string;
  name: string;
  unitNumber: string;
  phone: string;
  password: string;
  email?: string;
}): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/signup/resident',
    payload,
  );

  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Signup failed');
  }

  return data.data;
}

export async function lookupBuildingCode(code: string): Promise<Building> {
  const { data } = await apiClient.get<ApiResponse<{ building: Building }>>(
    `/auth/building-code/${encodeURIComponent(code)}`,
  );

  if (!data.success || !data.data?.building) {
    throw new Error(data.message ?? 'No building found for that code');
  }

  return data.data.building;
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
