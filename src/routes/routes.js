const userRoute = require("./userRoute.js");
const reportRoute = require('./reportRoute');
const dataCenterDashboardRoute = require('./dataCenterDashboardRoute.js');
const activityRoute = require('./activityRoutes.js');
const cellTowerDashboardRoute = require("./cellTowerDashboardRoute.js");
const overviewDashboardRoute = require("./overviewRoutes.js");
const chatbotRoute = require("./chatbotRoutes.js");
const fitnessRoute = require('./fitness.js');

const route = (app) => {
    userRoute(app);
    reportRoute(app);
    dataCenterDashboardRoute(app);
    activityRoute(app);
    cellTowerDashboardRoute(app);
    overviewDashboardRoute(app);
    chatbotRoute(app);
    fitnessRoute(app);
};

module.exports = route;