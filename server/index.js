const express = require('express')
const path = require('path')
const questionRouter = require('./routes/questions')

const app = express()
const PORT = 3000

app.use(express.json({ limit: '200kb' }))

app.use('/api/questions', questionRouter)

app.use(express.static(path.join(__dirname, 'public')))

app.use(questionRouter.errorHandler)

require('./runner').reapOrphans().catch(() => {})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})