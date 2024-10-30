const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');

const dataCenterDashboardRoute = (app) => {   
    // DC page

    app.get('/Dashboard/Data-Center/:company_id', dataCenterDashboardController.getAllDataCenter);
    app.get('/Dashboard/Data-Center/years-months', dataCenterDashboardController.getAllMonthAndYear); //todo: require company id

    
    app.get('/Dashboard/Data-Center/EnergyConsumption/company/:company_id', dataCenterDashboardController.getAllEnergyConsumptionByCompanyId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/data-center/:dataCenterId', dataCenterDashboardController.getAllEnergyConsumptionByDataCenterId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/data-center/:dataCenterId/date', dataCenterDashboardController.getAllEnergyConsumptionByDataCenterIdAndDate);
    app.get('/Dashboard/Data-Center/EnergyConsumption/company/:company_id/date', dataCenterDashboardController.getAllEnergyConsumptionByCompanyIdAndDate);

    
    app.get('/Dashboard/Data-Center/CarbonEmission/company/:company_id', dataCenterDashboardController.getAllCarbonEmissionByCompanyId);
    app.get('/Dashboard/Data-Center/CarbonEmission/data-center/:data_center_id', dataCenterDashboardController.getAllCarbonEmissionByDataCenterId);
    app.get('/Dashboard/Data-Center/CarbonEmission/company/:company_id/date', dataCenterDashboardController.getAllCarbonEmissionByCompanyIdAndDate);
    // app.get('/Dashboard/Data-Center/CarbonEmission/data-center/:data_center_id/date', dataCenterDashboardController.getAllCarbonEmissionByDataCenterAndDate);

    // overview page
    app.get('/Dashboard/sustainability-goals/:company_id', dataCenterDashboardController.getAllSustainabilityGoalsData);
}

module.exports = dataCenterDashboardRoute;
