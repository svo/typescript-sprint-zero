export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
}

export interface HealthCheck {
  readonly name: string;
  readonly status: HealthStatus;
  readonly message?: string;
  readonly timestamp: Date;
}

export interface SystemHealth {
  readonly status: HealthStatus;
  readonly checks: HealthCheck[];
  readonly timestamp: Date;
}

export const createHealthCheck = (
  name: string,
  status: HealthStatus,
  message?: string
): HealthCheck => {
  const healthCheck: HealthCheck = {
    name,
    status,
    timestamp: new Date(),
  };

  if (message !== undefined) {
    (healthCheck as { message: string }).message = message;
  }

  return healthCheck;
};

export const createSystemHealth = (checks: HealthCheck[]): SystemHealth => {
  const overallStatus = checks.every(check => check.status === HealthStatus.HEALTHY)
    ? HealthStatus.HEALTHY
    : checks.some(check => check.status === HealthStatus.UNHEALTHY)
      ? HealthStatus.UNHEALTHY
      : HealthStatus.DEGRADED;

  return {
    status: overallStatus,
    checks,
    timestamp: new Date(),
  };
};
