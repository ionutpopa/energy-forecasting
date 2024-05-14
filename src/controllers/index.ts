import { feedModel } from "../services"
import logger from "../utils/formatLogs"

/**
 * Function to feed model controller
 * @param req The request object
 * @param res The response object
 */
export const feedModelController = async (req: { body: any }, res: any) => {
    try {
        const type = req.body?.type

        if (!type) {
            return res.status(400).send({
                message: 'Type is required'
            })
        }

        const response = await feedModel(type)

        res.send({
            message: 'Feeding model started',
            response: response
        })
    } catch (error) {
        logger(JSON.stringify(error), "error")
        logger("Error from predictController", "error") 
    }
}