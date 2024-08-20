import * as tf from '@tensorflow/tfjs'
import { DataTypeEnum, ElectricityConsumptionDataType } from '../types/data'
import { getAllData } from '../database/getAllData';
import { all } from 'axios';
import { buildModel } from '../linear-regression/build-model';
import { ElectricityConsumptionTable } from '../database/config';
import { Model, ModelCtor } from 'sequelize';
import { trainModel } from '../linear-regression/train-model';


    // EUREKA!!!!!!!
    // const tf = require('@tensorflow/tfjs');

    // // Your data
    // const years = [1999, 2000, 2001, 2002, 2003];
    // const consumptions = [100, 150, 180, 210, 250];
    // const generations = [94, 134, 160, 190, 240];

    // // Convert data to tensors
    // const xs = tf.tensor2d(years, [years.length, 1]);
    // const ys = tf.tensor2d(consumptions.map((c, i) => [c, generations[i]]), [years.length, 2]);

    // // Define a model
    // const model = tf.sequential();
    // model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [1] }));
    // model.add(tf.layers.dense({ units: 2 }));

    // // Compile the model
    // model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    // // Train the model
    // async function trainModel() {
    //     await model.fit(xs, ys, {
    //         epochs: 100,
    //         callbacks: {
    //             onEpochEnd: (epoch, logs) => console.log(`Epoch ${epoch + 1}: loss = ${logs.loss}`)
    //         }
    //     });
    // }

    // trainModel().then(() => {
    //     // Predict the consumption and generation for the next year (e.g., 2004)
    //     const nextYear = tf.tensor2d([2004], [1, 1]);
    //     const prediction = model.predict(nextYear);

    //     prediction.array().then(predictedValues => {
    //         const [predictedConsumption, predictedGeneration] = predictedValues[0];
    //         console.log(`Predicted consumption for 2004: ${predictedConsumption}`);
    //         console.log(`Predicted generation for 2004: ${predictedGeneration}`);
    //     });
    // });

/**
 * Base function to train models for linear regression
 * @param table
 */
export const trainModelsBasedOnTableName = async (table: ModelCtor<Model<any, any>>) => {
    switch (table.name) {
        case "ElectricityConsumptionTable":
            const consumption = await getAllData(DataTypeEnum.CONSUMPTION)
            const consumptionData = consumption?.data as ElectricityConsumptionDataType[] | undefined

            if (!consumptionData) throw new Error("Missing consumption data!")

            const yearsOfConsumption = consumptionData?.map((cons) => cons.year)
            const countriesOfConsumption = consumptionData?.map((cons) => cons.country)
            const consumptionOfConsumption = consumptionData?.map((cons) => cons.consumption as number)
            const countryIndices = consumptionData?.map(d => countriesOfConsumption?.indexOf(d.country))

            // One-hot encode the country indices
            const countryTensors = tf.oneHot(tf.tensor1d(countryIndices, 'int32'), countriesOfConsumption.length)

            const yearTensor = tf.tensor2d(yearsOfConsumption, [yearsOfConsumption.length, 1])

            const featureTensor = yearTensor.concat(countryTensors, 1)
            const targetTensor = tf.tensor2d(consumptionOfConsumption, [consumptionOfConsumption.length, 1])

            const model = buildModel(ElectricityConsumptionTable.tableName, featureTensor)

            const training = await trainModel(model, featureTensor, targetTensor)

            const cwd = process.cwd()

            await model.save(`${cwd}/consumption-model`)

            return training
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