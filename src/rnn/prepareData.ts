import { ElectricityGenerationDataType, ElectricityConsumptionDataType, EnergyType } from "../types/data";

/**
 * This function will prepare the data for the model to consume
 * With this we're doing both Data Preparation and Data Preprocessing
 * @param data 
 * @param type 
 * @returns 
 */
export const prepareData = (data: (ElectricityGenerationDataType | ElectricityConsumptionDataType)[], type: EnergyType) => {
    // Step 1: Filter the data

    // Take only the data that has consumption
    const energyData = data

    // Step 2: Create Input-Output pairs
    const createSequences = (data: string | any[], sequenceLength: number) => {
        const sequences = [];

        for (let i = 0; i < data.length - sequenceLength; i++) {
            const sequence = data.slice(i, i + sequenceLength)
            const target = data[i + sequenceLength]

            console.log(sequence)

            sequences.push({ input: sequence, output: target })
        }

        return sequences
    }

    // Adjust the sequenceLength parameter as needed based on the desired number of previous years to consider for prediction.
    // I will take 10 years of data to predict the next year's energy consumption.
    const sequencesLength = 5
    const sequences = createSequences(energyData, sequencesLength)

    // Step 3: Normalize the data
    const normalizeData = (data: any[]) => {
        const min = Math.min(...data)
        const max = Math.max(...data)

        return data.map((value) => (value - min) / (max - min));
    }

    // Normalize the data
    const energyDataWithoutYears = energyData.map((item) => type === 'consumption' ? (item as ElectricityConsumptionDataType).consumption : (item as ElectricityGenerationDataType).generation)
    const normalizedData = normalizeData(energyDataWithoutYears)

    console.log("Input-Output pairs", sequences)
    console.log("Normalized Data", normalizedData)

    return {
        sequences,
        normalizedData
    }
}