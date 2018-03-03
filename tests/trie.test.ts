import { Method, Trie } from '../trie';

type Data = { m: Method, p: string };
let subject: Trie<Data>;

beforeAll(() => {
  subject = new Trie();
  subject.insert('GET', '/some/static/path', { m: 'GET', p: '/some/static/path' });
  subject.insert('POST', '/some/static/path', { m: 'POST', p: '/some/static/path' });
});

test('finds exact static path', () => {
  const match = subject.lookup('GET', '/some/static/path');
  expect(match.data).toMatchObject({ m: 'GET', p: '/some/static/path' });
});
