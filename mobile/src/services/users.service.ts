import { apiClient } from './api.client';
import type { ApiResponse, User, UserRole, UsersListResponse } from '../types';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  unitNumber?: string;
  buildingId?: string;
  buildingName?: string;
}

export async function fetchUsers(): Promise<UsersListResponse> {
  const { data } = await apiClient.get<ApiResponse<UsersListResponse>>('/users');
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load users');
  }
  return data.data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await apiClient.post<ApiResponse<{ user: User }>>('/users', payload);
  if (!data.success || !data.data?.user) {
    throw new Error(data.message ?? 'Failed to create user');
  }
  return data.data.user;
}

export async function setUserActive(userId: string, isActive: boolean): Promise<User> {
  const { data } = await apiClient.patch<ApiResponse<{ user: User }>>(`/users/${userId}/status`, {
    isActive,
  });
  if (!data.success || !data.data?.user) {
    throw new Error(data.message ?? 'Failed to update user status');
  }
  return data.data.user;
}

export async function deleteUser(userId: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse>(`/users/${userId}`);
  if (!data.success) {
    throw new Error(data.message ?? 'Failed to delete user');
  }
}
