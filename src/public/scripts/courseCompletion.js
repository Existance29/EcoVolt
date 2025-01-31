async function getCourseById(courseId) {
    const url = `/courses/${courseId}`;
    
    try {
        const response = await get(url);

        if (response.status === 200) {
            const data = await response.json();
            return data; // Successfully fetched course data
        } else {
            console.error("Error fetching course data:", response.status);
            return null; // Error occurred
        }
    } catch (error) {
        console.error("Error fetching course data:", error);
        return null; // Error occurred
    }
}
async function getUserPoints() {
    const url = '/user/points';

    try {
        const response = await get(url);

        if (response.status === 200) {
            const data = await response.json();
            return data; // Successfully fetched user points
        } else if (response.status === 404) {
            console.warn("User points not found (404). Defaulting to 0.");
            return { points: 0 }; // Default to 0 points if not found
        } else {
            console.error("Error fetching user points:", response.status);
            return null; // Error occurred
        }
    } catch (error) {
        console.error("Error fetching user points:", error);
        return null; // Error occurred
    }
}

async function handleTotalPoints(courseId) {
    try {
        let course = await getCourseById(courseId);
        let userPoints = await getUserPoints();

        if (!course) {
            console.error("Failed to fetch course details.");
            alert("Unable to retrieve course information.");
            return;
        }

        if (!userPoints) {
            console.error("Failed to fetch user points.");
            return;
        }
        console.log("Course Data:", course);
        const coursePoints = course[0].course_points || 0; // Default to 0 if undefined
        const userTotalPoints = userPoints.points || 0; // Default to 0 if undefined
        await addCourseCompletionPoints(courseId, course[0].course_points, course[0].course_title);
        const totalPoints = coursePoints + userTotalPoints;
        document.getElementById("total-points").textContent = totalPoints;
    } catch (error) {
        console.error("Error handling total points:", error);
        alert("An unexpected error occurred. Please try again later.");
    }
}

async function addCourseCompletionPoints(courseId, points, courseName) {
    const url = '/course/addPoints';
    const requestData = {
        courseId: courseId,
        points: points,
        courseName
    };

    try {
        const response = await post(url, requestData);

        if (response.status === 200) {
            const data = await response.json();
            return data; // Successfully added points
        } else {
            console.error("Error adding points:", response.status);
            return null; // Error occurred
        }
    } catch (error) {
        console.error("Error adding points:", error);
        return null; // Error occurred
    }
}


// Call the functions to fetch points on page load
document.addEventListener("DOMContentLoaded", async () => {
    const courseId = new URLSearchParams(window.location.search).get("course_id");
    if (courseId) {
        const completionResponse = await markCourseAsCompleted(courseId);
        console.log("Completion Response:", completionResponse);
        await handleTotalPoints(courseId);
    } else {
        console.error("Course ID not found in URL.");
        document.getElementById("total-points").textContent = "No Course ID";
    }
});

async function markCourseAsCompleted(courseId) {
    if (!courseId || isNaN(courseId) || courseId <= 0) {
        console.error("Invalid course ID provided.");
        return;
    }
    try {
        const response = await put('/courses/complete', { course_id: parseInt(courseId) });

        if (!response.ok) {
            throw new Error(`Failed to complete the course. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Course marked as completed successfully:", data);
        return data; // Return data for further processing if needed
    } catch (error) {
        console.error("Error marking the course as completed:", error);
        throw error; // Re-throw error for handling elsewhere if needed
    }
}


async function downloadCertificate() {
    const courseId = new URLSearchParams(window.location.search).get("course_id");

    if (!courseId) {
        console.error("Course ID not found in URL.");
        alert("Course ID not found.");
        return;
    }

    try {
        // Fetch course details to get the course name
        const response = await get(`/courses/${courseId}`);
        if (!response.ok) {
            console.error("Failed to fetch course details:", await response.text());
            alert("Failed to fetch course details.");
            return;
        }

        const data = await response.json();
        const courseName = data[0]?.course_title || "Ecovolt Course";

        // Send request to generate and download the certificate using the post helper function
        const generateResponse = await post("/generate-certificate", { courseName });

        if (!generateResponse.ok) {
            console.error("Failed to generate certificate:", await generateResponse.text());
            alert("Failed to generate certificate.");
            return;
        }

        // Parse the response to download the certificate file
        const blob = await generateResponse.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${courseName}_certificate.png`; // File name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("Certificate downloaded successfully.");
    } catch (error) {
        console.error("Error downloading certificate:", error);
        alert("An error occurred while downloading the certificate.");
    }
}


// Function to decode Base64URL-encoded JWT token
function decodeBase64Url(base64Url) {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded);
}


async function shareCertificate() {
    const courseId = new URLSearchParams(window.location.search).get("course_id");

    if (!courseId) {
        showPopup("Error", "Course ID not found.");
        return;
    }

    try {
        // Fetch course details to get the course name
        const response = await get(`/courses/${courseId}`);
        if (!response.ok) {
            showPopup("Error", "Failed to fetch course details.");
            return;
        }

        const data = await response.json();
        const courseName = data[0]?.course_title || "Ecovolt Course";

        // Check if the user already posted this certificate
        const hasPosted = await checkIfCertificatePosted(courseName);
        if (hasPosted) {
            showPopup("Notice", "You have already shared this certificate.");
            return;
        }

        // Request certificate generation
        const generateResponse = await post("/generate-certificate", { courseName });

        if (!generateResponse.ok) {
            showPopup("Error", "Failed to generate certificate.");
            return;
        }

        // Convert response to file
        const blob = await generateResponse.blob();
        const file = new File([blob], `${courseName}_certificate.png`, { type: "image/png" });

        // Upload to activity feed
        await uploadToActivityFeed(file, courseName);

        // Show success popup
        showPopup("Success", "Certificate successfully shared!", () => {
            window.location.href = 'activityFeed.html'; // Redirect after clicking OK
        });

    } catch (error) {
        console.error("Error sharing certificate:", error);
        showPopup("Error", "An error occurred while sharing the certificate.");
    }
}



async function uploadToActivityFeed(file, courseName) {
    const accessToken = sessionStorage.accessToken || localStorage.accessToken;

    if (!accessToken) {
        console.error("No access token found.");
        return;
    }

    // Extract and decode the JWT payload
    const payloadBase64Url = accessToken.split('.')[1]; // Extract payload part
    const payload = decodeBase64Url(payloadBase64Url); // Decode it
    const user_id = payload.userId;
    const company_id = payload.companyId;

    if (!user_id || !company_id) {
        console.error("User or company ID missing.");
        return;
    }

    const formData = new FormData();
    formData.append("user_id", user_id);
    formData.append("company_id", company_id);
    formData.append("context", ` I just completed the ${courseName} course and earned my certificate! `);
    formData.append("media", file);

    try {
        const response = await fetch('/addPost', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        console.log("Certificate successfully posted to activity feed!");
    } catch (error) {
        console.error("Error posting to activity feed:", error);
    }
}

async function checkIfCertificatePosted(courseName) {
    try {
        const response = await fetch('/posts', { method: 'GET' });

        if (!response.ok) {
            console.error("Error fetching posts:", response.status);
            return false;
        }

        const posts = await response.json();
        return posts.some(post => post.context.includes(courseName));
    } catch (error) {
        console.error("Error checking certificate post:", error);
        return false;
    }
}


function showPopup(title, message, callback = null) {
    // Create modal elements
    const modal = document.createElement("div");
    modal.classList.add("modal-overlay");

    const modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");

    const modalTitle = document.createElement("h2");
    modalTitle.textContent = title;

    const modalMessage = document.createElement("p");
    modalMessage.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.textContent = "OK";
    closeButton.classList.add("modal-close-btn");
    closeButton.onclick = function () {
        document.body.removeChild(modal);
        if (callback) callback();
    };

    // Append elements
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalMessage);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// CSS Styles for Modal
const modalStyles = `
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    .modal-content {
        background: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }
    .modal-close-btn {
        margin-top: 15px;
        padding: 10px 20px;
        border: none;
        background: #4FD1C5;
        color: white;
        font-size: 16px;
        cursor: pointer;
        border-radius: 5px;
    }
    .modal-close-btn:hover {
        background: #509577;
    }
`;

// Append styles to document
const styleSheet = document.createElement("style");
styleSheet.innerText = modalStyles;
document.head.appendChild(styleSheet);
