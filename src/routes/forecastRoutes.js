const forecastController = require("../controllers/forecastController.js")

// Create routes
const forecastRoute = (app) => {
    app.post("/Dashboard/Forecast/holt-linear/:forecastPeriods", forecastController.holtLinear)
}

module.exports = forecastRoute