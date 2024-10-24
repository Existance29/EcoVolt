const sql = require("mssql"); 
const dbConfig = require("../database/dbConfig");

class dataCenterDashboard {
    constructor(company_id, date, 
        total_energy_mwh, it_energy_mwh, cooling_energy_mwh, backup_power_energy_mwh, lighting_energy_mwh, pue, cue, wue, 
        co2_emissions_tons, renewable_energy_percentage,
        sustainability_goals) {
        // General Info
        this.company_id = company_id;
        this.date = date;

        // Energy Consumption Metrics
        this.total_energy_mwh = total_energy_mwh;
        this.it_energy_mwh = it_energy_mwh;
        this.cooling_energy_mwh = cooling_energy_mwh;
        this.backup_power_energy_mwh = backup_power_energy_mwh;
        this.lighting_energy_mwh = lighting_energy_mwh;
        this.pue = pue;
        this.cue = cue;
        this.wue = wue;

        // Carbon Emissions Metrics
        this.co2_emissions_tons = co2_emissions_tons;
        this.renewable_energy_percentage = renewable_energy_percentage;

        // Sustainability Goals
        this.sustainability_goals = sustainability_goals;
        }
        
    static async getAllCarbonEmissionsData(company_id, date) {
        try {
            const connection = await sql.connect(dbConfig);
            const sqlQuery = `SELECT * FROM data_center_carbon_emissions WHERE company_id=@company_id AND date=@date`; // retrieiving data from data_center_carbon_emissions where company_id = company_id and date = date

            const request = connection.request();
            request.input('company_id', company_id);
            request.input('date', date);
            const result = await reuqest.query(sqlQuery);
            if(result.rowsAffected[0] === 0) {
                return null;
            }
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving Carbon Emissions Data");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async getAllSustainabilityGoalsData(company_id, date) {
        try {
            const connection = await sql.connect(dbConfig);
            const sqlQuery = `SELECT * FROM company_sustainability_goals WHERE company_id=@company_id AND target_year = YEAR(@date)`; // retrieiving data from company_sustainability_goals where company_id = company_id and target_year = target_year
    
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('date', date);
            const result = await requst.query(sqlQuery);
            if(result.rowsAffected[0] === 0) {
                return null;
            }
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving Sustainability Goals Data");
        } finally { 
            if (connection) {
                await connection.close();
            }
        }
    }





}

module.exports = dataCenterDashboard;