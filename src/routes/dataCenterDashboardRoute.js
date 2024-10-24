const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');

const dataCenterDashboardRoute = (app) => {   
    app.get('/api/carbon-emissions/:company_id/:date', dataCenterDashboard.getAllCarbonEmissionsData);
    app.get('/api/sustainability-goals/:company_id/:date', dataCenterDashboard.getAllSustainabilityGoalsData);
}

module.exports = dataCenterDashboardRoute;
