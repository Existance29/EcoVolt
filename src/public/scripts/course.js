async function loadQuizQuestions() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const courseId = urlParams.get("courseId");
      const lessonId = urlParams.get("lessonId");
  
      if (!courseId || !lessonId) {
        console.error("Missing courseId or lessonId in URL parameters.");
        return;
      }
  
      // Fetch the questions for the current lesson
      const apiEndpoint = `/lessons/question/${courseId}/${lessonId}`;
      const response = await get(apiEndpoint);
  
      if (!response.ok) {
        console.error("Failed to fetch questions:", response.statusText);
        return;
      }
  
      const questions = await response.json();
      const quizContainer = document.getElementById("quiz-container");
  
      // Store questions globally to check answers later
      window.currentQuestions = questions;
  
      questions.forEach((question) => {
        console.log(question);
        const questionHtml = `
        <div class="quiz-content quiz-item" data-question-id="${question.id}">
          <p class="question">${question.question_text}</p>
          <div class="options">
            <div class="option">
              <input type="radio" id="option-a-${question.id}" name="question-${question.id}" value="A">
              <label for="option-a-${question.id}">${question.option_a}</label>
            </div>
            <div class="option">
              <input type="radio" id="option-b-${question.id}" name="question-${question.id}" value="B">
              <label for="option-b-${question.id}">${question.option_b}</label>
            </div>
            <div class="option">
              <input type="radio" id="option-c-${question.id}" name="question-${question.id}" value="C">
              <label for="option-c-${question.id}">${question.option_c}</label>
            </div>
            <div class="option">
              <input type="radio" id="option-d-${question.id}" name="question-${question.id}" value="D">
              <label for="option-d-${question.id}">${question.option_d}</label>
            </div>
          </div>
        </div>
      `;      
        quizContainer.insertAdjacentHTML("beforeend", questionHtml);
      });
  
      // Check if there's a next lesson
      await checkForNextLesson(courseId, lessonId);
    } catch (error) {
      console.error("Error loading quiz questions:", error);
    }
  }
  async function checkForNextLesson(courseId, lessonId) {
    try {
      const nextLessonEndpoint = `/lessons/next/${courseId}/${lessonId}`;
      const response = await get(nextLessonEndpoint);
  
      if (response.status === 404) {
        console.log("404: No next lesson found.");
        const submitButton = document.getElementById("submit-quiz");
        if (submitButton) {
          submitButton.textContent = "Complete";
          submitButton.onclick = () => {
            checkAnswers(null, courseId); // Final check and handle course completion
          };
        } else {
          console.error("Submit button with id 'submit-quiz' not found.");
        }
        return; // Exit the function if it's a 404
      }
  
      if (!response.ok) {
        console.error(`Failed to check next lesson. Status: ${response.statusText}`);
        return;
      }
  
      const nextLesson = await response.json();
      const submitButton = document.getElementById("submit-quiz");
  
      if (nextLesson && nextLesson.id) {
        // Next lesson exists
        console.log("Next lesson found:", nextLesson);
        if (submitButton) {
          submitButton.textContent = "Next";
          submitButton.onclick = () => {
            checkAnswers(nextLesson.id, courseId);
          };
        }
      } else {
        // No next lesson (unexpected scenario if 404 is handled)
        console.log("No next lesson found, updating button text to 'Complete'.");
        if (submitButton) {
          submitButton.textContent = "Complete";
          submitButton.onclick = () => {
            checkAnswers(null, courseId); // Final check and handle course completion
          };
        }
      }
    } catch (error) {
      console.error("Error checking for the next lesson:", error);
    }
  }
  
  
  function checkAnswers(nextLessonId, courseId) {
    const selectedAnswers = {};
    const questions = window.currentQuestions;
  
    questions.forEach((question) => {
      const selectedOption = document.querySelector(`input[name="question-${question.id}"]:checked`);
      if (selectedOption) {
        selectedAnswers[question.id] = selectedOption.value;
      } else {
        console.warn(`No answer selected for question ID ${question.id}`);
      }
    });
  
    // Compare selected answers with correct answers
    let allCorrect = true;
    questions.forEach((question) => {
      const userAnswer = selectedAnswers[question.id];
      if (userAnswer !== question.correct_option) {
        allCorrect = false;
        console.warn(`Incorrect answer for question ID ${question.id}`);
      }
    });
  
    if (allCorrect) {
      alert("All answers are correct! Proceeding...");
      if (nextLessonId) {
        // Redirect to the next lesson
        window.location.href = `course.html?courseId=${courseId}&lessonId=${nextLessonId}`;
      } else {
        // Handle course completion
        alert("Congratulations! You have completed the course.");
        window.location.href = `courseCompletion.html?courseId=${courseId}`;
      }
    } else {
      alert("Some answers are incorrect. Please review and try again.");
    }
  }
  
  async function loadKeyConcepts() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const lesson_id = urlParams.get("lessonId"); // Get lessonId from URL query
      console.log("lesson id ",lesson_id);
  
      if (!lesson_id) {
        console.error("Missing lessonId in URL parameters.");
        return;
      }
  
      // Fetch key concepts for the lesson
      const apiEndpoint = `/lessons/key-concept/${lesson_id}`;
      const response = await get(apiEndpoint);
  
      if (!response.ok) {
        console.error("Failed to fetch key concepts:", response.statusText);
        return;
      }
  
      const keyConcepts = await response.json();
  
      // Populate the content dynamically
      keyConcepts.forEach((concept, index) => {
        const titleElement = document.getElementById(`concept-title-${index + 1}`);
        const descriptionElement = document.getElementById(`concept-description-${index + 1}`);
  
        if (titleElement && descriptionElement) {
          titleElement.textContent = concept.title; // Set the title
          descriptionElement.textContent = concept.description; // Set the description
        } else {
          console.warn(`Key concept elements for index ${index + 1} not found.`);
        }
      });
    } catch (error) {
      console.error("Error loading key concepts:", error);
    }
  }
  
  
  async function loadVideoLink() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const courseId = urlParams.get("courseId");
      const lessonId = urlParams.get("lessonId");
  
      if (!courseId || !lessonId) {
        console.error("Missing courseId or lessonId in URL parameters.");
        return;
      }
  
      // Fetch the video link for the current lesson
      const apiEndpoint = `/lessons/video-link/${courseId}/${lessonId}`;
      const response = await get(apiEndpoint);
  
      if (!response.ok) {
        console.error("Failed to fetch video link:", response.statusText);
        return;
      }
  
      const data = await response.json();
      console.log(data);
      const videoLink = data[0].video_link;
  
      if (!videoLink) {
        console.warn("No video link found for this lesson.");
        return;
      }
  
      // Embed the video in the video overlay
      const videoOverlay = document.querySelector(".video-overlay");
      if (videoOverlay) {
        videoOverlay.innerHTML = `
          <iframe
            class="youtube-video"
            src="${videoLink.replace("watch?v=", "embed/")}"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        `;
      } else {
        console.error("Video overlay not found in the DOM.");
      }
    } catch (error) {
      console.error("Error loading video link:", error);
    }
  }
  
  async function loadLessonContent() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const courseId = urlParams.get("courseId");
      const lessonId = urlParams.get("lessonId");
  
      if (!courseId || !lessonId) {
        console.error("Missing courseId or lessonId in URL parameters.");
        return;
      }
  
      // Fetch the lesson content (title, video link, description) for the current lesson
      const apiEndpoint = `/lessons/video-link/${courseId}/${lessonId}`;
      const response = await get(apiEndpoint);
  
      if (!response.ok) {
        console.error("Failed to fetch lesson data:", response.statusText);
        return;
      }
  
      const data = await response.json();
      console.log(data);
  
      // Update the video link
      const videoLink = data[0].video_link;
      if (videoLink) {
        const videoOverlay = document.querySelector(".video-overlay");
        if (videoOverlay) {
          videoOverlay.innerHTML = `
            <iframe
              class="youtube-video"
              src="${videoLink.replace("watch?v=", "embed/")}"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          `;
        } else {
          console.error("Video overlay not found in the DOM.");
        }
      } else {
        console.warn("No video link found for this lesson.");
      }
  
      // Update the lesson description
      const lessonDescription = data[0].content; // Assuming 'content' contains the description
      if (lessonDescription) {
        const descriptionElement = document.querySelector(".lesson-description");
        if (descriptionElement) {
          descriptionElement.textContent = lessonDescription;
        } else {
          console.error("Lesson description element not found in the DOM.");
        }
      } else {
        console.warn("No lesson description found for this lesson.");
      }
  
      // Update the lesson title
      const lessonTitle = data[0].title; // Assuming 'title' contains the lesson title
      if (lessonTitle) {
        const titleElement = document.querySelector(".lesson-title p");
        if (titleElement) {
          titleElement.textContent = lessonTitle;
        } else {
          console.error("Lesson title element not found in the DOM.");
        }
      } else {
        console.warn("No lesson title found for this lesson.");
      }
    } catch (error) {
      console.error("Error loading lesson content:", error);
    }
  }
  

  async function loadProgress() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const courseId = urlParams.get("courseId");
      const currentLessonId = parseInt(urlParams.get("lessonId"), 10);
  
      if (!courseId || isNaN(currentLessonId)) {
        console.error("Missing courseId or invalid lessonId in URL parameters.");
        return;
      }
  
      // Fetch the total number of lessons for the course
      const apiEndpoint = `/lessons/lesson-count/${courseId}`;
      const response = await get(apiEndpoint);
  
      if (!response.ok) {
        console.error("Failed to fetch lesson count:", response.statusText);
        return;
      }
  
      const data = await response.json();
      const totalLessons = data[0].lesson_count; // Assuming the response contains a 'total_lessons' key
  
      if (!totalLessons || totalLessons < 1) {
        console.warn("Invalid total lessons count.");
        return;
      }
  
      // Calculate the progress percentage
      const progressPercentage = Math.min((currentLessonId / totalLessons) * 100, 100);
  
      // Update the progress bar and text
      const progressTextElement = document.querySelector(".progress-text");
      const progressFillElement = document.querySelector(".progress-fill");
  
      if (progressTextElement) {
        progressTextElement.textContent = `${progressPercentage.toFixed(0)}% completed`;
      }
  
      if (progressFillElement) {
        progressFillElement.style.width = `${progressPercentage}%`;
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  }
  

  
  
  document.addEventListener("DOMContentLoaded", () => {
    loadQuizQuestions(); // Call the function to load quiz questions
    loadKeyConcepts();   // Call the function to load key concepts
    loadVideoLink();     // Call the function to load the video link
    loadLessonContent();
    loadProgress();
  });
  