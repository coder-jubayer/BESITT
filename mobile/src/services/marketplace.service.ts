import { apiClient, getAuthToken } from './api.client';
import { config } from '../config/env';
import type {
  ApiResponse,
  MarketplaceChatMessage,
  MarketplaceListResponse,
  MarketplaceListing,
  MarketplaceThread,
  MarketplaceThreadDetail,
} from '../types';

export async function fetchMarketplace(params?: {
  buildingId?: string;
  mine?: boolean;
}): Promise<MarketplaceListResponse> {
  const { data } = await apiClient.get<ApiResponse<MarketplaceListResponse>>('/marketplace', {
    params: {
      buildingId: params?.buildingId,
      mine: params?.mine ? 1 : undefined,
    },
  });
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load marketplace');
  }
  return data.data;
}

export async function fetchListing(id: string): Promise<MarketplaceListing> {
  const { data } = await apiClient.get<ApiResponse<{ listing: MarketplaceListing }>>(`/marketplace/${id}`);
  if (!data.success || !data.data?.listing) {
    throw new Error(data.message ?? 'Failed to load listing');
  }
  return data.data.listing;
}

export async function createListing(payload: {
  title: string;
  description: string;
  price: number;
  sellerPhone?: string;
  sellerEmail?: string;
  buildingId?: string;
  images: Array<{ uri: string; name?: string; type?: string }>;
}): Promise<MarketplaceListing> {
  const form = new FormData();
  form.append('title', payload.title);
  form.append('description', payload.description);
  form.append('price', String(payload.price));
  if (payload.sellerPhone) form.append('sellerPhone', payload.sellerPhone);
  if (payload.sellerEmail) form.append('sellerEmail', payload.sellerEmail);
  if (payload.buildingId) form.append('buildingId', payload.buildingId);
  payload.images.forEach((image, index) => {
    form.append('images', {
      uri: image.uri,
      name: image.name || `photo-${index + 1}.jpg`,
      type: image.type || 'image/jpeg',
    } as unknown as Blob);
  });

  const { data } = await apiClient.post<ApiResponse<{ listing: MarketplaceListing }>>('/marketplace', form, {
    headers: {
      Authorization: getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });
  if (!data.success || !data.data?.listing) {
    throw new Error(data.message ?? 'Failed to create listing');
  }
  return data.data.listing;
}

export async function deleteListing(id: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse>(`/marketplace/${id}`);
  if (!data.success) {
    throw new Error(data.message ?? 'Failed to delete listing');
  }
}

export async function fetchMarketplaceChats(): Promise<MarketplaceThread[]> {
  const { data } = await apiClient.get<ApiResponse<{ threads: MarketplaceThread[] }>>('/marketplace/chats');
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load marketplace messages');
  }
  return data.data.threads;
}

export async function fetchMarketplaceThread(threadId: string): Promise<MarketplaceThreadDetail> {
  const { data } = await apiClient.get<ApiResponse<MarketplaceThreadDetail>>(`/marketplace/chats/${threadId}`);
  if (!data.success || !data.data?.thread) {
    throw new Error(data.message ?? 'Failed to load conversation');
  }
  return data.data;
}

export async function sendMarketplaceMessage(
  threadId: string,
  text: string,
  image?: { uri: string; name?: string; type?: string },
): Promise<{ message: MarketplaceChatMessage; thread: MarketplaceThread }> {
  const form = new FormData();
  if (text.trim()) form.append('text', text.trim());
  if (image) {
    form.append('image', {
      uri: image.uri,
      name: image.name || 'photo.jpg',
      type: image.type || 'image/jpeg',
    } as unknown as Blob);
  }
  const { data } = await apiClient.post<ApiResponse<{ message: MarketplaceChatMessage; thread: MarketplaceThread }>>(
    `/marketplace/chats/${threadId}/messages`,
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

export async function contactSeller(
  listingId: string,
  text?: string,
): Promise<MarketplaceThreadDetail> {
  const { data } = await apiClient.post<ApiResponse<MarketplaceThreadDetail>>(`/marketplace/${listingId}/contact`, {
    text,
  });
  if (!data.success || !data.data?.thread) {
    throw new Error(data.message ?? 'Failed to contact seller');
  }
  return data.data;
}

export function marketplaceApiOrigin(): string {
  return config.apiUrl.replace(/\/api\/v1\/?$/, '');
}
