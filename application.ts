import * as http from 'http';
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
  = (ctx: TContext) => Promise<Result<TState>>;

export type Middleware<TContext, TState>
  = (ctx: TContext, next: () => Promise<Result<TState>>) => Promise<Result<TState>>;

export type Result<TState>
  = null | number | string | ExecutableResult<TState>;

export interface ExecutableResult<TState> {
  execute(request: http.IncomingMessage, response: http.ServerResponse, state: TState): void;
}

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
      const ctx: TContext = {} as any;
      ctx.http = { request: stack.request, response: stack.response };
      ctx.state = stack.state;
      ctx.params = stack.params;
      const result = await handler(ctx);

      if (typeof result === 'string') {
        stack.response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        stack.response.write(result);
        stack.response.end();
      } else {
        throw new Error('Result type not handled yet');
      }
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
  }
}
