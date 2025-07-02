export interface HealthCheckDto {
  readonly name: string;
  readonly status: string;
  readonly message?: string;
  readonly timestamp: string;
}

export interface HealthResponseDto {
  readonly status: string;
  readonly checks: HealthCheckDto[];
  readonly timestamp: string;
}

export interface HealthCheckData {
  readonly name: string;
  readonly status: string;
  readonly message?: string;
  readonly timestamp: Date;
}

export interface SystemHealthData {
  readonly status: string;
  readonly checks: HealthCheckData[];
  readonly timestamp: Date;
}

export const healthCheckDto = (check: HealthCheckData): HealthCheckDto => {
  const dto: HealthCheckDto = {
    name: check.name,
    status: check.status,
    timestamp: check.timestamp.toISOString(),
  };

  if (check.message !== undefined) {
    (dto as { message: string }).message = check.message;
  }

  return dto;
};

export const healthResponseDto = (health: SystemHealthData): HealthResponseDto => ({
  status: health.status,
  checks: health.checks.map(healthCheckDto),
  timestamp: health.timestamp.toISOString(),
});
