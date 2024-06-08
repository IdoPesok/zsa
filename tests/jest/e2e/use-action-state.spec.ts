import { expect, test } from "@playwright/test"

test("should correctly show data from useActionState", async ({ page }) => {
  await page.goto("/tests/client/use-action-state")

  // Check that there is no data or error element initially
  await expect(page.locator("#data")).toHaveCount(0)
  await expect(page.locator("#error")).toHaveCount(0)

  // Fill in the input field with a number
  await page.locator('input[name="number"]').fill("42")

  // Click the submit button
  await page.locator("button").click()

  // Wait for the action to complete and check for the presence of the data element
  await expect(page.locator("#data")).toHaveCount(1)
  await expect(page.locator("#data")).toContainText("42")

  // make sure there is no error element
  await expect(page.locator("#error")).toHaveCount(0)

  // Click the submit button again
  await page.locator("button").click()

  // check that data doubled
  await expect(page.locator("#data")).toContainText("84")
  await expect(page.locator("#error")).toHaveCount(0)
})

test("should correctly show data and error from multi entry useActionState", async ({
  page,
}) => {
  await page.goto("/tests/client/use-action-state?id=multientry")

  // Check that there is no data or error element initially
  await expect(page.locator("#data")).toHaveCount(0)
  await expect(page.locator("#error")).toHaveCount(0)

  // Fill in the input fields with two names
  await page.locator("#name-1").fill("John")
  await page.locator("#name-2").fill("Doe")

  // Click the submit button
  await page.locator("button").click()

  // Wait for the action to complete and check for the presence of the data element
  await expect(page.locator("#data")).toHaveCount(1)
  await expect(page.locator("#data")).toContainText('["John","Doe"]')

  // make sure there is no error element
  await expect(page.locator("#error")).toHaveCount(0)

  // try entering an invalid name
  await page.locator("#name-1").fill("invalid")

  // Click the submit button
  await page.locator("button").click()

  // Wait for the action to complete and check for the presence of the data element
  await expect(page.locator("#data")).toHaveCount(0)

  // make sure there is an error element
  await expect(page.locator("#error")).toHaveCount(1)
  await expect(page.locator("#error")).toContainText(
    '{"name":["invalid name"]}'
  )
})
