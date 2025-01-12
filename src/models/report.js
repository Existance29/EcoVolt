const sql = require("mssql");
const dbConfig = require("../database/dbConfig");

class Report {
    constructor(companyName, date, totalEnergyKWH, co2EmissionsTons, sustainabilityGoals, radioEquipmentEnergy, coolingEnergy, backupEnergy, miscEnergy, dataCenterId) {
        this.companyName = companyName;
        this.date = date;
        this.totalEnergyKWH = totalEnergyKWH;
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
                    MAX(CTec.total_energy_kwh) AS totalEnergyKWH, 
                    MAX(CTec.radio_equipment_energy_kwh) AS radioEquipmentEnergy,
                    MAX(CTec.cooling_energy_kwh) AS coolingEnergy,
                    MAX(CTec.backup_power_energy_kwh) AS backupEnergy,
                    MAX(CTec.misc_energy_kwh) AS miscEnergy,
                    MAX(CTec.carbon_emission_kg) AS co2EmissionsTons,
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
                    MAX(DCec.total_energy_mwh * 1000) AS totalEnergyKWH, 
                    MAX(DCec.it_energy_mwh) AS radioEquipmentEnergy,
                    MAX(DCec.cooling_energy_mwh) AS coolingEnergy,
                    MAX(DCec.backup_power_energy_mwh) AS backupEnergy,
                    MAX(DCec.lighting_energy_mwh) AS miscEnergy,
                    MAX(DCce.co2_emissions_tons) AS co2EmissionsTons,
                    MAX(sg.goal_name) AS goal_name, 
                    MAX(sg.target_value) AS target_value, 
                    MAX(sg.target_year) AS target_year, 
                    dct.id AS dataCenterId
                FROM companies c
                INNER JOIN data_centers dct ON c.id = dct.company_id
                INNER JOIN data_center_energy_consumption DCec ON dct.id = DCec.data_center_id
                LEFT JOIN data_center_carbon_emissions DCce ON dct.id = DCce.data_center_id AND DCec.date = DCce.date
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
                    row.totalEnergyKWH, 
                    row.co2EmissionsTons, 
                    [{
                        goalName: row.goal_name,
                        targetValue: row.target_value,
                        currentValue: row.current_value,
                        targetYear: row.target_year,
                    }],
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
    static async getAllYearsReport(company_id) {
        try {
            const connection = await sql.connect(dbConfig);

            const companyFilter = company_id ? `AND c.id = ${company_id}` : "";

            const query = `
                SELECT 
                    c.name AS companyName, 
                    CTec.date, 
                    CTec.total_energy_kwh AS totalEnergyKWH, 
                    CTec.radio_equipment_energy_kwh AS radioEquipmentEnergy,
                    CTec.cooling_energy_kwh AS coolingEnergy,
                    CTec.backup_power_energy_kwh AS backupEnergy,
                    CTec.misc_energy_kwh AS miscEnergy,
                    CTec.carbon_emission_kg AS co2EmissionsTons,
                    sg.goal_name AS goal_name, 
                    sg.target_value AS target_value, 
                    sg.target_year AS target_year, 
                    NULL AS dataCenterId
                FROM companies c
                INNER JOIN cell_tower_energy_consumption CTec ON c.id = CTec.cell_tower_id
                LEFT JOIN company_sustainability_goals sg ON c.id = sg.company_id
                WHERE 1=1 ${companyFilter}
                
                UNION ALL

                SELECT 
                    c.name AS companyName, 
                    DCec.date, 
                    DCec.total_energy_mwh * 1000 AS totalEnergyKWH, 
                    DCec.it_energy_mwh AS radioEquipmentEnergy,
                    DCec.cooling_energy_mwh AS coolingEnergy,
                    DCec.backup_power_energy_mwh AS backupEnergy,
                    DCec.lighting_energy_mwh AS miscEnergy,
                    DCce.co2_emissions_tons AS co2EmissionsTons,
                    sg.goal_name AS goal_name, 
                    sg.target_value AS target_value, 
                    sg.target_year AS target_year, 
                    dct.id AS dataCenterId
                FROM companies c
                INNER JOIN data_centers dct ON c.id = dct.company_id
                INNER JOIN data_center_energy_consumption DCec ON dct.id = DCec.data_center_id
                LEFT JOIN data_center_carbon_emissions DCce ON dct.id = DCce.data_center_id AND DCec.date = DCce.date
                LEFT JOIN company_sustainability_goals sg ON c.id = sg.company_id
                WHERE 1=1 ${companyFilter}
                ORDER BY date;
            `;

            const result = await connection.query(query);

            const reports = result.recordset.map((row) => {
                return new Report(
                    row.companyName,
                    row.date,
                    row.totalEnergyKWH,
                    row.co2EmissionsTons,
                    row.goal_name
                        ? [
                              {
                                  goalName: row.goal_name,
                                  targetValue: row.target_value,
                                  targetYear: row.target_year,
                              },
                          ]
                        : [],
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

    
}

module.exports = Report;