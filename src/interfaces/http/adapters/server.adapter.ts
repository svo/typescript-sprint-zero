export interface HttpRequest {
  method: string;
  url: string;
  path: string;
  body: unknown;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
}

export interface HttpResponse {
  status(code: number): HttpResponse;
  json(data: unknown): void;
  send(data: string): void;
  header(name: string, value: string): HttpResponse;
  setHeader(name: string, value: string): HttpResponse;
}

export type HttpHandler = (req: HttpRequest, res: HttpResponse) => Promise<void> | void;
export type MiddlewareHandler = (
  req: HttpRequest,
  res: HttpResponse,
  next: () => void
) => Promise<void> | void;

export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: HttpHandler;
  middleware?: MiddlewareHandler[];
}

export interface ServerAdapter {
  addRoute(route: RouteDefinition): void;
  addMiddleware(middleware: MiddlewareHandler): void;
  addGlobalMiddleware(middleware: MiddlewareHandler): void;
  start(port: number): Promise<void>;
  stop(): Promise<void>;
  getFrameworkInstance(): unknown;
}

export interface ServerConfig {
  port: number;
  middleware?: {
    json?: boolean;
    urlencoded?: boolean;
    cors?: boolean;
  };
}
