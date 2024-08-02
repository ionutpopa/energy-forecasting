import { Request, Response } from "express"
import { feedModel } from "../services"
import logger from "../utils/formatLogs"

/**
 * Controller of the function that feeds the model
 * @param req The request object
 * @param res The response object
 */
export const feedModelController = async (req: Request, res: Response) => {
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