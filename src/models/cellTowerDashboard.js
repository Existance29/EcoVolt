//import sql stuff
const query = require("../libs/query")

class cellTowerDashboard{

    static filterByMonthAndYear(month, year){
        let out = ""
        if (month !== "all") out+= " AND MONTH(date)=@month"

        if (year !== "all") out += " AND YEAR(date)=@year"
        return out
    }
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
        filterStr += this.filterByMonthAndYear(month, year)
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
        let groupBySQL;
        if (month == "all" && year == "all"){
            groupBySQL = "YEAR(date)"
        }
        else if (month == "all"){
            groupBySQL = "MONTH(date)"
        }else{
            groupBySQL = "DAY(date)"
        }
        let trendSQL = `SELECT SUM(carbon_emission_kg) AS carbon_emission, ${groupBySQL} AS num
        FROM cell_tower_energy_consumption AS ec INNER JOIN cell_towers AS ct ON ec.cell_tower_id=ct.id WHERE ct.company_id=@companyID${filterStr}
        GROUP BY ${groupBySQL}
        ORDER BY ${groupBySQL}`

        const trendResults = (await query.query(trendSQL, params)).recordset
        result["trends"] = trendResults //add trend to results
        
        //check if the data is blank
        for (const [key, value] of Object.entries(result)) {
            if (!value) return null
        }
        return result
    }

    static async getEnergyConsumptionForEachCellTower(companyID, cat, month, year){
        const params = {
            "companyID": companyID,
            "cat": cat,
            "month": month,
            "year": year,
        }

        const queryStr = `SELECT ct.cell_tower_name AS cell_tower_name, 
                        SUM(CASE 
                        WHEN @cat = 'Radio Equipment' THEN ec.radio_equipment_energy_kwh
                        WHEN @cat = 'Cooling' THEN ec.cooling_energy_kwh
                        WHEN @cat = 'Backup Power' THEN ec.backup_power_energy_kwh
                        WHEN @cat = 'Misc' THEN ec.misc_energy_kwh
                        ELSE 0 END) AS data
                        FROM cell_tower_energy_consumption AS ec INNER JOIN cell_towers AS ct ON ec.cell_tower_id=ct.id WHERE ct.company_id=@companyID ${this.filterByMonthAndYear(month, year)}
                        GROUP BY ct.cell_tower_name, ct.id
                        ORDER BY ct.id
                        `

        const result = (await query.query(queryStr, params)).recordset
        return result.length ? result : null
    }

    static async getEnergyConsumptionTrendByCellTower(companyID, cellTowerID, cat, month, year){
        const params = {
            "companyID": companyID,
            "id": cellTowerID,
            "cat": cat,
            "month": month,
            "year": year
        }

        const filterStr = this.filterByMonthAndYear(month, year)
        let groupBySQL;
        if (month == "all" && year == "all"){
            groupBySQL = "YEAR(date)"
        }
        else if (month == "all"){
            groupBySQL = "MONTH(date)"
        }else{
            groupBySQL = "DAY(date)"
        }
        const queryStr = `SELECT ${groupBySQL} as num, 
                        SUM(CASE 
                        WHEN @cat = 'Radio Equipment' THEN ec.radio_equipment_energy_kwh
                        WHEN @cat = 'Cooling' THEN ec.cooling_energy_kwh
                        WHEN @cat = 'Backup Power' THEN ec.backup_power_energy_kwh
                        WHEN @cat = 'Misc' THEN ec.misc_energy_kwh
                        ELSE 0 END) AS data
                        FROM cell_tower_energy_consumption AS ec INNER JOIN cell_towers AS ct ON ec.cell_tower_id=ct.id WHERE ct.company_id=@companyID AND ct.id=@id ${filterStr}
                        GROUP BY ${groupBySQL}`

        const result = (await query.query(queryStr, params)).recordset
        return result.length ? result : null
    }

    static async getRenewableEnergyForEachCellTower(companyID,month, year){
        const params = {
            "companyID": companyID,
            "month": month,
            "year": year,
        }

        const queryStr = `SELECT ct.cell_tower_name AS cell_tower_name, 
                        SUM(renewable_energy_kwh) AS renewable_energy,
                        SUM(total_energy_kwh) - SUM(renewable_energy_kwh) AS nonrenewable_energy
                        FROM cell_tower_energy_consumption AS ec INNER JOIN cell_towers AS ct ON ec.cell_tower_id=ct.id WHERE ct.company_id=@companyID ${this.filterByMonthAndYear(month, year)}
                        GROUP BY ct.cell_tower_name, ct.id
                        ORDER BY ct.id
                        `

        const result = (await query.query(queryStr, params)).recordset
        return result.length ? result : null
    }

    static async getRenewableEnergyTrendByCellTower(companyID, cellTowerID, month, year){
        const params = {
            "companyID": companyID,
            "id": cellTowerID,
            "month": month,
            "year": year
        }

        const filterStr = this.filterByMonthAndYear(month, year)
        let groupBySQL;
        if (month == "all" && year == "all"){
            groupBySQL = "YEAR(date)"
        }
        else if (month == "all"){
            groupBySQL = "MONTH(date)"
        }else{
            groupBySQL = "DAY(date)"
        }

        const queryStr = `SELECT ${groupBySQL} as num, 
                        SUM(renewable_energy_kwh) AS renewable_energy,
                        SUM(total_energy_kwh) AS total_energy
                        FROM cell_tower_energy_consumption AS ec INNER JOIN cell_towers AS ct ON ec.cell_tower_id=ct.id WHERE ct.company_id=@companyID AND ct.id=@id ${filterStr}
                        GROUP BY ${groupBySQL}`

        const result = (await query.query(queryStr, params)).recordset
        return result.length ? result : null
    }
}

module.exports = cellTowerDashboard