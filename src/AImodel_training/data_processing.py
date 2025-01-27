import json
import pandas as pd

def preprocess_data(file_path):
    # Load data
    with open(file_path, "r") as file:
        raw_data = file.read()
        try:
            data = json.loads(raw_data)  # Parse JSON string
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
            return None

    # Normalize cell tower and data center data
    cell_tower_data = pd.json_normalize(data['cell_tower_energy_consumption'])
    data_center_data = pd.json_normalize(data['data_center_energy_consumption'])

    # Convert 'date' to datetime for both datasets
    cell_tower_data['date'] = pd.to_datetime(cell_tower_data['date'])
    data_center_data['date'] = pd.to_datetime(data_center_data['date'])

    # Combine datasets into a single DataFrame
    cell_tower_data['source'] = 'cell_tower'
    data_center_data['source'] = 'data_center'
    combined_data = pd.concat([cell_tower_data, data_center_data], ignore_index=True)

    # Group by month and sum numeric fields for total emissions
    numeric_columns = combined_data.select_dtypes(include='number').columns
    combined_data['month'] = combined_data['date'].dt.to_period('M')
    monthly_data = combined_data.groupby('month')[numeric_columns].sum()

    return monthly_data.reset_index()

# Preprocess and save the data
data = preprocess_data("./data/combined_data.json")
if data is not None:
    data.to_csv("./data/preprocessed_data.csv", index=False)
    print("Data preprocessing completed successfully.")
else:
    print("Data preprocessing failed.")
