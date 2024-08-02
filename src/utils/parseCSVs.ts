import fs from "fs";
import readline from "readline";
import { addData } from "../database/addData";
import { createDynamicRL } from "./createDynamicRL";

// Energy consumption in the world file path
const energyConsumptionFilePath = "primary-energy-cons.csv";
// values to skip in primary-energy-cons.csv: everything that contains("(EI)") || contains("(EIA)") || contains("(27)") || contains("High-income countries")
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

// // We will use the readline module to read the file line by line
// const rl1 = readline.createInterface({
//     input: fs.createReadStream(firstFilePath),
//     output: process.stdout,
//     terminal: false
// })

// Array to store parsed CSV data
const consumptionData: string[][] = [];
let isConsumptionDataReady = false;

const productionData: string[][] = [];
let isProductionDataReady = false;

const weatherData: string[][] = [];
let isWeatherDataReady = false;

const gdpData: string[][] = [];
let isGdpDataReady = false;

const populationData: string[][] = [];
let isPopulationDataReady = false;

const co2EmissionsData: string[][] = [];
let isCo2EmissionsDataReady = false;

// // Event listener for eac line read from the CSV file
// rl1.on("line", (line) => {
//     // Split the line by comma to get individual values
//     const values = line.split(",")

//     // Add values to the csvData array
//     consumptionData.push(values)
// })

// // Event listener for the end of the file
// rl1.on("close", () => {
//     const rl2 = readline.createInterface({
//         input: fs.createReadStream(secondFilePath),
//         output: process.stdout,
//         terminal: false
//     })

//     rl2.on("line", (line) => {
//         // Split the line by comma to get individual values
//         const values = line.split(",")

//         const removeCommasValues = values.map((value) => value?.replace(/;/g, ""))

//         // Add values to the csvData array
//         productionData.push(removeCommasValues)
//     })

//     rl2.on("close", () => {
//         const transformedConsumptionData = transformResponse(consumptionData, 'consumption')
//         const transformedProductionData =  transformResponse(productionData, 'production')

//         const rl3 = readline.createInterface({
//             input: fs.createReadStream(thirdFilePath),
//             output: process.stdout,
//             terminal: false
//         })

//         rl3.on("line", (line) => {
//             // Split the line by comma to get individual values
//             const values = line.split(",")

//             console.log(values)

//             // Add values to the csvData array
//             weatherData.push(values)
//         })

//         // Store the transformed data in the database
//         for (let i = 0; i < transformedConsumptionData?.length; i++) {
//             const data = transformedConsumptionData[i]
//             // Store the data in the database
//             // addData(
//             //     data.country,
//             //     data.year,
//             //     data.consumption,
//             // )
//         }

//         for (let i = 0; i < transformedProductionData?.length; i++) {
//             const data = transformedProductionData[i]
//             // Store the data in the database
//             // addData(
//             //     data.country,
//             //     data.year,
//             //     undefined,
//             //     data.production
//             // )
//         }
//     })
// })

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

const callbackForClose = () => {
  // const transformedConsumptionData = transformResponse(consumptionData, 'consumption')
  // const transformedProductionData =  transformResponse(productionData, 'production')
  // Store the transformed data in the database
  // for (let i = 0; i < transformedConsumptionData?.length; i++) {
  //     const data = transformedConsumptionData[i]
  //     // Store the data in the database
  //     // addData(
  //     //     data.country,
  //     //     data.year,
  //     //     data.consumption,
  //     // )
  // }
  // for (let i = 0; i < transformedProductionData?.length; i++) {
  //     const data = transformedProductionData[i]
  //     // Store the data in the database
  //     // addData(
  //     //     data.country,
  //     //     data.year,
  //     //     undefined,
  //     //     data.production
  //     // )
  // }
};

const callbackForCloseForConsumptionData = () => {
  const arrayToStoreTransformedData = []

  // Remove first array because that's the row with the column names
  consumptionData.shift()

  for (let i = 0; i < consumptionData?.length; i++) {
    for (let j = 0; j < consumptionData[i]?.length; j++) {
      const obj = {
        country: consumptionData[i]?.[0],
        year: consumptionData[i]?.[1],
        consumption: consumptionData[i]?.[2]
      }

      arrayToStoreTransformedData.push(obj)
    }
  }

  // console.log(arrayToStoreTransformedData)
}

const callbackForCloseForProductionData = () => {
  const arrayToStoreTransformedData = []

  // Remove first array because that's the row with the column names
  productionData.shift()

  for (let i = 0; i < productionData?.length; i++) {
    for (let j = 0; j < productionData[i]?.length; j++) {
      const obj = {
        country: productionData[i]?.[0],
        year: productionData[i]?.[1],
        consumption: productionData[i]?.[2]
      }

      arrayToStoreTransformedData.push(obj)
    }
  }

  // console.log(arrayToStoreTransformedData)
}

const callbackForCloseWeatherData = () => {
  const arrayToStoreTransformedData = []

  // Remove first array because that's the row with the column names
  weatherData.shift()

  for (let i = 0; i < weatherData?.length; i++) {
    for (let j = 0; j < weatherData[i]?.length; j++) {
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
        latitude,
        longitude,
        averageTemperature,
        minTemperature,
        maxTemperature,
        windSpeed,
        pressure
      }

      arrayToStoreTransformedData.push(weatherDataObj)
    }
  }

  console.log(arrayToStoreTransformedData)
}

const consumptionRL = createDynamicRL(
  energyConsumptionFilePath,
  callbackForLineForConsumptionData,
  callbackForCloseForConsumptionData
);
const productionRL = createDynamicRL(
  energyProductionFilePath,
  callbackForLineForProductionData,
  callbackForCloseForProductionData
);
const weatherRL = createDynamicRL(
  dailyWeatherFilePath,
  callbackForLineForWeatherData,
  callbackForCloseWeatherData
);
// const gdpPerCapitaRL = createDynamicRL(
//   gdpPerCapitaFilePath,
//   callbackForLineForGDPData,
//   callbackForClose
// );
// const populationGrowthRL = createDynamicRL(
//   populationFilePath,
//   callbackForLineForPopulationData,
//   callbackForClose
// );
// const CO2EmissionsRL = createDynamicRL(
//   co2EmissionsFilePath,
//   callbackForLineForCo2EmissionsData,
//   callbackForClose
// );
