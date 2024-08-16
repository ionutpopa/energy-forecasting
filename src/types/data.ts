type GeneralData = {
    country: string,
    year: number,
}

export type ElectricityGenerationDataType = GeneralData & {
    generation?: number
}

export type ElectricityConsumptionDataType = GeneralData & {
    consumption?: number,
}

export type WeatherDataType = Omit<GeneralData, "year"> & {
    date: Date,
    country: string,
    latitude: number,
    longitude: number,
    averageTemperature: number,
    minTemperature: number,
    maxTemperature: number,
    windSpeed: number,
    pressure: number
}

export type GdpPerCapitaGrowthDataType = GeneralData & {
    gdpPerCapitaGrowth: number
}

export type PopulationGrowthDataType = GeneralData & {
    population: number
}

export type CO2EmissionsDataType = GeneralData & {
    co2Emissions: number
}

export enum DataTypeEnum {
    CONSUMPTION = 'consumption',
    GENERATION = 'generation',
    WEATHER = 'weather',
    GDP_PER_CAPITA_GROWTH = 'gdp_per_capita_growth',
    POPULATION_GROWTH = 'population_growth',
    CO2_EMISSIONS = 'co2_emissions'
}

export type DataType = ElectricityGenerationDataType | ElectricityConsumptionDataType | WeatherDataType | GdpPerCapitaGrowthDataType | PopulationGrowthDataType | CO2EmissionsDataType