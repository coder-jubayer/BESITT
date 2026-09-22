import fs from 'fs';
import path from 'path';
import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { User } from '../models/User';
import { Building } from '../models/Building';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, requireAuth, signToken } from '../middleware/auth';
import { UserRole } from '../constants/roles';
import { normalizeBuildingCode } from '../utils/buildingCode';
import { normalizePhone } from '../utils/phone';
import { toUserDTO } from '../utils/buildings';
import {
  ensureUploadDirs,
  profilesUploadDir,
  removeStoredFiles,
  storedProfilePath,
} from '../utils/uploads';

const router = Router();
ensureUploadDirs();

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDirs();
    cb(null, profilesUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\//i.test(file.mimetype || '')) {
      cb(new AppError(400, 'Only photos are allowed'));
      return;
    }
    cb(null, true);
  },
});

function issueToken(user: {
  _id: { toString(): string };
  role: string;
  email?: string;
  buildingId?: string;
}) {
  return signToken({
    userId: user._id.toString(),
    role: user.role as UserRole,
    ...(user.email ? { email: user.email } : {}),
    ...(user.buildingId ? { buildingId: user.buildingId } : {}),
  });
}

router.post('/login', async (req, res: Response, next: NextFunction) => {
  try {
    // Building admins sign in with email, residents with the phone they registered.
    // Accept identifier, email, or phone for older clients / payloads.
    const rawIdentifier = String(
      req.body.identifier ?? req.body.email ?? req.body.phone ?? '',
    ).trim();
    const password = String(req.body.password ?? '');
    const usingEmail = rawIdentifier.includes('@');

    if (!rawIdentifier || !password) {
      throw new AppError(
        400,
        usingEmail || !rawIdentifier
          ? 'Email or phone and password are required'
          : 'Phone and password are required',
      );
    }

    const identifier = usingEmail ? rawIdentifier.toLowerCase() : rawIdentifier;
    const query = usingEmail
      ? { email: identifier }
      : { phone: { $in: [normalizePhone(identifier), identifier] } };

    const user = await User.findOne(query).select('+password');
    if (!user) {
      throw new AppError(401, usingEmail ? 'Wrong email' : 'Wrong phone');
    }

    if (!(await user.comparePassword(password))) {
      throw new AppError(401, 'Wrong password');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account is deactivated');
    }

    if (user.buildingId && user.role !== 'app_admin') {
      const building = await Building.findById(user.buildingId);
      if (!building || !building.isActive) {
        throw new AppError(403, 'This building is deactivated');
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: issueToken(user),
        user: await toUserDTO(user, req),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/signup', async (req, res: Response, next: NextFunction) => {
  try {
    const name = String(req.body.name ?? '').trim();
    const email = String(req.body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password ?? '');
    const buildingName = String(req.body.buildingName ?? '').trim();
    const phone = normalizePhone(req.body.phone) || undefined;

    if (!name || !email || !password || !buildingName) {
      throw new AppError(400, 'Name, email, password, and building name are required');
    }

    if (password.length < 6) {
      throw new AppError(400, 'Password must be at least 6 characters');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(409, 'A user with this email already exists');
    }

    if (phone && (await User.findOne({ phone }))) {
      throw new AppError(409, 'A user with this phone number already exists');
    }

    // New buildings start locked until trial claim or manual activation by app admin.
    const building = await Building.create({
      name: buildingName,
      accessStatus: 'locked',
      trialClaimed: false,
    });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'building_admin',
      buildingId: building._id.toString(),
    });

    building.createdBy = user._id.toString();
    await building.save();

    res.status(201).json({
      success: true,
      message: 'Building admin account created',
      data: {
        token: issueToken(user),
        user: await toUserDTO(user, req),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/signup/resident', async (req, res: Response, next: NextFunction) => {
  try {
    const buildingCode = normalizeBuildingCode(req.body.buildingCode);
    const name = String(req.body.name ?? '').trim();
    const unitNumber = String(req.body.unitNumber ?? '').trim();
    const phone = normalizePhone(req.body.phone);
    const email = String(req.body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password ?? '');

    if (!buildingCode || !name || !unitNumber || !phone || !password) {
      throw new AppError(
        400,
        'Building code, name, unit, phone, and password are required',
      );
    }

    if (email && !email.includes('@')) {
      throw new AppError(400, 'Enter a valid email address');
    }

    if (password.length < 6) {
      throw new AppError(400, 'Password must be at least 6 characters');
    }

    const building = await Building.findOne({ code: buildingCode });
    if (!building || !building.isActive) {
      throw new AppError(404, 'No building found for that code');
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw new AppError(409, 'An account with this phone number already exists');
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        throw new AppError(409, 'A user with this email already exists');
      }
    }

    const user = await User.create({
      name,
      password,
      phone,
      ...(email ? { email } : {}),
      unitNumber,
      role: 'resident',
      buildingId: building._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: `Welcome to ${building.name}`,
      data: {
        token: issueToken(user),
        user: await toUserDTO(user, req),
      },
    });
  } catch (error) {
    next(error);
  }
});

/** Lets the signup form confirm a code before the resident fills in the rest of the form. */
router.get('/building-code/:code', async (req, res: Response, next: NextFunction) => {
  try {
    const code = normalizeBuildingCode(req.params.code);
    const building = code ? await Building.findOne({ code }) : null;
    if (!building || !building.isActive) {
      throw new AppError(404, 'No building found for that code');
    }

    res.json({
      success: true,
      data: { building: { id: building._id.toString(), name: building.name, code: building.code } },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/push-token', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = String(req.body.token ?? '').trim();
    if (!token) {
      throw new AppError(400, 'Push token is required');
    }

    await User.updateMany(
      { expoPushToken: token, _id: { $ne: req.user!.userId } },
      { $unset: { expoPushToken: 1 } },
    );
    await User.findByIdAndUpdate(req.user!.userId, { expoPushToken: token });

    res.json({ success: true, message: 'Push token saved' });
  } catch (error) {
    next(error);
  }
});

router.delete('/push-token', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await User.findByIdAndUpdate(req.user!.userId, { $unset: { expoPushToken: 1 } });
    res.json({ success: true, message: 'Push token cleared' });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    const user = await User.findById(req.user!.userId);
    if (!user || !user.isActive) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      success: true,
      data: { user: await toUserDTO(user, req) },
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/me',
  requireAuth,
  avatarUpload.single('avatar'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user!.userId).select('+password');
      if (!user || !user.isActive) {
        throw new AppError(404, 'User not found');
      }

      if (req.body.name !== undefined) {
        const name = String(req.body.name ?? '').trim();
        if (name.length < 2) throw new AppError(400, 'Enter your name');
        user.name = name;
      }

      if (req.body.phone !== undefined) {
        const phone = normalizePhone(req.body.phone);
        if (phone && phone !== user.phone) {
          const taken = await User.findOne({ phone, _id: { $ne: user._id } });
          if (taken) throw new AppError(409, 'That phone number is already in use');
        }
        if (!phone && !user.email) {
          throw new AppError(400, 'You need a phone number to sign in with');
        }
        user.phone = phone || undefined;
      }

      if (req.body.unitNumber !== undefined) {
        const unitNumber = String(req.body.unitNumber ?? '').trim();
        user.unitNumber = unitNumber || undefined;
      }

      const newPassword = req.body.password ? String(req.body.password) : '';
      if (newPassword) {
        if (newPassword.length < 6) throw new AppError(400, 'Password must be at least 6 characters');
        const currentPassword = String(req.body.currentPassword ?? '');
        if (!currentPassword || !(await user.comparePassword(currentPassword))) {
          throw new AppError(400, 'Current password is incorrect');
        }
        user.password = newPassword;
      }

      if (req.file) {
        const previous = user.avatar;
        user.avatar = storedProfilePath(req.file.filename);
        if (previous) await removeStoredFiles([previous]);
      }

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated',
        data: { user: await toUserDTO(user, req) },
      });
    } catch (error) {
      if (req.file) await fs.promises.unlink(req.file.path).catch(() => undefined);
      next(error);
    }
  },
);

export default router;
