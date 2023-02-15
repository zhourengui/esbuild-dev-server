import { createDevServer } from '@zhourengui/esbuild-dev-server';
import html from '@chialab/esbuild-plugin-html';

createDevServer(
  {
    entryPoints: {
      mainHtml: 'index.html',
    },
    bundle: true,
    minify: false,
    tsconfig: 'tsconfig.json',
    plugins: [html()],
    outdir: 'dist',
    logLevel: 'info',
  },
  {
    servedir: 'dist',
    port: 8080,
    proxy: {
      '^/api/v1': {
        target: 'https://www.google.com.hk',
        pathRewrite: {},
        changeOrigin: true,
      },
    },
  }
);
