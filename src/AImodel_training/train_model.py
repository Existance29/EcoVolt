import lightgbm as lgb
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler
import numpy as np

# Load preprocessed data
data = pd.read_csv("./data/preprocessed_data.csv")

# Feature engineering
features = ['total_energy_kwh', 'renewable_energy_kwh']
target = 'carbon_emission_kg'
X = data[features]
y = data[target]

# Debugging: Check data
print("Features before preprocessing:")
print(X.describe())

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# Train LightGBM model
train_data = lgb.Dataset(X_train, label=y_train)
valid_data = lgb.Dataset(X_test, label=y_test, reference=train_data)

params = {
    "objective": "regression",
    "metric": "rmse",
    "learning_rate": 0.01,
    "num_leaves": 7,
    "min_data_in_leaf": 1,
    "min_data_in_bin": 3,
    "feature_pre_filter": False,
}

# Train the model
model = lgb.train(
    params,
    train_data,
    valid_sets=[train_data, valid_data],
    valid_names=["train", "valid"],
    num_boost_round=1000
)

# Evaluate model
y_pred = model.predict(X_test, num_iteration=model.best_iteration)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
print(f"RMSE: {rmse}")

# Save the model
model.save_model("./fine_tuned_model/model.txt")