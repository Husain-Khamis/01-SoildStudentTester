function ResultBadge({ result }) {
  if (!result) return null
  const [label, color] = result.timedOut
    ? ['Timed out', 'bg-amber-500']
    : result.passed
      ? ['Passed', 'bg-green-500']
      : ['Failed', 'bg-red-500']
  return (
    <span className={`${color} text-white text-xs font-semibold px-3 py-1 rounded-full`}>{label}</span>
  )
}

export default ResultBadge
