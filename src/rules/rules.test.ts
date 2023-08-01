import * as fs from "fs/promises";
import * as path from "path";
import { describe, test, expect } from "vitest";
import rules from "./rules";
import { getAllFilesSync } from "../utils/fs";

const contentScriptsDir = path.resolve(__dirname, "..", "contentScripts");

/**
 * Gets the absolute paths
 * of every content script
 * in {@link contentScriptsDir} and subdirectories
 */
async function getContentScripts(): Promise<Array<string>> {
    return Object.values(await getAllFilesSync(contentScriptsDir));
}
// test testing dependencies
describe("dependencies", () => {
	test("getContentScripts helper works", async () => {
		await expect(getContentScripts())
			.resolves
			.toBeTypeOf("object"); // this is not very good
	});
});

test("Each rule should not have a duplicate name", async () => {
	/*rules.forEach(rule1 => {
		// descriptions of rules determine equality
		expect(rules.some(rule2 => rule2.description !== rule1.description && rule2.name === rule1.name), `Duplicate rule ${rule1.name}`).toBe(false);
	});*/
	for (let i = 0; i < rules.length; i++) {
		for (let j = 0; j < rules.length; j++) {
			if (i === j) continue;
			expect(rules[j].name === rules[i].name, `Duplicate rule ${rules[i].name} (#${i} and #${j})`).toBe(false);
		}
	}
});

test("Each rule should have a valid contentScript", async () => {
	await Promise.all(rules.map(async rule => {
		await Promise.all(rule.contentScripts.map(async contentScript => {
			const scriptPath = path.resolve(contentScriptsDir, contentScript.script);
			await expect(fs.access(scriptPath), `Content script at ${contentScript.script} not found for rule ${rule.name}`)
				.resolves
				.toBeUndefined(); // main thing is that it resolves
		}));
	}));
});
test("Each file in contentScripts should have a corresponding rule", async () => {
	const contentScripts = await getContentScripts();
	await Promise.all(contentScripts.map(async file => {
		const relativePath = path.relative(contentScriptsDir, file);
		const matchingRule = rules.find(rule => rule.contentScripts.some(contentScript => contentScript.script === relativePath));
		await expect(matchingRule, `Content script at ${file} has no associated rule registered for its path`).toBeDefined();
	}));
});

test("Each contentScript file should have a first line like // <rule name=\"NAME\">", async () => {
	const contentScripts = await getContentScripts();
	await Promise.all(contentScripts.map(async file => {
        const relativePath = path.relative(contentScriptsDir, file);
		const fileContents = await fs.readFile(file, "utf-8");
		const firstLineMatch = fileContents.match(/^\/\/\/? <rule name="(.+?)"\s?\/?>/);
		//expect(firstLineMatch, `Content script at ${relativePath} does not have a first line rule directive`).toBeTruthy();
		expect(firstLineMatch, `Content script at ${relativePath} does not have a first line rule directive`).not.toEqual(null);
		
        // if null, we already failed at least the test above
        if (firstLineMatch !== null) {
            const foundName = firstLineMatch[1];
            const matchingRule = rules.find(rule => rule.contentScripts.some(contentScript => contentScript.script === relativePath));
            expect(matchingRule, `Content script at ${relativePath} has no associated rule registered for its first line directive (inline name is ${foundName})`).toBeDefined();
			if (matchingRule !== undefined) {
				expect(matchingRule.name, `Content script at ${relativePath} does not have the correct matching name`)
					.toEqual(foundName);
			}
        }
	}));
});