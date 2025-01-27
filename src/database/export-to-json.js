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
    const combinedData = {
        cell_tower_monthly: [],
        data_center_monthly: []
    };

    try {
        const pool = await sql.connect(dbConfig);

        // Query for cell tower energy consumption
        const cellTowerQuery = `
            SELECT 
                YEAR(date) AS year,
                MONTH(date) AS month,
                SUM(total_energy_kwh) AS total_energy_kwh,
                SUM(carbon_emission_kg) / 1000.0 AS carbon_emission_tons
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
                SUM(dce.total_energy_mwh) AS total_energy_kwh,
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

        // Combine and format the data
        const outputData = {
            combined_monthly_data: []
        };

        // Add cell tower data to the combined data
        combinedData.cell_tower_monthly.forEach((item) => {
            outputData.combined_monthly_data.push({
                year: item.year,
                month: item.month,
                total_energy_kwh: item.total_energy_kwh,
                carbon_emission_tons: item.carbon_emission_tons,
                source: 'cell_tower'
            });
        });

        // Add data center data to the combined data
        combinedData.data_center_monthly.forEach((item) => {
            outputData.combined_monthly_data.push({
                year: item.year,
                month: item.month,
                total_energy_kwh: item.total_energy_kwh,
                carbon_emission_tons: item.carbon_emission_tons,
                source: 'data_center'
            });
        });

        // Write the combined data to a JSON file
        const outputPath = './aggregated_monthly_data.json';
        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
        console.log(`Aggregated data has been exported to ${outputPath}`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await sql.close();
    }
}

main();
