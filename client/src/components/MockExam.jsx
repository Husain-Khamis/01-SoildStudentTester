import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { runAny, testCode } from '../api'
import AllowedFunctions from './AllowedFunctions'
import ResultBadge from './ResultBadge'
import Workspace from './Workspace'
import CodeTabs from './CodeTabs'
import LongRunDialog from './LongRunDialog'
import { useRun } from '../useRun'
import { extractUsage } from '../usage'

const THREE_HOURS = 3 * 60 * 60

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

function MockExam({ questions, lang }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState({ subject: null, markdown: '' })
  const [codes, setCodes] = useState({})
  const [mains, setMains] = useState({})
  const [outputs, setOutputs] = useState({})
  const [results, setResults] = useState({})
  const [busy, setBusy] = useState(false)
  const run = useRun()
  const [timeLeft, setTimeLeft] = useState(THREE_HOURS)
  const [timeUp, setTimeUp] = useState(false)

  const activeQuestion = questions[activeIndex]?.question

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setTimeUp(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!activeQuestion) return
    fetch(`/api/questions/subject?path=${activeQuestion.subject}`)
      .then((res) => {
        if (!res.ok) throw new Error('Subject not found')
        return res.text()
      })
      .then((data) => setLoaded({ subject: activeQuestion.subject, markdown: data }))
      .catch(() =>
        setLoaded({ subject: activeQuestion.subject, markdown: 'Could not load question description.' })
      )
  }, [activeQuestion])

  const loadingMarkdown = loaded.subject !== activeQuestion?.subject
  const markdown = loaded.markdown

  function handleCodeChange(value) {
    setCodes((prev) => ({ ...prev, [activeIndex]: value }))
  }

  const file = activeQuestion?.expectedFiles?.[0]
  const code = codes[activeIndex] ?? `// ${file}\n`
  const usage = /(^|\/)main\.go$|src\/main\.rs$/.test(file) ? null : extractUsage(markdown)
  const main = loadingMarkdown || usage == null ? null : (mains[activeIndex] ?? usage)

  async function exec(fn) {
    const i = activeIndex
    const setOut = (v) => setOutputs((prev) => ({ ...prev, [i]: v }))
    setBusy(true)
    setResults((prev) => ({ ...prev, [i]: null }))
    setOut('')
    try {
      await run.track((signal) => fn(i, setOut, signal))
    } catch (err) {
      setOut(`Error: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const runCode = () =>
    exec(async (i, setOut, signal) => setOut((await runAny(lang, activeQuestion.name, code, main, signal)).output))

  const runTests = () =>
    exec(async (i, setOut, signal) => {
      const data = await testCode(lang, activeQuestion.name, code, signal)
      if (!data.stopped) setResults((prev) => ({ ...prev, [i]: data }))
      setOut(data.output || (data.passed ? 'All tests passed' : 'No output'))
    })

  if (timeUp) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 text-white">
        <h2 className="text-4xl font-bold text-red-500">Time is Up</h2>
        <p className="text-gray-400">Your mock exam session has ended</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <LongRunDialog startedAt={run.startedAt} onStop={run.stop} onKeep={run.keepWaiting} />
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-3">
        <span className="text-xs text-gray-400 uppercase tracking-widest mr-2">Mock Exam</span>

        <div className="flex gap-2 flex-1 flex-wrap">
          {questions.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 ${
                activeIndex === index
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Level {item.group}{results[index]?.passed ? ' ✓' : ''}
            </button>
          ))}
        </div>

        <span className={`font-mono text-sm font-bold ml-auto ${timeLeft < 600 ? 'text-red-400' : 'text-green-400'}`}>
          ⏱ {formatTime(timeLeft)}
        </span>
      </div>

      {activeQuestion && (
      <Workspace
        id="mock"
        description={
          <div className="overflow-y-auto h-full">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold text-white">{activeQuestion.name}</h1>
                <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Level {questions[activeIndex].group}
                </span>
              </div>

              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Difficulty</p>
                  <p className="text-white text-sm font-medium">{activeQuestion.difficulty}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Expected Files</p>
                  <div className="flex gap-2 flex-wrap">
                    {activeQuestion.expectedFiles.map((file) => (
                      <span
                        key={file}
                        className="bg-gray-700 text-green-400 text-xs px-2 py-1 rounded font-mono"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
                <AllowedFunctions functions={activeQuestion.allowedFunctions} lang={lang} />
              </div>
            </div>

            <div className="p-4">
              {loadingMarkdown ? (
                <p className="text-gray-500 text-sm">Loading question...</p>
              ) : (
                <div className="prose prose-invert max-w-none text-sm">
                  <ReactMarkdown>{markdown}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        }
        toolbar={
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Solution</p>
            <div className="flex items-center gap-2">
              {busy && <span className="text-xs text-gray-400">Running… (the first test per language downloads the grader image and may take a few minutes)</span>}
              <button
                onClick={runCode}
                disabled={busy}
                className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors duration-150"
              >
                Run
              </button>
              <button
                onClick={runTests}
                disabled={busy}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors duration-150"
              >
                Test
              </button>
            </div>
          </div>
        }
        editor={
          <CodeTabs
            key={activeIndex}
            lang={lang}
            id={`mock/${activeQuestion.name}`}
            file={file}
            code={code}
            onCode={handleCodeChange}
            main={main}
            onMain={(v) => setMains((prev) => ({ ...prev, [activeIndex]: v }))}
          />
        }
        output={
          <>
            <div className="px-4 py-2 border-b border-gray-700 flex items-center gap-3">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Output</p>
              <ResultBadge result={results[activeIndex]} />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-sm text-green-400">
              {outputs[activeIndex] ? (
                <pre className="whitespace-pre-wrap break-words">{outputs[activeIndex]}</pre>
              ) : (
                <p className="text-gray-600">Run your code to see output here</p>
              )}
            </div>
          </>
        }
      />
      )}
    </div>
  )
}

export default MockExam