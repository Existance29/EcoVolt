const userRoute = require("./userRoute.js");
const reportRoute = require('./reportRoute');
const dataCenterDashboardRoute = require('./dataCenterDashboardRoute.js');
const activityRoute = require('./activityRoutes.js');
const cellTowerDashboardRoute = require("./cellTowerDashboardRoute.js");
const overviewDashboardRoute = require("./overviewRoutes.js");
const chatbotRoute = require("./chatbotRoutes.js");
const fitnessRoute = require('./fitness.js');
const forecastRoute = require("./forecastRoutes.js");
const rewardRoute = require("./rewardRoute.js");
const recycleRoute = require("./recycleRoutes.js");

const route = (app) => {
    userRoute(app);
    reportRoute(app);
    dataCenterDashboardRoute(app);
    activityRoute(app);
    cellTowerDashboardRoute(app);
    overviewDashboardRoute(app);
    chatbotRoute(app);
    fitnessRoute(app);
    forecastRoute(app);
    rewardRoute(app);
    recycleRoute(app);
};

module.exports = route;