import random
from datetime import datetime, timedelta
import pyperclip

# Function to generate random data
def generate_random_data(data_center_id, start_date, end_date, num_entries):
    data = []
    current_date = datetime.strptime(start_date, "%Y-%m-%d")
    end_date = datetime.strptime(end_date, "%Y-%m-%d")

    totalEnergyRangeByDataCenterAndYear = {
        1: {
            2024: [10000,12000],
            2023: [11000,12000],
            2022: [11000,12500],
            2021: [12000,13000],
        },
        2: {
            2024: [11000,12000],
            2023: [11500,12000],
            2022: [12000,12800],
            2021: [12800,13500],
        },
        3: {
            2024: [9000,9400],
            2023: [9400,9700],
            2022: [9700,10000],
            2021: [10000,10500],
        },  
        4: {
            2024: [8400,8800],
            2023: [8300,8700],
            2022: [8200,8700],
            2021: [8200,8700],
        },  
        5: {
            2024: [7400,7800],
            2023: [8300,8700],
            2022: [8200,8700],
            2021: [8200,8700],
        },  
        6: {
            2024: [9600,10100],
            2023: [10100,10500],
            2022: [10600,10800],
            2021: [11000,11400],
        },  
        7: {
            2024: [8800, 9200],
            2023: [8900, 9300],
            2022: [9000, 9400],
            2021: [9100, 9500],
        },
        8: {
            2024: [7800, 8100],
            2023: [7700, 8000],
            2022: [7600, 7900],
            2021: [7500, 7800],
        },
        9: {
            2024: [11500, 12000],
            2023: [11800, 12300],
            2022: [12000, 12500],
            2021: [12200, 12700],
        },
        10: {
            2024: [6600, 7000],
            2023: [6500, 6900],
            2022: [6400, 6800],
            2021: [6300, 6700],
        },
        11: {
            2024: [7800, 8000],
            2023: [8000, 8100],
            2022: [8150, 8300],
            2021: [8500, 8600],
        },
        12: {
            2024: [9000, 9500],
            2023: [9700, 10000],
            2022: [10000, 10400],
            2021: [10700, 11000],
        },
        13: {
            2024: [8000, 8300],
            2023: [7800, 8000],
            2022: [7700, 7900],
            2021: [7600, 7800],
        },
        14: {
            2024: [8200, 8400],
            2023: [8100, 8300],
            2022: [8000, 8200],
            2021: [7900, 8100],
        },
        15: {
            2024: [7800, 8000],
            2023: [7700, 7950],
            2022: [7600, 7800],
            2021: [7500, 7700],
        },
        16: {
            2024: [7200,7400],
            2023: [7300,7500],
            2022: [7400,7600],
            2021: [7600,7800],
        },
        17: {
            2024: [9400,9600],
            2023: [9300,9500],
            2022: [9200,9400],
            2021: [9100,9300],
        },
        18: {
            2024: [7800,8000],
            2023: [8300,8500],
            2022: [8800,9000],
            2021: [9300,9500],
        },
        19: {
            2024: [7000,7200],
            2023: [7600,7800],
            2022: [8300,8500],
            2021: [8700,9000],
        },
        20: {
            2024: [6500,6700],
            2023: [7200,7400],
            2022: [7800,8000],
            2021: [8200,8500],
        },
    }

    while current_date <= end_date:
        for _ in range(num_entries):
            # Generate random energy values
            total_energy = round(random.uniform(*totalEnergyRangeByDataCenterAndYear[data_center_id][current_date.year]), 2)

            # Allocate percentages of total energy ensuring they sum to 100%
            radio_percentage = random.uniform(0.4, 0.5)
            cooling_percentage = random.uniform(0.5, 0.6)
            backup_percentage = random.uniform(0.03, 0.1)
            lighting_percentage = random.uniform(0.01, 0.07)

            other_energy = radio_percentage + cooling_percentage + backup_percentage + lighting_percentage
            scale_factor = 1 / other_energy  # Scale percentages to sum to 1

            it_equipment_energy = round(total_energy * radio_percentage * scale_factor, 2)
            cooling_energy = round(total_energy * cooling_percentage * scale_factor, 2)
            backup_power_energy = round(total_energy * backup_percentage * scale_factor, 2)
            lighting_energy = round(total_energy * lighting_percentage * scale_factor, 2)

            pue = round(random.uniform(1.58, 1.72), 2)
            cue = round(random.uniform(0.4, 0.6), 2) 
            wue = round(random.uniform(1.2, 1.48), 2)

            data.append((
                data_center_id,
                current_date.strftime("%Y-%m-%d"),
                total_energy,
                it_equipment_energy,
                cooling_energy,
                backup_power_energy,
                lighting_energy,
                pue,
                cue,
                wue
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
        statement = f"({entry[0]}, '{entry[1]}', {entry[2]}, {entry[3]}, {entry[4]}, {entry[5]}, {entry[6]}, {entry[7]}, {entry[8]}, {entry[9]})"
        statements.append(statement)
    return ",\n".join(statements)

# Parameters
num_towers = 20
start_year = 2021
end_year = 2024

# Generate data
data = generate_data_for_towers(num_towers, start_year, end_year)

# Generate SQL Insert Statement
insert_prefix = "INSERT data_center_energy_consumption (data_center_id, date, total_energy_mwh, it_energy_mwh, cooling_energy_mwh, backup_power_energy_mwh, lighting_energy_mwh, pue, cue, wue)\nSELECT * FROM (VALUES\n"
insert_data = generate_insert_statements(data)
sql_insert_statement = insert_prefix + insert_data + ") AS temp (data_center_id, date, total_energy_mwh, it_energy_mwh, cooling_energy_mwh, backup_power_energy_mwh, lighting_energy_mwh, pue, cue, wue);"

# Print the generated SQL statement
pyperclip.copy(sql_insert_statement)
print("done")