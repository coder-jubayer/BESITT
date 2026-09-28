import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 3001;
const PRODUCTION_API = 'http://64.176.81.197:3011/api/v1';

function lanHostFromUri(value?: string): string | null {
  if (!value) return null;
  const host = value.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

function isUsableApiUrl(value?: string | null): value is string {
  const url = String(value || '').trim();
  return Boolean(url) && !url.includes('localhost') && !url.includes('127.0.0.1');
}

/**
 * Prefer an explicit public API (env / app.json) so Expo Go matches live admin-web.
 * Only fall back to the Metro LAN host when no production URL is configured —
 * otherwise Trial length and other platform settings diverge from the VPS.
 */
function resolveDevApiUrl(): string {
  const expoAny = Constants as {
    expoConfig?: { hostUri?: string; extra?: { apiUrl?: string } };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
    manifest?: { debuggerHost?: string };
  };

  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    // Explicit override wins in Expo Go (local LAN or production).
    if (isUsableApiUrl(fromEnv) || fromEnv.includes('localhost') || fromEnv.includes('127.0.0.1')) {
      // Physical device cannot use localhost — rewrite to Metro LAN host if needed.
      if (fromEnv.includes('localhost') || fromEnv.includes('127.0.0.1')) {
        const metroHost = lanHostFromUri(
          expoAny.expoConfig?.hostUri ??
            expoAny.manifest2?.extra?.expoGo?.debuggerHost ??
            expoAny.manifest?.debuggerHost,
        );
        if (metroHost) {
          return `http://${metroHost}:${API_PORT}/api/v1`;
        }
      }
      return fromEnv;
    }
  }

  const extraUrl = expoAny.expoConfig?.extra?.apiUrl?.trim();
  if (isUsableApiUrl(extraUrl)) {
    return extraUrl;
  }

  const metroHost = lanHostFromUri(
    expoAny.expoConfig?.hostUri ??
      expoAny.manifest2?.extra?.expoGo?.debuggerHost ??
      expoAny.manifest?.debuggerHost,
  );
  if (metroHost) {
    return `http://${metroHost}:${API_PORT}/api/v1`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}/api/v1`;
  }

  return `http://localhost:${API_PORT}/api/v1`;
}

function resolveApiUrl(): string {
  const extraUrl = (Constants as { expoConfig?: { extra?: { apiUrl?: string } } }).expoConfig
    ?.extra?.apiUrl;
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!__DEV__) {
    if (isUsableApiUrl(fromEnv)) return fromEnv;
    if (isUsableApiUrl(extraUrl)) return extraUrl;
    return PRODUCTION_API;
  }

  return resolveDevApiUrl();
}

export const config = {
  apiUrl: resolveApiUrl(),
  appName: 'Barighorr',
  appVersion: Constants.expoConfig?.version ?? '1.0.0',
} as const;
