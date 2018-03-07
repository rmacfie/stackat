import * as http from 'http';
import { StackMiddleware } from './stack';
import { HTTPMethod, Tree } from './tree';

export interface RouteContext<TState> {
  request: http.IncomingMessage;
  response: http.ServerResponse;
  state: TState;
  method: HTTPMethod;
  scheme: 'http' | 'https';
  host: string;
  path: string;
  queryString: string;
  params: { [key: string]: string };
  query: { [key: string]: string };
}

export type RouteHandler<TState> =
  (ctx: RouteContext<TState>) => Promise<void>;

export class Router<TState = {}> {
  private readonly handlers = new Tree<RouteHandler<TState>>();

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

  on(method: HTTPMethod | HTTPMethod[], path: string, handler: RouteHandler<TState>) {
    if (handler == null) {
      throw new Error(`The handler must not be null or undefined`);
    } else if (typeof handler !== 'function') {
      throw new Error(`The handler must be a function`);
    }
    this.handlers.add(Array.isArray(method) ? method : [method], path, handler);
  }

  asMiddleware(): StackMiddleware<TState> {
    return this.stackMiddleware;
  }

  private readonly stackMiddleware: StackMiddleware<TState> = async (ctx, next) => {
    const method = ctx.request.method;
    const url = ctx.request.url;

    if (typeof method !== 'string') {
      throw new Error(`The HTTP method assigned to the request is not a string`);
    } else if (typeof url !== 'string' || url[0] !== '/') {
      throw new Error(`The URL assigned to the request is not a valid path (must be a string starting with '/')`);
    }

    const { path, queryString } = this.parseRequestUrl(url);
    const match = this.handlers.lookup(method as HTTPMethod, path);

    if (match == null) {
      // no match
      return await next();
    } else if (method === 'OPTIONS') {
      // client is asking for allowed methods
      ctx.response.writeHead(200, { Allow: match.options.join(', ') });
      ctx.response.end();
    } else if (match.data == null) {
      // client can't use the requested method on this route
      ctx.response.writeHead(405, { Allow: match.options.join(', ') });
      ctx.response.end();
    } else {
      // call the handler
      const conn = ctx.request.connection;
      const https = (conn as any).encrypted ? true : false;
      const scheme = https ? 'https' : 'http';
      await match.data({
        request: ctx.request,
        response: ctx.response,
        state: ctx.state,
        method: method as HTTPMethod,
        scheme: scheme,
        host: ctx.request.headers.host as string,
        path: path,
        queryString: queryString,
        params: match.params,
        query: this.parseQuery(queryString),
      });
    }
  }

  private readonly parseRequestUrl = (url: string) => {
    const pair = this.splitOnFirst(url, '?');
    return {
      path: decodeURIComponent(pair[0]),
      queryString: pair[1] == null ? '' : decodeURIComponent(pair[1]),
    };
  }

  private readonly parseQuery = (queryString: string) => {
    const query: { [key: string]: string } = {};
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const parts = this.splitOnFirst(pair, '=');
      if (parts[0] !== '') {
        const key = parts[0];
        const value = parts.length < 2 ? '' : parts[1];
        query[key] = value;
      }
    }
    return query;
  }

  private readonly splitOnFirst = (source: string, separator: string): [string, string] => {
    const i = source.indexOf(separator);
    if (i === -1) {
      return [source, ''];
    } else {
      return [source.substr(0, i), source.substr(i + separator.length)];
    }
  }
}
