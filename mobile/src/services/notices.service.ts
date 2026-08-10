import { apiClient } from './api.client';
import type { ApiResponse, Notice, NoticesListResponse } from '../types';

export async function fetchNotices(): Promise<NoticesListResponse> {
  const { data } = await apiClient.get<ApiResponse<NoticesListResponse>>('/notices');
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load notices');
  }
  return data.data;
}

export async function createNotice(payload: {
  title: string;
  content: string;
  buildingId?: string;
}): Promise<Notice> {
  const { data } = await apiClient.post<ApiResponse<{ notice: Notice }>>('/notices', payload);
  if (!data.success || !data.data?.notice) {
    throw new Error(data.message ?? 'Failed to post notice');
  }
  return data.data.notice;
}

export async function markNoticesRead(noticeIds?: string[]): Promise<void> {
  const { data } = await apiClient.post<ApiResponse>('/notices/read', {
    noticeIds,
  });
  if (!data.success) {
    throw new Error(data.message ?? 'Failed to mark notices read');
  }
}

export async function deleteNotice(id: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse>(`/notices/${id}`);
  if (!data.success) {
    throw new Error(data.message ?? 'Failed to delete notice');
  }
}
