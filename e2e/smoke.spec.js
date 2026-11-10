const { test, expect } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const fixture = (name) => fs.readFileSync(path.join(__dirname, '../server/test/fixtures', name), 'utf8')
const getValue = (page) => page.evaluate(() => window.monaco.editor.getModels()[0].getValue())
const setValue = (page, code) =>
  page.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code)

test('go gcd: pass and fail', async ({ page }) => {
  await page.goto('/')
  for (const name of ['Go', 'JavaScript', 'Rust']) {
    await expect(page.getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible()
  }

  await page.getByRole('button', { name: /^Go/ }).click()
  await expect(page).toHaveURL(/\/questions\?lang=go/)

  // exercises are grouped under collapsible levels; expand until gcd shows
  const gcd = page.getByRole('button', { name: 'gcd', exact: true })
  const levels = page.getByRole('button', { name: /^Level \d+/ })
  await expect(levels.first()).toBeVisible({ timeout: 60_000 })
  for (const level of await levels.all()) {
    if (await gcd.isVisible()) break
    await level.click()
  }
  await gcd.click()

  await page.waitForSelector('.monaco-editor')
  await expect.poll(() => getValue(page)).toBe('// gcd.go\n')

  await setValue(page, fixture('gcd.go'))
  await page.getByRole('button', { name: 'Test', exact: true }).click()
  await expect(page.getByText('Passed', { exact: true })).toBeVisible({ timeout: 150_000 })

  await setValue(page, fixture('gcd_bad.go'))
  await page.getByRole('button', { name: 'Test', exact: true }).click()
  await expect(page.getByText('Failed', { exact: true })).toBeVisible({ timeout: 150_000 })
})
