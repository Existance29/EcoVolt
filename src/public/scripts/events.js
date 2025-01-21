document.addEventListener("DOMContentLoaded", async () => {
    const rewardContainer = document.getElementById('reward-container');
    if (!rewardContainer) return;
  
    try {
      // Fetch the courses from the backend
      const response = await get('/course');
      const data = await response.json(); // Parse the JSON response
      console.log("Parsed data:", data);

  
      // Clear any existing content
      rewardContainer.innerHTML = "";
  
      // Loop through the fetched courses and create HTML elements
      data.forEach(course => {
        console.log(course);
        const rewardItem = document.createElement('div');
        rewardItem.className = 'reward-item';
        const imagePath = course.image_path;
  
        rewardItem.innerHTML = `
        <div class="reward-image" style="background-image: url('${imagePath}');"></div>
          <div class="reward-description">
            <p class="reward-title">${course.title}</p>
            <p class="reward-cost">Complete course for ${course.points} Points</p>
            <p class="reward-description-text">${course.description}</p>
          <button class="redeem-btn" onclick="window.location.href='courseContent.html?courseId=${course.id}'">Enroll Now</button>
          </div>
        `;
  
        rewardContainer.appendChild(rewardItem);
      });
    } catch (error) {
      rewardContainer.innerHTML = "<p>Error loading rewards. Please try again later.</p>";
    }
  });
  