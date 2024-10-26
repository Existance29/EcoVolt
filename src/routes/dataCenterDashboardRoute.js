const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');

const dataCenterDashboardRoute = (app) => {   
    // DC page
    app.get('/Dashboard/Data-Center/years-months', dataCenterDashboardController.getAllMonthAndYear);
    app.get('/Dashboard/Data-Center/carbon-emissions/:company_id/:year/:month', dataCenterDashboardController.getAllCarbonEmissionsData);
    app.get('/Dashboard/Data-Center/energy-consumption/:company_id/:year/:month', dataCenterDashboardController.getAllEnergyConsumptionData);

    // overview page
    app.get('/Dashboard/sustainability-goals/:company_id', dataCenterDashboardController.getAllSustainabilityGoalsData);
}

module.exports = dataCenterDashboardRoute;
