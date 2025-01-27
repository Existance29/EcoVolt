import random
from datetime import datetime, timedelta
import pyperclip

# Function to generate random data
def generate_random_data(data_center_id, start_date, end_date, num_entries):
    data = []
    current_date = datetime.strptime(start_date, "%Y-%m-%d")
    end_date = datetime.strptime(end_date, "%Y-%m-%d")

    dataRangeByDataCenterAndYear = {
        1: {
            2021: [[8500, 10500], [60, 65]],
            2022: [[7800, 9300], [50, 55]],
            2023: [[7100, 8200], [47, 52]],
            2024: [[6400, 7600], [40, 45]]
        },
        2: {
            2021: [[1000, 1300], [45, 50]],
            2022: [[900, 1150], [40, 45]],
            2023: [[800, 1000], [35, 40]],
            2024: [[700, 900], [30, 35]]
        },
        3: {
            2021: [[4700, 5500], [35, 40]],
            2022: [[4200, 5000], [30, 35]],
            2023: [[3700, 4500], [27, 32]],
            2024: [[3400, 4200], [25, 30]]
        },
        4: {
            2021: [[800, 1000], [35, 40]],
            2022: [[700, 900], [32, 37]],
            2023: [[650, 800], [30, 35]],
            2024: [[600, 750], [27, 32]]
        },
        5: {
            2021: [[1200, 1500], [45, 50]],
            2022: [[1100, 1400], [40, 45]],
            2023: [[950, 1200], [35, 40]],
            2024: [[850, 1100], [30, 35]]
        },
        6: {
            2021: [[1300, 1600], [50, 55]],
            2022: [[1200, 1500], [45, 50]],
            2023: [[1100, 1400], [40, 45]],
            2024: [[950, 1200], [35, 40]]
        },
        7: {
            2021: [[1000, 1300], [50, 55]],
            2022: [[900, 1150], [45, 50]],
            2023: [[850, 1050], [40, 45]],
            2024: [[750, 950], [35, 40]]
        },
        8: {
            2021: [[1600, 2000], [55, 60]],
            2022: [[1500, 1800], [50, 55]],
            2023: [[1400, 1700], [45, 50]],
            2024: [[1300, 1600], [40, 45]]
        },
        9: {
            2021: [[5200, 5800], [37, 42]],
            2022: [[4700, 5400], [32, 37]],
            2023: [[4300, 5100], [27, 32]],
            2024: [[3900, 4700], [25, 30]]
        },
        10: {
            2021: [[1300, 1500], [42, 47]],
            2022: [[1200, 1400], [38, 43]],
            2023: [[1100, 1300], [35, 40]],
            2024: [[950, 1200], [30, 35]]
        },
        11: {
            2021: [[6200, 7200], [35, 40]],
            2022: [[5600, 6600], [30, 35]],
            2023: [[5000, 6000], [27, 32]],
            2024: [[4400, 5400], [25, 30]]
        },
        12: {
            2021: [[2300, 2600], [42, 47]],
            2022: [[2100, 2400], [38, 43]],
            2023: [[1900, 2200], [35, 40]],
            2024: [[1700, 2100], [30, 35]]
        },
        13: {
            2021: [[5300, 6000], [40, 45]],
            2022: [[4700, 5400], [35, 40]],
            2023: [[4200, 4900], [30, 35]],
            2024: [[3700, 4400], [27, 32]]
        },
        14: {
            2021: [[1200, 1500], [45, 50]],
            2022: [[1100, 1400], [40, 45]],
            2023: [[950, 1200], [35, 40]],
            2024: [[850, 1100], [30, 35]]
        },
        15: {
            2021: [[3200, 3700], [55, 60]],
            2022: [[2800, 3300], [50, 55]],
            2023: [[2500, 3000], [45, 50]],
            2024: [[2200, 2700], [40, 45]]
        },
        16: {
            2021: [[1700, 2000], [45, 50]],
            2022: [[1500, 1800], [40, 45]],
            2023: [[1400, 1700], [35, 40]],
            2024: [[1300, 1600], [30, 35]]
        },
        17: {
            2021: [[3300, 3800], [52, 57]],
            2022: [[2900, 3400], [47, 52]],
            2023: [[2500, 3000], [42, 47]],
            2024: [[2200, 2700], [37, 42]]
        },
        18: {
            2021: [[3400, 3900], [55, 60]],
            2022: [[3000, 3500], [50, 55]],
            2023: [[2700, 3200], [45, 50]],
            2024: [[2400, 2900], [40, 45]]
        },
        19: {
            2021: [[2700, 3200], [50, 55]],
            2022: [[2300, 2800], [45, 50]],
            2023: [[2000, 2500], [40, 45]],
            2024: [[1700, 2200], [37, 42]]
        },
        20: {
            2021: [[2200, 2700], [50, 55]],
            2022: [[2000, 2500], [45, 50]],
            2023: [[1800, 2300], [40, 45]],
            2024: [[1500, 2000], [35, 40]]
        },
    }

    while current_date <= end_date:
        for _ in range(num_entries):
            # Generate random energy values
            co2_emissions_tons = round(random.uniform(*dataRangeByDataCenterAndYear[data_center_id][current_date.year][0]), 2)
            renewable_energy_percentage = round(random.uniform(*dataRangeByDataCenterAndYear[data_center_id][current_date.year][1]), 2)

            data.append((
                data_center_id,
                current_date.strftime("%Y-%m-%d"),
                co2_emissions_tons,
                renewable_energy_percentage
            ))
        current_date += timedelta(days=1)

    return data

def generate_data_for_towers(num_towers, start_year, end_year):
    all_data = []

    for tower_id in range(1, num_towers + 1):
        for year in range(start_year, end_year + 1):
            for month in range(11, 13):  # August (8) to December (12)
                for day in range(1, 11):  # First 10 days of each month
                    current_date = f"{year}-{month:02d}-{day:02d}"
                    tower_data = generate_random_data(tower_id, current_date, current_date, 1)
                    all_data.extend(tower_data)

    return all_data


# Insert statement generation
def generate_insert_statements(data):
    statements = []
    for entry in data:
        statement = f"({entry[0]}, '{entry[1]}', {entry[2]}, {entry[3]})"
        statements.append(statement)
    return ",\n".join(statements)

# Parameters
num_towers = 20
start_year = 2021
end_year = 2024

# Generate data
data = generate_data_for_towers(num_towers, start_year, end_year)

# Generate SQL Insert Statement
insert_prefix = "INSERT data_center_carbon_emissions (data_center_id, date, co2_emissions_tons, renewable_energy_percentage)\nSELECT * FROM (VALUES\n"
insert_data = generate_insert_statements(data)
sql_insert_statement = insert_prefix + insert_data + ") AS temp (data_center_id, date, co2_emissions_tons, renewable_energy_percentage);"

# Print the generated SQL statement
pyperclip.copy(sql_insert_statement)
print("done")