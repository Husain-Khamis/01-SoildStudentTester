const express = require('express')
const router = express.Router()

const REBOOT01_URL = 'https://learn.reboot01.com/api/object/bahrain'

function extractExercises(children) {
    const exercises = []

    for (const key in children) {
        const node = children[key]

        if (
            node.type === 'exercise' &&
            node.attrs.language === 'js' &&
            node.attrs.parentType === 'exam'
        ) {
            exercises.push({
                id: node.id,
                name: node.name,
                difficulty: node.attrs.difficulty,
                level: node.attrs.level,
                subject: node.attrs.subject,
                expectedFiles: node.attrs.expectedFiles,
                testImage: node.attrs.validations[0]?.testImage,
                path: node.path,
                checkpoint: node.path.split('/').find(p => p.startsWith('checkpoint'))
            })
        }

        if (node.children) {
            exercises.push(...extractExercises(node.children))
        }
    }

    return exercises
}

router.get('/', async (req, res) => {
    try {
        const response = await fetch(REBOOT01_URL)
        const data = await response.json()

        const exercises = extractExercises(data.children)

        res.json(exercises)
    } catch (error) {
        console.error('Failed to fetch questions:', error)
        res.status(500).json({ error: 'Failed to fetch questions' })
    }
})

module.exports = router