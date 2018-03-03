export type Method =
  'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export const ValidMethods: Method[] = [
  'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH',
];

export interface Match<TData> {
  methods: Method[];
  data: TData | null;
}

export class Trie<TData extends object = {}> {
  insert(method: Method, pattern: string, data: TData): void {
    throw new Error('Not implemented');
  }

  lookup(method: Method, path: string): Match<TData> {
    throw new Error('Not implemented');
  }
}
