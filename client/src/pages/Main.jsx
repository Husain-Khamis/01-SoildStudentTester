import { useNavigate } from 'react-router-dom'

const languages = [
  {
    id: 'go',
    name: 'Go',
    description: 'Checkpoint questions for the Go programming language',
    color: 'bg-cyan-500',
    hover: 'hover:bg-cyan-600',
  },
  {
    id: 'js',
    name: 'JavaScript',
    description: 'Checkpoint questions for the JavaScript programming language',
    color: 'bg-yellow-400',
    hover: 'hover:bg-yellow-500',
  },
  {
    id: 'rust',
    name: 'Rust',
    description: 'Checkpoint questions for the Rust programming language',
    color: 'bg-orange-500',
    hover: 'hover:bg-orange-600',
  },
]

function Main() {
  const navigate = useNavigate()

  function handleLanguageSelect(lang) {
    navigate(`/questions?lang=${lang}`)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <nav className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-green-400">01 Tester</h1>
      </nav>

      <main className="flex flex-col items-center justify-center flex-1 gap-10 px-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-3">Practice Checkpoints</h2>
          <p className="text-gray-400 text-lg">Select a language to get started</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => handleLanguageSelect(lang.id)}
              className={`${lang.color} ${lang.hover} rounded-xl p-6 text-left transition-colors duration-200 cursor-pointer`}
            >
              <h3 className="text-xl font-bold mb-2">{lang.name}</h3>
              <p className="text-sm opacity-80">{lang.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Main