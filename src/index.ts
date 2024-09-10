import express from 'express'
import cors from 'cors'
// @ts-ignore
import cron from 'node-cron'
import router from './routes'
import { CO2EmissionsTable, connectDb, deleteSpecificTable, dropAllTables, ElectricityConsumptionTable, ElectricityGenerationTable, GdpPerCapitaGrowthTable, PopulationGrowthTable, WeatherDataTable } from './database/config'
import logger from './utils/formatLogs'
import { trainModelsBasedOnTableName } from './training/train-model-based-on-name'
import 'dotenv/config'
import { ActivationIdentifier } from './types/model'

const args = process.argv?.slice(2); // Get command-line arguments, excluding 'node' and the script name

// Arguments
const debugMode = args?.includes('debug');
const parseAllData = args?.includes('parse-all-data');
const trainMode = args?.includes('build-and-train');
const dropTablesMode = args?.includes('drop-all')
const consumptionArg = args?.includes('consumption')
const generationArg = args?.includes('generation')
const weatherArg = args?.includes('weather')
const gdpGrowthArg = args?.includes('gdp-growth')
const populationGrowthArg = args?.includes('population-growth')
const co2EmissionsArg = args?.includes('co2-emissions')

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
        const YEAR_TO_PREDICT = 2025
        const COUNTRY = 'Romania'
        const ACTIVATION_IDENTIFIER: ActivationIdentifier = 'linear'

        const consumptionPrediction = consumptionArg && await trainModelsBasedOnTableName(ALL_TABLES[0], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER)
        const productionPrediction = generationArg && await trainModelsBasedOnTableName(ALL_TABLES[1], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER)
        const weatherPrediction = weatherArg && await trainModelsBasedOnTableName(ALL_TABLES[2], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER)
        const gdpGrowthPrediction = gdpGrowthArg && await trainModelsBasedOnTableName(ALL_TABLES[3], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER)
        const populationGrowthPrediciton = populationGrowthArg && await trainModelsBasedOnTableName(ALL_TABLES[4], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER)
        const co2EmissionsPrediction = co2EmissionsArg && await trainModelsBasedOnTableName(ALL_TABLES[5], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER)

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
            // ReLU: Romania 2023: Denormalized weatherPrediction: -9.4 C (cleary bad lol)
        }

        if (gdpGrowthArg) {
            logger(`Denormalized gdpGrowthPrediction: ${gdpGrowthPrediction}`);

            // A thing I noticed, linear approach can train on values containing negative numbers
            // I see that relu doesn't like negative numbers too much
            
            // the correct value for 2023 according to https://www.worldometers.info/gdp/romania-gdp/: 5.79%
            
            // gelu is actually pretty good: 6.120377966838181%
            // sigmoid is good as well: 6.244628930198669%
            // tanh almost hits: 6.390872468246997%
            // linear is pretty good: 6.163015838365734%
            // relu really good: 6.163014449419499%
        }

        if (populationGrowthArg) {
            logger(`Denormalized populationGrowthPrediciton: ${populationGrowthPrediciton}`)
        }

        if (co2EmissionsArg) {
            logger(`Denormalized co2EmissionsPrediction: ${co2EmissionsPrediction}`)

            // relu: 2023: co2EmissionsPrediction: 6.8637098728551065 grams of CO2 per capita annually
            // linear: 2023: co2EmissionsPrediction: 6.527449985887546 grams of CO2 per capita annually
            // chatgpt says it's: 3.947 in 2023
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