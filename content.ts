import * as fs from 'fs';
import * as http from 'http';

export type HTTPStatusCode
  = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
  | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308
  | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451
  | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

export interface Content {
  apply(request: http.IncomingMessage, response: http.ServerResponse): void | Promise<void>;
}

export const emptyContent = (): Content => {
  return {
    apply: (req, res) => {
      res.writeHead(204);
      res.end();
    },
  };
};

export const HTMLContent = (html: string): Content => {
  return {
    apply: (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    },
  };
};

export const JSONContent = (data: any): Content => {
  return {
    apply: (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    },
  };
};

export const statusCode = (code: HTTPStatusCode): Content => {
  return {
    apply: (req, res) => {
      res.writeHead(code);
      res.end();
    },
  };
};

export const textContent = (text: string): Content => {
  return {
    apply: (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(text);
    },
  };
};

export interface FileContentOptions {
  contentType?: string;
  filename?: string;
  attachment?: boolean;
}

export const fileContent = (path: string, options: FileContentOptions = {}): Content => {
  return {
    apply: (req, res) => {
      return new Promise<void>((resolve, reject) => {
        fs.readFile(path, (err, data) => {
          if (err) {
            return reject(err);
          } else {
            res.writeHead(200, {
              'Content-Type': fileContentType(path, options),
              'Content-Disposition': fileContentDisposition(path, options),
            });
            res.end(data);
            return resolve();
          }
        });
      });
    },
  };
};

function fileContentType(path: string, options: FileContentOptions) {
  // TODO: detect from filename extension?
  if (options.contentType) {
    return options.contentType;
  } else {
    return 'application/octet-stream';
  }
}

function fileContentDisposition(path: string, options: FileContentOptions) {
  return (options.attachment ? 'attachment' : 'inline')
    + (options.filename ? `; filename="${options.filename}"` : '');
}
