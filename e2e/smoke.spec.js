const { test, expect } = require('@playwright/test')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const fixture = (name) => fs.readFileSync(path.join(__dirname, '../server/test/fixtures', name), 'utf8')
const getValue = (page) => page.evaluate(() => window.monaco.editor.getModels()[0].getValue())
const setValue = (page, code) =>
  page.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code)

async function openGcd(page) {
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
}

test('go gcd: pass and fail', async ({ page }) => {
  await openGcd(page)
  await expect.poll(() => getValue(page)).toBe('// gcd.go\n')

  await setValue(page, fixture('gcd.go'))
  await page.getByRole('button', { name: 'Test', exact: true }).click()
  await expect(page.getByText('Passed', { exact: true })).toBeVisible({ timeout: 150_000 })

  await setValue(page, fixture('gcd_bad.go'))
  await page.getByRole('button', { name: 'Test', exact: true }).click()
  await expect(page.getByText('Failed', { exact: true })).toBeVisible({ timeout: 150_000 })
})


test('output panel is resizable', async ({ page }) => {
  await openGcd(page)
  const output = page.getByTestId('output-panel')
  const before = (await output.boundingBox()).height

  const handle = (await page.getByTestId('output-handle').boundingBox())
  const x = handle.x + handle.width / 2
  const y = handle.y + handle.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y - 150, { steps: 10 })
  await page.mouse.up()

  expect((await output.boundingBox()).height).toBeGreaterThan(before + 100)
})

async function openExercise(page, lang, name) {
  await page.getByRole('button', { name: lang }).click()
  const ex = page.getByRole('button', { name: new RegExp(`^${name}\\s*✓?$`) })
  const levels = page.getByRole('button', { name: /^Level \d+/ })
  await expect(levels.first()).toBeVisible({ timeout: 60_000 })
  for (const level of await levels.all()) {
    if (await ex.isVisible()) break
    await level.click()
  }
  await ex.click()
  await page.waitForSelector('.monaco-editor')
}

test('js factorial: run executes the usage program', async ({ page }) => {
  await page.goto('/')
  await openExercise(page, /^JavaScript/, 'js-factorial')
  await expect(page.getByRole('button', { name: 'main (usage)' })).toBeVisible({ timeout: 30_000 })
  await setValue(page, fixture('factorial.js'))
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByTestId('output-panel').locator('pre')).toHaveText('120\n1')
})

test('save slot: autosave, passed mark, export', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  page.once('dialog', (d) => d.accept('E2E'))
  await page.getByRole('button', { name: 'New game' }).first().click()
  await expect(page.getByText('E2E', { exact: true })).toBeVisible()

  await openExercise(page, /^Go/, 'gcd')
  await setValue(page, fixture('gcd.go'))
  await page.waitForTimeout(1000) // autosave debounce
  await page.reload()
  await openExercise(page, /^Go/, 'gcd')
  await expect.poll(() => getValue(page)).toBe(fixture('gcd.go'))

  await page.getByRole('button', { name: 'Test', exact: true }).click()
  await expect(page.getByText('Passed', { exact: true })).toBeVisible({ timeout: 150_000 })
  await expect(page.getByRole('button', { name: /^gcd\s*✓$/ })).toBeVisible()

  await page.getByRole('link', { name: 'Solid Tester' }).click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('solid-tester-E2E.json')
})

test('go onlya (program exercise): run works without a usage tab', async ({ page }) => {
  await page.goto('/')
  await openExercise(page, /^Go/, 'onlya')
  await setValue(page, fixture('onlya.go'))
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByTestId('output-panel').locator('pre')).toHaveText('a', { timeout: 150_000 })
})

test('js run captures async logs from timers', async ({ page }) => {
  await page.goto('/')
  await openExercise(page, /^JavaScript/, 'js-factorial')
  await setValue(page, fixture('factorial.js') + "\nsetTimeout(() => console.log('later'), 100); console.log('now')")
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  const out = page.getByTestId('output-panel').locator('pre')
  await expect(out).toContainText('now')
  await expect(out).toContainText('later')
})

async function expectStoppableDialog(page, run) {
  const dialog = page.getByRole('dialog', { name: /taking longer than usual/ })
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('longrun-countdown')).toHaveText(/^0:\d\d$/)
  await expect(page.getByRole('button', { name: 'Stop' })).toBeFocused()
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId('output-panel')).toContainText('stopped by user')
  await expect(page.getByRole('button', { name: run, exact: true })).toBeEnabled()
}

test('js infinite loop: dialog appears and Stop kills the run', async ({ page }) => {
  await page.goto('/')
  await openExercise(page, /^JavaScript/, 'js-factorial')
  await setValue(page, 'while (true) {}')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expectStoppableDialog(page, 'Run')
})

test('go infinite loop: Stop removes the grader container', async ({ page }) => {
  await openGcd(page)
  await setValue(page, fixture('gcd_loop.go'))
  await page.getByRole('button', { name: 'Test', exact: true }).click()
  await expectStoppableDialog(page, 'Test')
  await expect
    .poll(() => execFileSync('docker', ['ps', '-q', '--filter', 'label=solid-tester-grader']).toString().trim(), { timeout: 5000 })
    .toBe('')
})
