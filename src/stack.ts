import * as http from 'http';

export interface IContext<TState> {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  state: TState;
}

export type ErrorHandler<TState>
  = (err: any, ctx: IContext<TState>) => Promise<void>;

export type Middleware<TState>
  = (ctx: IContext<TState>, next: () => Promise<void>) => Promise<void>;

export default class Stack<TState = {}> {
  private readonly stack: Array<Middleware<TState>> = [];
  private errorHandler: ErrorHandler<TState> = defaultErrorHandler;

  public readonly listener = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    const ctx: IContext<TState> = {
      req,
      res,
      state: {} as any,
    };
    this.next(0, ctx).catch((err) => {
      this.errorHandler(err, ctx);
    });
  }

  public use(middleware: Middleware<TState>) {
    this.stack.push(middleware);
  }

  public catch(errorHandler: ErrorHandler<TState>) {
    this.errorHandler = errorHandler;
  }

  private async next(i: number, ctx: IContext<TState>) {
    if (this.stack.length < i + 1) {
      return;
    }
    const middleware = this.stack[i];
    await middleware(ctx, async () => {
      await this.next(i + 1, ctx);
    });
  }
}

export const defaultErrorHandler: ErrorHandler<any> = (err, ctx) => {
  ctx.res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
  ctx.res.end('# Internal Server Error\n\n' + err);

  // tslint:disable-next-line:no-console
  console.error('Unhandled error', err);

  return Promise.resolve();
};
