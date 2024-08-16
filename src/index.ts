import express from 'express'
import cors from 'cors'
// @ts-ignore
import cron from 'node-cron'
import router from './routes'
import { CO2EmissionsTable, connectDb, ElectricityConsumptionTable, ElectricityGenerationTable, GdpPerCapitaGrowthTable, PopulationGrowthTable, WeatherDataTable } from './database/config'
import logger from './utils/formatLogs'
import { buildModel } from './linear-regression/build-model'

const args = process.argv?.slice(2); // Get command-line arguments, excluding 'node' and the script name

// Check if the 'debug' argument is present
const debugMode = args?.includes('debug');
const parseAllData = args?.includes('parse-all-data');
const trainMode = args?.includes('train');
const buildMode = args?.includes('build-model')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/', router)

const start = async () => {
    // Import the database configuration
    await connectDb();

    // buildMode will build all the models, this as well should be ran only once
    // atm, we will only build the linear regression model
    if (buildMode) {
        buildModel(WeatherDataTable.tableName)
        buildModel(ElectricityConsumptionTable.tableName)
        buildModel(ElectricityGenerationTable.tableName)
        buildModel(WeatherDataTable.tableName)
        buildModel(GdpPerCapitaGrowthTable.tableName)
        buildModel(PopulationGrowthTable.tableName)
        buildModel(CO2EmissionsTable.tableName)
    }

    if (trainMode) {

    }

    if (debugMode) {
        logger("Debug mode is enabled")
    }

    if (parseAllData) {
        // Start the csv parsing, only run this once on your local machine
        require("./utils/parseCSVs")
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