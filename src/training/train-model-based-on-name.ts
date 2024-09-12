import * as tf from '@tensorflow/tfjs'
import { CO2EmissionsDataType, DataTypeEnum, ElectricityConsumptionDataType, ElectricityGenerationDataType, GdpPerCapitaGrowthDataType, PopulationGrowthDataType, WeatherDataType } from '../types/data'
import { getAllData } from '../database/getAllData';
import { buildModel } from '../model-functions/build-model';
import { ElectricityConsumptionTable, GdpPerCapitaGrowthTable, PopulationGrowthTable, WeatherDataTable } from '../database/config';
import { Model, ModelCtor } from 'sequelize';
import { trainModel } from '../model-functions/train-model';
import logger from '../utils/formatLogs';
import { ActivationIdentifier } from '../types/model';
import "tfjs-node-save"
import { findModel } from '../model-functions/find-model';
import { saveModelLocally } from '../model-functions/save-model';

/**
 * Base function to train models for linear regression
 * @param table
 */
export const trainModelsBasedOnTableName = async (table: ModelCtor<Model<any, any>>, yearToPredict: number, country: string, activationIdentifier: ActivationIdentifier) => {
    let predictionResults = undefined;

    switch (table.name) {
        case "ElectricityConsumptionTable":
            const consumption = await getAllData(DataTypeEnum.CONSUMPTION, country)
            const countryConsumptionData = consumption?.data
            const consumptionData = countryConsumptionData as ElectricityConsumptionDataType[] | undefined

            if (!consumptionData) throw new Error("Missing consumption data!")

            // const batchSize = parseInt(process.env.BATCH_SIZE || "32")
            // const numberOfBatches = Math.ceil(consumptionData.length / batchSize)

            const modelName = ElectricityConsumptionTable.name + " " + country
            const loadedModel = await findModel(modelName)
            let model = loadedModel ? loadedModel : buildModel(modelName, activationIdentifier)

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

            await trainModel(model, featureTensor, targetTensor)

            logger(`Completed training for ${modelName}`)

            if (!loadedModel) {
                const result = await saveModelLocally(modelName, model)

                logger(`${modelName} saved on date: ${result?.modelArtifactsInfo?.dateSaved}`)
            }

            const yearToPredictTensor = tf.tensor2d([yearToPredict].map(year => (year - yearMin) / (yearMax - yearMin)), [1, 1])
            const prediction = model.predict(yearToPredictTensor)

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

            const modelName = ElectricityConsumptionTable.name + " " + country
            const loadedModel = await findModel(modelName)
            let model = loadedModel ? loadedModel : buildModel(modelName, activationIdentifier)

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

            if (!loadedModel) {
                const result = await saveModelLocally(modelName, model)

                logger(`${modelName} saved on date: ${result?.modelArtifactsInfo?.dateSaved}`)
            }

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

            const modelName = WeatherDataTable.name + " " + country
            const loadedModel = await findModel(modelName)
            let model = loadedModel ? loadedModel : buildModel(modelName, activationIdentifier)

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

            if (!loadedModel) {
                const result = await saveModelLocally(modelName, model)

                logger(`${modelName} saved on date: ${result?.modelArtifactsInfo?.dateSaved}`)
            }

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
        case "GdpPerCapitaGrowthTable": {
            const gdpPerCapitaGrowth = await getAllData(DataTypeEnum.GDP_PER_CAPITA_GROWTH, country)
            const countryGdpPerCapitaGrowthData = gdpPerCapitaGrowth?.data
            const gdpPerCapitaGrowthData = countryGdpPerCapitaGrowthData as GdpPerCapitaGrowthDataType[] | undefined

            if (!gdpPerCapitaGrowthData) throw new Error("Missing gdp per capita growth data!")

            const modelName = GdpPerCapitaGrowthTable.name + " " + country
            const loadedModel = await findModel(modelName)
            let model = loadedModel ? loadedModel : buildModel(modelName, activationIdentifier)

            let gdpPerCapitaGrowthMin: number;
            let gdpPerCapitaGrowthMax: number;

            let yearMin: number;
            let yearMax: number;

            const trainData = [...new Set(gdpPerCapitaGrowthData)]

            const yearsOfGdpPerCapitaGrowthData = trainData?.map((gdpPerCapitaGrowthData) => gdpPerCapitaGrowthData.year)
            const gdpPerCapitaGrowthOfGdpPerCapitaGrowthData = trainData?.map((gdpPerCapitaGrowthData) => gdpPerCapitaGrowthData?.gdpPerCapitaGrowth)

            yearMin = Math.min(...yearsOfGdpPerCapitaGrowthData);
            yearMax = Math.max(...yearsOfGdpPerCapitaGrowthData);

            gdpPerCapitaGrowthMin = Math.min(...gdpPerCapitaGrowthOfGdpPerCapitaGrowthData);
            gdpPerCapitaGrowthMax = Math.max(...gdpPerCapitaGrowthOfGdpPerCapitaGrowthData);

            const normalizedYears = yearsOfGdpPerCapitaGrowthData.map(year => (year - yearMin) / (yearMax - yearMin));
            const normalizedGdpPerCapitaGrowthData = gdpPerCapitaGrowthOfGdpPerCapitaGrowthData.map(g => (g - gdpPerCapitaGrowthMin) / (gdpPerCapitaGrowthMax - gdpPerCapitaGrowthMin));

            const yearTensor = tf.tensor2d(normalizedYears, [normalizedYears.length, 1])
            const featureTensor = yearTensor
            const targetTensor = tf.tensor2d(normalizedGdpPerCapitaGrowthData, [normalizedGdpPerCapitaGrowthData.length, 1])

            await trainModel(model, featureTensor, targetTensor)

            logger(`Completed training for ${modelName}`)

            if (!loadedModel) {
                const result = await saveModelLocally(modelName, model)

                logger(`${modelName} saved on date: ${result?.modelArtifactsInfo?.dateSaved}`)
            }

            const yearToPredictTensor = tf.tensor2d([yearToPredict].map(year => (year - yearMin) / (yearMax - yearMin)), [1, 1])
            const prediction = model.predict(yearToPredictTensor)

            // @ts-ignore
            return prediction?.array().then(array => {
                const normalizedValue = array[0][0];
                const denormalizedValue = normalizedValue * (gdpPerCapitaGrowthMax - gdpPerCapitaGrowthMin) + gdpPerCapitaGrowthMin;
                
                predictionResults = denormalizedValue;

                return predictionResults
            }).catch((error: any) => {
                logger(`Error converting tensor to array: ${error}`, 'error');
            });
        }
        case "PopulationGrowthTable": {
            const populationGrowth = await getAllData(DataTypeEnum.POPULATION_GROWTH, country)
            const countryPopulationGrowthData = populationGrowth?.data
            const populationGrowthData = countryPopulationGrowthData as PopulationGrowthDataType[] | undefined

            if (!populationGrowthData) throw new Error("Missing population growth data!")

            const modelName = PopulationGrowthTable.name + " " + country
            const loadedModel = await findModel(modelName)
            let model = loadedModel ? loadedModel : buildModel(modelName, activationIdentifier)

            let populationGrowthMin: number;
            let populationGrowthMax: number;

            let yearMin: number;
            let yearMax: number;

            const trainData = [...new Set(populationGrowthData)]

            const yearsOfPopulationGrowthData = trainData?.map((populationGrowthData) => populationGrowthData.year)
            const populationGrowthOfPopulationGrowthData = trainData?.map((populationGrowthData) => populationGrowthData?.population)

            yearMin = Math.min(...yearsOfPopulationGrowthData);
            yearMax = Math.max(...yearsOfPopulationGrowthData);

            populationGrowthMin = Math.min(...populationGrowthOfPopulationGrowthData);
            populationGrowthMax = Math.max(...populationGrowthOfPopulationGrowthData);

            const normalizedYears = yearsOfPopulationGrowthData.map(year => (year - yearMin) / (yearMax - yearMin));
            const normalizedPopulationGrowthData = populationGrowthOfPopulationGrowthData.map(p => (p - populationGrowthMin) / (populationGrowthMax - populationGrowthMin));

            const yearTensor = tf.tensor2d(normalizedYears, [normalizedYears.length, 1])
            const featureTensor = yearTensor
            const targetTensor = tf.tensor2d(normalizedPopulationGrowthData, [normalizedPopulationGrowthData.length, 1])

            await trainModel(model, featureTensor, targetTensor)

            logger(`Completed training for ${modelName}`)

            if (!loadedModel) {
                const result = await saveModelLocally(modelName, model)

                logger(`${modelName} saved on date: ${result?.modelArtifactsInfo?.dateSaved}`)
            }

            const yearToPredictTensor = tf.tensor2d([yearToPredict].map(year => (year - yearMin) / (yearMax - yearMin)), [1, 1])
            const prediction = model.predict(yearToPredictTensor)

            // @ts-ignore
            return prediction?.array().then(array => {
                const normalizedValue = array[0][0];
                const denormalizedValue = normalizedValue * (populationGrowthMax - populationGrowthMin) + populationGrowthMin;
                
                predictionResults = denormalizedValue;

                return predictionResults
            }).catch((error: any) => {
                logger(`Error converting tensor to array: ${error}`, 'error');
            });
        }
        case "CO2EmissionsTable": {
            const CO2Emissions = await getAllData(DataTypeEnum.CO2_EMISSIONS, country)
            const countryCO2EmissionsData = CO2Emissions?.data
            const CO2EmissionsData = countryCO2EmissionsData as CO2EmissionsDataType[] | undefined

            if (!CO2EmissionsData) throw new Error("Missing co2 emissions data!")

            const modelName = PopulationGrowthTable.name + " " + country
            const loadedModel = await findModel(modelName)
            let model = loadedModel ? loadedModel : buildModel(modelName, activationIdentifier)

            let CO2EmissionshMin: number;
            let CO2EmissionsMax: number;

            let yearMin: number;
            let yearMax: number;

            const trainData = [...new Set(CO2EmissionsData)]

            const yearsOfCO2EmissionsData = trainData?.map((CO2EmissionsData) => CO2EmissionsData.year)
            const CO2EmissionsOfCO2EmissionsData = trainData?.map((CO2EmissionsData) => CO2EmissionsData?.co2Emissions)

            yearMin = Math.min(...yearsOfCO2EmissionsData);
            yearMax = Math.max(...yearsOfCO2EmissionsData);

            CO2EmissionshMin = Math.min(...CO2EmissionsOfCO2EmissionsData);
            CO2EmissionsMax = Math.max(...CO2EmissionsOfCO2EmissionsData);

            const normalizedYears = yearsOfCO2EmissionsData.map(year => (year - yearMin) / (yearMax - yearMin));
            const normalizedCO2Emissions = CO2EmissionsOfCO2EmissionsData.map(c => (c - CO2EmissionshMin) / (CO2EmissionsMax - CO2EmissionshMin));

            const yearTensor = tf.tensor2d(normalizedYears, [normalizedYears.length, 1])
            const featureTensor = yearTensor
            const targetTensor = tf.tensor2d(normalizedCO2Emissions, [normalizedCO2Emissions.length, 1])

            await trainModel(model, featureTensor, targetTensor)

            logger(`Completed training for ${modelName}`)

            if (!loadedModel) {
                const result = await saveModelLocally(modelName, model)

                logger(`${modelName} saved on date: ${result?.modelArtifactsInfo?.dateSaved}`)
            }

            const yearToPredictTensor = tf.tensor2d([yearToPredict].map(year => (year - yearMin) / (yearMax - yearMin)), [1, 1])
            const prediction = model.predict(yearToPredictTensor)

            // @ts-ignore
            return prediction?.array().then(array => {
                const normalizedValue = array[0][0];
                const denormalizedValue = normalizedValue * (CO2EmissionsMax - CO2EmissionshMin) + CO2EmissionshMin;
                
                predictionResults = denormalizedValue;

                return predictionResults
            }).catch((error: any) => {
                logger(`Error converting tensor to array: ${error}`, 'error');
            });
        }
        default:
            return predictionResults;
    }
}