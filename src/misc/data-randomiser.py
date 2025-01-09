import random
from datetime import datetime, timedelta
import pyperclip

# Function to generate random data
def generate_random_data(cell_tower_id, start_date, end_date, num_entries):
    data = []
    current_date = datetime.strptime(start_date, "%Y-%m-%d")
    end_date = datetime.strptime(end_date, "%Y-%m-%d")

    while current_date <= end_date:
        for _ in range(num_entries):
            # Generate random energy values
            total_energy = round(random.uniform(90, 150), 2)
            # Allocate percentages of total energy ensuring they sum to 100%
            radio_percentage = random.uniform(0.6, 0.7)
            cooling_percentage = random.uniform(0.2, 0.3)
            backup_percentage = random.uniform(0.03, 0.1)
            misc_percentage = random.uniform(0.01, 0.07)

            other_energy = radio_percentage + cooling_percentage + backup_percentage + misc_percentage
            scale_factor = 1 / other_energy  # Scale percentages to sum to 1

            radio_equipment_energy = round(total_energy * radio_percentage * scale_factor, 2)
            cooling_energy = round(total_energy * cooling_percentage * scale_factor, 2)
            backup_power_energy = round(total_energy * backup_percentage * scale_factor, 2)
            misc_energy = round(total_energy * misc_percentage * scale_factor, 2)

            # Calculate renewable energy (a portion of total energy)
            renewable_energy = round(random.uniform(0.4, 0.7) * total_energy, 2)

            # Carbon emissions (dependent on renewable energy share)
            carbon_emission = round(total_energy * random.uniform(0.12, 0.25), 2)

            # Append generated data as a tuple
            data.append((
                cell_tower_id,
                current_date.strftime("%Y-%m-%d"),
                total_energy,
                radio_equipment_energy,
                cooling_energy,
                backup_power_energy,
                misc_energy,
                renewable_energy,
                carbon_emission
            ))
        current_date += timedelta(days=1)

    return data

# Generate data for specific months and days
def generate_data_for_towers(num_towers, start_year, end_year):
    all_data = []

    # Loop through the last 5 months of each year
    for year in range(start_year, end_year + 1):
        for month in range(7, 11):  # August (8) to December (12)
            for day in range(1, 9):  # First 8 days of each month
                current_date = f"{year}-{month:02d}-{day:02d}"
                for tower_id in range(1, num_towers + 1):
                    tower_data = generate_random_data(tower_id, current_date, current_date, 1)
                    all_data.extend(tower_data)

    return all_data

# Insert statement generation
def generate_insert_statements(data):
    statements = []
    for entry in data:
        statement = f"({entry[0]}, '{entry[1]}', {entry[2]}, {entry[3]}, {entry[4]}, {entry[5]}, {entry[6]}, {entry[7]}, {entry[8]})"
        statements.append(statement)
    return ",\n".join(statements)

# Parameters
num_towers = 18
start_year = 2023
end_year = 2023

# Generate data
data = generate_data_for_towers(num_towers, start_year, end_year)

# Generate SQL Insert Statement
insert_prefix = "INSERT INTO cell_tower_energy_consumption (cell_tower_id, date, total_energy_kwh, radio_equipment_energy_kwh, cooling_energy_kwh, backup_power_energy_kwh, misc_energy_kwh, renewable_energy_kwh, carbon_emission_kg)\nVALUES\n"
insert_data = generate_insert_statements(data)
sql_insert_statement = insert_prefix + insert_data + ";"

# Print the generated SQL statement
pyperclip.copy(sql_insert_statement)
print("done")
