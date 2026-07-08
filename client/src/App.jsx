import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Main from './pages/Main'
import Questions from './pages/Questions'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/questions" element={<Questions />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App