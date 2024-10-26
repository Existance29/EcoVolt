const dataCenterDashboard = require('../models/dataCenterDashboard');

const getAllMonthAndYear = async (req, res) => {
    try {
        const data = await dataCenterDashboard.getAllMonthAndYear();
        if (!data) {
            return res.status(404).send('Month or year not found.');
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Year: Internal Server Error.');
    }
};

const getAllCarbonEmissionsData = async (req, res) => {
    const company_id = parseInt(req.params.company_id); // convert string to integer
    const year = req.params.year;
    const month = req.params.month;
    try {
        const data = await dataCenterDashboard.getAllCarbonEmissionsData(company_id, year, month);
        if (!data) {
            return res.status(404).send('Carbon Emissions Data not found.');
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Carbon Emissions Data: Internal Server Error.');
    }
};

const getAllSustainabilityGoalsData = async (req, res) => {
    const company_id = parseInt(req.params.company_id); // convert string to integer
    try {
        const data = await dataCenterDashboard.getAllSustainabilityGoalsData(company_id);
        if (!data) {
            return res.status(404).send('Sustainability Goals Data not found.');
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Sustainability Goals Data: Internal Server Error.');
    }
};

const getAllEnergyConsumptionData = async (req, res) => {
    const company_id = parseInt(req.params.company_id); // convert string to integer
    const year = req.params.year;
    const month = req.params.month;
    try {
        const data = await dataCenterDashboard.getAllEnergyConsumptionData(company_id, year, month);
        if (!data) {
            return res.status(404).send('Energy Consumption Data not found.');
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Energy Consumption Data: Internal Server Error.');
    }
};

module.exports = {
    getAllMonthAndYear,
    getAllCarbonEmissionsData,
    getAllSustainabilityGoalsData,
    getAllEnergyConsumptionData
}