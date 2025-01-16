import lightgbm as lgb
import pandas as pd

# Load model
model = lgb.Booster(model_file="./fine_tuned_model/model.txt")

# Test input function
def test_model(test_data):
    """
    Test the model with new data.

    Args:
        test_data (dict): Dictionary containing 'total_energy_kwh' and 'renewable_energy_kwh'.

    Returns:
        list: Predicted carbon emission in kg.
    """
    # Convert input dictionary to DataFrame
    test_df = pd.DataFrame(test_data)
    
    # Ensure the order of columns matches the training data
    feature_order = ['total_energy_kwh', 'renewable_energy_kwh']
    test_df = test_df[feature_order]

    # Predict using the trained model
    prediction = model.predict(test_df)
    return prediction

# Example input
example_input = {
    "total_energy_kwh": [29555.31],  # Use realistic values for your data range
    "renewable_energy_kwh": [16046.86],
}

# Run prediction
prediction = test_model(example_input)
print("Prediction (carbon_emission_kg):", prediction)