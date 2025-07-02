import express, { Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import {
  ServerAdapter,
  HttpRequest,
  HttpResponse,
  RouteDefinition,
  MiddlewareHandler,
  ServerConfig,
} from './server.adapter';

export class ExpressServerAdapter implements ServerAdapter {
  private app: express.Application;
  private server: Server | null = null;

  constructor(config?: ServerConfig) {
    this.app = express();
    this.setupDefaultMiddleware(config);
  }

  private setupDefaultMiddleware(config?: ServerConfig): void {
    if (config?.middleware?.json !== false) {
      this.app.use(express.json());
    }
    if (config?.middleware?.urlencoded !== false) {
      this.app.use(express.urlencoded({ extended: true }));
    }
  }

  private adaptRequest(req: Request): HttpRequest {
    return {
      method: req.method,
      url: req.url,
      path: req.path,
      body: req.body,
      params: req.params,
      query: req.query as Record<string, string>,
      headers: req.headers as Record<string, string>,
    };
  }

  private adaptResponse(res: Response): HttpResponse {
    return {
      status: (code: number) => {
        res.status(code);
        return this.adaptResponse(res);
      },
      json: (data: unknown) => {
        res.json(data);
      },
      send: (data: string) => {
        res.send(data);
      },
      header: (name: string, value: string) => {
        res.header(name, value);
        return this.adaptResponse(res);
      },
      setHeader: (name: string, value: string) => {
        res.setHeader(name, value);
        return this.adaptResponse(res);
      },
    };
  }

  private adaptMiddleware(middleware: MiddlewareHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      const adaptedReq = this.adaptRequest(req);
      const adaptedRes = this.adaptResponse(res);
      const result = middleware(adaptedReq, adaptedRes, next);

      if (result instanceof Promise) {
        result.catch(next);
      }
    };
  }

  addRoute(route: RouteDefinition): void {
    const handler = (req: Request, res: Response, next: NextFunction) => {
      const adaptedReq = this.adaptRequest(req);
      const adaptedRes = this.adaptResponse(res);
      const result = route.handler(adaptedReq, adaptedRes);

      if (result instanceof Promise) {
        result.catch(next);
      }
    };

    const middlewares = route.middleware
      ? route.middleware.map(mw => this.adaptMiddleware(mw))
      : [];

    switch (route.method) {
      case 'GET':
        this.app.get(route.path, ...middlewares, handler);
        break;
      case 'POST':
        this.app.post(route.path, ...middlewares, handler);
        break;
      case 'PUT':
        this.app.put(route.path, ...middlewares, handler);
        break;
      case 'DELETE':
        this.app.delete(route.path, ...middlewares, handler);
        break;
      case 'PATCH':
        this.app.patch(route.path, ...middlewares, handler);
        break;
    }
  }

  addMiddleware(middleware: MiddlewareHandler): void {
    this.app.use(this.adaptMiddleware(middleware));
  }

  addGlobalMiddleware(middleware: MiddlewareHandler): void {
    this.addMiddleware(middleware);
  }

  async start(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err?: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  getFrameworkInstance(): express.Application {
    return this.app;
  }
}
