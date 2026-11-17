import fs from 'fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { User } from '../models/User';

const expo = new Expo();

type ServiceAccount = {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

type PushPayload = {
  title: string;
  body: string;
  channelId: string;
  data?: Record<string, string>;
};

let firebaseTried = false;
let firebaseOk = false;

function loadServiceAccount(): ServiceAccount | null {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim();
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  try {
    if (b64) return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as ServiceAccount;
    if (json) return JSON.parse(json) as ServiceAccount;
    if (filePath && fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ServiceAccount;
    }
  } catch (error) {
    console.error('Firebase service account is invalid:', error);
  }
  return null;
}

function ensureFirebase(): boolean {
  if (firebaseTried) return firebaseOk;
  firebaseTried = true;

  const raw = loadServiceAccount();
  if (!raw) {
    console.error(
      'Push: no Firebase service account. Set FIREBASE_SERVICE_ACCOUNT_B64 on the Ubuntu host. Expo dashboard FCM is not used.',
    );
    firebaseOk = false;
    return false;
  }

  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: raw.projectId || raw.project_id,
          clientEmail: raw.clientEmail || raw.client_email,
          privateKey: (raw.privateKey || raw.private_key || '').replace(/\\n/g, '\n'),
        }),
      });
    }
    firebaseOk = true;
  } catch (error) {
    console.error('Firebase admin failed to start:', error);
    firebaseOk = false;
  }
  return firebaseOk;
}

async function deliverExpo(messages: ExpoPushMessage[]): Promise<number> {
  if (messages.length === 0) return 0;

  let sent = 0;
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, index) => {
        if (ticket.status === 'ok') {
          sent += 1;
          return;
        }
        const token = chunk[index]?.to;
        const errorCode = ticket.status === 'error' ? ticket.details?.error : undefined;
        if (errorCode === 'DeviceNotRegistered' && typeof token === 'string') {
          void User.updateMany({ expoPushToken: token }, { $unset: { expoPushToken: 1 } });
        }
      });
    } catch (error) {
      console.error('Expo push chunk failed:', error);
    }
  }

  return sent;
}

async function deliverFcm(tokens: string[], payload: PushPayload): Promise<number> {
  if (tokens.length === 0) return 0;
  if (!ensureFirebase()) return 0;

  const messaging = getMessaging();
  let sent = 0;

  const results = await Promise.all(
    tokens.map(async (token) => {
      try {
        await messaging.send({
          token,
          notification: {
            title: payload.title,
            body: payload.body.slice(0, 180),
          },
          data: payload.data,
          android: {
            priority: 'high',
            notification: {
              channelId: payload.channelId,
              sound: 'default',
            },
          },
        });
        return { token, ok: true };
      } catch (error) {
        const code = (error as { code?: string }).code || '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          void User.updateMany({ fcmToken: token }, { $unset: { fcmToken: 1 } });
        } else {
          console.error('FCM send failed:', error);
        }
        return { token, ok: false };
      }
    }),
  );

  sent = results.filter((item) => item.ok).length;
  return sent;
}

async function tokensForUsers(userIds: string[]): Promise<{ expo: string[]; fcm: string[] }> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const empty = { expo: [] as string[], fcm: [] as string[] };
  if (unique.length === 0) return empty;

  const users = await User.find({
    _id: { $in: unique },
    isActive: true,
  }).select('+expoPushToken +fcmToken');

  const expoTokens: string[] = [];
  const fcmTokens: string[] = [];

  for (const user of users) {
    if (user.fcmToken) fcmTokens.push(user.fcmToken);
    else if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
      expoTokens.push(user.expoPushToken);
    }
  }

  return { expo: [...new Set(expoTokens)], fcm: [...new Set(fcmTokens)] };
}

async function deliverToUsers(userIds: string[], payload: PushPayload): Promise<number> {
  const tokens = await tokensForUsers(userIds);
  const fcmSent = await deliverFcm(tokens.fcm, payload);
  const expoSent = await deliverExpo(
    tokens.expo.map((token) => ({
      to: token,
      sound: 'default' as const,
      title: payload.title,
      body: payload.body.slice(0, 180),
      channelId: payload.channelId,
      data: payload.data,
    })),
  );
  return fcmSent + expoSent;
}

export async function sendNoticePush(options: {
  buildingId: string;
  title: string;
  body: string;
  noticeId: string;
  excludeUserId?: string;
}): Promise<number> {
  const query: Record<string, unknown> = {
    buildingId: options.buildingId,
    isActive: true,
  };
  if (options.excludeUserId) query._id = { $ne: options.excludeUserId };

  const recipients = await User.find(query).select('_id');
  return deliverToUsers(
    recipients.map((user) => user._id.toString()),
    {
      title: options.title,
      body: options.body,
      channelId: 'notices',
      data: { type: 'notice', noticeId: options.noticeId },
    },
  );
}

export async function sendUserPush(options: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}): Promise<number> {
  return deliverToUsers([options.userId], {
    title: options.title,
    body: options.body,
    channelId: options.channelId ?? 'guests',
    data: options.data,
  });
}

export async function sendUsersPush(options: {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}): Promise<number> {
  return deliverToUsers(options.userIds, {
    title: options.title,
    body: options.body,
    channelId: options.channelId ?? 'messages',
    data: options.data,
  });
}

export async function sendBuildingStaffPush(options: {
  buildingId: string;
  excludeUserId?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}): Promise<number> {
  const query: Record<string, unknown> = {
    buildingId: options.buildingId,
    isActive: true,
    role: { $in: ['committee', 'building_admin'] },
  };
  if (options.excludeUserId) query._id = { $ne: options.excludeUserId };

  const staff = await User.find(query).select('_id');
  return deliverToUsers(
    staff.map((user) => user._id.toString()),
    {
      title: options.title,
      body: options.body,
      channelId: options.channelId ?? 'tickets',
      data: options.data,
    },
  );
}
