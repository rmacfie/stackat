import * as Benchmark from 'benchmark';
import * as http from 'http';
import { Application, Router, Stack, TextResult } from '../';

const mock = {
  req: {
    method: 'GET',
    url: '/foo/bar',
    connection: {},
    headers: { host: 'localhost' },
  } as http.IncomingMessage,
  res: {
    writeHead: (statusCode: number, headers: { [key: string]: string }) => {
      if (statusCode !== 200) {
        throw new Error('expected statusCode 200, but it was ' + statusCode);
      } else if (!headers || headers['Content-Type'] !== 'text/plain; charset=utf-8') {
        throw new Error(`expected content type 'text/plain; charset=utf-8', but it was '${headers && headers['Content-Type']}'`);
      }
    },
    end: (body: string) => {
      if (body !== 'Hello, world.') {
        throw new Error(`expected body 'Hello, world.', but it was '${body}'`);
      }
    },
  } as http.ServerResponse,
};

const httpListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
  if (req.method === 'GET' && req.url === '/foo/bar') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Hello, world.');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
};

const stackListener = new Stack()
  .use(async (ctx, next) => {
    if (ctx.request.method === 'GET' && ctx.request.url === '/foo/bar') {
      ctx.response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      ctx.response.end('Hello, world.');
    } else {
      await next();
    }
  })
  .setErrorHandler(async (err, ctx) => {
    // tslint:disable-next-line:no-console
    console.error(err);
  })
  .asListener();

const appListener = new Application()
  .GET('/foo/bar', async (ctx) => {
    return TextResult('Hello, world.');
  })
  .asListener();

const suite = new Benchmark.Suite('request.handling')
  .add('http', () => httpListener(mock.req, mock.res))
  .add('stack', () => stackListener(mock.req, mock.res))
  .add('app', () => appListener(mock.req, mock.res));

suite.on('cycle', (e: any) => {
  // tslint:disable-next-line:no-console
  console.log(String(e.target));
});

suite.run({ async: true });
