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
  params: { [key: string]: string };
}

export type Handler<TContext, TState>
  = (ctx: TContext) => Promise<HandlerResult>;

export type HandlerResult
  = null | HTTPStatusCode | string | { [key: string]: any } | { [key: string]: any }[] | ResultFunction;

export type Middleware<TContext, TState>
  = (ctx: TContext, next: () => Promise<HandlerResult>) => Promise<HandlerResult>;

export class Application<TContext extends Context<TState> = Context<TState>, TState = {}> {
  private readonly stack: Stack<TState>;
  private readonly router: Router<TState>;
  private readonly middlewares: Middleware<TContext, TState>[] = [];

  constructor(stack?: Stack<TState>, router?: Router<TState>) {
    this.stack = stack || new Stack();
    this.router = router || new Router();
    this.stack.use(this.router.middlware);
  }

  get listener() {
    return this.stack.listener;
  }

  GET(path: string, handler: Handler<TContext, TState>) {
    this.on('GET', path, handler);
  }

  HEAD(path: string, handler: Handler<TContext, TState>) {
    this.on('HEAD', path, handler);
  }

  POST(path: string, handler: Handler<TContext, TState>) {
    this.on('POST', path, handler);
  }

  PUT(path: string, handler: Handler<TContext, TState>) {
    this.on('PUT', path, handler);
  }

  DELETE(path: string, handler: Handler<TContext, TState>) {
    this.on('DELETE', path, handler);
  }

  PATCH(path: string, handler: Handler<TContext, TState>) {
    this.on('PATCH', path, handler);
  }

  use(middleware: Middleware<TContext, TState>) {
    if (middleware == null) {
      throw new Error(`The middleware must not be null or undefined`);
    } else if (typeof middleware !== 'function') {
      throw new Error(`The middleware must be a function`);
    }
    this.middlewares.push(middleware);
  }

  on(method: HTTPMethod, path: string, handler: Handler<TContext, TState>) {
    if (handler == null) {
      throw new Error(`The handler must not be null or undefined`);
    } else if (typeof handler !== 'function') {
      throw new Error(`The handler must be a function`);
    }

    this.router.on(method, path, async (stack) => {
      const ctx: Context<TState> = {
        http: { request: stack.request, response: stack.response },
        state: stack.state as TState,
        params: stack.params,
      };

      let result = await handler(ctx as TContext);

      if (result == null) {
        result = EmptyResult();
      } else if (typeof result === 'number') {
        result = StatusResult(result);
      } else if (typeof result === 'object') {
        result = JSONResult(result);
      } else if (typeof result !== 'function') {
        throw new Error('Unknown result type');
      }

      await Promise.resolve((result as ResultFunction)(stack.request, stack.response));
    });
  }

  start(port: number = 5000, callback?: (err: any, port: number) => void) {
    const server = http.createServer(this.listener);
    server.listen(port, (err: any) => {
      if (callback) {
        callback(err, port);
      } else if (err) {
        // tslint:disable-next-line:no-console
        console.error(`Application failed to start`, err);
      } else {
        // tslint:disable-next-line:no-console
        console.info(`Application started at http://localhost:${port}`);
      }
    });
    return server;
  }
}
