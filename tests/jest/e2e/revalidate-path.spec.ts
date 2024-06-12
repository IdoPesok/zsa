import { expect, test } from "@playwright/test"

const PAGE_LOADING_TIME = 2000

test.describe.configure({ mode: "serial" })

test("it should correctly show isPending until the revalidate path is finished", async ({
  page,
}) => {
  await page.goto("/tests/client/revalidate-path")

  await page.waitForLoadState("networkidle")

  // check that button is not disabled
  await expect(page.locator("button")).toBeEnabled()

  // get the initial random number
  let initialRandomNumber = await page.locator("#random-number").textContent()

  // click the button
  let start = Date.now()
  await page.locator("button").click()

  // wait for the console log
  let stage = 0
  page.on("console", (msg) => {
    if (stage === 0) {
      expect(msg.text()).toContain("Hello, test!")
    } else {
      expect(msg.text()).toContain("Hello, test1!")
    }
    expect(Date.now() - start).toBeGreaterThanOrEqual(PAGE_LOADING_TIME)
    stage += 1
  })

  // wait for < 5 seconds
  await page.waitForTimeout(PAGE_LOADING_TIME - 10)
  // check that button is still disabled (while pending)
  await expect(page.locator("button")).toBeDisabled()

  // wait for the page to stop loading
  await page.waitForEvent("framenavigated")

  // check that the random number is different
  const newRandomNumber = await page.locator("#random-number").textContent()
  expect(newRandomNumber).not.toEqual(initialRandomNumber)
  initialRandomNumber = newRandomNumber

  // try clicking the button again
  start = Date.now()
  await page.locator("button").click()

  // wait for < 5 seconds
  await page.waitForTimeout(PAGE_LOADING_TIME - 10)
  // check that button is still disabled (while pending)
  await expect(page.locator("button")).toBeDisabled()

  // wait for the page to stop loading
  await page.waitForEvent("framenavigated")

  // check that the random number is different
  const newRandomNumber2 = await page.locator("#random-number").textContent()
  expect(newRandomNumber2).not.toEqual(initialRandomNumber)

  // expect 2 total console logs
  expect(stage).toEqual(2)
})

test("it should correctly show isPending until the [conditional] revalidate path is finished", async ({
  page,
}) => {
  await page.goto("/tests/client/revalidate-path-conditional")

  await page.waitForLoadState("networkidle")

  // check that button is not disabled
  await expect(page.locator("button")).toBeEnabled()

  const initialRandomNumber = await page.locator("#random-number").textContent()

  // click the button
  const start = Date.now()
  await page.locator("button").click()

  // wait for the console log
  page.on("console", (msg) => {
    expect(msg.text()).toContain("Hello, test!")
    expect(Date.now() - start).toBeGreaterThanOrEqual(PAGE_LOADING_TIME)
  })

  // wait for < 5 seconds
  await page.waitForTimeout(PAGE_LOADING_TIME - 10)
  // check that button is still disabled (while pending)
  await expect(page.locator("button")).toBeDisabled()

  // wait for the page to stop loading
  await page.waitForEvent("framenavigated")

  // check the reset button
  await expect(page.locator("#reset-button")).toBeEnabled()

  // check that the random number is different
  const newRandomNumber = await page.locator("#random-number").textContent()
  expect(newRandomNumber).not.toEqual(initialRandomNumber)
})
