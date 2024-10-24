const userRoute = require("./userRoute.js");
const reportRoute = require('./reportRoute');

const route = (app) => {
    userRoute(app);
    reportRoute(app);
};

module.exports = route;