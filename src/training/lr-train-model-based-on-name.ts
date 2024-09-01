import * as tf from '@tensorflow/tfjs'
import { DataTypeEnum, ElectricityConsumptionDataType, ElectricityGenerationDataType, WeatherDataType } from '../types/data'
import { getAllData } from '../database/getAllData';
import { buildModel } from '../linear-regression/build-model';
import { ElectricityConsumptionTable, WeatherDataTable } from '../database/config';
import { Model, ModelCtor } from 'sequelize';
import { trainModel } from '../linear-regression/train-model';
import path from 'path'
import * as fs from 'fs'
import logger from '../utils/formatLogs';

/**
 * Base function to train models for linear regression
 * @param table
 */
export const trainModelsBasedOnTableName = async (table: ModelCtor<Model<any, any>>, yearToPredict: number, country: string) => {
    let predictionResults = undefined;

    switch (table.name) {
        case "ElectricityConsumptionTable":
            const consumption = await getAllData(DataTypeEnum.CONSUMPTION, country)
            const countryConsumptionData = consumption?.data
            const consumptionData = countryConsumptionData as ElectricityConsumptionDataType[] | undefined

            if (!consumptionData) throw new Error("Missing consumption data!")

            // const batchSize = parseInt(process.env.BATCH_SIZE || "32")
            // const numberOfBatches = Math.ceil(consumptionData.length / batchSize)

            const modelName = ElectricityConsumptionTable.tableName + " " + country
            const linearModel = buildModel(modelName, 'linear')

            let consumptionMin: number;
            let consumptionMax: number;

            let yearMin: number;
            let yearMax: number;

            const trainData = [...new Set(consumptionData)]

            const yearsOfConsumption = trainData?.map((cons) => Number(cons?.year))
            // const countriesOfConsumption = trainData?.map((cons) => cons.country)
            const consumptionOfConsumption = trainData?.map((cons) => cons?.consumption as number)
            // const countryIndices = trainData?.map(d => countriesOfConsumption?.indexOf(d.country))

            // One-hot encode the country indices
            // const countryTensors = tf.oneHot(tf.tensor1d(countryIndices, 'int32'), countriesOfConsumption.length)

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

            await trainModel(linearModel, featureTensor, targetTensor)

            logger(`Completed training for ${modelName}`)

            // const savePath = `file://../src/models/${modelName}`;
            // const saveDir = path.join(__dirname, '..', 'models');

            // if (!fs.existsSync(saveDir)) {
            //     fs.mkdirSync(saveDir, { recursive: true });
            // }

            // const savePath = path.join(saveDir, 'romania-consumption-model');

            // const result = await model.save(`file://./romania-consumption-model`);

            // return result;

            const yearToPredictTensor = tf.tensor2d([yearToPredict].map(year => (year - yearMin) / (yearMax - yearMin)), [1, 1])
            const prediction = linearModel.predict(yearToPredictTensor)

            // Denormalize the value
            // @ts-ignore
            return prediction?.array().then(array => {
                const normalizedValue = array[0][0]; // Extract the value
                const denormalizedValue = normalizedValue * (consumptionMax - consumptionMin) + consumptionMin;
                
                predictionResults = denormalizedValue;

                // The difference for 2023 for Canada between what the website gave use and what we have it's kinda big for Linear Regression
                // like we have predicted 4429 but the number from the website is 3875, meaning we have an error about 14.30% percent from the good number.
                // but for Brazil, from our model we got 3816 and in reality is 3854TWh and that's very close, difference is about 0.98%.
                // In conclusion, Linear Regression works kinda good if your numbers tend to go up or down but don't wobble too much in the dataset.

                return predictionResults
            }).catch((error: any) => {
                logger(`Error converting tensor to array: ${error}`, 'error');
            });
        case "ElectricityGenerationTable": {
            const generation = await getAllData(DataTypeEnum.GENERATION, country)
            const countryGenerationData = generation?.data
            const generationData = countryGenerationData as ElectricityGenerationDataType[] | undefined

            if (!generationData) throw new Error("Missing generation data!")

            const modelName = ElectricityConsumptionTable.tableName + " " + country
            const model = buildModel(modelName, 'relu')

            let generationMin: number;
            let generationMax: number;

            let yearMin: number;
            let yearMax: number;

            const trainData = [...new Set(generationData)]

            const yearsOfGeneration = trainData?.map((cons) => Number(cons?.year))
            const generationOfGeneration = trainData?.map((cons) => cons?.generation as number)

            generationMin = Math.min(...generationOfGeneration);
            generationMax = Math.max(...generationOfGeneration);
            
            const normalizedGeneration = generationOfGeneration.map(g => (g - generationMin) / (generationMax - generationMin));
            
            yearMin = Math.min(...yearsOfGeneration);
            yearMax = Math.max(...yearsOfGeneration);
            
            const normalizedYears = yearsOfGeneration.map(year => (year - yearMin) / (yearMax - yearMin));
            
            const yearTensor = tf.tensor2d(normalizedYears, [normalizedYears.length, 1])
            const featureTensor = yearTensor
            const targetTensor = tf.tensor2d(normalizedGeneration, [normalizedGeneration.length, 1])

            await trainModel(model, featureTensor, targetTensor)

            logger(`Completed training for ${modelName}`)
            const yearToPredictTensor = tf.tensor2d([yearToPredict].map(year => (year - yearMin) / (yearMax - yearMin)), [1, 1])
            const prediction = model.predict(yearToPredictTensor)

            // @ts-ignore
            return prediction?.array().then(array => {
                const normalizedValue = array[0][0]; // Extract the value
                const denormalizedValue = normalizedValue * (generationMax - generationMin) + generationMin;
                
                predictionResults = denormalizedValue;

                return predictionResults
            }).catch((error: any) => {
                logger(`Error converting tensor to array: ${error}`, 'error');
            });
        }
        case "WeatherDataTable": {
            const weather = await getAllData(DataTypeEnum.WEATHER, country)
            const countryWeatherData = weather?.data
            const weatherData = countryWeatherData as WeatherDataType[] | undefined

            if (!weatherData) throw new Error("Missing weather data!")

            const modelName = WeatherDataTable.tableName + " " + country
            const model = buildModel(modelName, 'relu')

            let averageTemperatureMin: number;
            let averageTemperatureMax: number;

            let dateMin: number;
            let dateMax: number;

            const trainData = [...new Set(weatherData)]

            const datesOfWeather = trainData?.map((weather) => weather.date.getTime())
            const avreageTemperatureOfWeather = trainData?.map((weather) => weather?.averageTemperature)

            dateMin = Math.min(...datesOfWeather);
            dateMax = Math.max(...datesOfWeather);

            averageTemperatureMin = Math.min(...avreageTemperatureOfWeather);
            averageTemperatureMax = Math.max(...avreageTemperatureOfWeather);

            const normalizedDates = datesOfWeather.map(date => (date - dateMin) / (dateMax - dateMin));
            const normalizedAverageTemperature = avreageTemperatureOfWeather.map(a => (a - averageTemperatureMin) / (averageTemperatureMax - averageTemperatureMin));

            // averageTemperature will be the variable we want to predict here for now

            const yearTensor = tf.tensor2d(normalizedDates, [normalizedDates.length, 1])
            const featureTensor = yearTensor
            const targetTensor = tf.tensor2d(normalizedAverageTemperature, [normalizedAverageTemperature.length, 1])

            await trainModel(model, featureTensor, targetTensor)

            logger(`Completed training for ${modelName}`)
            const yearToPredictTensor = tf.tensor2d([yearToPredict].map(year => (year - new Date(dateMin).getUTCFullYear()) / (new Date(dateMax).getUTCFullYear() - new Date(dateMin).getUTCFullYear())), [1, 1])
            const prediction = model.predict(yearToPredictTensor)

            // @ts-ignore
            return prediction?.array().then(array => {
                const normalizedValue = array[0][0]; // Extract the value
                const denormalizedValue = normalizedValue * (averageTemperatureMax - averageTemperatureMin) + averageTemperatureMin;
                
                predictionResults = denormalizedValue;

                return predictionResults
            }).catch((error: any) => {
                logger(`Error converting tensor to array: ${error}`, 'error');
            });
        }
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