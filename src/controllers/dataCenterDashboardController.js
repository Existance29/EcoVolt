const dataCenterDashboard = require('../models/dataCenterDashboard');




const getAllDataCenter = async (req, res) => {
    const company_id = parseInt(req.params.company_id); // convert string to integer
    try {
        const data = await dataCenterDashboard.getAllDataCenter(company_id);
        if (!data) {
            return res.status(400).send("No Data Centers found.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Data Centers: Internal Server Error.');
    }
}


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



// purpose: if user selects ALL DATA CENTER, it shows all the production and usage from the start til the end
const getAllEnergyConsumptionByCompanyId = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    try {
        const data = await dataCenterDashboard.getAllEnergyConsumptionByCompanyId(company_id);
        if(!data) {
            return res.status(404).send("Energy Consumption Data not found.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Energy Consumption Data: Internal Server Error.');
    }
}

// purpose: if user doesnt select all data center, there will options of data center for user to select which one to see for comparison
const getAllEnergyConsumptionByDataCenterId = async (req, res) => {
    const dataCenterId = parseInt(req.params.dataCenterId);
    try {
        const data = await dataCenterDashboard.getAllEnergyConsumptionByDataCenterId(dataCenterId);
        if(!data) {
            return res.status(404).send("Energy Consumption Data not found.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Energy Consumption Data: Internal Server Error.');
    }
}

// what if user selects both date and data center?
// ideally, i would want the selections of data center below the donut chart to be gone and it only focuses on the particular month that was selected and the data center that was selected
const getAllEnergyConsumptionByDataCenterIdAndDate = async (req, res) => {
    const dataCenterId = parseInt(req.params.dataCenterId);
    const date = req.query.date; // Expecting date in 'YYYY-MM-DD' format

    // Check if dataCenterId and date are provided
    if (!dataCenterId || !date) {
        return res.status(400).send("dataCenterId and date (in YYYY-MM-DD format) are required.");
    }

    try {
        // Parse the date parameter
        const parsedDate = new Date(date);
        const month = parsedDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
        const year = parsedDate.getFullYear();

        // Call the model function to fetch data by dataCenterId, month, and year
        const data = await dataCenterDashboard.getEnergyConsumptionByDataCenterIdAndDate(dataCenterId, month, year);
        if (!data) {
            return res.status(404).send("No energy consumption data found for this data center on the specified date.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve energy consumption data: Internal Server Error.");
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


module.exports = {
    getAllDataCenter,
    getAllMonthAndYear,
    
    getAllEnergyConsumptionByCompanyId,
    getAllEnergyConsumptionByDataCenterId,
    getAllEnergyConsumptionByDataCenterIdAndDate,




    getAllSustainabilityGoalsData
}