import * as tf from '@tensorflow/tfjs'
import { DataTypeEnum, ElectricityConsumptionDataType } from '../types/data'
import { getAllData } from '../database/getAllData';
import { buildModel } from '../linear-regression/build-model';
import { ElectricityConsumptionTable } from '../database/config';
import { Model, ModelCtor } from 'sequelize';
import { trainModel } from '../linear-regression/train-model';
import path from 'path'
import * as fs from 'fs'
import logger from '../utils/formatLogs';

/**
 * Base function to train models for linear regression
 * @param table
 */
export const trainModelsBasedOnTableName = async (table: ModelCtor<Model<any, any>>) => {
    switch (table.name) {
        case "ElectricityConsumptionTable":
            const consumption = await getAllData(DataTypeEnum.CONSUMPTION)
            const country = "Brazil"
            const countryConsumptionData = consumption?.data.filter((data) => data?.country?.toLowerCase() === country?.toLowerCase())
            const consumptionData = countryConsumptionData as ElectricityConsumptionDataType[] | undefined

            if (!consumptionData) throw new Error("Missing consumption data!")

            const batchSize = parseInt(process.env.BATCH_SIZE || "32")
            const numberOfBatches = Math.ceil(consumptionData.length / batchSize)

            const modelName = ElectricityConsumptionTable.tableName + " " + country
            const model = buildModel(modelName)

            let consumptionMin: number;
            let consumptionMax: number;

            let yearMin: number;
            let yearMax: number;

            const batchData = [...new Set(consumptionData)]

            const yearsOfConsumption = batchData?.map((cons) => Number(cons?.year))
            const countriesOfConsumption = batchData?.map((cons) => cons.country)
            const consumptionOfConsumption = batchData?.map((cons) => cons.consumption as number)
            const countryIndices = batchData?.map(d => countriesOfConsumption?.indexOf(d.country))

            // One-hot encode the country indices
            const countryTensors = tf.oneHot(tf.tensor1d(countryIndices, 'int32'), countriesOfConsumption.length)

            consumptionMin = Math.min(...consumptionOfConsumption);
            consumptionMax = Math.max(...consumptionOfConsumption);
            const normalizedConsumption = consumptionOfConsumption.map(c => (c - consumptionMin) / (consumptionMax - consumptionMin));

            // Normalize the years
            yearMin = Math.min(...yearsOfConsumption);
            yearMax = Math.max(...yearsOfConsumption);
            const normalizedYears = yearsOfConsumption.map(year => (year - yearMin) / (yearMax - yearMin));

            const yearTensor = tf.tensor2d(normalizedYears, [normalizedYears.length, 1])

            // const featureTensor = yearTensor.concat(countryTensors, 1)
            const featureTensor = yearTensor
            const targetTensor = tf.tensor2d(normalizedConsumption, [normalizedConsumption.length, 1])

            await trainModel(model, featureTensor, targetTensor)

            logger(`Completed training for ${modelName}`)

            // const savePath = `file://../src/models/${modelName}`;
            // const saveDir = path.join(__dirname, '..', 'models');

            // if (!fs.existsSync(saveDir)) {
            //     fs.mkdirSync(saveDir, { recursive: true });
            // }

            // const savePath = path.join(saveDir, 'romania-consumption-model');

            // const result = await model.save(`file://./romania-consumption-model`);

            // return result;

            const yearToPredict = 2023
            const yearToPredictTensor = tf.tensor2d([yearToPredict].map(year => (year - yearMin) / (yearMax - yearMin)), [1, 1])
            const prediction = model.predict(yearToPredictTensor)

            // Denormalize the value
            // @ts-ignore
            prediction?.array().then(array => {
                const normalizedValue = array[0][0]; // Extract the value
                const denormalizedValue = normalizedValue * (consumptionMax - consumptionMin) + consumptionMin;
                logger(`Denormalized Prediction: ${denormalizedValue}`);

                // The difference for 2023 for Canada between what the website gave use and what we have it's kinda big for Linear Regression
                // like we have predicted 4429 but the number from the website is 3875, meaning we have an error about 14.30% percent from the good number.
                // but for Brazil, from our model we got 3816 and in reality is 3854TWh and that's very close, difference is about 0.98%.
                // In conclusion, Linear Regression works kinda good if your numbers tend to go up or down but don't wobble too much in the dataset.

                // Close the app
                process.exit(0)
            }).catch((error: any) => {
                logger(`Error converting tensor to array: ${error}`, 'error');
            });

            return "done"
        case "ElectricityGenerationTable":
            // const generationData = await getAllData(DataTypeEnum.GENERATION)

            // console.log("generationData", generationData)

            break
        case "WeatherDataTable":
            // const weatherData = await getAllData(DataTypeEnum.WEATHER)

            // console.log(weatherData)
            break
        case "GdpPerCapitaGrowthTable":

            break
        case "PopulationGrowthTable":

            break
        case "CO2EmissionsTable":

            break
        default:
            break;
    }
}