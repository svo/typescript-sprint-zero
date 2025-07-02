import {
  HealthStatus,
  createHealthCheck,
  createSystemHealth,
} from '../../../src/domain/health/health-status';

describe('Health Status Domain', () => {
  describe('createHealthCheck', () => {
    it('should create a health check with required fields', () => {
      const healthCheck = createHealthCheck('database', HealthStatus.HEALTHY);

      expect(healthCheck.name).toBe('database');
      expect(healthCheck.status).toBe(HealthStatus.HEALTHY);
      expect(healthCheck.timestamp).toBeInstanceOf(Date);
      expect(healthCheck.message).toBeUndefined();
    });

    it('should create a health check with optional message', () => {
      const message = 'Connection successful';
      const healthCheck = createHealthCheck('database', HealthStatus.HEALTHY, message);

      expect(healthCheck.message).toBe(message);
    });
  });

  describe('createSystemHealth', () => {
    it('should return HEALTHY status when all checks are healthy', () => {
      const checks = [
        createHealthCheck('database', HealthStatus.HEALTHY),
        createHealthCheck('cache', HealthStatus.HEALTHY),
      ];

      const systemHealth = createSystemHealth(checks);

      expect(systemHealth.status).toBe(HealthStatus.HEALTHY);
      expect(systemHealth.checks).toEqual(checks);
      expect(systemHealth.timestamp).toBeInstanceOf(Date);
    });

    it('should return UNHEALTHY status when any check is unhealthy', () => {
      const checks = [
        createHealthCheck('database', HealthStatus.HEALTHY),
        createHealthCheck('cache', HealthStatus.UNHEALTHY),
      ];

      const systemHealth = createSystemHealth(checks);

      expect(systemHealth.status).toBe(HealthStatus.UNHEALTHY);
    });

    it('should return DEGRADED status when checks are mixed healthy and degraded', () => {
      const checks = [
        createHealthCheck('database', HealthStatus.HEALTHY),
        createHealthCheck('cache', HealthStatus.DEGRADED),
      ];

      const systemHealth = createSystemHealth(checks);

      expect(systemHealth.status).toBe(HealthStatus.DEGRADED);
    });

    it('should prioritize UNHEALTHY over DEGRADED status', () => {
      const checks = [
        createHealthCheck('database', HealthStatus.DEGRADED),
        createHealthCheck('cache', HealthStatus.UNHEALTHY),
      ];

      const systemHealth = createSystemHealth(checks);

      expect(systemHealth.status).toBe(HealthStatus.UNHEALTHY);
    });
  });
});
