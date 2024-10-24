const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');

const dataCenterDashboardRoute = (app) => {
    app.get('/dataCenterDashboard/carbonEmissions', dataCenterDashboardController.getAllCarbonEmissionsData);
    app.get('/dataCenterDashboard/sustainabilityGoals', dataCenterDashboardController.getAllSustainabilityGoalsData);    
}

module.exports = dataCenterDashboardRoute;
