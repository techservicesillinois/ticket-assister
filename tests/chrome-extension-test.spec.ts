import { test, expect } from './fixtures';

test("Popup page has expected buttons", async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/pages/index.html`);
  await expect(page.locator("body")).toContainText("Options");
});