export type EnergyDataType = {
    country: string,
    year: string,
    consumption?: number,
    production?: number
}

export type EnergyType = 'consumption' | 'production'