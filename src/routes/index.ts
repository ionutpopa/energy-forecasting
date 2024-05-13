import express from 'express'
import { predictController } from '../controllers'

const router = express.Router()

router.get('/predict', async (req, res) => {
    try {
        const response = await predictController(req, res)

        console.log("response", response)

        res.send({
            message: 'Prediction started'
        })
    } catch (error) {
        console.error(error)
        res.status(500).send({
            message: 'Internal server error'
        })
    }
})

export default router