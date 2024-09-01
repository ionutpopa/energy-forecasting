import { 
    DataTypeEnum,
    DataType
} from "../types/data"
import logger from "../utils/formatLogs";
import { getTable } from "../utils/getTable";

type GetDataReturn = {
    data: DataType[];
    totalRecords: number;
    currentPage: number;
    totalPages: number;
}

export const getData: (typeOfData: DataTypeEnum, country?: string, page?: number, pageSize?: number, year?: number, sortOrder?: string) => Promise<(GetDataReturn | undefined)> = async (typeOfData: DataTypeEnum, country = undefined, page = 1, pageSize = 10, year = undefined, sortOrder = 'ASC') => {
    const table = getTable(typeOfData);

    const offset = (page - 1) * pageSize;
    const whereCondition: any = {};

    if (country) {
        whereCondition.country = country
    }

    if (year) {
        whereCondition.year = year;
    }

    if (!table) {
        logger("Could not find table")
        return undefined
    }

    try {
        const findData = await table.findAndCountAll({
            where: whereCondition,
            order: [[table.name === 'WeatherDataTable' ? 'date' : 'year', sortOrder]],
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

export const getAllData = async (
    typeOfData: DataTypeEnum,
    country?: string,
    page = 1,
    pageSize = 10,
    year?: number,
    sortOrder = 'ASC'
): Promise<GetDataReturn | undefined> => {
    try {
        // Call the original getData function
        const result = await getData(typeOfData, country, page, pageSize, year, sortOrder);
        
        if (!result) {
            return undefined;
        }

        const { data, totalPages } = result;

        // If we haven't fetched all the pages yet, recursively fetch the next page
        if (page < totalPages) {
            const nextPageData = await getAllData(typeOfData, country, page + 1, pageSize, year, sortOrder);
            if (nextPageData && nextPageData.data) {
                // Merge current page data with data from subsequent pages
                return {
                    ...result,
                    data: [...data, ...nextPageData.data],
                };
            }
        }

        // If this is the last page, return the accumulated result
        return result;
    } catch (error) {
        console.error("An error occurred while getting all data recursively", error);
        return undefined;
    }
};