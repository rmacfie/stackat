import * as fs from 'fs';
import * as http from 'http';

export type HTTPStatusCode
  = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
  | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308
  | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451
  | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

export type ResultFunction
  = (req: http.IncomingMessage, res: http.ServerResponse) => void | Promise<void>;

export const StatusResult = (statusCode: HTTPStatusCode): ResultFunction => {
  return (req, res) => {
    res.writeHead(statusCode, { 'Content-Length': '0' });
    res.end();
  };
};

export const EmptyResult = (): ResultFunction => {
  return StatusResult(204);
};

export const ContentResult = (statusCode: HTTPStatusCode, contentType: string, content: string): ResultFunction => {
  return (req, res) => {
    res.writeHead(statusCode, { 'Content-Type': contentType });
    res.end(content);
  };
};

export const HTMLResult = (html: string): ResultFunction => {
  return ContentResult(200, 'text/html; charset=utf-8', html);
};

export const JSONResult = (data: any): ResultFunction => {
  return ContentResult(200, 'application/json; charset=utf-8', JSON.stringify(data));
};

export const TextResult = (text: string): ResultFunction => {
  return ContentResult(200, 'text/plain; charset=utf-8', text);
};

export interface FileResultOptions {
  filename?: string;
  attachment?: boolean;
}

export const FileResult = (path: string, contentType?: string, disposition?: { filename?: string, attachment?: boolean }): ResultFunction => {
  const headers: http.OutgoingHttpHeaders = {
    'Content-Type': contentType || 'application/octet-stream',
  };

  if (disposition) {
    headers['Content-Disposition']
      = (disposition.attachment ? 'attachment' : 'inline')
      + (disposition.filename ? `; filename="${disposition.filename}"` : '');
  }

  return (req, res) => {
    return new Promise<void>((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if (err) {
          return reject(err);
        } else {
          res.writeHead(200, headers);
          res.end(data);
          return resolve();
        }
      });
    });
  };
};
