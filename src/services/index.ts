import { getData } from "../database/getData";
import { prepareData } from "../rnn/prepareData";
import { EnergyDataType, EnergyType } from "../types/data";
import logger from "../utils/formatLogs"

/**
 * This function will feed the model with the latest data
 */
export const feedModel = async (type: EnergyType) => {
    try {
        const dataToFeed: EnergyDataType[] = [];

        switch (type) {
            case 'consumption':
                const consumptionData = await getData(true, false)
                dataToFeed.push(...consumptionData.map((data) => {
                    return {
                        country: data.country,
                        year: data.year,
                        consumption: data.consumption
                    }
                }))
                break;
            case 'production':
                const productionData = await getData(false, true)
                dataToFeed.push(...productionData.map((data) => {
                    return {
                        country: data.country,
                        year: data.year,
                        production: data.production
                    }
                }))
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