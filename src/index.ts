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

    const ALL_TABLES = [ElectricityConsumptionTable, ElectricityGenerationTable, WeatherDataTable, GdpPerCapitaGrowthTable, PopulationGrowthTable, CO2EmissionsTable]

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
        const YEAR_TO_PREDICT = 2023
        const COUNTRY = 'Romania'
        const stop = true
        
        const consumptionPrediction = !stop && await trainModelsBasedOnTableName(ALL_TABLES[0], YEAR_TO_PREDICT, COUNTRY)
        const productionPrediction = !stop && await trainModelsBasedOnTableName(ALL_TABLES[1], YEAR_TO_PREDICT, COUNTRY)
        const weatherPrediction = await trainModelsBasedOnTableName(ALL_TABLES[2], YEAR_TO_PREDICT, COUNTRY)

        if (consumptionPrediction) {
            logger(`Denormalized consumptionPrediction: ${consumptionPrediction}`);
        }

        if (productionPrediction) {
            logger(`Denormalized productionPrediction: ${productionPrediction}`);

            // GeLU: Romania 2023: Denormalized productionPrediction: 57.04425471481681 TWh
            // ReLU: Romania 2023: Denormalized productionPrediction: 56.88054506093263 TWh
            // Linear: Romania 2023: Denormalized productionPrediction: 57.41453388151526 TWh

            // ReLU: Romania 2024: Denormalized productionPrediction: 56.82023400357365 TWh
            // Linear: Romania 2024: Denormalized productionPrediction: 57.12200713723898 TWh
        }

        if (weatherPrediction) {
            logger(`Denormalized weatherPrediction: ${weatherPrediction}`);

            // Linear: Romania 2023: Denormalized weatherPrediction: 13.846735072135926 C
        }

        // Close the app
        process.exit(0)
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