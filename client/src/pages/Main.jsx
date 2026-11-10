import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createSlot, deleteSlot, exportSlot, importSlot, passedCount, renameSlot, setActive, useSaves,
} from '../saves'

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
  const saves = useSaves()
  const fileInput = useRef(null)
  const [error, setError] = useState('')

  const btn = 'text-xs text-gray-300 hover:text-white underline-offset-2 hover:underline'

  function newGame() {
    const name = window.prompt('Name your save slot', `Slot ${saves.slots.length + 1}`)
    if (name !== null) createSlot(name.trim())
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      setError('')
      await importSlot(file)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleLanguageSelect(lang) {
    if (!saves.activeId && saves.slots.length === 0) createSlot('Slot 1')
    navigate(`/questions?lang=${lang}`)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <nav className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-green-400">Solid Tester</h1>
      </nav>

      <main className="flex flex-col items-center justify-center flex-1 gap-10 px-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-3">Practice Checkpoints</h2>
          <p className="text-gray-400 text-lg">Select a language to get started</p>
        </div>

        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Save slots</p>
            <button
              onClick={() => fileInput.current.click()}
              disabled={saves.slots.length >= 3}
              className="text-xs text-gray-300 hover:text-white disabled:opacity-40"
            >
              Import
            </button>
            <input ref={fileInput} type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />
          </div>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => {
              const slot = saves.slots[i]
              if (!slot) {
                return (
                  <button
                    key={i}
                    onClick={newGame}
                    className="border-2 border-dashed border-gray-700 hover:border-green-500 rounded-xl p-4 text-gray-400 hover:text-white transition-colors duration-150"
                  >
                    New game
                  </button>
                )
              }
              const active = slot.id === saves.activeId
              return (
                <div
                  key={slot.id}
                  className={`bg-gray-800 rounded-xl p-4 border-2 ${active ? 'border-green-500' : 'border-gray-700'}`}
                >
                  <p className="font-bold truncate">{slot.name}</p>
                  <p className="text-xs text-gray-400">{new Date(slot.updatedAt).toLocaleString()}</p>
                  <p className="text-xs text-green-400 mb-3">{passedCount(slot)} passed</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <button onClick={() => setActive(slot.id)} className={btn}>{active ? 'Active' : 'Continue'}</button>
                    <button
                      onClick={() => {
                        const name = window.prompt('Rename slot', slot.name)
                        if (name?.trim()) renameSlot(slot.id, name.trim())
                      }}
                      className={btn}
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => window.confirm(`Delete "${slot.name}"? This cannot be undone.`) && deleteSlot(slot.id)}
                      className={btn}
                    >
                      Delete
                    </button>
                    <button onClick={() => exportSlot(slot.id)} className={btn}>Export</button>
                  </div>
                </div>
              )
            })}
          </div>
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