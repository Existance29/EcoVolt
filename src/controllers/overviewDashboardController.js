const DashboardModel = require("../models/overviewDashboardModel");

const DashboardController = {
    async getDashboardSummary(req, res) {
        try {
            const highestEmissions = await DashboardModel.getHighestEmissions();
            const totalEmissions = await DashboardModel.getTotalEmissions();
            const sustainabilityGoals = await DashboardModel.getSustainabilityGoals();
            const top3Companies = await DashboardModel.getTop3CompaniesByEmissions(); // Fetch top 3 companies
            const yearlyEnergyConsumption = await DashboardModel.getYearlyEnergyConsumption();

            // Combine all data into a single response
            res.json({
                highestDataCenter: highestEmissions.highestDataCenter,
                highestCellTower: highestEmissions.highestCellTower,
                totalDataCenterEmissions: totalEmissions.totalDataCenterEmissions,
                totalCellTowerEmissions: totalEmissions.totalCellTowerEmissions,
                overallTotal: totalEmissions.overallTotal,
                sustainabilityGoals, // Include sustainability goals data
                top3Companies, // Include top 3 companies data
                yearlyEnergyConsumption,
            });
        } catch (error) {
            console.error("Error fetching dashboard summary:", error);
            res.status(500).json({ error: "Failed to fetch dashboard summary" });
        }
    }
};

module.exports = DashboardController;
