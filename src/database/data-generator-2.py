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
            2021: [[4000,4200], [56, 58]],
            2022: [[9000,10000], [47, 49]],
            2023: [[6000,7000], [40, 42]],
            2024: [[4000,5000], [35, 37]]
        },
        2: {
            2021: [[540,550], [33, 35]],
            2022: [[600,620], [30, 32]],
            2023: [[680,700], [27, 29]],
            2024: [[740,760], [23, 25]]
        },
        3: {
            2024: [[3200,3400], [28, 30]],
            2023: [[3300,3450], [24, 26]],
            2022: [[3600,3700], [21, 22]],
            2021: [[3740,3860], [17, 20]]
        },  
        4: {
            2024: [[360,380], [27, 29]],
            2023: [[380,390], [24, 26]],
            2022: [[390,410], [23, 24.5]],
            2021: [[410,430], [20, 22]]
        },  
        5: {
            2024: [[340,350], [28, 30]],
            2023: [[360,370], [26, 28]],
            2022: [[380,390], [25, 27]],
            2021: [[400,410], [23, 25]]
        },  
        6: {
            2024: [[400,430], [24, 26]],
            2023: [[440,460], [22, 23]],
            2022: [[470,480], [20, 21]],
            2021: [[490,500], [16, 18]]
        },  
        7: {
            2024: [[400,410], [30, 33]],
            2023: [[415,430], [28, 30]],
            2022: [[435,450], [27, 30]],
            2021: [[450,470], [24, 26]]
        },
        8: {
            2024: [[410,430], [34, 36]],
            2023: [[420,450], [30, 33]],
            2022: [[450,470], [28, 30]],
            2021: [[460,490], [27, 29]]
        },
        9: {
            2024: [[2600,2800], [16, 19]],
            2023: [[2700,3000], [15, 16]],
            2022: [[2900,3200], [14, 15.5]],
            2021: [[3200,3400], [13, 14]]
        },
        10: {
            2024: [[395,410], [24, 25.5]],
            2023: [[415,430], [24, 26]],
            2022: [[430,450], [22, 23]],
            2021: [[460,470], [21, 22]]
        },
        11: {
            2024: [[3000,3100], [19, 20.5]],
            2023: [[3300,3400], [18, 19]],
            2022: [[3500,3600], [16, 17.8]],
            2021: [[3800,3900], [15, 16]]
        },
        12: {
            2024: [[880,900], [20, 22]],
            2023: [[930,940], [19, 21]],
            2022: [[970,990], [18, 20]],
            2021: [[1020,1040], [17, 19]]
        },
        13: {
            2024: [[2900,3100], [20, 22]],
            2023: [[2800,2900], [19, 21]],
            2022: [[2750,2800], [18, 20]],
            2021: [[2700,2800], [17, 19]]
        },
        14: {
            2024: [[330,350], [20, 21]],
            2023: [[350,380], [19, 21]],
            2022: [[380,410], [18, 20]],
            2021: [[410,430], [17, 19]]
        },
        15: {
            2024: [[920,1000], [31, 33]],
            2023: [[980,1025], [29, 31]],
            2022: [[1000,1050], [28, 30]],
            2021: [[1000,1075], [27, 29]]
        },
        16: {
            2024: [[310,330], [24, 25.5]],
            2023: [[330,345], [22, 24]],
            2022: [[340,360], [20, 21.3]],
            2021: [[370,380], [18, 20]]
        },
        17: {
            2024: [[1000,1100], [37, 39]],
            2023: [[1000,1200], [35, 37]],
            2022: [[1150,1300], [33, 34.5]],
            2021: [[1300,1400], [31, 32.4]]
        },
        18: {
            2024: [[700,800], [40, 42]],
            2023: [[800,900], [37, 38.6]],
            2022: [[900,1000], [34, 36]],
            2021: [[1000,1100], [32, 33]]
        },
        19: {
            2024: [[650,700], [44, 46]],
            2023: [[750,800], [42, 43]],
            2022: [[850,900], [37, 39]],
            2021: [[900,1000], [34, 35.6]]
        },
        20: {
            2024: [[500,600], [48, 51]],
            2023: [[650,700], [45, 47]],
            2022: [[750,800], [42, 44]],
            2021: [[850,900], [39, 41]]
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