import { container } from 'tsyringe';
import { ServerAdapter } from './adapters/server.adapter';
import { ExpressServerAdapter } from './adapters/express-server.adapter';
import { createUserRoutes } from './routes/abstract-user.routes';
import { createHealthRoutes } from './routes/abstract-health.routes';
import { createAuthMiddleware } from './middleware/abstract-auth.middleware';
import { AbstractUserController } from './controllers/abstract-user.controller';
import { AbstractHealthController } from './controllers/abstract-health.controller';
import { CreateUserUseCase } from '../../application/use-case/create-user.use-case';
import { GetUserUseCase } from '../../application/use-case/get-user.use-case';
import { HealthUseCase } from '../../application/use-case/health.use-case';

interface AuthenticationService {
  authenticate(credentials: { username: string; password: string }): Promise<boolean>;
}

export const createAbstractServer = (adapter?: ServerAdapter): ServerAdapter => {
  const server = adapter || new ExpressServerAdapter();

  const createUserUseCase = container.resolve(CreateUserUseCase);
  const getUserUseCase = container.resolve(GetUserUseCase);
  const getHealthUseCase = container.resolve(HealthUseCase);
  const authenticator = container.resolve('BasicAuthenticator') as AuthenticationService;

  const userController = new AbstractUserController(createUserUseCase, getUserUseCase);
  const healthController = new AbstractHealthController(getHealthUseCase);
  const authMiddleware = createAuthMiddleware(authenticator);

  const userRoutes = createUserRoutes(userController);
  const healthRoutes = createHealthRoutes(healthController);

  healthRoutes.forEach(route => {
    server.addRoute({
      ...route,
      path: `/api${route.path}`,
    });
  });

  userRoutes.forEach(route => {
    server.addRoute({
      ...route,
      path: `/api${route.path}`,
      middleware: [authMiddleware],
    });
  });

  /**
   * @swagger
   * /:
   *   get:
   *     summary: Get API information
   *     tags: [General]
   *     responses:
   *       200:
   *         description: API information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 version:
   *                   type: string
   *                 endpoints:
   *                   type: object
   */
  server.addRoute({
    method: 'GET',
    path: '/',
    handler: async (_req, res) => {
      res.json({
        message: 'TypeScript Sprint Zero API',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          users: '/api/users',
        },
      });
    },
  });

  return server;
};
