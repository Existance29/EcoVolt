require('dotenv').config();
const sql = require('mssql');
const fs = require('fs');
const dbConfig = require("../database/dbConfig");

async function fetchTableData(pool, query) {
    try {
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (err) {
        console.error(`Error executing query:`, err.message);
        return [];
    }
}

async function main() {
    const combinedData = {};
    try {
        const pool = await sql.connect(dbConfig);

        // Query for cell tower energy consumption
        const cellTowerQuery = `
            SELECT 
                YEAR(date) AS year,
                MONTH(date) AS month,
                SUM(total_energy_kwh) AS total_energy_kwh,
                SUM(carbon_emission_kg) AS carbon_emission_kg
            FROM 
                cell_tower_energy_consumption
            GROUP BY 
                YEAR(date), MONTH(date)
            ORDER BY 
                YEAR(date), MONTH(date);
        `;
        combinedData["cell_tower_monthly"] = await fetchTableData(pool, cellTowerQuery);

        // Query for data center energy consumption
        const dataCenterQuery = `
            SELECT 
                YEAR(dce.date) AS year,
                MONTH(dce.date) AS month,
                SUM(dce.total_energy_mwh) AS total_energy_mwh,
                SUM(dcce.co2_emissions_tons) AS carbon_emission_tons
            FROM 
                data_center_energy_consumption dce
            LEFT JOIN 
                data_center_carbon_emissions dcce 
                ON dce.data_center_id = dcce.data_center_id AND dce.date = dcce.date
            GROUP BY 
                YEAR(dce.date), MONTH(dce.date)
            ORDER BY 
                YEAR(dce.date), MONTH(dce.date);
        `;
        combinedData["data_center_monthly"] = await fetchTableData(pool, dataCenterQuery);

        // Write the combined data to a single JSON file
        const outputPath = './aggregated_monthly_data.json';
        fs.writeFileSync(outputPath, JSON.stringify(combinedData, null, 2));
        console.log(`Aggregated data has been exported to ${outputPath}`);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await sql.close();
    }
}

main();