import { test } from "../../fixtures";
import { BASE_URL } from "../../../src/config";

test("Can access TDX", async ({ page }) => {
  //await page.goto(`https://help.uillinois.edu/SBTDNext`);
  await page.goto(BASE_URL);
  // todo follow sign-in etc
  // and test that actually logged in ok
});