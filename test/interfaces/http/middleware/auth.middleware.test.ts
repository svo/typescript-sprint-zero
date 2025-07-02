import { Response, NextFunction } from 'express';
import {
  createAuthMiddleware,
  AuthenticatedRequest,
} from '../../../../src/interfaces/http/middleware/auth.middleware';
import { BasicAuthenticator } from '../../../../src/infrastructure/security/basic-authenticator';

describe('Auth Middleware', () => {
  let mockAuthenticator: jest.Mocked<BasicAuthenticator>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let authMiddleware: ReturnType<typeof createAuthMiddleware>;

  beforeEach(() => {
    mockAuthenticator = {
      authenticate: jest.fn(),
    } as unknown as jest.Mocked<BasicAuthenticator>;

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    authMiddleware = createAuthMiddleware(mockAuthenticator);
  });

  describe('authentication', () => {
    it('should authenticate successfully with valid credentials', async () => {
      const credentials = Buffer.from('admin:password').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };
      mockAuthenticator.authenticate.mockResolvedValue(true);

      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockAuthenticator.authenticate).toHaveBeenCalledWith({
        username: 'admin',
        password: 'password',
      });
      expect(mockRequest.user).toEqual({ username: 'admin' });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject missing authorization header', async () => {
      mockRequest.headers = {};

      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UnauthorizedError',
          message: 'Basic authentication required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-Basic authorization header', async () => {
      mockRequest.headers = { authorization: 'Bearer token123' };

      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UnauthorizedError',
          message: 'Basic authentication required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject malformed credentials', async () => {
      const credentials = Buffer.from('onlyusername').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };

      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UnauthorizedError',
          message: 'Invalid authentication credentials',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject empty username', async () => {
      const credentials = Buffer.from(':password').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };

      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UnauthorizedError',
          message: 'Invalid authentication credentials',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject empty password', async () => {
      const credentials = Buffer.from('username:').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };

      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UnauthorizedError',
          message: 'Invalid authentication credentials',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid credentials', async () => {
      const credentials = Buffer.from('admin:wrongpassword').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };
      mockAuthenticator.authenticate.mockResolvedValue(false);

      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UnauthorizedError',
          message: 'Invalid username or password',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      const credentials = Buffer.from('admin:password').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };
      mockAuthenticator.authenticate.mockRejectedValue(new Error('Database error'));

      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UnauthorizedError',
          message: 'Authentication failed',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
