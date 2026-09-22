/**
 * Residents sign in with their phone number, so the stored form has to be stable:
 * spaces, dashes and brackets are stripped, and a leading + is kept for country codes.
 */
export function normalizePhone(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const digits = raw.replace(/[^\d]/g, '');
  return raw.startsWith('+') ? `+${digits}` : digits;
}
