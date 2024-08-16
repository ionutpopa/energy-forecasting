import { 
    DataTypeEnum,
    DataType
} from "../types/data"
import logger from "../utils/formatLogs";
import { getTable } from "../utils/getTable";

type GetAllDataReturn = {
    data: DataType[];
    totalRecords: number;
    currentPage: number;
    totalPages: number;
}

export const getAllData: (typeOfData: DataTypeEnum, page?: number, pageSize?: number, year?: number, sortOrder?: string) => Promise<(GetAllDataReturn | undefined)> = async (typeOfData: DataTypeEnum, page = 1, pageSize = 10, year = undefined, sortOrder = 'ASC') => {
    const table = getTable(typeOfData);

    const offset = (page - 1) * pageSize;
    const whereCondition: any = {};

    if (year !== null) {
        whereCondition.year = year;
    }

    if (!table) {
        logger("Could not find table")
        return undefined
    }

    try {
        const findData = await table.findAndCountAll({
            where: whereCondition,
            order: [['year', sortOrder]],
            limit: pageSize,
            offset: offset,
        })

        const returnObj = {
            data: findData.rows.map((item: any) => item.toJSON()) as DataType[],
            totalRecords: findData.count,
            currentPage: page,
            totalPages: Math.ceil(findData.count / pageSize),
        }

        return returnObj
    } catch (error) {
        console.error("An error occurred while getting all data", error)
        return undefined
    }
}