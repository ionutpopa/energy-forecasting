import express from 'express'
import { feedModelController } from '../controllers'

const router = express.Router()

/**
 * Route to feed model
 * @route POST /feed-model
 */
router.post('/feed-model', async (req, res) => {
    try {
        await feedModelController(req, res)
    } catch (error) {
        console.error(error)
        res.status(500).send({
            message: 'Internal server error'
        })
    }
})

export default router