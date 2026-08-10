import { Router, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Building } from '../models/Building';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, requireAuth, signToken } from '../middleware/auth';
import { UserRole } from '../constants/roles';
import { toUserDTO } from '../utils/buildings';

const router = Router();

function issueToken(user: {
  _id: { toString(): string };
  role: string;
  email: string;
  buildingId?: string;
}) {
  return signToken({
    userId: user._id.toString(),
    role: user.role as UserRole,
    email: user.email,
    ...(user.buildingId ? { buildingId: user.buildingId } : {}),
  });
}

router.post('/login', async (req, res: Response, next: NextFunction) => {
  try {
    const email = String(req.body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password ?? '');

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account is deactivated');
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: issueToken(user),
        user: await toUserDTO(user),
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
    const phone = req.body.phone ? String(req.body.phone).trim() : undefined;

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

    const building = await Building.create({ name: buildingName });

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
        user: await toUserDTO(user),
      },
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
    const user = await User.findById(req.user!.userId);
    if (!user || !user.isActive) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      success: true,
      data: { user: await toUserDTO(user) },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
