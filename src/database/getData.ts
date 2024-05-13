import { ElectricDataTable } from "./config"
import { EnergyDataType } from "../types/data"

export const getData = async (
    id: number,
    date: string,
    consumption: number,
    production: number
) => {
    const data = await ElectricDataTable.findOne({
        where: {
            id: id,
            date: date,
            consumption: consumption,
            production: production
        }
    })

    return (data as EnergyDataType)
}