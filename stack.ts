import * as http from 'http';

export type StackContext<TState> = {
  request: http.IncomingMessage;
  response: http.ServerResponse;
  state: TState;
};

export type StackErrorHandler<TState>
  = (err: any, ctx: StackContext<TState>) => Promise<void>;

export type StackDefaultHandler<TState>
  = (ctx: StackContext<TState>) => Promise<void>;

export type StackMiddleware<TState>
  = (ctx: StackContext<TState>, next: () => Promise<void>) => Promise<void>;

export class Stack<TState = {}> {
  private readonly stack: StackMiddleware<TState>[] = [];
  private errorHandler: StackErrorHandler<TState> = initialErrorHandler;
  private defaultHandler: StackDefaultHandler<TState> | null = null;

  asListener() {
    return this.httpListener;
  }

  use(middleware: StackMiddleware<TState>) {
    if (middleware == null) {
      throw new Error(`The middleware must not be null or undefined`);
    } else if (typeof middleware !== 'function') {
      throw new Error(`The middleware must be a function`);
    }
    this.stack.push(middleware);
  }

  setErrorHandler(errorHandler: StackErrorHandler<TState>) {
    if (errorHandler == null) {
      throw new Error(`The errorHandler must not be null or undefined`);
    } else if (typeof errorHandler !== 'function') {
      throw new Error(`The errorHandler must be a function`);
    }
    this.errorHandler = errorHandler;
  }

  setDefaultHandler(defaultHandler: StackDefaultHandler<TState>) {
    if (defaultHandler == null) {
      throw new Error(`The defaultHandler must not be null or undefined`);
    } else if (typeof defaultHandler !== 'function') {
      throw new Error(`The defaultHandler must be a function`);
    }
    this.defaultHandler = defaultHandler;
  }

  listen(port: number = 5000, callback?: (err: any, port: number) => void) {
    const server = http.createServer(this.asListener());
    server.listen(port, (err: any) => {
      if (callback) {
        callback(err, port);
      } else if (err) {
        // tslint:disable-next-line:no-console
        console.error(`Stack failed to start`, err);
      } else {
        // tslint:disable-next-line:no-console
        console.info(`Stack started at http://localhost:${port}`);
      }
    });
    return server;
  }

  private readonly httpListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const ctx: StackContext<TState> = {
      request: req,
      response: res,
      state: {} as any,
    };
    this.next(0, ctx).catch((err) => {
      this.errorHandler(err, ctx);
    });
  }

  private readonly next = async (i: number, ctx: StackContext<TState>) => {
    if (this.stack.length < i + 1) {
      if (this.defaultHandler != null) {
        await this.defaultHandler(ctx);
      }
      return;
    }
    const middleware = this.stack[i];
    await middleware(ctx, async () => {
      await this.next(i + 1, ctx);
    });
  }
}

const initialErrorHandler: StackErrorHandler<any> = (err, ctx) => {
  ctx.response.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
  ctx.response.end('# Internal Server Error\n\n' + err);
  // tslint:disable-next-line:no-console
  console.error('Unhandled error', err);
  return Promise.resolve();
};
