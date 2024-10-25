const activityController = require('../controllers/activityController');

const activityRoute = (app) => {
    app.get('/posts', activityController.getAllPosts);
}

module.exports = activityRoute;