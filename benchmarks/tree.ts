import * as Benchmark from 'benchmark';
import { Tree } from '../lib/tree';

const tree = new Tree<number>()
  .add(['GET'], '/', 1)
  .add(['GET'], '/foo', 2)
  .add(['GET'], '/foo/bar', 3)
  .add(['GET'], '/foo/:bar', 4)
  .add(['GET'], '/foobar/*foobar', 5)
  .add(['GET'], '/some/url', 6);

const suite = new Benchmark.Suite('tree.lookup')
  .add('root', () => tree.lookup('GET', '/') != null)
  .add('static', () => tree.lookup('GET', '/foo/bar') != null)
  .add('parameter', () => tree.lookup('GET', '/foo/my-param') != null)
  .add('wildcard', () => tree.lookup('GET', '/foobar/my/wildcard/match') != null)
  .add('method-not-allowed', () => tree.lookup('POST', '/foo/bar') != null)
  .add('not-found', () => tree.lookup('GET', '/not/found') == null);

suite.on('cycle', (e: any) => {
  // tslint:disable-next-line:no-console
  console.log(String(e.target));
});

suite.run();
