import { apiClient } from './api.client';
import type {
  ApiResponse,
  BuildingAccess,
  PlatformSettings,
  User,
} from '../types';

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const { data } = await apiClient.get<
    ApiResponse<{ settings: PlatformSettings }>
  >('/platform/settings', {
    params: { _ts: Date.now() },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });
  if (!data.success || !data.data?.settings) {
    throw new Error(data.message ?? 'Failed to load settings');
  }
  return data.data.settings;
}

export async function claimBuildingTrial(buildingId: string): Promise<{
  access: BuildingAccess;
  platform: PlatformSettings;
}> {
  const { data } = await apiClient.post<
    ApiResponse<{ access: BuildingAccess; platform: PlatformSettings; building?: unknown }>
  >(`/platform/buildings/${buildingId}/claim-trial`);
  if (!data.success || !data.data?.access) {
    throw new Error(data.message ?? 'Could not start free trial');
  }
  return {
    access: data.data.access,
    platform: data.data.platform,
  };
}

export async function refreshMyAccess(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me', {
    params: { _ts: Date.now() },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });
  if (!data.success || !data.data?.user) {
    throw new Error(data.message ?? 'Failed to refresh access');
  }
  return data.data.user;
}
