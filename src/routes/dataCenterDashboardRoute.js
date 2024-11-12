const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');

const dataCenterDashboardRoute = (app) => {   
    // DC page

    app.get('/Dashboard/Data-Center/:company_id', dataCenterDashboardController.getAllDataCenter);
    app.get('/Dashboard/Data-Center/AvailableDates/:company_id/:dc?', dataCenterDashboardController.getAllDates);
    
    app.get('/Dashboard/Data-Center/EnergyConsumption/Sum/company/:company_id', dataCenterDashboardController.getTotalEnergyConsumptionByCompanyId); // text values 
    app.get('/Dashboard/Data-Center/EnergyConsumption/Sum/data-center/:data_center_id', dataCenterDashboardController.getTotalEnergyConsumptionByDataCenterId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/Sum/data-center/:data_center_id/date', dataCenterDashboardController.getTotalEnergyConsumptionByDataCenterIdAndDate);
    app.get('/Dashboard/Data-Center/EnergyConsumption/Sum/company/:company_id/date', dataCenterDashboardController.getTotalEnergyConsumptionByCompanyIdAndDate);
    
    app.get('/Dashboard/Data-Center/EnergyConsumption/company/:company_id', dataCenterDashboardController.getAllEnergyConsumptionByCompanyId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/data-center/:data_center_id', dataCenterDashboardController.getAllEnergyConsumptionByDataCenterId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/data-center/:data_center_id/date', dataCenterDashboardController.getAllEnergyConsumptionByDataCenterIdAndDate);
    app.get('/Dashboard/Data-Center/EnergyConsumption/company/:company_id/date', dataCenterDashboardController.getAllEnergyConsumptionByCompanyIdAndDate);


    app.get('/Dashboard/Data-Center/CarbonEmission/Sum/company/:company_id', dataCenterDashboardController.getTotalCarbonEmissionByCompanyId); // text values
    app.get('/Dashboard/Data-Center/CarbonEmission/Sum/data-center/:data_center_id', dataCenterDashboardController.getTotalCarbonEmissionByDataCenterId);
    app.get('/Dashboard/Data-Center/CarbonEmission/Sum/company/:company_id/date', dataCenterDashboardController.getTotalCarbonEmissionByCompanyIdAndDate);
    app.get('/Dashboard/Data-Center/CarbonEmission/Sum/data-center/:data_center_id/date', dataCenterDashboardController.getTotalCarbonEmissionByDataCenterIdAndDate);


    app.get('/Dashboard/Data-Center/CarbonEmission/company/:company_id', dataCenterDashboardController.getAllCarbonEmissionByCompanyId); // line chart 
    app.get('/Dashboard/Data-Center/CarbonEmission/data-center/:data_center_id', dataCenterDashboardController.getAllCarbonEmissionByDataCenterId);
    app.get('/Dashboard/Data-Center/CarbonEmission/company/:company_id/date', dataCenterDashboardController.getAllCarbonEmissionByCompanyIdAndDate);
    app.get('/Dashboard/Data-Center/CarbonEmission/data-center/:data_center_id/date', dataCenterDashboardController.getAllCarbonEmissionByDataCenterAndDate);


    app.get('/Dashboard/Data-Center/RenewableEnergy/Total/company/:company_id', dataCenterDashboardController.getTotalRenewableEnergyByCompanyId);
    app.get('/Dashboard/Data-Center/RenewableEnergy/Total/data-center/:data_center_id', dataCenterDashboardController.getTotalRenewableEnergyByDataCenterId);
    app.get('/Dashboard/Data-Center/RenewableEnergy/Total/data-center/:data_center_id/date', dataCenterDashboardController.getTotalRenewableEnergyByDataCenterIdAndDate);
    app.get('/Dashboard/Data-Center/RenewableEnergy/Total/company/:company_id/date', dataCenterDashboardController.getTotalRenewableEnergyByCompanyIdAndDate);
    
    app.get('/Dashboard/Data-Center/EnergyConsumption/GroupByDc/:company_id/:data_center_id?', dataCenterDashboardController.getEnergyConsumptionGroupByDc);

    // overview page
    app.get('/Dashboard/sustainability-goals/:company_id', dataCenterDashboardController.getAllSustainabilityGoalsData);
}

module.exports = dataCenterDashboardRoute;
