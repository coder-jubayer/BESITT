import { Router, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Building } from '../models/Building';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, requireAuth, requireUserManager } from '../middleware/auth';
import {
  ROLE_LABELS,
  UserRole,
  creatableRolesFor,
  isAppAdmin,
  isBuildingAdmin,
} from '../constants/roles';
import { toUserDTO, toUserDTOList } from '../utils/buildings';

const router = Router();

router.use(requireAuth, requireUserManager);

function actorQuery(actor: { role: string; buildingId?: string }) {
  if (isAppAdmin(actor.role)) return {};
  return { buildingId: actor.buildingId };
}

function canMutateTarget(
  actor: { userId: string; role: string; buildingId?: string },
  target: { _id: { toString(): string }; role: string; buildingId?: string },
): boolean {
  if (target._id.toString() === actor.userId) return false;
  if (isAppAdmin(actor.role)) return true;
  if (!isBuildingAdmin(actor.role)) return false;
  if (target.buildingId !== actor.buildingId) return false;
  return ['committee', 'guard', 'resident'].includes(target.role);
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const users = await User.find(actorQuery(actor)).sort({ createdAt: -1 });
    const creatable = creatableRolesFor(actor.role);

    const buildings = isAppAdmin(actor.role)
      ? (await Building.find().sort({ name: 1 })).map((b) => b.toSafeJSON())
      : undefined;

    res.json({
      success: true,
      data: {
        users: await toUserDTOList(users),
        roles: creatable.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
        buildings,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const name = String(req.body.name ?? '').trim();
    const email = String(req.body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password ?? '');
    const role = String(req.body.role ?? 'resident') as UserRole;
    const phone = req.body.phone ? String(req.body.phone).trim() : undefined;
    const unitNumber = req.body.unitNumber ? String(req.body.unitNumber).trim() : undefined;
    const buildingName = req.body.buildingName ? String(req.body.buildingName).trim() : undefined;
    const requestedBuildingId = req.body.buildingId ? String(req.body.buildingId).trim() : undefined;

    if (!name || !email || !password) {
      throw new AppError(400, 'Name, email, and password are required');
    }

    if (password.length < 6) {
      throw new AppError(400, 'Password must be at least 6 characters');
    }

    const allowed = creatableRolesFor(actor.role);
    if (!allowed.includes(role)) {
      throw new AppError(403, 'You cannot create this role');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(409, 'A user with this email already exists');
    }

    let buildingId = actor.buildingId;

    if (isAppAdmin(actor.role)) {
      if (role === 'building_admin') {
        if (!buildingName) {
          throw new AppError(400, 'Building / community name is required for a building admin');
        }
        const building = await Building.create({
          name: buildingName,
          createdBy: actor.userId,
        });
        buildingId = building._id.toString();
      } else {
        if (!requestedBuildingId) {
          throw new AppError(400, 'Select a building for this user');
        }
        const building = await Building.findById(requestedBuildingId);
        if (!building) {
          throw new AppError(404, 'Building not found');
        }
        buildingId = building._id.toString();
      }
    } else {
      if (!actor.buildingId) {
        throw new AppError(400, 'Your account is not linked to a building');
      }
      buildingId = actor.buildingId;
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      unitNumber,
      buildingId,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: await toUserDTO(user) },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { id } = req.params;
    const isActive = Boolean(req.body.isActive);

    const user = await User.findById(id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!canMutateTarget(actor, user)) {
      throw new AppError(403, 'You cannot change this user');
    }

    if (!isActive && user.role === 'app_admin') {
      const activeAdmins = await User.countDocuments({ role: 'app_admin', isActive: true });
      if (activeAdmins <= 1) {
        throw new AppError(400, 'Cannot deactivate the last app admin');
      }
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: isActive ? 'User activated' : 'User deactivated',
      data: { user: await toUserDTO(user) },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!canMutateTarget(actor, user)) {
      throw new AppError(403, 'You cannot delete this user');
    }

    if (user.role === 'app_admin') {
      const adminCount = await User.countDocuments({ role: 'app_admin' });
      if (adminCount <= 1) {
        throw new AppError(400, 'Cannot delete the last app admin');
      }
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
