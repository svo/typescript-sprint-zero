import { HttpRequest, HttpResponse, MiddlewareHandler } from '../adapters/server.adapter';

interface AuthenticationService {
  authenticate(credentials: { username: string; password: string }): Promise<boolean>;
}

const sendUnauthorizedResponse = (res: HttpResponse, message: string): void => {
  res.status(401).json({ error: 'Unauthorized', message });
};

const parseBasicAuthCredentials = (
  authHeader: string
): { username: string; password: string } | null => {
  const base64Credentials = authHeader.replace('Basic ', '');
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  return username && password ? { username, password } : null;
};

type AuthResult = { success: true } | { success: false; message: string };

const validateAndAuthenticate = async (
  authHeader: string | undefined,
  authenticator: AuthenticationService
): Promise<AuthResult> => {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { success: false, message: 'Missing or invalid authorization header' };
  }

  const credentials = parseBasicAuthCredentials(authHeader);
  if (!credentials) {
    return { success: false, message: 'Invalid credentials format' };
  }

  const isAuthenticated = await authenticator.authenticate(credentials);
  if (!isAuthenticated) {
    return { success: false, message: 'Invalid credentials' };
  }

  return { success: true };
};

export const createAuthMiddleware = (authenticator: AuthenticationService): MiddlewareHandler => {
  return async (req: HttpRequest, res: HttpResponse, next: () => void): Promise<void> => {
    try {
      const result = await validateAndAuthenticate(req.headers['authorization'], authenticator);

      if (result.success) {
        next();
      } else {
        sendUnauthorizedResponse(res, result.message);
      }
    } catch (error) {
      res.status(500).json({ error: 'InternalServerError', message: 'Authentication failed' });
    }
  };
};
