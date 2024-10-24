const sql = require("mssql");
const dbConfig = require("../database/dbConfig");

class Report {
    constructor(companyName, date, totalEnergyMWH, co2EmissionsTons, sustainabilityGoals) {
        this.companyName = companyName;
        this.date = date;
        this.totalEnergyMWH = totalEnergyMWH;
        this.co2EmissionsTons = co2EmissionsTons;
        this.sustainabilityGoals = sustainabilityGoals;
    }

    static async getAllReport(){
        try {
            const connection = await sql.connect(dbConfig);
            const query = `
                SELECT c.name AS companyName, ec.date, ec.total_energy_mwh, ce.co2_emissions_tons,
                sg.goal_name, sg.target_value, sg.current_value, sg.target_year, sg.progress 
                FROM companies c INNER JOIN energy_consumption ec ON c.id = ec.company_id 
                INNER JOIN carbon_emissions ce ON c.id = ce.company_id 
                INNER JOIN sustainability_goals sg ON c.id = sg.company_id
                ORDER BY ec.date;
            `;
            const result = await connection.query(query);
            const reports = result.recordset.map((row) => {
                return new Report(row.companyName, row.date, row.totalEnergyMWH, row.co2EmissionsTons, 
                    [{
                        goalName: row.goal_name,
                        targetValue: row.target_value,
                        currentValue: row.current_value,
                        targetYear: row.target_year,
                        progress: row.progress
                    }] // Sustainability goals in an array
                )
            });

            return reports;


        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            await sql.close();
        }

    }
}

module.exports = Report;