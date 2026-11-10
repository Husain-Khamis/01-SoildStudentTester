import { useEffect, useRef, useState } from 'react'

const SHOW_AFTER_MS = 5000

// Tracks one in-flight Run/Test: gives it an AbortSignal and flags it once it has been running a while
export function useRun() {
  const ac = useRef(null)
  const timer = useRef(null)
  const [startedAt, setStartedAt] = useState(null) // set once the "taking longer" dialog should show

  const end = () => {
    clearTimeout(timer.current)
    setStartedAt(null)
  }
  useEffect(() => () => {
    clearTimeout(timer.current)
    ac.current?.abort()
  }, [])

  async function track(fn) {
    ac.current = new AbortController()
    const start = Date.now()
    timer.current = setTimeout(() => setStartedAt(start), SHOW_AFTER_MS)
    try {
      return await fn(ac.current.signal)
    } finally {
      end()
    }
  }
  return { track, stop: () => ac.current?.abort(), keepWaiting: () => setStartedAt(null), startedAt }
}
