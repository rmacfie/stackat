import * as http from 'http';

export type StackContext<TState> = {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  state: TState;
};

export type StackErrorHandler<TState>
  = (err: any, ctx: StackContext<TState>) => Promise<void>;

export type StackMiddleware<TState>
  = (ctx: StackContext<TState>, next: () => Promise<void>) => Promise<void>;

export class Stack<TState = {}> {
  private readonly stack: StackMiddleware<TState>[] = [];
  private errorHandler: StackErrorHandler<TState> = defaultErrorHandler;

  listener() {
    return (req: http.IncomingMessage, res: http.ServerResponse): void => {
      const ctx: StackContext<TState> = {
        req,
        res,
        state: {} as any,
      };
      this.next(0, ctx).catch((err) => {
        this.errorHandler(err, ctx);
      });
    };
  }

  use(middleware: StackMiddleware<TState>) {
    this.stack.push(middleware);
  }

  catch(errorHandler: StackErrorHandler<TState>) {
    this.errorHandler = errorHandler;
  }

  private async next(i: number, ctx: StackContext<TState>) {
    if (this.stack.length < i + 1) {
      return;
    }
    const middleware = this.stack[i];
    await middleware(ctx, async () => {
      await this.next(i + 1, ctx);
    });
  }
}

const defaultErrorHandler: StackErrorHandler<any> = (err, ctx) => {
  ctx.res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
  ctx.res.end('# Internal Server Error\n\n' + err);

  // tslint:disable-next-line:no-console
  console.error('Unhandled error', err);

  return Promise.resolve();
};
