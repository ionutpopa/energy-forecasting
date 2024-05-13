import { ElectricDataTable } from "./config"

export const addData = async (year: string, consumption: number, production: number) => {
    try {
        await ElectricDataTable.create({
            year: year,
            consumption: consumption,
            production: production
        })
    } catch (error) {
        console.error("An error occurred while adding data", error)
    }
}