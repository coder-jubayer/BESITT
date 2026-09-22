import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { User } from '../models/User';

const expo = new Expo();

/**
 * Sends already-built messages and prunes tokens that Expo reports as dead, so a user who
 * uninstalls the app stops being retried on every future send.
 */
async function deliver(messages: ExpoPushMessage[]): Promise<number> {
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

async function tokensForUsers(userIds: string[]): Promise<string[]> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return [];

  const users = await User.find({
    _id: { $in: unique },
    isActive: true,
    expoPushToken: { $exists: true, $nin: [null, ''] },
  }).select('+expoPushToken');

  return users
    .map((user) => user.expoPushToken)
    .filter((token): token is string => Boolean(token) && Expo.isExpoPushToken(token));
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
    expoPushToken: { $exists: true, $nin: [null, ''] },
  };
  if (options.excludeUserId) {
    query._id = { $ne: options.excludeUserId };
  }

  const recipients = await User.find(query).select('+expoPushToken');
  const messages: ExpoPushMessage[] = [];

  for (const user of recipients) {
    const token = user.expoPushToken;
    if (!token || !Expo.isExpoPushToken(token)) continue;
    messages.push({
      to: token,
      sound: 'default',
      title: options.title,
      body: options.body.slice(0, 180),
      channelId: 'notices',
      data: { type: 'notice', noticeId: options.noticeId },
    });
  }

  return deliver(messages);
}

export async function sendUserPush(options: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}): Promise<number> {
  const tokens = await tokensForUsers([options.userId]);

  return deliver(
    tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: options.title,
      body: options.body.slice(0, 180),
      channelId: options.channelId ?? 'guests',
      data: options.data,
    })),
  );
}

export async function sendUsersPush(options: {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}): Promise<number> {
  const tokens = await tokensForUsers(options.userIds);

  return deliver(
    tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: options.title,
      body: options.body.slice(0, 180),
      channelId: options.channelId ?? 'messages',
      data: options.data,
    })),
  );
}
