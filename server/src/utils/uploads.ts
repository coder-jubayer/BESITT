import fs from 'fs';
import path from 'path';
import { Request } from 'express';

export const uploadsRoot = path.join(__dirname, '../../uploads');
export const marketplaceUploadDir = path.join(uploadsRoot, 'marketplace');
export const electionsUploadDir = path.join(uploadsRoot, 'elections');
export const complaintsUploadDir = path.join(uploadsRoot, 'complaints');

export function ensureUploadDirs(): void {
  fs.mkdirSync(marketplaceUploadDir, { recursive: true });
  fs.mkdirSync(electionsUploadDir, { recursive: true });
  fs.mkdirSync(complaintsUploadDir, { recursive: true });
}

export function storedMarketplacePath(filename: string): string {
  return `/uploads/marketplace/${filename}`;
}

export function storedElectionPath(filename: string): string {
  return `/uploads/elections/${filename}`;
}

export function storedComplaintPath(filename: string): string {
  return `/uploads/complaints/${filename}`;
}

export function publicFileUrl(req: Request, relativePath?: string | null): string | undefined {
  if (!relativePath) return undefined;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3001';
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
  const normalized = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${proto}://${host}${normalized}`;
}

export async function removeStoredFiles(paths: Array<string | undefined | null>): Promise<void> {
  for (const item of paths) {
    if (!item || /^https?:\/\//i.test(item)) continue;
    const filename = path.basename(item);
    if (!filename) continue;
    const dir = item.includes('/elections/')
      ? electionsUploadDir
      : item.includes('/complaints/')
        ? complaintsUploadDir
        : marketplaceUploadDir;
    await fs.promises.unlink(path.join(dir, filename)).catch(() => undefined);
  }
}
