import { Sequelize, DataTypes } from "sequelize";

// Initialize Sequelize with SQLite dialect
export const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "database.sqlite"
})

export const ElectricDataTable = sequelize.define("ElectricDataTable", {
    // Model attributes are defined here
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.STRING,
        allowNull: false
    },
    consumption: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    production: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}) as any

(async () => {
    try {
        await sequelize.sync()
        
        // Drop the table
        // await ElectricDataTable.drop();

        console.log("Database synchronized")
    } catch (error) {
        console.error("An error occurred while synchronizing the database", error)
    } finally {
        // await sequelize.close()
        console.log("Database connection closed")
    }
})()