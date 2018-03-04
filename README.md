# stackat

Simple HTTP server for NodeJS with full support for async/await and TypeScript


## Usage

```typescript
import { Application } from 'stackat';

const app = new Application();

app.GET('/', async ctx => {
  return `Hello, wörld!`;
});

app.GET('/:name', async ctx => {
  return `Hello, ${ctx.params.name}!`;
});

app.start();
```


