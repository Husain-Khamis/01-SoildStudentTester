async function post(path, lang, name, code) {
  const res = await fetch(`/api/questions/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang, name, code })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const runOnServer = (lang, name, code) => post('run', lang, name, code)
export const testCode = (lang, name, code) => post('test', lang, name, code)

// JS runs in the browser; go/rust go to the server. Returns the output string.
export async function runAny(lang, name, code) {
  if (lang !== 'js') return (await runOnServer(lang, name, code)).output || 'No output'
  const logs = []
  const originalLog = console.log
  console.log = (...args) => logs.push(args.join(' '))
  try {
    new Function(code)()
    return logs.join('\n') || 'No output'
  } finally {
    console.log = originalLog
  }
}
