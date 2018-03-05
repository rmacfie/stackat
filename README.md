# stackat

Simple HTTP server for NodeJS with full support for async/await and TypeScript


## Usage

**Hello world**

```typescript
import { Application } from 'stackat';

const app = new Application();

app.GET('/', async ctx => {
  return { Hello: 'world' };
});

app.start();

# GET http://localhost:5000/
#   => { "Hello": "world" }
```

**URL parameter**

```typescript
app.GET('/greet/:name', async ctx => {
  return { Hello: ctx.params.name };
});

# GET http://localhost:5000/greet/Bob
#   => { "Hello": "Bob" }
```

**Wildcard (catch all) parameter**

```typescript
app.GET('/greets/*name', async ctx => {
  return { Hello: ctx.params.name };
});

# GET http://localhost:5000/greets/Bob/Brigitte
#   => { "Hello": "Bob/Brigitte" }
```

