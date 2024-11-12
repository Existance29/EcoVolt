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


const getAllDates = async (req, res) => {
    const dc = req.params.dc ? parseInt(req.params.dc) : null;
    const company_id = parseInt(req.params.company_id);
    if (!company_id) {
        return res.status(400).send("company_id is required.");
    }

    try {
        let dates;
        if (dc) {
            dates = await dataCenterDashboard.getAvailDatesByCompanyIdandDc(company_id, dc);
        } else {
            dates = await dataCenterDashboard.getAvailDatesByCompanyId(company_id);
        }

        if (!dates || dates.length === 0) {
            return res.status(404).send("No available dates found.");
        }

        res.status(200).json(dates);
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve dates: Internal Server Error.");
    }
};



// --------------------------------------------------------------------------------------------------- fix
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
    const dataCenterId = parseInt(req.params.data_center_id);

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

const getTotalEnergyConsumptionByDataCenterIdAndDate = async (req, res) => { // wrong need change
    const dataCenterId = parseInt(req.params.data_center_id);
    const date = req.query.date;

    if (!dataCenterId || !date) {
        return res.status(400).send("dataCenterId and date (in YYYY-MM or YYYY format) are required.");
    }

    try {
        let totalEnergyConsumption;
        const [year, month] = date.split('-');

        if (month) {
            // If month is provided, get monthly total energy consumption
            totalEnergyConsumption = await dataCenterDashboard.getTotalEnergyConsumptionByDataCenterIdAndYearMonth(
                dataCenterId,
                parseInt(year),
                parseInt(month)
            );
        } else {
            // If only year is provided, get yearly total energy consumption
            totalEnergyConsumption = await dataCenterDashboard.getTotalEnergyConsumptionByDataCenterIdAndYear(
                dataCenterId,
                parseInt(year)
            );
        }

        if (totalEnergyConsumption === null) {
            return res.status(404).send("No energy consumption data found for this data center in the specified date range.");
        }
        res.status(200).json({ total_energy_consumption: totalEnergyConsumption });
    } catch (error) {
        console.error("Error in getTotalEnergyConsumptionByDataCenterIdAndDate:", error.message);
        res.status(500).send("Failed to retrieve total energy consumption data: Internal Server Error.");
    }
};

const getTotalEnergyConsumptionByCompanyIdAndDate = async (req, res) => { // wrong need change // not passing thru back end 
    const company_id = parseInt(req.params.company_id);
    const date = req.query.date;

    if (!company_id || !date) {
        return res.status(400).send("company_id and date (in YYYY-MM or YYYY format) are required.");
    }

    try {
        let totalEnergyConsumption;
        const [year, month] = date.split('-');

        if (month) {
            // If month is provided, get monthly total energy consumption
            totalEnergyConsumption = await dataCenterDashboard.getTotalEnergyConsumptionByCompanyIdAndYearAndMonth(
                company_id,
                parseInt(year),
                parseInt(month)
            );
        } else {
            // If only year is provided, get yearly total energy consumption
            totalEnergyConsumption = await dataCenterDashboard.getTotalEnergyConsumptionByCompanyIdAndYear(
                company_id,
                parseInt(year)
            );
        }
        if (totalEnergyConsumption === null) {
            return res.status(404).send("No energy consumption data found for this company in the specified date range.");
        }
        res.status(200).json({ total_energy_consumption: totalEnergyConsumption });
    } catch (error) {
        console.error("Error in getTotalEnergyConsumptionByCompanyIdAndDate:", error.message);
        res.status(500).send("Failed to retrieve total energy consumption data: Internal Server Error.");
    }
};
// --------------------------------------------------------------------------------------------------- fix





// --------------------------------------------------------------------------------------------------- fix
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
    const dataCenterId = parseInt(req.params.data_center_id);
    try {
        const data = await dataCenterDashboard.getAllEnergyConsumptionByDataCenterId(dataCenterId);
        // console.log(data);
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
    const dataCenterId = parseInt(req.params.data_center_id);
    const date = req.query.date;

    if (!dataCenterId || !date) {
        return res.status(400).send("dataCenterId and date (in YYYY-MM or YYYY format) are required.");
    }

    try {
        let data;
        const [year, month] = date.split('-');

        if (month) {
            // Call model function for specific year and month data
            data = await dataCenterDashboard.getEnergyConsumptionByDataCenterIdAndYearMonth(
                dataCenterId,
                parseInt(year),
                parseInt(month)
            );
        } else {
            // Call model function for specific year data
            data = await dataCenterDashboard.getEnergyConsumptionByDataCenterIdAndYear(
                dataCenterId,
                parseInt(year)
            );
        }

        if (!data) {
            return res.status(404).send("No energy consumption data found for this data center in the specified date range.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getAllEnergyConsumptionByDataCenterIdAndDate:", error.message);
        res.status(500).send("Failed to retrieve energy consumption data: Internal Server Error.");
    }
};

const getAllEnergyConsumptionByCompanyIdAndDate = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    const date = req.query.date;

    if (!company_id || !date) {
        console.log("Missing company_id or date parameters.");
        return res.status(400).send("company_id and date (in YYYY-MM or YYYY format) are required.");
    }

    try {
        let data;
        const [year, month] = date.split('-');

        // Check for correct date format: YYYY or YYYY-MM
        if (date.length === 4) { // Format: YYYY
            // Fetch data for the specified year
            data = await dataCenterDashboard.getAllEnergyConsumptionByCompanyIdAndYear(
                company_id,
                parseInt(year)
            );
        } else if (date.length === 7) { // Format: YYYY-MM
            // Fetch data for the specified year and month
            data = await dataCenterDashboard.getAllEnergyConsumptionByCompanyIdAndYearMonth(
                company_id,
                parseInt(year),
                parseInt(month)
            );
        } else {
            console.log("Invalid date format.");
            return res.status(400).send("Invalid date format. Use YYYY or YYYY-MM.");
        }

        if (!data) {
            return res.status(404).send("No energy consumption data found for this company in the specified date range.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getAllEnergyConsumptionByCompanyIdAndDate:", error.message);
        res.status(500).send("Failed to retrieve energy consumption data: Internal Server Error.");
    }
};

// --------------------------------------------------------------------------------------------------- fix












// --------------------------------------------------------------------------------------------------- fix
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
    const date = req.query.date;
    if (!companyId || !date) {
        return res.status(400).send("companyId and date (in YYYY-MM or YYYY format) are required.");
    }

    try {
        let totalCO2Emissions;
        const [year, month] = date.split('-');

        if (month) {
            // If month is provided, get data by year and month
            totalCO2Emissions = await dataCenterDashboard.getTotalCarbonEmissionByCompanyIdAndYearMonth(
                companyId,
                parseInt(year),
                parseInt(month)
            );
        } else {
            // If only year is provided, get data by year
            totalCO2Emissions = await dataCenterDashboard.getTotalCarbonEmissionByCompanyIdAndYear(
                companyId,
                parseInt(year)
            );
        }
        if (totalCO2Emissions === null) {
            return res.status(404).send("No Carbon Emission data found for this company in the specified date range.");
        }
        res.status(200).json({ total_co2_emissions: totalCO2Emissions });
    } catch (error) {
        console.error("Error in getTotalCarbonEmissionByCompanyIdAndDate:", error.message);
        res.status(500).send("Failed to retrieve total Carbon Emission data: Internal Server Error.");
    }
};

const getTotalCarbonEmissionByDataCenterIdAndDate = async (req, res) => {
    const data_center_id = parseInt(req.params.data_center_id);
    const date = req.query.date;

    if (!data_center_id || !date) {
        return res.status(400).send("data_center_id and date (in YYYY-MM or YYYY format) are required.");
    }

    try {
        let totalCO2Emissions;
        const [year, month] = date.split('-');

        if (month) {
            // If month is provided, get data by year and month
            totalCO2Emissions = await dataCenterDashboard.getTotalCarbonEmissionByDataCenterIdAndYearMonth(
                data_center_id,
                parseInt(year),
                parseInt(month)
            );
        } else {
            // If only year is provided, get data by year
            totalCO2Emissions = await dataCenterDashboard.getTotalCarbonEmissionByDataCenterIdAndYear(
                data_center_id,
                parseInt(year)
            );
        }
        if (totalCO2Emissions === null) {
            return res.status(404).send("No Carbon Emission data found for this data center in the specified date range.");
        }
        res.status(200).json({ total_co2_emissions: totalCO2Emissions });
    } catch (error) {
        console.error("Error in getTotalCarbonEmissionByDataCenterIdAndDate:", error.message);
        res.status(500).send("Failed to retrieve total Carbon Emission data: Internal Server Error.");
    }
};
// --------------------------------------------------------------------------------------------------- fix










// --------------------------------------------------------------------------------------------------- fix
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
    const date = req.query.date;

    if (!companyId || !date) {
        return res.status(400).send("companyId and date (in YYYY-MM or YYYY format) are required.");
    }

    try {
        let data;
        const [year, month] = date.split('-');

        if (month) {
            // Call model function for data by year and month
            data = await dataCenterDashboard.getAllCarbonEmissionByCompanyIdAndYearMonth(
                companyId,
                parseInt(year),
                parseInt(month)
            );
        } else {
            // Call model function for data by year only
            data = await dataCenterDashboard.getAllCarbonEmissionByCompanyIdAndYear(
                companyId,
                parseInt(year)
            );
        }

        if (!data) {
            return res.status(404).send("No carbon emission data found for this company in the specified date range.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getAllCarbonEmissionByCompanyIdAndDate:", error.message);
        res.status(500).send("Failed to retrieve carbon emission data: Internal Server Error.");
    }
};

const getAllCarbonEmissionByDataCenterAndDate = async (req, res) => {
    const dataCenterId = parseInt(req.params.data_center_id);
    const date = req.query.date;

    if (!dataCenterId || !date) {
        return res.status(400).send("data_center_id and date (in YYYY-MM or YYYY format) are required.");
    }

    try {
        let data;
        const [year, month] = date.split('-');

        if (month) {
            // Call model function for data by year and month
            data = await dataCenterDashboard.getAllCarbonEmissionByDataCenterAndYearMonth(
                dataCenterId,
                parseInt(year),
                parseInt(month)
            );
        } else {
            // Call model function for data by year only
            data = await dataCenterDashboard.getAllCarbonEmissionByDataCenterAndYear(
                dataCenterId,
                parseInt(year)
            );
        }

        if (!data) {
            return res.status(404).send("No carbon emission data found for this data center in the specified date range.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getAllCarbonEmissionByDataCenterAndDate:", error.message);
        res.status(500).send("Failed to retrieve carbon emission data: Internal Server Error.");
    }
};
// --------------------------------------------------------------------------------------------------- fix






// --------------------------------------------------------------------------------------------------- fix
// Controller function to get total renewable energy contribution by company ID
const getTotalRenewableEnergyByCompanyId = async (req, res) => {
    const company_id = parseInt(req.params.company_id);

    if (!company_id) {
        return res.status(400).send("company_id is required.");
    }

    try {
        const totalRenewableEnergy = await dataCenterDashboard.getTotalRenewableEnergyByCompanyId(company_id);

        if (totalRenewableEnergy === null) {
            return res.status(404).send("No renewable energy data found for this company.");
        }

        res.status(200).json({ total_renewable_energy: totalRenewableEnergy });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve total renewable energy contribution: Internal Server Error.");
    }
};

const getTotalRenewableEnergyByDataCenterId = async (req, res) => {
    const data_center_id = parseInt(req.params.data_center_id);

    if (!data_center_id) {
        return res.status(400).send("data_center_id is required.");
    }

    try {
        const totalRenewableEnergy = await dataCenterDashboard.getTotalRenewableEnergyByDataCenterId(data_center_id);

        if (totalRenewableEnergy === null) {
            return res.status(404).send("No renewable energy data found for this data center.");
        }

        res.status(200).json({ total_renewable_energy: totalRenewableEnergy });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve total renewable energy contribution: Internal Server Error.");
    }
};

const getTotalRenewableEnergyByDataCenterIdAndDate = async (req, res) => {
    const data_center_id = parseInt(req.params.data_center_id);
    const date = req.query.date;

    if (!data_center_id || !date) {
        return res.status(400).send("data_center_id and date (in YYYY-MM or YYYY format) are required.");
    }

    try {
        let totalRenewableEnergy;
        const [year, month] = date.split('-');

        if (month) {
            // If month is provided, get data by year and month
            totalRenewableEnergy = await dataCenterDashboard.getTotalRenewableEnergyByDataCenterIdAndYearMonth(
                data_center_id,
                parseInt(year),
                parseInt(month)
            );
        } else {
            // If only year is provided, get data by year
            totalRenewableEnergy = await dataCenterDashboard.getTotalRenewableEnergyByDataCenterIdAndYear(
                data_center_id,
                parseInt(year)
            );
        }

        if (totalRenewableEnergy === null) {
            return res.status(404).send("No renewable energy data found for this data center in the specified date range.");
        }
        res.status(200).json({ total_renewable_energy: totalRenewableEnergy });
    } catch (error) {
        console.error("Error in getTotalRenewableEnergyByDataCenterIdAndDate:", error.message);
        res.status(500).send("Failed to retrieve total renewable energy contribution: Internal Server Error.");
    }
};

const getTotalRenewableEnergyByCompanyIdAndDate = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    const date = req.query.date;

    if (!company_id || !date) {
        return res.status(400).send("company_id and date (in YYYY-MM or YYYY format) are required.");
    }

    try {
        let totalRenewableEnergy;
        const [year, month] = date.split('-');

        if (month) {
            // If month is provided, call model function for year and month
            totalRenewableEnergy = await dataCenterDashboard.getTotalRenewableEnergyByCompanyIdAndYearMonth(
                company_id,
                parseInt(year),
                parseInt(month)
            );
        } else {
            // If only year is provided, call model function for year only
            totalRenewableEnergy = await dataCenterDashboard.getTotalRenewableEnergyByCompanyIdAndYear(
                company_id,
                parseInt(year)
            );
        }

        if (totalRenewableEnergy === null) {
            return res.status(404).send("No renewable energy data found for this company in the specified date range.");
        }
        res.status(200).json({ total_renewable_energy: totalRenewableEnergy });
    } catch (error) {
        console.error("Error in getTotalRenewableEnergyByCompanyIdAndDate:", error.message);
        res.status(500).send("Failed to retrieve total renewable energy contribution: Internal Server Error.");
    }
};
// --------------------------------------------------------------------------------------------------- fix






const getEnergyConsumptionGroupByDc = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    const data_center_id = req.params.data_center_id ? parseInt(req.params.data_center_id) : null;
    const year = req.query.year ? parseInt(req.query.year) : null;
    const month = req.query.month ? parseInt(req.query.month) : null;

    try {
        let data;

        if (!year && !month && !data_center_id) {
            // All-time data for all data centers
            data = await dataCenterDashboard.getEnergyConsumptionGroupByDcForAllTime(company_id);
        } else if (year && !month && !data_center_id) {
            // Data for a specific year for all data centers (year only)
            data = await dataCenterDashboard.getEnergyConsumptionGroupByDcForYear(company_id, year);
        } else if (year && month && !data_center_id) {
            // Data for a specific year and month for all data centers
            data = await dataCenterDashboard.getEnergyConsumptionGroupByDcForSaidMonthYear(company_id, month, year);
        } else if (data_center_id && !year && !month) {
            // All-time data for a specific data center
            data = await dataCenterDashboard.getEnergyConsumptionGroupByDcForSelectedDc(company_id, data_center_id);
        } else if (data_center_id && year && !month) {
            // Data for a specific year for a specific data center
            data = await dataCenterDashboard.getEnergyConsumptionGroupByDcForSelectedDcByYear(company_id, data_center_id, year);
        } else if (data_center_id && year && month) {
            // Data for a specific month and year for a specific data center
            data = await dataCenterDashboard.getEnergyConsumptionGroupByDcForSelectedDcByYearMonth(company_id, data_center_id, year, month);
        } else {
            // Invalid parameters
            return res.status(400).send("Invalid request: please provide a valid year or both year and month.");
        }

        if (!data || data.length === 0) {
            return res.status(404).send("No energy consumption data found for the specified filters.");
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getEnergyConsumptionGroupByDc:", error.message);
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
    getAllDates,

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


    getTotalRenewableEnergyByCompanyId,
    getTotalRenewableEnergyByDataCenterId,
    getTotalRenewableEnergyByDataCenterIdAndDate,
    getTotalRenewableEnergyByCompanyIdAndDate,

    getEnergyConsumptionGroupByDc,

    getAllSustainabilityGoalsData
}