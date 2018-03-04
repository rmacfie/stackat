import { Application, fileContent, HTMLContent, JSONContent, textContent } from '../';

const app = new Application();

app.GET('/', async (ctx) => {
  return `Hello, world!`; // plain text result
});

app.GET('/greet/:name', async (ctx) => {
  return `Hello, ${ctx.params.name}!`;
});

app.GET('/greets/*name', async (ctx) => {
  return `Hello, ${ctx.params.name}!`;
});

app.GET('/status', async (ctx) => {
  return 418; // empty result with the given status code
});

app.GET('/empty', async (ctx) => {
  return null; // empty result with status code 204 (No Content)
});

app.GET('/api/json', async (ctx) => {
  return JSONContent({
    foo: 'bar',
    x: 13,
  });
});

app.GET('/some/file', async (ctx) => {
  return fileContent('./presentation01.pdf');
});

app.GET('/my/page', async (ctx) => {
  return HTMLContent(`
    <!DOCTYPE html>
    <html>
      <body>
        <h1>An HTML page</h1>
      </body>
    </html>
  `);
});

app.start(5000);
