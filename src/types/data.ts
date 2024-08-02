export type ElectricityGenerationDataType = {
    country: string,
    year: string,
    generation?: number
}

export type ElectricityConsumptionDataType = {
    country: string,
    year: string,
    consumption?: number,
}

export type EnergyType = 'consumption' | 'production'