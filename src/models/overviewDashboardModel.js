const sql = require("mssql");
const dbConfig = require("../database/dbConfig"); // Import your database configuration

const DashboardModel = {
    async getHighestEmissions() {
        try {
            // Connect to the database
            await sql.connect(dbConfig);
            console.log("Connected to the database");

            // Query to get the highest emissions for data centers
            const highestDataCenterResult = await sql.query(`
                SELECT TOP 1 dc.data_center_name, SUM(dce.co2_emissions_tons) AS co2_emissions_tons
                FROM data_center_carbon_emissions AS dce
                JOIN data_centers AS dc ON dce.data_center_id = dc.id
                GROUP BY dc.data_center_name
                ORDER BY co2_emissions_tons DESC;
            `);
            const highestDataCenter = highestDataCenterResult.recordset[0] || {};

            // Query to get the highest emissions for cell towers
            const highestCellTowerResult = await sql.query(`
                SELECT company_id, SUM(total_energy_kwh) AS total_emissions
                FROM cell_tower_energy_consumption
                GROUP BY company_id
                ORDER BY total_emissions DESC
                OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY; 
            `);
            const highestCellTower = highestCellTowerResult.recordset[0] || {};

            // Return the highest emissions data
            return {
                highestDataCenter,
                highestCellTower
            };

        } catch (error) {
            console.error("Error getting highest emissions:", error);
            throw error; // Re-throw error for handling in the controller
        } finally {
            // Ensure the database connection is closed
            await sql.close();
        }
    },

    async getTotalEmissions() {
        try {
            // Connect to the database
            await sql.connect(dbConfig);
            console.log("Connected to the database");

            // Query to get total emissions from data centers
            const dataCenterResult = await sql.query(`
                SELECT SUM(co2_emissions_tons) AS total_emissions
                FROM data_center_carbon_emissions;
            `);
            const totalDataCenterEmissions = dataCenterResult.recordset[0].total_emissions || 0;

            // Query to get total emissions from cell towers
            const cellTowerResult = await sql.query(`
                SELECT SUM(total_energy_kwh) AS total_emissions
                FROM cell_tower_energy_consumption;
            `);
            const totalCellTowerEmissions = cellTowerResult.recordset[0].total_emissions || 0;

            // Return combined emissions data
            return {
                totalDataCenterEmissions,
                totalCellTowerEmissions,
                overallTotal: totalDataCenterEmissions + totalCellTowerEmissions
            };

        } catch (error) {
            console.error("Error getting total emissions:", error);
            throw error; // Re-throw error for handling in the controller
        } finally {
            // Ensure the database connection is closed
            await sql.close();
        }
    },


    async getSustainabilityGoals() {
      try {
          const pool = await sql.connect(dbConfig);
          const result = await pool.request()
              .query(`
                  SELECT 
                      goal_name, 
                      target_value, 
                      current_value,
                      (current_value / target_value) * 100 AS progress
                  FROM 
                      company_sustainability_goals
              `);
          return result.recordset; // Return the array of sustainability goals with progress
      } catch (error) {
          console.error("Error fetching sustainability goals:", error);
          throw error; // Re-throw to be handled in the controller
      }
  },

  async getTop3CompaniesByEmissions() {
    try {
        await sql.connect(dbConfig);

        const result = await sql.query(`
            SELECT c.name AS company_name, SUM(dcc.co2_emissions_tons) AS total_emissions
            FROM data_center_carbon_emissions AS dcc
            JOIN data_centers AS dc ON dcc.data_center_id = dc.id
            JOIN companies AS c ON dc.company_id = c.id
            GROUP BY c.name
            ORDER BY total_emissions DESC
            OFFSET 0 ROWS FETCH NEXT 3 ROWS ONLY; 
        `);

        return result.recordset; // Returns top 3 companies with the highest emissions
    } catch (error) {
        console.error("Error getting top 3 companies by emissions:", error);
        throw error;
    } finally {
        await sql.close();
    }
},

async getYearlyEnergyConsumption() {
    try {
        await sql.connect(dbConfig);
        console.log("Connected to the database");

        // Query to calculate total energy consumption by year
        const result = await sql.query(`
            SELECT YEAR(date) AS year, SUM(total_energy_kwh) AS total_emissions
                FROM cell_tower_energy_consumption
                GROUP BY YEAR(date)
                ORDER BY total_emissions DESC
                OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY;
        `);

        return result.recordset; // Returns an array of { year, total_energy_kwh } objects
    } catch (error) {
        console.error("Error fetching yearly energy consumption:", error);
        throw error;
    } finally {
        await sql.close();
    }

    
}
  
};

module.exports = DashboardModel;
