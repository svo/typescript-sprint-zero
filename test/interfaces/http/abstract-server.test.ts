import { createAbstractServer } from '../../../src/interfaces/http/abstract-server';
import { ExpressServerAdapter } from '../../../src/interfaces/http/adapters/express-server.adapter';
import {
  ServerAdapter,
  HttpRequest,
  HttpResponse,
} from '../../../src/interfaces/http/adapters/server.adapter';
import { container } from 'tsyringe';

jest.mock('tsyringe', () => ({
  container: {
    resolve: jest.fn(),
  },
}));

describe('AbstractServer', () => {
  beforeEach(() => {
    const mockContainer = container as jest.Mocked<typeof container>;
    mockContainer.resolve.mockImplementation((token: unknown) => {
      if (token === 'BasicAuthenticator') {
        return { authenticate: jest.fn() };
      }
      return { execute: jest.fn() };
    });
  });
  describe('createAbstractServer', () => {
    it('should create server with default ExpressServerAdapter when no adapter provided', () => {
      const server = createAbstractServer();

      expect(server).toBeDefined();
      expect(server).toBeInstanceOf(ExpressServerAdapter);
    });

    it('should use provided adapter when adapter is given', () => {
      const mockAdapter: jest.Mocked<ServerAdapter> = {
        addRoute: jest.fn(),
        addMiddleware: jest.fn(),
        addGlobalMiddleware: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        getFrameworkInstance: jest.fn(),
      };

      const server = createAbstractServer(mockAdapter);

      expect(server).toBe(mockAdapter);
      expect(mockAdapter.addRoute).toHaveBeenCalledTimes(4);
    });

    it('should configure routes with proper paths and middleware', () => {
      const mockAdapter: jest.Mocked<ServerAdapter> = {
        addRoute: jest.fn(),
        addMiddleware: jest.fn(),
        addGlobalMiddleware: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        getFrameworkInstance: jest.fn(),
      };

      createAbstractServer(mockAdapter);

      const addRouteCalls = mockAdapter.addRoute.mock.calls;

      expect(addRouteCalls.length).toBe(4);

      const healthRoute = addRouteCalls.find(call => call[0].path === '/api/health');
      expect(healthRoute).toBeDefined();
      expect(healthRoute![0].method).toBe('GET');
      expect(healthRoute![0].middleware).toBeUndefined();

      const createUserRoute = addRouteCalls.find(
        call => call[0].path === '/api/users' && call[0].method === 'POST'
      );
      expect(createUserRoute).toBeDefined();
      expect(createUserRoute![0].middleware).toHaveLength(1);

      const getUserRoute = addRouteCalls.find(
        call => call[0].path === '/api/users/:id' && call[0].method === 'GET'
      );
      expect(getUserRoute).toBeDefined();
      expect(getUserRoute![0].middleware).toHaveLength(1);

      const rootRoute = addRouteCalls.find(call => call[0].path === '/');
      expect(rootRoute).toBeDefined();
      expect(rootRoute![0].method).toBe('GET');
    });

    it('should configure root endpoint handler correctly', async () => {
      const mockAdapter: jest.Mocked<ServerAdapter> = {
        addRoute: jest.fn(),
        addMiddleware: jest.fn(),
        addGlobalMiddleware: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        getFrameworkInstance: jest.fn(),
      };

      createAbstractServer(mockAdapter);

      const rootRoute = mockAdapter.addRoute.mock.calls.find(call => call[0].path === '/');
      expect(rootRoute).toBeDefined();

      const handler = rootRoute![0].handler;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
        header: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
      };

      await handler({} as HttpRequest, mockResponse as HttpResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'TypeScript Sprint Zero API',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          users: '/api/users',
        },
      });
    });
  });
});
