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
  const arrayToStoreTransformedData = []

  // Remove first array because that's the row with the column names
  productionData.shift()

  for (let i = 0; i < productionData?.length; i++) {
    if (!productionData[i]?.[0] || !String(productionData[i]?.[0])) continue
    if (isNaN(parseInt(productionData[i]?.[1]))) continue
    const obj = {
      country: productionData[i]?.[0],
      year: productionData[i]?.[1],
      generation: productionData[i]?.[2]
    }

    arrayToStoreTransformedData.push(obj)
  }

  if (arrayToStoreTransformedData.length) {
    // Store data in database
    await ElectricityGenerationTable.bulkCreate(arrayToStoreTransformedData, {
      updateOnDuplicate: ['year']
    });
    logger("Electricity Production Table Populated!")
  }
}

const callbackForCloseWeatherData = async () => {
  const arrayToStoreTransformedData = []

  // Remove first array because that's the row with the column names
  weatherData.shift()

  for (let i = 0; i < weatherData?.length; i++) {
    if (isNaN(new Date(weatherData[i]?.[0]).getTime())) continue
    if (isNaN(Number(weatherData?.[i]?.[4]))) continue

    const date = weatherData?.[i]?.[0]; // 'e.g.: 22-05-2020'
    const country = weatherData?.[i]?.[1];
    const latitude = weatherData?.[i]?.[2];
    const longitude = weatherData?.[i]?.[3];
    const averageTemperature = weatherData?.[i]?.[4];
    const minTemperature = weatherData?.[i]?.[5];
    const maxTemperature = weatherData?.[i]?.[6];
    // const windDirection = weatherData?.[i]?.[7];
    const windSpeed = weatherData?.[i]?.[8];
    const pressure = weatherData?.[i]?.[9]; // hectopascal hPa
    
    const weatherDataObj = {
      date,
      country,
      latitude: Number(latitude),
      longitude: Number(longitude),
      averageTemperature: Number(averageTemperature),
      minTemperature: Number(minTemperature),
      maxTemperature: Number(maxTemperature),
      windSpeed: Number(windSpeed),
      pressure: Number(pressure)
    }

    arrayToStoreTransformedData.push(weatherDataObj)
  }

  if (arrayToStoreTransformedData.length) {
    // Store data in database
    await WeatherDataTable.bulkCreate(arrayToStoreTransformedData, {
      updateOnDuplicate: ['date', 'country']
    })
    logger("Weather Table Populated!")
  }
}

const callbackForCloseForGdpPerCapitaData = async () => {
  const arrayToStoreTransformedData = []

  // Remove first array because that's the row with the column names
  gdpData.shift()

  for (let i = 0; i < gdpData?.length; i++) {
    if (!gdpData[i]?.[0]) continue
    if (isNaN(parseInt(gdpData[i]?.[1]))) continue
    const obj = {
      country: gdpData[i]?.[0],
      year: Number(gdpData[i]?.[1]),
      gdpPerCapitaGrowth: Number(gdpData[i]?.[2]) // annual %
    }

    arrayToStoreTransformedData.push(obj)
  }

  if (arrayToStoreTransformedData.length) {
    // Store data in database
    await GdpPerCapitaGrowthTable.bulkCreate(arrayToStoreTransformedData, {
      updateOnDuplicate: ['year']
    })
    logger("Gdp Per Capita Growth Table Populated!")
  }
}

const callbackForCloseForPopulationGrowth = async () => {
  const arrayToStoreTransformedData = []

  // Remove first array because that's the row with the column names
  populationData.shift()

  for (let i = 0; i < populationData?.length; i++) {
    if (parseInt(populationData[i]?.[0])) continue
    if (isNaN(parseInt(populationData[i]?.[1]))) continue
    const obj = {
      country: populationData[i]?.[0],
      year: Number(populationData[i]?.[1]),
      population: Number(populationData[i]?.[2]) // annual %
    }

    arrayToStoreTransformedData.push(obj)
  }

  if (arrayToStoreTransformedData.length) {
    // Store data in database
    await PopulationGrowthTable.bulkCreate(arrayToStoreTransformedData, {
      updateOnDuplicate: ['year']
    })
    logger("Population Growth Table Populated!")
  }
}

const callbackForCloseForCO2Emission = async () => {
  const arrayToStoreTransformedData = []

  // Remove first array because that's the row with the column names
  co2EmissionsData.shift()

  for (let i = 0; i < co2EmissionsData?.length; i++) {
    if (parseInt(co2EmissionsData[i]?.[0])) continue
    if (isNaN(parseInt(co2EmissionsData[i]?.[1]))) continue
    const obj = {
      country: co2EmissionsData[i]?.[0],
      year: Number(co2EmissionsData[i]?.[1]),
      co2Emissions: Number(co2EmissionsData[i]?.[2]) // per capita (per person)
    }

    arrayToStoreTransformedData.push(obj)
  }

  if (arrayToStoreTransformedData.length) {
    // Store data in database
    await CO2EmissionsTable.bulkCreate(arrayToStoreTransformedData, {
      updateOnDuplicate: ['year']
    })
    logger("CO2 Emissions Table Populated!")
  }
}

// We will use the readline module to read the file line by line and add it to the database
createDynamicRL(energyConsumptionPerCapitaFilePath, callbackForLineForConsumptionPerCapitaData, callbackForCloseForConsumptionPerCapitaData);
createDynamicRL(energyConsumptionFilePath, callbackForLineForConsumptionData, callbackForCloseForConsumptionData);
// createDynamicRL(energyProductionFilePath, callbackForLineForProductionData, callbackForCloseForProductionData);
// createDynamicRL(dailyWeatherFilePath, callbackForLineForWeatherData, callbackForCloseWeatherData);
// createDynamicRL(gdpPerCapitaFilePath, callbackForLineForGDPData, callbackForCloseForGdpPerCapitaData);
// createDynamicRL(populationFilePath, callbackForLineForPopulationData, callbackForCloseForPopulationGrowth);
// createDynamicRL(co2EmissionsFilePath, callbackForLineForCo2EmissionsData, callbackForCloseForCO2Emission);