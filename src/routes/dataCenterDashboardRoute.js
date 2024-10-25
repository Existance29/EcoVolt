const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');

const dataCenterDashboardRoute = (app) => {   
    // DC page
    app.get('/Dashboard/Data-Center/years', dataCenterDashboardController.getAllYear);
    app.get('/Dashboard/Data-Center/carbon-emissions/:company_id/:year', dataCenterDashboardController.getAllCarbonEmissionsData);
    app.get('/Dashboard/Data-Center/energy-consumption/:company_id/:year', dataCenterDashboardController.getAllEnergyConsumptionData);

    // overview page
    app.get('/Dashboard/sustainability-goals/:company_id', dataCenterDashboardController.getAllSustainabilityGoalsData);
}

module.exports = dataCenterDashboardRoute;
