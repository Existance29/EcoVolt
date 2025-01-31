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
        if (rewardsData.length === 0) {
          // Display message if no redeemed items
          container.innerHTML = "<p>No redeemed items</p>";
          return;
        }

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

// Fetch Activity History
async function fetchActivityHistory() {
  try {
      const url = "/rewards/activity-history";
      const response = await get(url);

      if (response && response.ok) {
          const activityData = await response.json();
          console.log("Fetched activity history:", activityData);

          // Select the container for the activity history items
          const activityContainer = document.querySelector(".activity-history-container");
          if (!activityContainer) {
              console.error("Activity history container not found.");
              return; // Exit if the container is missing
          }

          // Clear previous content
          activityContainer.innerHTML = "";
          if (activityData.length === 0) {
            // Display message if no activity history
            activityContainer.innerHTML = "<p>No activity points history</p>";
            return;
          }
          // Create and append each activity history item
          activityData.forEach((activity) => {
              const activityDate = new Date(activity.datetime).toLocaleDateString();
              const activityHTML = `
                  <div class="history-item">
                      <div class="history-details">
                          <div class="icon" data-icon="ShoppingBag">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                                  <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM176,88a48,48,0,0,1-96,0,8,8,0,0,1,16,0,32,32,0,0,0,64,0,8,8,0,0,1,16,0Z"></path>
                              </svg>
                          </div>
                          <div class="details">
                              <p class="description">${activity.activity_type}</p>
                              <p class="date">${activityDate}</p>
                          </div>
                      </div>
                      <div class="points">+${activity.points_awarded.toLocaleString()} points</div>
                  </div>
              `;
              activityContainer.innerHTML += activityHTML;
          });
      } else {
          console.error("Failed to fetch activity history. Response:", response);
      }
  } catch (error) {
      console.error("Error fetching activity history:", error);
  }
}
  
  document.addEventListener("DOMContentLoaded", () => {
    fetchActivityHistory();
    fetchRewardsHistory();
});