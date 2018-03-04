import * as http from 'http';
import { StackMiddleware } from './stack';
import { HTTPMethod, Tree } from './tree';

export interface RouteContext<TState> {
  request: http.IncomingMessage;
  response: http.ServerResponse;
  state: TState;
}

export type RouteHandler<TState> =
  (ctx: RouteContext<TState>) => Promise<void>;

export class Router<TState = {}> {
  private readonly tree = new Tree<RouteHandler<TState>>();

  GET(path: string, handler: RouteHandler<TState>): void {
    this.on('GET', path, handler);
  }

  HEAD(path: string, handler: RouteHandler<TState>): void {
    this.on('HEAD', path, handler);
  }

  POST(path: string, handler: RouteHandler<TState>): void {
    this.on('POST', path, handler);
  }

  PUT(path: string, handler: RouteHandler<TState>): void {
    this.on('PUT', path, handler);
  }

  DELETE(path: string, handler: RouteHandler<TState>): void {
    this.on('DELETE', path, handler);
  }

  PATCH(path: string, handler: RouteHandler<TState>): void {
    this.on('PATCH', path, handler);
  }

  on(method: HTTPMethod, path: string, handler: RouteHandler<TState>) {
    if (handler == null) {
      throw new Error(`The handler must not be null or undefined`);
    } else if (typeof handler !== 'function') {
      throw new Error(`The handler must be a function`);
    }
    this.tree.add(method, path, handler);
  }

  get middlware(): StackMiddleware<TState> {
    return this.stackMiddleware;
  }

  private readonly stackMiddleware: StackMiddleware<TState> = async (ctx, next) => {
    const method = ctx.request.method;
    const path = ctx.request.url;

    if (typeof method !== 'string') {
      return await next();
    } else if (typeof path !== 'string' || path[0] !== '/') {
      return await next();
    }

    const match = this.tree.lookup(method as HTTPMethod, path);

    if (match == null) {
      // no match
      return await next();
    } else if (method === 'OPTIONS') {
      // client is asking for possible methods
      ctx.response.writeHead(200, { Allow: match.options.join(', ') });
      ctx.response.end();
    } else if (match.data == null) {
      // client can't use that method here
      ctx.response.writeHead(405, { Allow: match.options.join(', ') });
      ctx.response.end();
    } else {
      // call the handler
      await match.data(ctx);
    }
  }
}
