/*import { chromium } from 'playwright';
import * as path from "path";

(async () => {
  const pathToExtension = path.join(__dirname, "build");
  const userDataDir = '/tmp/test-user-data-dir';
  const browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ]
  });
  let [backgroundPage] = browserContext.backgroundPages();
  if (!backgroundPage)
    backgroundPage = await browserContext.waitForEvent('backgroundpage');

  // Test the background page as you would any other page.
  await browserContext.close();
})();*/
import { test, expect } from './fixtures';

/*test('example test', async ({ page }) => {
  await page.goto('https://help.uillinois.edu/SBTDNext/Home/Desktop/Default.aspx');
  await expect(page.locator('body')).toHaveText('Changed by my-extension');
});*/

test('popup page', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/pages/index.html`);
  await expect(page.locator('body')).toHaveText('Options');
});