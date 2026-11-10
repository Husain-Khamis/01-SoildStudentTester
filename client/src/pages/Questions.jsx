import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { activeSlot, useSaveError, useSaves } from '../saves'
import { Group, Panel, useDefaultLayout } from 'react-resizable-panels'
import Sidebar from '../components/Sidebar'
import QuestionView from '../components/QuestionView'
import MockExam from '../components/MockExam'
import ResizeHandle from '../components/ResizeHandle'

function Questions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [isMockExam, setIsMockExam] = useState(false)
  const [mockExamQuestions, setMockExamQuestions] = useState([])
  const [loading, setLoading] = useState(false)

  const layout = useDefaultLayout({ id: 'layout-main', storage: localStorage })

  const slot = activeSlot(useSaves())
  const saveError = useSaveError()

  const lang = searchParams.get('lang')

  function handleLanguageChange(newLang) {
    setSearchParams({ lang: newLang })
    setSelectedQuestion(null)
    setIsMockExam(false)
    setQuestions([])
    setMockExamQuestions([])
  }

  function handleQuestionSelect(question) {
    setIsMockExam(false)
    setSelectedQuestion(question)
  }

  function handleMockExam(questions) {
    setIsMockExam(true)
    setSelectedQuestion(null)
    setMockExamQuestions(questions)
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <nav className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex items-center gap-4">
        <Link to="/" title="Switch save slot" className="text-xl font-bold text-green-400">Solid Tester</Link>
        <span className="text-gray-400 text-sm uppercase tracking-widest">{lang}</span>
        {slot && (
          <span className="ml-auto text-sm text-gray-400">
            {slot.name}{' '}
            {saveError ? (
              <span className="text-red-400">· {saveError}</span>
            ) : (
              <span className="text-gray-600">· Saved {new Date(slot.updatedAt).toLocaleTimeString()}</span>
            )}
          </span>
        )}
      </nav>

      <Group orientation="horizontal" className="flex-1 overflow-hidden" {...layout}>
        <Panel id="sidebar" defaultSize="18%" minSize="12%" maxSize="40%">
          <Sidebar
            lang={lang}
            questions={questions}
            setQuestions={setQuestions}
            loading={loading}
            setLoading={setLoading}
            selectedQuestion={selectedQuestion}
            onQuestionSelect={handleQuestionSelect}
            onLanguageChange={handleLanguageChange}
            onMockExam={handleMockExam}
          />
        </Panel>
        <ResizeHandle aria-label="Resize sidebar" />
        <Panel id="content" minSize="30%" className="flex flex-col">
          {isMockExam ? (
            <MockExam questions={mockExamQuestions} lang={lang} />
          ) : selectedQuestion ? (
            <QuestionView key={selectedQuestion.id} question={selectedQuestion} lang={lang} />
          ) : (
            <main className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a question from the sidebar to get started</p>
            </main>
          )}
        </Panel>
      </Group>
    </div>
  )
}

export default Questions