import { 
    DataTypeEnum,
    DataType
} from "../types/data"
import { Op } from "sequelize"
import { getTable } from "../utils/getTable"
import logger from "../utils/formatLogs"

type SearchParametersTypes = { 
    consumption?: any, 
    production?: any,
    weather?: any
}

const getDataParam = (typeOfData: DataTypeEnum) => {
    let dataParam;
    switch (typeOfData) {
        case DataTypeEnum.CONSUMPTION:
            dataParam = 'consumption'
            break
        case DataTypeEnum.GENERATION:
            dataParam = 'generation'
            break
        case DataTypeEnum.WEATHER:
            dataParam = 'averageTemperature'
            break
        case DataTypeEnum.POPULATION_GROWTH:
            dataParam = 'population'
            break
        case DataTypeEnum.GDP_PER_CAPITA_GROWTH:
            dataParam = 'gdpPerCapitaGrowth'
            break
        case DataTypeEnum.CO2_EMISSIONS:
            dataParam = 'co2Emissions'
            break
        default:
            break
    }

    return dataParam;
}

export const getData = async (typeOfData: DataTypeEnum) => {
    const table = getTable(typeOfData);
    const dataParam = getDataParam(typeOfData) as string

    if (!table) {
        logger("Could not find table")
        return undefined
    }

    if (!dataParam) {
        logger("Could not get data param")
        return undefined
    }

    let objectWithSearchParameters: SearchParametersTypes | any = {}

    objectWithSearchParameters[dataParam] = {
        [Op.ne]: null
    }

    // The find all function will return all the data that matches the search parameters
    const data = await table.findAll({
        where: {
            ...objectWithSearchParameters
        }
    })

    return data.map((item) => {
        return item.toJSON()
    }) as DataType[]
}