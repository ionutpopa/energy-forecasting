import { Sequelize, DataTypes, ModelCtor, Model, ConnectionError, ConnectionTimedOutError, TimeoutError } from "sequelize";

// Initialize Sequelize with SQLite dialect
export const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "database.sqlite",
    retry: {
        match: [
            ConnectionError,
            ConnectionTimedOutError,
            TimeoutError,
            /Deadlock/i,
            'SQLITE_BUSY'],
        max: 3
    }
})

export const ElectricityGenerationTable = sequelize.define("ElectricityGenerationTable", {
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    generation: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}) as ModelCtor<Model<any, any>>

export const ElectricityConsumptionTable = sequelize.define("ElectricityConsumptionTable", {
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    production: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}) as ModelCtor<Model<any, any>>

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
}) as ModelCtor<Model<any, any>>

export const GdpPerCapitaGrowthTable = sequelize.define("GdpPerCapitaGrowthTable", {
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gdpPerCapitaGrowth: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}) as ModelCtor<Model<any, any>>

export const PopulationGrowthTable = sequelize.define("PopulationGrowthTable", {
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    population: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}) as ModelCtor<Model<any, any>>

export const CO2EmissionsTable = sequelize.define("CO2EmissionsTable", {
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    co2Emissions: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}) as ModelCtor<Model<any, any>>

export const connectDb = async () => {
    try {
        await sequelize.sync()

        console.log("Database synchronized")
    } catch (error) {
        console.error("An error occurred while synchronizing the database", error)
    } finally {
        // await sequelize.close()
        console.log("Database connection closed")
    }
}