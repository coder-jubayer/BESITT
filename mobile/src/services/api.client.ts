import axios, { AxiosError } from 'axios';
import { config } from '../config/env';
import { isBuildingLockError, requestActivationPopup } from '../utils/buildingLock';

export const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

function maybeOpenLockPopup(url: string) {
  const path = url.toLowerCase();
  if (
    path.includes('/claim-trial') ||
    path.includes('/auth/') ||
    path.includes('/platform/settings') ||
    path.includes('/platform/me')
  ) {
    return;
  }
  try {
    // Lazy require avoids auth.store ↔ api.client cycle
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuthStore } = require('../stores/auth.store') as typeof import('../stores/auth.store');
    const access = useAuthStore.getState().user?.buildingAccess;
    if (access && !access.canWrite) {
      requestActivationPopup();
    }
  } catch {
    // store not ready
  }
}

apiClient.interceptors.request.use((requestConfig) => {
  if (authToken) {
    requestConfig.headers.Authorization = `Bearer ${authToken}`;
  }
  const method = String(requestConfig.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    maybeOpenLockPopup(String(requestConfig.url || ''));
  }
  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (!error.response) {
      return Promise.reject(
        new Error(`Network error — cannot reach API at ${config.apiUrl}`),
      );
    }
    const message =
      error.response?.data?.message ?? error.message ?? 'Something went wrong';
    if (error.response.status === 403 && isBuildingLockError(message)) {
      requestActivationPopup();
    }
    return Promise.reject(new Error(message));
  },
);
