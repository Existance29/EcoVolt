const sql = require("mssql");
const dbConfig = require("./dbConfig"); // Import your database configuration

// SQL to drop all foreign key constraints
const dropForeignKeysSQL = `
DECLARE @sql NVARCHAR(MAX) = (
    SELECT 
        STRING_AGG('ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(t.schema_id)) + '.' +
        QUOTENAME(t.name) + ' DROP CONSTRAINT ' + QUOTENAME(fk.name), '; ') 
    FROM sys.foreign_keys AS fk
    INNER JOIN sys.tables AS t ON fk.parent_object_id = t.object_id
);
EXEC sp_executesql @sql;
`;

// SQL queries for creating tables and inserting data
const createTables = `
-- Create table for energy consumption data
CREATE TABLE energy_consumption (
    id INT IDENTITY(1,1) PRIMARY KEY,
    date DATE NOT NULL,
    total_energy_mwh DECIMAL(10, 2) NOT NULL,
    it_energy_mwh DECIMAL(10, 2) NOT NULL,
    cooling_energy_mwh DECIMAL(10, 2) NOT NULL,
    backup_power_energy_mwh DECIMAL(10, 2),
    lighting_energy_mwh DECIMAL(10, 2),
    pue DECIMAL(4, 2),
    cue DECIMAL(4, 2),
    wue DECIMAL(4, 2)
);

-- Create table for carbon emissions data
CREATE TABLE carbon_emissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    date DATE NOT NULL,
    co2_emissions_tons DECIMAL(10, 2) NOT NULL,
    renewable_energy_percentage DECIMAL(4, 2) NOT NULL
);

-- Create table for sustainability goals
CREATE TABLE sustainability_goals (
    id INT IDENTITY(1,1) PRIMARY KEY,
    goal_name VARCHAR(255) NOT NULL,
    target_value DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    target_year INT NOT NULL,
    progress DECIMAL(4, 2)
);
`;

const insertData = `
-- Insert sample data into energy_consumption table
INSERT INTO energy_consumption (date, total_energy_mwh, it_energy_mwh, cooling_energy_mwh, backup_power_energy_mwh, lighting_energy_mwh, pue, cue, wue)
VALUES
    ('2024-07-01', 12000.00, 3900.00, 5400.00, 1200.00, 1500.00, 1.65, 0.50, 1.40),
    ('2024-08-01', 12100.00, 3950.00, 5450.00, 1200.00, 1500.00, 1.64, 0.49, 1.38),
    ('2024-09-01', 12500.00, 4000.00, 5500.00, 1200.00, 1800.00, 1.65, 0.50, 1.40);

-- Insert sample data into carbon_emissions table
INSERT INTO carbon_emissions (date, co2_emissions_tons, renewable_energy_percentage)
VALUES
    ('2024-07-01', 5800.00, 15.00),
    ('2024-08-01', 5850.00, 16.00),
    ('2024-09-01', 6000.00, 15.00);

-- Insert sample data into sustainability_goals table
INSERT INTO sustainability_goals (goal_name, target_value, current_value, target_year, progress)
VALUES
    ('CO₂e Reduction', 4000.00, 6000.00, 2025, 0.60),
    ('PUE Improvement', 1.40, 1.65, 2025, 0.85),
    ('Renewable Energy Usage', 30.00, 15.00, 2025, 0.50),
    ('Water Usage Reduction (WUE)', 1.10, 1.40, 2025, 0.78);
`;

async function seedDatabase() {
  try {
    // Connect to the database
    await sql.connect(dbConfig);
    console.log("Connected to the database");

    // Drop foreign key constraints if they exist
    await sql.query(dropForeignKeysSQL);
    console.log("Dropped foreign keys");

    // Create tables
    await sql.query(createTables);
    console.log("Tables created successfully");

    // Insert sample data
    await sql.query(insertData);
    console.log("Sample data inserted successfully");
    
    // Close the connection
    await sql.close();
    console.log("Database connection closed");
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

seedDatabase();
