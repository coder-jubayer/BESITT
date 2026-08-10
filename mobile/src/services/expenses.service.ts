import { apiClient } from './api.client';
import type { ApiResponse, ExpenseCategoryOption, ExpenseItem, ExpensesMonthResponse } from '../types';

export async function fetchExpenses(params: {
  year: number;
  month: number;
  buildingId?: string;
}): Promise<ExpensesMonthResponse> {
  const { data } = await apiClient.get<ApiResponse<ExpensesMonthResponse>>('/expenses', { params });
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load expenses');
  }
  return data.data;
}

export async function createExpense(payload: {
  year: number;
  month: number;
  category: string;
  amount: number;
  note?: string;
  buildingId?: string;
}): Promise<ExpenseItem> {
  const { data } = await apiClient.post<ApiResponse<{ expense: ExpenseItem }>>('/expenses', payload);
  if (!data.success || !data.data?.expense) {
    throw new Error(data.message ?? 'Failed to add expense');
  }
  return data.data.expense;
}

export async function createExpenseCategory(payload: {
  label: string;
  color?: string;
  buildingId?: string;
}): Promise<ExpenseCategoryOption> {
  const { data } = await apiClient.post<ApiResponse<{ category: ExpenseCategoryOption }>>(
    '/expenses/categories',
    payload,
  );
  if (!data.success || !data.data?.category) {
    throw new Error(data.message ?? 'Failed to add category');
  }
  return data.data.category;
}

export async function deleteExpense(id: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse>(`/expenses/${id}`);
  if (!data.success) {
    throw new Error(data.message ?? 'Failed to delete expense');
  }
}
