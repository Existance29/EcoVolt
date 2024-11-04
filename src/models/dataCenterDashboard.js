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
        
        

    static async getAllDate(company_id) { // Get the years that exist in the database so that it populates the filter dropdown dynamically
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT DISTINCT date, YEAR(date) AS year, MONTH(date) AS month
            FROM data_center_energy_consumption INNER JOIN data_centers
			ON data_center_energy_consumption.data_center_id = data_centers.id
			INNER JOIN companies ON companies.id = data_centers.company_id
			WHERE companies.id =@company_id
            ORDER BY year, month
            `; // If there is energy consumotion, then there is carbon emission. hence selecting from only one table
            const request = connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            if(result.recordset.length === 0) {
                return null;
            }
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving Date");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
       

    // In dataCenterDashboard.js (or wherever your model functions are defined)
static async getLastDate(companyId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
            SELECT MAX(date) AS lastDate
            FROM data_center_carbon_emissions
            INNER JOIN data_centers ON data_center_carbon_emissions.data_center_id = data_centers.id
            WHERE data_centers.company_id = @company_id
        `;
        const request = connection.request();
        request.input('company_id', companyId);
        const result = await request.query(sqlQuery);
        return result.recordset[0]?.lastDate || null;
    } catch (error) {
        throw new Error("Error retrieving the last date");
    } finally {
        if (connection) await connection.close();
    }
}


// In dataCenterDashboard.js (model file)
static async getLastDateByDataCenter(data_center_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
            SELECT MAX(date) AS lastDate
            FROM data_center_carbon_emissions
            WHERE data_center_id = @data_center_id
        `;
        const request = connection.request();
        request.input('data_center_id', data_center_id);
        const result = await request.query(sqlQuery);
        return result.recordset[0]?.lastDate || null;
    } catch (error) {
        console.error("Error retrieving last date for data center:", error.message);
        throw new Error("Error retrieving last date for data center");
    } finally {
        if (connection) await connection.close();
    }
}




static async getTotalEnergyConsumptionByCompanyId(company_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
            SELECT SUM(total_energy_mwh) AS total_energy_consumption 
            FROM data_center_energy_consumption
            WHERE data_center_id IN (SELECT id FROM data_centers WHERE company_id = @company_id);
        `;
        const request = connection.request();
        request.input('company_id', sql.Int, company_id); // Ensure correct SQL type
        const result = await request.query(sqlQuery);

        if (result.recordset.length === 0) {
            return null; // No data found
        }

        return result.recordset[0].total_energy_consumption; // Return the aggregated energy consumption
    } catch (error) {
        console.error("Error in getTotalEnergyConsumptionByCompanyId:", error.message);
        throw new Error("Error retrieving total Energy Consumption data by company ID");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}


static async getTotalEnergyConsumptionByDataCenterId(dataCenterId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
            SELECT SUM(total_energy_mwh) AS total_energy_consumption 
            FROM data_center_energy_consumption
            WHERE data_center_id = @dataCenterId;
        `;
        const request = connection.request();
        request.input('dataCenterId', sql.Int, dataCenterId); // Ensure the correct SQL type
        const result = await request.query(sqlQuery);

        // Check if the result is empty
        if (result.recordset.length === 0 || result.recordset[0].total_energy_consumption === null) {
            console.warn("No energy consumption data found for data center ID:", dataCenterId);
            return null; // No data found
        }

        return result.recordset[0].total_energy_consumption; // Return the aggregated energy consumption
    } catch (error) {
        console.error("Error in getTotalEnergyConsumptionByDataCenterId:", error.message);
        throw new Error("Error retrieving total Energy Consumption data by data center ID");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

static async getTotalEnergyConsumptionByDataCenterIdAndDate(dataCenterId, startDate, endDate) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
            SELECT SUM(total_energy_mwh) AS total_energy_consumption 
            FROM data_center_energy_consumption
            WHERE data_center_id = @dataCenterId
            AND CONVERT(date, date) BETWEEN @startDate AND @endDate;
        `;
        const request = connection.request();
        request.input('dataCenterId', sql.Int, dataCenterId);
        request.input('startDate', sql.Date, startDate);
        request.input('endDate', sql.Date, endDate);

        const result = await request.query(sqlQuery);

        if (result.recordset.length === 0 || result.recordset[0].total_energy_consumption === null) {
            return null;
        }
        return result.recordset[0].total_energy_consumption;
    } catch (error) {
        console.error("Error in getTotalEnergyConsumptionByDataCenterIdAndDate:", error.message);
        throw new Error("Error retrieving total energy consumption data by data center ID and date range");
    } finally {
        if (connection) await connection.close();
    }
}


static async getTotalEnergyConsumptionByCompanyIdAndDate(company_id, startDate, endDate) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
            SELECT SUM(total_energy_mwh) AS total_energy_consumption
            FROM data_center_energy_consumption AS e
            INNER JOIN data_centers AS d ON e.data_center_id = d.id
            WHERE d.company_id = @company_id
            AND CONVERT(date, e.date) BETWEEN @startDate AND @endDate;
        `;
        const request = connection.request();
        request.input('company_id', sql.Int, company_id);
        request.input('startDate', sql.Date, startDate);
        request.input('endDate', sql.Date, endDate);

        const result = await request.query(sqlQuery);

        if (result.recordset.length === 0 || result.recordset[0].total_energy_consumption === null) {
            return null;
        }
        return result.recordset[0].total_energy_consumption;
    } catch (error) {
        console.error("Error in getTotalEnergyConsumptionByCompanyIdAndDate:", error.message);
        throw new Error("Error retrieving total energy consumption data by company ID and date range");
    } finally {
        if (connection) await connection.close();
    }
}









    static async getAllEnergyConsumptionByCompanyId(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
				SELECT SUM(it_energy_mwh) AS it_energy_mwh, 
                SUM(cooling_energy_mwh) AS cooling_energy_mwh, 
                SUM(backup_power_energy_mwh) AS backup_power_energy_mwh, 
                SUM(lighting_energy_mwh) AS lighting_energy_mwh FROM data_center_energy_consumption
				INNER JOIN data_centers AS dc ON data_center_energy_consumption.data_center_id = dc.id
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
    
    static async getAllEnergyConsumptionByCompanyIdAndDate(company_id, startDate, endDate) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT e.* FROM data_center_energy_consumption AS e
                INNER JOIN data_centers AS d ON e.data_center_id = d.id
                WHERE d.company_id = @company_id
                AND CONVERT(date, e.date) BETWEEN @startDate AND @endDate
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('startDate', sql.Date, startDate); // For date range filtering
            request.input('endDate', sql.Date, endDate); // For date range filtering
    
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving Energy Consumption Data by Company and Date");
        } finally {
            if (connection) await connection.close();
        }
    }
    
    

    static async getEnergyConsumptionByDataCenterIdAndDate(dataCenterId, startDate, endDate) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT * FROM data_center_energy_consumption
                WHERE data_center_id = @dataCenterId 
                AND CONVERT(date, date) BETWEEN @startDate AND @endDate
            `;
            const request = connection.request();
            request.input('dataCenterId', dataCenterId);
            request.input('startDate', sql.Date, startDate); // For date range filtering
            request.input('endDate', sql.Date, endDate); // For date range filtering
    
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving energy consumption data");
        } finally { 
            if (connection) await connection.close();
        }
    }
    




















// Retrieves total carbon emissions for a specific company
static async getTotalCarbonEmissionByCompanyId(company_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT 
            SUM(co2_emissions_tons) AS total_co2_emissions
        FROM 
            data_center_carbon_emissions
        WHERE 
            data_center_id IN (SELECT id FROM data_centers WHERE company_id = @company_id);
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        const result = await request.query(sqlQuery);
        
        if (result.recordset.length === 0) {
            return null;
        }
        
        return result.recordset[0].total_co2_emissions; // Return the total CO2 emissions
    } catch (error) {
        throw new Error("Error retrieving total Carbon Emission data by company ID");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}
// Retrieves total carbon emissions for a specific data center
static async getTotalCarbonEmissionByDataCenterId(data_center_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT 
            SUM(co2_emissions_tons) AS total_co2_emissions
        FROM 
            data_center_carbon_emissions
        WHERE 
            data_center_id = @data_center_id;
        `;
        const request = connection.request();
        request.input('data_center_id', data_center_id);
        const result = await request.query(sqlQuery);
        
        if (result.recordset.length === 0) {
            return null;
        }
        
        return result.recordset[0].total_co2_emissions; // Return the total CO2 emissions
    } catch (error) {
        throw new Error("Error retrieving total Carbon Emission data by data center ID");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

// Retrieves total carbon emissions for a specific company within a date range
static async getTotalCarbonEmissionByCompanyIdAndDate(company_id, startDate, endDate) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT 
            SUM(co2_emissions_tons) AS total_co2_emissions
        FROM 
            data_center_carbon_emissions
        WHERE 
            data_center_id IN (SELECT id FROM data_centers WHERE company_id = @company_id)
            AND CONVERT(date, date) BETWEEN @startDate AND @endDate;
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('startDate', startDate);
        request.input('endDate', endDate);
        const result = await request.query(sqlQuery);
        
        if (result.recordset.length === 0) {
            return null;
        }
        
        return result.recordset[0].total_co2_emissions; // Return the total CO2 emissions
    } catch (error) {
        throw new Error("Error retrieving total Carbon Emission data by company and date range");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

    
// Retrieves total carbon emissions for a specific data center within a date range
static async getTotalCarbonEmissionByDataCenterIdAndDate(data_center_id, startDate, endDate) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT 
            SUM(co2_emissions_tons) AS total_co2_emissions
        FROM 
            data_center_carbon_emissions
        WHERE 
            data_center_id = @data_center_id
            AND CONVERT(date, date) BETWEEN @startDate AND @endDate;
        `;
        const request = connection.request();
        request.input('data_center_id', data_center_id);
        request.input('startDate', startDate);
        request.input('endDate', endDate);
        const result = await request.query(sqlQuery);
        
        if (result.recordset.length === 0) {
            return null;
        }
        
        return result.recordset[0].total_co2_emissions; // Return the total CO2 emissions
    } catch (error) {
        throw new Error("Error retrieving total Carbon Emission data by data center and date range");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

















    // line chart, need group them by date
    static async getAllCarbonEmissionByCompanyId(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT 
                date,
                SUM(co2_emissions_tons) AS co2_emissions_tons,
                AVG(renewable_energy_percentage) AS renewable_energy_percentage
            FROM 
                data_center_carbon_emissions
            WHERE 
                data_center_id IN (SELECT id FROM data_centers WHERE company_id = @company_id)
            GROUP BY 
                date
            ORDER BY 
                date;
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
            SELECT 
                date,
                SUM(co2_emissions_tons) AS co2_emissions_tons,
                AVG(renewable_energy_percentage) AS renewable_energy_percentage
            FROM 
                data_center_carbon_emissions
            WHERE 
                data_center_id = @data_center_id
            GROUP BY 
                date
            ORDER BY 
                date;
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

    // Retrieves all carbon emissions within a specific date range by company ID
    static async getAllCarbonEmissionByCompanyIdAndDate(company_id, startDate, endDate) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT 
                CONVERT(date, date) AS date,
                SUM(data_center_carbon_emissions.co2_emissions_tons) AS co2_emissions_tons, 
                AVG(data_center_carbon_emissions.renewable_energy_percentage) AS renewable_energy_percentage,
                data_centers.company_id
            FROM data_center_carbon_emissions
            INNER JOIN data_centers ON data_center_carbon_emissions.data_center_id = data_centers.id
            WHERE data_centers.company_id = @company_id 
            AND CONVERT(date, date) BETWEEN @startDate AND @endDate
            GROUP BY CONVERT(date, date), data_centers.company_id
            ORDER BY date;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('startDate', startDate);
            request.input('endDate', endDate);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving Carbon Emission data by company and date range");
        } finally {
            if (connection) await connection.close();
        }
    }

    // Retrieves all carbon emissions within a specific date range by data center ID
    static async getAllCarbonEmissionByDataCenterAndDate(data_center_id, startDate, endDate) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT 
                CONVERT(date, date) AS date,
                SUM(data_center_carbon_emissions.co2_emissions_tons) AS co2_emissions_tons,
                AVG(data_center_carbon_emissions.renewable_energy_percentage) AS renewable_energy_percentage
            FROM data_center_carbon_emissions
            WHERE data_center_id = @data_center_id
            AND CONVERT(date, date) BETWEEN @startDate AND @endDate
            GROUP BY CONVERT(date, date)
            ORDER BY date;
            `;
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            request.input('startDate', startDate);
            request.input('endDate', endDate);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.error("Error retrieving carbon emission data by data center and date range:", error.message);
            throw new Error("Error retrieving Carbon Emission data by data center and date range");
        } finally {
            if (connection) await connection.close();
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