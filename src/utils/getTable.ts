import { 
    ElectricityConsumptionTable,
    ElectricityGenerationTable,
    WeatherDataTable,
    GdpPerCapitaGrowthTable,
    PopulationGrowthTable,
    CO2EmissionsTable
} from "../database/config";
import { DataTypeEnum } from "../types/data";

export const getTable = (typeOfData: DataTypeEnum) => {
    let table;
    switch (typeOfData) {
        case DataTypeEnum.CONSUMPTION:
            table = ElectricityConsumptionTable
            break
        case DataTypeEnum.GENERATION:
            table = ElectricityGenerationTable
            break
        case DataTypeEnum.WEATHER:
            table = WeatherDataTable
            break
        case DataTypeEnum.CO2_EMISSIONS:
            table = CO2EmissionsTable
            break
        case DataTypeEnum.GDP_PER_CAPITA_GROWTH:
            table = GdpPerCapitaGrowthTable
            break
        case DataTypeEnum.POPULATION_GROWTH:
            table = PopulationGrowthTable
            break
        default:
            break
    }

    return table;
}