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
                    NULL AS co2EmissionsTons, 
                    MAX(sg.goal_name) AS goal_name, 
                    MAX(sg.target_value) AS target_value, 
                    MAX(sg.current_value) AS current_value, 
                    MAX(sg.target_year) AS target_year, 
                    MAX(sg.progress) AS progress,
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
                    MAX(sg.current_value) AS current_value, 
                    MAX(sg.target_year) AS target_year, 
                    MAX(sg.progress) AS progress,
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
                        progress: row.progress
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
}

module.exports = Report;