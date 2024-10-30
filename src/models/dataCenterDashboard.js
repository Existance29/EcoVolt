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




    static async getAllDataCenter(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `SELECT * FROM data_centers WHERE company_id =  @company_id`;
            const request = connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            if (result.recordset.length === 0) {
                return null;
            }
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving Data Centers");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }    
        
        

    static async getAllMonthAndYear() { // Get the years that exist in the database so that it populates the filter dropdown dynamically
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT DISTINCT YEAR(date) AS year, MONTH(date) AS month
                FROM data_center_energy_consumption
                ORDER BY year, month;
            `; // If there is energy consumotion, then there is carbon emission. hence selecting from only one table
            const request = connection.request();
            const result = await request.query(sqlQuery);
            if(result.recordset.length === 0) {
                return null;
            }
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving Year");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
       



    static async getAllEnergyConsumptionByCompanyId(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT dcec.* FROM data_center_energy_consumption AS dcec
            INNER JOIN 
                data_centers AS dc ON dcec.data_center_id = dc.id
            WHERE 
                dc.company_id = @company_id
            `;
            const request = await connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            if (result.recordset.length === 0) {
                return null;
            }
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving Energy Consumption Data");
        } finally { 
            if (connection) {
                await connection.close();
            }
        }
    }

    static async getAllEnergyConsumptionByDataCenterId(data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // Query to retrieve energy consumption data for a specific data_center_id
            const sqlQuery = `
                SELECT * FROM 
                    data_center_energy_consumption
                WHERE 
                    data_center_id = @data_center_id
            `;
    
            const request = connection.request();
            request.input('data_center_id', sql.Int, data_center_id);
            
            const result = await request.query(sqlQuery);
            if (result.recordset.length === 0) {
                return null;
            }
            
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving Energy Consumption Data");
        } finally { 
            if (connection) {
                await connection.close();
            }
        }
    }
    

    static async getEnergyConsumptionByDataCenterIdAndDate(dataCenterId, month, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            const sqlQuery = `
                SELECT * FROM data_center_energy_consumption
                WHERE 
                    data_center_id = @dataCenterId 
                    AND MONTH(date) = @month 
                    AND YEAR(date) = @year
            `;
    
            const request = connection.request();
            request.input('dataCenterId', dataCenterId);
            request.input('month', month);
            request.input('year', year);
    
            const result = await request.query(sqlQuery);
            if (result.recordset.length === 0) {
                return null;
            }
    
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving energy consumption data");
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