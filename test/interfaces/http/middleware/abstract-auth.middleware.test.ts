import { createAuthMiddleware } from '../../../../src/interfaces/http/middleware/abstract-auth.middleware';
import { HttpRequest, HttpResponse } from '../../../../src/interfaces/http/adapters/server.adapter';

interface AuthenticationService {
  authenticate(credentials: { username: string; password: string }): Promise<boolean>;
}

describe('AbstractAuthMiddleware', () => {
  let mockAuthService: jest.Mocked<AuthenticationService>;
  let mockRequest: Partial<HttpRequest>;
  let mockResponse: jest.Mocked<HttpResponse>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockAuthService = {
      authenticate: jest.fn(),
    };

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      header: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('authentication', () => {
    it('should authenticate successfully with valid credentials', async () => {
      const credentials = Buffer.from('testuser:testpass').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };
      mockAuthService.authenticate.mockResolvedValue(true);

      const middleware = createAuthMiddleware(mockAuthService);
      await middleware(mockRequest as HttpRequest, mockResponse, mockNext);

      expect(mockAuthService.authenticate).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass',
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject missing authorization header', async () => {
      mockRequest.headers = {};

      const middleware = createAuthMiddleware(mockAuthService);
      await middleware(mockRequest as HttpRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-Basic authorization header', async () => {
      mockRequest.headers = { authorization: 'Bearer token123' };

      const middleware = createAuthMiddleware(mockAuthService);
      await middleware(mockRequest as HttpRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject malformed credentials', async () => {
      mockRequest.headers = { authorization: 'Basic invalidbase64' };

      const middleware = createAuthMiddleware(mockAuthService);
      await middleware(mockRequest as HttpRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid credentials format',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject empty username', async () => {
      const credentials = Buffer.from(':testpass').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };

      const middleware = createAuthMiddleware(mockAuthService);
      await middleware(mockRequest as HttpRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid credentials format',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject empty password', async () => {
      const credentials = Buffer.from('testuser:').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };

      const middleware = createAuthMiddleware(mockAuthService);
      await middleware(mockRequest as HttpRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid credentials format',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid credentials', async () => {
      const credentials = Buffer.from('testuser:wrongpass').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };
      mockAuthService.authenticate.mockResolvedValue(false);

      const middleware = createAuthMiddleware(mockAuthService);
      await middleware(mockRequest as HttpRequest, mockResponse, mockNext);

      expect(mockAuthService.authenticate).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'wrongpass',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      const credentials = Buffer.from('testuser:testpass').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };
      mockAuthService.authenticate.mockRejectedValue(new Error('Database error'));

      const middleware = createAuthMiddleware(mockAuthService);
      await middleware(mockRequest as HttpRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'Authentication failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle credentials without colon separator', async () => {
      const credentials = Buffer.from('testusernocolon').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };

      const middleware = createAuthMiddleware(mockAuthService);
      await middleware(mockRequest as HttpRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid credentials format',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions in authentication', async () => {
      const credentials = Buffer.from('testuser:testpass').toString('base64');
      mockRequest.headers = { authorization: `Basic ${credentials}` };
      mockAuthService.authenticate.mockRejectedValue('String error');

      const middleware = createAuthMiddleware(mockAuthService);
      await middleware(mockRequest as HttpRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'Authentication failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
