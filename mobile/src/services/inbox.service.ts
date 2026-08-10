import { apiClient, getAuthToken } from './api.client';
import type {
  ApiResponse,
  InboxChatMessage,
  InboxDirectoryResponse,
  InboxGroup,
  InboxGroupDetail,
  InboxGroupMessage,
  InboxThread,
  InboxThreadDetail,
} from '../types';

export async function fetchInboxDirectory(buildingId?: string): Promise<InboxDirectoryResponse> {
  const { data } = await apiClient.get<ApiResponse<InboxDirectoryResponse>>('/inbox/directory', {
    params: { buildingId: buildingId || undefined },
  });
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load people');
  }
  return data.data;
}

export async function fetchInboxThreads(): Promise<InboxThread[]> {
  const { data } = await apiClient.get<ApiResponse<{ threads: InboxThread[] }>>('/inbox/threads');
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load inbox');
  }
  return data.data.threads;
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
  image?: { uri: string; name?: string; type?: string },
): Promise<{ message: InboxChatMessage; thread: InboxThread }> {
  const form = new FormData();
  if (text.trim()) form.append('text', text.trim());
  if (image) {
    form.append('image', {
      uri: image.uri,
      name: image.name || 'photo.jpg',
      type: image.type || 'image/jpeg',
    } as unknown as Blob);
  }
  const { data } = await apiClient.post<ApiResponse<{ message: InboxChatMessage; thread: InboxThread }>>(
    `/inbox/threads/${threadId}/messages`,
    form,
    {
      headers: {
        Authorization: getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    },
  );
  if (!data.success || !data.data?.message || !data.data.thread) {
    throw new Error(data.message ?? 'Failed to send message');
  }
  return data.data;
}

export async function fetchInboxGroups(): Promise<InboxGroup[]> {
  const { data } = await apiClient.get<ApiResponse<{ groups: InboxGroup[] }>>('/inbox/groups');
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load groups');
  }
  return data.data.groups;
}

export async function createInboxGroup(name: string, memberIds: string[]): Promise<InboxGroupDetail> {
  const { data } = await apiClient.post<ApiResponse<InboxGroupDetail>>('/inbox/groups', { name, memberIds });
  if (!data.success || !data.data?.group) {
    throw new Error(data.message ?? 'Failed to create group');
  }
  return data.data;
}

export async function fetchInboxGroup(groupId: string): Promise<InboxGroupDetail> {
  const { data } = await apiClient.get<ApiResponse<InboxGroupDetail>>(`/inbox/groups/${groupId}`);
  if (!data.success || !data.data?.group) {
    throw new Error(data.message ?? 'Failed to load group');
  }
  return data.data;
}

export async function renameInboxGroup(groupId: string, name: string): Promise<InboxGroup> {
  const { data } = await apiClient.patch<ApiResponse<{ group: InboxGroup }>>(`/inbox/groups/${groupId}`, { name });
  if (!data.success || !data.data?.group) {
    throw new Error(data.message ?? 'Failed to rename group');
  }
  return data.data.group;
}

export async function uploadInboxGroupPhoto(
  groupId: string,
  photo: { uri: string; name?: string; type?: string },
): Promise<InboxGroup> {
  const form = new FormData();
  form.append('photo', {
    uri: photo.uri,
    name: photo.name || 'group.jpg',
    type: photo.type || 'image/jpeg',
  } as unknown as Blob);

  const { data } = await apiClient.post<ApiResponse<{ group: InboxGroup }>>(`/inbox/groups/${groupId}/photo`, form, {
    headers: {
      Authorization: getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });
  if (!data.success || !data.data?.group) {
    throw new Error(data.message ?? 'Failed to update group photo');
  }
  return data.data.group;
}

export async function addInboxGroupMembers(groupId: string, memberIds: string[]): Promise<InboxGroup> {
  const { data } = await apiClient.post<ApiResponse<{ group: InboxGroup }>>(`/inbox/groups/${groupId}/members`, {
    memberIds,
  });
  if (!data.success || !data.data?.group) {
    throw new Error(data.message ?? 'Failed to add members');
  }
  return data.data.group;
}

export async function sendInboxGroupMessage(
  groupId: string,
  text: string,
  image?: { uri: string; name?: string; type?: string },
): Promise<{ message: InboxGroupMessage; group: InboxGroup }> {
  const form = new FormData();
  if (text.trim()) form.append('text', text.trim());
  if (image) {
    form.append('image', {
      uri: image.uri,
      name: image.name || 'photo.jpg',
      type: image.type || 'image/jpeg',
    } as unknown as Blob);
  }
  const { data } = await apiClient.post<ApiResponse<{ message: InboxGroupMessage; group: InboxGroup }>>(
    `/inbox/groups/${groupId}/messages`,
    form,
    {
      headers: {
        Authorization: getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    },
  );
  if (!data.success || !data.data?.message || !data.data.group) {
    throw new Error(data.message ?? 'Failed to send message');
  }
  return data.data;
}
