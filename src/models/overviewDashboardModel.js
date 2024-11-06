const sql = require("mssql");
const dbConfig = require("../database/dbConfig");

const DashboardModel = {
  async getCellTowerSummary() {
    await sql.connect(dbConfig);
    const result = await sql.query(`
      SELECT 
        SUM(total_energy_kwh) AS total_energy
      FROM cell_tower_energy_consumption
    `);
    return result.recordset[0];
  },

  async getDataCenterSummary() {
    await sql.connect(dbConfig);
    const result = await sql.query(`
      SELECT 
        SUM(total_energy_mwh) AS total_energy
      FROM data_center_energy_consumption
    `);
    return result.recordset[0];
  },

  async getCarbonEmissionsSummary() {
    await sql.connect(dbConfig);
    const result = await sql.query(`
      SELECT 
        SUM(co2_emissions_tons) AS total_co2_emissions
      FROM data_center_carbon_emissions
    `);
    return result.recordset[0];
  },

  async getRenewableEnergyUsagePercentage() {
    await sql.connect(dbConfig);
    const result = await sql.query(`
      SELECT 
        AVG(renewable_energy_percentage) AS avg_renewable_energy
      FROM data_center_carbon_emissions
    `);
    return result.recordset[0];
  },

  async getEnergyConsumptionBreakdown() {
    const result = await sql.query(`
        SELECT 
            SUM(it_energy_mwh) AS it_energy,
            SUM(cooling_energy_mwh) AS cooling_energy,
            SUM(backup_power_energy_mwh) AS backup_power,
            SUM(lighting_energy_mwh) AS lighting_energy
        FROM data_center_energy_consumption
    `);
    return result.recordset[0];
},

async getEnergyConsumptionTrend() {
  await sql.connect(dbConfig);
  const result = await sql.query(`
      SELECT 
          FORMAT(date, 'yyyy-MM') AS month, 
          SUM(total_energy_mwh) AS total_energy
      FROM data_center_energy_consumption
      GROUP BY FORMAT(date, 'yyyy-MM')
      ORDER BY month ASC
  `);
  return result.recordset;
},

  async getRenewableEnergyUsage() {
    await sql.connect(dbConfig);
    const result = await sql.query(`
      SELECT 
        AVG(renewable_energy_percentage) AS renewable_energy_percentage
      FROM data_center_carbon_emissions
    `);
    return result.recordset[0];
  },

  async getEfficiencyMetrics() {
    await sql.connect(dbConfig);
    const result = await sql.query(`
      SELECT 
        AVG(pue) AS avg_pue,
        AVG(cue) AS avg_cue,
        AVG(wue) AS avg_wue
      FROM data_center_energy_consumption
    `);
    return result.recordset[0];
  }
};

module.exports = DashboardModel;
