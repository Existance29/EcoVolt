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
    const courseId = new URLSearchParams(window.location.search).get("courseId");

    if (!courseId) {
        console.error("Course ID not found in URL.");
        alert("Course ID not found.");
        return;
    }

    try {
        // Fetch course details to get the course name
        const response = await get(`/course/${courseId}`);
        if (!response.ok) {
            console.error("Failed to fetch course details:", await response.text());
            alert("Failed to fetch course details.");
            return;
        }

        const data = await response.json();
        const courseName = data[0]?.title || "Unknown Course";

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
