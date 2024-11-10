const DashboardController = require("../controllers/overviewDashboardController");

const overviewDashboardRoute = (app) => {
    app.get("/dashboard-overview", DashboardController.getDashboardSummary);
    
};

module.exports = overviewDashboardRoute;
