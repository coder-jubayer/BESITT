import { apiClient, getAuthToken } from './api.client';
import type {
  ApiResponse,
  ComplaintComment,
  ComplaintDetailResponse,
  ComplaintStatus,
  ComplaintTicket,
  ComplaintsListResponse,
} from '../types';

export async function fetchComplaints(params?: {
  buildingId?: string;
  status?: ComplaintStatus | 'all';
}): Promise<ComplaintsListResponse> {
  const { data } = await apiClient.get<ApiResponse<ComplaintsListResponse>>('/complaints', {
    params: {
      buildingId: params?.buildingId,
      status: params?.status && params.status !== 'all' ? params.status : undefined,
    },
  });
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load complaints');
  }
  return data.data;
}

export async function fetchComplaint(id: string): Promise<ComplaintDetailResponse> {
  const { data } = await apiClient.get<ApiResponse<ComplaintDetailResponse>>(`/complaints/${id}`);
  if (!data.success || !data.data?.complaint) {
    throw new Error(data.message ?? 'Failed to load ticket');
  }
  return data.data;
}

export async function createComplaint(payload: {
  title: string;
  description: string;
  category: string;
  buildingId?: string;
  media: Array<{ uri: string; name?: string; type?: string }>;
}): Promise<ComplaintTicket> {
  const form = new FormData();
  form.append('title', payload.title);
  form.append('description', payload.description);
  form.append('category', payload.category);
  if (payload.buildingId) form.append('buildingId', payload.buildingId);
  payload.media.forEach((file, index) => {
    form.append('media', {
      uri: file.uri,
      name: file.name || `media-${index + 1}`,
      type: file.type || 'image/jpeg',
    } as unknown as Blob);
  });

  const { data } = await apiClient.post<ApiResponse<{ complaint: ComplaintTicket }>>('/complaints', form, {
    headers: {
      Authorization: getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
      'Content-Type': 'multipart/form-data',
    },
    timeout: 90000,
  });
  if (!data.success || !data.data?.complaint) {
    throw new Error(data.message ?? 'Failed to submit ticket');
  }
  return data.data.complaint;
}

export async function updateComplaint(
  id: string,
  payload: { status?: ComplaintStatus; comment?: string },
): Promise<ComplaintDetailResponse> {
  const { data } = await apiClient.patch<ApiResponse<ComplaintDetailResponse>>(`/complaints/${id}`, payload);
  if (!data.success || !data.data?.complaint) {
    throw new Error(data.message ?? 'Failed to update ticket');
  }
  return data.data;
}

export async function addComplaintComment(id: string, text: string): Promise<ComplaintComment> {
  const { data } = await apiClient.post<ApiResponse<{ comment: ComplaintComment }>>(`/complaints/${id}/comments`, {
    text,
  });
  if (!data.success || !data.data?.comment) {
    throw new Error(data.message ?? 'Failed to add comment');
  }
  return data.data.comment;
}
