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
                INNER JOIN data_centers AS dc ON dcec.data_center_id = dc.id
                WHERE dc.company_id = @company_id
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving Energy Consumption Data");
        } finally { 
            if (connection) await connection.close();
        }
    }

    static async getAllEnergyConsumptionByDataCenterId(data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT * FROM data_center_energy_consumption
                WHERE data_center_id = @data_center_id
            `;
            const request = connection.request();
            request.input('data_center_id', sql.Int, data_center_id);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving Energy Consumption Data");
        } finally {
            if (connection) await connection.close();
        }
    }
    
    static async getAllEnergyConsumptionByCompanyIdAndDate(company_id, date) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT e.* FROM data_center_energy_consumption AS e
                INNER JOIN data_centers AS d ON e.data_center_id = d.id
                WHERE d.company_id = @company_id
                AND CONVERT(date, e.date) = @date
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('date', sql.Date, date); // For exact date filtering

            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving Energy Consumption Data by Company and Date");
        } finally {
            if (connection) await connection.close();
        }
    }
    

    static async getEnergyConsumptionByDataCenterIdAndDate(dataCenterId, date) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT * FROM data_center_energy_consumption
                WHERE data_center_id = @dataCenterId 
                AND CONVERT(date, date) = @date
            `;
            const request = connection.request();
            request.input('dataCenterId', dataCenterId);
            request.input('date', date);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving energy consumption data");
        } finally { 
            if (connection) await connection.close();
        }
    }
    


    static async getAllCarbonEmissionByCompanyId(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT * FROM data_center_carbon_emissions 
            INNER JOIN data_centers ON 
            data_center_carbon_emissions.data_center_id = data_centers.id
            WHERE data_centers.company_id = @company_id
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            if (result.recordset.length === 0) {
                return null;
            }
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving Carbon Emission data");
        } finally { 
            if (connection) {
                await connection.close();
            }
        }
    }



    static async getAllCarbonEmissionByDataCenterId(data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT * FROM data_center_carbon_emissions 
            INNER JOIN data_centers ON 
            data_center_carbon_emissions.data_center_id = data_centers.id
            WHERE data_centers.id = @data_center_id
            `;
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            const result = await request.query(sqlQuery);
            if (result.recordset.length === 0) {
                return null;
            }
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving Carbon Emission data");
        } finally { 
            if (connection) {
                await connection.close();
            }
        }
    }

    // Retrieves all carbon emissions within a specific date range
    static async getAllCarbonEmissionByCompanyIdAndDate(company_id, date) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT * FROM data_center_carbon_emissions
            INNER JOIN data_centers ON data_center_carbon_emissions.data_center_id = data_centers.id
            WHERE data_centers.company_id = @company_id 
            AND CONVERT(date, emission_date) = @date
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('date', date);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving Carbon Emission data by company and date");
        } finally {
            if (connection) await connection.close();
        }
    }




    static async getAllSumOfCarbonEmissionByCompanyId(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    SUM(data_center_carbon_emissions.co2_emissions_tons) AS total_co2_emissions,
                    SUM((data_center_carbon_emissions.renewable_energy_percentage / 100) * data_center_carbon_emissions.co2_emissions_tons) AS total_renewable_energy_value
                FROM data_center_carbon_emissions 
                INNER JOIN data_centers 
                ON data_center_carbon_emissions.data_center_id = data_centers.id
                WHERE data_centers.company_id = @company_id;
            `;
            const request = connection.request();
            request.input('company_id', sql.Int, company_id); // Specify data type explicitly
            const result = await request.query(sqlQuery);
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            return result.recordset[0]; // Return the first row, which has the totals
        } catch (error) {
            console.error("Error retrieving total Carbon Emission data:", error);
            throw new Error("Error retrieving total Carbon Emission data");
        } finally { 
            if (connection) {
                await connection.close();
            }
        }
    }
    

    static async getAllSumOfCarbonEmissionByCompanyIdAndDate(company_id, date) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);    
            const sqlQuery = `
            SELECT 
                SUM(co2_emissions_tons) AS total_co2_emissions,
                SUM((renewable_energy_percentage / 100) * co2_emissions_tons) AS total_renewable_energy_value
            FROM data_center_carbon_emissions 
            INNER JOIN data_centers 
            ON data_center_carbon_emissions.data_center_id = data_centers.id
            WHERE data_centers.company_id = @company_id
            AND data_center_carbon_emissions.date = @date
        `;
            const request = connection.request();
            request.input('company_id', company_id); // Specify data type explicitly
            request.input('date', date); 
            const result = await request.query(sqlQuery);
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            return result.recordset[0]; // Return the first row, which has the totals
        } catch (error) {
            console.error("Error retrieving total Carbon Emission data:", error);
            throw new Error("Error retrieving total Carbon Emission data");
        } finally { 
            if (connection) {
                await connection.close();
            }
        }
    }

    static async getAllSumOfCarbonEmissionByCompanyIdAndDataCenter(company_id, data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    SUM(co2_emissions_tons) AS total_co2_emissions,
                    SUM(co2_emissions_tons * (renewable_energy_percentage / 100)) AS total_renewable_energy_value
                FROM data_center_carbon_emissions
                WHERE data_center_id = @data_center_id
            `;
            
            const request = connection.request();
            request.input('company_id', sql.Int, company_id);  // Add company_id if needed in the table joins
            request.input('data_center_id', sql.Int, data_center_id);
            
            const result = await request.query(sqlQuery);
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            return result.recordset[0];
        } catch (error) {
            console.error("Error retrieving total Carbon Emission data:", error);
            throw new Error("Error retrieving total Carbon Emission data");
        } finally { 
            if (connection) {
                await connection.close();
            }
        }
    }
    

    static async getAllSumOfCarbonEmissionByCompanyIdAndDataCenterAndDate(company_id, data_center_id, date) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    SUM(co2_emissions_tons) AS total_co2_emissions,
                    SUM((renewable_energy_percentage / 100) * co2_emissions_tons) AS total_renewable_energy_value
                FROM data_center_carbon_emissions 
                INNER JOIN data_centers 
                ON data_center_carbon_emissions.data_center_id = data_centers.id
                WHERE data_centers.company_id = @company_id
                AND data_center_carbon_emissions.date = @date
                AND data_centers.id = @data_center_id
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('data_center_id', data_center_id);
            request.input('date', date);
            
            const result = await request.query(sqlQuery);
            return result.recordset[0];
        } catch (error) {
            console.error("Error retrieving emissions data:", error);
            throw new Error("Failed to fetch emissions data");
        } finally {
            if (connection) await connection.close();
        }
    }
    




    // Retrieves all carbon emissions for a specific data center within a specific date range
    // static async getAllCarbonEmissionByDateAndDataCenter(data_center_id, start_date, end_date) {
    //     let connection;
    //     try {
    //         connection = await sql.connect(dbConfig);
    //         const sqlQuery = `
    //         SELECT * FROM data_center_carbon_emissions
    //         WHERE data_center_id = @data_center_id 
    //         AND emission_date BETWEEN @start_date AND @end_date
    //         `;
    //         const request = connection.request();
    //         request.input('data_center_id', data_center_id);
    //         request.input('start_date', start_date);
    //         request.input('end_date', end_date);
    //         const result = await request.query(sqlQuery);
    //         return result.recordset.length > 0 ? result.recordset : null;
    //     } catch (error) {
    //         throw new Error("Error retrieving Carbon Emission data by data center and date");
    //     } finally {
    //         if (connection) await connection.close();
    //     }
    // }




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