import * as http from 'http';
import { Tree } from './tree';

export interface Context<TState> {
  request: http.IncomingMessage;
  response: http.ServerResponse;
  state: TState;
}

export type Handler<TState> =
  (ctx: Context<TState>) => Promise<void>;

export class Router<TState = {}> {
  private readonly tree = new Tree<Handler<TState>>();

  GET(path: string, handler: Handler<TState>): void {
    this.tree.add('GET', path, handler);
  }

  HEAD(path: string, handler: Handler<TState>): void {
    this.tree.add('HEAD', path, handler);
  }

  POST(path: string, handler: Handler<TState>): void {
    this.tree.add('POST', path, handler);
  }

  PUT(path: string, handler: Handler<TState>): void {
    this.tree.add('PUT', path, handler);
  }

  DELETE(path: string, handler: Handler<TState>): void {
    this.tree.add('DELETE', path, handler);
  }

  PATCH(path: string, handler: Handler<TState>): void {
    this.tree.add('PATCH', path, handler);
  }
}
