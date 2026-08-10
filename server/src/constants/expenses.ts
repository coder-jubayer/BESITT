export type CategoryMeta = {
  value: string;
  label: string;
  color: string;
  custom?: boolean;
};

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { value: 'guard_salary', label: 'Guard Salary', color: '#6366F1' },
  { value: 'cleaner_salary', label: 'Cleaner Salary', color: '#06B6D4' },
  { value: 'manager_salary', label: 'Manager Salary', color: '#8B5CF6' },
  { value: 'generator', label: 'Generator Expense', color: '#F59E0B' },
  { value: 'lift', label: 'Lift Maintenance', color: '#10B981' },
  { value: 'electricity', label: 'Electricity Bill', color: '#EAB308' },
  { value: 'wasa', label: 'WASA Bill', color: '#3B82F6' },
  { value: 'other', label: 'Other Expenses', color: '#9CA3AF' },
];

export const EXPENSE_COLOR_PALETTE = [
  '#6366F1',
  '#06B6D4',
  '#8B5CF6',
  '#F59E0B',
  '#10B981',
  '#EAB308',
  '#3B82F6',
  '#E11D48',
  '#0EA5E9',
  '#D97706',
  '#059669',
  '#9CA3AF',
];

export const EXPENSE_CATEGORY_VALUES = EXPENSE_CATEGORIES.map((c) => c.value);

export function slugifyCategory(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || `custom_${Date.now()}`;
}

export function expenseCategoryMeta(category: string, extras: CategoryMeta[] = []): CategoryMeta {
  return (
    EXPENSE_CATEGORIES.find((item) => item.value === category) ??
    extras.find((item) => item.value === category) ?? {
      value: category,
      label: category.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      color: '#9CA3AF',
    }
  );
}

export function nextCategoryColor(existing: CategoryMeta[]): string {
  const used = new Set(existing.map((item) => item.color.toLowerCase()));
  return (
    EXPENSE_COLOR_PALETTE.find((color) => !used.has(color.toLowerCase())) ??
    EXPENSE_COLOR_PALETTE[existing.length % EXPENSE_COLOR_PALETTE.length]
  );
}
