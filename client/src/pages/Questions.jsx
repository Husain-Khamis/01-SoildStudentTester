import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import QuestionView from '../components/QuestionView'
import MockExam from '../components/MockExam'

function Questions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [isMockExam, setIsMockExam] = useState(false)
  const [mockExamQuestions, setMockExamQuestions] = useState([])
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <nav className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex items-center gap-4">
        <h1 className="text-xl font-bold text-green-400">01 Tester</h1>
        <span className="text-gray-400 text-sm uppercase tracking-widest">{lang}</span>
      </nav>

      <div className="flex flex-1 overflow-hidden">
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

        {isMockExam ? (
          <MockExam questions={mockExamQuestions} lang={lang} />
        ) : selectedQuestion ? (
          <QuestionView question={selectedQuestion} lang={lang} />
        ) : (
          <main className="flex-1 flex items-center justify-center text-gray-500">
            <p>Select a question from the sidebar to get started</p>
          </main>
        )}
      </div>
    </div>
  )
}

export default Questions