const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');

const dataCenterDashboardRoute = (app) => {   
    // DC page

    app.get('/Dashboard/Data-Center/:company_id', dataCenterDashboardController.getAllDataCenter);
    app.get('/Dashboard/Data-Center/years-months', dataCenterDashboardController.getAllMonthAndYear); //todo: require company id

    
    app.get('/Dashboard/Data-Center/EnergyConsumption/company/:company_id', dataCenterDashboardController.getAllEnergyConsumptionByCompanyId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/data-center/:dataCenterId', dataCenterDashboardController.getAllEnergyConsumptionByDataCenterId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/data-center/:dataCenterId/date', dataCenterDashboardController.getAllEnergyConsumptionByDataCenterIdAndDate);
    
    
    // overview page
    app.get('/Dashboard/sustainability-goals/:company_id', dataCenterDashboardController.getAllSustainabilityGoalsData);
}

module.exports = dataCenterDashboardRoute;
