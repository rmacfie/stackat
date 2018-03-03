import * as http from 'http';
import { Method, Registry } from './registry';

export interface Context<TRequestState> {
  request: http.IncomingMessage;
  response: http.ServerResponse;
  state: TRequestState;
}

export type Handler<TRequestState> =
  (ctx: Context<TRequestState>) => Promise<void>;

export class Router<TRequestState = {}> {
  private readonly registry = new Registry<Handler<TRequestState>>();

  GET(path: string, handler: Handler<TRequestState>): void {
    this.registry.add('GET', path, handler);
  }

  HEAD(path: string, handler: Handler<TRequestState>): void {
    this.registry.add('HEAD', path, handler);
  }

  POST(path: string, handler: Handler<TRequestState>): void {
    this.registry.add('POST', path, handler);
  }

  PUT(path: string, handler: Handler<TRequestState>): void {
    this.registry.add('PUT', path, handler);
  }

  DELETE(path: string, handler: Handler<TRequestState>): void {
    this.registry.add('DELETE', path, handler);
  }

  PATCH(path: string, handler: Handler<TRequestState>): void {
    this.registry.add('PATCH', path, handler);
  }
}
