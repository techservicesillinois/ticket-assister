import { describe, test, expect } from "vitest";
import { getAllFilesSync } from "./fs";
import * as path from "path";

describe("getAllFilesSync", () => {
    test("works for one file at the same level", async () => {
        // only thing that we can guarantee is that this file exists
        // and even that is hard to guarantee
        const filesHere = await getAllFilesSync(__dirname);
        expect(Object.keys(filesHere)).toContain(path.relative(__dirname, __filename));
        expect(Object.values(filesHere)).toContain(__filename);
    });
    // todo write more test cases
});
