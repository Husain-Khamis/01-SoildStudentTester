import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Editor from '@monaco-editor/react'

const LANGUAGE_MAP = {
  js: 'javascript',
  go: 'go',
  rust: 'rust'
}

function QuestionView({ question, lang }) {
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('// Write your solution here\n')
  const [output, setOutput] = useState('')

  useEffect(() => {
    if (!question) return
    setLoading(true)
    setCode('// Write your solution here\n')
    setOutput('')
    fetch(`/api/questions/subject?path=${question.subject}`)
      .then((res) => {
        if (!res.ok) throw new Error('Subject not found')
        return res.text()
      })
      .then((data) => {
        setMarkdown(data)
        setLoading(false)
      })
      .catch((err) => {
        setMarkdown('Could not load question description.')
        setLoading(false)
      })
  }, [question])

    async function runCode() {
        setOutput('Running...')

        if (lang === 'js') {
            const logs = []
            const originalLog = console.log
            console.log = (...args) => logs.push(args.join(' '))
            try {
                const fn = new Function(code)
                fn()
                setOutput(logs.join('\n') || 'No output')
            } catch (err) {
                setOutput(`Error: ${err.message}`)
            } finally {
                console.log = originalLog
            }
            return
        }

        if (lang === 'go') {
            try {
                const res = await fetch('/api/questions/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, lang })
                })
                const data = await res.json()
                setOutput(data.output || data.error || 'No output')
            } catch (err) {
                setOutput(`Error: ${err.message}`)
            }
        }
    }

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-96 bg-gray-800 border-r border-gray-700 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-white">{question.name}</h1>
            <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Level {question.group}
            </span>
          </div>

          <div className="flex gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Difficulty</p>
              <p className="text-white text-sm font-medium">{question.difficulty}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Expected Files</p>
              <div className="flex gap-2 flex-wrap">
                {question.expectedFiles.map((file) => (
                  <span
                    key={file}
                    className="bg-gray-700 text-green-400 text-xs px-2 py-1 rounded font-mono"
                  >
                    {file}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading question...</p>
          ) : (
            <div className="prose prose-invert max-w-none text-sm">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          )}
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Solution</p>
          {lang === 'js' ? (
            <button
              onClick={runCode}
              className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors duration-150"
            >
              Run Code
            </button>
          ) : (
            <span className="text-xs text-gray-500">Run code is only available for JavaScript</span>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={LANGUAGE_MAP[lang]}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value)}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              acceptSuggestionOnEnter: 'off',
              tabCompletion: 'off',
              wordBasedSuggestions: 'off',
              parameterHints: { enabled: false },
              hover: { enabled: false },
            }}
          />
        </div>

        <div className="h-48 bg-gray-950 border-t border-gray-700 flex flex-col">
          <div className="px-4 py-2 border-b border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Output</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-green-400">
            {output ? (
              <pre>{output}</pre>
            ) : (
              <p className="text-gray-600">Run your code to see output here</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionView