import { predictService } from "../services"
import logger from "../utils/formatLogs"

/**
 * Function to predict the output of the model for the next 30 days that calls the predictService
 * @param req The request object
 * @param res The response object
 */
export const predictController = async (req: { query: any }, res: any) => {
    try {
        // console.log(req.query)
        return await predictService()
    } catch (error) {
        logger(JSON.stringify(error), "error")
        logger("Error from predictController", "error") 
    }
}