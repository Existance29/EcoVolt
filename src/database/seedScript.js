const sql = require("mssql");
const dbConfig = require("./dbConfig"); // Import your database configuration   
const cellTowerConsumptionData = require("./seedCellTower")
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

-- Create table for Cell Towers
CREATE TABLE cell_towers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_id INT NOT NULL,
    cell_tower_name VARCHAR(255) NOT NULL,
    cell_tower_grid_type VARCHAR(255) NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id)
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
    about VARCHAR(255) NOT NULL,
    profile_picture_file_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create table for Employee access
CREATE TABLE employee_access (
    user_id INT REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    access_level INT NOT NULL,
    company_id INT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id),
);



-- Create table for energy consumption data (cell tower)
CREATE TABLE cell_tower_energy_consumption (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cell_tower_id INT NOT NULL,
    date DATE NOT NULL,
    total_energy_kwh DECIMAL(10, 2) NOT NULL,
    radio_equipment_energy_kwh DECIMAL(10, 2) NOT NULL,
    cooling_energy_kwh DECIMAL(10, 2) NOT NULL,
    backup_power_energy_kwh DECIMAL(10, 2),
    misc_energy_kwh DECIMAL(10,2),
    renewable_energy_kwh DECIMAL(10,2),
    carbon_emission_kg DECIMAL(10,2),
    FOREIGN KEY (cell_tower_id) REFERENCES cell_towers(id)
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

CREATE TABLE devices (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Unique identifier for the device
    data_center_id INT NOT NULL,       -- Reference to the data center
    brand VARCHAR(255) NOT NULL,       -- Brand of the device
    model VARCHAR(255) NOT NULL,       -- Model of the device
    serial_number VARCHAR(255) NOT NULL UNIQUE, -- Unique serial number
    device_type VARCHAR(255),          -- Type of the device (optional)
    status VARCHAR(50) CHECK (status IN ('Pending Pick Up', 'recycled', 'in use', 'not in use')), -- Status constraint
    FOREIGN KEY (data_center_id) REFERENCES data_centers(id) -- Foreign key to data_centers table
);

-- Create table for sustainability goals
CREATE TABLE company_sustainability_goals (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_id INT NOT NULL,
    goal_name VARCHAR(255) NOT NULL,
    target_value DECIMAL(10, 2),
    target_year INT NOT NULL,
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


-- Create table for reward points
CREATE TABLE user_rewards (
    reward_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    total_points INT DEFAULT 0,
    last_updated DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create table for activity points 
CREATE TABLE activity_points (
    activity_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    post_id INT,
    activity_type VARCHAR(50), 
    points_awarded INT,
    datetime DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (post_id) REFERENCES activity_feed(post_id)
);

-- Create table for reward history
CREATE TABLE reward_history (
    redemption_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    reward_description VARCHAR(255),
    points_spent INT,
    redemption_date DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
); 

-- Create table for Recyclables with data_center_id
CREATE TABLE recyclables (
    id INT IDENTITY(1,1) PRIMARY KEY,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Pending Pick Up','Awaiting Approval', 'Recycled', 'Approved', 'Rejected')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('Company', 'Personal')),
    device_type VARCHAR(50) NOT NULL,
    user_id INT NULL, -- Nullable for company recyclables
    company_id INT NOT NULL,
    data_center_id INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    image_path VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (data_center_id) REFERENCES data_centers(id) -- New foreign key to data_centers
);
CREATE TABLE courses (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Unique course identifier
    title VARCHAR(255) NOT NULL,      -- Course title
    description TEXT NOT NULL,         -- Detailed course description
    points INT NOT NULL,              -- Total number of points in the course
    image_path VARCHAR(255) NOT NULL  -- Path to the course image
);
CREATE TABLE lessons (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Unique lesson identifier
    course_id INT NOT NULL,           -- References the associated course
    title VARCHAR(255) NOT NULL,      -- Lesson title
    content TEXT NOT NULL,            -- Lesson content or description
    duration VARCHAR(255) NOT NULL,   -- Estimated duration
    position INT NOT NULL,            -- Order of the lesson in the course
    video_link VARCHAR(2083),         -- Video link for the lesson
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
CREATE TABLE key_concepts (
    id INT IDENTITY(1,1) PRIMARY KEY,     -- Unique concept identifier
    lesson_id INT NOT NULL,               -- References the associated lesson
    title VARCHAR(255) NOT NULL,          -- Key concept title
    description TEXT NOT NULL,            -- Key concept description
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) -- Foreign key to lessons table
);
CREATE TABLE questions (
    id INT IDENTITY(1,1) PRIMARY KEY,       -- Unique question identifier
    lesson_id INT NOT NULL,                 -- References the associated lesson
    question_text TEXT NOT NULL,            -- The text of the question
    option_a VARCHAR(255) NOT NULL,         -- Option A for the question
    option_b VARCHAR(255) NOT NULL,         -- Option B for the question
    option_c VARCHAR(255) NOT NULL,         -- Option C for the question
    option_d VARCHAR(255) NOT NULL,         -- Option D for the question
    correct_option CHAR(1) NOT NULL,        -- The correct option (e.g., 'A', 'B', 'C', or 'D')
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) -- Links to the lessons table
);
-- Create table for Suggestions
CREATE TABLE suggestions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL, -- The user who made the suggestion
    company_id INT NULL, -- Optional: Company related to the suggestion
    title VARCHAR(255) NOT NULL, -- A short title for the suggestion
    suggestion_text TEXT NOT NULL, -- The suggestion content
    created_at DATETIME DEFAULT GETDATE(), -- Timestamp for when the suggestion was made
    status VARCHAR(50) DEFAULT 'Pending', -- Status of the suggestion (e.g., Pending, Reviewed, Implemented, Rejected)
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
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
INSERT INTO users (name, email, password, company_id, about, profile_picture_file_name)
VALUES
    ('John Doe', 'john_doe@singtel.com', 'password123', 1, 'Hello! I am John', 'default.png'),
    ('Jane Smith', 'jane_smith@m1.com.sg', 'password123', 2, 'NPC', 'default.png'),
    ('Alice Tan', 'alice_tan@simba.sg', 'password123', 3, 'NPC', 'default.png'),
    ('Bob Lee', 'bob_lee@starhub.com', 'password123', 4, 'NPC', 'default.png'),
    ('Apple Lim', 'apple_lim@singtel.com', 'password123', 1, 'NPC', 'default.png'),
    ('Benedict Soh', 'benedict_soh@m1.com.sg', 'password123', 2, 'NPC', 'default.png'),
    ('Cadence Tan', 'cadence_tan@simba.sg', 'password123', 3, 'NPC', 'default.png'),
    ('Dominic Lee', 'dominic_lee@starhub.com', 'password123', 4, 'NPC', 'default.png');

INSERT employee_access (user_id, email, access_level, company_id)
SELECT * FROM (VALUES
(NULL, 'e@singtel.com', 0, 1),
(NULL, 'a@singtel.com', 1, 1),
(NULL, 'employee@singtel.com', 0, 1),
(NULL, 'admin@singtel.com', 1, 1),
(NULL, 'john_doe@singtel.com', 0, 1),
(NULL, 'jane_smith@singtel.com', 0, 1),
(NULL, 'alex_taylor@singtel.com', 0, 1),
(NULL, 'alice_tan@singtel.com', 0, 1),
(NULL, 'dominic_lee@singtel.com', 0, 1),
(NULL, 'benedict_soh@singtel.com', 0, 1),
(NULL, 'apple_lim@singtel.com', 0, 1),
(NULL, 'jane_doe@singtel.com', 1, 1),
(NULL, 'daniel_jackson@singtel.com', 1, 1),
(NULL, 'candence_tan@singtel.com', 1, 1),
(NULL, 'jessica_morris@singtel.com', 1, 1),
(NULL, 'william_bennet@singtel.com', 1, 1),
(NULL, 'bob_lee@singtel.com', 1, 1),
(NULL, 'e@m1.com.sg', 0, 2),
(NULL, 'a@m1.com.sg', 1, 2),
(NULL, 'employee@m1.com.sg', 0, 2),
(NULL, 'admin@m1.com.sg', 1, 2),
(NULL, 'john_doe@m1.com.sg', 0, 2),
(NULL, 'jane_smith@m1.com.sg', 0, 2),
(NULL, 'alex_taylor@m1.com.sg', 0, 2),
(NULL, 'alice_tan@m1.com.sg', 0, 2),
(NULL, 'dominic_lee@m1.com.sg', 0, 2),
(NULL, 'benedict_soh@m1.com.sg', 0, 2),
(NULL, 'apple_lim@m1.com.sg', 0, 2),
(NULL, 'jane_doe@m1.com.sg', 1, 2),
(NULL, 'daniel_jackson@m1.com.sg', 1, 2),
(NULL, 'candence_tan@m1.com.sg', 1, 2),
(NULL, 'jessica_morris@m1.com.sg', 1, 2),
(NULL, 'william_bennet@m1.com.sg', 1, 2),
(NULL, 'bob_lee@m1.com.sg', 1, 2),
(NULL, 'e@simba.sg', 0, 3),
(NULL, 'a@simba.sg', 1, 3),
(NULL, 'employee@simba.sg', 0, 3),
(NULL, 'admin@simba.sg', 1, 3),
(NULL, 'john_doe@simba.sg', 0, 3),
(NULL, 'jane_smith@simba.sg', 0, 3),
(NULL, 'alex_taylor@simba.sg', 0, 3),
(NULL, 'alice_tan@simba.sg', 0, 3),
(NULL, 'dominic_lee@simba.sg', 0, 3),
(NULL, 'benedict_soh@simba.sg', 0, 3),
(NULL, 'apple_lim@simba.sg', 0, 3),
(NULL, 'jane_doe@simba.sg', 1, 3),
(NULL, 'daniel_jackson@simba.sg', 1, 3),
(NULL, 'candence_tan@simba.sg', 1, 3),
(NULL, 'jessica_morris@simba.sg', 1, 3),
(NULL, 'william_bennet@simba.sg', 1, 3),
(NULL, 'bob_lee@simba.sg', 1, 3),
(NULL, 'e@starhub.com', 0, 4),
(NULL, 'a@starhub.com', 1, 4),
(NULL, 'employee@starhub.com', 0, 4),
(NULL, 'admin@starhub.com', 1, 4),
(NULL, 'john_doe@starhub.com', 0, 4),
(NULL, 'jane_smith@starhub.com', 0, 4),
(NULL, 'alex_taylor@starhub.com', 0, 4),
(NULL, 'alice_tan@starhub.com', 0, 4),
(NULL, 'dominic_lee@starhub.com', 0, 4),
(NULL, 'benedict_soh@starhub.com', 0, 4),
(NULL, 'apple_lim@starhub.com', 0, 4),
(NULL, 'jane_doe@starhub.com', 1, 4),
(NULL, 'daniel_jackson@starhub.com', 1, 4),
(NULL, 'candence_tan@starhub.com', 1, 4),
(NULL, 'jessica_morris@starhub.com', 1, 4),
(NULL, 'william_bennet@starhub.com', 1, 4),
(NULL, 'bob_lee@starhub.com', 1, 4)) AS temp (user_id, email, access_level, company_id);

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


-- Insert sample data into cell_towers table
INSERT INTO cell_towers (company_id, cell_tower_name, cell_tower_grid_type)
VALUES
    (1, 'Singtel CT-1', 'On-Grid'),
    (1, 'Singtel CT-2', 'On-Grid'),
    (1, 'Singtel CT-3', 'On-Grid'),
    (1, 'Singtel CT-4', 'On-Grid'),
    (1, 'Singtel CT-5', 'On-Grid'),
    (2, 'M1 CT-1', 'On-Grid'),
    (2, 'M1 CT-2', 'On-Grid'),
    (2, 'M1 CT-3', 'On-Grid'),
    (2, 'M1 CT-4', 'On-Grid'),
    (2, 'M1 CT-5', 'On-Grid'),
    (3, 'SIMBA CT-1', 'On-Grid'),
    (3, 'SIMBA CT-2', 'On-Grid'),
    (3, 'SIMBA CT-3', 'On-Grid'),
    (3, 'SIMBA CT-4', 'On-Grid'),
    (3, 'SIMBA CT-5', 'On-Grid'),
    (4, 'StarHub CT-1', 'On-Grid'),
    (4, 'StarHub CT-2', 'On-Grid'),
    (4, 'StarHub CT-3', 'On-Grid'),
    (4, 'StarHub CT-4', 'On-Grid'),
    (4, 'StarHub CT-5', 'On-Grid')

-- Insert sample data into devices table
INSERT INTO devices (data_center_id, brand, model, serial_number, device_type, status)
VALUES
    -- Data center 1 - Singtel
    (1, 'Dell', 'PowerEdge R740', 'SN-10001', 'Server Rack', 'in use'),
    (1, 'Dell', 'PowerEdge R740', 'SN-10002', 'Server Rack', 'in use'),
    (1, 'Schneider', 'Cooling System Pro', 'SN-10003', 'Cooling System', 'in use'),
    (1, 'Schneider', 'Cooling System Pro', 'SN-10004', 'Cooling System', 'in use'),
    (1, 'APC', 'Smart-UPS 1500', 'SN-10005', 'Backup Power Unit', 'not in use'),
    (1, 'Philips', 'Hue Light 5000', 'SN-10006', 'Lighting System', 'in use'),

    -- Data center 2
    (2, 'Dell', 'PowerEdge R740', 'SN-20001', 'Server Rack', 'in use'),
    (2, 'Dell', 'PowerEdge R740', 'SN-20002', 'Server Rack', 'Pending Pick Up'),
    (2, 'Schneider', 'Cooling System Pro', 'SN-20003', 'Cooling System', 'in use'),
    (2, 'Schneider', 'Cooling System Pro', 'SN-20004', 'Cooling System', 'in use'),
    (2, 'APC', 'Smart-UPS 1500', 'SN-20005', 'Backup Power Unit', 'recycled'),
    (2, 'Philips', 'Hue Light 5000', 'SN-20006', 'Lighting System', 'in use'),

    -- Data center 3
    (3, 'HP', 'ProLiant DL380', 'SN-30001', 'Server Rack', 'in use'),
    (3, 'HP', 'ProLiant DL380', 'SN-30002', 'Server Rack', 'Pending Pick Up'),
    (3, 'Daikin', 'Cooling System X', 'SN-30003', 'Cooling System', 'in use'),
    (3, 'Daikin', 'Cooling System X', 'SN-30004', 'Cooling System', 'in use'),
    (3, 'Eaton', 'Power Xpert 9395', 'SN-30005', 'Backup Power Unit', 'recycled'),
    (3, 'Osram', 'LED Pro 9000', 'SN-30006', 'Lighting System', 'in use'),

    -- Repeat similar patterns for other data centers (4 through 20)

    -- Example for Data center 4
    (4, 'Dell', 'PowerEdge R740', 'SN-40001', 'Server Rack', 'in use'),
    (4, 'Dell', 'PowerEdge R740', 'SN-40002', 'Server Rack', 'recycled'),
    (4, 'Schneider', 'Cooling System Pro', 'SN-40003', 'Cooling System', 'in use'),
    (4, 'Schneider', 'Cooling System Pro', 'SN-40004', 'Cooling System', 'in use'),
    (4, 'APC', 'Smart-UPS 1500', 'SN-40005', 'Backup Power Unit', 'not in use'),
    (4, 'Philips', 'Hue Light 5000', 'SN-40006', 'Lighting System', 'in use'),

    -- Data center 5
    (5, 'Dell', 'PowerEdge R740', 'SN-50001', 'Server Rack', 'in use'),
    (5, 'Dell', 'PowerEdge R740', 'SN-50002', 'Server Rack', 'Pending Pick Up'),
    (5, 'Schneider', 'Cooling System Pro', 'SN-50003', 'Cooling System', 'in use'),
    (5, 'Schneider', 'Cooling System Pro', 'SN-50004', 'Cooling System', 'in use'),
    (5, 'APC', 'Smart-UPS 1500', 'SN-50005', 'Backup Power Unit', 'not in use'),
    (5, 'Philips', 'Hue Light 5000', 'SN-50006', 'Lighting System', 'in use'),
    -- Data center 6
    (6, 'Dell', 'PowerEdge R740', 'SN-60001', 'Server Rack', 'in use'),
    (6, 'Dell', 'PowerEdge R740', 'SN-60002', 'Server Rack', 'Pending Pick Up'),
    (6, 'Schneider', 'Cooling System Pro', 'SN-60003', 'Cooling System', 'in use'),
    (6, 'Schneider', 'Cooling System Pro', 'SN-60004', 'Cooling System', 'in use'),
    (6, 'APC', 'Smart-UPS 1500', 'SN-60005', 'Backup Power Unit', 'not in use'),
    (6, 'Philips', 'Hue Light 5000', 'SN-60006', 'Lighting System', 'in use'),
    -- Data center 7
    (7, 'Dell', 'PowerEdge R740', 'SN-70001', 'Server Rack', 'in use'),
    (7, 'Dell', 'PowerEdge R740', 'SN-70002', 'Server Rack', 'Pending Pick Up'),
    (7, 'Schneider', 'Cooling System Pro', 'SN-70003', 'Cooling System', 'in use'),
    (7, 'Schneider', 'Cooling System Pro', 'SN-70004', 'Cooling System', 'in use'),
    (7, 'APC', 'Smart-UPS 1500', 'SN-70005', 'Backup Power Unit', 'not in use'),
    (7, 'Philips', 'Hue Light 5000', 'SN-70006', 'Lighting System', 'in use'),
    -- Data center 8
    (8, 'Dell', 'PowerEdge R740', 'SN-80001', 'Server Rack', 'in use'),
    (8, 'Dell', 'PowerEdge R740', 'SN-80002', 'Server Rack', 'Pending Pick Up'),
    (8, 'Schneider', 'Cooling System Pro', 'SN-80003', 'Cooling System', 'in use'),
    (8, 'Schneider', 'Cooling System Pro', 'SN-80004', 'Cooling System', 'in use'),
    (8, 'APC', 'Smart-UPS 1500', 'SN-80005', 'Backup Power Unit', 'not in use'),
    (8, 'Philips', 'Hue Light 5000', 'SN-80006', 'Lighting System', 'in use'),
    -- Data center 9
    (9, 'Dell', 'PowerEdge R740', 'SN-90001', 'Server Rack', 'in use'),
    (9, 'Dell', 'PowerEdge R740', 'SN-90002', 'Server Rack', 'Pending Pick Up'),
    (9, 'Schneider', 'Cooling System Pro', 'SN-90003', 'Cooling System', 'in use'),
    (9, 'Schneider', 'Cooling System Pro', 'SN-90004', 'Cooling System', 'in use'),
    (9, 'APC', 'Smart-UPS 1500', 'SN-90005', 'Backup Power Unit', 'not in use'),
    (9, 'Philips', 'Hue Light 5000', 'SN-90006', 'Lighting System', 'in use'),
    -- Data center 10
    (10, 'Dell', 'PowerEdge R740', 'SN-100001', 'Server Rack', 'in use'),
    (10, 'Dell', 'PowerEdge R740', 'SN-100002', 'Server Rack', 'Pending Pick Up'),
    (10, 'Schneider', 'Cooling System Pro', 'SN-100003', 'Cooling System', 'in use'),
    (10, 'Schneider', 'Cooling System Pro', 'SN-100004', 'Cooling System', 'in use'),
    (10, 'APC', 'Smart-UPS 1500', 'SN-100005', 'Backup Power Unit', 'not in use'),
    (10, 'Philips', 'Hue Light 5000', 'SN-100006', 'Lighting System', 'in use'),
    -- Data center 11
    (11, 'Dell', 'PowerEdge R740', 'SN-110001', 'Server Rack', 'in use'),
    (11, 'Dell', 'PowerEdge R740', 'SN-110002', 'Server Rack', 'Pending Pick Up'),
    (11, 'Schneider', 'Cooling System Pro', 'SN-110003', 'Cooling System', 'in use'),
    (11, 'Schneider', 'Cooling System Pro', 'SN-110004', 'Cooling System', 'in use'),
    (11, 'APC', 'Smart-UPS 1500', 'SN-110005', 'Backup Power Unit', 'not in use'),
    (11, 'Philips', 'Hue Light 5000', 'SN-110006', 'Lighting System', 'in use'),
    -- Data center 12
    (12, 'Dell', 'PowerEdge R740', 'SN-120001', 'Server Rack', 'in use'),
    (12, 'Dell', 'PowerEdge R740', 'SN-120002', 'Server Rack', 'Pending Pick Up'),
    (12, 'Schneider', 'Cooling System Pro', 'SN-120003', 'Cooling System', 'in use'),
    (12, 'Schneider', 'Cooling System Pro', 'SN-120004', 'Cooling System', 'in use'),
    (12, 'APC', 'Smart-UPS 1500', 'SN-120005', 'Backup Power Unit', 'not in use'),
    (12, 'Philips', 'Hue Light 5000', 'SN-120006', 'Lighting System', 'in use'),
    -- Data center 13
    (13, 'Dell', 'PowerEdge R740', 'SN-130001', 'Server Rack', 'in use'),
    (13, 'Dell', 'PowerEdge R740', 'SN-130002', 'Server Rack', 'Pending Pick Up'),
    (13, 'Schneider', 'Cooling System Pro', 'SN-130003', 'Cooling System', 'in use'),
    (13, 'Schneider', 'Cooling System Pro', 'SN-130004', 'Cooling System', 'in use'),
    (13, 'APC', 'Smart-UPS 1500', 'SN-130005', 'Backup Power Unit', 'not in use'),
    (13, 'Philips', 'Hue Light 5000', 'SN-130006', 'Lighting System', 'in use'),
    -- Data center 14
    (14, 'Dell', 'PowerEdge R740', 'SN-140001', 'Server Rack', 'in use'),
    (14, 'Dell', 'PowerEdge R740', 'SN-140002', 'Server Rack', 'Pending Pick Up'),
    (14, 'Schneider', 'Cooling System Pro', 'SN-140003', 'Cooling System', 'in use'),
    (14, 'Schneider', 'Cooling System Pro', 'SN-140004', 'Cooling System', 'in use'),
    (14, 'APC', 'Smart-UPS 1500', 'SN-140005', 'Backup Power Unit', 'not in use'),
    (14, 'Philips', 'Hue Light 5000', 'SN-140006', 'Lighting System', 'in use'),
    -- Data center 15
    (15, 'Dell', 'PowerEdge R740', 'SN-150001', 'Server Rack', 'in use'),
    (15, 'Dell', 'PowerEdge R740', 'SN-150002', 'Server Rack', 'Pending Pick Up'),
    (15, 'Schneider', 'Cooling System Pro', 'SN-150003', 'Cooling System', 'in use'),
    (15, 'Schneider', 'Cooling System Pro', 'SN-150004', 'Cooling System', 'in use'),
    (15, 'APC', 'Smart-UPS 1500', 'SN-150005', 'Backup Power Unit', 'not in use'),
    (15, 'Philips', 'Hue Light 5000', 'SN-150006', 'Lighting System', 'in use'),
    -- Data center 16
    (16, 'Dell', 'PowerEdge R740', 'SN-160001', 'Server Rack', 'in use'),
    (16, 'Dell', 'PowerEdge R740', 'SN-160002', 'Server Rack', 'Pending Pick Up'),
    (16, 'Schneider', 'Cooling System Pro', 'SN-160003', 'Cooling System', 'in use'),
    (16, 'Schneider', 'Cooling System Pro', 'SN-160004', 'Cooling System', 'in use'),
    (16, 'APC', 'Smart-UPS 1500', 'SN-160005', 'Backup Power Unit', 'not in use'),
    (16, 'Philips', 'Hue Light 5000', 'SN-160006', 'Lighting System', 'in use'),
    -- Data center 17
    (17, 'Dell', 'PowerEdge R740', 'SN-170001', 'Server Rack', 'in use'),
    (17, 'Dell', 'PowerEdge R740', 'SN-170002', 'Server Rack', 'Pending Pick Up'),
    (17, 'Schneider', 'Cooling System Pro', 'SN-170003', 'Cooling System', 'in use'),
    (17, 'Schneider', 'Cooling System Pro', 'SN-170004', 'Cooling System', 'in use'),
    (17, 'APC', 'Smart-UPS 1500', 'SN-170005', 'Backup Power Unit', 'not in use'),
    (17, 'Philips', 'Hue Light 5000', 'SN-170006', 'Lighting System', 'in use'),
    -- Data center 18
    (18, 'Dell', 'PowerEdge R740', 'SN-180001', 'Server Rack', 'in use'),
    (18, 'Dell', 'PowerEdge R740', 'SN-180002', 'Server Rack', 'Pending Pick Up'),
    (18, 'Schneider', 'Cooling System Pro', 'SN-180003', 'Cooling System', 'in use'),
    (18, 'Schneider', 'Cooling System Pro', 'SN-180004', 'Cooling System', 'in use'),
    (18, 'APC', 'Smart-UPS 1500', 'SN-180005', 'Backup Power Unit', 'not in use'),
    (18, 'Philips', 'Hue Light 5000', 'SN-180006', 'Lighting System', 'in use'),
    -- Data center 19
    (19, 'Dell', 'PowerEdge R740', 'SN-190001', 'Server Rack', 'in use'),
    (19, 'Dell', 'PowerEdge R740', 'SN-190002', 'Server Rack', 'Pending Pick Up'),
    (19, 'Schneider', 'Cooling System Pro', 'SN-190003', 'Cooling System', 'in use'),
    (19, 'Schneider', 'Cooling System Pro', 'SN-190004', 'Cooling System', 'in use'),
    (19, 'APC', 'Smart-UPS 1500', 'SN-190005', 'Backup Power Unit', 'not in use'),
    (19, 'Philips', 'Hue Light 5000', 'SN-190006', 'Lighting System', 'in use'),

    -- Repeat until Data center 20
    (20, 'Dell', 'PowerEdge R740', 'SN-200001', 'Server Rack', 'in use'),
    (20, 'Dell', 'PowerEdge R740', 'SN-200002', 'Server Rack', 'in use'),
    (20, 'Schneider', 'Cooling System Pro', 'SN-200003', 'Cooling System', 'in use'),
    (20, 'Schneider', 'Cooling System Pro', 'SN-200004', 'Cooling System', 'in use'),
    (20, 'APC', 'Smart-UPS 1500', 'SN-200005', 'Backup Power Unit', 'Pending Pick Up'),
    (20, 'Philips', 'Hue Light 5000', 'SN-200006', 'Lighting System', 'in use');


-- Insert sample data into data center energy_consumption table
INSERT INTO data_center_energy_consumption (data_center_id, date, total_energy_mwh, it_energy_mwh, cooling_energy_mwh, backup_power_energy_mwh, lighting_energy_mwh, pue, cue, wue)
VALUES
    -- Data center 1 - Singtel
    -- 2024 (Least values)
    (1, '2024-08-01', 11000.00, 3600.00, 5000.00, 1000.00, 1400.00, 1.55, 0.45, 1.25),
    (1, '2024-09-01', 11100.00, 3650.00, 5050.00, 1000.00, 1400.00, 1.56, 0.46, 1.26),
    (1, '2024-10-01', 11200.00, 3700.00, 5100.00, 1000.00, 1400.00, 1.57, 0.47, 1.27),
    (1, '2024-10-05', 10980.00, 3590.00, 4980.00, 995.00, 1415.00, 1.54, 0.44, 1.24),
    (1, '2024-10-10', 10960.00, 3580.00, 4965.00, 990.00, 1425.00, 1.54, 0.44, 1.23),
    (1, '2024-10-15', 10940.00, 3575.00, 4950.00, 985.00, 1430.00, 1.53, 0.43, 1.23),
    (1, '2024-10-20', 10920.00, 3565.00, 4940.00, 980.00, 1435.00, 1.53, 0.43, 1.22),
    (1, '2024-10-25', 10900.00, 3550.00, 4930.00, 975.00, 1445.00, 1.52, 0.43, 1.21),
    (1, '2024-10-30', 10880.00, 3540.00, 4920.00, 970.00, 1450.00, 1.52, 0.42, 1.21),
    -- 2023
    (1, '2023-08-01', 11500.00, 3750.00, 5200.00, 1050.00, 1500.00, 1.60, 0.48, 1.30),
    (1, '2023-09-01', 11600.00, 3800.00, 5250.00, 1050.00, 1500.00, 1.61, 0.49, 1.31),
    (1, '2023-10-01', 11700.00, 3850.00, 5300.00, 1100.00, 1500.00, 1.62, 0.50, 1.32),
    (1, '2023-10-05', 11650.00, 3825.00, 5275.00, 1075.00, 1475.00, 1.61, 0.49, 1.31),
    -- 2022
    (1, '2022-08-01', 11900.00, 3900.00, 5350.00, 1150.00, 1600.00, 1.63, 0.51, 1.35),
    (1, '2022-09-01', 12000.00, 3950.00, 5400.00, 1150.00, 1600.00, 1.64, 0.52, 1.36),
    (1, '2022-10-01', 12100.00, 4000.00, 5450.00, 1200.00, 1600.00, 1.65, 0.53, 1.37),
    (1, '2022-10-05', 12050.00, 3975.00, 5425.00, 1175.00, 1575.00, 1.64, 0.52, 1.36),
    -- 2021 (Most values)
    (1, '2021-08-01', 12200.00, 4050.00, 5500.00, 1250.00, 1700.00, 1.67, 0.54, 1.40),
    (1, '2021-09-01', 12300.00, 4100.00, 5550.00, 1250.00, 1700.00, 1.68, 0.55, 1.41),
    (1, '2021-10-01', 12400.00, 4150.00, 5600.00, 1300.00, 1700.00, 1.69, 0.56, 1.42),
    (1, '2021-10-05', 12350.00, 4125.00, 5575.00, 1275.00, 1675.00, 1.68, 0.55, 1.41),

    -- Data center 2 - Singtel, 2024 (lowest consumption)
    (2, '2024-08-01', 11000.00, 3400.00, 4900.00, 1100.00, 1600.00, 1.60, 0.52, 1.38),
    (2, '2024-09-01', 11500.00, 3550.00, 4950.00, 1100.00, 1600.00, 1.59, 0.51, 1.35),
    (2, '2024-10-01', 11800.00, 3650.00, 5000.00, 1150.00, 1650.00, 1.58, 0.50, 1.32),
    -- Data center 2 - Singtel, 2023
    (2, '2023-08-01', 11300.00, 3450.00, 5000.00, 1125.00, 1725.00, 1.61, 0.53, 1.39),
    (2, '2023-09-01', 11550.00, 3550.00, 5050.00, 1150.00, 1750.00, 1.60, 0.52, 1.37),
    (2, '2023-10-01', 11800.00, 3600.00, 5100.00, 1175.00, 1825.00, 1.59, 0.51, 1.36),
    -- Data center 2 - Singtel, 2022
    (2, '2022-08-01', 12050.00, 3500.00, 5200.00, 1200.00, 1850.00, 1.63, 0.54, 1.41),
    (2, '2022-09-01', 12300.00, 3550.00, 5250.00, 1225.00, 1875.00, 1.62, 0.53, 1.40),
    (2, '2022-10-01', 12550.00, 3600.00, 5300.00, 1250.00, 1900.00, 1.61, 0.52, 1.38),
    -- Data center 2 - Singtel, 2021 (highest consumption)
    (2, '2021-08-01', 12800.00, 3650.00, 5400.00, 1275.00, 1950.00, 1.65, 0.55, 1.43),
    (2, '2021-09-01', 13050.00, 3700.00, 5450.00, 1300.00, 1975.00, 1.64, 0.54, 1.42),
    (2, '2021-10-01', 13300.00, 3750.00, 5500.00, 1325.00, 2000.00, 1.63, 0.53, 1.40),

    -- Data center 3 - Singtel
    (3, '2024-08-01', 9000.00, 2650.00, 4000.00, 800.00, 1550.00, 1.65, 0.52, 1.40),
    (3, '2024-09-01', 9100.00, 2700.00, 4050.00, 825.00, 1550.00, 1.64, 0.51, 1.38),
    (3, '2024-10-01', 9200.00, 2750.00, 4100.00, 850.00, 1550.00, 1.63, 0.50, 1.36),
    -- Data center 3 - Singtel, 2023
    (3, '2023-08-01', 9400.00, 2800.00, 4200.00, 875.00, 1550.00, 1.68, 0.53, 1.43),
    (3, '2023-09-01', 9500.00, 2850.00, 4250.00, 900.00, 1550.00, 1.67, 0.52, 1.41),
    (3, '2023-10-01', 9600.00, 2900.00, 4300.00, 925.00, 1550.00, 1.66, 0.51, 1.39),
    -- Data center 3 - Singtel, 2022
    (3, '2022-08-01', 9700.00, 2950.00, 4400.00, 950.00, 1550.00, 1.69, 0.54, 1.44),
    (3, '2022-09-01', 9800.00, 3000.00, 4450.00, 975.00, 1550.00, 1.68, 0.53, 1.42),
    (3, '2022-10-01', 9900.00, 3050.00, 4500.00, 1000.00, 1550.00, 1.67, 0.52, 1.40),
    -- Data center 3 - Singtel, 2021
    (3, '2021-08-01', 10100.00, 3100.00, 4600.00, 1025.00, 1550.00, 1.71, 0.55, 1.46),
    (3, '2021-09-01', 10200.00, 3150.00, 4650.00, 1050.00, 1550.00, 1.70, 0.54, 1.44),
    (3, '2021-10-01', 10300.00, 3200.00, 4700.00, 1075.00, 1550.00, 1.69, 0.53, 1.42),


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
    (6, '2024-08-01', 9800.00, 2850.00, 4200.00, 950.00, 1800.00, 1.64, 0.52, 1.38),
    (6, '2024-09-01', 9900.00, 2900.00, 4250.00, 975.00, 1775.00, 1.63, 0.51, 1.36),
    (6, '2024-10-01', 10000.00, 2950.00, 4300.00, 1000.00, 1750.00, 1.62, 0.50, 1.35),
    -- Data center 6 - M1, 2023
    (6, '2023-08-01', 10200.00, 3050.00, 4350.00, 1025.00, 1775.00, 1.65, 0.53, 1.39),
    (6, '2023-09-01', 10300.00, 3100.00, 4400.00, 1050.00, 1750.00, 1.64, 0.52, 1.37),
    (6, '2023-10-01', 10400.00, 3150.00, 4450.00, 1075.00, 1725.00, 1.63, 0.51, 1.36),
    -- Data center 6 - M1, 2022
    (6, '2022-08-01', 10600.00, 3250.00, 4550.00, 1100.00, 1700.00, 1.66, 0.54, 1.40),
    (6, '2022-09-01', 10700.00, 3300.00, 4600.00, 1125.00, 1675.00, 1.65, 0.53, 1.39),
    (6, '2022-10-01', 10800.00, 3350.00, 4650.00, 1150.00, 1650.00, 1.64, 0.52, 1.38),
    -- Data center 6 - M1, 2021
    (6, '2021-08-01', 11000.00, 3400.00, 4750.00, 1175.00, 1675.00, 1.68, 0.55, 1.42),
    (6, '2021-09-01', 11150.00, 3450.00, 4800.00, 1200.00, 1650.00, 1.67, 0.54, 1.41),
    (6, '2021-10-01', 11300.00, 3500.00, 4850.00, 1225.00, 1625.00, 1.66, 0.53, 1.40),

    -- Data center 7 - M1, 2024
    (7, '2024-08-01', 8100.00, 2500.00, 3600.00, 700.00, 1300.00, 1.58, 0.46, 1.32),
    (7, '2024-09-01', 8200.00, 2550.00, 3650.00, 750.00, 1250.00, 1.57, 0.45, 1.30),
    (7, '2024-10-01', 8300.00, 2600.00, 3700.00, 800.00, 1200.00, 1.56, 0.44, 1.28),
    -- Data center 7 - M1, 2023
    (7, '2023-08-01', 8400.00, 2550.00, 3650.00, 750.00, 1450.00, 1.59, 0.47, 1.34),
    (7, '2023-09-01', 8500.00, 2600.00, 3700.00, 800.00, 1400.00, 1.58, 0.46, 1.32),
    (7, '2023-10-01', 8600.00, 2650.00, 3750.00, 850.00, 1350.00, 1.57, 0.45, 1.31),
    -- Data center 7 - M1, 2022
    (7, '2022-08-01', 8700.00, 2650.00, 3750.00, 850.00, 1450.00, 1.60, 0.48, 1.35),
    (7, '2022-09-01', 8800.00, 2700.00, 3800.00, 900.00, 1400.00, 1.59, 0.47, 1.34),
    (7, '2022-10-01', 8900.00, 2750.00, 3850.00, 950.00, 1350.00, 1.58, 0.46, 1.32),
    -- Data center 7 - M1, 2021
    (7, '2021-08-01', 9100.00, 2700.00, 3800.00, 900.00, 1700.00, 1.62, 0.49, 1.38),
    (7, '2021-09-01', 9200.00, 2750.00, 3850.00, 950.00, 1650.00, 1.61, 0.48, 1.36),
    (7, '2021-10-01', 9300.00, 2800.00, 3900.00, 1000.00, 1600.00, 1.60, 0.47, 1.35),
    
    -- Data center 8 - M1, 2024
    (8, '2024-08-01', 8900.00, 2900.00, 4100.00, 950.00, 1150.00, 1.63, 0.50, 1.40),
    (8, '2024-09-01', 8800.00, 2850.00, 4050.00, 950.00, 1150.00, 1.62, 0.49, 1.38),
    (8, '2024-10-01', 8700.00, 2800.00, 4000.00, 900.00, 1100.00, 1.61, 0.48, 1.35),
    -- Data center 8 - M1, 2023
    (8, '2023-08-01', 9100.00, 2950.00, 4150.00, 975.00, 1150.00, 1.65, 0.51, 1.42),
    (8, '2023-09-01', 9000.00, 2900.00, 4100.00, 950.00, 1150.00, 1.64, 0.50, 1.40),
    (8, '2023-10-01', 8900.00, 2850.00, 4050.00, 950.00, 1100.00, 1.63, 0.49, 1.38),
    -- Data center 8 - M1, 2022
    (8, '2022-08-01', 9300.00, 3000.00, 4200.00, 1000.00, 1100.00, 1.66, 0.52, 1.43),
    (8, '2022-09-01', 9200.00, 2950.00, 4150.00, 975.00, 1125.00, 1.65, 0.51, 1.42),
    (8, '2022-10-01', 9100.00, 2900.00, 4100.00, 950.00, 1150.00, 1.64, 0.50, 1.40),
    -- Data center 8 - M1, 2021
    (8, '2021-08-01', 9500.00, 3050.00, 4250.00, 1025.00, 1175.00, 1.68, 0.53, 1.45),
    (8, '2021-09-01', 9400.00, 3000.00, 4200.00, 1000.00, 1200.00, 1.67, 0.52, 1.43),
    (8, '2021-10-01', 9300.00, 2950.00, 4150.00, 975.00, 1150.00, 1.66, 0.51, 1.42),

    -- Data center 9 - M1, 2024
    (9, '2024-08-01', 8000.00, 2500.00, 3500.00, 700.00, 1300.00, 1.56, 0.48, 1.32),
    (9, '2024-09-01', 8100.00, 2550.00, 3550.00, 725.00, 1275.00, 1.55, 0.47, 1.30),
    (9, '2024-10-01', 8200.00, 2600.00, 3600.00, 750.00, 1250.00, 1.54, 0.46, 1.28),
    -- Data center 9 - M1, 2023
    (9, '2023-08-01', 8300.00, 2650.00, 3650.00, 775.00, 1225.00, 1.57, 0.49, 1.34),
    (9, '2023-09-01', 8400.00, 2700.00, 3700.00, 800.00, 1200.00, 1.56, 0.48, 1.32),
    (9, '2023-10-01', 8500.00, 2750.00, 3750.00, 825.00, 1175.00, 1.55, 0.47, 1.30),
    -- Data center 9 - M1, 2022
    (9, '2022-08-01', 8600.00, 2800.00, 3800.00, 850.00, 1150.00, 1.58, 0.50, 1.35),
    (9, '2022-09-01', 8700.00, 2850.00, 3850.00, 875.00, 1100.00, 1.57, 0.49, 1.33),
    (9, '2022-10-01', 8800.00, 2900.00, 3900.00, 900.00, 1050.00, 1.56, 0.48, 1.32),
    -- Data center 9 - M1, 2021
    (9, '2021-08-01', 8900.00, 2950.00, 3950.00, 925.00, 1000.00, 1.59, 0.51, 1.37),
    (9, '2021-09-01', 9000.00, 3000.00, 4000.00, 950.00, 950.00, 1.58, 0.50, 1.36),
    (9, '2021-10-01', 9100.00, 3050.00, 4050.00, 975.00, 900.00, 1.57, 0.49, 1.34),


    -- Data center 10 - M1, 2024
    (10, '2024-08-01', 8100.00, 2550.00, 3400.00, 800.00, 1350.00, 1.60, 0.47, 1.34),
    (10, '2024-09-01', 8200.00, 2600.00, 3450.00, 850.00, 1300.00, 1.59, 0.46, 1.32),
    (10, '2024-10-01', 8300.00, 2650.00, 3500.00, 875.00, 1275.00, 1.58, 0.45, 1.30),
    -- Data center 10 - M1, 2023
    (10, '2023-08-01', 8300.00, 2600.00, 3450.00, 850.00, 1400.00, 1.61, 0.48, 1.36),
    (10, '2023-09-01', 8400.00, 2650.00, 3500.00, 875.00, 1375.00, 1.60, 0.47, 1.34),
    (10, '2023-10-01', 8500.00, 2700.00, 3550.00, 900.00, 1350.00, 1.59, 0.46, 1.32),
    -- Data center 10 - M1, 2022
    (10, '2022-08-01', 8500.00, 2650.00, 3400.00, 825.00, 1350.00, 1.63, 0.49, 1.38),
    (10, '2022-09-01', 8600.00, 2700.00, 3450.00, 850.00, 1400.00, 1.62, 0.48, 1.36),
    (10, '2022-10-01', 8700.00, 2750.00, 3500.00, 875.00, 1375.00, 1.61, 0.47, 1.34),
    -- Data center 10 - M1, 2021
    (10, '2021-08-01', 8700.00, 2700.00, 3350.00, 800.00, 1350.00, 1.65, 0.50, 1.40),
    (10, '2021-09-01', 8800.00, 2750.00, 3400.00, 825.00, 1375.00, 1.64, 0.49, 1.38),
    (10, '2021-10-01', 8900.00, 2800.00, 3450.00, 850.00, 1400.00, 1.63, 0.48, 1.36),
    
    -- Data center 11 - Simba, 2024
    (11, '2024-08-01', 7800.00, 2500.00, 3300.00, 1000.00, 1000.00, 1.58, 0.48, 1.30),
    (11, '2024-09-01', 7850.00, 2550.00, 3350.00, 1000.00, 950.00, 1.57, 0.47, 1.28),
    (11, '2024-10-01', 7900.00, 2600.00, 3400.00, 1050.00, 850.00, 1.56, 0.46, 1.26),
    -- Data center 11 - Simba, 2023
    (11, '2023-08-01', 8000.00, 2400.00, 3250.00, 1100.00, 1250.00, 1.60, 0.49, 1.32),
    (11, '2023-09-01', 8050.00, 2450.00, 3300.00, 1125.00, 1175.00, 1.59, 0.48, 1.31),
    (11, '2023-10-01', 8100.00, 2500.00, 3350.00, 1150.00, 1100.00, 1.58, 0.47, 1.29),
    -- Data center 11 - Simba, 2022
    (11, '2022-08-01', 8200.00, 2350.00, 3200.00, 1200.00, 1450.00, 1.62, 0.50, 1.35),
    (11, '2022-09-01', 8250.00, 2400.00, 3250.00, 1250.00, 1350.00, 1.61, 0.49, 1.34),
    (11, '2022-10-01', 8300.00, 2450.00, 3300.00, 1300.00, 1250.00, 1.60, 0.48, 1.32),
    -- Data center 11 - Simba, 2021
    (11, '2021-08-01', 8500.00, 2250.00, 3100.00, 1350.00, 1800.00, 1.65, 0.52, 1.38),
    (11, '2021-09-01', 8550.00, 2300.00, 3150.00, 1400.00, 1700.00, 1.64, 0.51, 1.37),
    (11, '2021-10-01', 8600.00, 2350.00, 3200.00, 1450.00, 1600.00, 1.63, 0.50, 1.35),
    
    -- Data center 12 - Simba, 2024
    (12, '2024-08-01', 9000.00, 2800.00, 4000.00, 1000.00, 1200.00, 1.58, 0.47, 1.35),
    (12, '2024-09-01', 9200.00, 2900.00, 4050.00, 1050.00, 1200.00, 1.57, 0.46, 1.33),
    (12, '2024-10-01', 9400.00, 2950.00, 4100.00, 1100.00, 1250.00, 1.56, 0.45, 1.31),
    -- Data center 12 - Simba, 2023
    (12, '2023-08-01', 9700.00, 3000.00, 4200.00, 1150.00, 1350.00, 1.59, 0.48, 1.38),
    (12, '2023-09-01', 9800.00, 3050.00, 4250.00, 1175.00, 1325.00, 1.58, 0.47, 1.36),
    (12, '2023-10-01', 9900.00, 3100.00, 4300.00, 1200.00, 1300.00, 1.57, 0.46, 1.34),
    -- Data center 12 - Simba, 2022
    (12, '2022-08-01', 10000.00, 3200.00, 4400.00, 1225.00, 1175.00, 1.60, 0.49, 1.40),
    (12, '2022-09-01', 10200.00, 3250.00, 4450.00, 1250.00, 1250.00, 1.59, 0.48, 1.38),
    (12, '2022-10-01', 10400.00, 3300.00, 4500.00, 1275.00, 1325.00, 1.58, 0.47, 1.36),
    -- Data center 12 - Simba, 2021
    (12, '2021-08-01', 10700.00, 3350.00, 4600.00, 1300.00, 1450.00, 1.63, 0.50, 1.43),
    (12, '2021-09-01', 10800.00, 3400.00, 4650.00, 1325.00, 1425.00, 1.62, 0.49, 1.41),
    (12, '2021-10-01', 10900.00, 3450.00, 4700.00, 1350.00, 1400.00, 1.61, 0.48, 1.39),
    
    -- Data center 13 - Simba, 2024
    (13, '2024-08-01', 8000.00, 2500.00, 3200.00, 700.00, 1600.00, 1.60, 0.48, 1.35),
    (13, '2024-09-01', 8100.00, 2550.00, 3250.00, 750.00, 1550.00, 1.59, 0.47, 1.34),
    (13, '2024-10-01', 8200.00, 2600.00, 3300.00, 800.00, 1500.00, 1.58, 0.46, 1.32),
    -- Data center 13 - Simba, 2023
    (13, '2023-08-01', 7800.00, 2450.00, 3150.00, 650.00, 1550.00, 1.61, 0.49, 1.36),
    (13, '2023-09-01', 7900.00, 2500.00, 3200.00, 700.00, 1500.00, 1.60, 0.48, 1.35),
    (13, '2023-10-01', 8000.00, 2550.00, 3250.00, 750.00, 1450.00, 1.59, 0.47, 1.34),
    -- Data center 13 - Simba, 2022
    (13, '2022-08-01', 7700.00, 2400.00, 3100.00, 600.00, 1600.00, 1.63, 0.50, 1.37),
    (13, '2022-09-01', 7800.00, 2450.00, 3150.00, 650.00, 1550.00, 1.62, 0.49, 1.36),
    (13, '2022-10-01', 7900.00, 2500.00, 3200.00, 700.00, 1500.00, 1.61, 0.48, 1.35),
    -- Data center 13 - Simba, 2021
    (13, '2021-08-01', 7600.00, 2350.00, 3050.00, 550.00, 1650.00, 1.65, 0.51, 1.39),
    (13, '2021-09-01', 7700.00, 2400.00, 3100.00, 600.00, 1600.00, 1.64, 0.50, 1.37),
    (13, '2021-10-01', 7800.00, 2450.00, 3150.00, 650.00, 1550.00, 1.63, 0.49, 1.36),
    
   -- Data center 14 - Simba, 2024
    (14, '2024-08-01', 8200.00, 2450.00, 3900.00, 850.00, 1000.00, 1.62, 0.48, 1.35),
    (14, '2024-09-01', 8300.00, 2500.00, 3950.00, 875.00, 975.00, 1.61, 0.47, 1.33),
    (14, '2024-10-01', 8400.00, 2550.00, 4000.00, 900.00, 950.00, 1.60, 0.46, 1.31),
    -- Data center 14 - Simba, 2023
    (14, '2023-08-01', 8100.00, 2400.00, 3850.00, 825.00, 1025.00, 1.63, 0.49, 1.36),
    (14, '2023-09-01', 8200.00, 2450.00, 3900.00, 850.00, 1000.00, 1.62, 0.48, 1.35),
    (14, '2023-10-01', 8300.00, 2500.00, 3950.00, 875.00, 975.00, 1.61, 0.47, 1.34),
    -- Data center 14 - Simba, 2022
    (14, '2022-08-01', 8000.00, 2350.00, 3800.00, 800.00, 1050.00, 1.65, 0.50, 1.38),
    (14, '2022-09-01', 8100.00, 2400.00, 3850.00, 825.00, 1025.00, 1.64, 0.49, 1.36),
    (14, '2022-10-01', 8200.00, 2450.00, 3900.00, 850.00, 1000.00, 1.63, 0.48, 1.35),
    -- Data center 14 - Simba, 2021
    (14, '2021-08-01', 7900.00, 2300.00, 3750.00, 775.00, 1075.00, 1.66, 0.51, 1.39),
    (14, '2021-09-01', 8000.00, 2350.00, 3800.00, 800.00, 1050.00, 1.65, 0.50, 1.38),
    (14, '2021-10-01', 8100.00, 2400.00, 3850.00, 825.00, 1025.00, 1.64, 0.49, 1.37),
    
    -- Data center 15 - Simba, 2024
    (15, '2024-08-01', 7800.00, 2500.00, 3400.00, 800.00, 1100.00, 1.52, 0.47, 1.31),
    (15, '2024-09-01', 7900.00, 2550.00, 3450.00, 850.00, 1050.00, 1.51, 0.46, 1.29),
    (15, '2024-10-01', 8000.00, 2600.00, 3500.00, 900.00, 1000.00, 1.50, 0.45, 1.27),
    -- Data center 15 - Simba, 2023
    (15, '2023-08-01', 7700.00, 2450.00, 3350.00, 750.00, 1150.00, 1.53, 0.48, 1.33),
    (15, '2023-09-01', 7800.00, 2500.00, 3400.00, 800.00, 1100.00, 1.52, 0.47, 1.31),
    (15, '2023-10-01', 7900.00, 2550.00, 3450.00, 850.00, 1050.00, 1.51, 0.46, 1.29),
    -- Data center 15 - Simba, 2022
    (15, '2022-08-01', 7600.00, 2400.00, 3300.00, 725.00, 1175.00, 1.54, 0.49, 1.35),
    (15, '2022-09-01', 7700.00, 2450.00, 3350.00, 750.00, 1150.00, 1.53, 0.48, 1.33),
    (15, '2022-10-01', 7800.00, 2500.00, 3400.00, 800.00, 1100.00, 1.52, 0.47, 1.31),
    -- Data center 15 - Simba, 2021
    (15, '2021-08-01', 7500.00, 2350.00, 3250.00, 700.00, 1200.00, 1.56, 0.50, 1.37),
    (15, '2021-09-01', 7600.00, 2400.00, 3300.00, 725.00, 1175.00, 1.55, 0.49, 1.35),
    (15, '2021-10-01', 7700.00, 2450.00, 3350.00, 750.00, 1150.00, 1.54, 0.48, 1.33),

    -- Data center 16 - Starhub, 2024
    (16, '2024-08-01', 7200.00, 2100.00, 3500.00, 800.00, 800.00, 1.62, 0.50, 1.30),
    (16, '2024-09-01', 7300.00, 2150.00, 3550.00, 850.00, 750.00, 1.61, 0.49, 1.28),
    (16, '2024-10-01', 7400.00, 2200.00, 3600.00, 850.00, 750.00, 1.60, 0.48, 1.27),
    -- Data center 16 - Starhub, 2023
    (16, '2023-08-01', 7500.00, 2250.00, 3650.00, 800.00, 800.00, 1.63, 0.51, 1.31),
    (16, '2023-09-01', 7400.00, 2200.00, 3600.00, 800.00, 800.00, 1.62, 0.50, 1.29),
    (16, '2023-10-01', 7300.00, 2150.00, 3550.00, 850.00, 750.00, 1.61, 0.49, 1.28),
    -- Data center 16 - Starhub, 2022
    (16, '2022-08-01', 7600.00, 2300.00, 3700.00, 800.00, 800.00, 1.64, 0.52, 1.32),
    (16, '2022-09-01', 7500.00, 2250.00, 3650.00, 800.00, 800.00, 1.63, 0.51, 1.31),
    (16, '2022-10-01', 7400.00, 2200.00, 3600.00, 800.00, 800.00, 1.62, 0.50, 1.29),
    -- Data center 16 - Starhub, 2021
    (16, '2021-08-01', 7800.00, 2350.00, 3750.00, 850.00, 850.00, 1.65, 0.53, 1.33),
    (16, '2021-09-01', 7700.00, 2300.00, 3700.00, 850.00, 850.00, 1.64, 0.52, 1.32),
    (16, '2021-10-01', 7600.00, 2250.00, 3650.00, 850.00, 850.00, 1.63, 0.51, 1.31),

    -- Data center 17 - Starhub, 2024
    (17, '2024-08-01', 9400.00, 2800.00, 4200.00, 900.00, 1500.00, 1.65, 0.47, 1.35),
    (17, '2024-09-01', 9500.00, 2850.00, 4250.00, 950.00, 1450.00, 1.64, 0.46, 1.33),
    (17, '2024-10-01', 9600.00, 2900.00, 4300.00, 1000.00, 1400.00, 1.63, 0.45, 1.31),
    -- Data center 17 - Starhub, 2023
    (17, '2023-08-01', 9300.00, 2750.00, 4150.00, 850.00, 1550.00, 1.66, 0.48, 1.37),
    (17, '2023-09-01', 9400.00, 2800.00, 4200.00, 875.00, 1500.00, 1.65, 0.47, 1.36),
    (17, '2023-10-01', 9500.00, 2850.00, 4250.00, 900.00, 1450.00, 1.64, 0.46, 1.34),
    -- Data center 17 - Starhub, 2022
    (17, '2022-08-01', 9200.00, 2700.00, 4100.00, 825.00, 1600.00, 1.67, 0.49, 1.39),
    (17, '2022-09-01', 9300.00, 2750.00, 4150.00, 850.00, 1550.00, 1.66, 0.48, 1.37),
    (17, '2022-10-01', 9400.00, 2800.00, 4200.00, 875.00, 1500.00, 1.65, 0.47, 1.36),
    -- Data center 17 - Starhub, 2021
    (17, '2021-08-01', 9100.00, 2650.00, 4050.00, 800.00, 1650.00, 1.69, 0.50, 1.41),
    (17, '2021-09-01', 9200.00, 2700.00, 4100.00, 825.00, 1600.00, 1.68, 0.49, 1.40),
    (17, '2021-10-01', 9300.00, 2750.00, 4150.00, 850.00, 1550.00, 1.67, 0.48, 1.38),

    -- Data center 18 - Starhub, 2024
    (18, '2024-08-01', 8000.00, 2400.00, 3600.00, 800.00, 1200.00, 1.55, 0.48, 1.32),
    (18, '2024-09-01', 7900.00, 2350.00, 3550.00, 750.00, 1250.00, 1.54, 0.47, 1.30),
    (18, '2024-10-01', 7800.00, 2300.00, 3500.00, 700.00, 1200.00, 1.53, 0.46, 1.28),
    -- Data center 18 - Starhub, 2023
    (18, '2023-08-01', 8500.00, 2600.00, 3800.00, 800.00, 1400.00, 1.60, 0.50, 1.35),
    (18, '2023-09-01', 8400.00, 2550.00, 3750.00, 775.00, 1350.00, 1.59, 0.49, 1.34),
    (18, '2023-10-01', 8300.00, 2500.00, 3700.00, 750.00, 1300.00, 1.58, 0.48, 1.33),
    -- Data center 18 - Starhub, 2022
    (18, '2022-08-01', 9000.00, 2700.00, 3900.00, 850.00, 1500.00, 1.65, 0.52, 1.40),
    (18, '2022-09-01', 8900.00, 2650.00, 3850.00, 825.00, 1450.00, 1.64, 0.51, 1.38),
    (18, '2022-10-01', 8800.00, 2600.00, 3800.00, 800.00, 1400.00, 1.63, 0.50, 1.37),
    -- Data center 18 - Starhub, 2021
    (18, '2021-08-01', 9500.00, 2800.00, 4000.00, 900.00, 1600.00, 1.70, 0.55, 1.45),
    (18, '2021-09-01', 9400.00, 2750.00, 3950.00, 875.00, 1550.00, 1.69, 0.54, 1.43),
    (18, '2021-10-01', 9300.00, 2700.00, 3900.00, 850.00, 1500.00, 1.68, 0.53, 1.42),

    -- Data center 19 - Starhub, 2024
    (19, '2024-08-01', 7200.00, 2200.00, 3400.00, 700.00, 1200.00, 1.52, 0.45, 1.28),
    (19, '2024-09-01', 7100.00, 2150.00, 3350.00, 675.00, 1150.00, 1.51, 0.44, 1.26),
    (19, '2024-10-01', 7000.00, 2100.00, 3300.00, 650.00, 1100.00, 1.50, 0.43, 1.24),
    -- Data center 19 - Starhub, 2023
    (19, '2023-08-01', 7800.00, 2300.00, 3500.00, 750.00, 1300.00, 1.58, 0.47, 1.32),
    (19, '2023-09-01', 7700.00, 2250.00, 3450.00, 725.00, 1250.00, 1.57, 0.46, 1.31),
    (19, '2023-10-01', 7600.00, 2200.00, 3400.00, 700.00, 1200.00, 1.56, 0.45, 1.30),
    -- Data center 19 - Starhub, 2022
    (19, '2022-08-01', 8500.00, 2500.00, 3700.00, 800.00, 1500.00, 1.65, 0.50, 1.37),
    (19, '2022-09-01', 8400.00, 2450.00, 3650.00, 775.00, 1450.00, 1.64, 0.49, 1.36),
    (19, '2022-10-01', 8300.00, 2400.00, 3600.00, 750.00, 1400.00, 1.63, 0.48, 1.35),
    -- Data center 19 - Starhub, 2021
    (19, '2021-08-01', 9000.00, 2700.00, 3900.00, 850.00, 1600.00, 1.72, 0.52, 1.45),
    (19, '2021-09-01', 8900.00, 2650.00, 3850.00, 825.00, 1550.00, 1.71, 0.51, 1.43),
    (19, '2021-10-01', 8800.00, 2600.00, 3800.00, 800.00, 1500.00, 1.70, 0.50, 1.42),

    -- Data center 20 - Starhub, 2024
    (20, '2024-08-01', 6700.00, 2000.00, 3100.00, 600.00, 1000.00, 1.45, 0.42, 1.22),
    (20, '2024-09-01', 6600.00, 1950.00, 3050.00, 575.00, 950.00, 1.44, 0.41, 1.20),
    (20, '2024-10-01', 6500.00, 1900.00, 3000.00, 550.00, 900.00, 1.43, 0.40, 1.18),
    -- Data center 20 - Starhub, 2023
    (20, '2023-08-01', 7400.00, 2100.00, 3200.00, 700.00, 1200.00, 1.52, 0.44, 1.28),
    (20, '2023-09-01', 7300.00, 2050.00, 3150.00, 675.00, 1150.00, 1.51, 0.43, 1.26),
    (20, '2023-10-01', 7200.00, 2000.00, 3100.00, 650.00, 1100.00, 1.50, 0.42, 1.24),
    -- Data center 20 - Starhub, 2022
    (20, '2022-08-01', 8000.00, 2300.00, 3400.00, 750.00, 1300.00, 1.60, 0.47, 1.34),
    (20, '2022-09-01', 7900.00, 2250.00, 3350.00, 725.00, 1250.00, 1.59, 0.46, 1.32),
    (20, '2022-10-01', 7800.00, 2200.00, 3300.00, 700.00, 1200.00, 1.58, 0.45, 1.30),
    -- Data center 20 - Starhub, 2021
    (20, '2021-08-01', 8500.00, 2400.00, 3500.00, 800.00, 1400.00, 1.68, 0.50, 1.37),
    (20, '2021-09-01', 8400.00, 2350.00, 3450.00, 775.00, 1350.00, 1.67, 0.49, 1.35),
    (20, '2021-10-01', 8300.00, 2300.00, 3400.00, 750.00, 1300.00, 1.66, 0.48, 1.34);

-- Insert sample data into data_center_carbon_emissions
INSERT INTO data_center_carbon_emissions (data_center_id, date, co2_emissions_tons, renewable_energy_percentage)
VALUES

    -- 2024 (least carbon emissions, highest renewable energy percentage)
    (1, '2021-08-01', 4500.00, 50.0),
    (1, '2021-09-01', 4450.00, 51.0),
    (1, '2021-10-01', 1400.00, 52.0),
    (1, '2021-10-05', 2385.00, 52.5),
    (1, '2021-10-10', 2265.00, 53.0),
    (1, '2021-10-15', 2350.00, 53.5),
    (1, '2021-10-20', 2040.00, 54.0),
    (1, '2021-10-25', 1315.00, 54.5),
    (1, '2021-10-30', 2200.00, 55.0),
    -- 2023
    (1, '2022-08-01', 5400.00, 45.0),
    (1, '2022-09-01', 5450.00, 46.0),
    (1, '2022-10-01', 5300.00, 47.0),
    (1, '2022-10-05', 5925.00, 46.5),
    -- 2022
    (1, '2023-08-01', 5400.00, 40.0),
    (1, '2023-09-01', 5350.00, 41.0),
    (1, '2023-10-01', 5300.00, 42.0),
    (1, '2023-10-05', 5325.00, 41.5),
    -- 2021 (highest carbon emissions, lowest renewable energy percentage)
    (1, '2024-08-01', 5300.00, 35.0),
    (1, '2024-09-01', 5150.00, 36.0),
    (1, '2024-10-01', 4005.00, 37.0),
    (1, '2024-10-05', 5025.00, 36.5),

    -- Data center 2 - Singtel, 2024 (most efficient, lowest emissions, highest renewable percentage)
    (2, '2024-08-01', 500.00, 30.0),
    (2, '2024-09-01', 520.00, 31.0),
    (2, '2024-10-01', 530.00, 32.0),
    -- Data center 2 - Singtel, 2023
    (2, '2023-08-01', 550.00, 28.0),
    (2, '2023-09-01', 570.00, 29.0),
    (2, '2023-10-01', 590.00, 29.5),
    -- Data center 2 - Singtel, 2022
    (2, '2022-08-01', 620.00, 25.0),
    (2, '2022-09-01', 640.00, 26.0),
    (2, '2022-10-01', 660.00, 26.5),
    -- Data center 2 - Singtel, 2021 (least efficient, highest emissions, lowest renewable percentage)
    (2, '2021-08-01', 700.00, 20.0),
    (2, '2021-09-01', 720.00, 21.0),
    (2, '2021-10-01', 740.00, 22.0),


    -- Data center 3 - Singtel
    (3, '2024-08-01', 3000.00, 25.0),
    (3, '2024-09-01', 3050.00, 26.0),
    (3, '2024-10-01', 3100.00, 27.0),
    -- Data center 3 - Singtel, 2023
    (3, '2023-08-01', 3200.00, 22.0),
    (3, '2023-09-01', 3250.00, 23.0),
    (3, '2023-10-01', 3300.00, 24.0),
    -- Data center 3 - Singtel, 2022
    (3, '2022-08-01', 3400.00, 19.0),
    (3, '2022-09-01', 3450.00, 20.0),
    (3, '2022-10-01', 3500.00, 21.0),
    -- Data center 3 - Singtel, 2021
    (3, '2021-08-01', 3600.00, 15.0),
    (3, '2021-09-01', 3650.00, 16.0),
    (3, '2021-10-01', 3700.00, 17.0),

    -- Data center 4 - Singtel, 2024
    (4, '2024-08-01', 400.00, 24.0),
    (4, '2024-09-01', 390.00, 25.0),
    (4, '2024-10-01', 380.00, 26.0),
    -- Data center 4 - Singtel, 2023
    (4, '2023-08-01', 420.00, 22.0),
    (4, '2023-09-01', 410.00, 23.0),
    (4, '2023-10-01', 400.00, 24.0),
    -- Data center 4 - Singtel, 2022
    (4, '2022-08-01', 440.00, 20.0),
    (4, '2022-09-01', 430.00, 21.0),
    (4, '2022-10-01', 420.00, 22.0),
    -- Data center 4 - Singtel, 2021
    (4, '2021-08-01', 460.00, 18.0),
    (4, '2021-09-01', 450.00, 19.0),
    (4, '2021-10-01', 440.00, 20.0),

    -- Data center 5 - Singtel, 2024
    (5, '2024-08-01', 360.00, 26.0),
    (5, '2024-09-01', 355.00, 27.0),
    (5, '2024-10-01', 350.00, 28.0),
    -- Data center 5 - Singtel, 2023
    (5, '2023-08-01', 380.00, 24.0),
    (5, '2023-09-01', 375.00, 25.0),
    (5, '2023-10-01', 370.00, 26.0),
    -- Data center 5 - Singtel, 2022
    (5, '2022-08-01', 400.00, 22.0),
    (5, '2022-09-01', 395.00, 23.0),
    (5, '2022-10-01', 390.00, 24.0),
    -- Data center 5 - Singtel, 2021
    (5, '2021-08-01', 420.00, 20.0),
    (5, '2021-09-01', 415.00, 21.0),
    (5, '2021-10-01', 410.00, 22.0),

    -- Data center 6 - M1
    -- Data center 6 - M1, 2024
    (6, '2024-08-01', 450.00, 22.0),
    (6, '2024-09-01', 440.00, 23.0),
    (6, '2024-10-01', 430.00, 24.0),
    -- Data center 6 - M1, 2023
    (6, '2023-08-01', 475.00, 20.0),
    (6, '2023-09-01', 465.00, 21.0),
    (6, '2023-10-01', 460.00, 21.5),
    -- Data center 6 - M1, 2022
    (6, '2022-08-01', 490.00, 18.5),
    (6, '2022-09-01', 485.00, 19.0),
    (6, '2022-10-01', 480.00, 19.5),
    -- Data center 6 - M1, 2021
    (6, '2021-08-01', 510.00, 15.0),
    (6, '2021-09-01', 505.00, 15.5),
    (6, '2021-10-01', 500.00, 16.0),

    -- Data center 7 - M1, 2024
    (7, '2024-08-01', 420.00, 28),
    (7, '2024-09-01', 415.00, 29),
    (7, '2024-10-01', 410.00, 30),
    -- Data center 7 - M1, 2023
    (7, '2023-08-01', 440.00, 26),
    (7, '2023-09-01', 435.00, 27),
    (7, '2023-10-01', 430.00, 28),
    -- Data center 7 - M1, 2022
    (7, '2022-08-01', 460.00, 24),
    (7, '2022-09-01', 455.00, 25),
    (7, '2022-10-01', 450.00, 26),
    -- Data center 7 - M1, 2021
    (7, '2021-08-01', 480.00, 22),
    (7, '2021-09-01', 475.00, 23),
    (7, '2021-10-01', 470.00, 24),

    -- Data center 8 - M1, 2024
    (8, '2024-08-01', 450.00, 30.0),
    (8, '2024-09-01', 440.00, 32.0),
    (8, '2024-10-01', 430.00, 33.0),
    -- Data center 8 - M1, 2023
    (8, '2023-08-01', 470.00, 28.0),
    (8, '2023-09-01', 460.00, 29.0),
    (8, '2023-10-01', 450.00, 30.0),
    -- Data center 8 - M1, 2022
    (8, '2022-08-01', 490.00, 26.0),
    (8, '2022-09-01', 480.00, 27.0),
    (8, '2022-10-01', 470.00, 28.0),
    -- Data center 8 - M1, 2021
    (8, '2021-08-01', 510.00, 24.0),
    (8, '2021-09-01', 500.00, 25.0),
    (8, '2021-10-01', 490.00, 26.0),

    -- Data center 9 - M1, 2024
    (9, '2024-08-01', 3000.00, 15.0),
    (9, '2024-09-01', 2900.00, 15.5),
    (9, '2024-10-01', 2800.00, 16.0),
    -- Data center 9 - M1, 2023
    (9, '2023-08-01', 3200.00, 14.0),
    (9, '2023-09-01', 3100.00, 14.5),
    (9, '2023-10-01', 3000.00, 15.0),
    -- Data center 9 - M1, 2022
    (9, '2022-08-01', 3400.00, 13.0),
    (9, '2022-09-01', 3300.00, 13.5),
    (9, '2022-10-01', 3200.00, 14.0),
    -- Data center 9 - M1, 2021
    (9, '2021-08-01', 3600.00, 12.0),
    (9, '2021-09-01', 3500.00, 12.5),
    (9, '2021-10-01', 3400.00, 13.0),

    -- Data center 10 - M1, 2024
    (10, '2024-08-01', 420.00, 23.0),
    (10, '2024-09-01', 415.00, 23.5),
    (10, '2024-10-01', 410.00, 24.0),
    -- Data center 10 - M1, 2023
    (10, '2023-08-01', 440.00, 22.0),
    (10, '2023-09-01', 435.00, 22.5),
    (10, '2023-10-01', 430.00, 23.0),
    -- Data center 10 - M1, 2022
    (10, '2022-08-01', 460.00, 21.0),
    (10, '2022-09-01', 455.00, 21.5),
    (10, '2022-10-01', 450.00, 22.0),
    -- Data center 10 - M1, 2021
    (10, '2021-08-01', 480.00, 20.0),
    (10, '2021-09-01', 475.00, 20.5),
    (10, '2021-10-01', 470.00, 21.0),

    -- Data center 11 - Simba, 2024
    (11, '2024-08-01', 3200.00, 18.0),
    (11, '2024-09-01', 3180.00, 18.5),
    (11, '2024-10-01', 3150.00, 19.0),
    -- Data center 11 - Simba, 2023
    (11, '2023-08-01', 3500.00, 16.5),
    (11, '2023-09-01', 3480.00, 17.0),
    (11, '2023-10-01', 3450.00, 17.5),
    -- Data center 11 - Simba, 2022
    (11, '2022-08-01', 3700.00, 15.0),
    (11, '2022-09-01', 3680.00, 15.5),
    (11, '2022-10-01', 3650.00, 16.0),
    -- Data center 11 - Simba, 2021
    (11, '2021-08-01', 4000.00, 14.0),
    (11, '2021-09-01', 3980.00, 14.5),
    (11, '2021-10-01', 3950.00, 15.0),

    -- Data center 12 - Simba, 2024
    (12, '2024-08-01', 850.00, 18),
    (12, '2024-09-01', 860.00, 19),
    (12, '2024-10-01', 875.00, 20),
    -- Data center 12 - Simba, 2023
    (12, '2023-08-01', 900.00, 17),
    (12, '2023-09-01', 910.00, 18),
    (12, '2023-10-01', 920.00, 19),
    -- Data center 12 - Simba, 2022
    (12, '2022-08-01', 950.00, 16),
    (12, '2022-09-01', 960.00, 17),
    (12, '2022-10-01', 970.00, 18),
    -- Data center 12 - Simba, 2021
    (12, '2021-08-01', 990.00, 15),
    (12, '2021-09-01', 1000.00, 16),
    (12, '2021-10-01', 1010.00, 17),

    -- Data center 13 - Simba, 2024
    (13, '2024-08-01', 2800.00, 18.0),
    (13, '2024-09-01', 2850.00, 19.5),
    (13, '2024-10-01', 2900.00, 20.0),
    -- Data center 13 - Simba, 2023
    (13, '2023-08-01', 2750.00, 17.0),
    (13, '2023-09-01', 2780.00, 18.5),
    (13, '2023-10-01', 2820.00, 19.0),
    -- Data center 13 - Simba, 2022
    (13, '2022-08-01', 2700.00, 16.0),
    (13, '2022-09-01', 2725.00, 17.0),
    (13, '2022-10-01', 2750.00, 17.5),
    -- Data center 13 - Simba, 2021
    (13, '2021-08-01', 2650.00, 15.5),
    (13, '2021-09-01', 2675.00, 16.0),
    (13, '2021-10-01', 2700.00, 16.5),

    -- Data center 14 - Simba, 2024
    (14, '2024-08-01', 300.00, 18.0),
    (14, '2024-09-01', 310.00, 18.5),
    (14, '2024-10-01', 320.00, 19.0),
    -- Data center 14 - Simba, 2023
    (14, '2023-08-01', 330.00, 17.5),
    (14, '2023-09-01', 340.00, 18.0),
    (14, '2023-10-01', 350.00, 18.5),
    -- Data center 14 - Simba, 2022
    (14, '2022-08-01', 360.00, 16.5),
    (14, '2022-09-01', 370.00, 17.0),
    (14, '2022-10-01', 380.00, 17.5),
    -- Data center 14 - Simba, 2021
    (14, '2021-08-01', 390.00, 15.0),
    (14, '2021-09-01', 400.00, 15.5),
    (14, '2021-10-01', 410.00, 16.0),

   -- Data center 15 - Simba, 2024
    (15, '2024-08-01', 1050.00, 28.0),
    (15, '2024-09-01', 1025.00, 29.5),
    (15, '2024-10-01', 1000.00, 31.0),
    -- Data center 15 - Simba, 2023
    (15, '2023-08-01', 1075.00, 26.5),
    (15, '2023-09-01', 1050.00, 28.0),
    (15, '2023-10-01', 1025.00, 29.5),
    -- Data center 15 - Simba, 2022
    (15, '2022-08-01', 1100.00, 25.0),
    (15, '2022-09-01', 1075.00, 26.5),
    (15, '2022-10-01', 1050.00, 28.0),
    -- Data center 15 - Simba, 2021
    (15, '2021-08-01', 1125.00, 23.5),
    (15, '2021-09-01', 1100.00, 25.0),
    (15, '2021-10-01', 1075.00, 26.5),

    -- Data center 16 - Starhub, 2024
    (16, '2024-08-01', 350.00, 22.0),
    (16, '2024-09-01', 340.00, 23.0),
    (16, '2024-10-01', 330.00, 24.0),
    -- Data center 16 - Starhub, 2023
    (16, '2023-08-01', 365.00, 20.0),
    (16, '2023-09-01', 355.00, 21.0),
    (16, '2023-10-01', 345.00, 22.0),
    -- Data center 16 - Starhub, 2022
    (16, '2022-08-01', 380.00, 18.0),
    (16, '2022-09-01', 370.00, 19.0),
    (16, '2022-10-01', 360.00, 20.0),
    -- Data center 16 - Starhub, 2021
    (16, '2021-08-01', 400.00, 16.0),
    (16, '2021-09-01', 390.00, 17.0),
    (16, '2021-10-01', 380.00, 18.0),

    -- Data center 17 - Starhub, 2024
    (17, '2024-08-01', 1200.00, 35.0),
    (17, '2024-09-01', 1150.00, 36.0),
    (17, '2024-10-01', 1100.00, 37.0),
    -- Data center 17 - Starhub, 2023
    (17, '2023-08-01', 1300.00, 33.0),
    (17, '2023-09-01', 1250.00, 34.0),
    (17, '2023-10-01', 1200.00, 35.0),
    -- Data center 17 - Starhub, 2022
    (17, '2022-08-01', 1400.00, 31.0),
    (17, '2022-09-01', 1350.00, 32.0),
    (17, '2022-10-01', 1300.00, 33.0),
    -- Data center 17 - Starhub, 2021
    (17, '2021-08-01', 1500.00, 29.0),
    (17, '2021-09-01', 1450.00, 30.0),
    (17, '2021-10-01', 1400.00, 31.0),

    -- Data center 18 - Starhub, 2024
    (18, '2024-08-01', 900.00, 38.0),
    (18, '2024-09-01', 850.00, 39.0),
    (18, '2024-10-01', 800.00, 40.0),
    -- Data center 18 - Starhub, 2023
    (18, '2023-08-01', 1000.00, 35.0),
    (18, '2023-09-01', 950.00, 36.0),
    (18, '2023-10-01', 900.00, 37.0),
    -- Data center 18 - Starhub, 2022
    (18, '2022-08-01', 1100.00, 32.0),
    (18, '2022-09-01', 1050.00, 33.0),
    (18, '2022-10-01', 1000.00, 34.0),
    -- Data center 18 - Starhub, 2021
    (18, '2021-08-01', 1200.00, 30.0),
    (18, '2021-09-01', 1150.00, 31.0),
    (18, '2021-10-01', 1100.00, 32.0),

    -- Data center 19 - Starhub, 2024
    (19, '2024-08-01', 750.00, 42.0),
    (19, '2024-09-01', 725.00, 43.0),
    (19, '2024-10-01', 700.00, 44.0),
    -- Data center 19 - Starhub, 2023
    (19, '2023-08-01', 850.00, 39.0),
    (19, '2023-09-01', 825.00, 40.0),
    (19, '2023-10-01', 800.00, 41.0),
    -- Data center 19 - Starhub, 2022
    (19, '2022-08-01', 950.00, 35.0),
    (19, '2022-09-01', 925.00, 36.0),
    (19, '2022-10-01', 900.00, 37.0),
    -- Data center 19 - Starhub, 2021
    (19, '2021-08-01', 1050.00, 32.0),
    (19, '2021-09-01', 1025.00, 33.0),
    (19, '2021-10-01', 1000.00, 34.0),

    -- Data center 20 - Starhub, 2024
    (20, '2024-08-01', 650.00, 46.0),
    (20, '2024-09-01', 625.00, 47.0),
    (20, '2024-10-01', 600.00, 48.0),
    -- Data center 20 - Starhub, 2023
    (20, '2023-08-01', 750.00, 43.0),
    (20, '2023-09-01', 725.00, 44.0),
    (20, '2023-10-01', 700.00, 45.0),
    -- Data center 20 - Starhub, 2022
    (20, '2022-08-01', 850.00, 40.0),
    (20, '2022-09-01', 825.00, 41.0),
    (20, '2022-10-01', 800.00, 42.0),
    -- Data center 20 - Starhub, 2021
    (20, '2021-08-01', 950.00, 37.0),
    (20, '2021-09-01', 925.00, 38.0),
    (20, '2021-10-01', 900.00, 39.0);


INSERT INTO company_sustainability_goals (company_id, goal_name, target_value, target_year)
VALUES
    (1, 'CUE (Carbon Usage Effectiveness)', 0.25, 2025),
    (1, 'PUE (Power Usage Effectiveness)', 1.10, 2025),
    (1, 'Renewable Energy Usage', 50.00, 2025),
    (1, 'Water Usage Reduction (WUE)', 0.90, 2025),

    (2, 'CUE (Carbon Usage Effectiveness)', 0.30, 2025),
    (2, 'PUE (Power Usage Effectiveness)', 1.20, 2025),
    (2, 'Renewable Energy Usage', 55.00, 2025),
    (2, 'Water Usage Reduction (WUE)', 0.85, 2025),

    (3, 'CUE (Carbon Usage Effectiveness)', 0.20, 2025),
    (3, 'PUE (Power Usage Effectiveness)', 1.00, 2025),
    (3, 'Renewable Energy Usage', 70.00, 2025),
    (3, 'Water Usage Reduction (WUE)', 0.80, 2025),

    (4, 'CUE (Carbon Usage Effectiveness)', 0.40, 2025),
    (4, 'PUE (Power Usage Effectiveness)', 1.15, 2025),
    (4, 'Renewable Energy Usage', 60.00, 2025),
    (4, 'Water Usage Reduction (WUE)', 0.95, 2025);




    
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

INSERT INTO courses (title, description, points, image_path)
VALUES 
('Introduction to Data Center Sustainability', 
 'Understand the principles of sustainability in data centers. Learn how energy-efficient practices, renewable energy integration, and advanced monitoring systems help reduce carbon footprints while maintaining operational efficiency.', 
 50, './assets/courses/course1.jpg'),
('Advanced Cooling Strategies for Data Centers', 
 'Explore advanced cooling methods to optimize airflow and reduce energy consumption in data centers. This course covers techniques like hot and cold aisle containment, liquid cooling systems, and the role of Computational Fluid Dynamics (CFD) in cooling optimization.', 
 70, './assets/courses/course2.jpg'),
('Energy-Efficient Infrastructure Design', 
 'Dive into the design and implementation of energy-efficient infrastructures for data centers. Learn about efficient server placement, power usage effectiveness (PUE) metrics, and the adoption of renewable energy sources to reduce emissions.', 
 40, './assets/courses/course3.jpg'),
('Monitoring and Optimizing Data Center Energy Usage', 
 'Master the tools and techniques required to monitor and optimize energy consumption in data centers. Learn about real-time monitoring systems, predictive analytics, and strategies to identify inefficiencies and reduce carbon emissions.', 
 60, './assets/courses/course4.jpg'),
('Achieving Carbon Neutrality in Data Centers', 
 'Gain in-depth knowledge of the strategies and technologies involved in achieving carbon neutrality in data centers. This course focuses on renewable energy integration, carbon offset initiatives, and industry best practices for sustainable operations.', 
 80, './assets/courses/course5.jpg');

INSERT INTO lessons (course_id, title, content, duration, position, video_link)
VALUES
-- Lessons for Course 1: Introduction to Data Center Sustainability
(1, 'Understanding Sustainability in Data Centers', 
    'In this lesson, you will learn about the importance of sustainability in data center operations. We will explore how sustainability initiatives contribute to environmental preservation and operational efficiency. By the end of this lesson, you will understand key sustainability concepts and their role in data centers.', 
    '20 min', 1, 'https://www.youtube.com/watch?v=XORuHW3CxAg'),
(1, 'Energy Efficiency Basics', 
    'In this lesson, you will learn the fundamentals of energy efficiency and why it is critical for data centers. Topics include strategies to minimize energy waste and real-world examples of successful energy efficiency implementations.', 
    '25 min', 2, 'https://www.youtube.com/watch?v=xGSdf2uLtlo'),
(1, 'Renewable Energy Integration', 
    'In this lesson, you will learn how to integrate renewable energy sources into data center operations. We will discuss the types of renewable energy available and the benefits they bring, along with challenges and solutions for implementation.', 
    '30 min', 3, 'https://www.youtube.com/watch?v=UFK4hqeRhIc'),
(1, 'Monitoring Sustainability Efforts', 
    'In this lesson, you will learn how to monitor and track the success of sustainability initiatives in data centers. Key topics include metrics for measuring progress and tools to ensure sustainability efforts are maintained over time.', 
    '20 min', 4, 'https://www.youtube.com/watch?v=VaZo_xua8uM'),
(1, 'Future of Sustainable Data Centers', 
    'In this lesson, you will learn about the latest trends and emerging technologies that are shaping the future of sustainable data centers. Topics include advancements in energy storage, AI-driven efficiency optimizations, and futuristic design principles.', 
    '25 min', 5, 'https://www.youtube.com/watch?v=fUIvY_OI3hE'),

-- Lessons for Course 2: Advanced Cooling Strategies for Data Centers
(2, 'Introduction to Cooling Challenges', 
    'In this lesson, you will learn about the common cooling challenges faced by data centers and their impact on energy consumption. You will also understand why efficient cooling is essential for sustainability and operational reliability.', 
    '20 min', 1, 'https://www.youtube.com/watch?v=uDG5QX7QEnk'),
(2, 'Hot and Cold Aisle Containment', 
    'In this lesson, you will learn the principles of hot and cold aisle containment and how this strategy enhances cooling efficiency in data centers. We will cover design considerations and practical implementation techniques.', 
    '25 min', 2, 'https://www.youtube.com/watch?v=2BfNGZiO4GU'),
(2, 'Liquid Cooling Systems', 
    'In this lesson, you will learn about liquid cooling systems and their role in achieving high-performance cooling while reducing energy use. Topics include system design, implementation, and examples of successful deployments.', 
    '30 min', 3, 'https://www.youtube.com/watch?v=0BCXySecMoI'),
(2, 'Using Computational Fluid Dynamics (CFD)', 
    'In this lesson, you will learn how Computational Fluid Dynamics (CFD) simulations are used to optimize airflow and cooling in data centers. We will discuss the basics of CFD, its benefits, and how to interpret simulation results.', 
    '20 min', 4, 'https://www.youtube.com/watch?v=aPsuhKNcQmw'),
(2, 'Best Practices for Cooling Optimization', 
    'In this lesson, you will learn about the best practices and techniques for maintaining efficient cooling systems in data centers. We will explore maintenance strategies, energy-saving tips, and emerging trends in cooling technology.', 
    '25 min', 5, 'https://www.youtube.com/watch?v=Zr5eL4Hqvds'),

-- Lessons for Course 3: Energy-Efficient Infrastructure Design
(3, 'Introduction to Energy-Efficient Design', 
    'In this lesson, you will learn the fundamentals of designing energy-efficient infrastructures for data centers. Topics include the key principles of efficiency, design frameworks, and practical applications.', 
    '20 min', 1, 'https://www.youtube.com/watch?v=wIxe6C_f4Yw'),
(3, 'Optimizing Server Placement', 
    'In this lesson, you will learn about optimizing server placement to enhance energy efficiency. We will discuss strategies to reduce cooling requirements and improve airflow, with real-world examples of effective layouts.', 
    '25 min', 2, 'https://www.youtube.com/watch?v=eAHDmkfcq-k'),
(3, 'Understanding PUE (Power Usage Effectiveness)', 
    'In this lesson, you will learn how to calculate and improve Power Usage Effectiveness (PUE) in data centers. We will explore the importance of PUE as a key metric and provide practical tips for its optimization.', 
    '30 min', 3, 'https://www.youtube.com/watch?v=0mQAiZcA5K4'),
(3, 'Renewable Energy Solutions', 
    'In this lesson, you will learn about the benefits and challenges of incorporating renewable energy solutions into data center design. We will discuss solar, wind, and other renewable sources, along with their potential impact.', 
    '20 min', 4, 'https://www.youtube.com/watch?v=OPoNDxByOxc'),
(3, 'Future Trends in Data Center Design', 
    'In this lesson, you will learn about the future trends shaping energy-efficient data center designs. Topics include innovations in hardware, sustainable construction materials, and AI-driven optimization techniques.', 
    '25 min', 5, 'https://www.youtube.com/watch?v=Mt4Z63nd84g'),

-- Lessons for Course 4: Monitoring and Optimizing Data Center Energy Usage
(4, 'Introduction to Energy Monitoring', 
    'In this lesson, you will learn why monitoring energy usage is essential for data center efficiency and sustainability. We will cover the basics of energy monitoring and its benefits for long-term operational success.', 
    '20 min', 1, 'https://www.youtube.com/watch?v=uDG5QX7QEnk'),
(4, 'Tools for Energy Monitoring', 
    'In this lesson, you will learn about the tools and systems available for real-time energy monitoring in data centers. Topics include selecting the right tools and interpreting monitoring data effectively.', 
    '25 min', 2, 'https://www.youtube.com/watch?v=2BfNGZiO4GU'),
(4, 'Identifying Energy Inefficiencies', 
    'In this lesson, you will learn techniques to identify and address energy inefficiencies in data centers. We will explore common inefficiency sources and actionable solutions for improvement.', 
    '30 min', 3, 'https://www.youtube.com/watch?v=0BCXySecMoI'),
(4, 'Predictive Analytics for Energy Optimization', 
    'In this lesson, you will learn how predictive analytics can enhance energy optimization. We will discuss data modeling, forecasting, and practical examples of predictive technologies.', 
    '20 min', 4, 'https://www.youtube.com/watch?v=aPsuhKNcQmw'),
(4, 'Developing an Energy Optimization Plan', 
    'In this lesson, you will learn how to create a comprehensive energy optimization plan. Topics include setting goals, implementing strategies, and measuring success.', 
    '25 min', 5, 'https://www.youtube.com/watch?v=Zr5eL4Hqvds'),

-- Lessons for Course 5: Achieving Carbon Neutrality in Data Centers
(5, 'Understanding Carbon Neutrality', 
    'In this lesson, you will learn about the concept of carbon neutrality and its importance for data centers. We will cover the environmental benefits and steps required to achieve it.', 
    '20 min', 1, 'https://www.youtube.com/watch?v=1vdoEes-fts'),
(5, 'Carbon Offset Initiatives', 
    'In this lesson, you will learn about various carbon offset initiatives that can be implemented to reduce your data center''s carbon footprint. We will discuss practical examples and their impact.', 
    '25 min', 2, 'https://www.youtube.com/watch?v=paFUg1nN7sQ'),
(5, 'Renewable Energy Integration for Carbon Neutrality', 
    'In this lesson, you will learn about the role of renewable energy in achieving carbon neutrality. We will explore strategies to integrate solar, wind, and other renewable energy sources.', 
    '30 min', 3, 'https://www.youtube.com/watch?v=UFK4hqeRhIc'),
(5, 'Measuring Carbon Footprints', 
    'In this lesson, you will learn how to measure and track your data center''s carbon footprint. Topics include carbon accounting methods, tools, and best practices.', 
    '20 min', 4, 'https://www.youtube.com/watch?v=0mQAiZcA5K4'),
(5, 'Creating a Carbon Neutral Strategy', 
    'In this lesson, you will learn the steps required to develop a comprehensive strategy for achieving carbon neutrality in your data center operations. We will discuss goal setting, stakeholder collaboration, and monitoring progress.', 
    '25 min', 5, 'https://www.youtube.com/watch?v=wIxe6C_f4Yw');

 
INSERT INTO key_concepts (lesson_id, title, description)
VALUES
-- Key Concepts for Lesson 1: Introduction to Data Center Sustainability
(1, 'Definition of Sustainability', 'Learn the principles of sustainability in data centers and its environmental impact.'),
(1, 'Benefits of Sustainable Practices', 'Explore the operational and cost benefits of adopting sustainable practices.'),
(1, 'Key Drivers', 'Understand the role of regulations, corporate responsibility, and technology advancements.'),

(2, 'Energy Consumption', 'Discover how data centers consume energy and areas to reduce waste.'),
(2, 'Efficiency Metrics', 'Learn about PUE (Power Usage Effectiveness) as a measure of energy efficiency.'),
(2, 'Strategies for Energy Reduction', 'Explore practices like server optimization and efficient cooling systems.'),

(3, 'Types of Renewable Energy', 'Understand solar, wind, and geothermal energy sources for data centers.'),
(3, 'Integration Challenges', 'Learn about grid dependency and energy storage solutions.'),
(3, 'Environmental Benefits', 'Explore how renewables reduce carbon footprints.'),

(4, 'Importance of Monitoring', 'Track energy usage to measure sustainability progress.'),
(4, 'Tools for Monitoring', 'Learn about power meters and real-time dashboards.'),
(4, 'Data Analytics', 'Use analytics to identify inefficiencies and set improvement goals.'),

(5, 'Emerging Technologies', 'Discover the potential of AI and ML in sustainability.'),
(5, 'Carbon Neutral Data Centers', 'Understand strategies for achieving carbon neutrality.'),
(5, 'Global Trends', 'Explore innovations like modular and edge data centers.'),

-- Key Concepts for Lesson 2: Advanced Cooling Strategies for Data Centers
(6, 'Cooling Requirements', 'Learn why cooling is critical in data centers.'),
(6, 'Energy Costs', 'Understand the impact of inefficient cooling on energy consumption.'),
(6, 'Common Issues', 'Explore challenges like hotspots and airflow obstructions.'),

(7, 'Aisle Containment Basics', 'Understand how hot and cold aisle containment works.'),
(7, 'Improving Airflow', 'Explore airflow management to increase cooling efficiency.'),
(7, 'Benefits of Containment', 'Reduce energy costs and improve server reliability.'),

(8, 'Liquid Cooling Benefits', 'Learn how liquid cooling achieves higher efficiency than air cooling.'),
(8, 'System Components', 'Explore pipes, pumps, and heat exchangers in liquid cooling.'),
(8, 'Applications', 'Understand its usage in high-performance computing environments.'),

(9, 'Role of CFD', 'Use CFD to simulate airflow in data centers.'),
(9, 'Identifying Issues', 'Discover hotspots and inefficiencies through simulation.'),
(9, 'Optimization', 'Optimize cooling systems based on CFD results.'),

(10, 'Regular Maintenance', 'Ensure cooling systems operate at peak efficiency.'),
(10, 'Airflow Management', 'Use raised floors and vents for better airflow.'),
(10, 'Energy-Efficient Equipment', 'Invest in advanced cooling technologies.'),

-- Key Concepts for Lesson 3: Energy-Efficient Infrastructure Design
(11, 'Design Principles', 'Explore principles for energy-efficient data center infrastructure.'),
(11, 'Energy Goals', 'Set measurable energy efficiency goals.'),
(11, 'Role of Technology', 'Leverage smart technologies for optimization.'),

(12, 'Server Layouts', 'Learn optimal server placements for better airflow.'),
(12, 'Heat Management', 'Reduce hotspots by spreading server loads.'),
(12, 'Density Management', 'Balance server density to optimize cooling.'),

(13, 'PUE Basics', 'Learn how to calculate and improve PUE.'),
(13, 'Energy Balance', 'Understand the balance between IT equipment and facility energy.'),
(13, 'Benchmarking', 'Use PUE for performance comparison.'),

(14, 'Adopting Renewables', 'Explore solar and wind energy options for data centers.'),
(14, 'Energy Storage', 'Understand battery systems for backup and storage.'),
(14, 'Grid Integration', 'Learn to manage renewable energy with traditional grids.'),

(15, 'Modular Data Centers', 'Discover benefits of modular designs for scalability.'),
(15, 'AI and ML', 'Use AI and ML for predictive maintenance and efficiency.'),
(15, 'Sustainable Materials', 'Explore eco-friendly materials in construction.'),

-- Key Concepts for Lesson 4: Monitoring and Optimizing Data Center Energy Usage
(16, 'Energy Monitoring Basics', 'Learn why monitoring is critical for energy management.'),
(16, 'Key Metrics', 'Explore metrics like energy usage and cooling efficiency.'),
(16, 'Monitoring Tools', 'Discover tools like IoT sensors and dashboards.'),

(17, 'Power Meters', 'Measure real-time energy consumption.'),
(17, 'Cooling Monitors', 'Track cooling system performance.'),
(17, 'Energy Dashboards', 'Use dashboards for actionable insights.'),

(18, 'Heat Maps', 'Identify hotspots through energy mapping.'),
(18, 'Anomaly Detection', 'Use analytics to spot inefficiencies.'),
(18, 'Optimization Strategies', 'Implement corrective measures based on findings.'),

(19, 'Predictive Models', 'Use analytics to forecast energy needs.'),
(19, 'Proactive Maintenance', 'Reduce downtime with predictive insights.'),
(19, 'Energy Optimization Goals', 'Set achievable energy reduction targets.'),

(20, 'Plan Framework', 'Create a detailed energy management plan.'),
(20, 'Stakeholder Roles', 'Assign roles for plan execution.'),
(20, 'Continuous Improvement', 'Monitor and update the plan for long-term results.'),

-- Key Concepts for Lesson 5: Achieving Carbon Neutrality in Data Centers
(21, 'Carbon Neutrality Basics', 'Learn the definition and importance of carbon neutrality.'),
(21, 'Impact of Emissions', 'Understand the effects of carbon emissions on the environment.'),
(21, 'Reduction Strategies', 'Explore strategies like energy reduction and carbon offsets.'),

(22, 'What Are Offsets?', 'Learn how offsets reduce net carbon emissions.'),
(22, 'Offset Programs', 'Explore tree-planting and renewable energy initiatives.'),
(22, 'Implementation', 'Integrate offsets into your carbon neutrality strategy.'),

(23, 'Renewable Energy Benefits', 'Understand how renewables reduce carbon emissions.'),
(23, 'Grid Independence', 'Learn to minimize reliance on traditional energy grids.'),
(23, 'Challenges and Solutions', 'Address barriers to renewable energy adoption.'),

(24, 'Carbon Footprint Basics', 'Learn how to calculate your data center''s carbon footprint.'),
(24, 'Emission Sources', 'Identify primary sources of carbon emissions.'),
(24, 'Tracking Progress', 'Use tools to monitor emission reductions over time.'),

(25, 'Strategy Framework', 'Develop a step-by-step plan for carbon neutrality.'),
(25, 'Stakeholder Involvement', 'Ensure all teams contribute to the strategy.'),
(25, 'Sustainability Metrics', 'Use metrics to measure and achieve goals.');

-- Questions for Lesson 1: Understanding Sustainability in Data Centers
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(1, 'What is the primary benefit of sustainability in data centers?', 'Reduced operational costs', 'Lower carbon emissions', 'Increased uptime', 'Faster network speeds', 'B'),
(1, 'Which factor contributes most to a data centers carbon footprint?', 'Cooling systems', 'Server placement', 'Employee behavior', 'Lighting systems', 'A'),
(1, 'What is the purpose of renewable energy in data centers?', 'Reduce energy costs', 'Lower carbon emissions', 'Increase efficiency', 'Improve reliability', 'B'),
(1, 'Which sustainability practice involves energy-efficient hardware?', 'Recycling', 'Server virtualization', 'Reducing lighting', 'Using hybrid cooling', 'B'),
(1, 'What is the role of monitoring systems in sustainability?', 'Reducing costs', 'Improving energy awareness', 'Enhancing cooling speed', 'Preventing outages', 'B');

-- Questions for Lesson 2: Advanced Cooling Strategies for Data Centers
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(2, 'What is the purpose of hot and cold aisle containment?', 'Improve server uptime', 'Enhance airflow management', 'Reduce server density', 'Lower lighting costs', 'B'),
(2, 'Which cooling method is most energy-efficient for high-performance data centers?', 'Air cooling', 'Liquid cooling', 'Mechanical fans', 'Open vents', 'B'),
(2, 'What is the primary function of Computational Fluid Dynamics (CFD)?', 'Improve server reliability', 'Optimize airflow', 'Track power usage', 'Enhance cooling system durability', 'B'),
(2, 'What is a common problem with inefficient cooling systems?', 'Slow network speeds', 'Increased energy consumption', 'Reduced server capacity', 'Frequent downtimes', 'B'),
(2, 'How does raised flooring impact cooling efficiency?', 'Enhances airflow distribution', 'Reduces humidity', 'Improves energy monitoring', 'Prevents server overheating', 'A');

-- Questions for Lesson 3: Energy-Efficient Infrastructure Design
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(3, 'What does PUE (Power Usage Effectiveness) measure?', 'Server performance', 'Energy efficiency', 'Cooling efficiency', 'Airflow effectiveness', 'B'),
(3, 'Which strategy improves energy efficiency in server placement?', 'Randomized placement', 'Clustered placement', 'Hot aisle placement', 'Cold aisle placement', 'D'),
(3, 'What is a major advantage of renewable energy for data centers?', 'Increased server uptime', 'Reduced operational costs', 'Lower carbon footprint', 'Improved cooling speeds', 'C'),
(3, 'How can efficient lighting contribute to sustainability?', 'Reduces carbon emissions', 'Improves server performance', 'Enhances cooling systems', 'Lowers network latency', 'A'),
(3, 'What is a key factor in designing energy-efficient data centers?', 'Random server configurations', 'Predictive energy monitoring', 'Open-air cooling', 'Minimized airflow management', 'B');

-- Questions for Lesson 4: Monitoring and Optimizing Data Center Energy Usage
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(4, 'What is the purpose of real-time energy monitoring?', 'Reduce server capacity', 'Identify inefficiencies', 'Improve cooling speed', 'Increase uptime', 'B'),
(4, 'Which tool is commonly used for energy audits?', 'Power meters', 'Cooling fans', 'Airflow blockers', 'Server optimizers', 'A'),
(4, 'What is predictive analytics used for in data centers?', 'Prevent overheating', 'Predict future energy usage', 'Optimize server placement', 'Enhance airflow systems', 'B'),
(4, 'Which strategy helps reduce energy consumption?', 'Overcooling servers', 'Improving airflow management', 'Using mechanical cooling only', 'Increasing energy input', 'B'),
(4, 'What is the role of machine learning in energy optimization?', 'Increase cooling speed', 'Reduce costs', 'Predict energy inefficiencies', 'Track uptime metrics', 'C');

-- Questions for Lesson 5: Achieving Carbon Neutrality in Data Centers
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(5, 'What is the definition of carbon neutrality?', 'Zero energy usage', 'Offsetting all carbon emissions', 'Using renewable energy only', 'Eliminating cooling systems', 'B'),
(5, 'How can data centers offset carbon emissions?', 'Install more servers', 'Use renewable energy', 'Reduce airflow', 'Increase fan speeds', 'B'),
(5, 'What is a common method to measure carbon footprints?', 'Server uptime analysis', 'Carbon calculators', 'Cooling efficiency audits', 'Lighting usage reports', 'B'),
(5, 'Which renewable energy source is commonly used in data centers?', 'Wind energy', 'Geothermal energy', 'Solar energy', 'Hydropower', 'C'),
(5, 'What is the first step in creating a carbon neutrality strategy?', 'Improve server speeds', 'Conduct a carbon audit', 'Upgrade cooling systems', 'Increase server capacity', 'B');

-- Questions for Lesson 6
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(6, 'What is a common cooling challenge faced by data centers?', 'Overheating servers', 'Excessive power usage', 'Improper storage', 'Network downtime', 'A'),
(6, 'Why is efficient cooling essential for data centers?', 'It improves employee comfort', 'It reduces operational costs and energy usage', 'It enhances network speed', 'It prevents hardware upgrades', 'B'),
(6, 'What percentage of energy usage can cooling account for in data centers?', '10%', '20%', '30%', '50%', 'C'),
(6, 'Which of the following is a sign of poor cooling in a data center?', 'Increased server lifespan', 'Frequent hardware failures', 'Reduced power usage', 'Lower operating costs', 'B'),
(6, 'What is the primary purpose of cooling systems in data centers?', 'Improving network speed', 'Maintaining optimal temperatures for hardware', 'Enhancing user experience', 'Reducing server density', 'B');

-- Questions for Lesson 7
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(7, 'What is the principle behind hot and cold aisle containment?', 'Separating hot and cold airflows', 'Combining hot and cold airflows', 'Using water cooling', 'Eliminating airflow entirely', 'A'),
(7, 'How does hot aisle containment improve cooling efficiency?', 'By recycling air', 'By preventing mixing of hot and cold air', 'By increasing air circulation', 'By lowering humidity', 'B'),
(7, 'Which of the following is a key consideration for implementing aisle containment?', 'Type of racks used', 'Server software versions', 'Network bandwidth', 'Power supply location', 'A'),
(7, 'What is a common material used for aisle containment?', 'Plastic curtains', 'Metal sheets', 'Fiber glass', 'Rubber seals', 'A'),
(7, 'What is the main goal of aisle containment?', 'Reducing cooling costs', 'Increasing server speed', 'Improving storage capacity', 'Enhancing power supply', 'A');

-- Questions for Lesson 8
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(8, 'What is the primary advantage of liquid cooling systems?', 'Cost reduction', 'High-performance cooling with less energy use', 'Ease of installation', 'Compatibility with all hardware', 'B'),
(8, 'What liquid is most commonly used in data center cooling?', 'Distilled water', 'Oil', 'Ethanol', 'Ammonia', 'A'),
(8, 'Which of the following is a drawback of liquid cooling systems?', 'High installation cost', 'Low cooling efficiency', 'Increased power consumption', 'Reduced hardware lifespan', 'A'),
(8, 'What is one example of a liquid cooling method?', 'Immersion cooling', 'Airflow cooling', 'Evaporation cooling', 'Conduction cooling', 'A'),
(8, 'What factor must be considered when designing liquid cooling systems?', 'Network latency', 'Server density', 'Liquid viscosity', 'Rack dimensions', 'C');

-- Questions for Lesson 9
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(9, 'What is the primary benefit of Computational Fluid Dynamics (CFD) in data centers?', 'Optimizing airflow', 'Increasing storage capacity', 'Improving power supply', 'Enhancing software performance', 'A'),
(9, 'What does CFD primarily simulate?', 'Liquid flow', 'Airflow and cooling efficiency', 'Network traffic', 'Energy distribution', 'B'),
(9, 'Which factor is essential for accurate CFD simulations?', 'Server operating system', 'Rack design and layout', 'Network bandwidth', 'Backup power supply', 'B'),
(9, 'What tool is commonly used for CFD simulations?', 'Cooling fans', 'Thermal imaging cameras', 'Specialized software', 'Airflow ducts', 'C'),
(9, 'How often should CFD simulations be performed in a data center?', 'Monthly', 'Annually', 'Before significant design changes', 'Every week', 'C');

-- Questions for Lesson 10
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(10, 'Which of these is a common cooling optimization technique?', 'Reducing server density', 'Using renewable energy', 'Improving aisle containment', 'Installing more power units', 'C'),
(10, 'Why is regular maintenance important for cooling optimization?', 'It increases server speed', 'It reduces hardware costs', 'It ensures consistent cooling efficiency', 'It eliminates downtime', 'C'),
(10, 'What is a key metric for measuring cooling efficiency?', 'Power Usage Effectiveness (PUE)', 'Bandwidth usage', 'Server response time', 'Cooling hardware cost', 'A'),
(10, 'What is the role of sensors in cooling optimization?', 'Detecting hardware issues', 'Monitoring temperature and humidity', 'Improving network bandwidth', 'Identifying storage limitations', 'B'),
(10, 'Which practice improves airflow in data centers?', 'Overloading racks', 'Blocking unused rack spaces', 'Installing larger cooling units', 'Reducing humidity', 'B');

INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(11, 'What is the primary goal of energy-efficient data center design?', 'Reducing server costs', 'Enhancing cooling efficiency', 'Minimizing energy consumption', 'Increasing storage capacity', 'C'),
(11, 'What principle is key to energy-efficient design?', 'Scalability', 'Redundancy', 'Flexibility', 'Efficiency', 'D'),
(11, 'Which element impacts energy efficiency in data centers?', 'Server placement', 'Cooling technology', 'Power management', 'All of the above', 'D'),
(11, 'What is a key benefit of energy-efficient designs?', 'Increased hardware lifespan', 'Reduced cooling requirements', 'Lower operational costs', 'All of the above', 'D'),
(11, 'What is an important first step in energy-efficient design?', 'Reducing server count', 'Assessing energy needs', 'Increasing cooling capacity', 'Installing larger racks', 'B');

-- Questions for Lesson 12
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(12, 'Why is server placement important for energy efficiency?', 'It increases server speed', 'It optimizes airflow and reduces cooling needs', 'It decreases power consumption', 'It simplifies maintenance', 'B'),
(12, 'Which factor should be considered when placing servers?', 'Network bandwidth', 'Airflow patterns', 'Server model', 'Cooling unit size', 'B'),
(12, 'What is the purpose of hot aisle containment?', 'Improving airflow', 'Reducing cooling costs', 'Separating hot and cold airflows', 'All of the above', 'D'),
(12, 'What can improper server placement lead to?', 'Increased hardware lifespan', 'Reduced cooling efficiency', 'Higher energy savings', 'Improved airflow', 'B'),
(12, 'Which tool can assist with server placement planning?', 'Thermal imaging', 'Power meters', 'CFD simulations', 'Humidity sensors', 'C');

-- Questions for Lesson 13
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(13, 'What does PUE stand for?', 'Power Usage Efficiency', 'Power Usage Effectiveness', 'Performance Utilization Effectiveness', 'Performance Usage Efficiency', 'B'),
(13, 'What is considered a good PUE value?', '1.5 or higher', '2.0 or lower', '1.2 or lower', '2.5 or higher', 'C'),
(13, 'What does a high PUE indicate?', 'Energy efficiency', 'Poor energy efficiency', 'High operational costs', 'Reduced cooling requirements', 'B'),
(13, 'How is PUE calculated?', 'Total facility energy divided by IT equipment energy', 'Cooling energy divided by server energy', 'Power supply energy divided by network energy', 'Server energy divided by total energy', 'A'),
(13, 'Which factor can improve PUE?', 'Increasing cooling efficiency', 'Reducing hardware density', 'Using renewable energy', 'All of the above', 'D');

-- Questions for Lesson 14
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(14, 'What is the primary benefit of using renewable energy in data centers?', 'Lower upfront costs', 'Reduced carbon emissions', 'Simpler setup process', 'Increased cooling efficiency', 'B'),
(14, 'Which of the following is an example of renewable energy?', 'Coal', 'Natural gas', 'Solar energy', 'Nuclear energy', 'C'),
(14, 'What is a major challenge in using renewable energy for data centers?', 'Low efficiency', 'High operational costs', 'Intermittent availability', 'Lack of government support', 'C'),
(14, 'What renewable energy source is most commonly integrated into data centers?', 'Wind energy', 'Solar energy', 'Hydropower', 'Geothermal energy', 'B'),
(14, 'What is a common method for storing renewable energy in data centers?', 'Batteries', 'Fuel cells', 'Generators', 'Capacitors', 'A');

-- Questions for Lesson 15: Future Trends in Data Center Design
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(15, 'Which of the following is an emerging trend in data center design?', 'Increased server density', 'AI-driven efficiency optimization', 'Manual cooling techniques', 'Decreasing storage capacity', 'B'),
(15, 'What role does AI play in future data center designs?', 'Improves software reliability', 'Enhances cooling efficiency and energy management', 'Increases server performance', 'Reduces hardware costs', 'B'),
(15, 'What material is being considered for sustainable data center construction?', 'Concrete', 'Sustainable wood', 'Recycled steel', 'All of the above', 'D'),
(15, 'What is the benefit of modular data center designs?', 'Ease of scalability', 'Improved server speed', 'Lower initial investment', 'Simpler cooling techniques', 'A'),
(15, 'What trend is driving future data center efficiency?', 'Using smaller racks', 'Deploying edge computing', 'Reducing server density', 'Decreasing renewable energy usage', 'B');

-- Questions for Lesson 16: Introduction to Energy Monitoring
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(16, 'Why is energy monitoring important for data centers?', 'To improve network speed', 'To track energy usage and improve efficiency', 'To reduce hardware costs', 'To optimize storage capacity', 'B'),
(16, 'What is a common tool used for energy monitoring?', 'Airflow sensors', 'Power meters', 'Liquid coolers', 'Server racks', 'B'),
(16, 'Which of the following can be identified through energy monitoring?', 'Server bandwidth', 'Cooling inefficiencies', 'Data transfer speeds', 'Server storage issues', 'B'),
(16, 'What is the primary goal of energy monitoring?', 'Improving hardware compatibility', 'Optimizing energy efficiency and reducing waste', 'Reducing cooling costs', 'Eliminating downtime', 'B'),
(16, 'What type of data is collected in energy monitoring?', 'Server response times', 'Power consumption data', 'Network latency', 'Storage utilization', 'B');

-- Questions for Lesson 17: Tools for Energy Monitoring
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(17, 'Which tool is commonly used for real-time energy monitoring?', 'Thermal cameras', 'Energy management software', 'Liquid cooling systems', 'Rack sensors', 'B'),
(17, 'What is a key feature of energy monitoring tools?', 'Historical energy usage tracking', 'Improving server bandwidth', 'Reducing rack density', 'Eliminating airflow issues', 'A'),
(17, 'Why are energy monitoring tools essential for sustainability?', 'They automate network tasks', 'They provide insights into energy inefficiencies', 'They simplify rack installations', 'They enhance server performance', 'B'),
(17, 'Which metric is often monitored to optimize energy use?', 'Power Usage Effectiveness (PUE)', 'Server response time', 'Data transfer rates', 'Network latency', 'A'),
(17, 'What is the benefit of using cloud-based energy monitoring tools?', 'Reduced server maintenance', 'Improved scalability and access to analytics', 'Increased cooling costs', 'Simpler hardware upgrades', 'B');

-- Questions for Lesson 18: Identifying Energy Inefficiencies
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(18, 'What is a common sign of energy inefficiency in data centers?', 'Decreased server response times', 'High PUE values', 'Improved cooling efficiency', 'Low energy costs', 'B'),
(18, 'Which of the following is a common cause of energy inefficiency?', 'High server density', 'Proper airflow management', 'Optimal cooling solutions', 'Regular maintenance', 'A'),
(18, 'How can energy inefficiencies be identified?', 'By monitoring energy usage patterns', 'By increasing cooling capacity', 'By reducing storage', 'By upgrading hardware', 'A'),
(18, 'What is a quick solution for improving airflow inefficiencies?', 'Installing thermal sensors', 'Sealing unused rack spaces', 'Increasing server density', 'Reducing humidity', 'B'),
(18, 'Which energy monitoring tool can detect inefficiencies?', 'Thermal imaging', 'Power meters', 'Airflow sensors', 'All of the above', 'D');

-- Questions for Lesson 19: Predictive Analytics for Energy Optimization
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(19, 'What is the primary goal of predictive analytics in energy optimization?', 'Improving server response times', 'Forecasting energy usage and improving efficiency', 'Increasing hardware lifespan', 'Enhancing storage capacity', 'B'),
(19, 'Which technology powers predictive analytics?', 'Blockchain', 'Machine learning', 'Network routing', 'Cooling fans', 'B'),
(19, 'What type of data is used in predictive analytics?', 'Historical energy usage data', 'Network bandwidth', 'Server uptime', 'Storage capacity', 'A'),
(19, 'What is a key benefit of predictive analytics in energy management?', 'Identifying potential inefficiencies before they occur', 'Improving network performance', 'Reducing cooling capacity', 'Simplifying hardware installations', 'A'),
(19, 'Which industry is most likely to benefit from predictive analytics in energy optimization?', 'Data centers', 'Retail', 'Healthcare', 'Education', 'A');

-- Questions for Lesson 20: Developing an Energy Optimization Plan
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(20, 'What is the first step in creating an energy optimization plan?', 'Reducing rack density', 'Assessing current energy usage', 'Upgrading cooling systems', 'Increasing server count', 'B'),
(20, 'Which of the following should be included in an energy optimization plan?', 'Specific energy goals', 'Implementation strategies', 'Monitoring methods', 'All of the above', 'D'),
(20, 'Why is it important to set measurable goals in an energy optimization plan?', 'To reduce server response times', 'To track progress and ensure accountability', 'To lower rack density', 'To improve network bandwidth', 'B'),
(20, 'What is a key challenge in implementing energy optimization strategies?', 'High implementation costs', 'Lack of available tools', 'Increased server density', 'Reduced cooling efficiency', 'A'),
(20, 'How often should an energy optimization plan be reviewed?', 'Weekly', 'Monthly', 'Periodically, based on performance data', 'Annually', 'C');

-- Questions for Lesson 21: Understanding Carbon Neutrality
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(21, 'What does carbon neutrality mean?', 'Eliminating all carbon emissions', 'Balancing emitted carbon with offsetting measures', 'Reducing energy consumption to zero', 'Replacing all fossil fuels with renewable energy', 'B'),
(21, 'What is the main goal of achieving carbon neutrality?', 'Improving cooling efficiency', 'Reducing overall energy usage', 'Eliminating the carbon footprint of operations', 'Increasing server capacity', 'C'),
(21, 'Which activity contributes to carbon emissions in data centers?', 'Using renewable energy', 'Running cooling systems', 'Upgrading hardware', 'Installing racks', 'B'),
(21, 'What is one way data centers can work towards carbon neutrality?', 'Using carbon offsets', 'Increasing rack density', 'Reducing server speeds', 'Eliminating backup power systems', 'A'),
(21, 'What is the primary benefit of achieving carbon neutrality?', 'Reduced cooling costs', 'Improved employee productivity', 'Mitigating climate change', 'Lower storage requirements', 'C');

-- Questions for Lesson 22: Carbon Offset Initiatives
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(22, 'What is a carbon offset?', 'A way to reduce energy consumption directly', 'A method to compensate for emissions by supporting environmental projects', 'A tax imposed on carbon emissions', 'A replacement for renewable energy', 'B'),
(22, 'Which of the following is an example of a carbon offset initiative?', 'Installing additional cooling systems', 'Planting trees to absorb CO2', 'Reducing server count', 'Increasing storage capacity', 'B'),
(22, 'What type of projects are commonly funded by carbon offsets?', 'Software development', 'Renewable energy projects', 'Server maintenance', 'Cooling optimization', 'B'),
(22, 'What is the main challenge in implementing carbon offset initiatives?', 'High energy usage', 'Verification and accountability', 'Increased cooling costs', 'Server performance issues', 'B'),
(22, 'How do carbon offsets help data centers achieve carbon neutrality?', 'By directly reducing emissions', 'By compensating for emissions through external projects', 'By improving server response time', 'By increasing energy consumption', 'B');

-- Questions for Lesson 23: Renewable Energy Integration for Carbon Neutrality
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(23, 'Why is renewable energy important for carbon neutrality?', 'It eliminates emissions from energy production', 'It is cheaper than all other energy sources', 'It requires no maintenance', 'It improves hardware performance', 'A'),
(23, 'Which renewable energy source is most scalable for data centers?', 'Solar power', 'Geothermal energy', 'Nuclear power', 'Hydropower', 'A'),
(23, 'What is a major barrier to renewable energy adoption in data centers?', 'High cooling requirements', 'Intermittent energy availability', 'Increased server density', 'Reduced energy demand', 'B'),
(23, 'What is a Power Purchase Agreement (PPA)?', 'A contract to buy renewable energy', 'A tool for measuring energy usage', 'A method to reduce cooling costs', 'An agreement to upgrade servers', 'A'),
(23, 'How can renewable energy integration reduce operational costs?', 'By increasing server efficiency', 'By reducing dependency on fossil fuels', 'By requiring less cooling', 'By eliminating power outages', 'B');

-- Questions for Lesson 24: Measuring Carbon Footprints
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(24, 'What is the purpose of measuring a carbon footprint?', 'To improve server response time', 'To calculate the environmental impact of operations', 'To enhance cooling efficiency', 'To monitor server utilization', 'B'),
(24, 'Which tool is commonly used to measure carbon footprints?', 'Energy management software', 'Carbon accounting tools', 'Cooling sensors', 'Thermal imaging', 'B'),
(24, 'What is included in a data center''s carbon footprint calculation?', 'Energy consumption', 'Cooling requirements', 'Hardware production impact', 'All of the above', 'D'),
(24, 'Why is it important to track carbon footprints regularly?', 'To monitor server speed', 'To identify areas for emission reduction', 'To calculate cooling requirements', 'To ensure compliance with storage regulations', 'B'),
(24, 'What unit is typically used to express carbon footprints?', 'Kilowatt-hours', 'Tons of CO2 equivalent (CO2e)', 'Gigabytes', 'Degrees Celsius', 'B');

-- Questions for Lesson 25: Creating a Carbon Neutral Strategy
INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(25, 'What is the first step in creating a carbon neutral strategy?', 'Reducing server density', 'Assessing the current carbon footprint', 'Increasing cooling capacity', 'Deploying new hardware', 'B'),
(25, 'Which of the following is a key element of a carbon neutral strategy?', 'Setting measurable goals', 'Eliminating cooling systems', 'Increasing server speeds', 'Decreasing network bandwidth', 'A'),
(25, 'What is a major challenge in achieving carbon neutrality?', 'Lack of renewable energy sources', 'High operational costs', 'Difficulty in measuring emissions accurately', 'All of the above', 'D'),
(25, 'Which stakeholders should be involved in a carbon neutral strategy?', 'Only IT staff', 'Only management', 'All stakeholders including employees, customers, and vendors', 'Only external consultants', 'C'),
(25, 'How often should a carbon neutral strategy be reviewed and updated?', 'Once every 5 years', 'Only when emissions increase', 'Periodically, based on progress and new developments', 'Every month', 'C');


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

    // Insert Cell Tower Consumption data
    await sql.query(cellTowerConsumptionData.lightSQL);
    console.log("Cell Tower Consumption data inserted successfully");
    
    
    // Close the connection
    await sql.close();
    console.log("Database connection closed");
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

seedDatabase();