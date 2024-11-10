const userRoute = require("./userRoute.js");
const reportRoute = require('./reportRoute');
const dataCenterDashboardRoute = require('./dataCenterDashboardRoute.js');
const activityRoute = require('./activityRoutes.js');
const cellTowerDashboardRoute = require("./cellTowerDashboardRoute.js");

const route = (app) => {
    userRoute(app);
    reportRoute(app);
    dataCenterDashboardRoute(app);
    activityRoute(app);
    cellTowerDashboardRoute(app);
};

module.exports = route;