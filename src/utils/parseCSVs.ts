import { Model, ModelCtor } from "sequelize";
import { 
  ElectricityConsumptionTable,
  ElectricityGenerationTable,
  WeatherDataTable,
  GdpPerCapitaGrowthTable,
  PopulationGrowthTable,
  CO2EmissionsTable,
  ElectricityConsumptionPerCapitaTable
} from "../database/config";
import { createDynamicRL } from "./createDynamicRL";
import logger from "./formatLogs";
import path from "path";
import cp from 'child_process'
import fs from 'fs'
import os from 'os'

// Energy consumption in the world file path
const energyConsumptionFilePath = "primary-energy-cons.csv";
// values to skip in primary-energy-cons.csv: everything that contains("(EI)") || contains("(EIA)") || contains("(27)") || contains("High-income countries")
const energyConsumptionPerCapitaFilePath = "per-capita-energy-use.csv";
// || contains("Low-income countries") || contains("Lower-middle-income countries") || contains("Upper-middle-income countries")
const energyProductionFilePath = "electricity-generation.csv";
// values to skip in electricity-generation.csv: same as primary-energy-cons.csv
const dailyWeatherFilePath = "daily_weather_data.csv";
// in daily_weather_data.csv: date can be separated by "-" or "/" but the order is the same day month year
const gdpPerCapitaFilePath = "gdp-per-capita-growth.csv";
// in gdp-per-capita-growth.csv: skip contains("Upper-middle-income countries") || contains("Middle-income countries") || contains("Low-income countries") || contains("High-income countries") || contains("WB")
const populationFilePath = "population-and-demography.csv";
// in population-and-demography.csv: skip contains("(UN)") || contains("High-income countries") || contains("Low-income countries")
const co2EmissionsFilePath = "co2-emissions-per-capita.csv";

// Arrays to store parsed CSV data
const consumptionData: string[][] = [];
const consumptionPerCapitaData: string[][] = [];
const productionData: string[][] = [];
const weatherData: string[][] = [];
const gdpData: string[][] = [];
const populationData: string[][] = [];
const co2EmissionsData: string[][] = [];

const filterValue = (value: string) => {
  if (
    !value ||
    value === "" ||
    value?.includes("(EI)") ||
    value?.includes("(Ember)") ||
    value?.includes("(EIA)") ||
    value?.includes("(27)") ||
    value?.includes("(UN)") ||
    value?.includes("High-income countries") ||
    value?.includes("Low-income countries") ||
    value?.includes("Lower-middle-income countries") ||
    value?.includes("Upper-middle-income countries") ||
    value?.includes("(WB)") ||
    value?.includes("(UN)") ||
    value?.includes("Middle-income countries")
  ) {
    return true;
  }
  return false;
};

const filterValues = (line: string) => {
  // Split the line by comma to get individual values
  const values = line.split(",");

  const removeCommasValues = values?.map((value) => value?.replace(/;/g, ""));

  const indexesWhereToRemoveTheNextTwoValues: number[] = []

  // I am filtering out empty values and values that contain the set of strings to skip in the CSV file
  removeCommasValues?.forEach((value, index) => {
    if (filterValue(value)) {
      indexesWhereToRemoveTheNextTwoValues.push(index)
    }
  });

  indexesWhereToRemoveTheNextTwoValues.forEach((index) => {
    removeCommasValues?.splice(index, 3)
  })

  const filteredValues = removeCommasValues?.filter((value, index) => {
    if (filterValue(value)) {
      indexesWhereToRemoveTheNextTwoValues.push(index)
      return false;
    }
    return true;
  });

  return filteredValues
};

const createIfNotExists = async (table: ModelCtor<Model<any, any>>, dataArray: any, maxRetries = Number(process.env.MAX_RETRIES) || 10, baseDelay = 100) => {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      for (const data of dataArray) {
        const whereObj: any = {}

        if (table.name === "WeatherDataTable"){
          whereObj.date = data.date
        } else {
          whereObj.year = data.year
        }

        const existingRecord = await table.findOne({
            where: whereObj,
        });

        if (!existingRecord) {
            try {
              await table.create(data);
              console.log('Data inserted:', data);
            } catch (error) {
              throw error; // Throw other errors
            }
        } else {
            console.log('Skipped (already exists):', existingRecord.toJSON());
        }
      }
    } catch (error: any) {
        if (error?.parent?.code === 'SQLITE_BUSY') {
            attempt++;
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`Database is busy. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        } else {
            // Throw other errors that aren't SQLITE_BUSY
            console.error('Error in bulk check/insert:', error);
            throw error;
        }
    }
  }

  throw new Error('Failed to insert data after maximum retries due to SQLITE_BUSY');
}

const callbackForLineForConsumptionPerCapitaData = (line: string) => {
  const filteredValues = filterValues(line)

  // Add values to the csvData array
  consumptionPerCapitaData.push(filteredValues)
}

const callbackForLineForConsumptionData = (line: string) => {
  const filteredValues = filterValues(line)

  // Add values to the csvData array
  consumptionData.push(filteredValues)
}

const callbackForLineForProductionData = (line: string) => {
  const filteredValues = filterValues(line)
  
  // Add values to the csvData array
  productionData.push(filteredValues)
}

const callbackForLineForWeatherData = (line: string) => {
  const filteredValues = filterValues(line)
  
  // Add values to the csvData array
  weatherData.push(filteredValues)
}

const callbackForLineForGDPData = (line: string) => {
  const filteredValues = filterValues(line)
  
  // Add values to the csvData array
  gdpData.push(filteredValues)
}

const callbackForLineForPopulationData = (line: string) => {
  const filteredValues = filterValues(line)
  
  // Add values to the csvData array
  populationData.push(filteredValues)
}

const callbackForLineForCo2EmissionsData = (line: string) => {
  const filteredValues = filterValues(line)
  
  // Add values to the csvData array
  co2EmissionsData.push(filteredValues)
}

const callbackForCloseForConsumptionPerCapitaData = async () => {
  // Remove first array because that's the row with the column names
  consumptionPerCapitaData.shift()
  try {
    const tempFilePath = path.resolve("./src/utils/temp")

    if (!fs.existsSync(tempFilePath)) {
      await fs.promises.mkdir(tempFilePath, { recursive: true })
    }

    const jsonString = JSON.stringify(consumptionPerCapitaData, null, 2);
    const pathToWrite = path.join(tempFilePath, `${ElectricityConsumptionPerCapitaTable.name}.json`)

    await fs.promises.writeFile(pathToWrite, jsonString, { encoding: 'utf-8' })

    const execRes = cp.execSync(`python ./src/utils/parseCSVs.py database.sqlite ${ElectricityConsumptionPerCapitaTable.name}`, { cwd: process.cwd() })
    logger(`stdout: ${execRes.toString()}`)
  } catch (error) {
    logger(`Error running python parsing: ${error}`, 'error')
  }
}

const callbackForCloseForConsumptionData = async () => {
  // Remove first array because that's the row with the column names
  consumptionPerCapitaData.shift()
  try {
    const tempFilePath = path.resolve("./src/utils/temp")

    if (!fs.existsSync(tempFilePath)) {
      await fs.promises.mkdir(tempFilePath, { recursive: true })
    }

    const jsonString = JSON.stringify(consumptionPerCapitaData, null, 2);
    const pathToWrite = path.join(tempFilePath, `${ElectricityConsumptionTable.name}.json`)

    await fs.promises.writeFile(pathToWrite, jsonString, { encoding: 'utf-8' })

    const execRes = cp.execSync(`python ./src/utils/parseCSVs.py database.sqlite ${ElectricityConsumptionTable.name}`, { cwd: process.cwd() })
    logger(`stdout: ${execRes.toString()}`)
  } catch (error) {
    logger(`Error running python parsing: ${error}`, 'error')
  }
}

const callbackForCloseForProductionData = async () => {
  // Remove first array because that's the row with the column names
  consumptionPerCapitaData.shift()
  try {
    const tempFilePath = path.resolve("./src/utils/temp")

    if (!fs.existsSync(tempFilePath)) {
      await fs.promises.mkdir(tempFilePath, { recursive: true })
    }

    const jsonString = JSON.stringify(consumptionPerCapitaData, null, 2);
    const pathToWrite = path.join(tempFilePath, `${ElectricityGenerationTable.name}.json`)

    await fs.promises.writeFile(pathToWrite, jsonString, { encoding: 'utf-8' })

    const execRes = cp.execSync(`python ./src/utils/parseCSVs.py database.sqlite ${ElectricityGenerationTable.name}`, { cwd: process.cwd() })
    logger(`stdout: ${execRes.toString()}`)
  } catch (error) {
    logger(`Error running python parsing: ${error}`, 'error')
  }
}

const callbackForCloseWeatherData = async () => {
  weatherData.shift()
  try {
    const tempFilePath = path.resolve("./src/utils/temp")

    if (!fs.existsSync(tempFilePath)) {
      await fs.promises.mkdir(tempFilePath, { recursive: true })
    }

    const pathToWrite = path.join(tempFilePath, `${WeatherDataTable.name}.json`)

    if (!fs.existsSync(pathToWrite)) {
      for (const [i, data] of weatherData.entries()) {
        if (i !==  weatherData.length - 1) {
          if (i === 0) {
            fs.appendFileSync(pathToWrite, '[' + os.EOL, { encoding: 'utf-8' })
          }
          fs.appendFileSync(pathToWrite, `${JSON.stringify(data)},` + os.EOL, { encoding: 'utf-8' })
        } else {
          fs.appendFileSync(pathToWrite, JSON.stringify(data) + os.EOL, { encoding: 'utf-8' })
          fs.appendFileSync(pathToWrite, ']', { encoding: 'utf-8' })
        }
      }
    }

    logger('Finished creating temp for weather data')
    const pathToCall = path.join('./src', 'utils', 'parseCSVs.py')
    console.log(`python ${pathToCall} database.sqlite ${WeatherDataTable.name}`)

    const execRes = cp.execSync(`python ${pathToCall} database.sqlite ${WeatherDataTable.name}`, { cwd: process.cwd() })
    logger(`stdo/ut: ${execRes.toString()}`)
  } catch (error) {
    logger(`Error running python parsing: ${error}`, 'error')
  }
}

const callbackForCloseForGdpPerCapitaData = async () => {
  // Remove first array because that's the row with the column names
  gdpData.shift()

  try {
    const tempFilePath = path.resolve("./src/utils/temp")

    if (!fs.existsSync(tempFilePath)) {
      await fs.promises.mkdir(tempFilePath, { recursive: true })
    }

    const jsonString = JSON.stringify(gdpData, null, 2);
    const pathToWrite = path.join(tempFilePath, `${GdpPerCapitaGrowthTable.name}.json`)

    await fs.promises.writeFile(pathToWrite, jsonString, { encoding: 'utf-8' })

    const execRes = cp.execSync(`python ./src/utils/parseCSVs.py database.sqlite ${GdpPerCapitaGrowthTable.name}`, { cwd: process.cwd() })
    logger(`stdout: ${execRes.toString()}`)
  } catch (error) {
    logger(`Error running python parsing: ${error}`, 'error')
  }
}

const callbackForCloseForPopulationGrowth = async () => {
  // Remove first array because that's the row with the column names
  populationData.shift()

  try {
    const tempFilePath = path.resolve("./src/utils/temp")

    if (!fs.existsSync(tempFilePath)) {
      await fs.promises.mkdir(tempFilePath, { recursive: true })
    }

    const jsonString = JSON.stringify(gdpData, null, 2);
    const pathToWrite = path.join(tempFilePath, `${PopulationGrowthTable.name}.json`)

    await fs.promises.writeFile(pathToWrite, jsonString, { encoding: 'utf-8' })

    const execRes = cp.execSync(`python ./src/utils/parseCSVs.py database.sqlite ${PopulationGrowthTable.name}`, { cwd: process.cwd() })
    logger(`stdout: ${execRes.toString()}`)
  } catch (error) {
    logger(`Error running python parsing: ${error}`, 'error')
  }
}

const callbackForCloseForCO2Emission = async () => {
  // Remove first array because that's the row with the column names
  co2EmissionsData.shift()

  try {
    const tempFilePath = path.resolve("./src/utils/temp")

    if (!fs.existsSync(tempFilePath)) {
      await fs.promises.mkdir(tempFilePath, { recursive: true })
    }

    const jsonString = JSON.stringify(gdpData, null, 2);
    const pathToWrite = path.join(tempFilePath, `${CO2EmissionsTable.name}.json`)

    await fs.promises.writeFile(pathToWrite, jsonString, { encoding: 'utf-8' })

    const execRes = cp.execSync(`python ./src/utils/parseCSVs.py database.sqlite ${CO2EmissionsTable.name}`, { cwd: process.cwd() })
    logger(`stdout: ${execRes.toString()}`)
  } catch (error) {
    logger(`Error running python parsing: ${error}`, 'error')
  }
}

// We will use the readline module to read the file line by line and add it to the database
createDynamicRL(energyConsumptionPerCapitaFilePath, callbackForLineForConsumptionPerCapitaData, callbackForCloseForConsumptionPerCapitaData);
createDynamicRL(energyConsumptionFilePath, callbackForLineForConsumptionData, callbackForCloseForConsumptionData);
createDynamicRL(energyProductionFilePath, callbackForLineForProductionData, callbackForCloseForProductionData);
createDynamicRL(dailyWeatherFilePath, callbackForLineForWeatherData, callbackForCloseWeatherData);
createDynamicRL(gdpPerCapitaFilePath, callbackForLineForGDPData, callbackForCloseForGdpPerCapitaData);
createDynamicRL(populationFilePath, callbackForLineForPopulationData, callbackForCloseForPopulationGrowth);
createDynamicRL(co2EmissionsFilePath, callbackForLineForCo2EmissionsData, callbackForCloseForCO2Emission);