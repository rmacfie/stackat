import { Application, FileResult, HTMLResult, JSONResult, TextResult } from '../';

const app = new Application();

app.GET('/', async (ctx) => {
  return TextResult(`Hello, world!`); // plain text result
});

app.GET('/greet/:firstName', async (ctx) => {
  return TextResult(`Hello, ${ctx.params.firstName}!`); // parameter
});

app.GET('/greets/*names', async (ctx) => {
  return TextResult(`Hello, ${ctx.params.names}!`); // wildcard (catch-all) parameter
});

app.GET('/status', async (ctx) => {
  return 418; // empty result with the given status code
});

app.GET('/empty', async (ctx) => {
  return null; // empty result with status code 204 (No Content)
});

app.GET('/api/json', async (ctx) => {
  return { foo: 'bar', x: 24 };
});

app.GET('/api/json/explicit', async (ctx) => {
  return JSONResult({ foo: 'bar', x: 13 });
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

app.start(5000);
