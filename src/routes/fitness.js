const FitnessController = require('../controllers/fitnessController');
const authenticateToken = require("../middlewares/authenticateToken")


const fitnessRoute = (app) => {
    app.get('/fitness/auth', FitnessController.redirectToStravaAuth);
    app.get('/fitness/callback', FitnessController.handleStravaCallback);
    app.get('/fitness/stats', FitnessController.getAthleteStats);
    app.get('/fitness/display-leaderboard/', authenticateToken, FitnessController.displayLeaderboard);
    app.get('/fitness/user-rank', authenticateToken, FitnessController.getUserRank);
    app.post('/fitness/save-records', authenticateToken, FitnessController.saveUserStats);
};

module.exports = fitnessRoute;
