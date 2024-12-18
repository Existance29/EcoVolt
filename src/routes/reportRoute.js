const reportController = require('../controllers/reportController'); 

const reportRoute = (app) => {
    app.get('/reports/:company_id', reportController.generateReportData);
    app.get('/reports/:company_id/generate', reportController.forceGenerateReportData);
    app.get('/reports/:company_id/pdf', reportController.generateReportPDF); // PDF download route
    app.get('/reports/allYearsReport', reportController.getAllYearsReport);
};

module.exports = reportRoute;