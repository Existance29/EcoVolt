import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import joblib
import numpy as np

# Load the dataset
data = pd.read_csv("data/synthetic_data.csv")

# Feature engineering
data['month'] = pd.to_datetime(data['month'], format='%Y-%m')
data['year'] = data['month'].dt.year
data['month_num'] = data['month'].dt.month

# Define features (X) and target (y)
features = [
    'cell_tower_energy', 'cell_tower_radio', 'cell_tower_cooling',
    'cell_tower_backup', 'cell_tower_misc',
    'data_center_energy', 'data_center_it', 'data_center_cooling',
    'data_center_backup', 'data_center_misc', 'year', 'month_num'
]
target = 'total_emission'

X = data[features]
y = data[target]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the Linear Regression model
model = LinearRegression()
model.fit(X_train, y_train)

# Evaluate the model
y_pred = model.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
print(f"RMSE: {rmse}")

# Save the model
joblib.dump(model, "carbon_emission_model_lr.pkl")
print("Model saved as 'carbon_emission_model_lr.pkl'")