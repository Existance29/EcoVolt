import lightgbm as lgb
import pandas as pd
import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

# Load the trained model
model = lgb.Booster(model_file="./fine_tuned_model/model.txt")

# Load the scaler (if it was used during training)
try:
    scaler = joblib.load('./fine_tuned_model/scaler.pkl')
except FileNotFoundError:
    raise Exception("Scaler file not found. Please ensure the scaler is saved during training.")

# Load the dataset
data = pd.read_csv("data/synthetic_data.csv")

# Feature engineering (same as during training)
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

# Test data split (same as during training)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale the features using the same scaler (if scaling was done during training)
X_test_scaled = scaler.transform(X_test)

# Predict using the trained LightGBM model
y_pred = model.predict(X_test_scaled)

# Evaluate the model
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
print(f"RMSE: {rmse}")

# Optionally, you can save the predictions to a CSV file for further analysis
predictions_df = pd.DataFrame({
    'Actual': y_test,
    'Predicted': y_pred
})
predictions_df.to_csv("predictions.csv", index=False)
print("Predictions saved to 'predictions.csv'.")