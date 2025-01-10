const forecast = require("../models/forecast.js");
class forecastController{
    static async holtLinear(req, res, next) {
        const {data} = req.body
        const forecastPeriods = parseInt(req.params.forecastPeriods)
        //validate body
        if (!data){
            res.status(400).send("no data provided")
            return
        }

        try {
            const timeSeries = JSON.parse(data)
            res.status(201).json(forecast.holtLinear(timeSeries, forecastPeriods));
        } catch (error) {
            console.error(error);
            res.status(500).send("Error with holt linear forecast")
        }
    }

}

module.exports = forecastController