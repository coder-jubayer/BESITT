import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { apiClient, getAuthToken } from './api.client';
import { config } from '../config/env';
import type {
  ApiResponse,
  ExpenseCategoryOption,
  ExpenseItem,
  ExpensesMonthResponse,
  ResidentDueSummary,
  ResidentDuesResponse,
} from '../types';

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

export async function fetchResidentDues(params: {
  year: number;
  month: number;
  buildingId?: string;
}): Promise<ResidentDuesResponse> {
  const { data } = await apiClient.get<ApiResponse<ResidentDuesResponse>>('/expenses/resident-dues', {
    params,
  });
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load resident dues');
  }
  return data.data;
}

export async function setResidentDue(payload: {
  year: number;
  month: number;
  amount: number;
  note?: string;
  buildingId?: string;
}): Promise<ResidentDueSummary> {
  const { data } = await apiClient.post<ApiResponse<{ summary: ResidentDueSummary }>>(
    '/expenses/resident-dues',
    payload,
  );
  if (!data.success || !data.data?.summary) {
    throw new Error(data.message ?? 'Failed to save monthly due');
  }
  return data.data.summary;
}

export async function markResidentDueCollected(payload: {
  year: number;
  month: number;
  userId: string;
  collected: boolean;
  buildingId?: string;
}): Promise<ResidentDueSummary> {
  const { data } = await apiClient.post<ApiResponse<{ summary: ResidentDueSummary }>>(
    '/expenses/resident-dues/collect',
    payload,
  );
  if (!data.success || !data.data?.summary) {
    throw new Error(data.message ?? 'Failed to update collection');
  }
  return data.data.summary;
}

export async function downloadExpenseReport(params: {
  year: number;
  month: number;
  includeResidents: boolean;
  buildingId?: string;
}): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('Please sign in again to download the report.');

  const query = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
    includeResidents: String(params.includeResidents),
  });
  if (params.buildingId) query.append('buildingId', params.buildingId);

  const target = new File(
    Paths.cache,
    `expense-report-${params.year}-${String(params.month).padStart(2, '0')}.pdf`,
  );

  const file = await File.downloadFileAsync(`${config.apiUrl}/expenses/report?${query}`, target, {
    headers: { Authorization: `Bearer ${token}` },
    idempotent: true,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Society expense report',
  });
}

export async function deleteExpense(id: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse>(`/expenses/${id}`);
  if (!data.success) {
    throw new Error(data.message ?? 'Failed to delete expense');
  }
}
