import {Application} from '../';

const app = new Application();

app.GET('/', async (ctx) => {
  return `Hello, world!`;
});

app.GET('/greet/:name', async (ctx) => {
  return `Hello, ${ctx.params.name}!`;
});

app.GET('/greets/*name', async (ctx) => {
  return `Hello, ${ctx.params.name}!`;
});

app.start(5000);
