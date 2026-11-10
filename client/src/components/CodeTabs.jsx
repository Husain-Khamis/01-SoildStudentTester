import { useState } from 'react'
import Editor from '@monaco-editor/react'

const LANGUAGE_MAP = {
  js: 'javascript',
  go: 'go',
  rust: 'rust'
}

// Solution editor; with `main` set, a second "main (usage)" tab holds the program Run executes alongside it.
function CodeTabs({ lang, id, file, code, onCode, main, onMain }) {
  const [tab, setTab] = useState('code')
  const showMain = main != null && tab === 'main'
  const tabClass = (active) =>
    `px-3 py-1 text-xs font-mono ${active ? 'bg-gray-800 text-green-400' : 'text-gray-400 hover:text-white'}`

  return (
    <div className="h-full flex flex-col">
      {main != null && (
        <div className="flex bg-gray-900 border-b border-gray-700">
          <button onClick={() => setTab('code')} className={tabClass(tab === 'code')}>{file}</button>
          <button onClick={() => setTab('main')} className={tabClass(tab === 'main')}>main (usage)</button>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={LANGUAGE_MAP[lang]}
          theme="vs-dark"
          path={`${id}/${showMain ? 'main' : file}`}
          value={showMain ? main : code}
          onChange={(value) => (showMain ? onMain : onCode)(value ?? '')}
          options={{
            fontSize: 14,
            automaticLayout: true,
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
    </div>
  )
}

export default CodeTabs
