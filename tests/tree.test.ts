import { Tree } from '../tree';

let subject: Tree<number>;

beforeEach(() => {
  subject = new Tree<number>();
});

describe('add', () => {
  describe('validation', () => {
    test('method', () => {
      expect(() => subject.add([''] as any, '/foo/bar', 1)).toThrow();
      expect(() => subject.add([null] as any, '/foo/bar', 1)).toThrow();
      expect(() => subject.add(undefined as any, '/foo/bar', 1)).toThrow();
      expect(() => subject.add(['NONE'] as any, '/foo/bar', 1)).toThrow();
      expect(() => subject.add([true] as any, '/foo/bar', 1)).toThrow();
    });

    test('pattern', () => {
      expect(() => subject.add(['GET'], '', 1)).toThrow();
      expect(() => subject.add(['GET'], null as any, 1)).toThrow();
      expect(() => subject.add(['GET'], undefined as any, 1)).toThrow();
      expect(() => subject.add(['GET'], true as any, 1)).toThrow();
      expect(() => subject.add(['GET'], 'no/leading/slash', 1)).toThrow();
      expect(() => subject.add(['GET'], '/trailing/slash/', 1)).toThrow();
      expect(() => subject.add(['GET'], '/multi//slash', 1)).toThrow();
    });

    test('data', () => {
      expect(() => subject.add(['GET'], '/foo/bar', null as any)).toThrow();
      expect(() => subject.add(['GET'], '/foo/bar', undefined as any)).toThrow();
    });

    test('conflicts', () => {
      subject.add(['GET'], '/foo/bar', 1);
      subject.add(['GET'], '/foo/param/:bar', 2);
      subject.add(['GET'], '/foo/wild/:bar', 3);
      expect(() => subject.add(['GET'], '/foo/bar', 1)).toThrow();
      expect(() => subject.add(['POST'], '/foo/bar', 1)).not.toThrow();
      expect(() => subject.add(['GET'], '/foo/baz', 1)).not.toThrow();
      expect(() => subject.add(['GET'], '/foo/param/*baz', 2)).toThrow();
      expect(() => subject.add(['GET'], '/foo/wild/:baz', 3)).toThrow();
    });

    test('wildcard format', () => {
      expect(() => subject.add(['GET'], '/foo/bar/*anything/', 1)).toThrow();
      expect(() => subject.add(['GET'], '/foo/bar/*anything/stuff', 1)).toThrow();
      expect(() => subject.add(['GET'], '/foo/bar/*anything', 1)).not.toThrow();
    });
  });
});

describe('lookup', () => {
  describe('matching', () => {
    beforeEach(() => {
      subject.add(['GET'], '/', 1);
      subject.add(['GET'], '/test/some/path/*myjoker', 2);
      subject.add(['GET'], '/test/some/:myparam', 3);
      subject.add(['GET'], '/test/some', 4);
      subject.add(['GET'], '/test/some/path', 5);
    });

    test('finds root', () => {
      expect(subject.lookup('GET', '/')).toMatchObject({ data: 1 });
    });

    test('finds static path', () => {
      expect(subject.lookup('GET', '/test/some/path')).toMatchObject({ data: 5 });
    });

    test('finds parametered path', () => {
      expect(subject.lookup('GET', '/test/some/foo')).toMatchObject({ data: 3, params: { myparam: 'foo' } });
    });

    test('finds wildcard path', () => {
      expect(subject.lookup('GET', '/test/some/path/and/more')).toMatchObject({ data: 2, params: { myjoker: 'and/more' } });
    });
  });

  describe('validation', () => {
    test('validates method', () => {
      expect(() => subject.lookup(null as any, '/foo/bar')).toThrow();
      expect(() => subject.lookup(undefined as any, '/foo/bar')).toThrow();
      expect(() => subject.lookup(true as any, '/foo/bar')).toThrow();
    });

    test('validates pattern', () => {
      expect(() => subject.lookup('GET', '')).toThrow();
      expect(() => subject.lookup('GET', null as any)).toThrow();
      expect(() => subject.lookup('GET', undefined as any)).toThrow();
      expect(() => subject.lookup('GET', true as any)).toThrow();
      expect(() => subject.lookup('GET', 'no/leading/slash')).toThrow();
    });
  });
});
