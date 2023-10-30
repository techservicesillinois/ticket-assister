import { test, expect } from "./fixtures";
import fs from "fs";
import path from "path";

// get popup page URL
// something like "pages/index.html"
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "static", "manifest.json"), "utf8"));
const defaultPopupRelativePath = manifest.action.default_popup;
test("Popup page has options button and it opens the options page", async ({ page, extensionId, context }) => {
	await page.goto(`chrome-extension://${extensionId}/${defaultPopupRelativePath}`);
	await expect(page.locator("button:has-text('Options'), a:has-text('Options')")).toBeVisible();

	const prevUrl = page.url();
	await page.locator("button:has-text('Options'), a:has-text('Options')").click();
	const newTab = await context.waitForEvent("page");
	await newTab.waitForLoadState();
	expect(newTab.url(), "Should have opened a new tab with a different URL").not.toEqual(prevUrl);
});
test("Popup page has help button and it opens the help page", async ({ page, extensionId, context }) => {
	await page.goto(`chrome-extension://${extensionId}/${defaultPopupRelativePath}`);
	await expect(page.locator("button:has-text('Help'), a:has-text('Help')")).toBeVisible();

	const prevUrl = page.url();
	await page.locator("button:has-text('Options'), a:has-text('Options')").click();
	const newTab = await context.waitForEvent("page");
	await newTab.waitForLoadState();
	expect(newTab.url(), "Should have opened a new tab with a different URL").not.toEqual(prevUrl);
});
