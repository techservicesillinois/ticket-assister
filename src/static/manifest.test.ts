import { describe, test, expect } from "vitest";
import * as path from "path";
import * as fs from "fs";

const MANIFEST_PATH_REL = "manifest.json";

const MANIFEST_PATH_FULL = path.join(__dirname, MANIFEST_PATH_REL);

describe("manifest.json", () => {
    test("Is valid JSON", async () => {
        const fileContents = fs.readFileSync(MANIFEST_PATH_FULL, "utf-8");
        expect(JSON.parse(fileContents)).toBeDefined(); // and not to error
    });
    test("Has required keys", async () => {
        const fileContents = fs.readFileSync(MANIFEST_PATH_FULL, "utf-8");
        const json = JSON.parse(fileContents);
        expect(json).toHaveProperty("manifest_version");
        expect(json).toHaveProperty("name");
        expect(json).toHaveProperty("version");
    });
    test("Has the same version as package.json", async () => {
        const manifestFileContents = fs.readFileSync(MANIFEST_PATH_FULL, "utf-8");
        const manifestJson = JSON.parse(manifestFileContents);
        const packageFileContents = fs.readFileSync(path.join(__dirname, "..", "..", "package.json"), "utf-8");
        const packageJson = JSON.parse(packageFileContents);
        expect(manifestJson.version).toEqual(packageJson.version);
    });
});