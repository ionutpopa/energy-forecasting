import express from 'express'
import cors from 'cors'
// @ts-ignore
import cron from 'node-cron'
import router from './routes'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/', router)

// Import the database configuration
require("./database/config")

// Start the csv parsing, only run this once on your local machine
// require("./utils/parseCSVs")

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000')
})

// This will run every day at 12:00 to get the newest data in our database
cron.schedule('0 12 * * *', () => {
    // Here will run getNewData function
});