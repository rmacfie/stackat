export type HTTPMethod =
  'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const ValidHTTPMethods: HTTPMethod[] = [
  'GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE',
];

export interface TreeMatch<TData> {
  nodeId: number;
  options: HTTPMethod[];
  params: { [name: string]: string };
  data: TData | null;
}

export class Tree<TData> {
  private readonly root = new TreeNode<TData>('', '/', TreeNodeType.literal, null);

  add(methods: HTTPMethod[], pattern: string, data: TData) {
    if (!Array.isArray(methods)) {
      throw new Error(`The methods must be an array of strings (${pattern})`);
    }

    for (const m of methods) {
      if (typeof m !== 'string') {
        throw new Error(`The method must be a string (${m} ${pattern})`);
      } else if (!ValidHTTPMethods.includes(m)) {
        throw new Error(`The method must be one of ${ValidHTTPMethods.join(', ')} (${m} ${pattern})`);
      }
    }

    if (typeof pattern !== 'string') {
      throw new Error(`The pattern must be a string (${pattern})`);
    } else if (!pattern.startsWith('/')) {
      throw new Error(`The pattern must start with a forward slash, i.e. '/' (${pattern})`);
    } else if (pattern !== '/' && pattern.endsWith('/')) {
      throw new Error(`The pattern must not end with a forward slash, i.e. '/' (${pattern})`);
    } else if (pattern.includes('//')) {
      throw new Error(`The pattern must not contain multiple forward slashes in a row, i.e. '//' (${pattern})`);
    }

    if (data == null) {
      throw new Error(`The data must not be null or undefined (${pattern})`);
    }

    const tokens = pattern.split('/');
    let node = this.root;

    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];

      if (token[0] === ':') {
        // parameter
        if (node.children['*'] != null) {
          throw new Error(`The parameter '${token}' is in conflict with existing wildcard (${pattern})`);
        }
        node = node.getOrAddChild(':', () => new TreeNode(token, token.substr(1), TreeNodeType.parameter, node));
      } else if (token[0] === '*') {
        // wildcard
        if (node.children[':'] != null) {
          throw new Error(`The wildcard is in conflict with existing parameter '${node.children[':'].token}' (${pattern})`);
        } else if (i !== tokens.length - 1) {
          throw new Error(`The wildcard must be the last section of a pattern (${pattern})`);
        }
        node = node.getOrAddChild('*', () => new TreeNode(token, token.substr(1), TreeNodeType.wildcard, node));
      } else {
        // literal
        node = node.getOrAddChild(token, () => new TreeNode(token, token, TreeNodeType.literal, node));
      }
    }

    for (const m of methods) {
      if (node.data[m] != null) {
        throw new Error(`The same method and pattern is already defined (${m} ${pattern})`);
      }
    }

    for (const m of methods) {
      node.data[m] = data;
    }

    return this;
  }

  lookup(method: HTTPMethod, path: string): TreeMatch<TData> | null {
    if (typeof method !== 'string') {
      throw new Error(`The method must be a string (${method} ${path})`);
    }

    if (typeof path !== 'string') {
      throw new Error(`The path must be a string (${method} ${path})`);
    } else if (path[0] !== '/') {
      throw new Error(`The path must start with a forward slash, i.e. '/' (${method} ${path})`);
    }

    const parts = path.split('/');
    let node = this.root;
    const params: { [name: string]: string } = {};

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (node.children[part] != null) {
        // literal match
        node = node.children[part];
      } else if (node.children[':'] != null) {
        // parameter match
        node = node.children[':'];
        params[node.name] = part;
      } else if (node.children['*'] != null) {
        // wildcard match
        node = node.children['*'];
        params[node.name] = parts.slice(i).join('/');
        break;
      } else {
        // no match
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
    return ValidHTTPMethods.filter((m) => this.data[m] != null);
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
