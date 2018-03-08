import { Application, FileResult, HTMLResult, JSONResult, TextResult } from '../';

const app = new Application();

app.GET('/', async (ctx) => {
  // strings defaults to HTML result
  return `<html>Hello, world!</html>`;
});

app.GET('/greet/:firstName', async (ctx) => {
  // path parameter
  return TextResult(`Hello, ${ctx.params.firstName}!`);
});

app.GET('/greets/*names', async (ctx) => {
  // wildcard (catch-all) parameter
  return TextResult(`Hello, ${ctx.params.names}!`);
});

app.GET('/status', async (ctx) => {
  // number result defaults to an empty status code result
  return 418;
});

app.GET('/empty', async (ctx) => {
  // empty result with status code 204 (No Content)
  return null;
});

app.GET('/api/json', async (ctx) => {
  // objects defaults to JSON result
  return { foo: 'bar', x: 24 };
});

app.GET('/api/json/explicit', async (ctx) => {
  // querystring parameter
  return JSONResult({ foo: 'bar', something: ctx.query.something });
});

app.GET('/some/file', async (ctx) => {
  return FileResult('./presentation01.pdf');
});

app.GET('/my/page', async (ctx) => {
  return HTMLResult(`
    <!DOCTYPE html>
    <html>
      <body>
        <h1>An HTML page</h1>
      </body>
    </html>
  `);
});

app.listen();
