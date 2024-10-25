const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');

const dataCenterDashboardRoute = (app) => {   
    // DC page
    app.get('/Dashboard/Data-Center/carbon-emissions/:company_id/:date', dataCenterDashboardController.getAllCarbonEmissionsData);

    // overview page
    app.get('/Dashboard/sustainability-goals/:company_id', dataCenterDashboardController.getAllSustainabilityGoalsData);
}

module.exports = dataCenterDashboardRoute;
