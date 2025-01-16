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



static async getAvailDatesByCompanyId(company_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        select date from data_center_carbon_emissions 
        INNER JOIN data_centers ON
        data_centers.id = data_center_id
        INNER JOIN companies ON
        companies.id = data_centers.company_id
        WHERE companies.id = @company_id
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        const result = await request.query(sqlQuery);
        if (result.recordset.length === 0) {
            return null;
        }
        return result;
    } catch (error) {
        console.error("Error in getAvailDatesByCompanyId:", error.message);
        throw new Error("Error retrieving getAvailDatesByCompanyId");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

static async getAvailDatesByCompanyIdandDc(company_id, dc) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        select date from data_center_carbon_emissions 
        INNER JOIN data_centers ON
        data_centers.id = data_center_id
        INNER JOIN companies ON
        companies.id = data_centers.company_id
        WHERE companies.id = @company_id AND data_centers.id = @dc
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('dc', dc);
        const result = await request.query(sqlQuery);
        if (result.recordset.length === 0) {
            return null;
        }
        return result;
    } catch (error) {
        console.error("Error in getAvailDatesByCompanyIdandDc:", error.message);
        throw new Error("Error retrieving getAvailDatesByCompanyIdandDc");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}


// ---------------------------------------------------------------------------------------------------
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

static async getTotalEnergyConsumptionByDataCenterIdAndYearMonth(dataCenterId, year, month) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
            SELECT SUM(total_energy_mwh) AS total_energy_consumption 
            FROM data_center_energy_consumption
            WHERE data_center_id = @dataCenterId
            AND MONTH(date) = @month AND YEAR(date) = @year
        `;
        const request = connection.request();
        request.input('dataCenterId', dataCenterId);
        request.input('year', year);
        request.input('month', month);

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

static async getTotalEnergyConsumptionByDataCenterIdAndYear(dataCenterId, year) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
            SELECT SUM(total_energy_mwh) AS total_energy_consumption 
            FROM data_center_energy_consumption
            WHERE data_center_id = @dataCenterId
            AND YEAR(date) = @year
        `;
        const request = connection.request();
        request.input('dataCenterId', dataCenterId);
        request.input('year', year);

        const result = await request.query(sqlQuery);

        if (result.recordset.length === 0 || result.recordset[0].total_energy_consumption === null) {
            return null;
        }
        return result.recordset[0].total_energy_consumption;
    } catch (error) {
        console.error("Error in getTotalEnergyConsumptionByDataCenterIdAndDate:", error.message);
        throw new Error("Error retrieving total energy consumption data by data center ID and month and year");
    } finally {
        if (connection) await connection.close();
    }
}

static async getTotalEnergyConsumptionByCompanyIdAndYear(company_id, year) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
            SELECT SUM(total_energy_mwh) AS total_energy_consumption
            FROM data_center_energy_consumption AS e
            INNER JOIN data_centers AS d ON e.data_center_id = d.id
            WHERE d.company_id = @company_id
            AND YEAR(date) = @year
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('year', year);

        const result = await request.query(sqlQuery);

        if (result.recordset.length === 0 || result.recordset[0].total_energy_consumption === null) {
            return null;
        }
        return result.recordset[0].total_energy_consumption;
    } catch (error) {
        console.error("Error in getTotalEnergyConsumptionByCompanyIdAndDate:", error.message);
        throw new Error("Error retrieving total energy consumption data by company ID and year");
    } finally {
        if (connection) await connection.close();
    }
}

static async getTotalEnergyConsumptionByCompanyIdAndYearAndMonth(company_id, year, month) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
            SELECT SUM(total_energy_mwh) AS total_energy_consumption
            FROM data_center_energy_consumption AS e
            INNER JOIN data_centers AS d ON e.data_center_id = d.id
            WHERE d.company_id = @company_id
            AND YEAR(date) = @year AND MONTH(date) = @month
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('year', year);
        request.input('month', month);

        const result = await request.query(sqlQuery);

        if (result.recordset.length === 0 || result.recordset[0].total_energy_consumption === null) {
            return null;
        }
        return result.recordset[0].total_energy_consumption;
    } catch (error) {
        console.error("Error in getTotalEnergyConsumptionByCompanyIdAndDate:", error.message);
        throw new Error("Error retrieving total energy consumption data by company ID and year");
    } finally {
        if (connection) await connection.close();
    }
}
// ---------------------------------------------------------------------------------------------------






// ---------------------------------------------------------------------------------------------------
    static async getAllEnergyConsumptionByCompanyId(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
				SELECT SUM(it_energy_mwh) AS it_energy_mwh, 
                SUM(cooling_energy_mwh) AS cooling_energy_mwh, 
                SUM(backup_power_energy_mwh) AS backup_power_energy_mwh, 
                SUM(lighting_energy_mwh) AS lighting_energy_mwh,
                AVG(pue) AS pue_avg,
				AVG (cue) AS cue_avg, 
				AVG (wue) AS wue_avg FROM data_center_energy_consumption
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
            SELECT 
                SUM(it_energy_mwh) AS it_energy_mwh,
                SUM(cooling_energy_mwh) AS cooling_energy_mwh,
                SUM(backup_power_energy_mwh) AS backup_power_energy_mwh,
                SUM(lighting_energy_mwh) AS lighting_energy_mwh,		
                AVG(pue) AS pue_avg,
				AVG (cue) AS cue_avg, 
				AVG (wue) AS wue_avg
            FROM data_center_energy_consumption
            WHERE data_center_id = @data_center_id
            `;
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving Energy Consumption Data");
        } finally {
            if (connection) await connection.close();
        }
    }
    
    static async getAllEnergyConsumptionByCompanyIdAndYearMonth(company_id, year, month) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT 
                SUM(e.it_energy_mwh) AS it_energy_mwh,
                SUM(e.cooling_energy_mwh) AS cooling_energy_mwh,
                SUM(e.backup_power_energy_mwh) AS backup_power_energy_mwh,
                SUM(e.lighting_energy_mwh) AS lighting_energy_mwh,
                AVG(pue) AS pue_avg,
				AVG (cue) AS cue_avg, 
				AVG (wue) AS wue_avg
            FROM data_center_energy_consumption AS e
            INNER JOIN data_centers AS d ON e.data_center_id = d.id
            WHERE d.company_id = @company_id
            AND YEAR(date) = @year AND MONTH(date) = @month
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('year', year);
            request.input('month', month); 
    
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving Energy Consumption Data by Company and year and month");
        } finally {
            if (connection) await connection.close();
        }
    }

    static async getAllEnergyConsumptionByCompanyIdAndYear(company_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT 
                SUM(e.it_energy_mwh) AS it_energy_mwh,
                SUM(e.cooling_energy_mwh) AS cooling_energy_mwh,
                SUM(e.backup_power_energy_mwh) AS backup_power_energy_mwh,
                SUM(e.lighting_energy_mwh) AS lighting_energy_mwh,
                AVG(pue) AS pue_avg,
				AVG (cue) AS cue_avg, 
				AVG (wue) AS wue_avg
            FROM data_center_energy_consumption AS e
            INNER JOIN data_centers AS d ON e.data_center_id = d.id
            WHERE d.company_id = @company_id
            AND YEAR(date) = @year
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('year', year);
    
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving Energy Consumption Data by Company and year");
        } finally {
            if (connection) await connection.close();
        }
    }
    
    static async getEnergyConsumptionByDataCenterIdAndYearMonth(dataCenterId, year, month) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT 
                id, 
                data_center_id, 
                date, 
                total_energy_mwh, 
                it_energy_mwh, 
                cooling_energy_mwh, 
                backup_power_energy_mwh, 
                lighting_energy_mwh,
                pue, 
                cue, 
                wue
            FROM 
                data_center_energy_consumption
            WHERE 
                data_center_id = @dataCenterId
                AND YEAR(date) = @year 
                AND MONTH(date) = @month;
            `;
            const request = connection.request();
            request.input('dataCenterId', dataCenterId);
            request.input('year', year); // For date range filtering
            request.input('month', month); // For date range filtering
    
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
            throw new Error("Error retrieving energy consumption data dc, y, m");
        } finally { 
            if (connection) await connection.close();
        }
    }

    static async getEnergyConsumptionByDataCenterIdAndYear(dataCenterId, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT 
                id, 
                data_center_id, 
                date, 
                total_energy_mwh, 
                it_energy_mwh, 
                cooling_energy_mwh, 
                backup_power_energy_mwh, 
                lighting_energy_mwh,
                pue, 
                cue, 
                wue
            FROM data_center_energy_consumption
            WHERE data_center_id = @dataCenterId
            AND YEAR(date) = @year
            `;
            const request = connection.request();
            request.input('dataCenterId', dataCenterId);
            request.input('year', year); // For date range filtering
    
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving energy consumption data");
        } finally { 
            if (connection) await connection.close();
        }
    }
// ---------------------------------------------------------------------------------------------------


















// ---------------------------------------------------------------------------------------------------
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
static async getTotalCarbonEmissionByCompanyIdAndYearMonth(company_id, year, month) {
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
            AND YEAR(date) = @year AND MONTH(date) = @month
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('year', year);
        request.input('month', month);
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

static async getTotalCarbonEmissionByCompanyIdAndYear(company_id, year) {
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
            AND YEAR(date) = @year
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('year', year);
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
static async getTotalCarbonEmissionByDataCenterIdAndYearMonth(data_center_id, year, month) {
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
            AND YEAR(date) = @year and MONTH(date) = @month
        `;
        const request = connection.request();
        request.input('data_center_id', data_center_id);
        request.input('year', year);
        request.input('month', month);
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

static async getTotalCarbonEmissionByDataCenterIdAndYear(data_center_id, year, month) {
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
            AND YEAR(date) = @year
        `;
        const request = connection.request();
        request.input('data_center_id', data_center_id);
        request.input('year', year);
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
// ---------------------------------------------------------------------------------------------------














// ---------------------------------------------------------------------------------------------------
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
    static async getAllCarbonEmissionByCompanyIdAndYearMonth(company_id, year, month) {
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
            AND YEAR(date) = @year AND MONTH(date) = @month
            GROUP BY CONVERT(date, date), data_centers.company_id
            ORDER BY date;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('year', year);
            request.input('month', month);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving Carbon Emission data by company and date range");
        } finally {
            if (connection) await connection.close();
        }
    }

    static async getAllCarbonEmissionByCompanyIdAndYear(company_id, year) {
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
            AND YEAR(date) = @year
            GROUP BY CONVERT(date, date), data_centers.company_id
            ORDER BY date;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('year', year);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            throw new Error("Error retrieving Carbon Emission data by company and date range");
        } finally {
            if (connection) await connection.close();
        }
    }

    // Retrieves all carbon emissions within a specific date range by data center ID
    static async getAllCarbonEmissionByDataCenterAndYearMonth(data_center_id, year, month) {
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
            AND YEAR(date) = @year AND MONTH(date) = @month
            GROUP BY CONVERT(date, date)
            ORDER BY date;
            `;
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            request.input('year', year);
            request.input('month', month);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.error("Error retrieving carbon emission data by data center and date range:", error.message);
            throw new Error("Error retrieving Carbon Emission data by data center and date range");
        } finally {
            if (connection) await connection.close();
        }
    }
    static async getAllCarbonEmissionByDataCenterAndYear(data_center_id, year) {
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
            AND YEAR(date) = @year
            GROUP BY CONVERT(date, date)
            ORDER BY date;
            `;
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            request.input('year', year);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.error("Error retrieving carbon emission data by data center and date range:", error.message);
            throw new Error("Error retrieving Carbon Emission data by data center and date range");
        } finally {
            if (connection) await connection.close();
        }
    }
// ---------------------------------------------------------------------------------------------------






// ---------------------------------------------------------------------------------------------------
    static async getTotalRenewableEnergyByCompanyId(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    SUM(co2_emissions_tons * (renewable_energy_percentage / 100)) AS total_renewable_energy
                FROM data_center_carbon_emissions AS e
                INNER JOIN data_centers AS d ON e.data_center_id = d.id
                WHERE d.company_id = @company_id
            `;
    
            const request = connection.request();
            request.input('company_id', sql.Int, company_id);
            
            const result = await request.query(sqlQuery);
            
            // Return the total renewable energy contribution or null if no data is found
            return result.recordset.length > 0 ? result.recordset[0].total_renewable_energy : null;
        } catch (error) {
            throw new Error("Error retrieving total renewable energy contribution for the company");
        } finally {
            if (connection) await connection.close();
        }
    }
    
    static async getTotalRenewableEnergyByDataCenterId(data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    SUM(co2_emissions_tons * (renewable_energy_percentage / 100)) AS total_renewable_energy
                FROM data_center_carbon_emissions
                WHERE data_center_id = @data_center_id
            `;
    
            const request = connection.request();
            request.input('data_center_id', sql.Int, data_center_id);
            
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset[0].total_renewable_energy : null;
        } catch (error) {
            throw new Error("Error retrieving total renewable energy contribution for the data center");
        } finally {
            if (connection) await connection.close();
        }
    }
    
    static async getTotalRenewableEnergyByDataCenterIdAndYearMonth(data_center_id, year, month) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    SUM(co2_emissions_tons * (renewable_energy_percentage / 100)) AS total_renewable_energy
                FROM data_center_carbon_emissions
                WHERE data_center_id = @data_center_id
                AND YEAR(date) = @year AND MONTH(date) = @month
            `;
    
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            request.input('year', year);
            request.input('month', month);
            
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset[0].total_renewable_energy : null;
        } catch (error) {
            throw new Error("Error retrieving total renewable energy contribution for the data center by date range");
        } finally {
            if (connection) await connection.close();
        }
    }

    static async getTotalRenewableEnergyByDataCenterIdAndYear(data_center_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    SUM(co2_emissions_tons * (renewable_energy_percentage / 100)) AS total_renewable_energy
                FROM data_center_carbon_emissions
                WHERE data_center_id = @data_center_id
                AND YEAR(date) = @year
            `;
    
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            request.input('year', year);
            
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset[0].total_renewable_energy : null;
        } catch (error) {
            throw new Error("Error retrieving total renewable energy contribution for the data center by date range");
        } finally {
            if (connection) await connection.close();
        }
    }
    
    static async getTotalRenewableEnergyByCompanyIdAndYearMonth(company_id, year, month) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    SUM(co2_emissions_tons * (renewable_energy_percentage / 100)) AS total_renewable_energy
                FROM data_center_carbon_emissions AS e
                INNER JOIN data_centers AS d ON e.data_center_id = d.id
                WHERE d.company_id = @company_id
                AND YEAR(date) = @year AND MONTH(date) = @month
            `;
    
            const request = connection.request();
            request.input('company_id', sql.Int, company_id);
            request.input('year', year);
            request.input('month', month);
            
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset[0].total_renewable_energy : null;
        } catch (error) {
            throw new Error("Error retrieving total renewable energy contribution for the company by date range");
        } finally {
            if (connection) await connection.close();
        }
    }

    static async getTotalRenewableEnergyByCompanyIdAndYear(company_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    SUM(co2_emissions_tons * (renewable_energy_percentage / 100)) AS total_renewable_energy
                FROM data_center_carbon_emissions AS e
                INNER JOIN data_centers AS d ON e.data_center_id = d.id
                WHERE d.company_id = @company_id
                AND YEAR(date) = @year
            `;
    
            const request = connection.request();
            request.input('company_id', sql.Int, company_id);
            request.input('year', year);
            
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset[0].total_renewable_energy : null;
        } catch (error) {
            throw new Error("Error retrieving total renewable energy contribution for the company by date range");
        } finally {
            if (connection) await connection.close();
        }
    }
// ---------------------------------------------------------------------------------------------------






static async getEnergyConsumptionGroupByDcForAllTime(company_id) { // chart
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
	    SELECT 
            data_centers.id AS data_center_id,
            data_centers.data_center_name,
            SUM(data_center_energy_consumption.total_energy_mwh) AS total_energy_consumption_mwh,
            SUM(data_center_energy_consumption.backup_power_energy_mwh) AS total_backup_power_mwh,
            SUM(data_center_energy_consumption.cooling_energy_mwh) AS total_cooling_mwh,
            SUM(data_center_energy_consumption.it_energy_mwh) AS total_it_energy_mwh,
            SUM(data_center_energy_consumption.lighting_energy_mwh) AS total_lighting_mwh
        FROM 
            data_center_energy_consumption
        INNER JOIN 
            data_centers ON data_centers.id = data_center_energy_consumption.data_center_id
        INNER JOIN 
            companies ON companies.id = data_centers.company_id
        WHERE 
            companies.id = @company_id
        GROUP BY 
            data_centers.id, data_centers.data_center_name;
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



static async getEnergyConsumptionGroupByDcForYear(company_id, year) { // bar chart for year-only filter
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT 
            data_centers.id AS data_center_id,
            data_centers.data_center_name,
            SUM(data_center_energy_consumption.total_energy_mwh) AS total_energy_consumption_mwh,
            SUM(data_center_energy_consumption.backup_power_energy_mwh) AS total_backup_power_mwh,
            SUM(data_center_energy_consumption.cooling_energy_mwh) AS total_cooling_mwh,
            SUM(data_center_energy_consumption.it_energy_mwh) AS total_it_energy_mwh,
            SUM(data_center_energy_consumption.lighting_energy_mwh) AS total_lighting_mwh
        FROM 
            data_center_energy_consumption
        INNER JOIN 
            data_centers ON data_centers.id = data_center_energy_consumption.data_center_id
        INNER JOIN 
            companies ON companies.id = data_centers.company_id
        WHERE 
            companies.id = @company_id
            AND YEAR(data_center_energy_consumption.date) = @year
        GROUP BY 
            data_centers.id, data_centers.data_center_name;
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('year', year);
        const result = await request.query(sqlQuery);
        return result.recordset.length > 0 ? result.recordset : null;
    } catch (error) {
        throw new Error("Error retrieving Energy Consumption Data");
    } finally { 
        if (connection) await connection.close();
    }
}
static async getEnergyConsumptionGroupByDcForSaidMonthYear(company_id, month, year) { // bar chart
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT 
            data_centers.id AS data_center_id,
            data_centers.data_center_name,
            SUM(data_center_energy_consumption.total_energy_mwh) AS total_energy_consumption_mwh,
            SUM(data_center_energy_consumption.backup_power_energy_mwh) AS total_backup_power_mwh,
            SUM(data_center_energy_consumption.cooling_energy_mwh) AS total_cooling_mwh,
            SUM(data_center_energy_consumption.it_energy_mwh) AS total_it_energy_mwh,
            SUM(data_center_energy_consumption.lighting_energy_mwh) AS total_lighting_mwh
        FROM 
            data_center_energy_consumption
        INNER JOIN 
            data_centers ON data_centers.id = data_center_energy_consumption.data_center_id
        INNER JOIN 
            companies ON companies.id = data_centers.company_id
        WHERE 
            companies.id = @company_id
            AND MONTH(data_center_energy_consumption.date) = @month
            AND YEAR(data_center_energy_consumption.date) = @year
        GROUP BY 
            data_centers.id, data_centers.data_center_name;
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('month', month);
        request.input('year', year);
        const result = await request.query(sqlQuery);
        return result.recordset.length > 0 ? result.recordset : null;
    } catch (error) {
        throw new Error("Error retrieving Energy Consumption Data");
    } finally { 
        if (connection) await connection.close();
    }
}



// date and dc filter
static async getEnergyConsumptionGroupByDcForSelectedDc(company_id, data_center_id) { // line chart if filtered by dc - to show over time
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT 
            date,
            data_centers.id AS data_center_id,
            data_centers.data_center_name,
            (data_center_energy_consumption.total_energy_mwh) AS total_energy_consumption_mwh,
            (data_center_energy_consumption.backup_power_energy_mwh) AS total_backup_power_mwh,
            (data_center_energy_consumption.cooling_energy_mwh) AS total_cooling_mwh,
            (data_center_energy_consumption.it_energy_mwh) AS total_it_energy_mwh,
            (data_center_energy_consumption.lighting_energy_mwh) AS total_lighting_mwh
        FROM 
            data_center_energy_consumption
        INNER JOIN 
            data_centers ON data_centers.id = data_center_energy_consumption.data_center_id
        INNER JOIN 
            companies ON companies.id = data_centers.company_id
        WHERE 
            companies.id = @company_id AND data_center_id=@data_center_id
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('data_center_id', data_center_id);
        const result = await request.query(sqlQuery);
        return result.recordset.length > 0 ? result.recordset : null;
    } catch (error) {
        throw new Error("Error retrieving Energy Consumption Data");
    } finally { 
        if (connection) await connection.close();
    }
}

static async getEnergyConsumptionGroupByDcForSelectedDcByYear(company_id, data_center_id, year) { // line chart if filtered by dc - to show over time
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT 
            date,
            data_centers.id AS data_center_id,
            data_centers.data_center_name,
            (data_center_energy_consumption.total_energy_mwh) AS total_energy_consumption_mwh,
            (data_center_energy_consumption.backup_power_energy_mwh) AS total_backup_power_mwh,
            (data_center_energy_consumption.cooling_energy_mwh) AS total_cooling_mwh,
            (data_center_energy_consumption.it_energy_mwh) AS total_it_energy_mwh,
            (data_center_energy_consumption.lighting_energy_mwh) AS total_lighting_mwh
        FROM 
            data_center_energy_consumption
        INNER JOIN 
            data_centers ON data_centers.id = data_center_energy_consumption.data_center_id
        INNER JOIN 
            companies ON companies.id = data_centers.company_id
        WHERE 
            companies.id =@company_id AND data_center_id=@data_center_id
            AND YEAR(date) = @year
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('data_center_id', data_center_id);
        request.input('year', year);
        const result = await request.query(sqlQuery);
        return result.recordset.length > 0 ? result.recordset : null;
    } catch (error) {
        throw new Error("Error retrieving Energy Consumption Data");
    } finally { 
        if (connection) await connection.close();
    }
}
static async getEnergyConsumptionGroupByDcForSelectedDcByYearMonth(company_id, data_center_id, year, month) { // line chart if filtered by dc - to show over time
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT 
            date,
            data_centers.id AS data_center_id,
            data_centers.data_center_name,
            (data_center_energy_consumption.total_energy_mwh) AS total_energy_consumption_mwh,
            (data_center_energy_consumption.backup_power_energy_mwh) AS total_backup_power_mwh,
            (data_center_energy_consumption.cooling_energy_mwh) AS total_cooling_mwh,
            (data_center_energy_consumption.it_energy_mwh) AS total_it_energy_mwh,
            (data_center_energy_consumption.lighting_energy_mwh) AS total_lighting_mwh
        FROM 
            data_center_energy_consumption
        INNER JOIN 
            data_centers ON data_centers.id = data_center_energy_consumption.data_center_id
        INNER JOIN 
            companies ON companies.id = data_centers.company_id
        WHERE 
            companies.id =@company_id AND data_center_id=@data_center_id
            AND YEAR(date) = @year AND MONTH(date) = @month
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('data_center_id', data_center_id);
        request.input('year', year);
        request.input('month', month);
        const result = await request.query(sqlQuery);
        return result.recordset.length > 0 ? result.recordset : null;
    } catch (error) {
        throw new Error("Error retrieving Energy Consumption Data");
    } finally { 
        if (connection) {
            await connection.close();
        }
    }
}






static async getDevicesCountByCompanyId(company_id) {
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT COUNT(devices.device_type) AS device_count
        FROM devices
        INNER JOIN data_centers ON devices.data_center_id = data_centers.id
        INNER JOIN companies ON companies.id = data_centers.company_id
        WHERE companies.id = @company_id;
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        const result = await request.query(sqlQuery);
        return result.recordset.length > 0 ? result.recordset : null;
    } catch (error) {
        throw new Error("Error retrieving devices by company id");
    } finally { 
        if (connection) {
            await connection.close();
        }
    }
}

static async getDevicesCountByCompanyIdAndDc(company_id, dc) {
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT COUNT(devices.device_type) AS device_count
        FROM devices
        INNER JOIN data_centers ON devices.data_center_id = data_centers.id
        INNER JOIN companies ON companies.id = data_centers.company_id
        WHERE companies.id = @company_id AND data_centers.id = @dc;
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('dc', dc);
        const result = await request.query(sqlQuery);
        return result.recordset.length > 0 ? result.recordset : null;
    } catch (error) {
        throw new Error("Error retrieving devices by Data center id");
    } finally { 
        if (connection) {
            await connection.close();
        }
    }
}




// for device types n quantity by cid
static async getDeviceTypesByCompanyId(company_id) {
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT 
            CASE 
                WHEN device_type LIKE 'cooling system%' THEN 'cooling system'
                WHEN device_type LIKE 'Server Rack%' THEN 'server rack'
                ELSE device_type 
            END AS device_type_group,
            COUNT(*) AS device_count
        FROM devices
        INNER JOIN data_centers ON data_centers.id = devices.data_center_id
        INNER JOIN companies ON data_centers.company_id = companies.id
        WHERE companies.id = @company_id
        GROUP BY 
            CASE 
                WHEN device_type LIKE 'cooling system%' THEN 'cooling system'
                WHEN device_type LIKE 'Server Rack%' THEN 'server rack'
                ELSE device_type 
            END
        ORDER BY device_count ASC;
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        const result = await request.query(sqlQuery);
        return result.recordset.length > 0 ? result.recordset : null;
    } catch (error) {
        throw new Error("Error retrieving devices by company id");
    } finally { 
        if (connection) {
            await connection.close();
        }
    }
}
// for device types n quantity by cid and dcid
static async getDeviceTypesByCompanyIdAndDataCenter(company_id, dc) {
    let connection;
    try{
        connection =  await sql.connect(dbConfig);
        const sqlQuery = `
        SELECT 
            CASE 
                WHEN device_type LIKE 'cooling system%' THEN 'cooling system'
                WHEN device_type LIKE 'Server Rack%' THEN 'server rack'
                ELSE device_type 
            END AS device_type_group,
            COUNT(*) AS device_count
        FROM devices
        INNER JOIN data_centers ON data_centers.id = devices.data_center_id
        INNER JOIN companies ON data_centers.company_id = companies.id
        WHERE companies.id = @company_id AND data_centers.id = @dc
        GROUP BY 
            CASE 
                WHEN device_type LIKE 'cooling system%' THEN 'cooling system'
                WHEN device_type LIKE 'Server Rack%' THEN 'server rack'
                ELSE device_type 
            END
        ORDER BY device_count ASC;
        `;
        const request = connection.request();
        request.input('company_id', company_id);
        request.input('dc', dc);
        const result = await request.query(sqlQuery);
        return result.recordset.length > 0 ? result.recordset : null;
    } catch (error) {
        throw new Error("Error retrieving devices by company id and data center id");
    } finally { 
        if (connection) {
            await connection.close();
        }
    }
}







static async getCompanyName(company_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
        select name from companies WHERE id = @company_id
        `; 
        const request = connection.request();
        request.input('company_id', company_id);
        const result = await request.query(sqlQuery);
        if(result.recordset.length === 0) {
            return null;
        }
        return result.recordset;
    } catch (error) {
        throw new Error("Error retrieving Company Name");
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

    static async getEnergyConsumptionTrendByCompanyIdAndDate(companyID, dc, month, year){
        let groupBySQL;
        let filterStr = ""
        if (month != "all") filterStr += " AND MONTH(date)=@month"

        if (year != "all") filterStr += " AND YEAR(date)=@year"

        if (dc != "all") filterStr += " AND dc.id=@id"

        if (month == "all" && year == "all"){
            groupBySQL = "YEAR(date)"
        }
        else if (month == "all"){
            groupBySQL = "MONTH(date)"
        }else{
            groupBySQL = "DAY(date)"
        }
        
        let trendSQL = `SELECT SUM(total_energy_mwh) AS total_energy, AVG(pue) AS pue, AVG(cue) as cue, AVG(wue) as wue, ${groupBySQL} AS num
        FROM data_center_energy_consumption AS ec INNER JOIN data_centers AS dc ON ec.data_center_id=dc.id WHERE dc.company_id=@companyID${filterStr} 
        GROUP BY ${groupBySQL}
        ORDER BY ${groupBySQL}`
        let connection = await sql.connect(dbConfig);
        const request = connection.request();
        request.input('companyID', companyID);
        request.input('id', companyID);
        request.input('month', month);
        request.input('year', year);
        const result = await request.query(trendSQL);
        connection.close()
        return result.recordset.length > 0 ? result.recordset : null;
    }
}

module.exports = dataCenterDashboard;