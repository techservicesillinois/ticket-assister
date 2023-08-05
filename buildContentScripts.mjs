import { build } from "vite";
// no imports from ts to [m]js
function changeExtension(path, newExtension) {
    const pathWithoutExtension = path.replace(/\.[^.]*$/, '');
    if (newExtension === "") {
        // no trialing dot.
        return `${pathWithoutExtension}`;
    }
    return `${pathWithoutExtension}.${newExtension}`;
}

import * as path from "path";
import * as fs from "fs";

const __dirname = "/mnt/c/users/elijah/documents/programming/_projects/tkast/";

const rootDir = path.resolve(__dirname, "src");
const contentScriptsSrcDir = path.join(rootDir, "contentScripts");
const outDir = path.resolve(__dirname, "build");
const contentScriptsOutDir = path.join(outDir, "scripts"); // contentScripts subdirectory added as compiles

/**
 * Returns all of the content scripts in the `contentScripts/*` directory
 * in a {@link Record}<string, string>
 * from entry names to full paths
 */
function getContentScripts() {
    const entries = {};

    function walk(directory) {
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

    walk(contentScriptsSrcDir);

    return entries;
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

(async ()=>{
    // maybe clean contentScriptsOutDir once here?
    const contentScripts = getContentScripts();
    let completed = 0;
    const total = Object.keys(contentScripts).length;
    //Object.values(contentScripts).forEach(filePath => {
    for (const [entryName, filePath] of Object.entries(contentScripts)) {
        /*if (!["cs31", "cs32"].includes(entryName.substring(entryName.lastIndexOf("/")+1))) {
            console.warn(`SKIPPING ${entryName}`);
            continue; // dev
        }*/
        console.log(`Compiling [${++completed}/${total}] ${filePath}`);
        await build({
            mode: process.env.NODE_ENV === "development" ? "development" : undefined, // use default: production
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
                        entryFileNames: "[name].js",
                        chunkFileNames: "[name]-[hash].js",
                        format: "iife",
                        // no imports
                        inlineDynamicImports: false,
                    },
                },
            },
        });
    }
})();