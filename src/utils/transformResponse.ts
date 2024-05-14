import { EnergyDataType } from "../types/data"

export const transformResponse = (data: string[][], typeOfEnergy: 'consumption' | 'production') => {
    const arrayToStoreNedData: EnergyDataType[] = []

    for (let i = 1; i < data.length; i++) {
        const obj: EnergyDataType = {
            country: data[i]?.[0],
            year: data[i]?.[2],
        }

        if (typeOfEnergy === 'consumption') {
            const totalConsumption = parseFloat(data[i]?.[3] || '0') + parseFloat(data[i]?.[4] || '0') + parseFloat(data[i]?.[5] || '0') + parseFloat(data[i]?.[6] || '0') + parseFloat(data[i]?.[7] || '0') + parseFloat(data[i]?.[8] || '0') + parseFloat(data[i]?.[9] || '0') + parseFloat(data[i]?.[10] || '0') + parseFloat(data[i]?.[11] || '0')
            obj.consumption = totalConsumption
        }

        if (typeOfEnergy === 'production') {
            const totalProduction = parseFloat(data[i]?.[3] || '0') + parseFloat(data[i]?.[4] || '0') + parseFloat(data[i]?.[5] || '0') + parseFloat(data[i]?.[6] || '0') + parseFloat(data[i]?.[7] || '0') + parseFloat(data[i]?.[8] || '0') + parseFloat(data[i]?.[9] || '0') + parseFloat(data[i]?.[10] || '0') + parseFloat(data[i]?.[11] || '0')
            obj.production = totalProduction
        }

        arrayToStoreNedData.push(obj)
    }

    return arrayToStoreNedData
};