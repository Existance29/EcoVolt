const sql = require("mssql");
const dbConfig = require("../database/dbConfig");

const DashboardModel = {
    async getHighestEmissions(company_id) {
        try {
            await sql.connect(dbConfig);

            // Query for highest emissions data center
            const highestDataCenterResult = await new sql.Request()
                .input("company_id", sql.Int, company_id)
                .query(`
                SELECT TOP 1 dc.id, dc.data_center_name, SUM(dce.co2_emissions_tons) AS co2_emissions_tons
                FROM data_center_carbon_emissions AS dce
                JOIN data_centers AS dc ON dce.data_center_id = dc.id
                WHERE dc.company_id = @company_id
                GROUP BY dc.id, dc.data_center_name
                ORDER BY co2_emissions_tons DESC;
                `);
            const highestDataCenter = highestDataCenterResult.recordset[0] || {};

            // Query for highest emissions cell tower
            const highestCellTowerResult = await new sql.Request()
            .input("company_id", sql.Int, company_id)
            .query(`
                SELECT TOP 1 
                    ct.id, 
                    ct.cell_tower_name, 
                    YEAR(ctec.date) AS year, 
                    SUM(ctec.carbon_emission_kg) AS total_emissions
                FROM 
                    cell_tower_energy_consumption AS ctec 
                JOIN 
                    cell_towers AS ct ON ctec.cell_tower_id = ct.id 
                WHERE 
                    ct.company_id = @company_id 
                GROUP BY 
                    ct.id, 
                    ct.cell_tower_name, 
                    YEAR(ctec.date) 
                ORDER BY 
                    total_emissions DESC;
            `);
            const highestCellTower = highestCellTowerResult.recordset[0] || {};


            return {
                highestDataCenter,
                highestCellTower
            };

        } catch (error) {
            console.error("Error getting highest emissions:", error);
            throw error;
        } finally {
            await sql.close();
        }
    },

    async getTotalEmissions(company_id) {
        try {
            await sql.connect(dbConfig);

            // Total emissions for data centers
            const dataCenterResult = await new sql.Request()
                .input("company_id", sql.Int, company_id)
                .query(`
                    SELECT SUM(dce.co2_emissions_tons) AS total_emissions
                    FROM data_center_carbon_emissions AS dce
                    JOIN data_centers AS dc ON dce.data_center_id = dc.id
                    WHERE dc.company_id = @company_id;
                `);
            const totalDataCenterEmissions = dataCenterResult.recordset[0]?.total_emissions || 0;

            // Total emissions for cell towers
            const cellTowerResult = await new sql.Request()
                .input("company_id", sql.Int, company_id)
                .query(`
                    SELECT SUM(ctec.carbon_emission_kg) AS total_emissions
                    FROM cell_tower_energy_consumption AS ctec
                    JOIN cell_towers AS ct ON ctec.cell_tower_id = ct.id
                    WHERE ct.company_id = @company_id;

                `);
            const totalCellTowerEmissions = cellTowerResult.recordset[0]?.total_emissions || 0;

            return {
                totalDataCenterEmissions,
                totalCellTowerEmissions,
                overallTotal: totalDataCenterEmissions + totalCellTowerEmissions
            };

        } catch (error) {
            console.error("Error getting total emissions:", error);
            throw error;
        } finally {
            await sql.close();
        }
    },

    async getSustainabilityGoals(company_id) {
        try {
            await sql.connect(dbConfig);
    
            const result = await new sql.Request()
                .input("company_id", sql.Int, company_id)
                .query(`
                    SELECT 
                        goal_name, 
                        target_value, 
                        current_value,
                        CASE 
                            WHEN target_value = 0 THEN 0
                            ELSE (current_value / target_value) * 100 
                        END AS progress
                    FROM company_sustainability_goals
                    WHERE company_id = @company_id;
                `);
    
            return result.recordset;
    
        } catch (error) {
            console.error("Error fetching sustainability goals:", error);
            throw error;
        } finally {
            await sql.close();
        }
    },
    

    async getTop3YearsByEmissions(company_id) {
        try {
            await sql.connect(dbConfig);
    
            const request = new sql.Request();
            request.input("company_id", sql.Int, company_id);  // Set the company_id parameter
    
            const result = await request.query(`
            SELECT TOP 3 
                YEAR(dce.date) AS year, 
                SUM(dce.co2_emissions_tons) AS total_emissions
            FROM data_center_carbon_emissions AS dce
            JOIN data_centers AS dc ON dce.data_center_id = dc.id
            WHERE dc.company_id = @company_id
            GROUP BY YEAR(dce.date)
            ORDER BY total_emissions DESC;
            `);
    
            return result.recordset;
    
        } catch (error) {
            console.error("Error getting top 3 years by emissions for the company:", error);
            throw error;
        } finally {
            await sql.close();
        }
    },
    
    
    

    async getTop3CellTowersByAvoidedEmissions(company_id) {
        try {
            await sql.connect(dbConfig);
    
            const result = await new sql.Request()
                .input("company_id", sql.Int, company_id)
                .query(`
                   SELECT 
                    ct.id AS cell_tower_id,
                    ct.cell_tower_name,
                    SUM(ctec.renewable_energy_kwh * 0.233) AS avoided_emissions
                FROM 
                    cell_tower_energy_consumption AS ctec
                JOIN 
                    cell_towers AS ct ON ctec.cell_tower_id = ct.id
                WHERE 
                    ct.company_id = @company_id
                GROUP BY 
                    ct.id, ct.cell_tower_name
                ORDER BY 
                    avoided_emissions DESC;


                `);
    
            return result.recordset;
    
        } catch (error) {
            console.error("Error fetching top 3 cell towers by avoided emissions:", error);
            throw error;
        } finally {
            await sql.close();
        }
    }
    
    
};

module.exports = DashboardModel;
