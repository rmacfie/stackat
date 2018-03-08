import * as http from 'http';
import { EmptyResult, HTMLResult, HTTPStatusCode, JSONResult, ResultFunction, StatusResult, TextResult } from './result';
import { Router } from './router';
import { Stack } from './stack';
import { HTTPMethod } from './tree';

export interface Context<TState> {
  http: {
    request: http.IncomingMessage;
    response: http.ServerResponse;
  };
  state: TState;
  method: HTTPMethod;
  scheme: 'http' | 'https';
  host: string;
  path: string;
  params: { [key: string]: string };
  queryString: string;
  query: { [key: string]: string };
}

export type Handler<TContext, TState>
  = (ctx: TContext) => Promise<HandlerResult>;

export type HandlerResult
  = null | HTTPStatusCode | string | { [key: string]: any } | any[] | ResultFunction;

export type Middleware<TContext, TState>
  = (ctx: TContext, next: () => Promise<HandlerResult>) => Promise<HandlerResult>;

export class Application<TContext extends Context<TState> = Context<TState>, TState = { [key: string]: any }> {
  private readonly stack: Stack<TState>;
  private readonly router: Router<TState>;
  private readonly middlewares: Middleware<TContext, TState>[] = [];

  constructor(stack?: Stack<TState>, router?: Router<TState>) {
    this.stack = stack || new Stack();
    this.router = router || new Router();
    this.stack.setDefaultHandler(this.router.asDefaultHandler());
  }

  GET(path: string, handler: Handler<TContext, TState>) {
    return this.on('GET', path, handler);
  }

  HEAD(path: string, handler: Handler<TContext, TState>) {
    return this.on('HEAD', path, handler);
  }

  POST(path: string, handler: Handler<TContext, TState>) {
    return this.on('POST', path, handler);
  }

  PUT(path: string, handler: Handler<TContext, TState>) {
    return this.on('PUT', path, handler);
  }

  DELETE(path: string, handler: Handler<TContext, TState>) {
    return this.on('DELETE', path, handler);
  }

  PATCH(path: string, handler: Handler<TContext, TState>) {
    return this.on('PATCH', path, handler);
  }

  use(middleware: Middleware<TContext, TState>) {
    if (middleware == null) {
      throw new Error(`The middleware must not be null or undefined`);
    } else if (typeof middleware !== 'function') {
      throw new Error(`The middleware must be a function`);
    }
    this.middlewares.push(middleware);
    return this;
  }

  on(method: HTTPMethod | HTTPMethod[], path: string, handler: Handler<TContext, TState>) {
    if (handler == null) {
      throw new Error(`The handler must not be null or undefined`);
    } else if (typeof handler !== 'function') {
      throw new Error(`The handler must be a function`);
    }

    this.router.on(method, path, async (route) => {
      const ctx: Context<TState> = {
        http: {
          request: route.request,
          response: route.response,
        },
        state: route.state as TState,
        method: route.method,
        scheme: route.scheme,
        host: route.host,
        path: route.path,
        params: route.params,
        queryString: route.queryString,
        query: route.query,
      };

      const maybe = await this.next(0, ctx as TContext, handler);
      let func: ResultFunction;

      if (maybe == null) {
        func = EmptyResult();
      } else {
        switch (typeof maybe) {
          case 'number':
            func = StatusResult(maybe as any);
            break;
          case 'string':
            func = HTMLResult(maybe as any);
            break;
          case 'object':
            func = JSONResult(maybe);
            break;
          case 'function':
            func = maybe as ResultFunction;
            break;
          default:
            throw new Error('Unknown result type');
        }
      }

      await Promise.resolve(func(route.request, route.response));
    });

    return this;
  }

  asListener() {
    return this.stack.asListener();
  }

  listen(port: number = 5000, callback?: (err: any, port: number) => void) {
    this.stack.listen(port, callback);
  }

  private readonly next = (i: number, ctx: TContext, handler: Handler<TContext, TState>): Promise<HandlerResult> => {
    if (i < this.middlewares.length) {
      const middleware = this.middlewares[i];
      return middleware(ctx, () => {
        return this.next(i + 1, ctx, handler);
      });
    } else {
      return handler(ctx);
    }
  }
}
