import { Sequelize, DataTypes, ModelCtor, Model, ConnectionError, ConnectionTimedOutError, TimeoutError } from "sequelize";
import logger from "../utils/formatLogs";

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
            'SQLITE_BUSY'
        ],
        max: Number(process.env.MAX_RETRIES) || 10
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
    consumption: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}) as ModelCtor<Model<any, any>>

export const ElectricityConsumptionPerCapitaTable = sequelize.define("ElectricityConsumptionPerCapitaTable", {
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    consumption: {
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

export const dropAllTables = async () => {
    try {
        await sequelize.drop(); // Drops all tables
        logger("All tables dropped!");
    } catch (error) {
        logger("An error occurred while dropping tables:");
        logger(JSON.stringify(error, null, 2), 'error');
    }
};

export const deleteSpecificTable = async (tableName: string) => {
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    const table = tables.find((t) => t === tableName)

    if (table) {
        await queryInterface.dropTable(table)
        logger(`Dropped ${table} succesfully`)
    }
}