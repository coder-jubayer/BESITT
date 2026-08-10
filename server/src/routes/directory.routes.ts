import { Router, Response, NextFunction } from 'express';
import { DirectoryContact } from '../models/DirectoryContact';
import { Building } from '../models/Building';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, requireAuth, requireDirectoryManager } from '../middleware/auth';
import { canManageDirectory, isAppAdmin } from '../constants/roles';
import { collectDirectoryTypes, resolveDirectoryType } from '../constants/directory';

const router = Router();

router.use(requireAuth);

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

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
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

    const contacts = buildingId
      ? await DirectoryContact.find({ buildingId }).sort({ type: 1, createdAt: 1 })
      : [];

    const safeContacts = contacts.map((item) => item.toSafeJSON());

    res.json({
      success: true,
      data: {
        contacts: safeContacts,
        types: collectDirectoryTypes(safeContacts),
        canManage: canManageDirectory(actor.role),
        buildings,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireDirectoryManager, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { type, typeLabel } = resolveDirectoryType(req.body);
    const name = String(req.body.name ?? '').trim();
    const phone = normalizePhone(String(req.body.phone ?? ''));
    const note = req.body.note ? String(req.body.note).trim() : undefined;

    if (name.length < 2) {
      throw new AppError(400, 'Name is required');
    }
    if (phone.replace(/\D/g, '').length < 3) {
      throw new AppError(400, 'Enter a valid phone number');
    }

    const buildingId = await resolveBuildingId(
      actor,
      req.body.buildingId ? String(req.body.buildingId) : undefined,
    );
    if (!buildingId) {
      throw new AppError(400, 'Select a building');
    }

    const poster = await User.findById(actor.userId);
    const contact = await DirectoryContact.create({
      buildingId,
      type,
      typeLabel,
      name,
      phone,
      note,
      createdBy: actor.userId,
      createdByName: poster?.name?.trim() || 'Committee',
    });

    res.status(201).json({
      success: true,
      message: 'Contact added',
      data: { contact: contact.toSafeJSON() },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireDirectoryManager, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const contact = await DirectoryContact.findById(req.params.id);
    if (!contact) {
      throw new AppError(404, 'Contact not found');
    }
    if (!isAppAdmin(actor.role) && contact.buildingId !== actor.buildingId) {
      throw new AppError(403, 'You cannot delete this contact');
    }

    await contact.deleteOne();
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
