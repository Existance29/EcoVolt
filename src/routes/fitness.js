const FitnessController = require('../controllers/fitnessController');
const authenticateToken = require("../middlewares/authenticateToken")


const fitnessRoute = (app) => {
    app.get('/fitness/auth', authenticateToken, FitnessController.redirectToStravaAuth);
    app.get('/fitness/callback', FitnessController.handleStravaCallback);
    app.get('/fitness/stats', authenticateToken, FitnessController.getAthleteStats);
    app.get('/fitness/display-leaderboard', authenticateToken, FitnessController.displayLeaderboard);
    app.get('/fitness/user-rank', authenticateToken, FitnessController.getUserRank);
    app.post('/fitness/save-records', authenticateToken, FitnessController.saveUserStats);
    app.post('/fitness/add-points', authenticateToken, FitnessController.addPoints);
};

module.exports = fitnessRoute;
