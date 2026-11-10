export const RUN_LIMIT_MS = 60_000
const STOPPED_BY_USER = '[stopped by user]'

async function post(path, lang, name, code, main, signal) {
  try {
    return await postJson(path, lang, name, code, main, signal)
  } catch (err) {
    if (err.name === 'AbortError') return { stopped: true, passed: false, output: STOPPED_BY_USER }
    throw err
  }
}

async function postJson(path, lang, name, code, main, signal) {
  const res = await fetch(`/api/questions/${path}`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang, name, code, ...(main != null && { main }) })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const runOnServer = (lang, name, code, main, signal) => post('run', lang, name, code, main, signal)
export const testCode = (lang, name, code, signal) => post('test', lang, name, code, undefined, signal)

// Runs inside the worker (serialized via toString, so it must stay self-contained)
function workerBody() {
  const fmt = (v) => {
    if (typeof v !== 'object' || v === null) return String(v)
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  for (const k of ['log', 'info', 'warn', 'error']) {
    console[k] = (...args) => postMessage({ log: args.map(fmt).join(' ') })
  }
  const live = new Set() // pending timers; the run is over when sync code is done and this is empty
  let ran = false
  const check = () => ran && !live.size && postMessage({ done: true })
  const fail = (err) => {
    postMessage({ log: `Error: ${err?.message ?? err}` })
    postMessage({ done: true })
  }
  const wrap = (set, repeat) => (fn, ms, ...args) => {
    const id = set(() => {
      if (!repeat) live.delete(id)
      try {
        if (typeof fn === 'function') fn(...args)
      } catch (err) {
        return fail(err)
      }
      check()
    }, ms)
    live.add(id)
    return id
  }
  const unwrap = (clear) => (id) => {
    live.delete(id)
    clear(id)
    check()
  }
  const st = setTimeout
  self.setTimeout = wrap(st, false)
  self.setInterval = wrap(setInterval, true)
  self.clearTimeout = unwrap(clearTimeout)
  self.clearInterval = unwrap(clearInterval)
  addEventListener('unhandledrejection', (e) => fail(e.reason))
  onmessage = (e) => {
    try {
      new Function(e.data)()
    } catch (err) {
      return fail(err)
    }
    ran = true
    st(check, 0)
  }
}

// JS runs in a worker so an infinite loop can be terminated; resolves when done, stopped, or at the 1-minute limit
function runJs(src, signal) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([`(${workerBody})()`], { type: 'text/javascript' }))
    const worker = new Worker(url)
    const logs = []
    const end = (note, flags) => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      worker.terminate()
      URL.revokeObjectURL(url)
      resolve({ output: [...logs, ...(note ? [note] : [])].join('\n') || 'No output', ...flags })
    }
    const onAbort = () => end(STOPPED_BY_USER, { stopped: true })
    const timer = setTimeout(() => end('[stopped: exceeded 1 minute]', { timedOut: true }), RUN_LIMIT_MS)
    signal?.addEventListener('abort', onAbort, { once: true })
    let size = 0
    worker.onmessage = (e) => {
      if (e.data.done) return end()
      logs.push(e.data.log)
      size += e.data.log.length
      // same 64KB cap as the server grader, so a log flood can't exhaust the page
      if (size > 64 * 1024) end('[output truncated]', { stopped: true })
    }
    worker.onerror = (e) => {
      logs.push(`Error: ${e.message}`)
      end()
    }
    worker.postMessage(src)
  })
}

// JS runs in the browser (code + usage program); go/rust go to the server. Returns { output, timedOut?, stopped? }.
export async function runAny(lang, name, code, main, signal) {
  if (lang === 'js') return runJs(main ? `${code}\n${main}` : code, signal)
  const data = await runOnServer(lang, name, code, main, signal)
  return { ...data, output: data.output || 'No output' }
}
