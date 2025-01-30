async function fetchLessonDetails(courseId, lessonId) {
  const endpoint = `/lesson/${courseId}/${lessonId}`;
  try {
    const response = await get(endpoint);

    if (!response.ok) {
      throw new Error(`Failed to fetch lesson details. Status: ${response.status}`);
    }

    const lessonData = await response.json();
    return lessonData; // Return the data for further processing
  } catch (error) {
    console.error("Error fetching lesson details:", error);
    return null;
  }
}

async function fetchUserProgress(courseId) {
  const endpoint = `/courses/check-progress/${courseId}`;
  try {
    const response = await get(endpoint);

    if (!response.ok) {
      throw new Error(`Failed to fetch user progress. Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      return data.progressPercentage;
    } else {
      throw new Error("Failed to fetch user progress.");
    }
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return 0; // Default to 0% if there's an error
  }
}

function updateProgressBar(progressPercentage) {
  const progressText = document.querySelector(".progress-text");
  const progressFill = document.querySelector(".progress-fill");

  // Update the progress text and fill width
  progressText.textContent = `${progressPercentage}% completed`;
  progressFill.style.width = `${progressPercentage}%`;

  // Handle edge cases (e.g., 0% or 100%)
  if (progressPercentage === 0) {
    progressText.textContent = "You are just starting the course. Let's begin with the first lesson!";
  } else if (progressPercentage === 100) {
    progressText.textContent = "Congratulations! You've completed this course.";
  }
}

function populateVideoSection(videoLink) {
  const videoOverlay = document.querySelector(".video-overlay");

  if (!videoLink) {
    console.error("Video link is missing.");
    videoOverlay.innerHTML = "<p>No video available for this lesson.</p>";
    return;
  }

  // Replace 'watch?v=' with 'embed/' for YouTube links
  const embedLink = videoLink.replace("watch?v=", "embed/");

  // Insert the iframe dynamically into the video-overlay div
  videoOverlay.innerHTML = `
    <iframe
      class="youtube-video"
      src="${embedLink}"
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>`;
}

function populateLessonDescription(description) {
  const lessonDescription = document.querySelector(".lesson-description");
  if (!description) {
    lessonDescription.textContent = "No description available for this lesson.";
    return;
  }
  lessonDescription.textContent = description;
}

function populateKeyConcepts(keyConcepts) {
  keyConcepts.forEach((concept, index) => {
    const titleElement = document.getElementById(`concept-title-${index + 1}`);
    const descriptionElement = document.getElementById(`concept-description-${index + 1}`);

    if (titleElement && descriptionElement) {
      titleElement.textContent = concept.concept_title || `Concept Title ${index + 1}`;
      descriptionElement.textContent = concept.concept_description || "Description not available.";
    }
  });
}

function populateMiniQuiz(questions) {
  const quizContainer = document.getElementById("quiz-container");
  quizContainer.innerHTML = ""; // Clear any existing content

  if (!questions || questions.length === 0) {
    quizContainer.innerHTML = "<p>No quiz available for this lesson.</p>";
    return;
  }

  questions.forEach((question) => {
    console.log(question.question_correct_option);
    const questionHtml = `
      <div class="quiz-content quiz-item" data-question-id="${question.question_id}">
        <p class="question"><strong>${question.question_text}</strong></p>
        <div class="options">
          <div class="option">
            <input type="radio" id="option-a-${question.question_id}" name="question-${question.question_id}" value="A">
            <label for="option-a-${question.question_id}">${question.question_option_a}</label>
          </div>
          <div class="option">
            <input type="radio" id="option-b-${question.question_id}" name="question-${question.question_id}" value="B">
            <label for="option-b-${question.question_id}">${question.question_option_b}</label>
          </div>
          <div class="option">
            <input type="radio" id="option-c-${question.question_id}" name="question-${question.question_id}" value="C">
            <label for="option-c-${question.question_id}">${question.question_option_c}</label>
          </div>
          <div class="option">
            <input type="radio" id="option-d-${question.question_id}" name="question-${question.question_id}" value="D">
            <label for="option-d-${question.question_id}">${question.question_option_d}</label>
          </div>
        </div>
      </div>`;
    quizContainer.innerHTML += questionHtml;
  });
}

function evaluateQuiz(questions) {
  let score = 0; // Track the number of correct answers
  const incorrectQuestions = []; // Track incorrect questions

  questions.forEach((question) => {
    const selectedOption = document.querySelector(`input[name="question-${question.question_id}"]:checked`);
    const quizItem = document.querySelector(`.quiz-item[data-question-id="${question.question_id}"]`);

    // Remove existing feedback classes
    quizItem.classList.remove("correct", "wrong");

    if (!selectedOption || selectedOption.value !== question.question_correct_option) {
      // Mark incorrect questions
      quizItem.classList.add("wrong");
      incorrectQuestions.push({
        questionText: question.question_text,
        correctAnswer: question[`question_option_${question.question_correct_option.toLowerCase()}`],
      });
    } else {
      // Mark correct answers
      quizItem.classList.add("correct");
      score++; // Increment score for correct answers
    }
  });

  return { score, incorrectQuestions }; // Return score and incorrect questions
}


async function handleQuizSubmission(courseId, lessonId, questions) {
  // Evaluate quiz answers
  const { score, incorrectQuestions } = evaluateQuiz(questions);
  const totalQuestions = questions.length;
  const feedbackMessage = `You scored ${score} out of ${totalQuestions}.`;

  if (incorrectQuestions.length > 0) {
    // Display popup for incorrect answers
    const incorrectDetails = incorrectQuestions
      .map(
        (item, index) => `
        <div class="popup-card incorrect-card">
          <p><strong>Question ${index + 1}:</strong></p>
          <p>${item.questionText}</p>
          <p><strong>Correct Answer:</strong> ${item.correctAnswer}</p>
        </div>`
      )
      .join("");

    showPopup({
      title: "Some answers are incorrect!",
      message: `
        <p>${feedbackMessage}</p>
        <div class="incorrect-questions">${incorrectDetails}</div>
      `,
      buttons: [
        {
          text: "Try Again",
          action: () => {
            closePopup();
            resetQuiz(questions);
          },
        },
      ],
    });
    return;
  }

  // Display popup for correct answers
  showPopup({
    title: "All answers are correct!",
    message: `<p>Congratulations! ${feedbackMessage}</p>`,
    buttons: [
      {
        text: "Submit Progress",
        action: async () => {
          closePopup();
          try {
            const response = await post(`/lessons/${courseId}/${lessonId}/progress`, {});
            if (!response.ok) {
              throw new Error("Failed to update progress.");
            }

            const data = await response.json();
            if (data.success) {
              showPopup({
                title: "Progress Updated!",
                message: `<p>Your progress has been updated successfully.</p>`,
                buttons: [
                  {
                    text: "Close",
                    action: () => closePopup(),
                  },
                ],
              });
            } else {
              showPopup({
                title: "Update Failed",
                message: `<p>Failed to update progress. Please try again.</p>`,
                buttons: [
                  {
                    text: "Retry",
                    action: () => closePopup(),
                  },
                ],
              });
            }
          } catch (error) {
            console.error("Error updating progress:", error);
            showPopup({
              title: "Error",
              message: `<p>An error occurred while updating your progress. Please try again later.</p>`,
              buttons: [
                {
                  text: "Close",
                  action: () => closePopup(),
                },
              ],
            });
          }
        },
      },
    ],
  });
}


function showPopup({ title, message, buttons }) {
  // Create the popup overlay
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  // Create the popup container
  const popup = document.createElement("div");
  popup.className = "popup";

  // Add title
  const popupTitle = document.createElement("h2");
  popupTitle.textContent = title;
  popup.appendChild(popupTitle);

  // Add message
  const popupMessage = document.createElement("div");
  popupMessage.innerHTML = message; // Allow for HTML in the message
  popup.appendChild(popupMessage);

  // Add buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "popup-buttons";
  buttons.forEach((buttonConfig) => {
    const button = document.createElement("button");
    button.textContent = buttonConfig.text;
    button.addEventListener("click", buttonConfig.action);
    buttonContainer.appendChild(button);
  });
  popup.appendChild(buttonContainer);

  // Append popup and overlay to the body
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
}

function closePopup() {
  const overlay = document.querySelector(".popup-overlay");
  const popup = document.querySelector(".popup");
  if (overlay) overlay.remove();
  if (popup) popup.remove();
}


function resetQuiz(questions) {
  questions.forEach((question) => {
    const quizItem = document.querySelector(`.quiz-item[data-question-id="${question.question_id}"]`);
    const selectedOption = document.querySelector(`input[name="question-${question.question_id}"]:checked`);

    // Uncheck any selected option
    if (selectedOption) selectedOption.checked = false;

    // Remove feedback classes
    quizItem.classList.remove("correct", "wrong");
  });
}

async function checkNextLesson(courseId, nextLessonId) {
  const endpoint = `/lesson/${courseId}/${nextLessonId}`;
  try {
    const response = await get(endpoint);

    if (!response.ok) {
      if (response.status === 404) {
        return false; // No next lesson exists
      }
      throw new Error("Failed to fetch next lesson details.");
    }

    const lessonData = await response.json();
    return !!lessonData; // Return true if lesson data exists
  } catch (error) {
    console.error("Error checking next lesson:", error);
    return false;
  }
}


document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("course_id");
  const lessonId = urlParams.get("lesson_id");

  if (!courseId || !lessonId) {
    console.error("Course ID or Lesson ID is missing from the URL.");
    return;
  }

  const lessonData = await fetchLessonDetails(courseId, lessonId);

  if (lessonData) {
    // Populate all sections
    populateVideoSection(lessonData.lesson_video_link);
    populateLessonDescription(lessonData.lesson_content);
    populateKeyConcepts(lessonData.key_concepts);
    populateMiniQuiz(lessonData.questions);
    const progressPercentage = await fetchUserProgress(courseId);
    updateProgressBar(progressPercentage);
    // Check if there is a next lesson
    const nextLessonId = parseInt(lessonId) + 1;
    const hasNextLesson = await checkNextLesson(courseId, nextLessonId);

    // Update button text if no next lesson
    const submitButton = document.getElementById("submit-quiz");
    if (!hasNextLesson) {
      submitButton.textContent = "Submit";
    }

    // Attach the event listener to the submit button
    submitButton.addEventListener("click", () => {
      handleQuizSubmission(courseId, lessonId, lessonData.questions || []);
    });
  } else {
    console.error("Failed to load lesson data.");
  }
});

