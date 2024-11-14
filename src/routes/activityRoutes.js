const activityController = require('../controllers/activityController');

const activityRoute = (app) => {
    app.get('/posts', activityController.getAllPosts);
    app.post('/toggleLike', activityController.toggleLike);
    app.post('/toggleDislike', activityController.toggleDislike);
    app.get('/comment/:post_id', activityController.getCommentsByPostId);
    app.post('/newComments', activityController.addNewComment);
    app.post('/addPost', activityController.addNewPost);
    app.post('/trackActivity', activityController.trackActivity);
    app.post('/activitySummary', activityController.getActivitySummary);
    app.post('/redeemReward', activityController.redeemReward);
}

module.exports = activityRoute;