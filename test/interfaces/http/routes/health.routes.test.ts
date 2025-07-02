import { createHealthRoutes } from '../../../../src/interfaces/http/routes/health.routes';
import { HealthController } from '../../../../src/interfaces/http/controllers/health.controller';

describe('HealthRoutes', () => {
  let mockController: jest.Mocked<HealthController>;

  beforeEach(() => {
    mockController = {
      getHealth: jest.fn(),
    } as unknown as jest.Mocked<HealthController>;
  });

  describe('createHealthRoutes', () => {
    it('should return an Express router', () => {
      const router = createHealthRoutes(mockController);

      expect(router).toBeDefined();
      expect(typeof router).toBe('function');
    });

    it('should create router with health controller', () => {
      const router = createHealthRoutes(mockController);

      expect(typeof router).toBe('function');
      expect(router.stack).toBeDefined();
    });
  });
});
