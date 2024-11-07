const reportController = require('../controllers/reportController'); 

const reportRoute = (app) => {
    app.get('/reports', reportController.generateReportData);
    app.get('/reports/generate', reportController.forceGenerateReportData);
    app.get('/reports/pdf', reportController.generateReportPDF); // PDF download route

}

module.exports = reportRoute;