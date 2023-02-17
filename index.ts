import chalk from 'chalk';
import connect from 'connect';
import cors from 'cors';
import esbuild from 'esbuild';
import http from 'http';
import https from 'https';
import open from 'open';

export interface serverOption {
  port: number;
  open?: boolean;
  servedir: string;
  proxy?: {
    [key: string]: {
      target: string;
      pathRewrite?: {
        [key: string]: string;
      };
      changeOrigin?: boolean;
    };
  };
}

export async function createDevServer(
  buildOption: esbuild.BuildOptions,
  serveOption: serverOption
) {
  const {
    port,
    open: isOpenInDefaultBrowser = false,
    servedir,
    proxy,
  } = serveOption;

  // esbuild context
  const context = await esbuild.context(buildOption);

  // esbuild watch files change
  await context.watch();

  // esbuild serve
  const { host, port: actualPort } = await context.serve({
    port: port,
    servedir: servedir,
  });
  const app = connect()
    .use(cors())
    .use((req, res) => {
      const forwardRequest = (path: string) => {
        const filterProxy = Object.keys(proxy ?? {}).filter((prefix) =>
          new RegExp(prefix).test(path)
        );

        filterProxy.forEach((prefix) => {
          const { target, pathRewrite, changeOrigin } = proxy![prefix];

          Object.keys(pathRewrite ?? {}).forEach((prefix) => {
            const regexp = new RegExp(prefix);

            if (regexp.test(path)) {
              path = path.replace(regexp, pathRewrite![prefix]);
            }
          });
          const url = new URL(target + path);
          const origin = changeOrigin
            ? url.protocol + '//' + url.host
            : req.headers.origin;

          req.pipe(
            https.request(
              url.href,
              {
                method: req.method,
                headers: {
                  ...req.headers,
                  origin: origin,
                  host: '',
                },
              },
              (proxy) => {
                res.writeHead(proxy.statusCode!, proxy.headers);
                proxy.pipe(res, { end: true });
              }
            ),
            { end: true }
          );

          console.log(
            `${chalk.hex('#62bb35').bold('[HTTP Proxy]')}: ${chalk
              .hex('#eecc16')
              .bold(path)} -> ${chalk.hex('#eecc16').bold(url.href)}`
          );

          return;
        });

        // no proxy required
        if (filterProxy.length === 0) {
          req.pipe(
            http.request(
              {
                hostname: host,
                port: actualPort,
                path,
                method: req.method,
                headers: req.headers,
              },
              (proxy) => {
                if (proxy.statusCode === 404) {
                  return forwardRequest('/');
                }

                res.writeHead(proxy.statusCode!, proxy.headers);
                proxy.pipe(res, { end: true });
              }
            ),
            { end: true }
          );
        }
      };

      forwardRequest(req.url!);
    });

  http.createServer(app).listen(actualPort);

  if (isOpenInDefaultBrowser) {
    open(`http://localhost:${actualPort}/`);
  }

  return context;
}
