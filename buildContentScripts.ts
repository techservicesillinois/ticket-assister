import { build } from "vite";

import * as path from "path";
import { getAllFilesSync } from "./src/utils/fs";
import { changeExtension } from "./src/utils/stringParser";

const rootDir = path.resolve(__dirname, "src");
const contentScriptsSrcDir = path.join(rootDir, "contentScripts");
const outDir = path.resolve(__dirname, "build");
// contentScripts subdirectory added during compilation
const contentScriptsOutDir = path.join(outDir, "scripts");

/**
 * Returns all of the content scripts in the `contentScripts/*` directory
 * in a {@link Record}<string, string>
 * from entry names to full paths without file extensions
 */
async function getContentScripts(): Promise<Record<string, string>> {
    return Object.fromEntries(
        Object.entries(await getAllFilesSync(contentScriptsSrcDir))
            .map(([k, v]) => [changeExtension(k, "js"), changeExtension(v, "")])
    );
}

/**
 * Returns the file name passed with the only flag
 * or undefined if none is passed
 * 
 * @todo use this to allow only certain file compilation (partial compilation)
 */
function onlyFileFlag() {
    for (let i = 0; i < process.argv.length; i++) {
        if (process.argv[i] === "--only" && i + 1 < process.argv.length) {
            return process.argv[i + 1];
        }
    }
}

(async () => {
    const contentScripts = await getContentScripts();
    let completed = 0;
    const total = Object.keys(contentScripts).length;
    // maybe clean contentScriptsOutDir once here?
    //Object.values(getContentScripts()).forEach(filePath => {
    for (const [entryName, filePath] of Object.entries(contentScripts)) {
        console.log(`Compiling [${++completed}/${total}] ${filePath}`);
        await build({
            // if no environment specified, use default: production
            mode: process.env.NODE_ENV === "development" ? "development" : undefined,
            resolve: {
                alias: {
                    //"@src": rootDir,
                    //"@assets": assetsDir,
                    "utils": path.resolve(rootDir, "utils"),
                    "config": path.resolve(rootDir, "config"),
                },
            },
            root: contentScriptsSrcDir, //rootDir
            //publicDir: assetsDir,
            build: {
                /*lib: {
                    entry: filePath,
                    name: "MyLib",
                    //fileName: (format) => `my-lib.${format}.js`
                },*/
                target: "ES2015",
                outDir: contentScriptsOutDir,
                // this is done in the previous build
                // and in each prior build
                // so definately don't do this
                emptyOutDir: false,
                // this is done in the previous build
                copyPublicDir: false,
                sourcemap: process.env.NODE_ENV === "development",
                minify: process.env.NODE_ENV === "development" ? false : "esbuild",
                rollupOptions: {
                    input: { [entryName]: filePath },
                    output: {
                        // relative to contentScriptsOutDir
                        entryFileNames: "contentScripts/[name]",
                        chunkFileNames: "contentScripts/[name]-[hash]",
                        format: "iife",
                        // no imports
                        inlineDynamicImports: false,
                    },
                },
            },
        });
    }
})();