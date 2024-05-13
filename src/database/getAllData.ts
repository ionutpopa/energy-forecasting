import { ElectricDataTable } from "./config"
import { EnergyDataType } from "../types/data"

export const getAllData: () => Promise<EnergyDataType[]> = async () => {
    try {
        const findData = await ElectricDataTable.findAll()

        return findData.map((item: any) => item.toJSON()) as EnergyDataType[]
    } catch (error) {
        console.error("An error occurred while getting all data", error)
        return []
    }
}