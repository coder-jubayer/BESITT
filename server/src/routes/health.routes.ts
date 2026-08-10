import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../db/connection';
import { env } from '../config/env';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    success: dbStatus === 'connected',
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    database: dbStatus,
    version: '1.0.0',
  });
});

export default router;
