import fs from 'fs';
import path from 'path';
import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { MarketplaceListing, IMarketplaceListingDocument } from '../models/MarketplaceListing';
import { MarketplaceThread } from '../models/MarketplaceThread';
import { MarketplaceMessage } from '../models/MarketplaceMessage';
import { Building } from '../models/Building';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, requireAuth, requireListingCreator } from '../middleware/auth';
import {
  canCreateListing,
  canModerateMarketplace,
  isAppAdmin,
} from '../constants/roles';
import {
  ensureUploadDirs,
  marketplaceUploadDir,
  publicFileUrl,
  removeStoredFiles,
  storedChatPath,
  storedMarketplacePath,
  chatUploadDir,
} from '../utils/uploads';

const router = Router();
router.use(requireAuth);
ensureUploadDirs();

const chatPhotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDirs();
    cb(null, chatUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
  },
});

const chatPhotoUpload = multer({
  storage: chatPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\//i.test(file.mimetype || '')) {
      cb(new AppError(400, 'Only photos are allowed'));
      return;
    }
    cb(null, true);
  },
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDirs();
    cb(null, marketplaceUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
  },
});

const listingUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\//i.test(file.mimetype || '')) {
      cb(new AppError(400, 'Only images are allowed'));
      return;
    }
    cb(null, true);
  },
});

async function resolveBuildingId(
  actor: { role: string; buildingId?: string },
  requested?: string,
  allowDefault = false,
): Promise<string | undefined> {
  if (isAppAdmin(actor.role)) {
    if (requested) {
      const building = await Building.findById(requested);
      if (!building) throw new AppError(404, 'Building not found');
      return building._id.toString();
    }
    if (!allowDefault) throw new AppError(400, 'Select a building');
    const first = await Building.findOne().sort({ name: 1 });
    return first?._id.toString();
  }
  if (!actor.buildingId) {
    throw new AppError(400, 'Your account is not linked to a building');
  }
  return actor.buildingId;
}

function listingDto(req: AuthRequest, listing: IMarketplaceListingDocument, actorId: string, actorRole: string) {
  const images = (listing.images || [])
    .map((item) => publicFileUrl(req, item))
    .filter((item): item is string => Boolean(item));
  return {
    ...listing.toSafeJSON(images),
    isMine: listing.sellerId === actorId,
    canDelete:
      listing.sellerId === actorId ||
      isAppAdmin(actorRole) ||
      (canModerateMarketplace(actorRole) && (!req.user?.buildingId || listing.buildingId === req.user.buildingId)),
  };
}

function threadDto(req: AuthRequest, thread: InstanceType<typeof MarketplaceThread>, actorId: string) {
  return thread.toSafeJSON(actorId, publicFileUrl(req, thread.listingImage));
}

function messageDto(req: AuthRequest, message: InstanceType<typeof MarketplaceMessage>, actorId: string) {
  return message.toSafeJSON(actorId, publicFileUrl(req, message.image));
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function parsePrice(value: unknown): number {
  const amount = Number(String(value ?? '').replace(/,/g, '').trim());
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError(400, 'Enter a valid price');
  }
  return Math.round(amount * 100) / 100;
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const buildings = isAppAdmin(actor.role)
      ? (await Building.find().sort({ name: 1 })).map((b) => b.toSafeJSON())
      : undefined;

    const buildingId = await resolveBuildingId(
      actor,
      req.query.buildingId ? String(req.query.buildingId) : undefined,
      true,
    );

    const filter: Record<string, unknown> = { buildingId, status: 'active' };
    if (String(req.query.mine ?? '') === '1') {
      filter.sellerId = actor.userId;
    }

    const listings = buildingId
      ? await MarketplaceListing.find(filter).sort({ createdAt: -1 }).limit(200)
      : [];

    res.json({
      success: true,
      data: {
        listings: listings.map((item) => listingDto(req, item, actor.userId, actor.role)),
        canCreate: canCreateListing(actor.role),
        buildings,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/chats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const threads = await MarketplaceThread.find({
      $or: [{ buyerId: actor.userId }, { sellerId: actor.userId }],
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(200);

    res.json({
      success: true,
      data: {
        threads: threads.map((thread) => threadDto(req, thread, actor.userId)),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/chats/:threadId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const thread = await MarketplaceThread.findById(req.params.threadId);
    if (!thread) throw new AppError(404, 'Conversation not found');
    if (thread.buyerId !== actor.userId && thread.sellerId !== actor.userId && !isAppAdmin(actor.role)) {
      throw new AppError(403, 'You cannot view this conversation');
    }

    if (thread.sellerId === actor.userId) thread.sellerUnread = 0;
    if (thread.buyerId === actor.userId) thread.buyerUnread = 0;
    await thread.save();
    await MarketplaceMessage.updateMany(
      { threadId: thread._id.toString(), senderId: { $ne: actor.userId }, seenAt: null },
      { $set: { seenAt: new Date() } },
    );

    const messages = await MarketplaceMessage.find({ threadId: thread._id.toString() })
      .sort({ createdAt: 1 })
      .limit(500);

    res.json({
      success: true,
      data: {
        thread: threadDto(req, thread, actor.userId),
        messages: messages.map((item) => messageDto(req, item, actor.userId)),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/chats/:threadId/messages',
  chatPhotoUpload.single('image'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const actor = req.user!;
      const text = String(req.body.text ?? '').trim();
      const file = req.file;
      if (text.length < 1 && !file) throw new AppError(400, 'Message cannot be empty');

      const thread = await MarketplaceThread.findById(String(req.params.threadId));
      if (!thread) throw new AppError(404, 'Conversation not found');
      if (thread.buyerId !== actor.userId && thread.sellerId !== actor.userId) {
        throw new AppError(403, 'You cannot message this conversation');
      }

      const poster = await User.findById(actor.userId);
      const senderName = poster?.name?.trim() || 'Resident';
      const image = file ? storedChatPath(file.filename) : undefined;
      const message = await MarketplaceMessage.create({
        threadId: thread._id.toString(),
        listingId: thread.listingId,
        senderId: actor.userId,
        senderName,
        text: text || (image ? 'Sent a photo' : ''),
        image,
      });

      thread.lastMessage = text || 'Photo';
      thread.lastMessageAt = message.createdAt;
      if (actor.userId === thread.buyerId) {
        thread.sellerUnread = 1;
      } else {
        thread.buyerUnread = 1;
      }
      await thread.save();

      res.status(201).json({
        success: true,
        data: {
          message: messageDto(req, message, actor.userId),
          thread: threadDto(req, thread, actor.userId),
        },
      });
    } catch (error) {
      if (req.file) await fs.promises.unlink(req.file.path).catch(() => undefined);
      next(error);
    }
  },
);

router.post(
  '/',
  requireListingCreator,
  listingUpload.array('images', 5),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const actor = req.user!;
      const title = String(req.body.title ?? '').trim();
      const description = String(req.body.description ?? '').trim();
      const sellerPhone = normalizePhone(String(req.body.sellerPhone ?? req.body.phone ?? ''));
      const sellerEmail = String(req.body.sellerEmail ?? req.body.email ?? '').trim().toLowerCase();
      const price = parsePrice(req.body.price);

      if (title.length < 2) throw new AppError(400, 'Enter an item title');
      if (description.length < 2) throw new AppError(400, 'Enter a description');
      if (sellerPhone.replace(/\D/g, '').length < 3 && !sellerEmail) {
        throw new AppError(400, 'Add a phone number or email so buyers can reach you');
      }

      const buildingId = await resolveBuildingId(
        actor,
        req.body.buildingId ? String(req.body.buildingId) : undefined,
      );
      if (!buildingId) throw new AppError(400, 'Select a building');

      const poster = await User.findById(actor.userId);
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      const images = files.map((file) => storedMarketplacePath(file.filename));

      const listing = await MarketplaceListing.create({
        buildingId,
        title,
        description,
        price,
        images,
        sellerId: actor.userId,
        sellerName: poster?.name?.trim() || 'Resident',
        sellerPhone: sellerPhone || poster?.phone,
        sellerEmail: sellerEmail || poster?.email,
      });

      res.status(201).json({
        success: true,
        message: 'Listing created',
        data: { listing: listingDto(req, listing, actor.userId, actor.role) },
      });
    } catch (error) {
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      await Promise.all(files.map((file) => fs.promises.unlink(file.path).catch(() => undefined)));
      next(error);
    }
  },
);

router.post('/:id/contact', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const listing = await MarketplaceListing.findById(req.params.id);
    if (!listing || listing.status !== 'active') throw new AppError(404, 'Listing not found');
    if (listing.sellerId === actor.userId) throw new AppError(400, 'This is your listing');

    if (!isAppAdmin(actor.role) && actor.buildingId && listing.buildingId !== actor.buildingId) {
      throw new AppError(403, 'You can only contact sellers in your building');
    }

    const poster = await User.findById(actor.userId);
    let thread = await MarketplaceThread.findOne({ listingId: listing._id.toString(), buyerId: actor.userId });
    if (!thread) {
      thread = await MarketplaceThread.create({
        buildingId: listing.buildingId,
        listingId: listing._id.toString(),
        listingTitle: listing.title,
        listingImage: listing.images[0],
        buyerId: actor.userId,
        buyerName: poster?.name?.trim() || 'Resident',
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        lastMessageAt: new Date(),
      });
    }

    const text = String(req.body.text ?? '').trim();
    let message = null;
    if (text) {
      message = await MarketplaceMessage.create({
        threadId: thread._id.toString(),
        listingId: listing._id.toString(),
        senderId: actor.userId,
        senderName: poster?.name?.trim() || 'Resident',
        text,
      });
      thread.lastMessage = text;
      thread.lastMessageAt = message.createdAt;
      thread.sellerUnread = 1;
      await thread.save();
    }

    await MarketplaceMessage.updateMany(
      { threadId: thread._id.toString(), senderId: { $ne: actor.userId }, seenAt: null },
      { $set: { seenAt: new Date() } },
    );

    const messages = await MarketplaceMessage.find({ threadId: thread._id.toString() })
      .sort({ createdAt: 1 })
      .limit(500);

    res.status(text ? 201 : 200).json({
      success: true,
      data: {
        thread: threadDto(req, thread, actor.userId),
        messages: messages.map((item) => messageDto(req, item, actor.userId)),
        message: message ? messageDto(req, message, actor.userId) : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const listing = await MarketplaceListing.findById(req.params.id);
    if (!listing || listing.status !== 'active') throw new AppError(404, 'Listing not found');
    if (!isAppAdmin(actor.role) && actor.buildingId && listing.buildingId !== actor.buildingId) {
      throw new AppError(403, 'Listing is not in your building');
    }

    res.json({
      success: true,
      data: { listing: listingDto(req, listing, actor.userId, actor.role) },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const listing = await MarketplaceListing.findById(req.params.id);
    if (!listing) throw new AppError(404, 'Listing not found');

    const canDelete =
      listing.sellerId === actor.userId ||
      isAppAdmin(actor.role) ||
      (canModerateMarketplace(actor.role) && (!actor.buildingId || listing.buildingId === actor.buildingId));
    if (!canDelete) throw new AppError(403, 'You cannot delete this listing');

    await removeStoredFiles(listing.images);
    await listing.deleteOne();

    res.json({ success: true, message: 'Listing deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
