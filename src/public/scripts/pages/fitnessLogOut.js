// Ensure this script is included or imported where the "Login with Strava" button is located.

async function redirectToStravaAuth() {
    try {
        // Endpoint to generate the Strava authentication URL
        const authUrlEndpoint = '/fitness/auth';

        // Make a GET request to fetch the Strava authentication URL
        const response = await get(authUrlEndpoint);
        const data = await response.json();

        if (response.ok && data.authUrl) {
            // Redirect the user to the Strava authentication URL
            window.location.href = data.authUrl;
        } else {
            console.error("Failed to retrieve Strava authentication URL:", data);
            alert("An error occurred while connecting to Strava. Please try again later.");
        }
    } catch (error) {
        console.error("Error during Strava authentication redirect:", error);
        alert("An error occurred. Please try again.");
    }
}

// Attach the redirect function to the button's click event
document.getElementById("login-btn").addEventListener("click", redirectToStravaAuth);

