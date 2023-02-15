"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDevServer = void 0;
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
    // http proxy
    const server = http_1.default.createServer((req, res) => {
        let path = req.url;
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
            const hostSplit = url.host.split('.');
            const host = changeOrigin
                ? hostSplit
                    .slice(hostSplit.length - 1 + 3, hostSplit.length - 1)
                    .join('.')
                : req.headers.host;
            req.pipe(https_1.default.request(url.href, {
                method: req.method,
                headers: {
                    ...req.headers,
                    host: host,
                },
            }, (proxy) => {
                res.writeHead(proxy.statusCode, proxy.headers);
                proxy.pipe(res, { end: true });
            }), { end: true });
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
                res.writeHead(proxy.statusCode, proxy.headers);
                proxy.pipe(res, { end: true });
            }), { end: true });
        }
    });
    server.listen(actualPort);
    if (isOpenInDefaultBrowser) {
        (0, open_1.default)(`http://localhost:${actualPort}/`);
    }
    return context;
}
exports.createDevServer = createDevServer;
