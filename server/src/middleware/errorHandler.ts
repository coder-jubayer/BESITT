import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if ((err as { name?: string }).name === 'MulterError') {
    const code = (err as { code?: string }).code;
    res.status(400).json({
      success: false,
      message: code === 'LIMIT_FILE_SIZE' ? 'Each image must be under 5MB' : err.message || 'Upload failed',
    });
    return;
  }

  const mongoErr = err as { code?: number; keyPattern?: Record<string, unknown> };
  if (mongoErr.code === 11000) {
    const field = mongoErr.keyPattern ? Object.keys(mongoErr.keyPattern)[0] : 'value';
    res.status(409).json({
      success: false,
      message: field === 'email' ? 'A user with this email already exists' : 'Duplicate value',
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
}
