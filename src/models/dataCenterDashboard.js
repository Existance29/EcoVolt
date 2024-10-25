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
        
    static async getAllCarbonEmissionsData(company_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT emissions.co2_emissions_tons, centers.data_center_name, companies.name AS company_name
                FROM data_center_carbon_emissions AS emissions
                INNER JOIN data_centers AS centers ON emissions.data_center_id = centers.id
                INNER JOIN companies ON centers.company_id = companies.id
                WHERE companies.id = @company_id
                AND YEAR(emissions.date) = @year
            `; // retrieiving data from data_center_carbon_emissions where company_id = company_id

            const request = connection.request();
            request.input('company_id', company_id);
            request.input('year', year);
            const result = await request.query(sqlQuery);
            // console.log(result);
            if(result.recordset.length === 0) {
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

    static async getAllSustainabilityGoalsData(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT goals.*, companies.name AS company_name, companies.alias AS company_alias
                FROM company_sustainability_goals AS goals
                INNER JOIN companies ON goals.company_id = companies.id
                WHERE goals.company_id = @company_id
            `; // retrieiving data from company_sustainability_goals where company_id = company_id
            const request = connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            if(result.recordset.length === 0) {
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