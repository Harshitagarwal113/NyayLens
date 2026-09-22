import { Router } from 'express';
import healthRoutes from './health.routes';
import documentRoutes from './document.routes';

const router = Router();

// Mount all v1 routes
router.use('/health', healthRoutes);
router.use('/documents', documentRoutes);

export default router;
