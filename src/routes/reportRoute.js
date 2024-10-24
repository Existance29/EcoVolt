const reportController = require('../controllers/reportController'); 

const reportRoute = (app) => {
    app.get('/reports', reportController.getAllReport);
    
}

module.exports = reportRoute;