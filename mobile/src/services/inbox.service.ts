import { apiClient } from './api.client';
import type {
  ApiResponse,
  InboxChatMessage,
  InboxDirectoryResponse,
  InboxThread,
  InboxThreadDetail,
} from '../types';

export async function fetchInboxDirectory(buildingId?: string): Promise<InboxDirectoryResponse> {
  const { data } = await apiClient.get<ApiResponse<InboxDirectoryResponse>>('/inbox/directory', {
    params: { buildingId: buildingId || undefined },
  });
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load inbox');
  }
  return data.data;
}

export async function openInboxThread(userId: string): Promise<InboxThreadDetail> {
  const { data } = await apiClient.post<ApiResponse<InboxThreadDetail>>('/inbox/threads', { userId });
  if (!data.success || !data.data?.thread) {
    throw new Error(data.message ?? 'Failed to open conversation');
  }
  return data.data;
}

export async function fetchInboxThread(threadId: string): Promise<InboxThreadDetail> {
  const { data } = await apiClient.get<ApiResponse<InboxThreadDetail>>(`/inbox/threads/${threadId}`);
  if (!data.success || !data.data?.thread) {
    throw new Error(data.message ?? 'Failed to load conversation');
  }
  return data.data;
}

export async function sendInboxMessage(
  threadId: string,
  text: string,
): Promise<{ message: InboxChatMessage; thread: InboxThread }> {
  const { data } = await apiClient.post<ApiResponse<{ message: InboxChatMessage; thread: InboxThread }>>(
    `/inbox/threads/${threadId}/messages`,
    { text },
  );
  if (!data.success || !data.data?.message || !data.data.thread) {
    throw new Error(data.message ?? 'Failed to send message');
  }
  return data.data;
}
