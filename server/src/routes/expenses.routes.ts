import { Router, Response, NextFunction } from 'express';
import { Expense } from '../models/Expense';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { Building } from '../models/Building';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, requireAuth, requireExpenseManager } from '../middleware/auth';
import { canManageExpenses, isAppAdmin } from '../constants/roles';
import {
  CategoryMeta,
  EXPENSE_COLOR_PALETTE,
  nextCategoryColor,
  slugifyCategory,
} from '../constants/expenses';
import { loadBuildingCategories } from '../utils/expenseCategories';

const router = Router();

router.use(requireAuth);

function parseMonthYear(query: { month?: unknown; year?: unknown }) {
  const now = new Date();
  const year = query.year ? Number(query.year) : now.getFullYear();
  const month = query.month ? Number(query.month) : now.getMonth() + 1;
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    throw new AppError(400, 'Invalid year');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new AppError(400, 'Invalid month');
  }
  return { year, month };
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

async function resolveBuildingId(
  actor: { role: string; buildingId?: string },
  requested?: string,
): Promise<string> {
  if (isAppAdmin(actor.role)) {
    if (!requested) {
      throw new AppError(400, 'Select a building');
    }
    const building = await Building.findById(requested);
    if (!building) {
      throw new AppError(404, 'Building not found');
    }
    return building._id.toString();
  }
  if (!actor.buildingId) {
    throw new AppError(400, 'Your account is not linked to a building');
  }
  return actor.buildingId;
}

function buildBreakdown(
  categories: CategoryMeta[],
  expenses: Array<{ category: string; amount: number }>,
) {
  const totals = new Map<string, number>();
  for (const item of expenses) {
    totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);

  const rows = categories.map((category) => {
    const amount = totals.get(category.value) ?? 0;
    return {
      category: category.value,
      label: category.label,
      color: category.color,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
    };
  });

  for (const [slug, amount] of totals.entries()) {
    if (rows.some((row) => row.category === slug)) continue;
    rows.push({
      category: slug,
      label: slug.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      color: '#9CA3AF',
      amount,
      percent: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
    });
  }

  return rows;
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { year, month } = parseMonthYear(req.query);
    const buildings = isAppAdmin(actor.role)
      ? (await Building.find().sort({ name: 1 })).map((b) => b.toSafeJSON())
      : undefined;

    let buildingId = actor.buildingId;
    if (isAppAdmin(actor.role)) {
      buildingId = req.query.buildingId ? String(req.query.buildingId) : buildings?.[0]?.id;
    } else if (!buildingId) {
      throw new AppError(400, 'Your account is not linked to a building');
    }

    const categories = await loadBuildingCategories(buildingId);
    const expenses = buildingId
      ? await Expense.find({ buildingId, year, month }).sort({ createdAt: -1 })
      : [];
    const breakdown = buildBreakdown(categories, expenses);
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      success: true,
      data: {
        year,
        month,
        monthLabel: monthLabel(year, month),
        total,
        canManage: canManageExpenses(actor.role),
        categories,
        breakdown,
        expenses: expenses.map((item) => item.toSafeJSON(categories)),
        buildings,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/categories', requireExpenseManager, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const label = String(req.body.label ?? '').trim();
    const requestedColor = req.body.color ? String(req.body.color).trim() : undefined;

    if (label.length < 2) {
      throw new AppError(400, 'Category name must be at least 2 characters');
    }
    if (label.length > 40) {
      throw new AppError(400, 'Category name is too long');
    }

    const buildingId = await resolveBuildingId(
      actor,
      req.body.buildingId ? String(req.body.buildingId) : undefined,
    );
    const existing = await loadBuildingCategories(buildingId);
    const duplicate = existing.find((item) => item.label.toLowerCase() === label.toLowerCase());
    if (duplicate) {
      throw new AppError(409, 'That category already exists');
    }

    let value = slugifyCategory(label);
    const taken = new Set(existing.map((item) => item.value));
    if (taken.has(value)) {
      value = `${value}_${Date.now().toString().slice(-4)}`;
    }

    const color =
      requestedColor && EXPENSE_COLOR_PALETTE.includes(requestedColor)
        ? requestedColor
        : nextCategoryColor(existing);

    const category = await ExpenseCategory.create({
      buildingId,
      value,
      label,
      color,
      createdBy: actor.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Category added',
      data: { category: category.toSafeJSON() },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireExpenseManager, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { year, month } = parseMonthYear(req.body);
    const category = String(req.body.category ?? '').trim();
    const amount = Number(req.body.amount);
    const note = req.body.note ? String(req.body.note).trim() : undefined;

    if (!category) {
      throw new AppError(400, 'Select an expense category');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError(400, 'Amount must be greater than 0');
    }

    const buildingId = await resolveBuildingId(
      actor,
      req.body.buildingId ? String(req.body.buildingId) : undefined,
    );
    const categories = await loadBuildingCategories(buildingId);
    if (!categories.some((item) => item.value === category)) {
      throw new AppError(400, 'Select a valid expense category');
    }

    const poster = await User.findById(actor.userId);
    const expense = await Expense.create({
      year,
      month,
      buildingId,
      category,
      amount: Math.round(amount * 100) / 100,
      note,
      addedBy: actor.userId,
      addedByName: poster?.name?.trim() || 'Committee',
    });

    res.status(201).json({
      success: true,
      message: 'Expense added',
      data: { expense: expense.toSafeJSON(categories) },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireExpenseManager, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      throw new AppError(404, 'Expense not found');
    }

    if (!isAppAdmin(actor.role) && expense.buildingId !== actor.buildingId) {
      throw new AppError(403, 'You cannot delete this expense');
    }

    await expense.deleteOne();
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
