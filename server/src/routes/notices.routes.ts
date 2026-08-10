import { Router, Response, NextFunction } from 'express';
import { Notice } from '../models/Notice';
import { NoticeRead } from '../models/NoticeRead';
import { Building } from '../models/Building';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, requireAuth, requireNoticePoster } from '../middleware/auth';
import { canPostNotices, isAppAdmin, isResident } from '../constants/roles';
import { sendNoticePush } from '../utils/push';

const router = Router();

router.use(requireAuth);

function buildingScope(actor: { role: string; buildingId?: string }) {
  if (isAppAdmin(actor.role)) return {};
  return { buildingId: actor.buildingId };
}

function canDeleteNotice(
  actor: { userId: string; role: string; buildingId?: string },
  notice: { createdBy: string; buildingId: string },
): boolean {
  if (isAppAdmin(actor.role)) return true;
  if (!canPostNotices(actor.role)) return false;
  if (actor.buildingId && notice.buildingId !== actor.buildingId) return false;
  return true;
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    if (!isAppAdmin(actor.role) && !actor.buildingId) {
      throw new AppError(400, 'Your account is not linked to a building');
    }

    const notices = await Notice.find(buildingScope(actor)).sort({ createdAt: -1 }).limit(100);
    const buildings = isAppAdmin(actor.role)
      ? (await Building.find().sort({ name: 1 })).map((b) => b.toSafeJSON())
      : undefined;

    let unreadIds = new Set<string>();
    if (isResident(actor.role)) {
      const reads = await NoticeRead.find({
        userId: actor.userId,
        noticeId: { $in: notices.map((n) => n._id.toString()) },
      }).select('noticeId');
      unreadIds = new Set(
        notices
          .map((n) => n._id.toString())
          .filter((id) => !reads.some((r) => r.noticeId === id)),
      );
    }

    res.json({
      success: true,
      data: {
        notices: notices.map((n) => ({
          ...n.toSafeJSON(),
          unread: isResident(actor.role) ? unreadIds.has(n._id.toString()) : false,
        })),
        canPost: canPostNotices(actor.role),
        unreadCount: isResident(actor.role) ? unreadIds.size : 0,
        buildings,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireNoticePoster, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const title = String(req.body.title ?? '').trim();
    const body = String(req.body.content ?? req.body.body ?? '').trim();
    const requestedBuildingId = req.body.buildingId ? String(req.body.buildingId).trim() : undefined;

    if (!title || !body) {
      throw new AppError(400, 'Title and notice text are required');
    }

    let buildingId = actor.buildingId;
    if (isAppAdmin(actor.role)) {
      if (!requestedBuildingId) {
        throw new AppError(400, 'Select a building for this notice');
      }
      const building = await Building.findById(requestedBuildingId);
      if (!building) {
        throw new AppError(404, 'Building not found');
      }
      buildingId = building._id.toString();
    }

    if (!buildingId) {
      throw new AppError(400, 'Your account is not linked to a building');
    }

    const poster = await User.findById(actor.userId);
    const authorName = poster?.name?.trim() || 'Committee';

    const notice = await Notice.create({
      title,
      body,
      buildingId,
      createdBy: actor.userId,
      authorName,
    });

    try {
      await sendNoticePush({
        buildingId,
        title: notice.title,
        body: notice.body,
        noticeId: notice._id.toString(),
        excludeUserId: actor.userId,
      });
    } catch (error) {
      console.error('Notice push failed:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Notice posted',
      data: { notice: notice.toSafeJSON(true) },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    if (!isResident(actor.role)) {
      res.json({ success: true, data: { marked: 0 } });
      return;
    }

    const requested = Array.isArray(req.body.noticeIds)
      ? req.body.noticeIds.map((id: unknown) => String(id))
      : [];

    const scope = buildingScope(actor);
    const notices = await Notice.find(
      requested.length ? { ...scope, _id: { $in: requested } } : scope,
    ).select('_id');

    if (notices.length === 0) {
      res.json({ success: true, data: { marked: 0 } });
      return;
    }

    const result = await NoticeRead.bulkWrite(
      notices.map((notice) => ({
        updateOne: {
          filter: { userId: actor.userId, noticeId: notice._id.toString() },
          update: {
            $setOnInsert: {
              userId: actor.userId,
              noticeId: notice._id.toString(),
              readAt: new Date(),
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    res.json({
      success: true,
      data: { marked: result.upsertedCount + result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireNoticePoster, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      throw new AppError(404, 'Notice not found');
    }
    if (!canDeleteNotice(actor, notice)) {
      throw new AppError(403, 'You cannot delete this notice');
    }

    await notice.deleteOne();
    res.json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
