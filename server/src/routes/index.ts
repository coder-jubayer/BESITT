import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import noticesRoutes from './notices.routes';
import expensesRoutes from './expenses.routes';
import directoryRoutes from './directory.routes';
import marketplaceRoutes from './marketplace.routes';
import electionsRoutes from './elections.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/notices', noticesRoutes);
router.use('/expenses', expensesRoutes);
router.use('/directory', directoryRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/elections', electionsRoutes);

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Building Management API',
    version: '1.0.0',
    docs: '/api/v1/health',
  });
});

export default router;
