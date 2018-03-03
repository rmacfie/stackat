import { Validator } from './validator';

export type TreeMethod =
  'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const ValidMethods: TreeMethod[] = [
  'GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE',
];

export interface TreeMatch<TData> {
  nodeId: number;
  options: TreeMethod[];
  params: { [name: string]: string };
  data: TData | null;
}

export class Tree<TData> {
  private readonly root = new TreeNode<TData>('', '/', TreeNodeType.literal, null);

  add(method: TreeMethod, pattern: string, data: TData) {
    const validate = Validator(``, () => ` (${method} ${pattern})`);
    validate(typeof method === 'string', () => `method must be a string`);
    validate(ValidMethods.includes(method), () => `method must be one of ${ValidMethods.join(', ')}`);
    validate(typeof pattern === 'string', () => `pattern must be a string`);
    validate(pattern.startsWith('/'), () => `pattern must start with a forward slash, i.e. '/'`);
    validate(pattern === '/' || !pattern.endsWith('/'), () => `pattern must not end with a forward slash, i.e. '/'`);
    validate(!pattern.includes('//'), () => `pattern must not contain double forward slashes, i.e. '//'`);
    validate(data != null, () => `data must not be null or undefined`);

    const tokens = pattern.split('/');
    let node = this.root;

    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (token[0] === ':') {
        validate(node.children['*'] == null, () => `parameter '${token}' is in conflict with existing wildcard`);
        node = node.getOrAddChild(':', () => new TreeNode(token, token.substr(1), TreeNodeType.parameter, node));
      } else if (token[0] === '*') {
        validate(node.children[':'] == null, () => `wildcard is in conflict with existing parameter '${node.children[':'].token}'`);
        validate(i === tokens.length - 1, () => `wildcard must not be followed by a forward slash, i.e. '/'`);
        node = node.getOrAddChild('*', () => new TreeNode(token, token.substr(1), TreeNodeType.wildcard, node));
      } else {
        node = node.getOrAddChild(token, () => new TreeNode(token, token, TreeNodeType.literal, node));
      }
    }

    validate(node.data[method] == null, () => `same method and pattern is already defined`);
    node.data[method] = data;
  }

  lookup(method: TreeMethod, path: string): TreeMatch<TData> | null {
    const validate = Validator(``, ` (${method} ${path})`);
    validate(typeof method === 'string', `method must be a string`);
    validate(typeof path === 'string', `path must be a string`);
    validate(path[0] === '/', `path must start with a forward slash, i.e. '/'`);

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

class TreeNode<TData> {
  readonly id = ++nodeCounter;
  readonly children: { [key: string]: TreeNode<TData> } = {};
  readonly data = new TreeMethods<TData | null>(null);
  constructor(
    readonly token: string,
    readonly name: string,
    readonly type: TreeNodeType,
    readonly parent: TreeNode<TData> | null,
  ) {
  }

  getOrAddChild(key: string, add: () => TreeNode<TData>) {
    return this.children[key] == null ? this.children[key] = add() : this.children[key];
  }

  options() {
    return ValidMethods.filter((m) => this.data[m] != null);
  }
}

enum TreeNodeType {
  literal = 0,
  parameter = 1,
  wildcard = 2,
}

class TreeMethods<T> {
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
