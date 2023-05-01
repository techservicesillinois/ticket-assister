import { defineConfig } from "vite";

import * as path from "path";

const rootDir = path.resolve(__dirname, "src");
const pagesDir = path.resolve(rootDir, "pages");
const contentScriptsDir = path.resolve(rootDir, "contentScripts");
const assetsDir = path.resolve(__dirname, "src/static");
const outDir = path.resolve(__dirname, "build");

export default defineConfig({
    /*resolve: {
        alias: {
            "@src": rootDir,
            "@assets": assetsDir,
        },
    },*/
    root: rootDir,
    publicDir: assetsDir,
    build: {
        target: "ES2015",
        outDir,
        emptyOutDir: true,
        copyPublicDir: true,
        sourcemap: process.env.NODE_ENV === "dev",
        minify: "esbuild",
        lib: {
            entry: [
                // pages
                pagesDir + "/index.html",
                pagesDir + "/options.html",
                // page deps
                pagesDir + "/indexInteractions.ts",
                pagesDir + "/optionsInteractions.ts",
                // content scripts
                //contentScriptsDir + "",
            ],
            name: "Ticket Assister",
            //fileName: format => `tkast.${format}.js`, // todo
        },
        /*rollupOptions: {
            input: {
                // pages
                popup: "src/index.html",
                // content scripts
                main: "src/disher.ts",
            },
            output: {
                // allow multiple outputs
                inlineDynamicImports: true,
                entryFileNames: "entry/[name].js",
                chunkFileNames: "chunk/[name].[ext]",
                assetFileNames: "asset/[name].[ext]",
            },
        },*/
    },
    optimizeDeps: {
        include: ["chrome"], // todo https://stackoverflow.com/questions/76210670/how-do-i-add-support-for-the-chrome-namespace-to-my-vite-config
    },
});