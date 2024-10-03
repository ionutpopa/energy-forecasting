import pandas
import sqlite3
import sys
import json
import os
import math
from typing import Any, Dict, Literal
from datetime import datetime

TableType = Literal["ElectricityConsumptionPerCapitaTable", "ElectricityGenerationTable", "ElectricityConsumptionTable", "WeatherDataTable", "GdpPerCapitaGrowthTable", "PopulationGrowthTable", "CO2EmissionsTable"]

class FilteredObject:
    def __init__(self, **args):
        for key, value in args.items():
            setattr(self, key, value)

def filter_consumption_per_capita_data(data: Dict[list, Any]):
    """
    Filter unuseful consumption data
    """
    filtered_data = list() # this is a list
    for country_data in data:
        # check if first element exists, check if array is longer then 1, if first element is string, and if the third elemnt is not NaN
        if len(country_data) >= 3:
            if isinstance(country_data[0], str) and isinstance(int(country_data[2]), int) and not math.isnan(float(country_data[3])):
                data_obj = dict(country=country_data[0], year=int(country_data[2]), consumption=float(country_data[3]))
                filtered_data.append(data_obj)
    return filtered_data

def filter_consumption_data(data: Dict[list, Any]):
    """
    Filter unuseful consumption data
    """
    filtered_data = list() # this is a list
    for country_data in data:
        # check if first element exists, check if array is longer then 1, if first element is string, and if the third elemnt is not NaN
        if len(country_data) >= 3:
            if isinstance(country_data[0], str) and isinstance(int(country_data[2]), int) and not math.isnan(float(country_data[3])):
                data_obj = dict(country=country_data[0], year=int(country_data[2]), consumption=float(country_data[3]))
                filtered_data.append(data_obj)
    return filtered_data

def process_csvs(table_name: TableType, cursor: sqlite3.Cursor) -> Dict[str, Any]:
    """
    Processes CSV data provided as a JSON string and inserts it into a SQLite3 database.

    :param data: JSON string representing CSV data.
    :param db_path: Path to the SQLite3 database.
    :return: Dictionary containing the result status and message.
    """

    current_dir = os.path.dirname(os.path.abspath(__file__))
    try:
        match table_name:
            case "ElectricityConsumptionPerCapitaTable":
                json_file_path = os.path.join(current_dir, "temp", "ElectricityConsumptionPerCapitaTable.json")
                if json_file_path:
                    with open(json_file_path, 'r', encoding='utf-8') as json_data:
                        data = json.load(json_data)
                        filtered_data = filter_consumption_per_capita_data(data)
                        cursor.execute('''
                                    CREATE TABLE IF NOT EXISTS ElectricityConsumptionPerCapitaTable (
                                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                                        country VARCHAR(255),
                                        year INTEGER NOT NULL,
                                        consumption FLOAT,
                                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                                    )
                                    ''')

                        insert_query = 'INSERT INTO ElectricityConsumptionPerCapitaTable (country, year, consumption, updatedAt) VALUES (?, ?, ?, ?)'

                        # Insert filtered data
                        for row in filtered_data:
                            try:
                                # Ensure the row has at least 3 elements to match table columns
                                if len(row) >= 3:
                                    updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                                    cursor.execute(insert_query, (row[0], row[1], row[2], updated_at))
                                    print('added', row[1])
                            except sqlite3.IntegrityError as e:
                                print(f"Error inserting row {row}: {e}")

                        # Commit the transaction
                        conn.commit()
                    os.remove(json_file_path)
            case "ElectricityConsumptionTable":
                json_file_path = os.path.join(current_dir, "temp", "ElectricityConsumptionTable.json")
                if json_file_path:
                    with open(json_file_path, 'r', encoding='utf-8') as json_data:
                        data = json.load(json_data)
                        filtered_data = filter_consumption_data(data)
                        cursor.execute('''
                                    CREATE TABLE IF NOT EXISTS ElectricityConsumptionTable (
                                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                                        country VARCHAR(255),
                                        year INTEGER NOT NULL,
                                        consumption FLOAT,
                                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                                    )
                                    ''')

                        insert_query = 'INSERT INTO ElectricityConsumptionTable (country, year, consumption, updatedAt) VALUES (?, ?, ?, ?)'

                        # Insert filtered data
                        for row in filtered_data:
                            try:
                                # Ensure the row has at least 3 elements to match table columns
                                if len(row) >= 3:
                                    updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                                    cursor.execute(insert_query, (row[0], row[1], row[2], updated_at))
                                    print('added', row[1])
                            except sqlite3.IntegrityError as e:
                                print(f"Error inserting row {row}: {e}")

                        # Commit the transaction
                        conn.commit()
                    os.remove(json_file_path)
            case _:
                print(f"An error occured during processing data for {table_name}")

        return { "success": True, "message": "Data inserted successfully" }
    except Exception as e:
        return { "success": False, "message": str(e) }

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({ "success": False, "message": "Invalid arguments" }))
        sys.exit(1)

    database_path: str = sys.argv[1]
    table_name: TableType = sys.argv[2]

    conn: sqlite3.Connection = sqlite3.connect(database_path)
    cursor = conn.cursor()
    
    print(json.dumps({ "Conected to": database_path }))

    result: Dict[str, Any] = process_csvs(table_name, cursor)

    conn.close()