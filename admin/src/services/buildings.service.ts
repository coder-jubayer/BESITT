import { apiClient, getAuthToken } from './api.client';
import { config } from '../config/env';
import type { ApiResponse, Building, OverviewStats, User } from '../types';
import { fetchUsers } from './users.service';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type BuildingReportRole = 'building_admin' | 'committee' | 'guard' | 'resident';

export async function fetchOverview(): Promise<OverviewStats> {
  const { data } = await apiClient.get<ApiResponse<OverviewStats>>('/buildings/overview');
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load overview');
  }
  return data.data;
}

export async function fetchBuildings(): Promise<Building[]> {
  const { data } = await apiClient.get<ApiResponse<{ buildings: Building[] }>>('/buildings');
  if (!data.success || !data.data?.buildings) {
    throw new Error(data.message ?? 'Failed to load buildings');
  }
  return data.data.buildings;
}

async function fetchBuildingDetailFallback(buildingId: string): Promise<{
  building: Building;
  users: User[];
  admins: User[];
}> {
  const [buildings, usersData] = await Promise.all([fetchBuildings(), fetchUsers()]);
  const building = buildings.find((item) => item.id === buildingId);
  if (!building) {
    throw new Error('Building not found');
  }
  const users = usersData.users.filter((user) => user.buildingId === buildingId);
  const admins = users.filter(
    (user) => user.role === 'building_admin' || user.role === 'app_admin',
  );
  return {
    building: {
      ...building,
      userCount: users.length,
      activeUserCount: users.filter((user) => user.isActive !== false).length,
    },
    users,
    admins,
  };
}

export async function fetchBuildingDetail(buildingId: string): Promise<{
  building: Building;
  users: User[];
  admins: User[];
}> {
  try {
    const { data } = await apiClient.get<
      ApiResponse<{ building: Building; users: User[]; admins?: User[] }>
    >(`/buildings/${buildingId}`);
    if (!data.success || !data.data?.building) {
      throw new Error(data.message ?? 'Failed to load building');
    }
    const users = data.data.users ?? [];
    const admins =
      data.data.admins ??
      users.filter((user) => user.role === 'building_admin' || user.role === 'app_admin');
    return {
      building: data.data.building,
      users,
      admins,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/route not found|not found|404/i.test(message)) {
      return fetchBuildingDetailFallback(buildingId);
    }
    throw error;
  }
}

export async function setBuildingActive(buildingId: string, isActive: boolean): Promise<Building> {
  const { data } = await apiClient.patch<
    ApiResponse<{ building: Building; usersUpdated?: number }>
  >(`/buildings/${buildingId}/status`, { isActive });
  if (!data.success || !data.data?.building) {
    throw new Error(data.message ?? 'Failed to update building');
  }
  return data.data.building;
}

export async function downloadBuildingsReport(params: {
  roles: BuildingReportRole[];
  buildingId?: string;
}): Promise<void> {
  if (!params.roles.length) {
    throw new Error('Select at least one role for the report.');
  }

  const token = getAuthToken();
  if (!token) throw new Error('Please sign in again to download the report.');

  const query = new URLSearchParams({
    roles: params.roles.join(','),
  });
  if (params.buildingId) query.append('buildingId', params.buildingId);

  const stamp = new Date().toISOString().slice(0, 10);
  const target = new File(
    Paths.cache,
    `buildings-report-${params.buildingId ? 'building' : 'all'}-${stamp}.pdf`,
  );

  const file = await File.downloadFileAsync(`${config.apiUrl}/buildings/report?${query}`, target, {
    headers: { Authorization: `Bearer ${token}` },
    idempotent: true,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Buildings report',
  });
}
