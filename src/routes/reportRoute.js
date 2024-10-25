const reportController = require('../controllers/reportController'); 

const reportRoute = (app) => {
    app.get('/reports', reportController.getAllReport);
    app.get('/reports/pdf', reportController.generateReportPDF);
}

module.exports = reportRoute;