// Function to fetch course details for the content page
async function fetchCourseContent(courseId) {
  const url = `/courses/${courseId}`;
  try {
      const response = await get(url);
      if (!response.ok) {
          throw new Error(`Failed to fetch course content. Status: ${response.status}`);
      }
      const courseContent = await response.json();
      return courseContent;
  } catch (error) {
      console.error("Error fetching course content:", error);
      throw error;
  }
}

// Function to fetch user progress for the course content page
async function fetchUserProgress(courseId) {
  const url = `/courses/check-progress/${courseId}`;
  try {
      const response = await get(url);
      if (!response.ok) {
          throw new Error(`Failed to fetch user progress. Status: ${response.status}`);
      }
      const progressData = await response.json();
      return progressData;
  } catch (error) {
      console.error("Error fetching user progress:", error);
      throw error;
  }
}

// Unified function to get both course content and user progress
async function fetchCourseData() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("courseId");

  if (!courseId) {
      console.error("Course ID is missing from the URL parameters.");
      return;
  }

  try {
      const [courseContent, userProgress] = await Promise.all([
          fetchCourseContent(courseId),
          fetchUserProgress(courseId)
      ]);

      console.log("Course Content:", courseContent);
      console.log("User Progress:", userProgress);

      return { courseContent, userProgress };
  } catch (error) {
      console.error("Error fetching course data:", error);
      throw error;
  }
}

function updateCourseContent(courseContentArray) {
    if (!courseContentArray || courseContentArray.length === 0) {
      console.error("No course content found.");
      return;
    }
  
    // Extract course details from the first object
    const courseDetails = {
      course_id: courseContentArray[0].course_id,
      course_title: courseContentArray[0].course_title,
      course_description: courseContentArray[0].course_description,
      course_image_path: courseContentArray[0].course_image_path,
    };
  
    // Update the course intro section
    const courseImageElement = document.getElementById("course-image");
    const courseTitleElement = document.getElementById("course-title");
    const courseDescriptionElement = document.getElementById("course-description");
  
    courseImageElement.style.backgroundImage = `url('${courseDetails.course_image_path || ''}')`;
    courseTitleElement.textContent = courseDetails.course_title || "Course Title";
    courseDescriptionElement.textContent =
      courseDetails.course_description || "Course description will appear here.";
  
    // Extract lessons from the array
    const lessons = courseContentArray.map((item) => ({
      lesson_id: item.lesson_id,
      lesson_title: item.lesson_title,
      lesson_content: item.lesson_content,
      lesson_duration: item.lesson_duration,
      lesson_position: item.lesson_position,
      lesson_video_link: item.lesson_video_link,
    }));
  
    // Populate the lessons list
    const lessonsListElement = document.getElementById("lessons-list");
    lessonsListElement.innerHTML = ""; // Clear any existing content
  
    if (lessons.length > 0) {
      lessons.forEach((lesson, index) => {
        // Create a container for each lesson
        const lessonElement = document.createElement("div");
        lessonElement.className = "lesson-item";
  
        // Render lesson details dynamically
        lessonElement.innerHTML = `
          <div class="lesson-details">
            <p class="lesson-title">${lesson.lesson_title || "Lesson Title"}</p>
            <p class="lesson-description">${lesson.lesson_content || "Lesson content will appear here."}</p>
          </div>
          <div class="lesson-action">
            <p class="lesson-duration">${lesson.lesson_duration || "Not available"}</p>
          </div>
        `;
  
        // Append the lesson to the list
        lessonsListElement.appendChild(lessonElement);
      });
    } else {
      lessonsListElement.innerHTML = "<p>No lessons available for this course.</p>";
    }
  }
  
  

function updateUserProgress(progress) {
  const progressPercentage = progress.progressPercentage;
  const progressContainerElement = document.querySelector(".progress-container");
  const progressTextElement = document.querySelector(".progress-text");
  const progressFillElement = document.querySelector(".progress-fill");
  const startButtonElement = document.getElementById("start-button");

  // Handle invalid progress data
  if (progressPercentage == null || isNaN(progressPercentage) || progressPercentage < 0 || progressPercentage > 100) {
      if (progressContainerElement) progressContainerElement.style.display = "none";
      setupStartButton("Start Course", redirectToStartOrResumeLesson);
      return;
  }
  // Update progress bar and button text
  progressTextElement.textContent = `${progressPercentage}% completed`;
  progressFillElement.style.width = `${progressPercentage}%`;

  if (progressPercentage === 100) {
      startButtonElement.style.display = "none"; // Hide button for completed courses
  } else if (progressPercentage > 0) {
      setupStartButton("Resume Course", redirectToStartOrResumeLesson, false);
  } else {
      setupStartButton("Start Course", redirectToStartOrResumeLesson, true);
  }

  if (progressContainerElement) progressContainerElement.style.display = "block";
}

function setupStartButton(text, onClickAction, isStart) {
    const startButtonElement = document.getElementById("start-button");
    if (startButtonElement) {
        startButtonElement.style.display = "block";
        startButtonElement.textContent = text;
        startButtonElement.onclick = () => onClickAction(isStart);
    }
}

async function redirectToStartOrResumeLesson(isStart) {
  const courseId = new URLSearchParams(window.location.search).get("courseId");
  if (!courseId) {
      console.error("Course ID is missing from the URL parameters.");
      return;
  }

  try {
    if (isStart) {
        // Send a POST request to start the course
        const startResponse = await post('/courses/start', { course_id: parseInt(courseId) });

        if (!startResponse.ok) {
            throw new Error(`Failed to start the course. Status: ${startResponse.status}`);
        }

        const startData = await startResponse.json();
        console.log("Course started successfully:", startData);
    }


      const response = await get(`/courses/${courseId}/last-lesson`);

      if (!response.ok) {
          throw new Error("Failed to fetch the last lesson.");
      }

      const data = await response.json();
      if (data.success && data.lesson) {
          const lessonId = data.lesson.lesson_id;
          window.location.href = `course.html?course_id=${courseId}&lesson_id=${lessonId}`;
      } else {
          console.error("No last lesson data available.");
      }
  } catch (error) {
      console.error("Error redirecting to the last lesson:", error);
  }
}


async function loadCoursePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("courseId");

  if (!courseId) {
      console.error("Course ID is missing from the URL parameters.");
      return;
  }

  try {
      const courseContent = await fetchCourseContent(courseId);
      updateCourseContent(courseContent);
  } catch (error) {
      console.error("Failed to load the course page:", error);
  }
}

async function loadUserProgress() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("courseId");

  if (!courseId) {
      console.error("Course ID is missing from the URL parameters.");
      return;
  }

  try {
      const userProgress = await fetchUserProgress(courseId);
      updateUserProgress(userProgress);
  } catch (error) {
      console.error("Failed to load user progress:", error);
  }
}


document.addEventListener("DOMContentLoaded", () => {
  loadCoursePage();   // Load course content
  loadUserProgress(); // Load user progress
});
