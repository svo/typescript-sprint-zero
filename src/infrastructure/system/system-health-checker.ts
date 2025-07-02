import { HealthChecker } from '../../domain/health/health-checker';
import {
  SystemHealth,
  HealthStatus,
  createHealthCheck,
  createSystemHealth,
} from '../../domain/health/health-status';

export class SystemHealthChecker implements HealthChecker {
  async checkHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkMemory(),
      this.checkSystem(),
      this.checkApplication(),
    ]);

    return createSystemHealth(checks);
  }

  protected async checkMemory() {
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

      const status = heapUsedMB > 100 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;
      const message = `Heap: ${heapUsedMB}MB/${heapTotalMB}MB`;

      return createHealthCheck('memory', status, message);
    } catch (error) {
      /* istanbul ignore next */
      return createHealthCheck('memory', HealthStatus.UNHEALTHY, `Memory check failed: ${error}`);
    }
  }

  protected async checkSystem() {
    try {
      const uptime = process.uptime();
      const status = uptime > 0 ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
      const message = `Uptime: ${Math.round(uptime)}s`;

      return createHealthCheck('system', status, message);
    } catch (error) {
      /* istanbul ignore next */
      return createHealthCheck('system', HealthStatus.UNHEALTHY, `System check failed: ${error}`);
    }
  }

  protected async checkApplication() {
    try {
      return createHealthCheck('application', HealthStatus.HEALTHY, 'Application is running');
    } catch (error) {
      /* istanbul ignore next */
      return createHealthCheck(
        'application',
        HealthStatus.UNHEALTHY,
        `Application check failed: ${error}`
      );
    }
  }
}
