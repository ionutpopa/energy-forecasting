import { ElectricDataTable, sequelize } from "./config"
import { EnergyDataType } from "../types/data"
import { Op } from "sequelize"

export const getData = async (
    searchForConsumption: boolean,
    searchForProduction: boolean
) => {
    const objectWithSearchParameters: { consumption?: any, production?: any } = {}

    if (searchForConsumption) {
        objectWithSearchParameters.consumption = {
            [Op.ne]: null
        }
    }

    if (searchForProduction) {
        objectWithSearchParameters.production = {
            [Op.ne]: null
        }
    }

    // The find all function will return all the data that matches the search parameters
    const data = await ElectricDataTable.findAll({
        where: {
            ...objectWithSearchParameters
        }
    })

    return (data as any).map((item: any) => {
        return item.toJSON()
    }) as EnergyDataType[]
}