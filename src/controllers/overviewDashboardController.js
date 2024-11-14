const DashboardModel = require("../models/overviewDashboardModel");


const getDashboardSummary = async (req, res) => {
   try {
        const company_id = req.headers["company-id"]; // Retrieve company_id from request headers
        if (!company_id) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        const highestEmissions = await DashboardModel.getHighestEmissions(company_id);
        const totalEmissions = await DashboardModel.getTotalEmissions(company_id);
        const sustainabilityGoals = await DashboardModel.getSustainabilityGoals(company_id);
        const top3Companies = await DashboardModel.getTop3YearsByEmissions(company_id);
        const avoidedCemission  = await DashboardModel.getTop3CellTowersByAvoidedEmissions(company_id);

        res.status(200).json({
            highestDataCenter: highestEmissions.highestDataCenter,
            highestCellTower: highestEmissions.highestCellTower,
            totalDataCenterEmissions: totalEmissions.totalDataCenterEmissions,
            totalCellTowerEmissions: totalEmissions.totalCellTowerEmissions,
            overallTotal: totalEmissions.overallTotal,
            sustainabilityGoals,
            top3Companies,
            avoidedCemission,
        });
    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        res.status(500).json({ error: "Failed to fetch dashboard summary" });
    }
};

const getHighestEmissions = async (req, res) => {
    try {
        const company_id = getCompanyId(req);
        if (!company_id) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        const data = await DashboardModel.getHighestEmissions(company_id);
        if (!data) {
            return res.status(404).send("No highest emissions data found.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching highest emissions:", error);
        res.status(500).send("Failed to retrieve highest emissions data: Internal Server Error.");
    }
};

const getTotalEmissions = async (req, res) => {
    try {
        const company_id = getCompanyId(req);
        if (!company_id) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        const data = await DashboardModel.getTotalEmissions(company_id);
        if (!data) {
            return res.status(404).send("No total emissions data found.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching total emissions:", error);
        res.status(500).send("Failed to retrieve total emissions data: Internal Server Error.");
    }
};

const getSustainabilityGoals = async (req, res) => {
    try {
        const company_id = getCompanyId(req);
        if (!company_id) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        const data = await DashboardModel.getSustainabilityGoals(company_id);
        if (!data) {
            return res.status(404).send("No sustainability goals data found.");
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching sustainability goals:", error);
        res.status(500).send("Failed to retrieve sustainability goals: Internal Server Error.");
    }
};

const getTop3YearsByEmissions = async (req, res) => {
    try {
        const company_id = req.headers["company-id"];
        if (!company_id) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        const data = await DashboardModel.getTop3CompaniesByEmissions(company_id);
        if (!data || data.length === 0) {
            return res.status(404).json({ error: "No top companies emissions data found." });
        }
        res.status(200).json({
            data,
        });
    } catch (error) {
        console.error("Error fetching top 3 years by emissions:", error);
        res.status(500).json({ error: "Failed to retrieve top companies by emissions: Internal Server Error." });
    }
};

const getTop3CellTowersByAvoidedEmissions = async (req, res) => {
    try {
        const company_id = req.headers["company-id"];
        if (!company_id) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        const data = await DashboardModel.getTop3CellTowersByAvoidedEmissions(company_id);
        console.log("Top 3 Cell Towers by Avoided Emissions:", data); // Log the data to verify

        if (!data || data.length === 0) {
            return res.status(404).json({ error: "No data found for top 3 cell towers by avoided emissions." });
        }

        res.status(200).json({
            data,
        });
    } catch (error) {
        console.error("Error fetching top 3 cell towers by avoided emissions:", error);
        res.status(500).json({ error: "Failed to fetch data" });
    }
};

const getDashboardSummaryDataOnly = async (company_id) => {
    try {
        const highestEmissions = await DashboardModel.getHighestEmissions(company_id);
        const totalEmissions = await DashboardModel.getTotalEmissions(company_id);
        const sustainabilityGoals = await DashboardModel.getSustainabilityGoals(company_id);
        const top3Companies = await DashboardModel.getTop3YearsByEmissions(company_id);
        const avoidedEmissions = await DashboardModel.getTop3CellTowersByAvoidedEmissions(company_id);

        return {
            highestDataCenter: highestEmissions.highestDataCenter,
            highestCellTower: highestEmissions.highestCellTower,
            totalDataCenterEmissions: totalEmissions.totalDataCenterEmissions,
            totalCellTowerEmissions: totalEmissions.totalCellTowerEmissions,
            overallTotal: totalEmissions.overallTotal,
            sustainabilityGoals,
            top3Companies,
            avoidedEmissions,
        };
    } catch (error) {
        console.error("Error fetching dashboard summary data:", error);
        throw error;
    }
};




module.exports = {
    getDashboardSummary,
    getHighestEmissions,
    getTotalEmissions,
    getSustainabilityGoals,
    getTop3YearsByEmissions,
    getTop3CellTowersByAvoidedEmissions,
    getDashboardSummaryDataOnly
};
