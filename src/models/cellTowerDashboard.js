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
        let queryStr = "SELECT * FROM cell_tower_energy_consumption AS ec INNER JOIN cell_towers AS ct ON ec.cell_tower_id=ct.id WHERE ct.company_id=@companyID"
        //check if the filter params exist and modify the sql statement accordingly
        if (month !== "all"){
            queryStr += " AND MONTH(date)=@month"
        } 
        if (year !== "all"){
            queryStr += " AND YEAR(date)=@year"
        } 
        if (cellTowerID != "all"){
            queryStr += " AND ec.cell_tower_id=@cellTowerID"
        } 

        const result = (await query.query(queryStr, params)).recordset

        return result ? result : null
    }
}

module.exports = cellTowerDashboard