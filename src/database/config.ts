import { Sequelize, DataTypes } from "sequelize";

// Initialize Sequelize with SQLite dialect
export const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "database.sqlite"
})

export const ElectricityGenerationTable = sequelize.define("ElectricityGenerationTable", {
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.STRING,
        allowNull: false
    },
    generation: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}) as any

export const ElectricityConsumptionTable = sequelize.define("ElectricityConsumptionTable", {
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.STRING,
        allowNull: false
    },
    production: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}) as any

export const WeatherDataTable = sequelize.define("WeatherDataTable", {
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    averageTemperature: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    minTemperature: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    maxTemperature: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    windSpeed: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    pressure: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
}) as any

(async () => {
    try {
        await sequelize.sync()

        console.log("Database synchronized")
    } catch (error) {
        console.error("An error occurred while synchronizing the database", error)
    } finally {
        // await sequelize.close()
        console.log("Database connection closed")
    }
})()