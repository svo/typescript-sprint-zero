import { SystemHealth } from '../../domain/health/health-status';
import { HealthChecker } from '../../domain/health/health-checker';

export interface HealthResponse {
  readonly health: SystemHealth;
}

export class HealthUseCase {
  constructor(private readonly healthChecker: HealthChecker) {}

  async execute(): Promise<HealthResponse> {
    const health = await this.healthChecker.checkHealth();
    return { health };
  }
}
