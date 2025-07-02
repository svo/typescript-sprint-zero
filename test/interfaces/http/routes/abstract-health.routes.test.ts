import { createHealthRoutes } from '../../../../src/interfaces/http/routes/abstract-health.routes';
import { AbstractHealthController } from '../../../../src/interfaces/http/controllers/abstract-health.controller';
import { RouteDefinition } from '../../../../src/interfaces/http/adapters/server.adapter';

describe('AbstractHealthRoutes', () => {
  let mockController: jest.Mocked<AbstractHealthController>;

  beforeEach(() => {
    mockController = {
      getHealth: jest.fn(),
    } as unknown as jest.Mocked<AbstractHealthController>;
  });

  describe('createHealthRoutes', () => {
    it('should return route definitions for health endpoint', () => {
      const routes: RouteDefinition[] = createHealthRoutes(mockController);

      expect(routes).toHaveLength(1);

      expect(routes[0]).toEqual({
        method: 'GET',
        path: '/health',
        handler: mockController.getHealth,
      });
    });

    it('should create route with correct handler reference', () => {
      const routes: RouteDefinition[] = createHealthRoutes(mockController);

      expect(routes[0]?.handler).toBe(mockController.getHealth);
    });

    it('should create route without middleware by default', () => {
      const routes: RouteDefinition[] = createHealthRoutes(mockController);

      expect(routes[0]?.middleware).toBeUndefined();
    });
  });
});
