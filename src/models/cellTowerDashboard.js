//import sql stuff
const query = require("../libs/query")

class cellTowerDashboard{

    //return the cell tower data
    static async getCellTowers(companyID){
        const result = (await query.query("SELECT * FROM cell_towers WHERE company_id=@companyID", {"companyID": companyID})).recordset
        return result ? result : null
    }

    //return the cell tower and its consumption data
    static async getCellTowerConsumptionData(companyID, cellTowerID, month, year){
        const params = {
            "companyID": companyID,
            "cellTowerID": cellTowerID,
            "month": month,
            "year": year
        }
        let filterStr = ""
        //check if the filter params exist and modify the sql statement accordingly
        if (month !== "all"){
            filterStr += " AND MONTH(date)=@month"
        } 
        if (year !== "all"){
            filterStr += " AND YEAR(date)=@year"
        } 
        if (cellTowerID != "all"){
            filterStr += " AND ec.cell_tower_id=@cellTowerID"
        } 

        //return total stats
        //max is pretty hacky here
        const result = (await query.query(`SELECT MAX(cell_tower_grid_type) AS grid_type, SUM(total_energy_kwh) AS total_energy, SUM(radio_equipment_energy_kwh) AS radio_equipment_energy, SUM(cooling_energy_kwh) AS cooling_energy, SUM(backup_power_energy_kwh) AS backup_power_energy, SUM(misc_energy_kwh) AS misc_energy, SUM(renewable_energy_kwh) AS renewable_energy, SUM(carbon_emission_kg) AS carbon_emission \
            FROM cell_tower_energy_consumption AS ec INNER JOIN cell_towers AS ct ON ec.cell_tower_id=ct.id WHERE ct.company_id=@companyID${filterStr}`, 
            params)).recordset[0]
        
        //set the trend sql statement
        //if month is not selected, trend by months
        //if month is selected, trend by days in that month
        let trendSQL;
        if (month == "all"){
            trendSQL = `SELECT SUM(carbon_emission_kg) AS carbon_emission, MONTH(date) AS num
                FROM cell_tower_energy_consumption AS ec INNER JOIN cell_towers AS ct ON ec.cell_tower_id=ct.id WHERE ct.company_id=@companyID${filterStr}
                GROUP BY MONTH(date)`
        }
        else{
            trendSQL = `SELECT carbon_emission_kg AS carbon_emission, DAY(date) AS num
                FROM cell_tower_energy_consumption AS ec INNER JOIN cell_towers AS ct ON ec.cell_tower_id=ct.id WHERE ct.company_id=@companyID${filterStr}`
        }
        const trendResults = (await query.query(trendSQL, params)).recordset
        result["trends"] = trendResults //add trend to results
        return result ? result : null
    }
}

module.exports = cellTowerDashboard