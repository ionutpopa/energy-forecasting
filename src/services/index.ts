import { getData } from "../database/getData";
import { prepareData } from "../rnn/prepareData";
import { ElectricityGenerationDataType, ElectricityConsumptionDataType, EnergyType } from "../types/data";
import logger from "../utils/formatLogs"

/**
 * This function will feed the model with the latest data
 */
export const feedModel = async (type: EnergyType) => {
    try {
        const dataToFeed: (ElectricityGenerationDataType | ElectricityConsumptionDataType)[] = [];

        switch (type) {
            case 'consumption':
                const consumptionData = await getData(true, false)
                dataToFeed.push(...consumptionData)
                break;
            case 'production':
                const productionData = await getData(false, true)
                dataToFeed.push(...productionData)
                break;
            default:
                break;
        }

        // console.log("dataToFeed", dataToFeed?.length)

        const prepearedData = prepareData(dataToFeed, type)

        return dataToFeed
    } catch (error) {
        console.error(error)
        // logger(JSON.stringify(error), "error")
        logger("Error from feedModel", "error") 
    }
}