import { test, expect } from "./fixtures";
import fs from "fs";
import path from "path";

// get popup page URL
// something like "pages/index.html"
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "static", "manifest.json"), "utf8"));
const defaultPopupRelativePath = manifest.action.default_popup;
test("Popup page has options button", async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/${defaultPopupRelativePath}`);
	await expect(page.locator("button:has-text('Options'), a:has-text('Options')")).toBeVisible();
});
test("Popup page has help button", async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/${defaultPopupRelativePath}`);
	await expect(page.locator("button:has-text('Help'), a:has-text('Help')")).toBeVisible();
});
