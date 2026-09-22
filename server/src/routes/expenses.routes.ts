import { Router, Response, NextFunction } from 'express';
import { Expense } from '../models/Expense';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { ResidentDue } from '../models/ResidentDue';
import { ResidentDuePayment } from '../models/ResidentDuePayment';
import { Building } from '../models/Building';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import {
  AuthRequest,
  requireAuth,
  requireExpenseManager,
  requireResidentDueManager,
} from '../middleware/auth';
import { canManageExpenses, canManageResidentDues, isAppAdmin, isResident } from '../constants/roles';
import {
  CategoryMeta,
  EXPENSE_COLOR_PALETTE,
  expenseCategoryMeta,
  nextCategoryColor,
  slugifyCategory,
} from '../constants/expenses';
import { loadBuildingCategories } from '../utils/expenseCategories';
import {
  ExpenseReportData,
  expenseReportFilename,
  writeExpenseReport,
} from '../utils/expenseReport';

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

function activeResidentFilter(buildingId: string) {
  return { buildingId, role: 'resident', isActive: { $ne: false } } as const;
}

async function loadResidentDueSummary(buildingId: string, year: number, month: number) {
  const [due, residentCount, payments] = await Promise.all([
    ResidentDue.findOne({ buildingId, year, month }),
    User.countDocuments(activeResidentFilter(buildingId)),
    ResidentDuePayment.find({ buildingId, year, month }),
  ]);

  const amount = due?.amount ?? 0;
  const collectedTotal = payments.reduce((sum, item) => sum + item.amount, 0);

  return {
    isSet: Boolean(due),
    amount,
    note: due?.note,
    setByName: due?.setByName,
    residentCount,
    collectedCount: payments.length,
    pendingCount: Math.max(0, residentCount - payments.length),
    expectedTotal: Math.round(amount * residentCount * 100) / 100,
    collectedTotal: Math.round(collectedTotal * 100) / 100,
  };
}

async function loadMyResidentDue(
  buildingId: string,
  userId: string,
  year: number,
  month: number,
) {
  const due = await ResidentDue.findOne({ buildingId, year, month });
  const payment = await ResidentDuePayment.findOne({ buildingId, year, month, userId });
  const amount = due?.amount ?? 0;
  const collected = Boolean(payment);

  return {
    isSet: Boolean(due),
    amount,
    dueAmount: collected ? 0 : amount,
    collected,
    collectedAt: payment ? (payment.createdAt ?? new Date()).toISOString() : undefined,
    note: due?.note,
  };
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { year, month } = parseMonthYear(req.query);

    // Residents never see society expense details — only what they owe this month.
    if (isResident(actor.role)) {
      if (!actor.buildingId) {
        throw new AppError(400, 'Your account is not linked to a building');
      }
      const residentDue = await loadMyResidentDue(actor.buildingId, actor.userId, year, month);
      res.json({
        success: true,
        data: {
          year,
          month,
          monthLabel: monthLabel(year, month),
          total: 0,
          canManage: false,
          categories: [],
          breakdown: [],
          expenses: [],
          residentDue,
        },
      });
      return;
    }

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
    // Committee can see the monthly due and collections; only admins may change them.
    const canManageDues = canManageResidentDues(actor.role);
    const residentDueSummary = buildingId
      ? await loadResidentDueSummary(buildingId, year, month)
      : undefined;

    res.json({
      success: true,
      data: {
        year,
        month,
        monthLabel: monthLabel(year, month),
        total,
        canManage: canManageExpenses(actor.role),
        canManageDues,
        categories,
        breakdown,
        expenses: expenses.map((item) => item.toSafeJSON(categories)),
        buildings,
        residentDueSummary,
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

router.get(
  '/report',
  requireExpenseManager,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const actor = req.user!;
      const { year, month } = parseMonthYear(req.query);
      const buildingId = await resolveBuildingId(
        actor,
        req.query.buildingId ? String(req.query.buildingId) : undefined,
      );
      const includeResidents = String(req.query.includeResidents ?? '') === 'true';

      const [building, categories, expenses, reporter] = await Promise.all([
        Building.findById(buildingId),
        loadBuildingCategories(buildingId),
        Expense.find({ buildingId, year, month }).sort({ createdAt: -1 }),
        User.findById(actor.userId),
      ]);

      const total = expenses.reduce((sum, item) => sum + item.amount, 0);
      const breakdown = buildBreakdown(categories, expenses).filter((row) => row.amount > 0);

      let residents: ExpenseReportData['residents'];
      if (includeResidents) {
        const [summary, people, payments] = await Promise.all([
          loadResidentDueSummary(buildingId, year, month),
          User.find(activeResidentFilter(buildingId)).sort({ unitNumber: 1, name: 1 }),
          ResidentDuePayment.find({ buildingId, year, month }),
        ]);
        const paid = new Map(payments.map((item) => [item.userId, item]));
        residents = {
          dueAmount: summary.amount,
          dueIsSet: summary.isSet,
          residentCount: summary.residentCount,
          collectedCount: summary.collectedCount,
          expectedTotal: summary.expectedTotal,
          collectedTotal: summary.collectedTotal,
          rows: people.map((person) => {
            const payment = paid.get(person._id.toString());
            return {
              name: person.name,
              unitNumber: person.unitNumber,
              collected: Boolean(payment),
              amount: payment?.amount ?? 0,
            };
          }),
        };
      }

      const data: ExpenseReportData = {
        buildingName: building?.name?.trim() || 'Society',
        monthLabel: monthLabel(year, month),
        generatedBy: reporter?.name?.trim() || 'Committee',
        total,
        breakdown: breakdown.map((row) => ({
          label: row.label,
          amount: row.amount,
          percent: row.percent,
        })),
        lineItems: expenses.map((item) => ({
          createdAt: (item.createdAt ?? new Date()).toISOString(),
          categoryLabel: expenseCategoryMeta(item.category, categories).label,
          note: item.note,
          addedByName: item.addedByName,
          amount: item.amount,
        })),
        residents,
      };

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${expenseReportFilename(data.buildingName, data.monthLabel)}"`,
      );
      writeExpenseReport(res, data);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/resident-dues',
  requireExpenseManager,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const actor = req.user!;
      const { year, month } = parseMonthYear(req.query);
      const buildingId = await resolveBuildingId(
        actor,
        req.query.buildingId ? String(req.query.buildingId) : undefined,
      );

      const [summary, residents, payments] = await Promise.all([
        loadResidentDueSummary(buildingId, year, month),
        User.find(activeResidentFilter(buildingId)).sort({ unitNumber: 1, name: 1 }),
        ResidentDuePayment.find({ buildingId, year, month }),
      ]);

      const paid = new Map(payments.map((item) => [item.userId, item]));

      res.json({
        success: true,
        data: {
          year,
          month,
          monthLabel: monthLabel(year, month),
          canManage: canManageResidentDues(actor.role),
          summary,
          residents: residents.map((resident) => {
            const payment = paid.get(resident._id.toString());
            return {
              id: resident._id.toString(),
              name: resident.name,
              unitNumber: resident.unitNumber,
              avatar: resident.avatar,
              collected: Boolean(payment),
              collectedAt: payment ? (payment.createdAt ?? new Date()).toISOString() : undefined,
              dueAmount: payment ? 0 : summary.amount,
            };
          }),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/resident-dues',
  requireResidentDueManager,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const actor = req.user!;
      const { year, month } = parseMonthYear(req.body);
      const amount = Number(req.body.amount);
      const note = req.body.note ? String(req.body.note).trim() : undefined;

      if (!Number.isFinite(amount) || amount < 0) {
        throw new AppError(400, 'Enter a valid monthly amount');
      }

      const buildingId = await resolveBuildingId(
        actor,
        req.body.buildingId ? String(req.body.buildingId) : undefined,
      );
      const setter = await User.findById(actor.userId);
      const rounded = Math.round(amount * 100) / 100;

      await ResidentDue.findOneAndUpdate(
        { buildingId, year, month },
        {
          $set: {
            amount: rounded,
            note,
            setBy: actor.userId,
            setByName: setter?.name?.trim() || 'Building Admin',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      // Keep already-collected records aligned with the latest amount.
      await ResidentDuePayment.updateMany(
        { buildingId, year, month },
        { $set: { amount: rounded } },
      );

      const summary = await loadResidentDueSummary(buildingId, year, month);
      res.json({
        success: true,
        message: 'Monthly resident due updated',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/resident-dues',
  requireResidentDueManager,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const actor = req.user!;
      const { year, month } = parseMonthYear(req.query);
      const buildingId = await resolveBuildingId(
        actor,
        req.query.buildingId ? String(req.query.buildingId) : undefined,
      );

      await ResidentDue.deleteOne({ buildingId, year, month });
      await ResidentDuePayment.deleteMany({ buildingId, year, month });

      const summary = await loadResidentDueSummary(buildingId, year, month);
      res.json({ success: true, message: 'Monthly resident due removed', data: { summary } });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/resident-dues/collect',
  requireResidentDueManager,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const actor = req.user!;
      const { year, month } = parseMonthYear(req.body);
      const userId = String(req.body.userId ?? '').trim();
      const collected = req.body.collected !== false;

      if (!userId) {
        throw new AppError(400, 'Select a resident');
      }

      const buildingId = await resolveBuildingId(
        actor,
        req.body.buildingId ? String(req.body.buildingId) : undefined,
      );

      const resident = await User.findById(userId);
      if (!resident || resident.buildingId !== buildingId || resident.role !== 'resident') {
        throw new AppError(404, 'Resident not found in this building');
      }

      if (collected) {
        const due = await ResidentDue.findOne({ buildingId, year, month });
        if (!due) {
          throw new AppError(400, 'Set the monthly resident due before marking collections');
        }
        const collector = await User.findById(actor.userId);
        await ResidentDuePayment.findOneAndUpdate(
          { buildingId, year, month, userId },
          {
            $set: {
              amount: due.amount,
              collectedBy: actor.userId,
              collectedByName: collector?.name?.trim() || 'Building Admin',
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      } else {
        await ResidentDuePayment.deleteOne({ buildingId, year, month, userId });
      }

      const summary = await loadResidentDueSummary(buildingId, year, month);
      res.json({
        success: true,
        message: collected ? 'Marked as collected' : 'Marked as pending',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  },
);

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
