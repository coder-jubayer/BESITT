import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { canManageDirectory, canManageExpenses, canManageUsers, canPostNotices, UserRole } from '../constants/roles';

export interface AuthPayload {
  userId: string;
  role: UserRole;
  email: string;
  buildingId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}

export function requireUserManager(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user || !canManageUsers(req.user.role)) {
    next(new AppError(403, 'You do not have permission to manage users'));
    return;
  }
  next();
}

export function requireNoticePoster(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user || !canPostNotices(req.user.role)) {
    next(new AppError(403, 'Only committee and building admins can post notices'));
    return;
  }
  next();
}

export function requireExpenseManager(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user || !canManageExpenses(req.user.role)) {
    next(new AppError(403, 'Only committee can add or update expenses'));
    return;
  }
  next();
}

export function requireDirectoryManager(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user || !canManageDirectory(req.user.role)) {
    next(new AppError(403, 'Only building admin or committee can manage the directory'));
    return;
  }
  next();
}
