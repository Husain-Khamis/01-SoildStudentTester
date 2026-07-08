import { useEffect, useState } from 'react'

const LANGUAGES = [
  { id: 'go', name: 'Go', color: 'text-cyan-400' },
  { id: 'js', name: 'JavaScript', color: 'text-yellow-400' },
  { id: 'rust', name: 'Rust', color: 'text-orange-400' },
]

function groupByLevel(questions) {
  const groups = {}
  for (const question of questions) {
    const key = question.group
    if (!groups[key]) groups[key] = []
    groups[key].push(question)
  }
  return groups
}

function Sidebar({
  lang,
  questions,
  setQuestions,
  loading,
  setLoading,
  selectedQuestion,
  onQuestionSelect,
  onLanguageChange,
  onMockExam,
}) {
  const [openGroups, setOpenGroups] = useState({})

  useEffect(() => {
    if (!lang) return
    setLoading(true)
    fetch(`/api/questions?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [lang])

  async function handleMockExam() {
    try {
      const res = await fetch(`/api/questions/mock-exam?lang=${lang}`)
      const data = await res.json()
      onMockExam(data)
    } catch (err) {
      console.error(err)
    }
  }

  function toggleGroup(group) {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }))
  }

  const grouped = groupByLevel(questions)

  return (
    <aside className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Language</p>
        <div className="flex flex-col gap-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => l.id !== lang && onLanguageChange(l.id)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                l.id === lang
                  ? 'bg-gray-700 ' + l.color
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-gray-700">
        <button
          onClick={handleMockExam}
          className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
        >
          Mock Exam
        </button>
      </div>

      <div className="p-4 flex flex-col gap-2 overflow-y-auto">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading questions...</p>
        ) : (
          Object.entries(grouped).map(([group, qs]) => (
            <div key={group}>
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-400 uppercase tracking-widest hover:bg-gray-700 transition-colors duration-150"
              >
                <span>Level {group}</span>
                <span>{openGroups[group] ? '▲' : '▼'}</span>
              </button>

              {openGroups[group] && (
                <div className="flex flex-col gap-1 mt-1 ml-2">
                  {qs.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => onQuestionSelect(q)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                        selectedQuestion?.id === q.id
                          ? 'bg-green-500 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {q.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}

export default Sidebar