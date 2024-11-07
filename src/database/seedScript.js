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

const dropTablesSQL = `
DECLARE @sql NVARCHAR(max)=''

SELECT @sql += ' Drop table ' + QUOTENAME(s.NAME) + '.' + QUOTENAME(t.NAME) + '; '
FROM   sys.tables t
       JOIN sys.schemas s
         ON t.[schema_id] = s.[schema_id]
WHERE  t.type = 'U'

Exec sp_executesql @sql
`;

// SQL queries for creating tables and inserting data
const createTables = `
-- Create table for Companies
CREATE TABLE companies (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    alias VARCHAR(255) NULL,
    email_domain VARCHAR(255) NULL
);

-- Create table for Data Centers
CREATE TABLE data_centers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_id INT NOT NULL,
    data_center_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create table for Users
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    company_id INT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);



-- Create table for energy consumption data (cell tower)
CREATE TABLE cell_tower_energy_consumption (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_id INT NOT NULL,
    date DATE NOT NULL,
    total_energy_kwh DECIMAL(10, 2) NOT NULL,
    radio_equipment_energy_kwh DECIMAL(10, 2) NOT NULL,
    cooling_energy_kwh DECIMAL(10, 2) NOT NULL,
    backup_power_energy_kwh DECIMAL(10, 2),
    misc_energy_kwh DECIMAL(10,2),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create table for data center energy consumption
CREATE TABLE data_center_energy_consumption (
    id INT IDENTITY(1,1) PRIMARY KEY,
    data_center_id INT NOT NULL, -- Foreign key to data_centers table
    date DATE NOT NULL,
    total_energy_mwh DECIMAL(10, 2) NOT NULL,
    it_energy_mwh DECIMAL(10, 2) NOT NULL,
    cooling_energy_mwh DECIMAL(10, 2) NOT NULL,
    backup_power_energy_mwh DECIMAL(10, 2),
    lighting_energy_mwh DECIMAL(10, 2),
    pue DECIMAL(4, 2),
    cue DECIMAL(4, 2),
    wue DECIMAL(4, 2),
    FOREIGN KEY (data_center_id) REFERENCES data_centers(id)
);

-- Create table for carbon emissions data
CREATE TABLE data_center_carbon_emissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    data_center_id INT NOT NULL, -- Foreign key to data_centers table
    date DATE NOT NULL,
    co2_emissions_tons DECIMAL(10, 2) NOT NULL,
    renewable_energy_percentage DECIMAL(4, 2) NOT NULL,
    FOREIGN KEY (data_center_id) REFERENCES data_centers(id)
);

-- Create table for sustainability goals
CREATE TABLE company_sustainability_goals (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_id INT NOT NULL,
    goal_name VARCHAR(255) NOT NULL,
    target_value DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    target_year INT NOT NULL,
    progress DECIMAL(4, 2),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);


-- Create table for activity feed
CREATE TABLE activity_feed (
    post_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL, 
	company_id INT NOT NULL, 
	data_center_id INT NULL, 
	context VARCHAR(500), 
	media_url VARCHAR(255),
	carbon_emission DECIMAL(10, 2),
	energy_consumption DECIMAl(10, 2),
	activity_type VARCHAR(50),
	location VARCHAR(100),
	date DATE NOT NULL,                
	time DATETIME NOT NULL, 
	likes_count INT DEFAULT 0, 
	dislike_count INT DEFAULT 0,
	comments_count INT DEFAULT 0, 
	FOREIGN KEY (user_id) REFERENCES users(id),
	FOREIGN KEY (company_id) REFERENCES companies(id),
	FOREIGN KEY (data_center_id) REFERENCES data_centers(id),
);

-- Create table for comments
CREATE TABLE comments (
	comment_id INT IDENTITY(1, 1) PRIMARY KEY,
	post_id INT NOT NULL,
	user_id INT NOT NULL, 
	company_id INT NOT NULL,
	comment_text TEXT,
	date DATE NOT NULL,                
	time DATETIME NOT NULL, 
	FOREIGN KEY (post_id) REFERENCES activity_feed(post_id),
	FOREIGN KEY (user_id) REFERENCES users(id),
	FOREIGN KEY (company_id) REFERENCES companies(id),
);

-- Create table for likes
CREATE TABLE likes (
	like_id INT IDENTITY(1, 1) PRIMARY KEY,
	post_id INT NOT NULL,
	user_id INT NOT NULL,
	date DATE NOT NULL,                
	time DATETIME NOT NULL, 
	FOREIGN KEY (post_id) REFERENCES activity_feed(post_id),
	FOREIGN KEY (user_id) REFERENCES users(id),
	UNIQUE (post_id, user_id)
);

-- Create table for dislikes
CREATE TABLE dislikes (
	dislike_id INT IDENTITY(1, 1) PRIMARY KEY,
	post_id INT NOT NULL,
	user_id INT NOT NULL,
	date DATE NOT NULL,                
	time DATETIME NOT NULL, 
	FOREIGN KEY (post_id) REFERENCES activity_feed(post_id),
	FOREIGN KEY (user_id) REFERENCES users(id),
	UNIQUE (post_id, user_id)
);
`;

const insertData = `

-- Insert sample data into companies table
INSERT INTO companies (name, alias, email_domain)
VALUES
    ('Singapore Telecommunications Limited', 'Singtel', 'singtel.com'),
    ('M1 Limited', 'M1', 'm1.com.sg'),
    ('SIMBA Telecom Pte Ltd', 'SIMBA', 'simba.sg'),
    ('StarHub Limited', 'StarHub', 'starhub.com');

-- Insert sample data into users table
INSERT INTO users (name, email, password, company_id)
VALUES
    ('John Doe', 'jdoe@singtel.com', 'password123', 1),
    ('Jane Smith', 'jsmith@m1.com.sg', 'password123', 2),
    ('Alice Tan', 'alice.tan@simba.sg', 'password123', 3),
    ('Bob Lee', 'bob.lee@starhub.com', 'password123', 4),
    ('Apple Lim', 'apple.lim@singtel.com', 'password123', 1),
    ('Benedict Soh', 'bsoh@m1.com.sg', 'password123', 2),
    ('cadence Tan', 'cadence.tan@simba.sg', 'password123', 3),
    ('dominic Lee', 'dominic.lee@starhub.com', 'password123', 4);


-- Insert sample data into data_centers table
INSERT INTO data_centers (company_id, data_center_name)
VALUES
    (1, 'Singtel DC-1'),
    (1, 'Singtel DC-2'),
    (1, 'Singtel DC-3'),
    (1, 'Singtel DC-4'),
    (1, 'Singtel DC-5'),
    (2, 'M1 DC-1'),
    (2, 'M1 DC-2'),
    (2, 'M1 DC-3'),
    (2, 'M1 DC-4'),
    (2, 'M1 DC-5'),
    (3, 'SIMBA DC-1'),
    (3, 'SIMBA DC-2'),
    (3, 'SIMBA DC-3'),
    (3, 'SIMBA DC-4'),
    (3, 'SIMBA DC-5'),
    (4, 'StarHub DC-1'),
    (4, 'StarHub DC-2'),
    (4, 'StarHub DC-3'),
    (4, 'StarHub DC-4'),
    (4, 'StarHub DC-5');

-- Insert sample data into cell tower energy_consumption table
INSERT INTO cell_tower_energy_consumption (company_id, date, total_energy_kwh, radio_equipment_energy_kwh, cooling_energy_kwh, backup_power_energy_kwh, misc_energy_kwh)
VALUES
    (1, '2024-07-01', 120.00, 72, 36, 8, 4),
    (1, '2024-08-01', 121.00, 73, 35, 10, 3),
    (1, '2024-09-01', 120.00, 72, 34, 8, 6);

-- Insert sample data into data center energy_consumption table
INSERT INTO data_center_energy_consumption (data_center_id, date, total_energy_mwh, it_energy_mwh, cooling_energy_mwh, backup_power_energy_mwh, lighting_energy_mwh, pue, cue, wue)
VALUES
    -- Data center 1 - Singtel
    (1, '2024-08-01', 12000.00, 3900.00, 5400.00, 1200.00, 1500.00, 1.65, 0.50, 1.40),
    (1, '2024-09-01', 12100.00, 3950.00, 5450.00, 1200.00, 1500.00, 1.64, 0.49, 1.38),
    (1, '2024-10-01', 12500.00, 4000.00, 5500.00, 1200.00, 1800.00, 1.65, 0.50, 1.40),
    -- Data for 2023
    (1, '2023-08-01', 11800.00, 3800.00, 5300.00, 1100.00, 1600.00, 1.62, 0.48, 1.35),
    (1, '2023-09-01', 11950.00, 3850.00, 5350.00, 1150.00, 1600.00, 1.63, 0.49, 1.36),
    (1, '2023-10-01', 12000.00, 3900.00, 5400.00, 1200.00, 1500.00, 1.64, 0.50, 1.37),
    -- Data for 2022
    (1, '2022-08-01', 11700.00, 3700.00, 5200.00, 1050.00, 1750.00, 1.60, 0.47, 1.33),
    (1, '2022-09-01', 11850.00, 3750.00, 5250.00, 1100.00, 1750.00, 1.61, 0.48, 1.34),
    (1, '2022-10-01', 11900.00, 3800.00, 5300.00, 1150.00, 1650.00, 1.62, 0.49, 1.35),
    -- Data for 2021
    (1, '2021-08-01', 11500.00, 3600.00, 5100.00, 1000.00, 1800.00, 1.58, 0.46, 1.31),
    (1, '2021-09-01', 11600.00, 3650.00, 5150.00, 1050.00, 1750.00, 1.59, 0.47, 1.32),
    (1, '2021-10-01', 11700.00, 3700.00, 5200.00, 1100.00, 1700.00, 1.60, 0.48, 1.33),

    
    -- Data center 2 - Singtel
    (2, '2024-08-01', 11000.00, 3400.00, 4900.00, 1100.00, 1600.00, 1.60, 0.52, 1.38),
    (2, '2024-09-01', 11500.00, 3550.00, 4950.00, 1100.00, 1600.00, 1.59, 0.51, 1.35),
    (2, '2024-10-01', 11800.00, 3650.00, 5000.00, 1150.00, 1650.00, 1.58, 0.50, 1.32),
    -- Data center 2 - Singtel, 2023
    (2, '2023-08-01', 10800.00, 3350.00, 4850.00, 1050.00, 1550.00, 1.61, 0.53, 1.39),
    (2, '2023-09-01', 11100.00, 3450.00, 4900.00, 1075.00, 1575.00, 1.60, 0.52, 1.37),
    (2, '2023-10-01', 11350.00, 3500.00, 4950.00, 1100.00, 1600.00, 1.59, 0.51, 1.36),
    -- Data center 2 - Singtel, 2022
    (2, '2022-08-01', 10600.00, 3300.00, 4800.00, 1025.00, 1525.00, 1.63, 0.54, 1.41),
    (2, '2022-09-01', 10900.00, 3350.00, 4850.00, 1050.00, 1550.00, 1.62, 0.53, 1.40),
    (2, '2022-10-01', 11100.00, 3400.00, 4900.00, 1075.00, 1575.00, 1.61, 0.52, 1.38),
    -- Data center 2 - Singtel, 2021
    (2, '2021-08-01', 10400.00, 3250.00, 4750.00, 1000.00, 1500.00, 1.65, 0.55, 1.43),
    (2, '2021-09-01', 10650.00, 3300.00, 4800.00, 1025.00, 1525.00, 1.64, 0.54, 1.42),
    (2, '2021-10-01', 10900.00, 3350.00, 4850.00, 1050.00, 1550.00, 1.63, 0.53, 1.40),


    -- Data center 3 - Singtel
    (3, '2024-08-01', 9500.00, 2800.00, 4200.00, 900.00, 1600.00, 1.68, 0.53, 1.42),
    (3, '2024-09-01', 9600.00, 2900.00, 4250.00, 950.00, 1650.00, 1.67, 0.52, 1.40),
    (3, '2024-10-01', 9700.00, 2950.00, 4300.00, 1000.00, 1700.00, 1.66, 0.51, 1.38),
    -- Data center 3 - Singtel, 2023
    (3, '2023-08-01', 9300.00, 2750.00, 4150.00, 850.00, 1550.00, 1.69, 0.54, 1.43),
    (3, '2023-09-01', 9400.00, 2800.00, 4200.00, 875.00, 1600.00, 1.68, 0.53, 1.41),
    (3, '2023-10-01', 9500.00, 2850.00, 4250.00, 900.00, 1650.00, 1.67, 0.52, 1.40),
    -- Data center 3 - Singtel, 2022
    (3, '2022-08-01', 9100.00, 2700.00, 4100.00, 825.00, 1525.00, 1.70, 0.55, 1.45),
    (3, '2022-09-01', 9200.00, 2750.00, 4150.00, 850.00, 1550.00, 1.69, 0.54, 1.43),
    (3, '2022-10-01', 9300.00, 2800.00, 4200.00, 875.00, 1600.00, 1.68, 0.53, 1.42),
    -- Data center 3 - Singtel, 2021
    (3, '2021-08-01', 9000.00, 2650.00, 4050.00, 800.00, 1500.00, 1.72, 0.56, 1.47),
    (3, '2021-09-01', 9100.00, 2700.00, 4100.00, 825.00, 1525.00, 1.71, 0.55, 1.45),
    (3, '2021-10-01', 9200.00, 2750.00, 4150.00, 850.00, 1550.00, 1.70, 0.54, 1.43),

    -- Data center 4 - Singtel
    (4, '2024-08-01', 8500.00, 2600.00, 4000.00, 900.00, 1400.00, 1.63, 0.48, 1.37), -- Data center 4 - Singtel, 2024
    (4, '2024-09-01', 8600.00, 2650.00, 4050.00, 950.00, 1450.00, 1.62, 0.47, 1.35),
    (4, '2024-10-01', 8700.00, 2700.00, 4100.00, 1000.00, 1500.00, 1.61, 0.46, 1.33),
    (4, '2023-08-01', 8400.00, 2550.00, 3950.00, 850.00, 1350.00, 1.64, 0.49, 1.38), -- Data center 4 - Singtel, 2023
    (4, '2023-09-01', 8500.00, 2600.00, 4000.00, 875.00, 1400.00, 1.63, 0.48, 1.37),
    (4, '2023-10-01', 8600.00, 2650.00, 4050.00, 900.00, 1450.00, 1.62, 0.47, 1.35),
    (4, '2022-08-01', 8300.00, 2500.00, 3900.00, 825.00, 1300.00, 1.66, 0.50, 1.40), -- Data center 4 - Singtel, 2022
    (4, '2022-09-01', 8400.00, 2550.00, 3950.00, 850.00, 1350.00, 1.65, 0.49, 1.38),
    (4, '2022-10-01', 8500.00, 2600.00, 4000.00, 875.00, 1400.00, 1.64, 0.48, 1.37),
    (4, '2021-08-01', 8200.00, 2450.00, 3850.00, 800.00, 1250.00, 1.68, 0.51, 1.42), -- Data center 4 - Singtel, 2021
    (4, '2021-09-01', 8300.00, 2500.00, 3900.00, 825.00, 1300.00, 1.67, 0.50, 1.40),
    (4, '2021-10-01', 8400.00, 2550.00, 3950.00, 850.00, 1350.00, 1.66, 0.49, 1.38),

    -- Data center 5 - Singtel
    (5, '2024-08-01', 7500.00, 2400.00, 3800.00, 800.00, 1300.00, 1.61, 0.49, 1.35), -- Data center 5 - Singtel, 2024
    (5, '2024-09-01', 7600.00, 2450.00, 3850.00, 850.00, 1350.00, 1.60, 0.48, 1.33),
    (5, '2024-10-01', 7700.00, 2500.00, 3900.00, 900.00, 1400.00, 1.59, 0.47, 1.31),
    (5, '2023-08-01', 7400.00, 2350.00, 3750.00, 750.00, 1250.00, 1.62, 0.50, 1.36), -- Data center 5 - Singtel, 2023
    (5, '2023-09-01', 7500.00, 2400.00, 3800.00, 800.00, 1300.00, 1.61, 0.49, 1.35),
    (5, '2023-10-01', 7600.00, 2450.00, 3850.00, 850.00, 1350.00, 1.60, 0.48, 1.33),
    (5, '2022-08-01', 7300.00, 2300.00, 3700.00, 725.00, 1200.00, 1.63, 0.51, 1.37),-- Data center 5 - Singtel, 2022
    (5, '2022-09-01', 7400.00, 2350.00, 3750.00, 750.00, 1250.00, 1.62, 0.50, 1.36),
    (5, '2022-10-01', 7500.00, 2400.00, 3800.00, 800.00, 1300.00, 1.61, 0.49, 1.35),
    (5, '2021-08-01', 7200.00, 2250.00, 3650.00, 700.00, 1150.00, 1.65, 0.52, 1.39),-- Data center 5 - Singtel, 2021
    (5, '2021-09-01', 7300.00, 2300.00, 3700.00, 725.00, 1200.00, 1.64, 0.51, 1.37),
    (5, '2021-10-01', 7400.00, 2350.00, 3750.00, 750.00, 1250.00, 1.63, 0.50, 1.36),

    -- Data center 6 - M1
    (6, '2024-08-01', 6800.00, 2300.00, 3700.00, 700.00, 1100.00, 1.66, 0.50, 1.39),
    (6, '2024-09-01', 6900.00, 2350.00, 3750.00, 750.00, 1150.00, 1.65, 0.49, 1.37),
    (6, '2024-10-01', 7000.00, 2400.00, 3800.00, 800.00, 1200.00, 1.64, 0.48, 1.35),
    
    -- Data center 7 - M1
    (7, '2024-09-01', 8700.00, 2800.00, 4400.00, 950.00, 1300.00, 1.69, 0.51, 1.41),
    (7, '2024-09-01', 8800.00, 2850.00, 4450.00, 1000.00, 1350.00, 1.68, 0.50, 1.39),
    (7, '2024-10-01', 8900.00, 2900.00, 4500.00, 1050.00, 1400.00, 1.67, 0.49, 1.37),
    
    -- Data center 8 - M1
    (8, '2024-08-01', 9300.00, 3100.00, 4800.00, 1200.00, 1600.00, 1.64, 0.46, 1.32),
    (8, '2024-09-01', 9400.00, 3150.00, 4850.00, 1250.00, 1650.00, 1.63, 0.45, 1.30),
    (8, '2024-10-01', 9500.00, 3200.00, 4900.00, 1300.00, 1700.00, 1.62, 0.44, 1.28),

    -- Data center 9 - M1
    (9, '2024-09-01', 8900.00, 2800.00, 4200.00, 1100.00, 1600.00, 1.70, 0.54, 1.45),
    (9, '2024-09-01', 9000.00, 2850.00, 4300.00, 1150.00, 1650.00, 1.68, 0.53, 1.43),
    (9, '2024-10-01', 9100.00, 2900.00, 4350.00, 1200.00, 1700.00, 1.67, 0.52, 1.41),
    
    -- Data center 10 - M1
    (10, '2024-08-01', 7200.00, 2200.00, 3500.00, 800.00, 1100.00, 1.63, 0.47, 1.35),
    (10, '2024-09-01', 7300.00, 2250.00, 3550.00, 850.00, 1150.00, 1.62, 0.46, 1.33),
    (10, '2024-10-01', 7400.00, 2300.00, 3600.00, 900.00, 1200.00, 1.61, 0.45, 1.31),
    
    -- Data center 11 - Simba
    (11, '2024-08-01', 5000.00, 1500.00, 2000.00, 600.00, 900.00, 1.75, 0.45, 1.25),
    (11, '2024-09-01', 5050.00, 1525.00, 2025.00, 620.00, 900.00, 1.73, 0.46, 1.24),
    (11, '2024-10-01', 5100.00, 1550.00, 2050.00, 630.00, 920.00, 1.72, 0.47, 1.23),
    
    -- Data center 12 - Simba
    (12, '2024-08-01', 5500.00, 1700.00, 2300.00, 700.00, 1000.00, 1.72, 0.49, 1.34),
    (12, '2024-09-01', 5600.00, 1750.00, 2350.00, 750.00, 1050.00, 1.70, 0.48, 1.32),
    (12, '2024-10-01', 5700.00, 1800.00, 2400.00, 800.00, 1100.00, 1.69, 0.47, 1.30),
    
    -- Data center 13 - Simba
    (13, '2024-08-01', 6500.00, 1900.00, 2700.00, 900.00, 1000.00, 1.61, 0.44, 1.30),
    (13, '2024-09-01', 6600.00, 1950.00, 2750.00, 950.00, 1050.00, 1.60, 0.43, 1.28),
    (13, '2024-10-01', 6700.00, 2000.00, 2800.00, 1000.00, 1100.00, 1.59, 0.42, 1.26),
    
    -- Data center 14 - Simba
    (14, '2024-08-01', 6000.00, 1800.00, 2500.00, 800.00, 900.00, 1.63, 0.48, 1.32),
    (14, '2024-09-01', 6100.00, 1850.00, 2550.00, 850.00, 950.00, 1.61, 0.47, 1.30),
    (14, '2024-10-01', 6200.00, 1900.00, 2600.00, 900.00, 1000.00, 1.60, 0.46, 1.28),
    
    -- Data center 15 - Simba
    (15, '2024-08-01', 7000.00, 2100.00, 3100.00, 1000.00, 1100.00, 1.55, 0.42, 1.30),
    (15, '2024-09-01', 7100.00, 2150.00, 3150.00, 1050.00, 1150.00, 1.54, 0.41, 1.28),
    (15, '2024-10-01', 7200.00, 2200.00, 3200.00, 1100.00, 1200.00, 1.53, 0.40, 1.26),

    -- Data center 16 - Starhub
    (16, '2024-08-01', 8500.00, 2800.00, 3000.00, 900.00, 800.00, 1.60, 0.51, 1.50),
    (16, '2024-09-01', 8600.00, 2850.00, 3050.00, 900.00, 800.00, 1.58, 0.52, 1.48),
    (16, '2024-10-01', 8700.00, 2900.00, 3100.00, 920.00, 800.00, 1.57, 0.53, 1.47),

    -- Data center 17 - Starhub
    (17, '2024-8-01', 8700.00, 2700.00, 4300.00, 1100.00, 1600.00, 1.64, 0.50, 1.42),
    (17, '2024-09-01', 8800.00, 2750.00, 4350.00, 1120.00, 1650.00, 1.63, 0.49, 1.40),
    (17, '2024-10-01', 8900.00, 2800.00, 4400.00, 1150.00, 1700.00, 1.62, 0.48, 1.39),

    -- Data center 18 - Starhub
    (18, '2024-08-01', 8200.00, 2400.00, 4100.00, 1000.00, 1500.00, 1.68, 0.53, 1.44),
    (18, '2024-09-01', 8300.00, 2450.00, 4150.00, 1050.00, 1550.00, 1.67, 0.52, 1.43),
    (18, '2024-10-01', 8400.00, 2500.00, 4200.00, 1100.00, 1600.00, 1.65, 0.51, 1.41),

    -- Data center 19 - Starhub
    (19, '2024-08-01', 7800.00, 2200.00, 3800.00, 900.00, 1400.00, 1.70, 0.56, 1.48),
    (19, '2024-09-01', 7900.00, 2250.00, 3850.00, 920.00, 1450.00, 1.69, 0.55, 1.46),
    (19, '2024-10-01', 8000.00, 2300.00, 3900.00, 950.00, 1500.00, 1.68, 0.54, 1.45),

    -- Data center 20 - Starhub
    (20, '2024-08-01', 6900.00, 2100.00, 3300.00, 800.00, 1200.00, 1.72, 0.50, 1.38),
    (20, '2024-09-01', 7000.00, 2150.00, 3350.00, 820.00, 1250.00, 1.71, 0.49, 1.36),
    (20, '2024-10-01', 7100.00, 2200.00, 3400.00, 850.00, 1300.00, 1.70, 0.48, 1.35);

-- Insert sample data into data_center_carbon_emissions
INSERT INTO data_center_carbon_emissions (data_center_id, date, co2_emissions_tons, renewable_energy_percentage)
VALUES

    -- Data center 1 - Singtel
    (1, '2024-08-01', 5100.00, 15.0),
    (1, '2024-09-01', 5142.50, 15.0),
    (1, '2024-10-01', 5312.50, 15.0),
    (1, '2024-10-02', 5320.00, 15.1),
    (1, '2024-10-03', 5330.00, 15.2),
    (1, '2024-10-04', 5325.00, 15.0),
    (1, '2024-10-05', 5340.00, 15.1),
    (1, '2024-10-06', 5355.00, 15.2),
    (1, '2024-10-07', 5360.00, 15.3),
    (1, '2024-10-08', 5370.00, 15.1),
    (1, '2024-10-09', 5380.00, 15.0),
    (1, '2024-10-10', 5385.00, 15.1),
    (1, '2024-10-11', 5390.00, 15.2),
    (1, '2024-10-12', 5395.00, 15.3),
    (1, '2024-10-13', 5400.00, 15.2),
    (1, '2024-10-14', 5410.00, 15.3),
    (1, '2024-10-15', 5415.00, 15.4),
    (1, '2024-10-16', 5420.00, 15.3),
    (1, '2024-10-17', 5430.00, 15.2),
    (1, '2024-10-18', 5435.00, 15.1),
    (1, '2024-10-19', 5440.00, 15.0),
    (1, '2023-08-01', 4800.00, 14.5),
    (1, '2023-09-01', 4840.00, 14.8),
    (1, '2023-10-01', 4900.00, 15.0),

    -- Data center 2 - Singtel
    (2, '2024-08-01', 4620.00, 16.0),
    (2, '2024-09-01', 4762.50, 16.0),
    (2, '2024-10-01', 4932.00, 16.0),
    (2, '2023-08-01', 4400.00, 15.8),
    (2, '2023-09-01', 4450.00, 16.0),
    (2, '2023-10-01', 4525.00, 16.0),

    -- Data center 3 - Singtel
    (3, '2024-08-01', 4037.50, 15.0),
    (3, '2024-09-01', 4080.00, 15.0),
    (3, '2024-10-01', 4212.50, 15.0),
    (3, '2023-08-01', 3875.00, 14.5),
    (3, '2023-09-01', 3900.00, 15.0),
    (3, '2023-10-01', 3950.00, 15.0),

    -- Data center 4 - Singtel
    (4, '2024-08-01', 3570.00, 16.0),
    (4, '2024-09-01', 3610.00, 16.0),
    (4, '2024-10-01', 3740.00, 16.0),
    (4, '2023-08-01', 3350.00, 15.5),
    (4, '2023-09-01', 3400.00, 16.0),
    (4, '2023-10-01', 3450.00, 16.0),

    -- Data center 5 - Singtel
    (5, '2024-08-01', 3131.25, 16.5),
    (5, '2024-09-01', 3171.00, 16.5),
    (5, '2024-10-01', 3243.00, 11),
    (5, '2023-08-01', 2950.00, 16.0),
    (5, '2023-09-01', 3000.00, 16.5),
    (5, '2023-10-01', 3050.00, 16.5),

    -- Data center 6 - M1
    (6, '2024-08-01', 2720.00, 20.0),
    (6, '2024-09-01', 2760.00, 20.0),
    (6, '2024-10-01', 2850.00, 20.0),

    -- Data center 7 - M1
    (7, '2024-08-01', 3436.50, 21.0),
    (7, '2024-09-01', 3477.50, 21.0),
    (7, '2024-10-01', 3619.50, 21.0),

    -- Data center 8 - M1
    (8, '2024-08-01', 3627.00, 22.0),
    (8, '2024-09-01', 3668.00, 22.0),
    (8, '2024-10-01', 3810.00, 22.0),

    -- Data center 9 - M1
    (9, '2024-08-01', 3471.00, 22.0),
    (9, '2024-09-01', 3512.00, 22.0),
    (9, '2024-10-01', 3654.50, 22.0),

    -- Data center 10 - M1
    (10, '2024-08-01', 2790.00, 22.5),
    (10, '2024-09-01', 2831.00, 22.5),
    (10, '2024-10-01', 2968.50, 22.5),

    -- Data center 11 - Simba
    (11, '2024-08-01', 2050.00, 18.0),
    (11, '2024-09-01', 2090.50, 18.0),
    (11, '2024-10-01', 2131.00, 18.0),

    -- Data center 12 - Simba
    (12, '2024-08-01', 2241.25, 18.5),
    (12, '2024-09-01', 2282.00, 18.5),
    (12, '2024-10-01', 2323.00, 18.5),

    -- Data center 13 - Simba
    (13, '2024-08-01', 2632.50, 19.0),
    (13, '2024-09-01', 2673.00, 19.0),
    (13, '2024-10-01', 2715.00, 19.0),

    -- Data center 14 - Simba
    (14, '2024-08-01', 2430.00, 19.0),
    (14, '2024-09-01', 2470.00, 19.0),
    (14, '2024-10-01', 2510.50, 19.0),

    -- Data center 15 - Simba
    (15, '2024-08-01', 2817.50, 19.5),
    (15, '2024-09-01', 2858.00, 19.5),
    (15, '2024-10-01', 2900.00, 19.5),

    -- Data center 16 - Starhub
    (16, '2024-08-01', 3825.00, 10.0),
    (16, '2024-09-01', 3865.50, 10.0),
    (16, '2024-10-01', 3910.00, 10.0),

    -- Data center 17 - Starhub
    (17, '2024-08-01', 3893.25, 10.5),
    (17, '2024-09-01', 3933.75, 10.5),
    (17, '2024-10-01', 3978.50, 10.5),

    -- Data center 18 - Starhub
    (18, '2024-08-01', 3649.00, 11.0),
    (18, '2024-09-01', 3689.00, 11.0),
    (18, '2024-10-01', 3731.50, 11.0),

    -- Data center 19 - Starhub
    (19, '2024-08-01', 3451.50, 11.5),
    (19, '2024-09-01', 3492.50, 11.5),
    (19, '2024-10-01', 3535.50, 11.5),

    -- Data center 20 - Starhub
    (20, '2024-08-01', 3036.00, 12.0),
    (20, '2024-09-01', 3076.50, 12.0),
    (20, '2024-10-01', 3118.00, 12.0);


-- Insert sample data into company_sustainability_goals table
INSERT INTO company_sustainability_goals (company_id, goal_name, target_value, current_value, target_year, progress)
VALUES
    -- Singtel goals
    (1, 'CO₂e Reduction', 4000.00, 6000.00, 2025, 0.60),
    (1, 'PUE Improvement', 1.40, 1.65, 2025, 0.85),
    (1, 'Renewable Energy Usage', 30.00, 15.00, 2025, 0.50),
    (1, 'Water Usage Reduction (WUE)', 1.10, 1.40, 2025, 0.78),

    -- M1 goals
    (2, 'CO₂e Reduction', 3500.00, 4800.00, 2025, 0.73),
    (2, 'PUE Improvement', 1.30, 1.67, 2025, 0.78),
    (2, 'Renewable Energy Usage', 35.00, 22.00, 2025, 0.63),
    (2, 'Water Usage Reduction (WUE)', 1.15, 1.32, 2025, 0.87),

    -- SIMBA goals
    (3, 'CO₂e Reduction', 2000.00, 2900.00, 2025, 0.69),
    (3, 'PUE Improvement', 1.50, 1.72, 2025, 0.87),
    (3, 'Renewable Energy Usage', 40.00, 19.00, 2025, 0.48),
    (3, 'Water Usage Reduction (WUE)', 1.20, 1.23, 2025, 0.98),

    -- StarHub goals
    (4, 'CO₂e Reduction', 3000.00, 5600.00, 2025, 0.54),
    (4, 'PUE Improvement', 1.35, 1.57, 2025, 0.86),
    (4, 'Renewable Energy Usage', 20.00, 11.00, 2025, 0.55),
    (4, 'Water Usage Reduction (WUE)', 1.05, 1.47, 2025, 0.71);

    
-- Insert sample data into activity_feed table
INSERT INTO activity_feed (user_id, company_id, data_center_id, context, media_url, carbon_emission, energy_consumption, activity_type, location, date, time) 
VALUES 
(3, 1, 1, 'Installed solar panels at the data center', NULL, 120.50, 300.75, 'Energy Optimization', 'New York, USA', '2024-08-23', '09:00:00'),
(4, 4, 2, 'Achieved carbon neutrality for Q3', NULL, 0.00, 500.00, 'Carbon Neutral', 'San Francisco, USA', '2024-09-14', '18:00:00'),
(5, 3, NULL, 'Switched to 100% renewable energy', NUll, 0.00, 0.00, 'Sustainability', 'Austin, USA', '2024-09-14', '18:00:00'),
(5, 4, 3, 'Reduced energy consumption by 15%', NULL, 85.50, 200.20, 'Energy Conservation', 'Seattle, USA', '2024-08-23', '09:00:00'),
(4, 2, NULL, 'Hosted a clean energy summit', NULL, 300.00, 1000.00, 'Event', 'Chicago, USA', '2024-08-23', '09:00:00');

-- Insert sample data into comments table
INSERT INTO comments (user_id, post_id, company_id, comment_text, date, time) 
VALUES 
(3, 1, 3, 'Proud to be part of this!', '2024-10-12', '10:00:00'),
(3, 5, 2, 'Amazing work!', '2024-10-10', '14:00:00'),
(4, 4, 1, 'We need more projects like this!', '2024-10-12', '10:00:00'),
(5, 3, 4, 'Such a wonderful event!', '2024-09-14', '18:00:00');

-- Insert sample data into likes table
INSERT INTO likes (post_id, user_id, date, time) 
VALUES 
(1, 6, '2024-09-14', '18:00:00'),
(2, 3, '2024-10-10', '14:00:00'),
(3, 4, '2024-09-14', '18:00:00'),
(4, 5, '2024-10-12', '10:00:00'),
(5, 4, '2024-10-10', '14:00:00');

 -- Insert sample data into dislike table
 INSERT INTO dislikes (post_id, user_id, date, time) 
VALUES 
(1, 3, '2024-10-12', '10:00:00'),
(2, 4, '2024-10-10', '14:00:00'),
(3, 7, '2024-10-12', '10:00:00'),
(4, 4, '2024-08-10', '19:00:00'),
(5, 5, '2024-10-10', '05:00:00');

    `;

async function seedDatabase() {
  try {
    // Connect to the database
    await sql.connect(dbConfig);
    console.log("Connected to the database");

    // Drop foreign key constraints if they exist
    await sql.query(dropForeignKeysSQL);
    console.log("Dropped foreign keys");

    // Drop tables
    await sql.query(dropTablesSQL);
    console.log("Dropped tables");

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