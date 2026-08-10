import { Router, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Building } from '../models/Building';
import { InboxThread } from '../models/InboxThread';
import { InboxMessage } from '../models/InboxMessage';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { ROLE_LABELS, isAppAdmin, UserRole } from '../constants/roles';

const router = Router();
router.use(requireAuth);

export type InboxCategory = 'committee' | 'resident' | 'guard';

function pairIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function inboxCategory(role?: string | null): InboxCategory | null {
  if (role === 'committee' || role === 'building_admin') return 'committee';
  if (role === 'resident') return 'resident';
  if (role === 'guard') return 'guard';
  return null;
}

async function resolveBuildingId(
  actor: { role: string; buildingId?: string },
  requested?: string,
): Promise<string> {
  if (isAppAdmin(actor.role)) {
    if (requested) {
      const building = await Building.findById(requested);
      if (!building) throw new AppError(404, 'Building not found');
      return building._id.toString();
    }
    const first = await Building.findOne().sort({ name: 1 });
    if (!first) throw new AppError(400, 'No building found');
    return first._id.toString();
  }
  if (!actor.buildingId) {
    throw new AppError(400, 'Your account is not linked to a building');
  }
  return actor.buildingId;
}

async function markInboxSeen(threadId: string, actorId: string) {
  await InboxMessage.updateMany(
    { threadId, senderId: { $ne: actorId }, seenAt: null },
    { $set: { seenAt: new Date() } },
  );
}

async function loadThreadForActor(threadId: string, actorId: string, actorRole: string) {
  const thread = await InboxThread.findById(threadId);
  if (!thread) throw new AppError(404, 'Conversation not found');
  if (thread.userA !== actorId && thread.userB !== actorId && !isAppAdmin(actorRole)) {
    throw new AppError(403, 'You cannot view this conversation');
  }
  return thread;
}

router.get('/directory', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const buildingId = await resolveBuildingId(
      actor,
      req.query.buildingId ? String(req.query.buildingId) : undefined,
    );

    const users = await User.find({
      buildingId,
      isActive: true,
      _id: { $ne: actor.userId },
      role: { $in: ['building_admin', 'committee', 'resident', 'guard'] },
    }).sort({ name: 1 });

    const threads = await InboxThread.find({
      $or: [{ userA: actor.userId }, { userB: actor.userId }],
    });
    const threadByOther = new Map(
      threads.map((thread) => [thread.userA === actor.userId ? thread.userB : thread.userA, thread]),
    );

    type DirectoryContact = {
      id: string;
      name: string;
      role: string;
      roleLabel: string;
      phone?: string;
      email?: string;
      unitNumber?: string;
      threadId?: string;
      lastMessage?: string;
      lastMessageAt?: string;
      unread: number;
    };

    const grouped: Record<InboxCategory, DirectoryContact[]> = {
      committee: [],
      resident: [],
      guard: [],
    };

    function contactDto(user: (typeof users)[number]): DirectoryContact {
      const thread = threadByOther.get(user._id.toString());
      const isA = thread?.userA === actor.userId;
      return {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        roleLabel: ROLE_LABELS[user.role as UserRole] ?? user.role,
        phone: user.phone,
        email: user.email,
        unitNumber: user.unitNumber,
        threadId: thread?._id.toString(),
        lastMessage: thread?.lastMessage,
        lastMessageAt: thread?.lastMessageAt?.toISOString(),
        unread: thread ? (isA ? thread.userAUnread : thread.userBUnread) : 0,
      };
    }

    for (const user of users) {
      const category = inboxCategory(user.role);
      if (!category) continue;
      grouped[category].push(contactDto(user));
    }

    res.json({
      success: true,
      data: {
        buildingId,
        categories: [
          { value: 'committee', label: 'Committee', count: grouped.committee.length },
          { value: 'resident', label: 'Resident', count: grouped.resident.length },
          { value: 'guard', label: 'Security Guard', count: grouped.guard.length },
        ],
        contacts: grouped,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/threads', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const threads = await InboxThread.find({
      $or: [{ userA: actor.userId }, { userB: actor.userId }],
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(200);

    res.json({
      success: true,
      data: { threads: threads.map((thread) => thread.toSafeJSON(actor.userId)) },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/threads', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const otherId = String(req.body.userId ?? '').trim();
    if (!otherId) throw new AppError(400, 'Select a person to message');
    if (otherId === actor.userId) throw new AppError(400, 'You cannot message yourself');

    const [me, other] = await Promise.all([User.findById(actor.userId), User.findById(otherId)]);
    if (!me || !other || !other.isActive) throw new AppError(404, 'User not found');
    if (!isAppAdmin(actor.role) && me.buildingId && other.buildingId && me.buildingId !== other.buildingId) {
      throw new AppError(403, 'You can only message people in your building');
    }

    const [userA, userB] = pairIds(actor.userId, otherId);
    let thread = await InboxThread.findOne({ userA, userB });
    if (!thread) {
      const buildingId = other.buildingId || me.buildingId;
      if (!buildingId) throw new AppError(400, 'Select a building');
      const aIsMe = userA === actor.userId;
      thread = await InboxThread.create({
        buildingId,
        userA,
        userB,
        userAName: aIsMe ? me.name : other.name,
        userBName: aIsMe ? other.name : me.name,
        userARole: aIsMe ? me.role : other.role,
        userBRole: aIsMe ? other.role : me.role,
      });
    }

    if (thread.userA === actor.userId) thread.userAUnread = 0;
    else thread.userBUnread = 0;
    await thread.save();
    await markInboxSeen(thread._id.toString(), actor.userId);

    const messages = await InboxMessage.find({ threadId: thread._id.toString() }).sort({ createdAt: 1 }).limit(500);

    res.status(201).json({
      success: true,
      data: {
        thread: thread.toSafeJSON(actor.userId),
        messages: messages.map((item) => item.toSafeJSON(actor.userId)),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/threads/:threadId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const thread = await loadThreadForActor(String(req.params.threadId), actor.userId, actor.role);

    if (thread.userA === actor.userId) thread.userAUnread = 0;
    if (thread.userB === actor.userId) thread.userBUnread = 0;
    await thread.save();
    await markInboxSeen(thread._id.toString(), actor.userId);

    const messages = await InboxMessage.find({ threadId: thread._id.toString() }).sort({ createdAt: 1 }).limit(500);

    res.json({
      success: true,
      data: {
        thread: thread.toSafeJSON(actor.userId),
        messages: messages.map((item) => item.toSafeJSON(actor.userId)),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/threads/:threadId/messages', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const text = String(req.body.text ?? '').trim();
    if (text.length < 1) throw new AppError(400, 'Message cannot be empty');

    const thread = await loadThreadForActor(String(req.params.threadId), actor.userId, actor.role);
    if (thread.userA !== actor.userId && thread.userB !== actor.userId) {
      throw new AppError(403, 'You cannot message this conversation');
    }

    const poster = await User.findById(actor.userId);
    const senderName = poster?.name?.trim() || 'Resident';
    const message = await InboxMessage.create({
      threadId: thread._id.toString(),
      senderId: actor.userId,
      senderName,
      text,
    });

    thread.lastMessage = text;
    thread.lastMessageAt = message.createdAt;
    if (actor.userId === thread.userA) thread.userBUnread += 1;
    else thread.userAUnread += 1;
    await thread.save();

    res.status(201).json({
      success: true,
      data: {
        message: message.toSafeJSON(actor.userId),
        thread: thread.toSafeJSON(actor.userId),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
