import { ExpressServerAdapter } from '../../../../src/interfaces/http/adapters/express-server.adapter';
import {
  HttpRequest,
  HttpResponse,
  RouteDefinition,
} from '../../../../src/interfaces/http/adapters/server.adapter';
import express from 'express';
import request from 'supertest';

describe('ExpressServerAdapter', () => {
  let adapter: ExpressServerAdapter;
  let app: express.Application;

  beforeEach(() => {
    adapter = new ExpressServerAdapter();
    app = adapter.getFrameworkInstance();
  });

  afterEach(async () => {
    await adapter.stop();
  });

  describe('constructor', () => {
    it('should create adapter with default middleware', () => {
      expect(adapter).toBeDefined();
      expect(app).toBeDefined();
    });

    it('should create adapter without json middleware when disabled', () => {
      const customAdapter = new ExpressServerAdapter({
        port: 3000,
        middleware: { json: false },
      });
      expect(customAdapter).toBeDefined();
    });

    it('should create adapter without urlencoded middleware when disabled', () => {
      const customAdapter = new ExpressServerAdapter({
        port: 3000,
        middleware: { urlencoded: false },
      });
      expect(customAdapter).toBeDefined();
    });
  });

  describe('addRoute', () => {
    it('should add GET route', async () => {
      const route: RouteDefinition = {
        method: 'GET',
        path: '/test',
        handler: async (_req: HttpRequest, res: HttpResponse) => {
          res.json({ message: 'test' });
        },
      };

      adapter.addRoute(route);

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'test' });
    });

    it('should add POST route', async () => {
      const route: RouteDefinition = {
        method: 'POST',
        path: '/test',
        handler: async (req: HttpRequest, res: HttpResponse) => {
          res.json({ received: req.body });
        },
      };

      adapter.addRoute(route);

      const response = await request(app).post('/test').send({ data: 'test' });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: { data: 'test' } });
    });

    it('should add PUT route', async () => {
      const route: RouteDefinition = {
        method: 'PUT',
        path: '/test',
        handler: async (_req: HttpRequest, res: HttpResponse) => {
          res.json({ method: 'PUT' });
        },
      };

      adapter.addRoute(route);

      const response = await request(app).put('/test');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ method: 'PUT' });
    });

    it('should add DELETE route', async () => {
      const route: RouteDefinition = {
        method: 'DELETE',
        path: '/test',
        handler: async (_req: HttpRequest, res: HttpResponse) => {
          res.json({ method: 'DELETE' });
        },
      };

      adapter.addRoute(route);

      const response = await request(app).delete('/test');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ method: 'DELETE' });
    });

    it('should add PATCH route', async () => {
      const route: RouteDefinition = {
        method: 'PATCH',
        path: '/test',
        handler: async (_req: HttpRequest, res: HttpResponse) => {
          res.json({ method: 'PATCH' });
        },
      };

      adapter.addRoute(route);

      const response = await request(app).patch('/test');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ method: 'PATCH' });
    });

    it('should add route with middleware', async () => {
      const middleware = jest.fn((_req: HttpRequest, _res: HttpResponse, next: () => void) => {
        next();
      });

      const route: RouteDefinition = {
        method: 'GET',
        path: '/test',
        handler: async (_req: HttpRequest, res: HttpResponse) => {
          res.json({ message: 'with middleware' });
        },
        middleware: [middleware],
      };

      adapter.addRoute(route);

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'with middleware' });
      expect(middleware).toHaveBeenCalled();
    });

    it('should handle async route handlers that throw errors', async () => {
      const route: RouteDefinition = {
        method: 'GET',
        path: '/error',
        handler: async () => {
          throw new Error('Test error');
        },
      };

      adapter.addRoute(route);

      const response = await request(app).get('/error');
      expect(response.status).toBe(500);
    });

    it('should handle async middleware that throws errors', async () => {
      const middleware = async () => {
        throw new Error('Middleware error');
      };

      const route: RouteDefinition = {
        method: 'GET',
        path: '/middleware-error',
        handler: async (_req: HttpRequest, res: HttpResponse) => {
          res.json({ message: 'should not reach here' });
        },
        middleware: [middleware],
      };

      adapter.addRoute(route);

      const response = await request(app).get('/middleware-error');
      expect(response.status).toBe(500);
    });
  });

  describe('addMiddleware', () => {
    it('should add global middleware', async () => {
      const middleware = jest.fn((_req: HttpRequest, _res: HttpResponse, next: () => void) => {
        next();
      });

      adapter.addMiddleware(middleware);

      const route: RouteDefinition = {
        method: 'GET',
        path: '/test',
        handler: async (_req: HttpRequest, res: HttpResponse) => {
          res.json({ message: 'test' });
        },
      };

      adapter.addRoute(route);

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(middleware).toHaveBeenCalled();
    });
  });

  describe('request/response adaptation', () => {
    it('should properly adapt request properties', async () => {
      const route: RouteDefinition = {
        method: 'GET',
        path: '/test/:id',
        handler: async (req: HttpRequest, res: HttpResponse) => {
          res.json({
            method: req.method,
            url: req.url,
            path: req.path,
            params: req.params,
            query: req.query,
            headers: req.headers['user-agent'],
          });
        },
      };

      adapter.addRoute(route);

      const response = await request(app)
        .get('/test/123?filter=active')
        .set('User-Agent', 'test-agent');

      expect(response.status).toBe(200);
      expect(response.body.method).toBe('GET');
      expect(response.body.params).toEqual({ id: '123' });
      expect(response.body.query).toEqual({ filter: 'active' });
      expect(response.body.headers).toBe('test-agent');
    });

    it('should properly adapt response methods', async () => {
      const route: RouteDefinition = {
        method: 'GET',
        path: '/test',
        handler: async (_req: HttpRequest, res: HttpResponse) => {
          res.status(201).header('X-Custom', 'value').json({ success: true });
        },
      };

      adapter.addRoute(route);

      const response = await request(app).get('/test');
      expect(response.status).toBe(201);
      expect(response.headers['x-custom']).toBe('value');
      expect(response.body).toEqual({ success: true });
    });

    it('should handle send method', async () => {
      const route: RouteDefinition = {
        method: 'GET',
        path: '/test',
        handler: async (_req: HttpRequest, res: HttpResponse) => {
          res.status(200).send('plain text response');
        },
      };

      adapter.addRoute(route);

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.text).toBe('plain text response');
    });

    it('should properly handle setHeader method', async () => {
      const route: RouteDefinition = {
        method: 'GET',
        path: '/test-setheader',
        handler: async (_req: HttpRequest, res: HttpResponse) => {
          res.setHeader('X-Custom-Header', 'custom-value');
          res.json({ message: 'header set' });
        },
      };

      adapter.addRoute(route);

      const response = await request(app).get('/test-setheader');
      expect(response.status).toBe(200);
      expect(response.headers['x-custom-header']).toBe('custom-value');
      expect(response.body.message).toBe('header set');
    });
  });

  describe('addGlobalMiddleware', () => {
    it('should add global middleware using addGlobalMiddleware method', async () => {
      const middleware = jest.fn((_req: HttpRequest, _res: HttpResponse, next: () => void) => {
        next();
      });

      adapter.addGlobalMiddleware(middleware);

      const route: RouteDefinition = {
        method: 'GET',
        path: '/test-global',
        handler: async (_req: HttpRequest, res: HttpResponse) => {
          res.json({ message: 'global middleware test' });
        },
      };

      adapter.addRoute(route);

      const response = await request(app).get('/test-global');
      expect(response.status).toBe(200);
      expect(middleware).toHaveBeenCalled();
    });
  });

  describe('server lifecycle', () => {
    it('should handle start and stop methods', async () => {
      expect(typeof adapter.start).toBe('function');
      expect(typeof adapter.stop).toBe('function');

      await expect(adapter.stop()).resolves.not.toThrow();
    });

    it('should start server and then stop it', async () => {
      const testAdapter = new ExpressServerAdapter();
      const port = 0;

      await testAdapter.start(port);
      expect((testAdapter as unknown as { server: { listening: boolean } }).server).toBeTruthy();
      expect((testAdapter as unknown as { server: { listening: boolean } }).server.listening).toBe(
        true
      );

      await testAdapter.stop();
      expect((testAdapter as unknown as { server: { listening: boolean } }).server.listening).toBe(
        false
      );
    });

    it('should handle start errors', async () => {
      const invalidAdapter = new ExpressServerAdapter();
      const mockListen = jest.fn((_port: number, callback: (err?: Error) => void) => {
        callback(new Error('Port in use'));
      });

      (invalidAdapter.getFrameworkInstance() as unknown as { listen: typeof mockListen }).listen =
        mockListen;

      await expect(invalidAdapter.start(8080)).rejects.toThrow('Port in use');
    });

    it('should handle stop errors', async () => {
      const testAdapter = new ExpressServerAdapter();
      const port = 0;
      await testAdapter.start(port);

      const originalServer = (testAdapter as unknown as { server: { close: () => void } }).server;
      const originalClose = originalServer.close.bind(originalServer);

      const mockClose = jest.fn((callback: (err?: Error) => void) => {
        callback(new Error('Close error'));
        originalClose();
      });

      (testAdapter as unknown as { server: { close: typeof mockClose } }).server.close = mockClose;

      await expect(testAdapter.stop()).rejects.toThrow('Close error');
    });
  });

  describe('getFrameworkInstance', () => {
    it('should return Express application instance', () => {
      const instance = adapter.getFrameworkInstance();
      expect(instance).toBe(app);
      expect(typeof instance.listen).toBe('function');
    });
  });
});
