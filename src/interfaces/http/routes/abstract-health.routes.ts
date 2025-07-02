import { RouteDefinition } from '../adapters/server.adapter';
import { AbstractHealthController } from '../controllers/abstract-health.controller';

export const createHealthRoutes = (
  healthController: AbstractHealthController
): RouteDefinition[] => {
  return [
    {
      method: 'GET',
      path: '/health',
      handler: healthController.getHealth,
    },
  ];
};
