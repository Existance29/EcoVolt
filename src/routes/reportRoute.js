const reportController = require('../controllers/reportController'); 

const reportRoute = (app) => {
    app.get('/reports/:company_id', reportController.generateReportData);
    app.get('/reports/:company_id/generate', reportController.forceGenerateReportData);
    app.get('/reports/:company_id/pdf', reportController.generateReportPDF); // PDF download route
    app.get('/reports/:company_id/years', reportController.getAvailableYears);
    app.get('/reports/:company_id/energy-breakdown', reportController.getEnergyBreakdown);
    app.get('/reports/:company_id/yearly-energy-breakdown', reportController.getYearlyEnergyBreakdown);
};

module.exports = reportRoute;