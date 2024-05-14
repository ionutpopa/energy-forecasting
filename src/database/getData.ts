import { ElectricDataTable } from "./config"
import { EnergyDataType } from "../types/data"

export const getData = async (
    id: number,
    country: string,
    year: string,
    consumption: number,
    production: number
) => {
    const data = await ElectricDataTable.findOne({
        where: {
            id: id,
            country: country,
            year: year,
            consumption: consumption,
            production: production
        }
    })

    return (data as EnergyDataType)
}