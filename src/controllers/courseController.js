// require('dotenv').config();
// const axios = require('axios');
const course = require('../models/course');
const sharp = require("sharp");
const path = require("path");
const { get } = require('http');



const startCourse = async (req, res) => {
    const course_id = parseInt(req.body.course_id);
    const user_id = req.user.userId;
    try {
        const courses = await course.startCourse(course_id, user_id);
        if (!courses) {
            return res.status(404).send("Did not log start course.");
        }
        return res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching content for selected course:", error);
        res.status(500).send("Failed to fetch content for selected course: Internal Server Error.");
    }
}

const completeCourse = async (req, res) => {
    const { course_id } = req.body;
    const user_id = req.user.userId;
    try {
        const courses = await course.completeCourse(user_id, course_id);
        if (!courses) {
            return res.status(404).send("did not log complete course.");
        }
        return res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching content for selected course:", error);
        res.status(500).send("Failed to fetch content for selected course: Internal Server Error.");
    }
}


const getAllCourses = async (req, res) => {
    try {
        const courses = await course.getAllCourses();
        if (!courses) {
            return res.status(404).send("No courses found.");
        }
        return res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).send("Failed to fetch courses: Internal Server Error.");
    }
};

const getCourseByIdForContentPage = async (req, res) => {
    const course_id = parseInt(req.params.course_id);
    try {
        const courses = await course.getCourseByIdForContentPage(course_id);
        if (!courses) {
            return res.status(404).send("No content for selected course found.");
        }
        return res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching content for selected course:", error);
        res.status(500).send("Failed to fetch content for selected course: Internal Server Error.");
    }
}

const calculateUserProgress = async (req, res) => {
    const course_id = parseInt(req.params.course_id);
    const user_id = req.user.userId;

    try {
        // Fetch the progress percentage
        const progressPercentage = await course.getUserProgress(user_id, course_id);

        // Respond with the progress
        res.status(200).json({ success: true, course_id, user_id, progressPercentage });
    } catch (error) {
        console.error('Error calculating user progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate user progress',
        });
    }
};

const getWhichLessonUserLeftOff = async (req, res) => {
    const course_id = parseInt(req.params.course_id);
    const user_id = req.user.userId;

    try {
        // Fetch the lesson the user left off
        const lastLesson = await course.getLastLessonForUser(user_id, course_id);
        if (lastLesson) {
            res.status(200).json({ success: true, course_id, user_id, lesson: lastLesson });
        } else {
            res.status(404).json({
                success: false,
                message: "No lessons found for this user in this course.",
            });
        }
    } catch (error) {
        console.error("Error fetching the last lesson:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the lesson the user left off.",
        });
    }
};



// ------------------------------- lesson related below 
const getLessonById = async (req, res) => {
    const lesson_id = parseInt(req.params.lesson_id);
    const course_id = parseInt(req.params.course_id);
    try {
        const check = await course.getLessonByCourseIdAndLessonId(course_id, lesson_id);
        if (!check) {
            return res.status(404).send("No lesson found.");
        }
        const lesson = await course.getLessonById(course_id, lesson_id);
        if (!lesson) {
            return res.status(404).send("No lesson found.");
        }
        return res.status(200).json(lesson);
    } catch (error) {
        console.error("Error fetching lesson:", error);
        res.status(500).send("Failed to fetch lesson: Internal Server Error.");
    }
}


const increaseUserProgress = async (req, res) => {
    const user_id = req.user.userId;
    const { course_id, lesson_id } = req.params;

    try {
        const updatedProgress = await course.increaseUserProgress(user_id, course_id, lesson_id);
        if (!updatedProgress) {
            return res.status(404).json({
                success: false,
                message: "Course or lesson not found or invalid request."
            });
        }

        return res.status(200).json({
            success: true,
            message: "User progress updated successfully.",
            progress: updatedProgress
        });
    } catch (error) {
        console.error("Error updating user progress:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update user progress."
        });
    }
};




const getUserPoints = async (req, res) => {
    const user_id = req.user.userId;
    try {
        const points = await course.getUserPoints(user_id);
        if (!points) {
            return res.status(404).send("User not found.");
        }
        return res.status(200).json({points});
    } catch (error) {
        console.error("Error fetching user points:", error);
        res.status(500).send("Failed to fetch user points: Internal Server Error.");
    }
}

const addPoints = async (req, res) => {
    const user_id = req.user.userId; // User ID from the authenticated token
    const points = parseInt(req.body.points, 10);
    const courseName = req.body.courseName; // Assuming this is passed in the request body
    const activityType = `Completed ${courseName}`;
    try {
        // Check if the user has already been awarded for this activity
        const hasAwarded = await course.checkIfActivityExists(user_id, activityType);

        if (hasAwarded) {
            return res.status(400).json({
                success: false,
                message: "User has already been awarded points for this activity.",
            });
        }

        // Ensure the user exists in the `user_rewards` table
        const userExists = await course.checkIfUserExistsInRewards(user_id);

        if (!userExists) {
            // Add user to `user_rewards` table with initial points
            await course.addUserToRewards(user_id, points);
        } else {
            // Update user's total points
            await course.updateUserPoints(user_id, points);
        }

        // Log the activity in the `activity_points` table
        await course.logActivityPoints(user_id, null, activityType, points);

        return res.status(200).json({
            success: true,
            message: "Points added successfully.",
        });
    } catch (error) {
        console.error("Error adding points:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add points: Internal Server Error.",
        });
    }
};















const submitSuggestion = async (req, res) => {
    const user_id = req.user.userId;
    const company_id = parseInt(req.params.company_id);
    const title = req.body.title;
    const suggestion_text = req.body.suggestion_text;
    const created_at = new Date();
    const status = "Pending";
    try {
        await course.submitSuggestion(user_id, company_id, title, suggestion_text, created_at, status);
        return res.status(200).json({ message: "Suggestion submitted successfully." });
    } catch (error) {
        console.error("Error submitting suggestion:", error);
        res.status(500).send("Failed to submit suggestion: Internal Server Error.");
    }
};

async function generateCertificate(userName, courseName) {
    const templatePath = path.join(__dirname, "../public/assets/courses/certificate-template.png");
    const outputDir = path.join(__dirname, "../public/generated-certificates");
    const outputPath = path.join(outputDir, `${userName.replace(/\s+/g, "_")}_certificate.png`);

    const fs = require("fs");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Adjusted SVG overlay with a stylish font
    const textOverlay = `
        <svg width="1200" height="800">
            <style>
                .username { fill: #EBA800; font-size: 86px; font-family: 'Brush Script MT, cursive'; font-weight: bold; }
                .coursetitle { fill: #000; font-size: 36px; font-family: 'Arial, sans-serif'; }
            </style>
            <!-- Adjusted username position -->
            <text x="600" y="460" text-anchor="middle" class="username">${userName || "Unknown User"}</text>
            <!-- Adjusted course title position -->
            <text x="600" y="650" text-anchor="middle" class="coursetitle">For completing ${courseName || "Unknown Course"}</text>
        </svg>
    `;
    try {
        await sharp(templatePath)
            .composite([{ input: Buffer.from(textOverlay), blend: "over" }]) // Apply the overlay explicitly
            .toFile(outputPath);

        console.log(`Certificate generated: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error("Error generating certificate:", error);
        throw error;
    }
}



const downloadCertificate = async (req, res) => {
    const userId = req.user.userId;
    const { courseName } = req.body; // Get course name from request body

    if (!userId || !courseName) {
        return res.status(400).json({ error: "User id and course name are required." });
    }

    try {
        const checkUser = await course.checkUser(userId);
        if (!checkUser) {
            console.error("User not found or invalid user name.");
            return res.status(400).json({ error: "User not found or invalid user name." });
        }
        const userName = checkUser[0].name;
        console.log("Generating certificate for:", { userName, courseName });

        const filePath = await generateCertificate(userName, courseName);

        // Serve the generated certificate as a downloadable file
        res.download(filePath, `${userName.replace(/\s+/g, "_")}_certificate.png`, (err) => {
            if (err) {
                console.error("Error sending certificate:", err);
                res.status(500).send("Failed to download certificate.");
            }
        });
    } catch (error) {
        console.error("Error generating certificate:", error);
        res.status(500).json({ error: "Error generating certificate." });
    }
};


module.exports = {
    startCourse,
    completeCourse,
    getAllCourses,
    getCourseByIdForContentPage,
    calculateUserProgress,
    getWhichLessonUserLeftOff,
    getLessonById,
    increaseUserProgress,
    addPoints,
    getUserPoints,




    generateCertificate,
    downloadCertificate,
    submitSuggestion,

}