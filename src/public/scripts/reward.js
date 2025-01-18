document.addEventListener("DOMContentLoaded", () => {
    // Fetch rewards data from the server
    fetchRewards();
    fetchPoints();
  });
  
  async function fetchRewards() {
    const response = await get("/rewards");
    if (!response.ok) {
      console.error("Failed to fetch rewards");
      return;
    }
    const rewards = await response.json(); // Parse the JSON response
    console.log("Fetched rewards:", rewards);
    renderRewards(rewards);
  }
  
  function renderRewards(rewards) {
    const rewardContainer = document.getElementById("reward-container");
  
    rewards.forEach((reward) => {
      // Create reward item container
      const rewardItem = document.createElement("div");
      rewardItem.classList.add("reward-item");
  
      // Add reward details
      rewardItem.innerHTML = `
        <div class="reward-image" style="background-image: url('${reward.reward_image}');"></div>
        <div class="reward-description">
          <p class="reward-title">${reward.reward_name}</p>
          <p class="reward-cost">${reward.points_required} points</p>
          <p class="reward-description-text">${reward.reward_description}</p>
          <button class="redeem-btn" onclick="redeemReward(${reward.reward_id})">Redeem</button>
        </div>
      `;
  
      // Append reward item to the container
      rewardContainer.appendChild(rewardItem);
    });
  }
  
  async function redeemReward(rewardId) {
    try {
      const response = await post("/redeem-reward", { id: rewardId });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.message); // Show success message
        fetchRewards();
        fetchPoints();
      } else {
        const error = await response.json();
        alert(error.message); // Show error message
      }
    } catch (error) {
      console.error("Error redeeming reward:", error);
      alert("An error occurred while redeeming the reward. Please try again.");
    }
  }
  
  async function fetchPoints() {
    try {
      const response = await get("/rewards/available-points");
      if (!response.ok) {
        console.error("Failed to fetch available points");
        return;
      }
      const data = await response.json();
      console.log("pts:",data);
      // Update the points value in the DOM
      const pointsValueElement = document.querySelector(".points-value");
      pointsValueElement.textContent = data.points;
    } catch (error) {
      console.error("Error fetching available points:", error);
    }
  }
  