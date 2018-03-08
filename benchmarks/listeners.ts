import * as http from 'http';
import { Application, Router, Stack, TextResult } from '../';

export const httpListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
  if (req.method === 'GET' && req.url!.split('?')[0].startsWith('/foo/bar')) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Hello, world.');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
};

export const stackListener = new Stack()
  .use(async (ctx, next) => {
    if (ctx.request.method === 'GET' && ctx.request.url!.split('?')[0].startsWith('/foo/bar')) {
      ctx.response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      ctx.response.end('Hello, world.');
    } else {
      ctx.response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      ctx.response.end('Not Found');
    }
  })
  .setErrorHandler(async (err, ctx) => {
    // tslint:disable-next-line:no-console
    console.error(err);
  })
  .asListener();

export const appListener = new Application()
  .GET('/foo/bar', async (ctx) => {
    return TextResult('Hello, world.');
  })
  .asListener();
