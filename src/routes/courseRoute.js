const courseController = require("../controllers/courseController");
const authenticateToken = require("../middlewares/authenticateToken");
const course = require("../models/course");


const courseRoute = (app) => {
    app.post('/courses/start', authenticateToken, courseController.startCourse);
    app.put('/courses/complete', authenticateToken, courseController.completeCourse);
    app.get('/courses', authenticateToken, courseController.getAllCourses); // for events page
    app.get('/courses/:course_id', authenticateToken, courseController.getCourseByIdForContentPage); // for course content page
    app.get('/courses/check-progress/:course_id', authenticateToken, courseController.calculateUserProgress); // for course content page
    app.get('/courses/:course_id/last-lesson', authenticateToken, courseController.getWhichLessonUserLeftOff); // for course content page

    app.get('/lesson/:course_id/:lesson_id', authenticateToken, courseController.getLessonById); // for course page (aka lesson page)
    app.post('/lessons/:course_id/:lesson_id/progress', authenticateToken, courseController.increaseUserProgress); // for course page (aka lesson page) when user clicks on next button

    app.get('/user/points', authenticateToken, courseController.getUserPoints);
    app.post('/course/addPoints', authenticateToken, courseController.addPoints); // for course completion page
    app.post("/generate-certificate", authenticateToken, courseController.downloadCertificate); // for course completion page

    app.get('/profile/completed-courses', authenticateToken, courseController.getCoursesCompleted); // for profile page

    // ------- for submission of suggestions
    app.post('/submit-suggesiton/:company_id', authenticateToken, courseController.submitSuggestion);
    
};

module.exports = courseRoute;
