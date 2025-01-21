async function getCourseTotalPoints(courseId) {
    try {
        const response = await get(`/course/${courseId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
                return { 
                    points: data[0].points || 0, 
                    courseName: data[0].title || "Unknown Course" 
                }; // Return points and course name
            } else {
                console.error("No course data found.");
                return { points: 0, courseName: "Unknown Course" };
            }
        } else {
            console.error("Failed to fetch course points:", response.statusText);
            return { points: 0, courseName: "Unknown Course" };
        }
    } catch (error) {
        console.error("Error fetching course points:", error);
        return { points: 0, courseName: "Unknown Course" };
    }
}

async function fetchTotalPoints(courseTotalPoints, courseName) {
    try {
        const response = await get("/rewards/available-points");
        if (response.ok) {
            const data = await response.json();

            // User's current points
            const userPoints = data.points || 0;

            // Add points to the user using the provided `post` helper function
            const addPointsResponse = await post("/course/addPoints", {
                points: courseTotalPoints,
                courseName
            });

            if (!addPointsResponse.ok) {
                if (addPointsResponse.status === 400) {
                    // If 400 error, show only the user's current points
                    console.warn("Course already completed. Showing current points only.");
                    document.getElementById("total-points").textContent = userPoints;
                } else {
                    console.error("Failed to add points:", await addPointsResponse.text());
                    document.getElementById("total-points").textContent = "Error";
                }
            } else {
                // Successful addition: display updated total points
                const totalPoints = userPoints + courseTotalPoints;
                document.getElementById("total-points").textContent = totalPoints;
                console.log("Points added successfully.");
            }
        } else {
            console.error("Failed to fetch points:", response.statusText);
            document.getElementById("total-points").textContent = "Error";
        }
    } catch (error) {
        console.error("Error fetching points:", error);
        document.getElementById("total-points").textContent = "Error";
    }
}


// Call the functions to fetch points on page load
document.addEventListener("DOMContentLoaded", async () => {
    const courseId = new URLSearchParams(window.location.search).get("courseId");
    if (courseId) {
        const { points: courseTotalPoints, courseName } = await getCourseTotalPoints(courseId);
        await fetchTotalPoints(courseTotalPoints, courseName);
    } else {
        console.error("Course ID not found in URL.");
        document.getElementById("total-points").textContent = "No Course ID";
    }
});

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
