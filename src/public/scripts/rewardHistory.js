async function fetchRewardsHistory() {
    try {
      const url = "/rewards-history";
      const response = await get(url);
  
      if (response && response.ok) {
        const rewardsData = await response.json();
        console.log("Fetched rewards:", rewardsData);
  
        // Update to the new ID
        const container = document.getElementById("redeemed-items");
        if (!container) {
          console.error("redeemed-items element not found.");
          return; // Exit if the container is missing
        }
  
        container.innerHTML = ""; // Clear previous content
  
        rewardsData.forEach((reward) => {
          if (!reward.reward_name || !reward.points_spent || !reward.reward_image) {
            console.error("Invalid reward format:", reward);
            return;
          }
  
          const rewardHTML = `
                <div class="redeemed-item">
                  <div class="redeemed-image" style="background-image: url('${reward.reward_image}');"></div>
                  <div class="redeemed-details">
                    <div class="redeemed-info">
                      <p class="redeemed-name">${reward.reward_name}</p>
                      <p class="redeemed-description">${reward.reward_description}</p>
                      <p class="redeemed-date">Redeemed on: ${new Date(reward.redemption_date).toLocaleDateString()}</p>
                    </div>
                    <div class="redeemed-spent">-${reward.points_spent} points</div>
                  </div>
                </div>
          `;
          container.innerHTML += rewardHTML;
        });
      } else {
        console.error("Failed to fetch rewards history. Response:", response);
      }
    } catch (error) {
      console.error("Error fetching rewards history:", error);
    }
  }
  
  // Ensure the function runs after the DOM is fully loaded
  document.addEventListener("DOMContentLoaded", fetchRewardsHistory);
  