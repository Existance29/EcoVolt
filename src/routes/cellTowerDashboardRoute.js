const cellTowerDashboardController = require("../controllers/cellTowerDashboardController.js");
const authenticateToken = require("../middlewares/authenticateToken")

// Create routes
const cellTowerDashboardRoute = (app) => {
    app.get('/Dashboard/Cell-Towers', authenticateToken, cellTowerDashboardController.getCellTowers)
    app.get("/Dashboard/Cell-Tower/Consumption/:id/:month/:year", authenticateToken, cellTowerDashboardController.getCellTowerConsumptionData) //this route is for decoding the jwt
    app.get("/Dashboard/Cell-Tower/Energy-Consumption-For-Each-Cell-Tower/:cat/:month/:year", authenticateToken, cellTowerDashboardController.getEnergyConsumptionForEachCellTower)
};

module.exports = cellTowerDashboardRoute