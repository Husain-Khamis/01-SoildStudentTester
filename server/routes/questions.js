const express = require('express')
const router = express.Router()

const REBOOT01_URL = 'https://learn.reboot01.com/api/object/bahrain'

const SUPPORTED_LANGUAGES = ['js', 'go', 'rust']

function extractExercises(children, lang) {
    const exercises = []
    const seen = new Set()

    function walk(children) {
        for (const key in children) {
            const node = children[key]

            if (
                node.type === 'exercise' &&
                node.attrs.language === lang &&
                node.attrs.parentType === 'exam' &&
                !seen.has(node.name)
            ) {
                seen.add(node.name)
                exercises.push({
                    id: node.id,
                    name: node.name,
                    difficulty: node.attrs.difficulty,
                    group: node.attrs.group,
                    level: node.attrs.level,
                    subject: node.attrs.subject,
                    expectedFiles: node.attrs.expectedFiles,
                    testImage: node.attrs.validations[0]?.testImage,
                    path: node.path,
                    checkpoint: node.path.split('/').find(p => p.startsWith('checkpoint'))
                })
            }

            if (node.children) {
                walk(node.children)
            }
        }
    }

    walk(children)
    exercises.sort((a, b) => a.group - b.group)
    return exercises
}

function getRandomByGroup(exercises) {
    const grouped = {}

    for (const exercise of exercises) {
        const g = exercise.group
        if (!grouped[g]) grouped[g] = []
        grouped[g].push(exercise)
    }

    return Object.entries(grouped).map(([group, questions]) => ({
        group: Number(group),
        question: questions[Math.floor(Math.random() * questions.length)]
    })).sort((a, b) => a.group - b.group)
}

router.get('/', async (req, res) => {
    const lang = req.query.lang

    if (!lang || !SUPPORTED_LANGUAGES.includes(lang)) {
        return res.status(400).json({ error: `lang query param must be one of: ${SUPPORTED_LANGUAGES.join(', ')}` })
    }

    try {
        const response = await fetch(REBOOT01_URL)
        const data = await response.json()
        const exercises = extractExercises(data.children, lang)
        res.json(exercises)
    } catch (error) {
        console.error('Failed to fetch questions:', error)
        res.status(500).json({ error: 'Failed to fetch questions' })
    }
})

router.get('/mock-exam', async (req, res) => {
    const lang = req.query.lang

    if (!lang || !SUPPORTED_LANGUAGES.includes(lang)) {
        return res.status(400).json({ error: `lang query param must be one of: ${SUPPORTED_LANGUAGES.join(', ')}` })
    }

    try {
        const response = await fetch(REBOOT01_URL)
        const data = await response.json()
        const exercises = extractExercises(data.children, lang)
        const mockExam = getRandomByGroup(exercises)
        res.json(mockExam)
    } catch (error) {
        console.error('Failed to fetch mock exam:', error)
        res.status(500).json({ error: 'Failed to fetch mock exam' })
    }
})

router.get('/subject', async (req, res) => {
    let path = req.query.path

    if (!path) return res.status(400).json({ error: 'path query param is required' })

    if (path.startsWith('/markdown/root/public/subjects/')) {
        const name = path.split('/').at(-2)
        path = `/api/content/root/01-edu_module/content/${name}/README.md`
    }

    try {
        const url = `https://learn.reboot01.com${path}`
        console.log('Fetching subject:', url)
        const response = await fetch(url)
        const text = await response.text()

        if (text.includes('<!DOCTYPE html>')) {
            return res.status(404).json({ error: 'Subject not found' })
        }

        res.send(text)
    } catch (error) {
        console.error('Failed to fetch subject:', error)
        res.status(500).json({ error: 'Failed to fetch subject' })
    }
})

module.exports = router