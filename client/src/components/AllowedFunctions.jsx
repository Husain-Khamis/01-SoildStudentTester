const chip = 'bg-gray-700 text-xs px-2 py-1 rounded font-mono'

function AllowedFunctions({ functions, lang }) {
  if (lang !== 'go') return null
  const list = functions || []
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Allowed functions</p>
      <div className="flex gap-2 flex-wrap items-center">
        {list.length === 0 ? (
          <span className={`${chip} text-gray-400 font-sans`}>Any (no restrictions)</span>
        ) : (
          <>
            {list.map((f) => (
              <span key={f} className={`${chip} text-green-400 break-all`}>
                {f === '--allow-builtin' ? 'builtins (len, append, …)' : f}
              </span>
            ))}
            {!list.includes('--allow-builtin') && (
              <span className="text-xs text-gray-400">Builtins like len/append not allowed</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AllowedFunctions
