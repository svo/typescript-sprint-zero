import { SystemHealth } from './health-status';

export interface HealthChecker {
  checkHealth(): Promise<SystemHealth>;
}
