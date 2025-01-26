from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict

# Load the pre-trained model
model = joblib.load("carbon_emission_model_lr.pkl")

# Initialize FastAPI application
app = FastAPI()

# Historical data for trends (this should match the data the model was trained on)
historical_data = pd.read_csv("data/synthetic_data.csv")

# Define features that the model was trained on (same as training)
features = [
    'cell_tower_energy', 'cell_tower_radio', 'cell_tower_cooling',
    'cell_tower_backup', 'cell_tower_misc',
    'data_center_energy', 'data_center_it', 'data_center_cooling',
    'data_center_backup', 'data_center_misc', 'year', 'month_num'
]

# Define request model for input data
class PredictionRequest(BaseModel):
    num_years: int

# Prediction endpoint: Accept the number of years and return predicted emissions for that period
@app.post("/predict")
async def predict(request: PredictionRequest):
    try:
        num_years = request.num_years

        # Calculate the current year
        current_year = datetime.now().year

        # Determine the start and end year for prediction
        start_year = current_year + 1  # The first year for prediction (next year)
        end_year = start_year + num_years - 1  # The last year for prediction

        # Calculate the historical means of features for trends
        historical_means = historical_data.mean()

        # List to hold the predictions
        predictions = []

        # Generate predictions for each year in the range
        for year in range(start_year, end_year + 1):
            for month in range(1, 13):  # Loop over each month
                # Create the input data for this year and month
                prediction_data = {
                    'cell_tower_energy': historical_means['cell_tower_energy'],
                    'cell_tower_radio': historical_means['cell_tower_radio'],
                    'cell_tower_cooling': historical_means['cell_tower_cooling'],
                    'cell_tower_backup': historical_means['cell_tower_backup'],
                    'cell_tower_misc': historical_means['cell_tower_misc'],
                    'data_center_energy': historical_means['data_center_energy'],
                    'data_center_it': historical_means['data_center_it'],
                    'data_center_cooling': historical_means['data_center_cooling'],
                    'data_center_backup': historical_means['data_center_backup'],
                    'data_center_misc': historical_means['data_center_misc'],
                    'year': year,
                    'month_num': month
                }

                # Convert to DataFrame
                input_df = pd.DataFrame([prediction_data])

                # Predict emissions using the model
                predicted_emission = model.predict(input_df)

                # Add the prediction to the list
                predictions.append({
                    'year': year,
                    'month': month,
                    'predicted_emission': predicted_emission[0]
                })

        return {"predictions": predictions}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

# Run the FastAPI app with uvicorn
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4999)