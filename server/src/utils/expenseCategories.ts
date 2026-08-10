import { CategoryMeta, EXPENSE_CATEGORIES } from '../constants/expenses';
import { ExpenseCategory } from '../models/ExpenseCategory';

export async function loadBuildingCategories(buildingId?: string): Promise<CategoryMeta[]> {
  const defaults: CategoryMeta[] = EXPENSE_CATEGORIES.map((item) => ({ ...item }));
  if (!buildingId) return defaults;

  const custom = await ExpenseCategory.find({ buildingId }).sort({ createdAt: 1 });
  return [...defaults, ...custom.map((item) => item.toSafeJSON())];
}
