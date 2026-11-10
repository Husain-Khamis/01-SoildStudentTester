const express = require('express')
const path = require('path')
const questionRouter = require('./routes/questions')

const app = express()
const PORT = 3000

app.use(express.json({ limit: '200kb' }))

app.use('/api/questions', questionRouter)

app.use(express.static(path.join(__dirname, 'public')))

// SPA fallback so reloading client routes like /questions serves the app
app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

app.use(questionRouter.errorHandler)

require('./runner').reapOrphans().catch(() => {})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})