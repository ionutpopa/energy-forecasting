import sqlite3
import sys
import json
import os
import math
from typing import Any, Dict, Literal
from datetime import datetime
from threading import Timer
from array import array
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)

TableType = Literal["ElectricityConsumptionPerCapitaTable", "ElectricityGenerationTable", "ElectricityConsumptionTable", "WeatherDataTable", "GdpPerCapitaGrowthTable", "PopulationGrowthTable", "CO2EmissionsTable"]

class FilteredObject:
    def __init__(self, **args):
        for key, value in args.items():
            setattr(self, key, value)

# This function will be used for both consumption and consumption per capita data
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

def filter_generation_data(data: Dict[list, Any]):
    """
    Filter unuseful generation data
    """
    filtered_data = list()
    for country_data in data:
        if len(country_data) >= 3:
            if isinstance(country_data[0], str) and isinstance(int(country_data[2]), int) and not math.isnan(float(country_data[3])):
                data_obj = dict(country=country_data[0], year=int(country_data[2]), generation=float(country_data[3]))
                filtered_data.append(data_obj)
    return filtered_data

def check_valid_date(date: str):
    """
    Check if date is valid for two formats:
    - dd/mm/YYYY
    - dd-mm-YYYY
    """
    first_format = "%d-%m-%Y"
    second_format = "%d/%m/%Y"
    res = True
    try:
        res = bool(datetime.strptime(date, first_format)) or bool(datetime.strptime(date, second_format))
    except ValueError:
        res = False
    return res

def parse_date(date_string):
    formats = ["%d-%m-%Y", "%d/%m/%Y"]

    res = ''

    for date_format in formats:
        try:
            res = datetime.strptime(date_string, date_format)
        except ValueError:
            continue

    return res


def filter_weather_data(country_data: list[Any]):
    """
    Filter unuseful weather data
    """
    data_str: str = country_data[1:-3].replace('"', '')
    data_list = data_str.split(sep=",")
    if len(data_list) > 9:
        # check if first variable is a date and if averageTemperature, minTemperature and maxTemperature is not NaN
        if check_valid_date(data_list[0]) and not math.isnan(float(data_list[4])) and not math.isnan(float(data_list[5])) and not math.isnan(float(data_list[6])):
            data_obj = dict(
                date=parse_date(data_list[0]), # e.g.: 22-05-2020 or 22/05/2020
                country=data_list[1],
                latitude=float(data_list[2]),
                longitude=float(data_list[3]),
                averageTemperature=float(data_list[4]),
                minTemperature=float(data_list[5]),
                maxTemperature=float(data_list[6]),
                windSpeed=float(data_list[8]),
                pressure=float(data_list[9]) # hectopascal hPa
            )
            return data_obj
        
def filter_gdp_per_capita_data(data: Dict[list, Any]):
    """
    Filter unuseful gdp per capita data
    """
    filtered_data = list()
    for country_data in data:
        if len(country_data) == 3:
            if isinstance(country_data[0], str) and isinstance(int(country_data[1]), int) and isinstance(float(country_data[2]), float):
                data_obj = dict(
                    country=country_data[0], 
                    year=int(country_data[1]), 
                    gdpPerCapitaGrowth=float(country_data[2])
                )
                filtered_data.append(data_obj)
    return filtered_data

def filter_population_growth_data(data: Dict[list, Any]):
    """
    Filter unuseful population growth data
    returns -> [...{country, year, population}]
    """
    filtered_data = list()
    for country_data in data:
        if len(country_data) == 3:
            if isinstance(country_data[0], str) and isinstance(int(country_data[1]), int) and isinstance(float(country_data[2]), float):
                data_obj = dict(
                    country=country_data[0], 
                    year=int(country_data[1]), 
                    population=float(country_data[2])
                )
                filtered_data.append(data_obj)
    return filtered_data

def filter_co2_emissions_data(data: Dict[list, Any]):
    """
    Filter unuseful co2 emissions data
    returns -> [...{country, year, co2Emissions}]
    """
    filtered_data = list()
    for country_data in data:
        if len(country_data) == 3:
            if isinstance(country_data[0], str) and isinstance(int(country_data[1]), int) and isinstance(float(country_data[2]), float):
                data_obj = dict(
                    country=country_data[0], 
                    year=int(country_data[1]), 
                    co2Emissions=float(country_data[2])
                )
                filtered_data.append(data_obj)
    return filtered_data

def process_csvs(table_name: TableType, cursor: sqlite3.Cursor) -> Dict[str, Any]:
    """
    Processes CSV data provided from the name of the table JSON file and inserts it into the SQLite3 database.

    :param data: JSON string representing CSV data.
    :param db_path: Path to the SQLite3 database.
    :return: Dictionary containing the result status and message.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    match table_name:
        case 'ElectricityConsumptionPerCapitaTable':
            json_file_path = os.path.join(current_dir, "temp", "ElectricityConsumptionPerCapitaTable.json")
            if json_file_path:
                with open(json_file_path, 'r', encoding='utf-8') as json_data:
                    data = json.load(json_data)
                    filtered_data = filter_consumption_data(data)
                    cursor.execute('''
                                CREATE TABLE IF NOT EXISTS ElectricityConsumptionPerCapitaTables (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    country VARCHAR(255),
                                    year INTEGER NOT NULL,
                                    consumption FLOAT,
                                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                                )
                                ''')

                    insert_query = 'INSERT INTO ElectricityConsumptionPerCapitaTables (country, year, consumption, createdAt, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)'

                    # Insert filtered data
                    for row in filtered_data:
                        if len(row) >= 3:
                            try:
                                updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                                cursor.execute(insert_query, (row['country'], row['year'], row['consumption'], updated_at))
                            except sqlite3.IntegrityError as e:
                                print(f"Error inserting row {row}: {e}")

                    # Commit the transaction
                    print("Populated ElectricityConsumptionPerCapitaTable")
                    conn.commit()
                os.remove(json_file_path)
        case 'ElectricityConsumptionTable':
            json_file_path = os.path.join(current_dir, "temp", "ElectricityConsumptionTable.json")
            if json_file_path:
                with open(json_file_path, 'r', encoding='utf-8') as json_data:
                    data = json.load(json_data)
                    filtered_data = filter_consumption_data(data)
                    cursor.execute('''
                                CREATE TABLE IF NOT EXISTS ElectricityConsumptionTables (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    country VARCHAR(255),
                                    year INTEGER NOT NULL,
                                    consumption FLOAT,
                                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                                )
                                ''')

                    insert_query = 'INSERT INTO ElectricityConsumptionTables (country, year, consumption, createdAt, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)'

                    # Insert filtered data
                    for row in filtered_data:
                        if len(row) >= 3:
                            try:
                                updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                                cursor.execute(insert_query, (row['country'], row['year'], row['consumption'], updated_at))
                            except sqlite3.IntegrityError as e:
                                print(f"Error inserting row {row}: {e}")

                    # Commit the transaction
                    conn.commit()
                    print("Populated ElectricityConsumptionTable")
                os.remove(json_file_path)
        case 'ElectricityGenerationTable':
            json_file_path = os.path.join(current_dir, "temp", "ElectricityGenerationTable.json")
            if json_file_path:
                with open(json_file_path, 'r', encoding='utf-8') as json_data:
                    data = json.load(json_data)
                    filtered_data = filter_generation_data(data)
                    cursor.execute('''
                                CREATE TABLE IF NOT EXISTS ElectricityGenerationTables (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    country VARCHAR(255),
                                    year INTEGER NOT NULL,
                                    generation FLOAT,
                                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                                )
                                ''')

                    insert_query = 'INSERT INTO ElectricityGenerationTables (country, year, generation, createdAt, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)'

                    # Insert filtered data
                    for row in filtered_data:
                        if len(row) >= 3:
                            try:
                                updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                                cursor.execute(insert_query, (row['country'], row['year'], row['generation'], updated_at))
                            except sqlite3.IntegrityError as e:
                                print(f"Error inserting row {row}: {e}")

                    # Commit the transaction
                    conn.commit()
                    print("Populated ElectricityGenerationTable")
                os.remove(json_file_path)
        case 'WeatherDataTable':
            json_file_path = os.path.join(current_dir, "temp", "WeatherDataTable.json")
            if json_file_path:
                with open(json_file_path) as json_data:
                    unfiltered_data = list()
                    filtered_data = list()

                    for line in json_data:
                        unfiltered_data.append(line)

                    for data_line in unfiltered_data:
                        if data_line != ']' and data_line != '[':
                            filtered_data.append(filter_weather_data(data_line))

                    cursor.execute('''
                                CREATE TABLE IF NOT EXISTS WeatherDataTables (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    date DATETIME,
                                    country VARCHAR(255),
                                    latitude FLOAT,
                                    longitude FLOAT,
                                    averageTemperature FLOAT NOT NULL,
                                    minTemperature FLOAT NOT NULL,
                                    maxTemperature FLOAT NOT NULL,
                                    windSpeed FLOAT,
                                    pressure FLOAT,
                                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                                )
                                ''')

                    insert_query = 'INSERT INTO WeatherDataTables (date, country, latitude, longitude, averageTemperature, minTemperature, maxTemperature, windSpeed, pressure, updatedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
                    # Insert filtered data
                    for row in filtered_data:
                        if row:
                            cursor.execute(insert_query, (row['date'], row['country'], row['latitude'], row['longitude'], row['averageTemperature'], row['minTemperature'], row['maxTemperature'], row['windSpeed'], row['pressure']))

                    # Commit the transaction
                    conn.commit()
                    print("Populated WeatherDataTable")
                os.remove(json_file_path)
        case 'GdpPerCapitaGrowthTable':
            json_file_path = os.path.join(current_dir, "temp", 'GdpPerCapitaGrowthTable.json')
            if json_file_path:
                with open(json_file_path, 'r', encoding='utf-8') as json_data:
                    data = json.load(json_data)
                    filtered_data = filter_gdp_per_capita_data(data)
                    cursor.execute('''
                                CREATE TABLE IF NOT EXISTS GdpPerCapitaGrowthTables (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    country VARCHAR(255),
                                    year INTEGER NOT NULL,
                                    gdpPerCapitaGrowth FLOAT,
                                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                                )
                                ''')

                    insert_query = 'INSERT INTO GdpPerCapitaGrowthTables (country, year, gdpPerCapitaGrowth, createdAt, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)'

                    # Insert filtered data
                    for row in filtered_data:
                        if len(row) >= 3:
                            try:
                                updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                                cursor.execute(insert_query, (row['country'], row['year'], row['gdpPerCapitaGrowth'], updated_at))
                            except sqlite3.IntegrityError as e:
                                print(f"Error inserting row {row}: {e}")

                    # Commit the transaction
                    conn.commit()
                    print("Populated GdpPerCapitaGrowthTable")
                os.remove(json_file_path)
        case 'PopulationGrowthTable':
            json_file_path = os.path.join(current_dir, "temp", 'PopulationGrowthTable.json')
            if json_file_path:
                with open(json_file_path, 'r', encoding='utf-8') as json_data:
                    data = json.load(json_data)
                    filtered_data = filter_population_growth_data(data)
                    cursor.execute('''
                                CREATE TABLE IF NOT EXISTS PopulationGrowthTables (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    country VARCHAR(255),
                                    year INTEGER NOT NULL,
                                    population FLOAT,
                                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                                )
                                ''')

                    insert_query = 'INSERT INTO PopulationGrowthTables (country, year, population, createdAt, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)'

                    # Insert filtered data
                    for row in filtered_data:
                        if len(row) >= 3:
                            try:
                                updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                                cursor.execute(insert_query, (row['country'], row['year'], row['population'], updated_at))
                            except sqlite3.IntegrityError as e:
                                print(f"Error inserting row {row}: {e}")

                    # Commit the transaction
                    conn.commit()
                    print("Populated PopulationGrowthTable")
                os.remove(json_file_path)
        case 'CO2EmissionsTable':
            json_file_path = os.path.join(current_dir, "temp", 'CO2EmissionsTable.json')
            if json_file_path:
                with open(json_file_path, 'r', encoding='utf-8') as json_data:
                    data = json.load(json_data)
                    filtered_data = filter_co2_emissions_data(data)
                    cursor.execute('''
                                CREATE TABLE IF NOT EXISTS CO2EmissionsTables (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    country VARCHAR(255),
                                    year INTEGER NOT NULL,
                                    co2Emissions FLOAT,
                                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                                )
                                ''')

                    insert_query = 'INSERT INTO CO2EmissionsTables (country, year, co2Emissions, createdAt, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)'

                    # Insert filtered data
                    for row in filtered_data:
                        if len(row) >= 3:
                            try:
                                updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                                cursor.execute(insert_query, (row['country'], row['year'], row['co2Emissions'], updated_at))
                            except sqlite3.IntegrityError as e:
                                print(f"Error inserting row {row}: {e}")

                    # Commit the transaction
                    conn.commit()
                    print("Populated CO2EmissionsTable")
                os.remove(json_file_path)
        case _:
            print(f"An error occured during processing data for {table_name}")

    return { "success": True, "message": "Data inserted successfully" }

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({ "success": False, "message": "Invalid arguments" }))
        sys.exit(1)

    database_path: str = sys.argv[1]
    table_name: TableType = sys.argv[2]

    conn: sqlite3.Connection = sqlite3.connect(database_path)
    cursor = conn.cursor()
    
    print("Conected to", database_path)

    result: Dict[str, Any] = process_csvs(table_name, cursor)
    
    print(result)

    conn.close()
