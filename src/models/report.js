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

    static async getAllReport() {
        try {
            const connection = await sql.connect(dbConfig);
            const query = `
                SELECT 
                    c.name AS companyName, 
                    CTec.date, 
                    CTec.total_energy_kwh AS totalEnergyKWH, 
                    CTec.radio_equipment_energy_kwh AS radioEquipmentEnergy,
                    CTec.cooling_energy_kwh AS coolingEnergy,
                    CTec.backup_power_energy_kwh AS backupEnergy,
                    CTec.misc_energy_kwh AS miscEnergy,
                    DCce.co2_emissions_tons AS co2EmissionsTons,
                    sg.goal_name, sg.target_value, sg.current_value, sg.target_year, sg.progress,
                    NULL AS dataCenterId
                FROM companies c
                INNER JOIN cell_tower_energy_consumption CTec ON c.id = CTec.company_id
                LEFT JOIN data_center_carbon_emissions DCce ON CTec.company_id = DCce.data_center_id AND CTec.date = DCce.date
                LEFT JOIN company_sustainability_goals sg ON c.id = sg.company_id

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
                    sg.goal_name, sg.target_value, sg.current_value, sg.target_year, sg.progress,
                    dct.id AS dataCenterId
                FROM companies c
                INNER JOIN data_centers dct ON c.id = dct.company_id
                INNER JOIN data_center_energy_consumption DCec ON dct.id = DCec.data_center_id
                LEFT JOIN data_center_carbon_emissions DCce ON dct.id = DCce.data_center_id AND DCec.date = DCce.date
                LEFT JOIN company_sustainability_goals sg ON c.id = sg.company_id
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