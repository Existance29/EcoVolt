const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');

const dataCenterDashboardRoute = (app) => {   
    app.get('/Dashboard/Data-Center/carbon-emissions/:company_id/:date', dataCenterDashboard.getAllCarbonEmissionsData);
    app.get('/Dashboard/Data-Center/sustainability-goals/:company_id/:date', dataCenterDashboard.getAllSustainabilityGoalsData);
}

module.exports = dataCenterDashboardRoute;
