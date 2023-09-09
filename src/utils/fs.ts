import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";

/**
 * Returns all files in {@param rootDir} and subdirectories
 * in a {@link Record} from relative paths to full paths
 * 
 * Runs synchronously (is thread blocking)
 * @see {@link getAllFiles} for a synchronous version
 */
export async function getAllFilesSync(rootDir: string): Promise<Record<string, string>> {
    const entries = {};

    /**
     * Finds all the files in a directory recursively
     * adding them to {@link entries} in place
     */
    function walk(currDir: string): void {
        fs.readdirSync(currDir, { withFileTypes: true }).forEach(file => {
            const fullPath = path.join(currDir, file.name);
            const relativePath = path.relative(rootDir, fullPath);
            if (file.isDirectory()) {
                walk(fullPath); // Recursive call for subdirectories
            } else {
                entries[relativePath] = fullPath;
            }
        });
    }
    

    walk(rootDir);

    return entries;
}
/**
 * Returns all files in {@param rootDir} and subdirectories
 * in a {@link Record} from relative paths to full paths
 * 
 * Runs asynchronously
 * @see {@link getAllFilesSync} for a synchronous version
 * 
 * @todo implement
 */
/*export async function getAllFiles(rootDir: string): Promise<Record<string, string>> {
    throw new Error("Not implemented.");
    const entries = {};

    **
     * Finds all the files in a directory recursively
     * adding them to {@link entries}
     *
    async function walk(currDir, baseDir): Promise<void[]> {
        const files = await fsPromises.readdir(currDir, { withFileTypes: true });
        return await Promise.all(files.map(async file => {
            const fullPath = path.join(baseDir, file.name);
            const relativePath = path.relative(currDir, fullPath);
            const entryName = changeExtension(relativePath, ""); // remove file extension
            if (file.isDirectory()) {
                await walk(fullPath, baseDir); // Recursive call for subdirectories
            } else {
                entries[entryName] = fullPath;
            }
        }));
    }
    

    await walk(rootDir, rootDir);

    return entries;
}*/
