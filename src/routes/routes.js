const userRoute = require("./userRoute.js");
const reportRoute = require('./reportRoute');
const dataCenterDashboardRoute = require('./dataCenterDashboardRoute.js');

const route = (app) => {
    userRoute(app);
    reportRoute(app);
    dataCenterDashboardRoute(app);
};

module.exports = route;