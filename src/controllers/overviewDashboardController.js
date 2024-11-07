const DashboardModel = require("../models/overviewDashboardModel");

const DashboardController = {
    async getDashboardSummary(req, res) {
        try {
            const cellTowerSummary = await DashboardModel.getCellTowerSummary();
            const dataCenterSummary = await DashboardModel.getDataCenterSummary();
            const carbonEmissionsSummary = await DashboardModel.getCarbonEmissionsSummary();
            const renewableEnergySummary = await DashboardModel.getRenewableEnergyUsagePercentage();
            const energyBreakdown = await DashboardModel.getEnergyConsumptionBreakdown();
            const energyConsumptionTrend = await DashboardModel.getEnergyConsumptionTrend(); // Ensure this function exists
            const renewableEnergyUsage = await DashboardModel.getRenewableEnergyUsage();
            const efficiencyMetrics = await DashboardModel.getEfficiencyMetrics();

            // Log the data for debugging
            console.log({
                cellTower: cellTowerSummary,
                dataCenter: dataCenterSummary,
                carbonEmissions: carbonEmissionsSummary,
                renewableEnergy: renewableEnergySummary,
                energyBreakdown,
                energyConsumptionTrend, // Change from co2Trend to energyConsumptionTrend
                renewableEnergyUsage,
                efficiencyMetrics
            });

            res.json({
                cellTower: cellTowerSummary,
                dataCenter: dataCenterSummary,
                carbonEmissions: carbonEmissionsSummary,
                renewableEnergy: renewableEnergySummary,
                energyBreakdown,
                energyConsumptionTrend, // Use the correct variable here
                renewableEnergyUsage,
                efficiencyMetrics
            });
        } catch (error) {
            console.error("Error fetching dashboard summary:", error);
            res.status(500).json({ error: "Failed to fetch dashboard summary" });
        }
    }
};

module.exports = DashboardController;
