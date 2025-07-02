import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

export const createHealthRoutes = (healthController: HealthController): Router => {
  const router = Router();

  router.get('/health', healthController.getHealth);

  return router;
};
