import { defineConfig } from "vite";

import path from "path";

const rootDir = path.resolve(__dirname, "src");
const pagesDir = path.resolve(rootDir, "pages");
const assetsDir = path.resolve(__dirname, "src/static");
const outDir = path.resolve(__dirname, "build");

export default defineConfig({
    resolve: {
        alias: {
            //"@src": rootDir,
            //"@assets": assetsDir,
            "utils": path.resolve(rootDir, "utils"),
            "config": path.resolve(rootDir, "config"),
        },
    },
    root: rootDir,
    publicDir: assetsDir,
    build: {
        target: "ES2015",
        outDir,
        emptyOutDir: true,
        copyPublicDir: true,
        sourcemap: process.env.NODE_ENV === "development",
        minify: process.env.NODE_ENV === "development" ? false : "esbuild",
        rollupOptions: {
            input: {
                // pages
                index: path.join(pagesDir, "/index.html"),
                options: path.join(pagesDir, "/options.html"),
                trouble: path.join(pagesDir, "/trouble.html"), // help page
                // service worker
                serviceWorker: path.join(rootDir, "/serviceWorker.ts"),
                // content scripts
                // built in buildContentScripts.ts in iife
            },
            output: {
                entryFileNames: "scripts/[name].js",
                chunkFileNames: "scripts/[name]-[hash].js",
                format: "es", // uses `import`
            },
        },
    },
});