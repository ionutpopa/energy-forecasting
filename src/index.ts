import express from 'express'
import cors from 'cors'
// @ts-ignore
import cron from 'node-cron'
import router from './routes'
import { CO2EmissionsTable, connectDb, deleteSpecificTable, dropAllTables, ElectricityConsumptionTable, ElectricityGenerationTable, GdpPerCapitaGrowthTable, PopulationGrowthTable, WeatherDataTable } from './database/config'
import logger from './utils/formatLogs'
import * as tf from "@tensorflow/tfjs"
import { trainModelsBasedOnTableName } from './training/lr-train-model-based-on-name'
import 'dotenv/config'

const args = process.argv?.slice(2); // Get command-line arguments, excluding 'node' and the script name

// Check if the 'debug' argument is present
const debugMode = args?.includes('debug');
const parseAllData = args?.includes('parse-all-data');
const trainMode = args?.includes('build-and-train');
const dropTablesMode = args?.includes('drop-all')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/', router)

const start = async () => {
    // Import the database configuration
    await connectDb();

    const allTables = [ElectricityConsumptionTable, ElectricityGenerationTable, WeatherDataTable, GdpPerCapitaGrowthTable, PopulationGrowthTable, CO2EmissionsTable]

    if (dropTablesMode) {
        // await deleteSpecificTable("ElectricDataTables")
        await dropAllTables()
    }

    if (debugMode) {
        logger("Debug mode is enabled")
    }

    if (parseAllData) {
        // Start the csv parsing, only run this once on your local machine
        require("./utils/parseCSVs")
    }

    if (trainMode) {
        if (allTables.length) {
            for (const table of allTables) {
                const finishedTraining = await trainModelsBasedOnTableName(table)

                if (finishedTraining) {
                    // predict
                    // const model = await tf.loadLayersModel(`file://../src/models/romania-consumption-model`);

                    // const yearToPredict = 2023
                    // const yearToPredictTensor = tf.tensor2d([yearToPredict], [1, 1])
                    // const prediction = model.predict(yearToPredictTensor)

                    // logger(`prediction: ${prediction}`)

                    // const predictedConsumption = prediction.arraySync()[0][0];
                }
            }
        } else {
            logger("No tables initialized to train", "warning")
        }
    }
}

start()

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000')
})

// This will run every day at 12:00 to get the newest data in our database
cron.schedule('0 12 * * *', () => {
    // Here will run getNewData function
});