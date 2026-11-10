import { useEffect, useRef, useState } from 'react'
import { RUN_LIMIT_MS } from '../api'

function LongRunDialog({ startedAt, onStop, onKeep }) {
  const [now, setNow] = useState(() => Date.now())
  const stopRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])
  useEffect(() => stopRef.current?.focus(), [startedAt])

  if (startedAt == null) return null
  const left = Math.max(0, Math.ceil((RUN_LIMIT_MS - (now - startedAt)) / 1000))
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onKeyDown={(e) => e.key === 'Escape' && onKeep()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="longrun-title" className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-80 text-center">
        <h2 id="longrun-title" className="text-white font-bold mb-2">This is taking longer than usual</h2>
        <p className="text-gray-400 text-sm mb-1">The run is stopped automatically after 1 minute.</p>
        <p data-testid="longrun-countdown" className="font-mono text-2xl text-green-400 mb-4">
          {left > 0 ? clock : 'Finishing up…'}
        </p>
        <div className="flex gap-2 justify-center">
          <button ref={stopRef} onClick={onStop} className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
            Stop
          </button>
          <button onClick={onKeep} className="bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
            Keep waiting
          </button>
        </div>
      </div>
    </div>
  )
}

export default LongRunDialog
