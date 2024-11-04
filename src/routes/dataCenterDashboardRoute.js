const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');

const dataCenterDashboardRoute = (app) => {   
    // DC page

    app.get('/Dashboard/Data-Center/:company_id', dataCenterDashboardController.getAllDataCenter);
    app.get('/Dashboard/Data-Center/AvailableDates/:company_id', dataCenterDashboardController.getAllDate); //todo: require company id

    
    app.get('/Dashboard/Data-Center/EnergyConsumption/company/:company_id', dataCenterDashboardController.getAllEnergyConsumptionByCompanyId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/data-center/:dataCenterId', dataCenterDashboardController.getAllEnergyConsumptionByDataCenterId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/data-center/:dataCenterId/date', dataCenterDashboardController.getAllEnergyConsumptionByDataCenterIdAndDate);
    app.get('/Dashboard/Data-Center/EnergyConsumption/company/:company_id/date', dataCenterDashboardController.getAllEnergyConsumptionByCompanyIdAndDate);

    
    app.get('/Dashboard/Data-Center/CarbonEmission/company/:company_id', dataCenterDashboardController.getAllCarbonEmissionByCompanyId);
    app.get('/Dashboard/Data-Center/CarbonEmission/data-center/:data_center_id', dataCenterDashboardController.getAllCarbonEmissionByDataCenterId);
    app.get('/Dashboard/Data-Center/CarbonEmission/company/:company_id/date', dataCenterDashboardController.getAllCarbonEmissionByCompanyIdAndDate);
    app.get('/Dashboard/Data-Center/CarbonEmission/data-center/:data_center_id/date', dataCenterDashboardController.getAllCarbonEmissionByDataCenterAndDate);


    app.get('/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/:company_id', dataCenterDashboardController.getAllSumOfCarbonEmissionByCompanyId);
    app.get('/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/:company_id/date', dataCenterDashboardController.getAllSumOfCarbonEmissionByCompanyIdAndDate);
    app.get('/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/:company_id/:data_center_id', dataCenterDashboardController.getAllSumOfCarbonEmissionByCompanyIdAndDataCenter);
    app.get('/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/:company_id/:data_center_id/date', dataCenterDashboardController.getAllSumOfCarbonEmissionByCompanyIdAndDataCenterAndDate);



    // overview page
    app.get('/Dashboard/sustainability-goals/:company_id', dataCenterDashboardController.getAllSustainabilityGoalsData);
}

module.exports = dataCenterDashboardRoute;
