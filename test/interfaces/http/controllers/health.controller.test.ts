import { Request, Response } from 'express';
import { HealthController } from '../../../../src/interfaces/http/controllers/health.controller';
import { HealthUseCase } from '../../../../src/application/use-case/health.use-case';
import {
  HealthStatus,
  createSystemHealth,
  createHealthCheck,
} from '../../../../src/domain/health/health-status';

describe('HealthController', () => {
  let healthController: HealthController;
  let mockHealthUseCase: jest.Mocked<HealthUseCase>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockHealthUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<HealthUseCase>;

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    healthController = new HealthController(mockHealthUseCase);
  });

  describe('getHealth', () => {
    it('should return 200 for healthy system', async () => {
      const healthChecks = [
        createHealthCheck('memory', HealthStatus.HEALTHY, 'Memory OK'),
        createHealthCheck('database', HealthStatus.HEALTHY, 'DB Connected'),
      ];
      const systemHealth = createSystemHealth(healthChecks);

      mockHealthUseCase.execute.mockResolvedValue({ health: systemHealth });

      await healthController.getHealth(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          checks: expect.any(Array),
          timestamp: expect.any(String),
        })
      );
    });

    it('should return 200 for degraded system', async () => {
      const healthChecks = [
        createHealthCheck('memory', HealthStatus.DEGRADED, 'High memory usage'),
        createHealthCheck('database', HealthStatus.HEALTHY, 'DB Connected'),
      ];
      const systemHealth = createSystemHealth(healthChecks);

      mockHealthUseCase.execute.mockResolvedValue({ health: systemHealth });

      await healthController.getHealth(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
        })
      );
    });

    it('should return 503 for unhealthy system', async () => {
      const healthChecks = [
        createHealthCheck('memory', HealthStatus.HEALTHY, 'Memory OK'),
        createHealthCheck('database', HealthStatus.UNHEALTHY, 'DB Disconnected'),
      ];
      const systemHealth = createSystemHealth(healthChecks);

      mockHealthUseCase.execute.mockResolvedValue({ health: systemHealth });

      await healthController.getHealth(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
        })
      );
    });

    it('should return 503 when health check throws error', async () => {
      mockHealthUseCase.execute.mockRejectedValue(new Error('Health check failed'));

      await healthController.getHealth(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'ServiceUnavailable',
        message: 'Health check failed',
        timestamp: expect.any(String),
      });
    });

    it('should handle unknown health status', async () => {
      const healthChecks = [createHealthCheck('test', 'unknown' as HealthStatus)];
      const systemHealth = {
        ...createSystemHealth(healthChecks),
        status: 'unknown' as HealthStatus,
      };

      mockHealthUseCase.execute.mockResolvedValue({ health: systemHealth });

      await healthController.getHealth(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
    });
  });
});
