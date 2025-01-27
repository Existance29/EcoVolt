const activityController = require('../controllers/activityController');
const multer = require("multer");
const path = require("path");

const upload = multer({
    dest: path.join(__dirname, "../uploads/activity-feed/")
});

const activityRoute = (app) => {
    app.get('/posts', activityController.getAllPosts);
    app.post('/toggleLike', activityController.toggleLike);
    app.post('/toggleDislike', activityController.toggleDislike);
    app.get('/comment/:post_id', activityController.getCommentsByPostId);
    app.post('/newComments', activityController.addNewComment);
    app.post('/addPost', upload.single('media'), activityController.addNewPost);
    app.get('/getMedia/:post_id', activityController.getMedia);
    app.post('/trackActivity', activityController.trackActivity);
    app.post('/activitySummary', activityController.getActivitySummary);
    app.post('/redeemReward', activityController.redeemReward);
    app.get('/events/current', activityController.getCurrentEvents);
    app.get('/user-progress/:userId', activityController.getUserProgress);
    app.post('/events/log-progress', activityController.logUserProgress);
}

module.exports = activityRoute;