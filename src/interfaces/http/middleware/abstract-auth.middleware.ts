import { HttpRequest, HttpResponse, MiddlewareHandler } from '../adapters/server.adapter';

interface AuthenticationService {
  authenticate(credentials: { username: string; password: string }): Promise<boolean>;
}

export const createAuthMiddleware = (authenticator: AuthenticationService): MiddlewareHandler => {
  return async (req: HttpRequest, res: HttpResponse, next: () => void): Promise<void> => {
    try {
      const authHeader = req.headers['authorization'];

      if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header',
        });
        return;
      }

      const base64Credentials = authHeader.replace('Basic ', '');
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');

      if (!username || !password) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials format',
        });
        return;
      }

      const isAuthenticated = await authenticator.authenticate({ username, password });

      if (!isAuthenticated) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Authentication failed',
      });
    }
  };
};
