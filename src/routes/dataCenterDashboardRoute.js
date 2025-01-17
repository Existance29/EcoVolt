const dataCenterDashboardController = require('../controllers/dataCenterDashboardController.js');
const authenticateToken = require("../middlewares/authenticateToken")

const dataCenterDashboardRoute = (app) => {   
    // DC page

    app.get('/Dashboard/Data-Center', authenticateToken, dataCenterDashboardController.getAllDataCenter);
    app.get('/Dashboard/Data-Center/AvailableDates/:dc?', authenticateToken, dataCenterDashboardController.getAllDates);
    
    app.get('/Dashboard/Data-Center/EnergyConsumption/Sum/company', authenticateToken, dataCenterDashboardController.getTotalEnergyConsumptionByCompanyId); // text values 
    app.get('/Dashboard/Data-Center/EnergyConsumption/Sum/data-center/:data_center_id', authenticateToken, dataCenterDashboardController.getTotalEnergyConsumptionByDataCenterId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/Sum/data-center/:data_center_id/date', authenticateToken,dataCenterDashboardController.getTotalEnergyConsumptionByDataCenterIdAndDate);
    app.get('/Dashboard/Data-Center/EnergyConsumption/Sum/company/date', authenticateToken,dataCenterDashboardController.getTotalEnergyConsumptionByCompanyIdAndDate);
    
    app.get('/Dashboard/Data-Center/EnergyConsumption/company', authenticateToken, dataCenterDashboardController.getAllEnergyConsumptionByCompanyId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/data-center/:data_center_id', authenticateToken, dataCenterDashboardController.getAllEnergyConsumptionByDataCenterId);
    app.get('/Dashboard/Data-Center/EnergyConsumption/data-center/:data_center_id/date', authenticateToken, dataCenterDashboardController.getAllEnergyConsumptionByDataCenterIdAndDate);
    app.get('/Dashboard/Data-Center/EnergyConsumption/company/date', authenticateToken, dataCenterDashboardController.getAllEnergyConsumptionByCompanyIdAndDate);


    app.get('/Dashboard/Data-Center/CarbonEmission/Sum/company', authenticateToken, dataCenterDashboardController.getTotalCarbonEmissionByCompanyId); // text values
    app.get('/Dashboard/Data-Center/CarbonEmission/Sum/data-center/:data_center_id', authenticateToken, dataCenterDashboardController.getTotalCarbonEmissionByDataCenterId);
    app.get('/Dashboard/Data-Center/CarbonEmission/Sum/company/date', authenticateToken, dataCenterDashboardController.getTotalCarbonEmissionByCompanyIdAndDate);
    app.get('/Dashboard/Data-Center/CarbonEmission/Sum/data-center/:data_center_id/date', authenticateToken, dataCenterDashboardController.getTotalCarbonEmissionByDataCenterIdAndDate);


    app.get('/Dashboard/Data-Center/CarbonEmission/company', authenticateToken, dataCenterDashboardController.getAllCarbonEmissionByCompanyId); // line chart 
    app.get('/Dashboard/Data-Center/CarbonEmission/data-center/:data_center_id', authenticateToken, dataCenterDashboardController.getAllCarbonEmissionByDataCenterId);
    app.get('/Dashboard/Data-Center/CarbonEmission/company/date', authenticateToken, dataCenterDashboardController.getAllCarbonEmissionByCompanyIdAndDate);
    app.get('/Dashboard/Data-Center/CarbonEmission/data-center/:data_center_id/date', authenticateToken, dataCenterDashboardController.getAllCarbonEmissionByDataCenterAndDate);


    app.get('/Dashboard/Data-Center/RenewableEnergy/Total/company', authenticateToken, dataCenterDashboardController.getTotalRenewableEnergyByCompanyId);
    app.get('/Dashboard/Data-Center/RenewableEnergy/Total/data-center/:data_center_id', authenticateToken, dataCenterDashboardController.getTotalRenewableEnergyByDataCenterId);
    app.get('/Dashboard/Data-Center/RenewableEnergy/Total/data-center/:data_center_id/date', authenticateToken, dataCenterDashboardController.getTotalRenewableEnergyByDataCenterIdAndDate);
    app.get('/Dashboard/Data-Center/RenewableEnergy/Total/company/date', authenticateToken, dataCenterDashboardController.getTotalRenewableEnergyByCompanyIdAndDate);
    
    app.get('/Dashboard/Data-Center/EnergyConsumption/GroupByDc/:data_center_id?', authenticateToken, dataCenterDashboardController.getEnergyConsumptionGroupByDc);

    app.get('/Dashboard/Data-Center/Devices', authenticateToken, dataCenterDashboardController.getDevicesCountByCompanyId);
    app.get('/Dashboard/Data-Center/Devices/:data_center_id', authenticateToken, dataCenterDashboardController.getDevicesCountByCompanyIdAndDc);
    
    app.get('/Dashboard/Data-Center/DevicesTypes', authenticateToken, dataCenterDashboardController.getDeviceTypesByCompanyId);
    app.get('/Dashboard/Data-Center/DevicesTypes/:data_center_id', authenticateToken, dataCenterDashboardController.getDeviceTypesByCompanyIdAndDataCenter);

    app.get('/Dashboard/Data-Center/EnergyConsumption/trend/:dc/:month/:year', authenticateToken, dataCenterDashboardController.getEnergyConsumptionTrendByCompanyIdAndDate)


    // app.post('/chat', dataCenterDashboardController.getChatbotResponse);
    // overview page
    app.get('/VirtualGarden/CompanyName/:company_id', dataCenterDashboardController.getCompanyName);
    app.get('/Dashboard/sustainability-goals', authenticateToken, dataCenterDashboardController.getAllSustainabilityGoalsData);
}

module.exports = dataCenterDashboardRoute;
