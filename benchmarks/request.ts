import * as Benchmark from 'benchmark';
import * as http from 'http';
import { appListener, httpListener, stackListener } from './listeners';

const mock = {
  req: {
    method: 'GET',
    url: '/foo/bar?x=y',
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

const suite = new Benchmark.Suite('request.handling')
  .add('http', () => httpListener(mock.req, mock.res))
  .add('stack', () => stackListener(mock.req, mock.res))
  .add('app', () => appListener(mock.req, mock.res));

suite.on('cycle', (e: any) => {
  // tslint:disable-next-line:no-console
  console.log(String(e.target));
});

suite.run({ async: true });
