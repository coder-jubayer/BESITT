export const config = {
  apiUrl:
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
    'https://api.barighorr.com/api/v1',
  appName: 'Barighorr Admin',
  appVersion: '1.0.0',
} as const;
