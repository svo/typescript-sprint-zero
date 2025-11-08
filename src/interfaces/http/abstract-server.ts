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

const resolveUseCases = () => ({
  createUserUseCase: container.resolve(CreateUserUseCase),
  getUserUseCase: container.resolve(GetUserUseCase),
  getHealthUseCase: container.resolve(HealthUseCase),
  authenticator: container.resolve('BasicAuthenticator') as AuthenticationService,
});

const setupControllers = (useCases: ReturnType<typeof resolveUseCases>) => ({
  userController: new AbstractUserController(useCases.createUserUseCase, useCases.getUserUseCase),
  healthController: new AbstractHealthController(useCases.getHealthUseCase),
  authMiddleware: createAuthMiddleware(useCases.authenticator),
});

type RouteConfig = {
  server: ServerAdapter;
  routes: ReturnType<typeof createUserRoutes> | ReturnType<typeof createHealthRoutes>;
  prefix: string;
  middleware?: ReturnType<typeof createAuthMiddleware>[];
};

const addApiRoutes = ({ server, routes, prefix, middleware }: RouteConfig) => {
  routes.forEach(route => {
    const routeConfig = {
      ...route,
      path: `${prefix}${route.path}`,
    };
    if (middleware) {
      server.addRoute({ ...routeConfig, middleware });
    } else {
      server.addRoute(routeConfig);
    }
  });
};

export const createAbstractServer = (adapter?: ServerAdapter): ServerAdapter => {
  const server = adapter || new ExpressServerAdapter();
  const useCases = resolveUseCases();
  const { userController, healthController, authMiddleware } = setupControllers(useCases);

  addApiRoutes({ server, routes: createHealthRoutes(healthController), prefix: '/api' });
  addApiRoutes({
    server,
    routes: createUserRoutes(userController),
    prefix: '/api',
    middleware: [authMiddleware],
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
