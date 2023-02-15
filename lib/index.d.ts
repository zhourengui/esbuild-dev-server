import esbuild from 'esbuild';
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
export declare function createDevServer(buildOption: esbuild.BuildOptions, serveOption: serverOption): Promise<esbuild.BuildContext<esbuild.BuildOptions>>;
