import { getData } from "../database/getData";
import { prepareData } from "../rnn/prepareData";
import { DataTypeEnum, DataType } from "../types/data";
import logger from "../utils/formatLogs"

/**
 * This function will feed the model with the latest data
 */
export const feedModel = async (typeOfData: DataTypeEnum) => {
    try {
        const dataToFeed: DataType[] = [];

        const feedingData = await getData(typeOfData)

        if (!feedingData)  {
            logger("No data to feed")
            return
        }

        dataToFeed.push(...feedingData)

        const prepearedData = prepareData(dataToFeed)

        // TODO: Actually feed the model here

        return prepearedData
    } catch (error) {
        console.error(error)
        // logger(JSON.stringify(error), "error")
        logger("Error from feedModel", "error") 
    }
}