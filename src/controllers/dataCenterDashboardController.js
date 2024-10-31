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

// what if user selects both date and data center?
// ideally, i would want the selections of data center below the donut chart to be gone and it only focuses on the particular month that was selected and the data center that was selected
const getAllEnergyConsumptionByDataCenterIdAndDate = async (req, res) => {
    const dataCenterId = parseInt(req.params.dataCenterId);
    const date = req.query.date;

    if (!dataCenterId || !date) {
        return res.status(400).send("dataCenterId and date (in YYYY-MM-DD format) are required.");
    }

    try {
        const parsedDate = new Date(date);
        const month = parsedDate.getMonth() + 1;
        const year = parsedDate.getFullYear();
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


const getAllEnergyConsumptionByCompanyIdAndDate = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    const date = req.query.date;

    if (!company_id || !date) {
        console.log("Missing company_id or date parameters.");
        return res.status(400).send("company_id and date (in YYYY-MM-DD format) are required.");
    }

    try {
        const parsedDate = new Date(date);
        const month = parsedDate.getMonth() + 1;
        const year = parsedDate.getFullYear();

        const data = await dataCenterDashboard.getAllEnergyConsumptionByCompanyIdAndDate(company_id, month, year);
        if (!data) {
            console.log("No energy consumption data found for company ID:", company_id, "on date:", date);
            return res.status(404).send("No energy consumption data found for this company on the specified date.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getAllEnergyConsumptionByCompanyIdAndDate:", error);
        res.status(500).send("Failed to retrieve energy consumption data: Internal Server Error.");
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




// const getAllCarbonEmissionByDataCenterAndDate = async (req, res) => {
//     const data_center_id = parseInt(req.params.data_center_id);
//     const { start_date, end_date } = req.query;
//     try {
//         const data = await dataCenterDashboard.getAllCarbonEmissionByDateAndDataCenter(data_center_id, start_date, end_date);
//         if (!data) {
//             return res.status(404).send("No Carbon Emission data found for the specified data center and date range.");
//         }
//         res.status(200).json(data);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Failed to retrieve Carbon Emission data: Internal Server Error.");
//     }
// };

const getAllCarbonEmissionByCompanyIdAndDate = async (req, res) => {
    const companyId = parseInt(req.params.companyId);
    const date = req.query.date; // Expecting date in 'YYYY-MM-DD' format

    // Check if companyId and date are provided
    if (!companyId || !date) {
        return res.status(400).send("companyId and date (in YYYY-MM-DD format) are required.");
    }

    try {
        // Parse the date parameter
        const parsedDate = new Date(date);
        const month = parsedDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
        const year = parsedDate.getFullYear();

        // Call the model function to fetch data by companyId, month, and year
        const data = await dataCenterDashboard.getAllCarbonEmissionByCompanyIdAndDate(companyId, month, year);
        if (!data) {
            return res.status(404).send("No carbon emission data found for this company on the specified date.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve carbon emission data: Internal Server Error.");
    }
};


const getAllSumOfCarbonEmissionByCompanyId = async (req, res) => {
    const companyId = parseInt(req.params.company_id);
    // Check if companyId is provided
    if (!companyId) {
        return res.status(400).send("companyId is required.");
    }
    try {
        const data = await dataCenterDashboard.getAllSumOfCarbonEmissionByCompanyId(companyId);
        
        if (!data) {
            return res.status(404).send("No carbon emission data found for this company.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve total carbon emission data: Internal Server Error.");
    }
};


const getAllSumOfCarbonEmissionByCompanyIdAndDate = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    const date = req.query.date; // Expecting date in 'YYYY-MM-DD' format    
    // Check if company_id is provided
    if (!company_id) {
        return res.status(400).send("company_id is required.");
    }
    // Check if date is provided and valid
    if (!date) {
        return res.status(400).send("date (in YYYY-MM-DD format) is required.");
    }
    try {
        // Call the model function to fetch data by company_id and date
        const data = await dataCenterDashboard.getAllSumOfCarbonEmissionByCompanyIdAndDate(company_id, date);
        
        if (!data) {
            return res.status(404).send("No carbon emission data found for this company on the specified date.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching carbon emission data:", error.message);
        res.status(500).send("Failed to retrieve carbon emission data: Internal Server Error.");
    }
};


const getAllSumOfCarbonEmissionByCompanyIdAndDataCenter = async (req, res) => {
    const company_id = parseInt(req.params.company_id);
    const data_center_id = parseInt(req.params.data_center_id);

    if (!company_id || !data_center_id) {
        return res.status(400).send("company_id and data_center_id are required.");
    }

    try {
        const data = await dataCenterDashboard.getAllSumOfCarbonEmissionByCompanyIdAndDataCenter(company_id, data_center_id);
        
        if (!data) {
            return res.status(404).send("No carbon emission data found for the specified company and data center.");
        }

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to retrieve carbon emission data: Internal Server Error.");
    }
};

const getAllSumOfCarbonEmissionByCompanyIdAndDataCenterAndDate = async (req, res) => {
    const { company_id, data_center_id } = req.params;
    const date = req.query.date; // Retrieve date from query parameters

    console.log("hi");

    // Validate inputs
    if (!company_id || !data_center_id || !date) {
        return res.status(400).send("company_id, data_center_id, and date are required.");
    }

    try {
        // Fetch data from the model
        const data = await dataCenterDashboard.getAllSumOfCarbonEmissionByCompanyIdAndDataCenterAndDate(company_id, data_center_id, date);
        if (!data) {
            return res.status(404).send("No data found for this company, data center, and date.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching emissions data:", error);
        res.status(500).send("Internal Server Error.");
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

    getAllEnergyConsumptionByCompanyId, // if never apply any filter = will view all data center of all times
    getAllEnergyConsumptionByDataCenterId, // if user apply data center filter but no date
    getAllEnergyConsumptionByDataCenterIdAndDate, // if user applies both data center and date filter
    getAllEnergyConsumptionByCompanyIdAndDate,  // if user select date, and no all data center


    getAllCarbonEmissionByCompanyId, // if all data center and no date
    getAllCarbonEmissionByDataCenterId, // if specified data center and no date
    // getAllCarbonEmissionByDataCenterAndDate, // if specified date and data center
    getAllCarbonEmissionByCompanyIdAndDate, // if user selects date and all data center



    getAllSumOfCarbonEmissionByCompanyId,
    getAllSumOfCarbonEmissionByCompanyIdAndDate,
    getAllSumOfCarbonEmissionByCompanyIdAndDataCenter,
    getAllSumOfCarbonEmissionByCompanyIdAndDataCenterAndDate,


    getAllSustainabilityGoalsData
}