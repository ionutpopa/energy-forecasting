import { ElectricDataTable } from "./config"
import logger from "../utils/formatLogs"

export const deleteData = async (id: number) => {
    await ElectricDataTable.destroy({
        where: {
            id: id
        }
    })
    
    logger(`Data with id ${id} was deleted from database`)
}