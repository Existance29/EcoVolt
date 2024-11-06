const activityController = require('../controllers/activityController');

const activityRoute = (app) => {
    app.get('/posts', activityController.getAllPosts);
    app.post('/toggleLike', activityController.toggleLike);
    app.post('/toggleDislike', activityController.toggleDislike);

}

module.exports = activityRoute;