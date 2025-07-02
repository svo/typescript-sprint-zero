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

export const createAuthMiddleware = (authenticator: Authenticator) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res
        .status(401)
        .json(createErrorResponseDto('UnauthorizedError', 'Basic authentication required'));
      return;
    }

    try {
      const base64Credentials = authHeader.slice('Basic '.length);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');

      if (!username || !password) {
        res
          .status(401)
          .json(createErrorResponseDto('UnauthorizedError', 'Invalid authentication credentials'));
        return;
      }

      const authCredentials: AuthenticationCredentials = { username, password };
      const isAuthenticated = await authenticator.authenticate(authCredentials);

      if (!isAuthenticated) {
        res
          .status(401)
          .json(createErrorResponseDto('UnauthorizedError', 'Invalid username or password'));
        return;
      }

      req.user = { username };
      next();
    } catch (error) {
      res.status(401).json(createErrorResponseDto('UnauthorizedError', 'Authentication failed'));
    }
  };
};
