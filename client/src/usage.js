// First non-console fenced code block under a "Usage" heading, or null.
// shortcut: the section ends at the next heading line, so a '# ' line inside a fence would cut it short.
export function extractUsage(markdown) {
  const start = markdown.match(/^#{1,6}\s*Usage\s*$/im)
  if (!start) return null
  let rest = markdown.slice(start.index + start[0].length)
  const next = rest.match(/^#{1,6}\s/m)
  if (next) rest = rest.slice(0, next.index)
  for (const m of rest.matchAll(/```(\w*)[^\n]*\n([\s\S]*?)```/g)) {
    if (m[1] !== 'console') return m[2].trimEnd() + '\n'
  }
  return null
}
