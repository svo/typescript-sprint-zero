import { Request, Response, NextFunction } from 'express';
import {
  Authenticator,
  AuthenticationCredentials,
} from '../../../infrastructure/security/basic-authenticator';
import { createErrorResponseDto } from '../dto/user.dto';

export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
  };
}

const sendUnauthorizedError = (res: Response, message: string): void => {
  res.status(401).json(createErrorResponseDto('UnauthorizedError', message));
};

const parseBasicAuthCredentials = (authHeader: string): AuthenticationCredentials | null => {
  const base64Credentials = authHeader.slice('Basic '.length);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  return username && password ? { username, password } : null;
};

type AuthResult =
  | { success: true; credentials: AuthenticationCredentials }
  | { success: false; message: string };

const validateAndAuthenticate = async (
  authHeader: string | undefined,
  authenticator: Authenticator
): Promise<AuthResult> => {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { success: false, message: 'Basic authentication required' };
  }

  const credentials = parseBasicAuthCredentials(authHeader);
  if (!credentials) {
    return { success: false, message: 'Invalid authentication credentials' };
  }

  const isAuthenticated = await authenticator.authenticate(credentials);
  if (!isAuthenticated) {
    return { success: false, message: 'Invalid username or password' };
  }

  return { success: true, credentials };
};

export const createAuthMiddleware = (authenticator: Authenticator) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await validateAndAuthenticate(req.headers.authorization, authenticator);

      if (result.success) {
        req.user = { username: result.credentials.username };
        next();
      } else {
        sendUnauthorizedError(res, result.message);
      }
    } catch (error) {
      sendUnauthorizedError(res, 'Authentication failed');
    }
  };
};
