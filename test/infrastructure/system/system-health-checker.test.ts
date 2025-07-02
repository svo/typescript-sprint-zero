import { SystemHealthChecker } from '../../../src/infrastructure/system/system-health-checker';
import { HealthStatus } from '../../../src/domain/health/health-status';

describe('SystemHealthChecker', () => {
  let healthChecker: SystemHealthChecker;

  beforeEach(() => {
    healthChecker = new SystemHealthChecker();
  });

  describe('checkHealth', () => {
    it('should return health status with all checks', async () => {
      const result = await healthChecker.checkHealth();

      expect(result.status).toBeDefined();
      expect(result.checks).toHaveLength(3);
      expect(result.timestamp).toBeInstanceOf(Date);

      const checkNames = result.checks.map(check => check.name);
      expect(checkNames).toContain('memory');
      expect(checkNames).toContain('system');
      expect(checkNames).toContain('application');
    });

    it('should include memory check with usage information', async () => {
      const result = await healthChecker.checkHealth();
      const memoryCheck = result.checks.find(check => check.name === 'memory');

      expect(memoryCheck).toBeDefined();
      expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED]).toContain(memoryCheck?.status);
      expect(memoryCheck?.message).toMatch(/Heap: \d+MB\/\d+MB/);
    });

    it('should return DEGRADED status when memory usage is high', async () => {
      const originalMemoryUsage = process.memoryUsage;
      const mockMemoryUsage = jest.fn().mockReturnValue({
        rss: 150 * 1024 * 1024,
        heapTotal: 120 * 1024 * 1024,
        heapUsed: 110 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024,
      });
      Object.defineProperty(process, 'memoryUsage', {
        value: mockMemoryUsage,
        configurable: true,
      });

      const result = await healthChecker.checkHealth();
      const memoryCheck = result.checks.find(check => check.name === 'memory');

      expect(memoryCheck?.status).toBe(HealthStatus.DEGRADED);
      expect(memoryCheck?.message).toBe('Heap: 110MB/120MB');

      Object.defineProperty(process, 'memoryUsage', {
        value: originalMemoryUsage,
        configurable: true,
      });
    });

    it('should return HEALTHY status when memory usage is low', async () => {
      const originalMemoryUsage = process.memoryUsage;
      const mockMemoryUsage = jest.fn().mockReturnValue({
        rss: 80 * 1024 * 1024,
        heapTotal: 90 * 1024 * 1024,
        heapUsed: 50 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024,
      });
      Object.defineProperty(process, 'memoryUsage', {
        value: mockMemoryUsage,
        configurable: true,
      });

      const result = await healthChecker.checkHealth();
      const memoryCheck = result.checks.find(check => check.name === 'memory');

      expect(memoryCheck?.status).toBe(HealthStatus.HEALTHY);
      expect(memoryCheck?.message).toBe('Heap: 50MB/90MB');

      Object.defineProperty(process, 'memoryUsage', {
        value: originalMemoryUsage,
        configurable: true,
      });
    });

    it('should include system check with uptime information', async () => {
      const result = await healthChecker.checkHealth();
      const systemCheck = result.checks.find(check => check.name === 'system');

      expect(systemCheck).toBeDefined();
      expect(systemCheck?.status).toBe(HealthStatus.HEALTHY);
      expect(systemCheck?.message).toMatch(/Uptime: \d+s/);
    });

    it('should return UNHEALTHY status when system uptime is zero or negative', async () => {
      const originalUptime = process.uptime;
      const mockUptime = jest.fn().mockReturnValue(0);
      Object.defineProperty(process, 'uptime', {
        value: mockUptime,
        configurable: true,
      });

      const result = await healthChecker.checkHealth();
      const systemCheck = result.checks.find(check => check.name === 'system');

      expect(systemCheck?.status).toBe(HealthStatus.UNHEALTHY);
      expect(systemCheck?.message).toBe('Uptime: 0s');

      Object.defineProperty(process, 'uptime', {
        value: originalUptime,
        configurable: true,
      });
    });

    it('should include application check as healthy', async () => {
      const result = await healthChecker.checkHealth();
      const applicationCheck = result.checks.find(check => check.name === 'application');

      expect(applicationCheck).toBeDefined();
      expect(applicationCheck?.status).toBe(HealthStatus.HEALTHY);
      expect(applicationCheck?.message).toBe('Application is running');
    });
  });

  describe('error handling', () => {
    it('should handle memory check errors gracefully', async () => {
      const originalMemoryUsage = process.memoryUsage;
      const mockMemoryUsage = jest.fn().mockImplementation(() => {
        throw new Error('Memory access denied');
      });
      Object.defineProperty(process, 'memoryUsage', {
        value: mockMemoryUsage,
        configurable: true,
      });

      const result = await healthChecker.checkHealth();
      const memoryCheck = result.checks.find(check => check.name === 'memory');

      expect(memoryCheck?.status).toBe(HealthStatus.UNHEALTHY);
      expect(memoryCheck?.message).toContain('Memory check failed');

      Object.defineProperty(process, 'memoryUsage', {
        value: originalMemoryUsage,
        configurable: true,
      });
    });

    it('should handle system check errors gracefully', async () => {
      const originalUptime = process.uptime;
      const mockUptime = jest.fn().mockImplementation(() => {
        throw new Error('Uptime access denied');
      });
      Object.defineProperty(process, 'uptime', {
        value: mockUptime,
        configurable: true,
      });

      const result = await healthChecker.checkHealth();
      const systemCheck = result.checks.find(check => check.name === 'system');

      expect(systemCheck?.status).toBe(HealthStatus.UNHEALTHY);
      expect(systemCheck?.message).toContain('System check failed');

      Object.defineProperty(process, 'uptime', {
        value: originalUptime,
        configurable: true,
      });
    });
  });
});
