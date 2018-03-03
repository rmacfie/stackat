import Check from './check';

export type Method =
  'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const ValidMethods: Method[] = [
  'GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE',
];

export interface Match<TData> {
  nodeId: number;
  options: Method[];
  params: { [name: string]: string };
  data: TData | null;
}

export class Tree<TData> {
  private readonly root = new Node<TData>('', '/', Type.literal, null);

  add(method: Method, pattern: string, data: TData) {
    const check = Check(``, ` (${method} ${pattern})`);
    check(typeof method === 'string', () => `method must be a string`);
    check(ValidMethods.includes(method), () => `method must be one of ${ValidMethods.join(', ')}`);
    check(typeof pattern === 'string', () => `pattern must be a string`);
    check(pattern.startsWith('/'), () => `pattern must start with a forward slash, i.e. '/'`);
    check(pattern === '/' || !pattern.endsWith('/'), () => `pattern must not end with a forward slash, i.e. '/'`);
    check(!pattern.includes('//'), () => `pattern must not contain double forward slashes, i.e. '//'`);
    check(data != null, () => `data must not be null or undefined`);

    const tokens = pattern.split('/');
    let node = this.root;

    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (token[0] === ':') {
        check(node.children['*'] == null, () => `parameter '${token}' is in conflict with existing wildcard`);
        node = node.getOrAddChild(':', () => new Node(token, token.substr(1), Type.parameter, node));
      } else if (token[0] === '*') {
        check(node.children[':'] == null, () => `wildcard is in conflict with existing parameter '${node.children[':'].token}'`);
        check(i === tokens.length - 1, () => `wildcard must not be followed by a forward slash, i.e. '/'`);
        node = node.getOrAddChild('*', () => new Node(token, token.substr(1), Type.wildcard, node));
      } else {
        node = node.getOrAddChild(token, () => new Node(token, token, Type.literal, node));
      }
    }

    check(node.data[method] == null, () => `same method and pattern is already defined`);
    node.data[method] = data;
  }

  lookup(method: Method, path: string): Match<TData> | null {
    const check = Check(``, ` (${method} ${path})`);
    check(typeof method === 'string', `method must be a string`);
    check(typeof path === 'string', `path must be a string`);
    check(path[0] === '/', `path must start with a forward slash, i.e. '/'`);

    const parts = path.split('/');
    let node = this.root;
    const params: { [name: string]: string } = {};

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (node.children[part] != null) {
        node = node.children[part];
      } else if (node.children[':'] != null) {
        node = node.children[':'];
        params[node.name] = part;
      } else if (node.children['*'] != null) {
        node = node.children['*'];
        params[node.name] = parts.slice(i).join('/');
        break;
      } else {
        return null;
      }
    }

    return {
      nodeId: node.id,
      options: node.options(),
      params: params,
      data: node.data[method],
    };
  }
}

let nodeCounter = 0;

class Node<TData> {
  readonly id = ++nodeCounter;
  readonly children: { [key: string]: Node<TData> } = {};
  readonly data = new Methods<TData | null>(null);
  constructor(
    readonly token: string,
    readonly name: string,
    readonly type: Type,
    readonly parent: Node<TData> | null,
  ) {
  }

  getOrAddChild(key: string, add: () => Node<TData>) {
    return this.children[key] == null ? this.children[key] = add() : this.children[key];
  }

  options() {
    return ValidMethods.filter((m) => this.data[m] != null);
  }
}

enum Type {
  literal = 0,
  parameter = 1,
  wildcard = 2,
}

class Methods<T> {
  GET: T;
  HEAD: T;
  POST: T;
  PUT: T;
  PATCH: T;
  DELETE: T;

  constructor(initial: T) {
    this.GET = initial;
    this.HEAD = initial;
    this.POST = initial;
    this.PUT = initial;
    this.PATCH = initial;
    this.DELETE = initial;
  }
}
