import { HealthUseCase } from '../../../application/use-case/health.use-case';
import { HttpRequest, HttpResponse } from '../adapters/server.adapter';
import { healthResponseDto } from '../dto/health.dto';

export class AbstractHealthController {
  constructor(private readonly getHealthUseCase: HealthUseCase) {}

  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Get system health status
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Health check successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [HEALTHY, DEGRADED, UNHEALTHY]
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: Health check failed
   */
  getHealth = async (_req: HttpRequest, res: HttpResponse): Promise<void> => {
    try {
      const result = await this.getHealthUseCase.execute();
      const responseDto = healthResponseDto(result.health);

      res.status(200).json(responseDto);
    } catch (error) {
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Health check failed',
      });
    }
  };
}
