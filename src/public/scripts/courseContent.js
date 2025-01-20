// Async function to retrieve lessons
async function fetchLessons(courseId) {
    try {
      // Use the custom get function to fetch lessons from the backend
      const response = await get(`/lessons/${courseId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch lessons: ${response.status}`);
      }
  
      const lessons = await response.json();
      console.log("Fetched lessons:", lessons);
  
      return lessons;
    } catch (error) {
      console.error("Error fetching lessons:", error);
      throw error; // Re-throw the error to handle it in the caller
    }
  }
  
  // Populate lessons in the DOM
  function populateLessons(lessons) {
    const lessonsList = document.getElementById('lessons-list');
    lessons.forEach(lesson => {
      const lessonItem = document.createElement('article');
      lessonItem.className = 'lesson-item';
      lessonItem.innerHTML = `
        <div class="lesson-details">
          <div class="icon"></div>
          <div>
            <p class="lesson-title">${lesson.title}</p>
            <p class="lesson-description">${lesson.content}</p>
          </div>
        </div>
        <p class="lesson-duration">${lesson.duration}</p>
      `;
      lessonsList.appendChild(lessonItem);
    });
  }
  
  // Async function to fetch course details
async function fetchCourseDetails(courseId) {
    try {
      // Use the custom get function to fetch the course details
      const response = await get(`/course/${courseId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch course details: ${response.status}`);
      }
  
      const course = await response.json();
      console.log("Fetched course details:", course);
  
      return course[0];
    } catch (error) {
      console.error("Error fetching course details:", error);
      throw error; // Re-throw the error to handle it in the caller
    }
  }
  
  // Populate the intro section dynamically
  function populateIntroSection(course) {
    const courseImage = document.getElementById('course-image');
    const courseTitle = document.getElementById('course-title');
    const courseDescription = document.getElementById('course-description');
    const startButton = document.getElementById('start-button');
  
    // Update the elements with the fetched course data
    courseImage.style.backgroundImage = `url('${course.image_path}')`;
    courseTitle.textContent = course.title;
    courseDescription.textContent = course.description;
  
    // Add event listener for Start button
    startButton.addEventListener('click', async () => {
      try {
        // Fetch lessons for the course to determine the first lesson ID
        const lessons = await fetchLessons(course.id);
  
        if (lessons && lessons.length > 0) {
          const firstLessonId = lessons[0].id; // Get the first lesson ID
          // Redirect to course.html with courseId and firstLessonId
          window.location.href = `course.html?courseId=${course.id}&lessonId=${firstLessonId}`;
        } else {
          console.error("No lessons found for this course.");
          alert("This course does not have any lessons available.");
        }
      } catch (error) {
        console.error("Error determining the first lesson:", error);
        alert("Unable to start the course. Please try again later.");
      }
    });
  }
  

  // Main function to initialize the page
  async function initializePage() {
    const courseId = new URLSearchParams(window.location.search).get('courseId');
    if (!courseId) {
      console.error("No course ID provided in the URL.");
      return;
    }
  
    console.log("Course ID detected:", courseId);
  
    try {
    // Fetch course details and populate the intro section
    const course = await fetchCourseDetails(courseId);
    // Check if the user has taken the course
    const isTaken = await checkCourseCompletion(course.title);
    if (isTaken) {
        console.log("Course has already been completed.");
        document.getElementById("start-button").style.display = "none"; // Hide the button
    }
    populateIntroSection(course);

    // Fetch lessons and populate them dynamically
    const lessons = await fetchLessons(courseId);
    populateLessons(lessons);
    } catch (error) {
      console.error("Error initializing the page:", error);
    }
  }
  
  // Add event listener to initialize the page
  document.addEventListener("DOMContentLoaded", initializePage);
  
  async function checkCourseCompletion(courseTitle) {
    const activityType = `Completed ${courseTitle}`; // Format the activity type

    try {
        const response = await post("/course/isTaken", { activityType });
        if (!response.ok) {
            throw new Error(`Failed to check course completion: ${response.status}`);
        }

        const { isTaken } = await response.json(); // Parse the response
        return isTaken; // Return true/false
    } catch (error) {
        console.error("Error checking course completion:", error);
        throw error; // Re-throw the error for the caller
    }
}
