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


const getLastDate = async (req, res) => {
    const company_id = parseInt(req.params.company_id); // convert string to integer
    try {
        const data = await dataCenterDashboard.getLastDate(company_id);
        if (!data) {
            return res.status(404).send('Month or year not found.');
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Year: Internal Server Error.');
    }

};

const getLastDateByDataCenter = async (req, res) => {
    const company_id = parseInt(req.params.company_id); // convert string to integer
    try {
        const data = await dataCenterDashboard.getLastDateByDataCenter(company_id);
        if (!data) {
            return res.status(404).send('Month or year not found.');
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Year: Internal Server Error.');
    }

};




const getTotalEnergyConsumptionByCompanyId = async (req, res) => {
    const company_id = parseInt(req.params.company_id);

    if (!company_id) {
        return res.status(400).send("company_id is required.");
    }

    try {
        const totalEnergyConsumption = await dataCenterDashboard.getTotalEnergyConsumptionByCompanyId(company_id);
        if (totalEnergyConsumption === null) {
            return res.status(404).send("No energy consumption data found for this company.");
        }
        res.status(200).json({ total_energy_consumption: totalEnergyConsumption });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve total energy consumption data: Internal Server Error.");
    }
};

const getTotalEnergyConsumptionByDataCenterId = async (req, res) => {
    const dataCenterId = parseInt(req.params.dataCenterId);

    if (!dataCenterId) {
        return res.status(400).send("dataCenterId is required.");
    }

    try {
        const totalEnergyConsumption = await dataCenterDashboard.getTotalEnergyConsumptionByDataCenterId(dataCenterId);
        if (totalEnergyConsumption === null) {
            return res.status(404).send("No energy consumption data found for this data center.");
        }
        res.status(200).json({ total_energy_consumption: totalEnergyConsumption });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve total energy consumption data: Internal Server Error.");
    }
};

const getTotalEnergyConsumptionByDataCenterIdAndDate = async (req, res) => {
    const dataCenterId = parseInt(req.params.dataCenterId);
    const date = req.query.date;

    if (!dataCenterId || !date) {
        return res.status(400).send("dataCenterId and date (in YYYY-MM-DD format) are required.");
    }

    try {
        const lastDate = await dataCenterDashboard.getLastDateByDataCenter(dataCenterId);
        const providedDate = new Date(date);
        const lastDateInDb = new Date(lastDate);

        let startDate, endDate;

        if (providedDate.getTime() === lastDateInDb.getTime()) {
            startDate = new Date(providedDate);
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = providedDate;
        } else {
            startDate = providedDate;
            endDate = new Date(providedDate);
            endDate.setMonth(endDate.getMonth() + 1);
        }

        const totalEnergyConsumption = await dataCenterDashboard.getTotalEnergyConsumptionByDataCenterIdAndDate(
            dataCenterId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );

        if (totalEnergyConsumption === null) {
            return res.status(404).send("No energy consumption data found for this data center in the specified date range.");
        }
        res.status(200).json({ total_energy_consumption: totalEnergyConsumption });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve total energy consumption data: Internal Server Error.");
    }
};

const getTotalEnergyConsumptionByCompanyIdAndDate = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    const date = req.query.date;

    if (!company_id || !date) {
        return res.status(400).send("company_id and date (in YYYY-MM-DD format) are required.");
    }

    try {
        const lastDate = await dataCenterDashboard.getLastDate(company_id);
        const providedDate = new Date(date);
        const lastDateInDb = new Date(lastDate);

        let startDate, endDate;

        if (providedDate.getTime() === lastDateInDb.getTime()) {
            startDate = new Date(providedDate);
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = providedDate;
        } else {
            startDate = providedDate;
            endDate = new Date(providedDate);
            endDate.setMonth(endDate.getMonth() + 1);
        }

        const totalEnergyConsumption = await dataCenterDashboard.getTotalEnergyConsumptionByCompanyIdAndDate(
            company_id,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );

        if (totalEnergyConsumption === null) {
            return res.status(404).send("No energy consumption data found for this company in the specified date range.");
        }
        res.status(200).json({ total_energy_consumption: totalEnergyConsumption });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve total energy consumption data: Internal Server Error.");
    }
};






// purpose: if user selects ALL DATA CENTER, it shows all the production and usage from the start til the end
const getAllEnergyConsumptionByCompanyId = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    try {
        const data = await dataCenterDashboard.getAllEnergyConsumptionByCompanyId(company_id);
        if (!data) {
            return res.status(404).send("Energy Consumption Data not found.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Energy Consumption Data: Internal Server Error.');
    }
};

// purpose: if user doesnt select all data center, there will options of data center for user to select which one to see for comparison
const getAllEnergyConsumptionByDataCenterId = async (req, res) => {
    const dataCenterId = parseInt(req.params.dataCenterId);
    try {
        const data = await dataCenterDashboard.getAllEnergyConsumptionByDataCenterId(dataCenterId);
        if (!data) {
            return res.status(404).send("Energy Consumption Data not found.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve Energy Consumption Data: Internal Server Error.');
    }
};

const getAllEnergyConsumptionByDataCenterIdAndDate = async (req, res) => {
    const dataCenterId = parseInt(req.params.dataCenterId);
    const date = req.query.date; // Expecting date in 'YYYY-MM-DD' format

    if (!dataCenterId || !date) {
        return res.status(400).send("dataCenterId and date (in YYYY-MM-DD format) are required.");
    }

    try {
        // Retrieve the latest date in the database for comparison
        const lastDate = await dataCenterDashboard.getLastDateByDataCenter(dataCenterId);
        const providedDate = new Date(date);
        const lastDateInDb = new Date(lastDate);

        let startDate, endDate;

        // Check if the provided date matches the last date in the database
        if (providedDate.getTime() === lastDateInDb.getTime()) {
            // If it's the last date, get the same day of the previous month
            startDate = new Date(providedDate);
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = providedDate;
        } else {
            // Otherwise, get the date range from the provided date to one month later
            startDate = providedDate;
            endDate = new Date(providedDate);
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Call the model function to fetch data within the computed date range
        const data = await dataCenterDashboard.getEnergyConsumptionByDataCenterIdAndDate(dataCenterId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);

        if (!data) {
            return res.status(404).send("No energy consumption data found for this data center in the specified date range.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getAllEnergyConsumptionByDataCenterIdAndDate:", error);
        res.status(500).send("Failed to retrieve energy consumption data: Internal Server Error.");
    }
};

const getAllEnergyConsumptionByCompanyIdAndDate = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    const date = req.query.date; // Expecting date in 'YYYY-MM-DD' format

    if (!company_id || !date) {
        console.log("Missing company_id or date parameters.");
        return res.status(400).send("company_id and date (in YYYY-MM-DD format) are required.");
    }

    try {
        // Retrieve the latest date in the database for comparison
        const lastDate = await dataCenterDashboard.getLastDate(company_id);
        const providedDate = new Date(date);
        const lastDateInDb = new Date(lastDate);

        let startDate, endDate;

        // Check if the provided date matches the last date in the database
        if (providedDate.getTime() === lastDateInDb.getTime()) {
            // If it's the last date, get the same day of the previous month
            startDate = new Date(providedDate);
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = providedDate;
        } else {
            // Otherwise, get the date range from the provided date to one month later
            startDate = providedDate;
            endDate = new Date(providedDate);
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Call the model function to fetch data within the computed date range
        const data = await dataCenterDashboard.getAllEnergyConsumptionByCompanyIdAndDate(company_id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);

        if (!data) {
            return res.status(404).send("No energy consumption data found for this company in the specified date range.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getAllEnergyConsumptionByCompanyIdAndDate:", error);
        res.status(500).send("Failed to retrieve energy consumption data: Internal Server Error.");
    }
};















const getTotalCarbonEmissionByCompanyId = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    try {
        const totalCO2Emissions = await dataCenterDashboard.getTotalCarbonEmissionByCompanyId(company_id);
        if (totalCO2Emissions === null) {
            return res.status(404).send("No Carbon Emission data found for this company.");
        }
        res.status(200).json({ total_co2_emissions: totalCO2Emissions });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve total Carbon Emission data: Internal Server Error.");
    }
};



const getTotalCarbonEmissionByDataCenterId = async (req, res) => {
    const data_center_id = parseInt(req.params.data_center_id);
    try {
        const totalCO2Emissions = await dataCenterDashboard.getTotalCarbonEmissionByDataCenterId(data_center_id);
        if (totalCO2Emissions === null) {
            return res.status(404).send("No Carbon Emission data found for this data center.");
        }
        res.status(200).json({ total_co2_emissions: totalCO2Emissions });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve total Carbon Emission data: Internal Server Error.");
    }
};




const getTotalCarbonEmissionByCompanyIdAndDate = async (req, res) => {
    const companyId = parseInt(req.params.company_id);
    const date = req.query.date; // Expecting date in 'YYYY-MM-DD' format

    if (!companyId || !date) {
        return res.status(400).send("companyId and date (in YYYY-MM-DD format) are required.");
    }

    try {
        // Retrieve the latest date in the database for comparison
        const lastDate = await dataCenterDashboard.getLastDate(companyId);
        const providedDate = new Date(date);
        const lastDateInDb = new Date(lastDate);

        let startDate, endDate;

        // Check if the provided date matches the last date in the database
        if (providedDate.getTime() === lastDateInDb.getTime()) {
            // If it's the last date, get the same day of the previous month
            startDate = new Date(providedDate);
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = providedDate;
        } else {
            // Otherwise, get the date range from the provided date to one month later
            startDate = providedDate;
            endDate = new Date(providedDate);
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Call the model function to fetch total emissions within the computed date range
        const totalCO2Emissions = await dataCenterDashboard.getTotalCarbonEmissionByCompanyIdAndDate(companyId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);

        if (totalCO2Emissions === null) {
            return res.status(404).send("No Carbon Emission data found for this company in the specified date range.");
        }
        res.status(200).json({ total_co2_emissions: totalCO2Emissions });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve total Carbon Emission data: Internal Server Error.");
    }
};



const getTotalCarbonEmissionByDataCenterIdAndDate = async (req, res) => {
    const data_center_id = parseInt(req.params.data_center_id);
    const date = req.query.date; // Expecting date in 'YYYY-MM-DD' format

    if (!data_center_id || !date) {
        return res.status(400).send("data_center_id and date (in YYYY-MM-DD format) are required.");
    }

    try {
        // Retrieve the latest date in the database for comparison
        const lastDate = await dataCenterDashboard.getLastDateByDataCenter(data_center_id);
        const providedDate = new Date(date);
        const lastDateInDb = new Date(lastDate);

        let startDate, endDate;

        // Check if the provided date matches the last date in the database
        if (providedDate.getTime() === lastDateInDb.getTime()) {
            // If it's the last date, get the same day of the previous month
            startDate = new Date(providedDate);
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = providedDate;
        } else {
            // Otherwise, get the date range from the provided date to one month later
            startDate = providedDate;
            endDate = new Date(providedDate);
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Call the model function to fetch total emissions within the computed date range
        const totalCO2Emissions = await dataCenterDashboard.getTotalCarbonEmissionByDataCenterIdAndDate(data_center_id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);

        if (totalCO2Emissions === null) {
            return res.status(404).send("No Carbon Emission data found for this data center in the specified date range.");
        }
        res.status(200).json({ total_co2_emissions: totalCO2Emissions });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve total Carbon Emission data: Internal Server Error.");
    }
};














const getAllCarbonEmissionByCompanyId = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    try {
        const data = await dataCenterDashboard.getAllCarbonEmissionByCompanyId(company_id);
        if (!data) {
            return res.status(404).send("No Carbon Emission data found.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve Carbon Emission data: Internal Server Error.");
    }
};



const getAllCarbonEmissionByDataCenterId = async (req, res) => {
    const data_center_id = parseInt(req.params.data_center_id);
    try {
        const data = await dataCenterDashboard.getAllCarbonEmissionByDataCenterId(data_center_id);
        if (!data) {
            return res.status(404).send("No Carbon Emission data found.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve Carbon Emission data: Internal Server Error.");
    }
};

const getAllCarbonEmissionByCompanyIdAndDate = async (req, res) => {
    const companyId = parseInt(req.params.company_id);
    const date = req.query.date; // Expecting date in 'YYYY-MM-DD' format

    if (!companyId || !date) {
        return res.status(400).send("companyId and date (in YYYY-MM-DD format) are required.");
    }

    try {
        // Retrieve the latest date in the database for comparison
        const lastDate = await dataCenterDashboard.getLastDate(companyId);

        // Parse the provided date and last date for comparison
        const providedDate = new Date(date);
        const lastDateInDb = new Date(lastDate);

        let startDate, endDate;
        
        // Check if the provided date matches the last date in the database
        if (providedDate.getTime() === lastDateInDb.getTime()) {
            // If it's the last date, get the same day of the previous month
            startDate = new Date(providedDate);
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = providedDate;
        } else {
            // Otherwise, get the date range from the provided date to one month later
            startDate = providedDate;
            endDate = new Date(providedDate);
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Call the model function to fetch data within the computed date range
        const data = await dataCenterDashboard.getAllCarbonEmissionByCompanyIdAndDate(companyId, startDate, endDate);

        if (!data) {
            return res.status(404).send("No carbon emission data found for this company in the specified date range.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve carbon emission data: Internal Server Error.");
    }
};

const getAllCarbonEmissionByDataCenterAndDate = async (req, res) => {
    const dataCenterId = parseInt(req.params.data_center_id);
    const date = req.query.date; // Expecting date in 'YYYY-MM-DD' format

    if (!dataCenterId || !date) {
        return res.status(400).send("data_center_id and date (in YYYY-MM-DD format) are required.");
    }

    try {
        // Retrieve the latest date in the database for comparison
        const lastDate = await dataCenterDashboard.getLastDateByDataCenter(dataCenterId);

        const providedDate = new Date(date);
        const lastDateInDb = new Date(lastDate);

        let startDate, endDate;

        if (providedDate.getTime() === lastDateInDb.getTime()) {
            startDate = new Date(providedDate);
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = providedDate;
        } else {
            startDate = providedDate;
            endDate = new Date(providedDate);
            endDate.setMonth(endDate.getMonth() + 1);
        }

        const data = await dataCenterDashboard.getAllCarbonEmissionByDataCenterAndDate(dataCenterId, startDate, endDate);

        if (!data) {
            return res.status(404).send("No carbon emission data found for this data center in the specified date range.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve carbon emission data: Internal Server Error.");
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
    getLastDate,
    getLastDateByDataCenter,

    getTotalEnergyConsumptionByCompanyId,
    getTotalEnergyConsumptionByDataCenterId ,
    getTotalEnergyConsumptionByDataCenterIdAndDate,
    getTotalEnergyConsumptionByCompanyIdAndDate,

    getAllEnergyConsumptionByCompanyId, // if never apply any filter = will view all data center of all times
    getAllEnergyConsumptionByDataCenterId, // if user apply data center filter but no date
    getAllEnergyConsumptionByDataCenterIdAndDate, // if user applies both data center and date filter
    getAllEnergyConsumptionByCompanyIdAndDate,  // if user select date, and no all data center


    getTotalCarbonEmissionByCompanyId,
    getTotalCarbonEmissionByDataCenterId,
    getTotalCarbonEmissionByCompanyIdAndDate,
    getTotalCarbonEmissionByDataCenterIdAndDate,

    getAllCarbonEmissionByCompanyId, // if all data center and no date
    getAllCarbonEmissionByDataCenterId, // if specified data center and no date
    getAllCarbonEmissionByCompanyIdAndDate, // if user selects date and all data center
    getAllCarbonEmissionByDataCenterAndDate,



    getAllSustainabilityGoalsData
}