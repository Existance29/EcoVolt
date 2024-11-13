const cellTowerDashboard = require("../models/cellTowerDashboard")

class cellTowerDashboardController{

    static async getCellTowers(req, res){
        const companyID = req.user.companyId
        try {
            const cellTowers = await cellTowerDashboard.getCellTowers(companyID)
            if (!cellTowers) {
                return res.status(404).send("Company not found or has no cell towers")
            }
            res.json(cellTowers);
        } catch (error) {
            console.error(error)
            res.status(500).send("Error retrieving cell towers")
        }
    }

    static async getCellTowerConsumptionData(req, res){
        const companyID = req.user.companyId
        try {
            const cellTowersData = await cellTowerDashboard.getCellTowerConsumptionData(companyID, req.params.id, req.params.month, req.params.year)
            if (!cellTowersData) {
                return res.status(404).send("Company not found or has no cell tower data")
            }
            res.json(cellTowersData);
        } catch (error) {
            console.error(error)
            res.status(500).send("Error retrieving cell towers")
        }
    }

    static async getEnergyConsumptionForEachCellTower(req, res){
        const companyID = req.user.companyId
        try {
            const cellTowersData = await cellTowerDashboard.getEnergyConsumptionForEachCellTower(companyID, req.params.cat, req.params.month, req.params.year)
            if (!cellTowersData) {
                return res.status(404).send("Company not found or has no cell tower data")
            }
            res.json(cellTowersData);
        } catch (error) {
            console.error(error)
            res.status(500).send("Error retrieving cell towers")
        }
    }

    static async getEnergyConsumptionTrendByCellTower(req, res){
        const companyID = req.user.companyId
        try {
            const cellTowersData = await cellTowerDashboard.getEnergyConsumptionTrendByCellTower(companyID, req.params.id, req.params.cat, req.params.month, req.params.year)
            if (!cellTowersData) {
                return res.status(404).send("Company not found or has no cell tower data")
            }
            res.json(cellTowersData);
        } catch (error) {
            console.error(error)
            res.status(500).send("Error retrieving cell towers")
        }
    }
}

module.exports = cellTowerDashboardController