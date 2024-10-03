// @ts-ignore
import cron from 'node-cron'
import { CO2EmissionsTable, connectDb, deleteSpecificTable, dropAllTables, ElectricityConsumptionPerCapitaTable, ElectricityConsumptionTable, ElectricityGenerationTable, GdpPerCapitaGrowthTable, PopulationGrowthTable, WeatherDataTable } from './database/config'
import logger from './utils/formatLogs'
import { predictBasedOnTableName } from './training/train-model-based-on-name'
import 'dotenv/config'
import { ActivationIdentifier } from './types/model'

const args = process.argv?.slice(2); // Get command-line arguments, excluding the first two that are probably 'node' and the script name

// Arguments
const DEBUG_MODE = args?.includes('debug');
const PARSE_ALL_DATA = args?.includes('parse-all-data');
const PREDICT_MODE = args?.includes('predict-mode');
const TRAIN_MODE = args?.includes('train-mode');
const DROP_TABLES_MODE = args?.includes('drop-all')
const CONSUMPTION_PER_CAPITA_ARG = args?.includes('consumption-per-capita')
const CONSUMPTION_ARG = args?.includes('consumption')
const GENERATION_ARG = args?.includes('generation')
const WEATHER_ARG = args?.includes('weather')
const GDP_GROWTH_ARG = args?.includes('gdp-growth')
const POPULATION_GROWTH_ARG = args?.includes('population-growth')
const CO2_EMISSIONS_ARG = args?.includes('co2-emissions')

const start = async () => {

    try {
    // Import the database configuration
    await connectDb();

    const ALL_TABLES = [ElectricityConsumptionTable, ElectricityGenerationTable, WeatherDataTable, GdpPerCapitaGrowthTable, PopulationGrowthTable, CO2EmissionsTable, ElectricityConsumptionPerCapitaTable]

    if (DROP_TABLES_MODE) {
        // await deleteSpecificTable("ElectricDataTables")
        await dropAllTables()
    }

    if (DEBUG_MODE) {
        logger("Debug mode is enabled")
    }

    if (PARSE_ALL_DATA) {
        // Start the csv parsing, only run this once on your local machine
        require("./utils/parseCSVs")
    }

    if (PREDICT_MODE) {
        const YEAR_TO_PREDICT = 2023
        const COUNTRY = 'Romania'
        const ACTIVATION_IDENTIFIER: ActivationIdentifier = 'linear'
        const consumptionPrediction = CONSUMPTION_ARG && await predictBasedOnTableName(ALL_TABLES[0], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER, TRAIN_MODE)
        const productionPrediction = GENERATION_ARG && await predictBasedOnTableName(ALL_TABLES[1], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER, TRAIN_MODE)
        const weatherPrediction = WEATHER_ARG && await predictBasedOnTableName(ALL_TABLES[2], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER, TRAIN_MODE)
        const gdpGrowthPrediction = GDP_GROWTH_ARG && await predictBasedOnTableName(ALL_TABLES[3], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER, TRAIN_MODE)
        const populationGrowthPrediciton = POPULATION_GROWTH_ARG && await predictBasedOnTableName(ALL_TABLES[4], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER, TRAIN_MODE)
        const co2EmissionsPrediction = CO2_EMISSIONS_ARG && await predictBasedOnTableName(ALL_TABLES[5], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER, TRAIN_MODE)
        const consumptionPerCapitaPrediction = CONSUMPTION_PER_CAPITA_ARG && await predictBasedOnTableName(ALL_TABLES[6], YEAR_TO_PREDICT, COUNTRY, ACTIVATION_IDENTIFIER, TRAIN_MODE)

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

        if (gdpGrowthPrediction) {
            logger(`Denormalized gdpGrowthPrediction: ${gdpGrowthPrediction}`);

            // I see that relu doesn't like negative numbers too much

            // the correct value for 2023 according to https://www.worldometers.info/gdp/romania-gdp/: 5.79%
            
            // gelu is actually pretty good: 6.120377966838181%
            // sigmoid is good as well: 6.244628930198669%
            // tanh almost hits: 6.390872468246997%
            // linear is pretty good: 6.163015838365734%
            // relu really good: 6.163014449419499%
        }

        if (populationGrowthPrediciton) {
            logger(`Denormalized populationGrowthPrediciton: ${populationGrowthPrediciton}`)
        }

        if (co2EmissionsPrediction) {
            logger(`Denormalized co2EmissionsPrediction: ${co2EmissionsPrediction}`)

            // relu: 2023: co2EmissionsPrediction: 6.8637098728551065 grams of CO2 per capita annually
            // linear: 2023: co2EmissionsPrediction: 6.527449985887546 grams of CO2 per capita annually
            // chatgpt says it's: 3.947 in 2023
        }

        if (consumptionPerCapitaPrediction) {
            logger(`Denormalized consumptionPerCapitaPrediction: ${consumptionPerCapitaPrediction}`)
        }
    }
    } catch (error) {
        logger(`There was an error at start function: ${JSON.stringify(error, null, 2)}`, 'error')
        logger('App is closing', 'info')
        process.exit(0)
    }
}

start()

// This will run every day at 12:00 to get the newest data in our database
cron.schedule('0 12 * * *', () => {
    // Here will run getNewData function
});