import logger from "../utils/formatLogs"

/**
 * This function will predict the output of the model for the next 30 days
 */
export const predictService = async () => {
    try {
        console.log("WIP")
        return "WIP"
    } catch (error) {
        logger(JSON.stringify(error), "error")
        logger("Error from predictService", "error") 
    }
}