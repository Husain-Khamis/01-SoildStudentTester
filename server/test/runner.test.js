const { test } = require('node:test')
const assert = require('node:assert')
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { runInImage } = require('../runner')

let hasDocker = true
try { execFileSync('docker', ['info'], { stdio: 'ignore' }) } catch { hasDocker = false }

const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8')
const GO = 'ghcr.io/01-edu/test-go'
const go = { image: GO, exercise: 'gcd', file: 'gcd.go', allowedFunctions: ['--allow-builtin'] }
const opts = { skip: !hasDocker && 'docker unavailable', timeout: 240000 }

test('go gcd passes', opts, async () => {
    const r = await runInImage({ ...go, code: fx('gcd.go') })
    assert.ok(r.passed, r.output)
})

test('go gcd wrong answer fails', opts, async () => {
    const r = await runInImage({ ...go, code: fx('gcd_bad.go') })
    assert.ok(!r.passed)
    assert.match(r.output, /instead of/)
})

test('go compile error fails', opts, async () => {
    const r = await runInImage({ ...go, code: 'package piscine\nfunc Gcd(' })
    assert.ok(!r.passed)
})

test('go infinite loop times out and container is removed', opts, async () => {
    const r = await runInImage({ ...go, code: fx('gcd_loop.go'), timeoutMs: 5000 })
    assert.ok(r.timedOut && !r.passed)
    assert.strictEqual(execFileSync('docker', ['ps', '-a', '-q', '--filter', `ancestor=${GO}`]).toString().trim(), '')
})

const onlya = { image: GO, exercise: 'onlya', file: 'onlya/main.go', allowedFunctions: ['github.com/01-edu/z01.PrintRune', '--allow-builtin'] }

test('go onlya passes', opts, async () => {
    const r = await runInImage({ ...onlya, code: fx('onlya.go') })
    assert.ok(r.passed, r.output)
})

test('go onlya with banned import fails', opts, async () => {
    const r = await runInImage({ ...onlya, code: fx('onlya_banned.go') })
    assert.ok(!r.passed)
    assert.match(r.output, /illegal-import/)
})

const js = { image: 'ghcr.io/01-edu/module-js', exercise: 'js-factorial', file: 'factorial.js' }

test('js factorial passes', opts, async () => {
    const r = await runInImage({ ...js, code: fx('factorial.js') })
    assert.ok(r.passed, r.output)
})

test('js factorial bad fails', opts, async () => {
    assert.ok(!(await runInImage({ ...js, code: fx('factorial_bad.js') })).passed)
})

const rs = { image: 'ghcr.io/01-edu/module-rust', exercise: 'min_and_max', file: 'min_and_max/src/lib.rs' }

test('rust min_and_max passes', opts, async () => {
    const r = await runInImage({ ...rs, code: fx('min_and_max.rs') })
    assert.ok(r.passed, r.output)
})

test('rust min_and_max bad fails', opts, async () => {
    assert.ok(!(await runInImage({ ...rs, code: fx('min_and_max_bad.rs') })).passed)
})

test('go gcd runs with the usage main', opts, async () => {
    const r = await runInImage({ ...go, runOnly: true, code: fx('gcd.go'), extraFile: { path: 'gcd/main.go', code: fx('gcd_main.go') } })
    assert.strictEqual(r.output.trim(), '2\n6\n7\n1')
})

test('rust min_and_max runs with the usage main', opts, async () => {
    const r = await runInImage({ ...rs, runOnly: true, code: fx('min_and_max.rs'), extraFile: { path: 'min_and_max/src/main.rs', code: fx('min_and_max_main.rs') } })
    assert.match(r.output, /Minimum and maximum are: \(2, 9\)/)
})

test('go sandbox: read-only fs, bounded disk, non-root', opts, async () => {
    const r = await runInImage({ ...onlya, runOnly: true, code: fx('diskbomb.go') })
    assert.match(r.output, /no space left on device/)
    assert.match(r.output, /read-only file system/)
    assert.match(r.output, /id 1000/)
})

test('aborting a run kills the container quickly', opts, async () => {
    const ac = new AbortController()
    setTimeout(() => ac.abort(), 2000)
    const t = Date.now()
    const r = await runInImage({ ...go, code: fx('gcd_loop.go'), signal: ac.signal })
    assert.ok(r.stopped && !r.passed && Date.now() - t < 20000)
    assert.strictEqual(execFileSync('docker', ['ps', '-aq', '--filter', 'label=solid-tester-grader']).toString().trim(), '')
})
