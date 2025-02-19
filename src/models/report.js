const sql = require("mssql");
const dbConfig = require("../database/dbConfig");

class Report {
    constructor(companyName, date, co2EmissionsTons, sustainabilityGoals, radioEquipmentEnergy, coolingEnergy, backupEnergy, miscEnergy, dataCenterId) {
        this.companyName = companyName;
        this.date = date;
        this.co2EmissionsTons = co2EmissionsTons;
        this.sustainabilityGoals = sustainabilityGoals;
        this.radioEquipmentEnergy = radioEquipmentEnergy;
        this.coolingEnergy = coolingEnergy;
        this.backupEnergy = backupEnergy;
        this.miscEnergy = miscEnergy;
        this.dataCenterId = dataCenterId;
    }

    static async getAllReport(company_id, year) {
        try {
            const connection = await sql.connect(dbConfig);
    
            const yearFilter = year ? `AND YEAR(CTec.date) = ${year}` : '';
            const companyFilter = company_id ? `AND c.id = ${company_id}` : '';
    
            const query = `
                SELECT 
                    c.name AS companyName, 
                    CTec.date, 
                    MAX(CTec.radio_equipment_energy_kwh) AS radioEquipmentEnergy,
                    MAX(CTec.cooling_energy_kwh) AS coolingEnergy,
                    MAX(CTec.backup_power_energy_kwh) AS backupEnergy,
                    MAX(CTec.misc_energy_kwh) AS miscEnergy,
                    MAX(sg.goal_name) AS goal_name, 
                    MAX(sg.target_value) AS target_value, 
                    MAX(sg.target_year) AS target_year, 
                    NULL AS dataCenterId
                FROM companies c
                INNER JOIN cell_tower_energy_consumption CTec ON c.id = CTec.cell_tower_id
                LEFT JOIN company_sustainability_goals sg ON c.id = sg.company_id
                WHERE 1=1 ${companyFilter} ${yearFilter}
                GROUP BY c.name, CTec.date
    
                UNION ALL
    
                SELECT 
                    c.name AS companyName, 
                    DCec.date, 
                    MAX(DCec.it_energy_mwh) AS radioEquipmentEnergy,
                    MAX(DCec.cooling_energy_mwh) AS coolingEnergy,
                    MAX(DCec.backup_power_energy_mwh) AS backupEnergy,
                    MAX(DCec.lighting_energy_mwh) AS miscEnergy,
                    MAX(sg.goal_name) AS goal_name, 
                    MAX(sg.target_value) AS target_value, 
                    MAX(sg.target_year) AS target_year, 
                    dct.id AS dataCenterId
                FROM companies c
                INNER JOIN data_centers dct ON c.id = dct.company_id
                INNER JOIN data_center_energy_consumption DCec ON dct.id = DCec.data_center_id
                LEFT JOIN company_sustainability_goals sg ON c.id = sg.company_id
                WHERE 1=1 ${companyFilter} ${year ? `AND YEAR(DCec.date) = ${year}` : ''}
                GROUP BY c.name, DCec.date, dct.id
                ORDER BY date;
            `;
    
            const result = await connection.query(query);
    
            const reports = result.recordset.map((row) => {
                return new Report(
                    row.companyName,
                    row.date,
                    null, // Set CO2 emissions to null as it will be added later
                    [
                        {
                            goalName: row.goal_name,
                            targetValue: row.target_value,
                            targetYear: row.target_year,
                        },
                    ],
                    row.radioEquipmentEnergy,
                    row.coolingEnergy,
                    row.backupEnergy,
                    row.miscEnergy,
                    row.dataCenterId || null
                );
            });
    
            return reports;
        } catch (error) {
            console.error("Error fetching reports:", error);
            throw error;
        } finally {
            await sql.close();
        }
    }
    static async getTotalCarbonEmissions(company_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // Query for data center CO2 emissions
            const dataCenterQuery = `
                SELECT 
                    ISNULL(SUM(co2_emissions_tons), 0) AS dataCenterCO2Emissions
                FROM 
                    data_center_carbon_emissions
                WHERE 
                    data_center_id IN (SELECT id FROM data_centers WHERE company_id = @company_id)
                    ${year ? `AND YEAR(date) = @year` : ''}
            `;
    
            const cellTowerQuery = `
                SELECT 
                    ISNULL(SUM(carbon_emission_kg), 0) AS cellTowerCO2Emissions
                FROM 
                    cell_tower_energy_consumption
                WHERE 
                    cell_tower_id IN (SELECT id FROM cell_towers WHERE company_id = @company_id)
                    ${year ? `AND YEAR(date) = @year` : ''}
            `;
    
            // Execute both queries in parallel
            const [dataCenterResult, cellTowerResult] = await Promise.all([
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(dataCenterQuery),
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(cellTowerQuery),
            ]);
    
            const dataCenterCO2 = dataCenterResult.recordset[0]?.dataCenterCO2Emissions || 0;
            const cellTowerCO2 = cellTowerResult.recordset[0]?.cellTowerCO2Emissions || 0;
    
            // Sum both CO₂ emissions
            const totalCO2Emissions = dataCenterCO2 + cellTowerCO2;
    
            // Return structured data
            return {
                dataCenterCO2Emissions: dataCenterCO2,
                cellTowerCO2Emissions: cellTowerCO2,
                totalCO2Emissions,
            };
            
        } catch (error) {
            console.error("Error fetching total carbon emissions:", error);
            throw error;
        } finally {
            if (connection) await sql.close();
        }
    }
    static async getAllCarbonEmissions(company_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // Query to fetch detailed data center CO2 emissions
            const dataCenterQuery = `
                SELECT 
                    DCec.date,
                    dct.id AS dataCenterId,
                    ISNULL(DCec.co2_emissions_tons, 0) AS dataCenterCO2Emissions
                FROM 
                    data_center_carbon_emissions DCec
                INNER JOIN 
                    data_centers dct ON DCec.data_center_id = dct.id
                WHERE 
                    dct.company_id = @company_id
                    ${year ? `AND YEAR(DCec.date) = @year` : ''}
                ORDER BY 
                    DCec.date ASC;
            `;
    
            // Query to fetch detailed cell tower CO2 emissions
            const cellTowerQuery = `
                SELECT 
                    CTec.date,
                    ctt.id AS cellTowerId,
                    ISNULL(CTec.carbon_emission_kg / 1000.0, 0) AS cellTowerCO2Emissions
                FROM 
                    cell_tower_energy_consumption CTec
                INNER JOIN 
                    cell_towers ctt ON CTec.cell_tower_id = ctt.id
                WHERE 
                    ctt.company_id = @company_id
                    ${year ? `AND YEAR(CTec.date) = @year` : ''}
                ORDER BY 
                    CTec.date ASC;
            `;
    
            // Execute both queries in parallel
            const [dataCenterResult, cellTowerResult] = await Promise.all([
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(dataCenterQuery),
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(cellTowerQuery),
            ]);
    
            const dataCenterEmissions = dataCenterResult.recordset.map(row => ({
                date: row.date,
                dataCenterId: row.dataCenterId,
                co2Emissions: row.dataCenterCO2Emissions,
            }));
    
            const cellTowerEmissions = cellTowerResult.recordset.map(row => ({
                date: row.date,
                cellTowerId: row.cellTowerId,
                co2Emissions: row.cellTowerCO2Emissions,
            }));
    
            // Combine data for both sources
            return {
                dataCenterEmissions,
                cellTowerEmissions,
            };
        } catch (error) {
            console.error("Error fetching detailed carbon emissions:", error);
            throw error;
        } finally {
            if (connection) await sql.close();
        }
    }
    static async getMonthlyCarbonEmissions(company_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // Query for data center monthly CO2 emissions
            const dataCenterQuery = `
                SELECT 
                    YEAR(DCec.date) AS year,
                    MONTH(DCec.date) AS month,
                    SUM(ISNULL(DCec.co2_emissions_tons, 0)) AS totalDataCenterCO2Emissions
                FROM 
                    data_center_carbon_emissions DCec
                INNER JOIN 
                    data_centers dct ON DCec.data_center_id = dct.id
                WHERE 
                    dct.company_id = @company_id
                    ${year ? `AND YEAR(DCec.date) = @year` : ''}
                GROUP BY 
                    YEAR(DCec.date), MONTH(DCec.date)
                ORDER BY 
                    YEAR(DCec.date), MONTH(DCec.date);
            `;
    
            // Query for cell tower monthly CO2 emissions
            const cellTowerQuery = `
                SELECT 
                    YEAR(CTec.date) AS year,
                    MONTH(CTec.date) AS month,
                    SUM(ISNULL(CTec.carbon_emission_kg, 0)) AS totalCellTowerCO2Emissions
                FROM 
                    cell_tower_energy_consumption CTec
                INNER JOIN 
                    cell_towers ctt ON CTec.cell_tower_id = ctt.id
                WHERE 
                    ctt.company_id = @company_id
                    ${year ? `AND YEAR(CTec.date) = @year` : ''}
                GROUP BY 
                    YEAR(CTec.date), MONTH(CTec.date)
                ORDER BY 
                    YEAR(CTec.date), MONTH(CTec.date);
            `;
    
            // Execute queries
            const [dataCenterResult, cellTowerResult] = await Promise.all([
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(dataCenterQuery),
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(cellTowerQuery),
            ]);
    
            // Format results into a unified structure
            const monthlyEmissions = {};
            dataCenterResult.recordset.forEach((row) => {
                const key = `${row.year}-${row.month}`;
                if (!monthlyEmissions[key]) {
                    monthlyEmissions[key] = {
                        year: row.year,
                        month: row.month,
                        dataCenterCO2Emissions: 0,
                        cellTowerCO2Emissions: 0,
                    };
                }
                monthlyEmissions[key].dataCenterCO2Emissions += row.totalDataCenterCO2Emissions || 0;
            });
    
            cellTowerResult.recordset.forEach((row) => {
                const key = `${row.year}-${row.month}`;
                if (!monthlyEmissions[key]) {
                    monthlyEmissions[key] = {
                        year: row.year,
                        month: row.month,
                        dataCenterCO2Emissions: 0,
                        cellTowerCO2Emissions: 0,
                    };
                }
                monthlyEmissions[key].cellTowerCO2Emissions += row.totalCellTowerCO2Emissions || 0;
            });
    
            // Convert the object to an array sorted by year and month
            const result = Object.values(monthlyEmissions).sort((a, b) => {
                if (a.year === b.year) return a.month - b.month;
                return a.year - b.year;
            });
    
            return result;
        } catch (error) {
            console.error("Error fetching monthly carbon emissions:", error);
            throw error;
        } finally {
            if (connection) await connection.close();
        }
    }

    static async getDistinctYears(company_id) {
        try {
            const connection = await sql.connect(dbConfig);
            const companyFilter = company_id ? `AND c.id = ${company_id}` : '';
    
            const query = `
                SELECT DISTINCT YEAR(date) AS year
                FROM (
                    SELECT CTec.date
                    FROM cell_tower_energy_consumption CTec
                    INNER JOIN companies c ON c.id = CTec.cell_tower_id
                    WHERE 1=1 ${companyFilter}

                    UNION ALL

                    SELECT DCec.date
                    FROM data_center_energy_consumption DCec
                    INNER JOIN data_centers dct ON dct.id = DCec.data_center_id
                    INNER JOIN companies c ON c.id = dct.company_id
                    WHERE 1=1 ${companyFilter}
                ) AS combined
                ORDER BY year DESC;
            `;
    
            const result = await connection.query(query);
            return result.recordset.map(row => row.year);
        } catch (error) {
            console.error("Error fetching distinct years:", error);
            throw error;
        } finally {
            await sql.close();
        }
    }

    static async getEfficiencyMetricsComparison(company_id, year) {
        try {
            const connection = await sql.connect(dbConfig);
    
            const query = `
                SELECT 
                    YEAR(DCec.date) AS year,
                    AVG(DCec.pue) AS avgPUE,
                    AVG(DCec.cue) AS avgCUE,
                    AVG(DCec.wue) AS avgWUE
                FROM data_center_energy_consumption DCec
                INNER JOIN data_centers dct ON dct.id = DCec.data_center_id
                INNER JOIN companies c ON c.id = dct.company_id
                WHERE c.id = @company_id AND YEAR(DCec.date) = @year
                GROUP BY YEAR(DCec.date);
            `;
    
            const request = connection.request();
            request.input('company_id', sql.Int, company_id);
            request.input('year', sql.Int, year);
    
            const result = await request.query(query);
    
            if (result.recordset.length === 0) {
                console.log(`No efficiency metrics found for year: ${year}`); // Debug log
                return null;
            }
    
            const row = result.recordset[0];
            return {
                PUE: row.avgPUE || null,
                CUE: row.avgCUE || null,
                WUE: row.avgWUE || null,
            };
        } catch (error) {
            console.error('Error fetching efficiency metrics:', error);
            throw error;
        } finally {
            await sql.close();
        }
    }
    static async getMonthlyEnergyBreakdown(company_id, year, month) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            const query = `
                SELECT
                    SUM(CTec.radio_equipment_energy_kwh) AS radioEquipment,
                    SUM(CTec.cooling_energy_kwh) AS cooling,
                    SUM(CTec.backup_power_energy_kwh) AS backupPower,
                    SUM(CTec.misc_energy_kwh) AS misc
                FROM
                    cell_tower_energy_consumption CTec
                INNER JOIN
                    companies c ON c.id = CTec.cell_tower_id
                WHERE
                    c.id = @company_id AND YEAR(CTec.date) = @year AND MONTH(CTec.date) = @month
                UNION ALL
                SELECT
                    SUM(DCec.it_energy_mwh) AS radioEquipment,
                    SUM(DCec.cooling_energy_mwh) AS cooling,
                    SUM(DCec.backup_power_energy_mwh) AS backupPower,
                    SUM(DCec.lighting_energy_mwh) AS misc
                FROM
                    data_center_energy_consumption DCec
                INNER JOIN
                    data_centers dct ON dct.id = DCec.data_center_id
                INNER JOIN
                    companies c ON c.id = dct.company_id
                WHERE
                    c.id = @company_id AND YEAR(DCec.date) = @year AND MONTH(DCec.date) = @month;
            `;
    
            const result = await connection
                .request()
                .input('company_id', sql.Int, company_id)
                .input('year', sql.Int, year)
                .input('month', sql.Int, month)
                .query(query);
    
            return result.recordset.reduce((acc, row) => {
                acc.radioEquipment += row.radioEquipment || 0;
                acc.cooling += row.cooling || 0;
                acc.backupPower += row.backupPower || 0;
                acc.misc += row.misc || 0;
                return acc;
            }, { radioEquipment: 0, cooling: 0, backupPower: 0, misc: 0 });
        } catch (error) {
            console.error("Error fetching monthly energy breakdown:", error);
            throw error;
        } finally {
            if (connection) await connection.close();
        }
    }
    static async getYearlyEnergyBreakdown(company_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            const query = `
                SELECT
                    YEAR(CTec.date) AS year,
                    MONTH(CTec.date) AS month,
                    SUM(CTec.radio_equipment_energy_kwh) AS radioEquipment,
                    SUM(CTec.cooling_energy_kwh) AS cooling,
                    SUM(CTec.backup_power_energy_kwh) AS backupPower,
                    SUM(CTec.misc_energy_kwh) AS misc
                FROM
                    cell_tower_energy_consumption CTec
                INNER JOIN
                    companies c ON c.id = CTec.cell_tower_id
                WHERE
                    c.id = @company_id AND YEAR(CTec.date) = @year
                GROUP BY
                    YEAR(CTec.date), MONTH(CTec.date)
    
                UNION ALL
    
                SELECT
                    YEAR(DCec.date) AS year,
                    MONTH(DCec.date) AS month,
                    SUM(DCec.it_energy_mwh) AS radioEquipment,
                    SUM(DCec.cooling_energy_mwh) AS cooling,
                    SUM(DCec.backup_power_energy_mwh) AS backupPower,
                    SUM(DCec.lighting_energy_mwh) AS misc
                FROM
                    data_center_energy_consumption DCec
                INNER JOIN
                    data_centers dct ON DCec.data_center_id = dct.id
                INNER JOIN
                    companies c ON c.id = dct.company_id
                WHERE
                    c.id = @company_id AND YEAR(DCec.date) = @year
                GROUP BY
                    YEAR(DCec.date), MONTH(DCec.date)
            `;
    
            const result = await connection
                .request()
                .input("company_id", sql.Int, company_id)
                .input("year", sql.Int, year)
                .query(query);
    
            // Combine data by month
            const monthlyData = {};
    
            const processResult = (result) => {
                result.recordset.forEach((row) => {
                    const monthKey = `${row.year}-${row.month.toString().padStart(2, "0")}`;
                    if (!monthlyData[monthKey]) {
                        monthlyData[monthKey] = {
                            month: monthKey,
                            radioEquipment: 0,
                            cooling: 0,
                            backupPower: 0,
                            misc: 0,
                        };
                    }
                    monthlyData[monthKey].radioEquipment += row.radioEquipment || 0;
                    monthlyData[monthKey].cooling += row.cooling || 0;
                    monthlyData[monthKey].backupPower += row.backupPower || 0;
                    monthlyData[monthKey].misc += row.misc || 0;
                });
            };
    
            processResult(result);
    
            // Convert the object to an array sorted by month
            return Object.values(monthlyData).sort((a, b) => new Date(a.month) - new Date(b.month));
        } catch (error) {
            console.error("Error fetching yearly energy breakdown:", error);
            throw error;
        } finally {
            if (connection) await connection.close();
        }
    }
    
    static async getMonthlyEnergyConsumption(company_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // Query for data center monthly energy consumption
            const dataCenterQuery = `
                SELECT 
                    YEAR(DCec.date) AS year,
                    MONTH(DCec.date) AS month,
                    SUM(ISNULL(DCec.total_energy_mwh, 0)) AS totalDataCenterEnergyConsumption
                FROM 
                    data_center_energy_consumption DCec
                INNER JOIN 
                    data_centers dct ON DCec.data_center_id = dct.id
                WHERE 
                    dct.company_id = @company_id
                    ${year ? `AND YEAR(DCec.date) = @year` : ''}
                GROUP BY 
                    YEAR(DCec.date), MONTH(DCec.date)
                ORDER BY 
                    YEAR(DCec.date), MONTH(DCec.date);
            `;
    
            // Query for cell tower monthly energy consumption
            const cellTowerQuery = `
                SELECT 
                    YEAR(CTec.date) AS year,
                    MONTH(CTec.date) AS month,
                    SUM(ISNULL(CTec.total_energy_kwh, 0)) AS totalCellTowerEnergyConsumption
                FROM 
                    cell_tower_energy_consumption CTec
                INNER JOIN 
                    cell_towers ctt ON CTec.cell_tower_id = ctt.id
                WHERE 
                    ctt.company_id = @company_id
                    ${year ? `AND YEAR(CTec.date) = @year` : ''}
                GROUP BY 
                    YEAR(CTec.date), MONTH(CTec.date)
                ORDER BY 
                    YEAR(CTec.date), MONTH(CTec.date);
            `;
    
            // Execute queries
            const [dataCenterResult, cellTowerResult] = await Promise.all([
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(dataCenterQuery),
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(cellTowerQuery),
            ]);
    
            // Format results into a unified structure
            const monthlyEnergyConsumption = {};
            dataCenterResult.recordset.forEach((row) => {
                const key = `${row.year}-${row.month}`;
                if (!monthlyEnergyConsumption[key]) {
                    monthlyEnergyConsumption[key] = {
                        year: row.year,
                        month: row.month,
                        dataCenterEnergyConsumption: 0,
                        cellTowerEnergyConsumption: 0,
                    };
                }
                monthlyEnergyConsumption[key].dataCenterEnergyConsumption += row.totalDataCenterEnergyConsumption || 0;
            });
    
            cellTowerResult.recordset.forEach((row) => {
                const key = `${row.year}-${row.month}`;
                if (!monthlyEnergyConsumption[key]) {
                    monthlyEnergyConsumption[key] = {
                        year: row.year,
                        month: row.month,
                        dataCenterEnergyConsumption: 0,
                        cellTowerEnergyConsumption: 0,
                    };
                }
                monthlyEnergyConsumption[key].cellTowerEnergyConsumption += row.totalCellTowerEnergyConsumption || 0;
            });
    
            // Convert the object to an array sorted by year and month
            const result = Object.values(monthlyEnergyConsumption).sort((a, b) => {
                if (a.year === b.year) return a.month - b.month;
                return a.year - b.year;
            });
    
            return result;
        } catch (error) {
            console.error("Error fetching monthly energy consumption:", error);
            throw error;
        } finally {
            if (connection) await connection.close();
        }
    }
    static async getTotalEnergyConsumption(company_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // Query for total data center energy consumption
            const dataCenterQuery = `
                SELECT 
                    ISNULL(SUM(DCec.total_energy_mwh), 0) AS totalDataCenterEnergyConsumption
                FROM 
                    data_center_energy_consumption DCec
                INNER JOIN 
                    data_centers dct ON DCec.data_center_id = dct.id
                WHERE 
                    dct.company_id = @company_id
                    ${year ? `AND YEAR(DCec.date) = @year` : ''}
            `;
    
            // Query for total cell tower energy consumption
            const cellTowerQuery = `
                SELECT 
                    ISNULL(SUM(CTec.total_energy_kwh), 0) AS totalCellTowerEnergyConsumption
                FROM 
                    cell_tower_energy_consumption CTec
                INNER JOIN 
                    cell_towers ctt ON CTec.cell_tower_id = ctt.id
                WHERE 
                    ctt.company_id = @company_id
                    ${year ? `AND YEAR(CTec.date) = @year` : ''}
            `;
    
            // Execute both queries in parallel
            const [dataCenterResult, cellTowerResult] = await Promise.all([
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(dataCenterQuery),
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(cellTowerQuery),
            ]);
    
            // Extract energy consumption values
            const totalDataCenterEnergy = dataCenterResult.recordset[0]?.totalDataCenterEnergyConsumption || 0;
            const totalCellTowerEnergy = cellTowerResult.recordset[0]?.totalCellTowerEnergyConsumption || 0;
    
            // Calculate the total energy consumption
            const totalEnergyConsumption = totalDataCenterEnergy + totalCellTowerEnergy;
    
            // Return the result as an object
            return {
                totalDataCenterEnergy,
                totalCellTowerEnergy,
                totalEnergyConsumption,
            };
        } catch (error) {
            console.error("Error fetching total energy consumption:", error);
            throw error;
        } finally {
            if (connection) await sql.close();
        }
    }

    static async getTotalRenewableEnergy(company_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // Query for total data center renewable energy
            const dataCenterQuery = `
                SELECT 
                    ISNULL(SUM(DCec.total_energy_mwh * (DCce.renewable_energy_percentage / 100)), 0) AS totalDataCenterRenewableEnergy
                FROM 
                    data_center_energy_consumption DCec
                LEFT JOIN 
                    data_center_carbon_emissions DCce 
                    ON DCec.data_center_id = DCce.data_center_id 
                    AND YEAR(DCec.date) = YEAR(DCce.date) 
                    AND MONTH(DCec.date) = MONTH(DCce.date)
                INNER JOIN 
                    data_centers dct ON DCec.data_center_id = dct.id
                WHERE 
                    dct.company_id = @company_id
                    ${year ? `AND YEAR(DCec.date) = @year` : ''};
            `;
    
            // Query for total cell tower renewable energy
            const cellTowerQuery = `
                SELECT 
                    ISNULL(SUM(CTec.renewable_energy_kwh / 1000.0), 0) AS totalCellTowerRenewableEnergy
                FROM 
                    cell_tower_energy_consumption CTec
                INNER JOIN 
                    cell_towers ctt ON CTec.cell_tower_id = ctt.id
                WHERE 
                    ctt.company_id = @company_id
                    ${year ? `AND YEAR(CTec.date) = @year` : ''};
            `;
    
            // Execute both queries in parallel
            const [dataCenterResult, cellTowerResult] = await Promise.all([
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(dataCenterQuery),
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(cellTowerQuery),
            ]);
    
            const totalDataCenterRenewableEnergy = dataCenterResult.recordset[0]?.totalDataCenterRenewableEnergy || 0;
            const totalCellTowerRenewableEnergy = cellTowerResult.recordset[0]?.totalCellTowerRenewableEnergy || 0;
    
            // Calculate total renewable energy
            const totalRenewableEnergy = totalDataCenterRenewableEnergy + totalCellTowerRenewableEnergy;
    
            return {
                totalDataCenterRenewableEnergy,
                totalCellTowerRenewableEnergy,
                totalRenewableEnergy,
            };
        } catch (error) {
            console.error("Error fetching total renewable energy:", error);
            throw error;
        } finally {
            if (connection) await sql.close();
        }
    }

    static async getMonthlyRenewableEnergy(company_id, year) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // Query for data center monthly renewable energy
            const dataCenterQuery = `
                SELECT 
                    YEAR(DCec.date) AS year,
                    MONTH(DCec.date) AS month,
                    SUM(ISNULL(DCec.total_energy_mwh * (DCce.renewable_energy_percentage / 100), 0)) AS totalDataCenterRenewableEnergy
                FROM 
                    data_center_energy_consumption DCec
                LEFT JOIN 
                    data_center_carbon_emissions DCce 
                    ON DCec.data_center_id = DCce.data_center_id 
                    AND YEAR(DCec.date) = YEAR(DCce.date) 
                    AND MONTH(DCec.date) = MONTH(DCce.date)
                INNER JOIN 
                    data_centers dct ON DCec.data_center_id = dct.id
                WHERE 
                    dct.company_id = @company_id
                    ${year ? `AND YEAR(DCec.date) = @year` : ''}
                GROUP BY 
                    YEAR(DCec.date), MONTH(DCec.date)
                ORDER BY 
                    YEAR(DCec.date), MONTH(DCec.date);
            `;
    
            // Query for cell tower monthly renewable energy
            const cellTowerQuery = `
                SELECT 
                    YEAR(CTec.date) AS year,
                    MONTH(CTec.date) AS month,
                    SUM(ISNULL(CTec.renewable_energy_kwh / 1000.0, 0)) AS totalCellTowerRenewableEnergy
                FROM 
                    cell_tower_energy_consumption CTec
                INNER JOIN 
                    cell_towers ctt ON CTec.cell_tower_id = ctt.id
                WHERE 
                    ctt.company_id = @company_id
                    ${year ? `AND YEAR(CTec.date) = @year` : ''}
                GROUP BY 
                    YEAR(CTec.date), MONTH(CTec.date)
                ORDER BY 
                    YEAR(CTec.date), MONTH(CTec.date);
            `;
    
            // Execute both queries
            const [dataCenterResult, cellTowerResult] = await Promise.all([
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(dataCenterQuery),
                connection.request()
                    .input("company_id", sql.Int, company_id)
                    .input("year", sql.Int, year)
                    .query(cellTowerQuery),
            ]);
    
            // Format results into a unified structure
            const monthlyRenewableEnergy = {};
            dataCenterResult.recordset.forEach((row) => {
                const key = `${row.year}-${row.month}`;
                if (!monthlyRenewableEnergy[key]) {
                    monthlyRenewableEnergy[key] = {
                        year: row.year,
                        month: row.month,
                        dataCenterRenewableEnergy: 0,
                        cellTowerRenewableEnergy: 0,
                    };
                }
                monthlyRenewableEnergy[key].dataCenterRenewableEnergy += row.totalDataCenterRenewableEnergy || 0;
            });
    
            cellTowerResult.recordset.forEach((row) => {
                const key = `${row.year}-${row.month}`;
                if (!monthlyRenewableEnergy[key]) {
                    monthlyRenewableEnergy[key] = {
                        year: row.year,
                        month: row.month,
                        dataCenterRenewableEnergy: 0,
                        cellTowerRenewableEnergy: 0,
                    };
                }
                monthlyRenewableEnergy[key].cellTowerRenewableEnergy += row.totalCellTowerRenewableEnergy || 0;
            });
    
            // Convert the object to an array sorted by year and month
            const result = Object.values(monthlyRenewableEnergy).sort((a, b) => {
                if (a.year === b.year) return a.month - b.month;
                return a.year - b.year;
            });
    
            return result;
        } catch (error) {
            console.error("Error fetching monthly renewable energy:", error);
            throw error;
        } finally {
            if (connection) await connection.close();
        }
    }
}

module.exports = Report;