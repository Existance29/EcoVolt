const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');

const dataCenterDashboardRoute = (app) => {   
    app.get('/Dashboard/carbon-emissions/:company_id/:date', dataCenterDashboard.getAllCarbonEmissionsData);
    app.get('/Dashboard/sustainability-goals/:company_id/:date', dataCenterDashboard.getAllSustainabilityGoalsData);
}

module.exports = dataCenterDashboardRoute;
