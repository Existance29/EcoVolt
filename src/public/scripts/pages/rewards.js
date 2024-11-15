document.addEventListener('DOMContentLoaded', async () => {
    // Getting the user information from the storage 
    const accessToken = sessionStorage.accessToken || localStorage.accessToken;

    const payloadBase64Url = accessToken.split('.')[1];
    const payload = decodeBase64Url(payloadBase64Url);
    const user_id = payload.userId;
    const company_id = payload.companyId;
    let user_name = "";

    // Loading the summary of the user activity for easier calculation of the total points
    loadActivitySummary(user_id, company_id);

});

// Decoding base64 URL-encoded string and parsing to JSON
function decodeBase64Url(base64Url) {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded);
}

// Function to show user the summary of their interaction in the activity feed page
async function loadActivitySummary(user_id, company_id) {
    try {
        const response = await fetch('http://localhost:3000/activitySummary', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id, company_id })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const activitySummary = await response.json();

        const progressDetails = document.querySelector(".progress-details");
        progressDetails.innerHTML = ''; 
        activitySummary.activitySummary.forEach(activity => {
            const progressItem = document.createElement("div");
            progressItem.classList.add("progress-item");
            progressItem.innerHTML = `
                <span>${activity.activity_type}:</span>
                <span>${activity.activity_count} activities</span>
                <span>+${activity.points} points</span>
            `;
            progressDetails.appendChild(progressItem);
        });

        document.querySelector(".total-points span").textContent = activitySummary.totalPoints || 0;

        // Reward system to allow redeemption 
        const redeemButton = document.querySelector(".redeem-button");
        if (activitySummary.totalPoints >= 1000) {
            redeemButton.disabled = false;
            redeemButton.onclick = () => redeemReward(user_id, company_id);
        } else {
            redeemButton.disabled = true;
        }

    } catch (error) {
        console.error("Error loading user activity summary:", error);
    }
}

// Function that distribute rewards to act as a motivation for user to share and engage in social 
async function redeemReward(user_id, company_id) {
    try {
        const response = await fetch('http://localhost:3000/redeemReward', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id, company_id, reward_id: 1 })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reward = await response.json();
        alert("Reward redeemed successfully!");
        loadActivitySummary(user_id, company_id);
    } catch (error) {
        console.error("Error redeeming reward: ", error);
    }
}