# esbuild-dev-server

<g-emoji class="g-emoji" alias="zap" fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/26a1.png">⚡️</g-emoji> Fast, lightweight and powerful development server for esbuild <g-emoji class="g-emoji" alias="zap" fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/26a1.png">⚡️</g-emoji>

- Zero dependencies besides esbuild
- API proxy support
- Live reload
- SPA support through History API fallback
- Fully typed with TypeScript

## Installation

```bash
npm install @zhourengui/esbuild-dev-server
# or
yarn add @zhourengui/esbuild-dev-server
```

## Usage

```mjs
import { createDevServer } from '@zhourengui/esbuild-dev-server';

createDevServer(esbuildOptions, {
  servedir: 'dist/web',
  port: 8080,
  proxy: {
    '^/api/v1': {
      target: 'https://www.google.com/',
      changeOrigin: true,
    },
  },
});
```

See [example](https://github.com/zhourengui/esbuild-dev-server/tree/master/example) folder for examples.

## API

createDevServer(esbuildOptions, serverOptions)

#### esbuildOptions

Options passed to [esbuild Build API](https://esbuild.github.io/api/).

#### serverOptions

| Option   | Description                                            | Required | Default |
| -------- | ------------------------------------------------------ | -------- | ------- |
| servedir | build directory                                        | True     | None    |
| port     | Port number to listen for requests on.                 | True     | None    |
| open     | Open in the default browser after starting the service | False    | False   |
| proxy    | proxy http network request                             | False    | None    |

## Proxying

```json
{
  "proxy": {
    "^/api/v1": {
      "target": "https://www.google.com.hk/",
      "pathRewrite": {
        "^/api/v1": "replace string"
      },
      "changeOrigin": true
    }
  }
}
```

Matching prefixes support regular expressions.

## Hot Reloading

[Esbuild Hot Reloading](https://esbuild.github.io/api/#hot-reloading-css)

Add the following code to the entry file:

```js
new EventSource('/esbuild').addEventListener('change', (e) => {
  const { added, removed, updated } = JSON.parse(e.data);

  if (!added.length && !removed.length && updated.length === 1) {
    for (const link of document.getElementsByTagName('link')) {
      const url = new URL(link.href);

      if (url.host === location.host && url.pathname === updated[0]) {
        const next = link.cloneNode();
        next.href = updated[0] + '?' + Math.random().toString(36).slice(2);
        next.onload = () => link.remove();
        link.parentNode.insertBefore(next, link.nextSibling);
        return;
      }
    }
  }

  location.reload();
});
```

## Todo List

- [ ] Add Tests
