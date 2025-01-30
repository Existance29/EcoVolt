document.addEventListener("DOMContentLoaded", () => {
    // Fetch rewards data from the server
    fetchRewards();
    fetchPoints();
    fetchCompletedCourses();
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
  

  async function fetchCompletedCourses() {
    const url = '/profile/completed-courses'; // API endpoint to fetch completed courses

    try {
        const response = await get(url); // Use your `get` helper function to make a GET request

        if (response.status === 200) {
            const courses = await response.json(); // Parse the response JSON
            console.log("Completed Courses:", courses);

            const coursesSection = document.getElementById("courses");
            coursesSection.innerHTML = ""; // Clear existing content

            if (courses.length === 0) {
                // If no courses are found, show a default message
                coursesSection.innerHTML = "User has not completed any courses";
                return;
            }

            // Dynamically populate completed courses
            courses.forEach(course => {
                const courseElement = document.createElement("div");
                courseElement.classList.add("course");

                const completedDate = course.completed_at && course.completed_at !== "In Progress"
                ? new Date(course.completed_at).toLocaleDateString('en-GB')
                : "In Progress";
                
                courseElement.innerHTML = `
<div class="completed-course-card">
    <div class="completed-course-image-container">
        <img src="${course.image_path}" alt="${course.title}" class="completed-course-image">
    </div>
    <div class="completed-course-details">
        <h3 class="completed-course-title">${course.title}</h3>
        <p class="completed-course-description">${course.description}</p>
        <p class="completed-course-points"><strong>Points For Completion:</strong> ${course.points}</p>
        <p class="completed-course-completed-at"><strong>Completed At:</strong> ${completedDate}</p>
    </div>
</div>

                `;

                coursesSection.appendChild(courseElement);
            });
        } else {
            console.error("Error fetching completed courses:", response.status);
            document.getElementById("courses").innerHTML = "User has no completed courses.";
        }
    } catch (error) {
        console.error("Error fetching completed courses:", error);
        document.getElementById("courses").innerHTML = "An error occurred while fetching completed courses.";
    }
}
