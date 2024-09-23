import pandas
import sqlite3
import sys
import json
import os
from typing import Any, Dict, Literal

TableType = Literal["ElectricityConsumptionPerCapitaTable", "ElectricityGenerationTable", "ElectricityConsumptionTable", "WeatherDataTable", "GdpPerCapitaGrowthTable", "PopulationGrowthTable", "CO2EmissionsTable"]

def process_csv(db_path: str, table_name: TableType) -> Dict[str, Any]:
    """
    Processes CSV data provided as a JSON string and inserts it into a SQLite3 database.

    :param data: JSON string representing CSV data.
    :param db_path: Path to the SQLite3 database.
    :return: Dictionary containing the result status and message.
    """
    try:
        match table_name:
            case "ElectricityConsumptionPerCapitaTable":
                print(os.path.join("temp"))
                with open(os.path.join("temp", "ElectricityConsumptionPerCapitaTable.json"), '', encoding='utf-8') as json_data:
                    data = json.load(json_data)
                    print(data)
            case _:
                print(f"An error occured during processing data for {table_name}")
        
        # df: pandas.DataFrame = pandas.DataFrame(records)

        # # Perform any data transformations here
        # # Example: df = df.dropna()

        # conn: sqlite3.Connection = sqlite3.connect(db_path)
        # df.to_sql(table_name, conn, if_exists='append', index=False)
        # conn.close()

        return { "success": True, "message": "Data inserted successfully" }
    except Exception as e:
        return { "success": False, "message": str(e) }

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({ "success": False, "message": "Invalid arguments" }))
        sys.exit(1)

    database_path: str = sys.argv[1]
    table_name: TableType = sys.argv[2]

    print(json.dumps({ "table_name": table_name }))

    result: Dict[str, Any] = process_csv(database_path, table_name)
    print(json.dumps(result))