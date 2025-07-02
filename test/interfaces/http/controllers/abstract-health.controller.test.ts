import { AbstractHealthController } from '../../../../src/interfaces/http/controllers/abstract-health.controller';
import { HealthUseCase } from '../../../../src/application/use-case/health.use-case';
import { HttpRequest, HttpResponse } from '../../../../src/interfaces/http/adapters/server.adapter';
import {
  HealthStatus,
  createSystemHealth,
  createHealthCheck,
} from '../../../../src/domain/health/health-status';

describe('AbstractHealthController', () => {
  let controller: AbstractHealthController;
  let mockHealthUseCase: jest.Mocked<HealthUseCase>;
  let mockRequest: Partial<HttpRequest>;
  let mockResponse: jest.Mocked<HttpResponse>;

  beforeEach(() => {
    mockHealthUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<HealthUseCase>;

    controller = new AbstractHealthController(mockHealthUseCase);

    mockRequest = {};

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      header: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
  });

  describe('getHealth', () => {
    it('should return 200 for healthy system', async () => {
      const healthChecks = [
        createHealthCheck('memory', HealthStatus.HEALTHY, 'Memory usage OK'),
        createHealthCheck('system', HealthStatus.HEALTHY, 'System uptime OK'),
        createHealthCheck('application', HealthStatus.HEALTHY, 'Application running'),
      ];
      const systemHealth = createSystemHealth(healthChecks);

      mockHealthUseCase.execute.mockResolvedValue({ health: systemHealth });

      await controller.getHealth(mockRequest as HttpRequest, mockResponse);

      expect(mockHealthUseCase.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HealthStatus.HEALTHY,
        checks: [
          {
            name: 'memory',
            status: HealthStatus.HEALTHY,
            message: 'Memory usage OK',
            timestamp: expect.any(String),
          },
          {
            name: 'system',
            status: HealthStatus.HEALTHY,
            message: 'System uptime OK',
            timestamp: expect.any(String),
          },
          {
            name: 'application',
            status: HealthStatus.HEALTHY,
            message: 'Application running',
            timestamp: expect.any(String),
          },
        ],
        timestamp: expect.any(String),
      });
    });

    it('should return 200 for degraded system', async () => {
      const healthChecks = [
        createHealthCheck('memory', HealthStatus.DEGRADED, 'Memory usage high'),
        createHealthCheck('system', HealthStatus.HEALTHY, 'System uptime OK'),
        createHealthCheck('application', HealthStatus.HEALTHY, 'Application running'),
      ];
      const systemHealth = createSystemHealth(healthChecks);

      mockHealthUseCase.execute.mockResolvedValue({ health: systemHealth });

      await controller.getHealth(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HealthStatus.DEGRADED,
        checks: expect.arrayContaining([
          expect.objectContaining({
            name: 'memory',
            status: HealthStatus.DEGRADED,
            message: 'Memory usage high',
          }),
        ]),
        timestamp: expect.any(String),
      });
    });

    it('should return 200 for unhealthy system', async () => {
      const healthChecks = [
        createHealthCheck('memory', HealthStatus.UNHEALTHY, 'Memory exhausted'),
        createHealthCheck('system', HealthStatus.HEALTHY, 'System uptime OK'),
        createHealthCheck('application', HealthStatus.HEALTHY, 'Application running'),
      ];
      const systemHealth = createSystemHealth(healthChecks);

      mockHealthUseCase.execute.mockResolvedValue({ health: systemHealth });

      await controller.getHealth(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HealthStatus.UNHEALTHY,
        checks: expect.arrayContaining([
          expect.objectContaining({
            name: 'memory',
            status: HealthStatus.UNHEALTHY,
            message: 'Memory exhausted',
          }),
        ]),
        timestamp: expect.any(String),
      });
    });

    it('should return 500 when health check throws error', async () => {
      mockHealthUseCase.execute.mockRejectedValue(new Error('Health check failed'));

      await controller.getHealth(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'Health check failed',
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockHealthUseCase.execute.mockRejectedValue('String error');

      await controller.getHealth(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'Health check failed',
      });
    });

    it('should handle health checks without messages', async () => {
      const healthChecks = [
        createHealthCheck('memory', HealthStatus.HEALTHY),
        createHealthCheck('system', HealthStatus.HEALTHY),
        createHealthCheck('application', HealthStatus.HEALTHY),
      ];
      const systemHealth = createSystemHealth(healthChecks);

      mockHealthUseCase.execute.mockResolvedValue({ health: systemHealth });

      await controller.getHealth(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HealthStatus.HEALTHY,
        checks: [
          {
            name: 'memory',
            status: HealthStatus.HEALTHY,
            timestamp: expect.any(String),
          },
          {
            name: 'system',
            status: HealthStatus.HEALTHY,
            timestamp: expect.any(String),
          },
          {
            name: 'application',
            status: HealthStatus.HEALTHY,
            timestamp: expect.any(String),
          },
        ],
        timestamp: expect.any(String),
      });
    });
  });
});
