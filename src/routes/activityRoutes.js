const activityController = require('../controllers/activityController');

const activityRoute = (app) => {
    app.get('/posts', activityController.getAllPosts);
    app.post('/toggleLike', activityController.toggleLike);
    app.post('/toggleDislike', activityController.toggleDislike);
    app.get('/comment/:post_id', activityController.getCommentsByPostId);
    app.post('/newComments', activityController.addNewComment);
    app.post('/addPost', activityController.addNewPost);
}

module.exports = activityRoute;