export const COMPLAINT_CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'AC / HVAC' },
  { value: 'common_area', label: 'Common Area' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'security', label: 'Security' },
  { value: 'lift', label: 'Lift' },
  { value: 'other', label: 'Other' },
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number]['value'];

export const COMPLAINT_CATEGORY_VALUES = COMPLAINT_CATEGORIES.map((item) => item.value);

export const COMPLAINT_STATUSES = ['open', 'in_progress', 'resolved'] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

export function complaintCategoryLabel(category: string): string {
  return COMPLAINT_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}

export function complaintStatusLabel(status: string): string {
  return COMPLAINT_STATUS_LABELS[status as ComplaintStatus] ?? status.replace('_', ' ');
}
