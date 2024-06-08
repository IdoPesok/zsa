import { expect, test } from "@playwright/test"

test("it should correctly show isPending until the redirect is finished", async ({
  page,
}) => {
  await page.goto("/tests/client/redirect-action")

  // check that button is not disabled
  await expect(page.locator("button")).toBeEnabled()

  // click the button
  await page.locator("button").click()

  // wait for 5 seconds
  await page.waitForTimeout(5000)

  // check that button is still disabled (while pending)
  await expect(page.url()).toContain("/redirect-action")
  await expect(page.locator("button")).toBeDisabled()

  // check that page has been redirected
  await page.waitForTimeout(500)
  await expect(page.url()).toContain("/slow")
})
