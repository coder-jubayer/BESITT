import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 3001;

/**
 * On a physical phone, "localhost" is the phone itself.
 * Derive the PC LAN IP from Expo's Metro host (e.g. 192.168.0.106:8081).
 */
function resolveDevApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && !fromEnv.includes('localhost') && !fromEnv.includes('127.0.0.1')) {
    return fromEnv;
  }

  const expoAny = Constants as {
    expoConfig?: { hostUri?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
    manifest?: { debuggerHost?: string };
  };

  const hostUri =
    expoAny.expoConfig?.hostUri ??
    expoAny.manifest2?.extra?.expoGo?.debuggerHost ??
    expoAny.manifest?.debuggerHost;

  if (typeof hostUri === 'string' && hostUri.length > 0) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${API_PORT}/api/v1`;
    }
  }

  // Android emulator can reach the host machine via 10.0.2.2
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}/api/v1`;
  }

  return `http://localhost:${API_PORT}/api/v1`;
}

export const config = {
  apiUrl: resolveDevApiUrl(),
  appName: 'Building Management',
  appVersion: Constants.expoConfig?.version ?? '1.0.0',
} as const;
