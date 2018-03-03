import assert from 'assert';

export type Method =
  'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export const ValidMethods: Method[] = [
  'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH',
];

export interface Record<TData> {
  path: string;
  pathFound: boolean;
  method: Method;
  methodFound: boolean;
  data: TData | null;
}

export class Registry<TData> {
  private readonly root: Node<TData> = new Node('/', '', NodeType.literal, null);

  add(method: Method, pathPattern: string, data: TData): void {
    assert(method, `method is required`);
    assert(pathPattern, `pathPattern is required`);
    assert(data, `data is required`);
    assert(typeof method === 'string', `method must be a string`);
    assert(typeof pathPattern === 'string', `pathPattern must be a string`);
    assert(typeof data === 'object', `data must be an object`);
    assert(ValidMethods.includes(method), `method must be one of [${ValidMethods.join(', ')}]`);
    assert(pathPattern.startsWith('/'), `pathPattern must start with a forward slash '/'`);
    assert(pathPattern === '/' || !pathPattern.endsWith('/'), `pathPattern must not end with a forward slash '/'`);
    assert(!pathPattern.includes('//'), `pathPattern must not have multiple forward slash '/' in a row`);

    const sections = pathPattern.split('/');
    let node = this.root;
    let nodePath = '';

    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      nodePath += `/${section}`;

      if (section === '**' && i + 1 === sections.length) {
        // wildcard
        node = node.children.wildcard === null
          ? node.children.wildcard = new Node(nodePath, section, NodeType.wildcard, node)
          : node.children.wildcard;
      } else if (section.startsWith(':')) {
        // parameter
        node = node.children.parameter === null
          ? node.children.parameter = new Node(nodePath, section.substr(1), NodeType.parameter, node)
          : node.children.parameter;
      } else {
        // literal
        node = node.children.literals[section] === null
          ? node.children.literals[section] = new Node(nodePath, section, NodeType.literal, node)
          : node.children.literals[section];
      }
    }

    assert(node.data[method] === null, `method-path combination must not be registered more than once`);

    node.data[method] = data;
  }

  find(method: Method, path: string): Record<TData> {
    assert(typeof method === 'string', `method is required and must be a string`);
    assert(typeof path === 'string', `path is required and must be a string`);
    assert(path.startsWith('/'), `path must start with a forward slash '/'`);

    const sections = path.split('/');
    const node = this.root;

    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];

      if (section === '**' && i + 1 === sections.length) {
        // wildcard
      } else if (section.startsWith(':')) {
        // parameter
      } else {
        // literal
      }
    }

    throw new Error('Not implemented');
  }
}

enum NodeType {
  literal = 0,
  parameter = 1,
  wildcard = 2,
}

interface NodeChildren<TData> {
  literals: { [path: string]: Node<TData> };
  parameter: Node<TData> | null;
  wildcard: Node<TData> | null;
}

interface NodeData<TData> {
  GET: TData | null;
  HEAD: TData | null;
  POST: TData | null;
  PUT: TData | null;
  PATCH: TData | null;
  DELETE: TData | null;
}

class Node<TData> {
  readonly children: NodeChildren<TData> = { literals: {}, parameter: null, wildcard: null };
  readonly data: NodeData<TData> = { GET: null, HEAD: null, POST: null, PUT: null, PATCH: null, DELETE: null };

  constructor(
    readonly path: string,
    readonly name: string,
    readonly type: NodeType,
    readonly parent: Node<TData> | null,
  ) {
  }
}
