"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDevServer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const connect_1 = __importDefault(require("connect"));
const cors_1 = __importDefault(require("cors"));
const esbuild_1 = __importDefault(require("esbuild"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const open_1 = __importDefault(require("open"));
async function createDevServer(buildOption, serveOption) {
    const { port, open: isOpenInDefaultBrowser = false, servedir, proxy, } = serveOption;
    // esbuild context
    const context = await esbuild_1.default.context(buildOption);
    // esbuild watch files change
    await context.watch();
    // esbuild serve
    const { host, port: actualPort } = await context.serve({
        port: port,
        servedir: servedir,
    });
    const app = (0, connect_1.default)()
        .use((0, cors_1.default)())
        .use((req, res) => {
        const forwardRequest = (path) => {
            const filterProxy = Object.keys(proxy ?? {}).filter((prefix) => new RegExp(prefix).test(path));
            filterProxy.forEach((prefix) => {
                const { target, pathRewrite, changeOrigin } = proxy[prefix];
                Object.keys(pathRewrite ?? {}).forEach((prefix) => {
                    const regexp = new RegExp(prefix);
                    if (regexp.test(path)) {
                        path = path.replace(regexp, pathRewrite[prefix]);
                    }
                });
                const url = new URL(target + path);
                const origin = changeOrigin
                    ? url.protocol + '//' + url.host
                    : req.headers.origin;
                req.pipe(https_1.default.request(url.href, {
                    method: req.method,
                    headers: {
                        ...req.headers,
                        host: url.host,
                    },
                }, (proxy) => {
                    res.writeHead(proxy.statusCode, proxy.headers);
                    proxy.pipe(res, { end: true });
                }), { end: true });
                console.log(`${chalk_1.default.hex('#62bb35').bold('[HTTP Proxy]')}: ${chalk_1.default
                    .hex('#eecc16')
                    .bold(path)} -> ${chalk_1.default.hex('#eecc16').bold(url.href)}`);
                return;
            });
            // no proxy required
            if (filterProxy.length === 0) {
                req.pipe(http_1.default.request({
                    hostname: host,
                    port: actualPort,
                    path,
                    method: req.method,
                    headers: req.headers,
                }, (proxy) => {
                    if (proxy.statusCode === 404) {
                        return forwardRequest('/');
                    }
                    res.writeHead(proxy.statusCode, proxy.headers);
                    proxy.pipe(res, { end: true });
                }), { end: true });
            }
        };
        forwardRequest(req.url);
    });
    const server = http_1.default.createServer(app);
    server.listen(actualPort);
    server.on('error', (e) => {
        console.error(e);
    });
    process.on('uncaughtException', function (err) {
        console.error(err);
    });
    if (isOpenInDefaultBrowser) {
        (0, open_1.default)(`http://localhost:${actualPort}/`);
    }
    return context;
}
exports.createDevServer = createDevServer;
