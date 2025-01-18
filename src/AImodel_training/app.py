from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Initialize FastAPI app
app = FastAPI()

# Path to your fine-tuned model directory
MODEL_DIR = "./fine_tuned_model"  # Adjust this path if your fine-tuned model is in a different directory

# Load fine-tuned model and tokenizer
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_DIR)
except Exception as e:
    raise RuntimeError(f"Error loading model or tokenizer: {e}")

# Define a request body schema
class Query(BaseModel):
    input_text: str

@app.get("/")
def root():
    """
    Health check endpoint.
    """
    return {"message": "Fine-tuned Hugging Face Model API is running."}

@app.post("/generate")
def generate_response(query: Query):
    """
    Endpoint to generate a response using the fine-tuned model.

    Args:
        query (Query): The input text wrapped in a Pydantic model.

    Returns:
        dict: The input text and the generated response.
    """
    try:
        # Tokenize the input text
        inputs = tokenizer(query.input_text, return_tensors="pt", truncation=True, max_length=512)

        # Generate a response using the fine-tuned model
        outputs = model.generate(
            inputs.input_ids, 
            max_length=512, 
            num_beams=4, 
            early_stopping=True
        )

        # Decode the generated response
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)

        return {"input": query.input_text, "output": response}

    except Exception as e:
        # Return an HTTP 500 error with the exception details
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")