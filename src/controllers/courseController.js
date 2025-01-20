// require('dotenv').config();
// const axios = require('axios');
const course = require('../models/course');
const sharp = require("sharp");
const path = require("path");


const getCourseById = async (req, res) => {
    const course_id = req.params.course_id;
    try {
        const data = await course.getCourseById(course_id);
        if (!data) {
            return res.status(400).send("No Courses Found");
        }
        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Courses: Internal Server Error.');
    }
}


const getAllCourses = async (req, res) => {
    try {
        const data = await course.getAllCourses();
        if (!data) {
            return res.status(400).send("No Data Centers found.");
        }
        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Data Centers: Internal Server Error.');
    }
}

const getLessonsByCourseId = async (req, res) => {
    const course_id = req.params.course_id;
    try {
        const data = await course.getLessonsByCourseId(course_id);
        if (!data) {
            return res.status(400).send("No Lessons Found");
        }
        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Lessons: Internal Server Error.');
    }
}

const getNextLesson = async (req, res) => {
    const lesson_id = req.params.lesson_id;
    const couse_id = req.params.course_id;
    try {
        const nextLesson = await course.getNextLesson(lesson_id, couse_id); // Add this function in your course model
        if (!nextLesson) {
            return res.status(404).send("No more lessons available.");
        }
        return res.status(200).json(nextLesson);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve the next lesson: Internal Server Error.');
    }
};

const lessonCount = async (req, res) => {
    const course_id = req.params.course_id;
    try {
        console.log(course_id);
        const data = await course.lessonCount(course_id);
        if (!data) {
            return res.status(400).send("No lesson count Found");
        }
        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve lesson count: Internal Server Error.');
    }
}

const getVideoLink = async(req, res) => {
    const lesson_id = req.params.lesson_id;
    const course_id = req.params.course_id;
    try {
        const data = await course.getVideoLink(lesson_id, course_id);
        if (!data) {
            return res.status(400).send("No video Found");
        }
        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve video: Internal Server Error.');
    }
}


const getQuestionsByLessonId = async (req, res) => {
    const lesson_id = req.params.lesson_id;
    const course_id = req.params.course_id;
    try {
        const data = await course.getQuestionsByLessonId(lesson_id, course_id);
        if (!data) {
            return res.status(400).send("No Lessons Found");
        }
        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Lessons: Internal Server Error.');
    }
}

const getKeyConceptsByLessonId = async (req, res) => {
    const lesson_id = parseInt(req.params.lesson_id, 10); // Corrected key name
    try {
        const data = await course.getKeyConceptsByLessonId(lesson_id);
        if (!data) {
            return res.status(400).send("No Key Concept Found");
        }
        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Key Concepts: Internal Server Error.');
    }
}

const addPoints = async (req, res) => {
    const user_id = req.user.userId;
    const points = req.body.points;
    const courseName = req.body.courseName;
    try {
        const isLogged = await course.checkActivityPoints(user_id, `Completed ${courseName}`);
        if (isLogged.length > 0) {
            return res.status(400).send("You have already completed this course");
        }
        const checkUser = await course.checkUserRewards(user_id);
        let data;
        if (!checkUser) {
            data = await course.addPoints(user_id, points);
        }
        else {
            data = await course.updatePoints(user_id, points);
        }
        if (!data) {
            return res.status(400).send("No points added");
        }
        await course.logActivity(user_id, null, `Completed ${courseName}`, points, new Date());
        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to add points: Internal Server Error.');
    }
}


const checkActivityPoints = async (req, res) => {
    const user_id = req.user.userId; // Ensure `userId` is valid
    const activityType = req.body.activityType; // Get activityType from the request body
    if (!user_id || !activityType) {
        return res.status(400).send("User ID and Activity Type are required.");
    }

    try {
        const isTaken = await course.checkActivityPoints(user_id, activityType);
        return res.status(200).json({ isTaken });
    } catch (error) {
        console.error("Error checking activity points:", error);
        res.status(500).send("Failed to check course activity: Internal Server Error.");
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
    getCourseById,
    getAllCourses,
    getLessonsByCourseId,
    getQuestionsByLessonId,
    getNextLesson,
    addPoints,
    checkActivityPoints,
    generateCertificate,
    downloadCertificate,
    getKeyConceptsByLessonId,
    getVideoLink,
    lessonCount,
    submitSuggestion

}