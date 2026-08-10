import fs from 'fs';
import path from 'path';
import { Request } from 'express';

export const uploadsRoot = path.join(__dirname, '../../uploads');
export const marketplaceUploadDir = path.join(uploadsRoot, 'marketplace');
export const electionsUploadDir = path.join(uploadsRoot, 'elections');
export const complaintsUploadDir = path.join(uploadsRoot, 'complaints');
export const groupsUploadDir = path.join(uploadsRoot, 'groups');
export const chatUploadDir = path.join(uploadsRoot, 'chat');
export const profilesUploadDir = path.join(uploadsRoot, 'profiles');

export function ensureUploadDirs(): void {
  fs.mkdirSync(marketplaceUploadDir, { recursive: true });
  fs.mkdirSync(electionsUploadDir, { recursive: true });
  fs.mkdirSync(complaintsUploadDir, { recursive: true });
  fs.mkdirSync(groupsUploadDir, { recursive: true });
  fs.mkdirSync(chatUploadDir, { recursive: true });
  fs.mkdirSync(profilesUploadDir, { recursive: true });
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

export function storedGroupPath(filename: string): string {
  return `/uploads/groups/${filename}`;
}

export function storedChatPath(filename: string): string {
  return `/uploads/chat/${filename}`;
}

export function storedProfilePath(filename: string): string {
  return `/uploads/profiles/${filename}`;
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
        : item.includes('/groups/')
          ? groupsUploadDir
          : item.includes('/chat/')
            ? chatUploadDir
            : item.includes('/profiles/')
              ? profilesUploadDir
              : marketplaceUploadDir;
    await fs.promises.unlink(path.join(dir, filename)).catch(() => undefined);
  }
}
