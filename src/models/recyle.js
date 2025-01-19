const sql = require("mssql"); 
const dbConfig = require("../database/dbConfig");

class Reward {

    static async getCarbonAndEnergyNotRecycled(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced INNER JOIN data_centers dc ON ced.data_center_id = dc.id WHERE dc.company_id = @company_id GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.status != 'Recycled' AND dus.status != 'Pending Pick Up' ORDER BY dus.data_center_id, dus.device_id; 
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getCarbonAndEnergyPending(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced INNER JOIN data_centers dc ON ced.data_center_id = dc.id WHERE dc.company_id = @company_id GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.status = 'Pending Pick Up' ORDER BY dus.data_center_id, dus.device_id; 
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getCarbonAndEnergyRecycled(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced INNER JOIN data_centers dc ON ced.data_center_id = dc.id WHERE dc.company_id = @company_id GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.status = 'recycled' ORDER BY dus.data_center_id, dus.device_id;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async searchEquipment(company_id, search_term) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced INNER JOIN data_centers dc ON ced.data_center_id = dc.id WHERE dc.company_id = @company_id GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.brand LIKE CONCAT('%', @search_term, '%') OR dus.model LIKE CONCAT('%', @search_term, '%') OR dus.serial_number LIKE CONCAT('%', @search_term, '%') OR FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) LIKE CONCAT('%', @search_term, '%') OR dus.total_device_co2_emissions_tons LIKE CONCAT('%', @search_term, '%') OR dus.total_device_energy_mwh LIKE CONCAT('%', @search_term, '%') OR dus.status LIKE CONCAT('%', @search_term, '%') OR dus.device_type LIKE CONCAT('%', @search_term, '%') ORDER BY dus.data_center_id, dus.device_id;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('search_term', search_term);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async filterByDc(company_id, data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced INNER JOIN data_centers dc ON ced.data_center_id = dc.id WHERE dc.company_id = @company_id AND ced.status NOT IN ('Recycled', 'Pending Pick Up') GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.data_center_id = @data_center_id ORDER BY dus.data_center_id, dus.device_id;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('data_center_id', data_center_id);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async filterByDCPending(company_id, data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id WHERE d.status = 'Pending Pick Up'), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced INNER JOIN data_centers dc ON ced.data_center_id = dc.id WHERE dc.company_id = @company_id GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.data_center_id = @data_center_id ORDER BY dus.data_center_id, dus.device_id;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('data_center_id', data_center_id);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async filterByDcRecycled(data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced INNER JOIN data_centers dc ON ced.data_center_id = dc.id GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.data_center_id = @data_center_id AND dus.status = 'Recycled' ORDER BY dus.data_center_id, dus.device_id;
            `;
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async filterByDcAndSearchTerm(company_id, data_center_id, search_term) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced INNER JOIN data_centers dc ON ced.data_center_id = dc.id WHERE dc.company_id = @company_id AND ced.status != 'Recycled' GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.data_center_id = @data_center_id AND (dus.brand LIKE CONCAT('%', @search_term, '%') OR dus.model LIKE CONCAT('%', @search_term, '%') OR dus.serial_number LIKE CONCAT('%', @search_term, '%') OR FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) LIKE CONCAT('%', @search_term, '%') OR dus.total_device_co2_emissions_tons LIKE CONCAT('%', @search_term, '%') OR dus.total_device_energy_mwh LIKE CONCAT('%', @search_term, '%') OR dus.status LIKE CONCAT('%', @search_term, '%')) ORDER BY dus.data_center_id, dus.device_id;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('data_center_id', data_center_id);
            request.input('search_term', search_term);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async filterByDcAndSearchTermPending(company_id, data_center_id, search_term) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced INNER JOIN data_centers dc ON ced.data_center_id = dc.id WHERE dc.company_id = @company_id AND ced.status = 'Pending Pick Up' GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.data_center_id = @data_center_id AND (dus.brand LIKE CONCAT('%', @search_term, '%') OR dus.model LIKE CONCAT('%', @search_term, '%') OR dus.serial_number LIKE CONCAT('%', @search_term, '%') OR FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) LIKE CONCAT('%', @search_term, '%') OR dus.total_device_co2_emissions_tons LIKE CONCAT('%', @search_term, '%') OR dus.total_device_energy_mwh LIKE CONCAT('%', @search_term, '%') OR dus.status LIKE CONCAT('%', @search_term, '%')) ORDER BY dus.data_center_id, dus.device_id;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('data_center_id', data_center_id);
            request.input('search_term', search_term);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async filterByDcAndSearchTermRecycled(company_id, data_center_id, search_term) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced INNER JOIN data_centers dc ON ced.data_center_id = dc.id WHERE dc.company_id = @company_id AND ced.status = 'Recycled' GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.data_center_id = @data_center_id AND (dus.brand LIKE CONCAT('%', @search_term, '%') OR dus.model LIKE CONCAT('%', @search_term, '%') OR dus.serial_number LIKE CONCAT('%', @search_term, '%') OR FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) LIKE CONCAT('%', @search_term, '%') OR dus.total_device_co2_emissions_tons LIKE CONCAT('%', @search_term, '%') OR dus.total_device_energy_mwh LIKE CONCAT('%', @search_term, '%') OR dus.status LIKE CONCAT('%', @search_term, '%')) ORDER BY dus.data_center_id, dus.device_id;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            request.input('data_center_id', data_center_id);
            request.input('search_term', search_term);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async filterBySerialNumber(serial_number) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT recyclables.*, users.name FROM recyclables Inner join users on recyclables.user_id = users.id WHERE serial_number = @serial_number;
            `;
            const request = connection.request();
            request.input('serial_number', serial_number);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async filterByCompanySerialNumber(serial_number) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced INNER JOIN data_centers dc ON ced.data_center_id = dc.id GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.serial_number = @serial_number ORDER BY dus.data_center_id, dus.device_id;
            `;
            const request = connection.request();
            request.input('serial_number', serial_number);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0 ? result.recordset : null;
        } catch (error) {
            console.log(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async preloadRecyclablesTable() {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            INSERT INTO recyclables (brand, model, serial_number, status, type, user_id, company_id) SELECT brand, model, serial_number, 'Approved', 'Company', NULL, dc.company_id FROM devices d JOIN data_centers dc ON d.data_center_id = dc.id WHERE d.status = 'recycled';
            `;
            const request = connection.request();
            await request.query(sqlQuery);
            return;
        } catch (error) {
            return;
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async addPersonalDevice(brand, model, serialNumber, status, type, device_type, userId, companyId, dataCenterId, imagePath) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                INSERT INTO recyclables (brand, model, serial_number, status, type, device_type, user_id, company_id, data_center_id, image_path)
                VALUES (@Brand, @Model, @SerialNumber, @Status, @Type, @DeviceType, @UserId, @CompanyId, @DataCenterId, @ImagePath);
            `;
            const request = connection.request();
            request.input("Brand", brand); 
            request.input("Model", model);
            request.input("SerialNumber", serialNumber);
            request.input("Status", status); 
            request.input("Type", type);
            request.input("DeviceType", device_type);
            request.input("UserId", userId);
            request.input("CompanyId", companyId);
            request.input("DataCenterId", dataCenterId); // Add DataCenterId as input
            request.input("ImagePath", sql.VarChar, imagePath); 
            const result = await request.query(sqlQuery);
            console.log(result);
            return { message: "Device added successfully" };
        } catch (error) {
            console.error("Error adding personal device:", error);
            throw new Error("Failed to add personal device");
        } finally {
            // Ensure the connection is closed
            if (connection) {
                await connection.close();
            }
        }
    }
    

    static async getPersonalDevicesAwaitingApproval(comppany_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
SELECT recyclables.*, users.name AS user_name 
FROM recyclables 
LEFT JOIN users 
    ON recyclables.user_id = users.id 
WHERE recyclables.type = 'Personal' 
  AND recyclables.status = 'Awaiting Approval' 
  AND recyclables.company_id = @company_id;
            `;
            const request = connection.request();
            request.input('company_id', comppany_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error("Error getting personal devices:", error);
            throw new Error("Failed to get personal devices");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async getPersonalDevicesRejected(comppany_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
SELECT recyclables.*, users.name AS user_name 
FROM recyclables 
LEFT JOIN users 
    ON recyclables.user_id = users.id 
WHERE recyclables.type = 'Personal' 
  AND recyclables.status = 'Rejected' 
  AND recyclables.company_id = @company_id;
            `;
            const request = connection.request();
            request.input('company_id', comppany_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error("Error getting personal devices:", error);
            throw new Error("Failed to get personal devices");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async getPersonalDevicesAwaitingApprovalByDc(data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
SELECT recyclables.*, users.name AS user_name, data_centers.id AS data_center_id 
FROM recyclables 
INNER JOIN users 
    ON recyclables.user_id = users.id 
INNER JOIN data_centers 
    ON data_centers.id = recyclables.data_center_id 
WHERE recyclables.type = 'Personal' 
  AND recyclables.status = 'Awaiting Approval' 
  AND data_centers.id = @data_center_id;
              `;
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error("Error getting personal devices:", error);
            throw new Error("Failed to get personal devices");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async getPersonalDevicesByUserId(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT * FROM recyclables WHERE type = 'Personal' AND company_id = @company_id;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error("Error getting personal devices:", error);
            throw new Error("Failed to get personal devices");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async getPersonalDevicesPendingPickUp() {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT recyclables.*, users.name FROM recyclables INNER JOIN users ON users.id = recyclables.user_id WHERE recyclables.type = 'Personal' AND recyclables.status = 'Pending Pick Up';
            `;
            const request = connection.request();
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error("Error getting personal devices:", error);
            throw new Error("Failed to get personal devices");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async getPersonalDevicesPendingPickUpByDc(data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT recyclables.*, users.name AS user_name, data_centers.id AS data_center_id FROM recyclables INNER JOIN users ON users.id = recyclables.user_id INNER JOIN data_centers ON data_centers.id = recyclables.data_center_id WHERE recyclables.type = 'Personal' AND recyclables.status = 'Pending Pick Up' AND data_centers.id = @data_center_id;
            `;
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error("Error getting personal devices:", error);
            throw new Error("Failed to get personal devices");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
    
    static async getCompanyPendingPickUpByDc(data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            WITH energy_distribution AS (SELECT d.id AS device_id, d.device_type, d.brand, d.model, d.serial_number, d.status, e.data_center_id, e.date, CASE WHEN d.device_type LIKE 'Server Rack%' THEN e.it_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Server Rack%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Cooling System%' THEN e.cooling_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Cooling System%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Backup Power%' THEN e.backup_power_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Backup Power%' AND data_center_id = e.data_center_id) WHEN d.device_type LIKE 'Lighting%' THEN e.lighting_energy_mwh / (SELECT COUNT(*) FROM devices WHERE device_type LIKE 'Lighting%' AND data_center_id = e.data_center_id) ELSE 0 END AS device_energy_mwh FROM devices d INNER JOIN data_center_energy_consumption e ON d.data_center_id = e.data_center_id), carbon_emission_distribution AS (SELECT ed.device_id, ed.device_type, ed.brand, ed.model, ed.serial_number, ed.status, ed.data_center_id, ed.date, ed.device_energy_mwh, (ed.device_energy_mwh / e.total_energy_mwh) * ce.co2_emissions_tons AS device_co2_emissions_tons FROM energy_distribution ed INNER JOIN data_center_energy_consumption e ON ed.data_center_id = e.data_center_id AND ed.date = e.date INNER JOIN data_center_carbon_emissions ce ON ed.data_center_id = ce.data_center_id AND ed.date = ce.date), device_usage_summary AS (SELECT ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id, MIN(ced.date) AS first_usage_date, MAX(ced.date) AS last_usage_date, SUM(ced.device_energy_mwh) AS total_device_energy_mwh, SUM(ced.device_co2_emissions_tons) AS total_device_co2_emissions_tons FROM carbon_emission_distribution ced GROUP BY ced.device_id, ced.device_type, ced.brand, ced.model, ced.serial_number, ced.status, ced.data_center_id) SELECT dus.device_id, dus.device_type, dus.brand, dus.model, dus.serial_number, dus.status, dus.data_center_id, FLOOR(DATEDIFF(DAY, dus.first_usage_date, dus.last_usage_date) / 365.0) AS device_age_years, dus.total_device_energy_mwh, dus.total_device_co2_emissions_tons FROM device_usage_summary dus WHERE dus.status = 'Pending Pick Up' AND dus.data_center_id = @data_center_id ORDER BY dus.data_center_id, dus.device_id;
            `;
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error("Error getting personal devices:", error);
            throw new Error("Failed to get personal devices");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async getPersonalDevicesRecycled(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT recyclables.*, users.name FROM recyclables INNER JOIN users ON recyclables.user_id = users.id WHERE recyclables.status = 'Recycled';
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error("Error getting personal devices:", error);
            throw new Error("Failed to get personal devices");
        } finally {
            if (connection) {
                await connection.close();
            }
        }

    }

    static async getPersonalDevicesRecycledByDc(data_center_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT recyclables.*, users.name, data_centers.id AS data_center_id FROM recyclables INNER JOIN users ON users.id = recyclables.user_id INNER JOIN data_centers ON data_centers.id = recyclables.data_center_id WHERE recyclables.type = 'Personal' AND recyclables.status = 'Recycled' AND data_centers.id = @data_center_id;
            `;
            const request = connection.request();
            request.input('data_center_id', data_center_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error("Error getting personal devices:", error);
            throw new Error("Failed to get personal devices");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async updateCompanyDeviceStatus(serial_number, new_status) { 
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                UPDATE devices
                SET status = @new_status
                WHERE serial_number = @serial_number;
            `;
            const request = connection.request();
            request.input('serial_number', serial_number);
            request.input('new_status', new_status);
    
            const result = await request.query(sqlQuery);
            return result.rowsAffected[0] > 0; // Returns true if a row was updated
        } catch (error) {
            console.error("Error updating device status:", error);
            throw new Error("Failed to update device status");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
    static async getDeviceBySerialNumber(serial_number) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT * FROM devices WHERE serial_number = @serial_number
            `;
            const request = connection.request();
            request.input("serial_number", serial_number);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error("Error retrieving sn:", error);
            throw new Error("Failed to retrieve device by serial number.");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
    
    static async insertIntoRecyclables(details) {
        const { brand, model, serial_number, status, type, device_type, user_id, company_id, data_center_id, image_path } = details;
    
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                INSERT INTO recyclables (
                    brand, model, serial_number, status, type, device_type, user_id, company_id, data_center_id, image_path
                ) VALUES (
                    @brand, @model, @serial_number, @status, @type, @device_type, @user_id, @company_id, @data_center_id, @image_path
                );
            `;
            const request = connection.request();
            request.input('brand', sql.VarChar, brand);
            request.input('model', sql.VarChar, model);
            request.input('serial_number', sql.VarChar, serial_number);
            request.input('status', sql.VarChar, status);
            request.input('type', sql.VarChar, type);
            request.input('device_type', sql.VarChar, device_type);
            request.input('user_id', sql.Int, user_id || null);
            request.input('company_id', sql.Int, company_id);
            request.input('data_center_id', sql.Int, data_center_id);
            request.input('image_path', sql.VarChar, image_path);
    
            const result = await request.query(sqlQuery);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error("Error inserting into recyclables table:", error);
            throw new Error("Failed to insert into recyclables table.");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async updateToRecyclables(serial_number, status) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // SQL query to update the status in the recyclables table
            const sqlQuery = `
                UPDATE recyclables
                SET status = @status
                WHERE serial_number = @serial_number
            `;
    
            const request = connection.request();
            request.input("serial_number", sql.VarChar, serial_number); // Specify the serial number
            request.input("status", sql.VarChar, status); // Specify the new status
    
            const result = await request.query(sqlQuery);
    
            // Check if rows were affected
            if (result.rowsAffected[0] > 0) {
                return { success: true, message: "Recyclable status updated successfully." };
            } else {
                return { success: false, message: "No recyclable found with the given serial number." };
            }
        } catch (error) {
            console.error("Error updating recyclables:", error);
            throw new Error("Failed to update the recyclable status.");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
    
    
}
module.exports = Reward;
