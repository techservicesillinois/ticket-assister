import { build } from "vite";
import { changeExtension } from "./src/utils/stringParser";

import * as path from "path";
import * as fs from "fs";

const rootDir = path.resolve(__dirname, "src");
const assetsDir = path.resolve(__dirname, "src/static");
const outDir = path.resolve(__dirname, "build");
const contentScriptsDir = path.join(rootDir, "contentScripts");
const contentScriptsOutDir = path.join(outDir, "scripts", "contentScripts");

/**
 * Returns all of the content scripts in the `contentScripts/*` directory
 * in a {@link Record}<string, string>
 * from entry names to full paths
 */
function getContentScripts(): Record<string, string> {
    const entries = {};

    function walk(directory: string) {
        const files = fs.readdirSync(directory, { withFileTypes: true });
    
        files.forEach((file) => {
            const fullPath = path.join(directory, file.name);
            const relativePath = path.relative(rootDir, fullPath);
            const entryName = changeExtension(relativePath, ""); // remove file extension
            if (file.isDirectory()) {
                walk(fullPath); // Recursive call for subdirectories
            } else {
                entries[entryName] = fullPath;
            }
        });
    }

    walk(contentScriptsDir);

    return entries;
}

(async ()=>{
    // maybe clean contentScriptsOutDir once here?
//Object.values(getContentScripts()).forEach(filePath => {
for (const [entryName, filePath] of Object.entries(getContentScripts())) {
    console.log(`Compiling ${filePath}`);
    await build({
        resolve: {
            alias: {
                //"@src": rootDir,
                //"@assets": assetsDir,
                "utils": path.resolve(rootDir, "utils"),
                "config": path.resolve(rootDir, "config"),
            },
        },
        root: contentScriptsDir, //rootDir
        //publicDir: assetsDir,
        build: {
            /*lib: {
                entry: filePath,
                name: "MyLib",
                //fileName: (format) => `my-lib.${format}.js`
            },*/
            target: "ES2015",
            outDir: contentScriptsDir,
            // this is done in the previous build
            emptyOutDir: true,
            // this is done in the previous build
            copyPublicDir: false,
            sourcemap: process.env.NODE_ENV === "development",
            minify: process.env.NODE_ENV === "development" ? false : "esbuild",
            rollupOptions: {
                input: filePath,
                output: {
                    // todo: not all exports are being compiled in vite.config.ts (maybe?)
                    // leading to them not being importable here.
                    entryFileNames: "scripts/[name].js",
                    chunkFileNames: "scripts/[name]-[hash].js",
                    format: "iife",
                    // no imports
                    inlineDynamicImports: false,
                },
            },
        },
    });
}
})();