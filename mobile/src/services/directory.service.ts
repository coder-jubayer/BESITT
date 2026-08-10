import { apiClient } from './api.client';
import type { ApiResponse, DirectoryContact, DirectoryListResponse, DirectoryType } from '../types';

export async function fetchDirectory(buildingId?: string): Promise<DirectoryListResponse> {
  const { data } = await apiClient.get<ApiResponse<DirectoryListResponse>>('/directory', {
    params: buildingId ? { buildingId } : undefined,
  });
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load directory');
  }
  return data.data;
}

export async function createDirectoryContact(payload: {
  type: DirectoryType;
  name: string;
  phone: string;
  note?: string;
  buildingId?: string;
}): Promise<DirectoryContact> {
  const { data } = await apiClient.post<ApiResponse<{ contact: DirectoryContact }>>('/directory', payload);
  if (!data.success || !data.data?.contact) {
    throw new Error(data.message ?? 'Failed to add contact');
  }
  return data.data.contact;
}

export async function deleteDirectoryContact(id: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse>(`/directory/${id}`);
  if (!data.success) {
    throw new Error(data.message ?? 'Failed to delete contact');
  }
}
