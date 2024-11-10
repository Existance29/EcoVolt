const DashboardController = require("../controllers/overviewDashboardController");
const authenticateToken = require("../middlewares/authenticateToken"); // Import the authentication middleware

const overviewDashboardRoute = (app) => {
    app.get("/dashboard-overview", authenticateToken, DashboardController.getDashboardSummary); // Protect route with authenticateToken
};

module.exports = overviewDashboardRoute;
