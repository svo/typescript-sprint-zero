import { Request, Response } from 'express';
import { HealthUseCase } from '../../../application/use-case/health.use-case';
import { healthResponseDto, HealthResponseDto } from '../dto/health.dto';

export class HealthController {
  constructor(private readonly healthUseCase: HealthUseCase) {}

  getHealth = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.healthUseCase.execute();
      const responseDto: HealthResponseDto = healthResponseDto(result.health);

      const statusCode = this.getHttpStatusFromHealth(result.health.status);
      res.status(statusCode).json(responseDto);
    } catch (error) {
      res.status(503).json({
        error: 'ServiceUnavailable',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  };

  private getHttpStatusFromHealth(status: string): number {
    switch (status) {
      case 'healthy':
        return 200;
      case 'degraded':
        return 200;
      case 'unhealthy':
        return 503;
      default:
        return 503;
    }
  }
}
