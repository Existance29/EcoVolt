const FitnessController = require('../controllers/fitnessController');

const fitnessRoute = (app) => {
    app.get('/fitness/auth', FitnessController.redirectToStravaAuth);
    app.get('/fitness/callback', FitnessController.handleStravaCallback);
    app.get('/fitness/stats', FitnessController.getAthleteStats);
};

module.exports = fitnessRoute;
