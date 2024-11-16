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
                   WITH DataCenterRenewableEnergy AS (
    SELECT
        dc.data_center_id,
        c.company_id,
        dc.date,
        dc.total_energy_mwh * 1000 AS total_energy_kwh, -- Convert MWh to kWh
        (dc.total_energy_mwh * 1000 * ce.renewable_energy_percentage / 100) AS renewable_energy_kwh, -- Calculate renewable energy in kWh
        dc.pue,
        dc.cue,
        dc.wue
    FROM
        data_center_energy_consumption dc
    INNER JOIN
        data_centers c ON dc.data_center_id = c.id
    INNER JOIN
        data_center_carbon_emissions ce ON dc.data_center_id = ce.data_center_id AND dc.date = ce.date
    WHERE
        c.company_id = @company_id -- Filter by company_id
),
CellTowerEnergy AS (
    SELECT
        ct.cell_tower_id,
        t.company_id,
        ct.date,
        ct.total_energy_kwh,
        ct.renewable_energy_kwh,
        ROUND(ct.total_energy_kwh / NULLIF(ct.radio_equipment_energy_kwh, 0), 2) AS pue, -- PUE calculation
        ROUND(ct.carbon_emission_kg / NULLIF(ct.total_energy_kwh, 0), 2) AS cue, -- CUE calculation
        NULL AS wue -- No WUE for cell towers
    FROM
        cell_tower_energy_consumption ct
    INNER JOIN
        cell_towers t ON ct.cell_tower_id = t.id
    WHERE
        t.company_id = @company_id -- Filter by company_id
),
CombinedData AS (
    SELECT
        company_id,
        total_energy_kwh,
        renewable_energy_kwh,
        pue,
        cue,
        wue
    FROM
        DataCenterRenewableEnergy
    UNION ALL
    SELECT
        company_id,
        total_energy_kwh,
        renewable_energy_kwh,
        pue,
        cue,
        wue
    FROM
        CellTowerEnergy
),
AggregatedData AS (
    SELECT
        company_id,
        CAST(AVG(pue) AS DECIMAL(5, 2)) AS avg_pue,
        CAST(AVG(cue) AS DECIMAL(5, 2)) AS avg_cue,
        CAST(AVG(wue) AS DECIMAL(5, 2)) AS avg_wue,
        CAST(SUM(renewable_energy_kwh) / NULLIF(SUM(total_energy_kwh), 0) * 100 AS DECIMAL(5, 2)) AS avg_renewable_energy_percentage
    FROM
        CombinedData
    GROUP BY
        company_id
)
SELECT
    g.company_id,
    g.goal_name,
    g.target_value,
    CASE
        WHEN g.goal_name = 'Renewable Energy Usage' THEN ad.avg_renewable_energy_percentage
        WHEN g.goal_name = 'PUE (Power Usage Effectiveness)' THEN ad.avg_pue
        WHEN g.goal_name = 'CUE (Carbon Usage Effectiveness)' THEN ad.avg_cue
        WHEN g.goal_name = 'Water Usage Reduction (WUE)' THEN ad.avg_wue
    END AS current_value,
    CASE
        WHEN g.goal_name = 'Renewable Energy Usage' THEN (ad.avg_renewable_energy_percentage / g.target_value) * 100
        WHEN g.goal_name = 'PUE (Power Usage Effectiveness)' THEN (g.target_value / NULLIF(ad.avg_pue, 0)) * 100
        WHEN g.goal_name = 'CUE (Carbon Usage Effectiveness)' THEN (g.target_value / NULLIF(ad.avg_cue, 0)) * 100
        WHEN g.goal_name = 'Water Usage Reduction (WUE)' THEN (g.target_value / NULLIF(ad.avg_wue, 0)) * 100
    END AS progress_percentage
FROM
    company_sustainability_goals g
LEFT JOIN
    AggregatedData ad ON g.company_id = ad.company_id
WHERE
    g.company_id = @company_id; -- Filter for the specific company


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
