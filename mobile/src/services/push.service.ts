import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { apiClient } from './api.client';

// Type-only import: erased at build time, so it never pulls the native module in.
type NotificationsModule = typeof import('expo-notifications');

/**
 * Expo Go dropped Android remote push in SDK 53 and `expo-notifications` throws the moment
 * it is imported there. A static import would therefore break every screen that reaches
 * this file through the auth store, so the module is required lazily and only outside
 * Expo Go. Everything degrades to a no-op instead of crashing the app.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let cached: NotificationsModule | null | undefined;

function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (isExpoGo) {
    cached = null;
    return cached;
  }
  try {
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}

let handlerReady = false;

async function ensureAndroidChannels(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;

  const channels = [
    { id: 'default', name: 'General' },
    { id: 'notices', name: 'Notices' },
    { id: 'guests', name: 'Guest requests' },
    { id: 'messages', name: 'Messages' },
  ];

  await Promise.all(
    channels.map((channel) =>
      Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E40AF',
      }),
    ),
  );
}

export async function initNotifications(): Promise<void> {
  if (handlerReady) return;
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    await ensureAndroidChannels(Notifications);
    handlerReady = true;
  } catch (error) {
    console.warn('Notification setup failed', error);
  }
}

export async function showLocalGuestAlert(title: string, body: string): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null,
    });
  } catch {
    // A missed in-app alert should never interrupt the flow that triggered it.
  }
}

async function resolvePushToken(Notifications: NotificationsModule): Promise<string | null> {
  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data || null;
}

export async function registerPushToken(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    await initNotifications();
    const token = await resolvePushToken(Notifications);
    if (!token) return;
    await apiClient.patch('/auth/push-token', { token });
  } catch (error) {
    console.warn('Push token registration failed', error);
  }
}

export async function unregisterPushToken(): Promise<void> {
  try {
    await apiClient.delete('/auth/push-token');
  } catch {
    // Ignore logout cleanup failures
  }
}

export async function listenForNoticeTap(
  onTap: (data?: Record<string, string>) => void,
): Promise<() => void> {
  const Notifications = getNotifications();
  if (!Notifications) return () => undefined;

  try {
    // A notification that launched the app from cold start is not delivered to the
    // listener, so the last response has to be replayed manually.
    const initial = await Notifications.getLastNotificationResponseAsync();
    const data = initial?.notification.request.content.data;
    if (data) onTap(data as Record<string, string>);
  } catch {
    // No launch notification available.
  }

  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      onTap(response.notification.request.content.data as Record<string, string>);
    });
    return () => subscription.remove();
  } catch {
    return () => undefined;
  }
}
