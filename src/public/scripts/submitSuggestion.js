document.addEventListener("DOMContentLoaded", () => {
    const submitButton = document.querySelector(".submit-button");
    const titleInput = document.querySelector(".form-input");
    const suggestionInput = document.querySelector(".form-input-2");
  
    submitButton.addEventListener("click", async (event) => {
      event.preventDefault(); // Prevent default form submission
  
      // Get the title and suggestion text from the input fields
      const title = titleInput.value.trim();
      const suggestion_text = suggestionInput.value.trim();
  
      // Validate the inputs
      if (!title || !suggestion_text) {
        alert("Please fill in both the title and actionable idea fields.");
        return;
      }
  
      // Get the company ID
      const company_id = getCompanyId();
  
      if (!company_id) {
        alert("Company ID is missing. Please log in again.");
        return;
      }
  
      // Construct the request payload
      const payload = { title, suggestion_text };
  
      try {
        // Send the data to the server
        const response = await post(`/submit-suggesiton/${company_id}`, payload);
  
        if (response.ok) {
          alert("Suggestion submitted successfully! Redirecting you back to Events Page...");
          window.location.href = "events.html";
          titleInput.value = "";
          suggestionInput.value = "";
        } else {
          const errorData = await response.json();
          alert(`Failed to submit suggestion: ${errorData.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error submitting suggestion:", error);
        alert("An error occurred while submitting the suggestion. Please try again.");
      }
    });
  });
  