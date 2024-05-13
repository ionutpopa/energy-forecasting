import fs from 'fs'
import readline from 'readline'
import { transformResponse } from './transformResponse'

// Energy consumption in the world file path
const firstFilePath = "global-energy-substitution.csv"
const secondFilePath = "electricity-prod-source-stacked.csv"

// We will use the readline module to read the file line by line
const rl1 = readline.createInterface({
    input: fs.createReadStream(firstFilePath),
    output: process.stdout,
    terminal: false
})

// Array to store parsed CSV data
const consumptionData: string[][] = []
const productionData: string[][] = []

// Event listener for eac line read from the CSV file   
rl1.on("line", (line) => {
    // Split the line by comma to get individual values
    const values = line.split(",")

    // Add values to the csvData array
    consumptionData.push(values)
})

// Event listener for the end of the file
rl1.on("close", () => {
    const rl2 = readline.createInterface({
        input: fs.createReadStream(secondFilePath),
        output: process.stdout,
        terminal: false
    })


    rl2.on("line", (line) => {
        // Split the line by comma to get individual values
        const values = line.split(",")

        const removeCommasValues = values.map((value) => value?.replace(/;/g, ""))

        // Add values to the csvData array
        productionData.push(removeCommasValues)
    })

    rl2.on("close", () => {
        // transformResponse(consumptionData)
        // console.log("consumptionData", consumptionData)
        // transformResponse(productionData)
        console.log("productionData", productionData)
    })
})