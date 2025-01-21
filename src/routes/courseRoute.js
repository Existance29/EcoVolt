const courseController = require("../controllers/courseController");
const authenticateToken = require("../middlewares/authenticateToken");
const course = require("../models/course");


const courseRoute = (app) => {
    app.post('/course/isTaken', authenticateToken, courseController.checkActivityPoints);

    app.get('/course', authenticateToken, courseController.getAllCourses);
    app.get('/course/:course_id', authenticateToken, courseController.getCourseById);
    app.get('/lessons/:course_id', authenticateToken, courseController.getLessonsByCourseId);

    app.get('/lessons/ordered-lessons/:course_id', authenticateToken, courseController.lessonCount);
    app.get('/lessons/video-link/:course_id/:lesson_id', authenticateToken, courseController.getVideoLink);
    app.get('/lessons/question/:course_id/:lesson_id', authenticateToken, courseController.getQuestionsByLessonId);
    app.get('/lessons/next/:course_id/:lesson_id', authenticateToken, courseController.getNextLesson);
    app.get('/lessons/key-concept/:lesson_id', authenticateToken, courseController.getKeyConceptsByLessonId);

    app.post('/course/addPoints', authenticateToken, courseController.addPoints);
    app.post("/generate-certificate", authenticateToken, courseController.downloadCertificate);

    // ------- for submission of suggestions
    app.post('/submit-suggesiton/:company_id', authenticateToken, courseController.submitSuggestion);
    
};

module.exports = courseRoute;
