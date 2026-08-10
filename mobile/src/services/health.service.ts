import { apiClient } from './api.client';
import type { HealthCheckResponse } from '../types';

export async function checkHealth(): Promise<HealthCheckResponse> {
  const { data } = await apiClient.get<HealthCheckResponse>('/health');
  return data;
}
