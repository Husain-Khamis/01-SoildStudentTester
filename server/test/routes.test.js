const { test, before, after } = require('node:test')
const assert = require('node:assert')
const express = require('express')
const router = require('../routes/questions')

const tree = { children: { a: { type: 'exercise', id: 1, name: 'gcd', path: '/x/checkpoint-1/gcd', attrs: {
    language: 'go', parentType: 'exam', group: 1, expectedFiles: ['gcd.go'], allowedFunctions: ['--allow-builtin'],
    validations: [{ testImage: 'ghcr.io/01-edu/test-go' }] } } } }

let server, base, calls, busy, fetched
before(async () => {
    router._setDeps({
        fetchUpstream: async () => tree,
        fetchText: async (url) => { fetched = url; return '# gcd' },
        runInImage: async (opts) => {
            calls.push(opts)
            if (busy) throw Object.assign(new Error('busy'), { busy: true })
            return { passed: true, output: 'ok', timedOut: false }
        }
    })
    const app = express()
    app.use(express.json({ limit: '200kb' }))
    app.use('/api/questions', router)
    app.use(router.errorHandler)
    await new Promise(r => { server = app.listen(0, r) })
    base = `http://localhost:${server.address().port}/api/questions`
    calls = []
    busy = false
})
after(() => server.close())

const post = (p, body) => fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const ok = { lang: 'go', name: 'gcd', code: 'package piscine' }

test('rejects bad or missing lang', async () => {
    assert.strictEqual((await post('/test', { ...ok, lang: 'php' })).status, 400)
    assert.strictEqual((await post('/test', { name: 'gcd', code: 'x' })).status, 400)
})

test('unknown exercise and traversal names give 404', async () => {
    assert.strictEqual((await post('/test', { ...ok, name: 'nope' })).status, 404)
    assert.strictEqual((await post('/test', { ...ok, name: '../x' })).status, 404)
})

test('code must be a string up to 100KB', async () => {
    assert.strictEqual((await post('/test', { ...ok, code: 5 })).status, 400)
    assert.strictEqual((await post('/test', { ...ok, code: 'a'.repeat(100 * 1024 + 1) })).status, 400)
})

test('client-supplied image/file are ignored', async () => {
    calls = []
    const res = await post('/test', { ...ok, image: 'evil/img', file: '../../etc/passwd', allowedFunctions: ['x'] })
    assert.strictEqual(res.status, 200)
    assert.deepStrictEqual(await res.json(), { passed: true, output: 'ok', timedOut: false })
    assert.strictEqual(calls[0].image, 'ghcr.io/01-edu/test-go')
    assert.strictEqual(calls[0].file, 'gcd.go')
    assert.deepStrictEqual(calls[0].allowedFunctions, ['--allow-builtin'])
    assert.strictEqual(calls[0].runOnly, false)
})

test('/run rejects js, passes runOnly for others', async () => {
    assert.strictEqual((await post('/run', { ...ok, lang: 'js' })).status, 400)
    calls = []
    assert.strictEqual((await post('/run', ok)).status, 200)
    assert.strictEqual(calls[0].runOnly, true)
})

test('busy runner gives 429', async () => {
    busy = true
    assert.strictEqual((await post('/test', ok)).status, 429)
    busy = false
})

test('/subject rejects off-host and non-content paths', async () => {
    for (const p of ['.evil.example/x', '/api/internal/x', '@127.0.0.1:9999/']) {
        assert.strictEqual((await fetch(`${base}/subject?path=${encodeURIComponent(p)}`)).status, 400, p)
    }
})

test('/subject maps a subject path and serves text/plain', async () => {
    const res = await fetch(`${base}/subject?path=/markdown/root/public/subjects/gcd/README.md`)
    assert.strictEqual(res.status, 200)
    assert.match(res.headers.get('content-type'), /^text\/plain/)
    assert.strictEqual(fetched, 'https://learn.reboot01.com/api/content/root/01-edu_module/content/gcd/README.md')
})

test('malformed JSON gives 400 without stack details', async () => {
    const res = await fetch(base + '/test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' })
    const text = await res.text()
    assert.strictEqual(res.status, 400)
    assert.ok(!text.includes('node_modules') && !text.includes('at '))
})
