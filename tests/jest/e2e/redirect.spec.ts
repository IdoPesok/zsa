import { expect, test } from "@playwright/test"

test("it should correctly show isPending until the redirect is finished", async ({
  page,
}) => {
  await page.goto("/tests/client/redirect-action")

  // check that button is not disabled
  await expect(page.locator("button")).toBeEnabled()

  // click the button
  const start = Date.now()
  await page.locator("button").click()

  // wait for the console log
  page.on("console", (msg) => {
    expect(msg.text()).toContain("redirected")
    expect(Date.now() - start).toBeGreaterThanOrEqual(5000)
  })

  // wait for < 5 seconds
  await page.waitForTimeout(4500)
  // check that button is still disabled (while pending)
  await expect(page.url()).toContain("/redirect-action")
  await expect(page.locator("button")).toBeDisabled()

  // wait for the page to stop loading
  await page.waitForLoadState("networkidle")
  await expect(page.url()).toContain("/slow")

  // check it all took between 5-6 seconds
  await expect(Date.now() - start).toBeGreaterThanOrEqual(5000)
  await expect(Date.now() - start).toBeLessThanOrEqual(6000)
})
