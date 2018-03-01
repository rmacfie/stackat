import * as http from 'http';
import Stack from '../src/stack';

const PORT = 5000;

type State = {
  name: string;
};

const stack = new Stack<State>();

stack.use(async (ctx, next) => {
  ctx.state.name = 'bar';
  await next();
});

stack.use(async (ctx, next) => {
  ctx.res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  ctx.res.write(`Hello, ${ctx.state.name}!`);
  ctx.res.end();
});

http.createServer(stack.listener).listen(PORT, () => {
  // tslint:disable-next-line:no-console
  console.log(`Stack listening at http://localhost:${PORT}`);
});
