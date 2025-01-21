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
    user_id INT PRIMARY KEY,
    total_points INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create table for activity points 
CREATE TABLE activity_points (
    activity_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT,
    activity_type VARCHAR(255), 
    points_awarded INT,
    datetime DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES activity_feed(post_id)
);

CREATE TABLE rewards_catalog (
    reward_id INT IDENTITY(1,1) PRIMARY KEY,
    reward_image VARCHAR(255),
    reward_name VARCHAR(255) NOT NULL,
    reward_description VARCHAR(255),
    points_required INT NOT NULL
);

-- Create table for reward history
CREATE TABLE reward_history (
    redemption_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    reward_id INT NOT NULL,
    points_spent INT NOT NULL,
    redemption_date DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reward_id) REFERENCES rewards_catalog(reward_id)
);

-- Create table for Leaderboard
CREATE TABLE leaderboard (
    user_id INT NOT NULL,
    distance_cycled_km DECIMAL(10, 2) DEFAULT 0,
    number_of_rides INT DEFAULT 0,
    time_travelled_hours DECIMAL(10, 2) DEFAULT 0,
    trees_planted INT DEFAULT 0,
    month INT NOT NULL, -- Tracks the month of the leaderboard entry
    year INT NOT NULL, -- Tracks the year of the leaderboard entry
    PRIMARY KEY (user_id, month, year),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE strava_tokens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    strava_athlete_id BIGINT NOT NULL UNIQUE,
    access_token VARCHAR(512) NOT NULL,
    refresh_token VARCHAR(512) NOT NULL,
    token_expiry DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
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
    data_center_id INT NULL, -- Directly links recyclables to a data center
    created_at DATETIME DEFAULT GETDATE(),
    image_path VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (data_center_id) REFERENCES data_centers(id) -- New foreign key to data_centers
);

-- Create table for Employee access
CREATE TABLE employee_access (
    user_id INT REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    access_level INT NOT NULL,
    company_id INT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id),
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
    duration VARCHAR(255) NOT NULL,   -- Estimated duration of the lesson (e.g., "2 hours")
    position INT NOT NULL,            -- Order of the lesson in the course
    video_link VARCHAR(2083),         -- Optional: Video link for the lesson
    FOREIGN KEY (course_id) REFERENCES courses(id) -- Links lesson to the associated course
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
    ('Dominic Lee', 'dominic_lee@starhub.com', 'password123', 4, 'NPC', 'default.png'),

    -- Singtel users
    ('Eve Koh', 'eve.koh@singtel.com', 'password123', 1, 'NPC', 'default.png'),
    ('Francis Wong', 'francis.wong@singtel.com', 'password123', 1, 'NPC', 'default.png'),
    ('Gina Lim', 'gina.lim@singtel.com', 'password123', 1, 'NPC', 'default.png'),
    ('Henry Tan', 'henry.tan@singtel.com', 'password123', 1, 'NPC', 'default.png'),
    ('Ivy Chua', 'ivy.chua@singtel.com', 'password123', 1, 'NPC', 'default.png'),

    -- M1 users
    ('Olivia Tan', 'olivia.tan@m1.com.sg', 'password123', 2, 'NPC', 'default.png'),
    ('Patrick Goh', 'patrick.goh@m1.com.sg', 'password123', 2, 'NPC', 'default.png'),
    ('Queenie Wong', 'queenie.wong@m1.com.sg', 'password123', 2, 'NPC', 'default.png'),
    ('Ryan Teo', 'ryan.teo@m1.com.sg', 'password123', 2, 'NPC', 'default.png'),
    ('Sarah Chan', 'sarah.chan@m1.com.sg', 'password123', 2, 'NPC', 'default.png'),

    -- Simba users
    ('Yvonne Goh', 'yvonne.goh@simba.sg', 'password123', 3, 'NPC', 'default.png'),
    ('Zachary Lee', 'zachary.lee@simba.sg', 'password123', 3, 'NPC', 'default.png'),
    ('Aaron Tan', 'aaron.tan@simba.sg', 'password123', 3, 'NPC', 'default.png'),
    ('Brianna Ho', 'brianna.ho@simba.sg', 'password123', 3, 'NPC', 'default.png'),
    ('Clement Ong', 'clement.ong@simba.sg', 'password123', 3, 'NPC', 'default.png'),

    -- StarHub users
    ('Isaac Low', 'isaac.low@starhub.com', 'password123', 4, 'NPC', 'default.png'),
    ('Jessica Chua', 'jessica.chua@starhub.com', 'password123', 4, 'NPC', 'default.png'),
    ('Keith Ho', 'keith.ho@starhub.com', 'password123', 4, 'NPC', 'default.png'),
    ('Lena Tan', 'lena.tan@starhub.com', 'password123', 4, 'NPC', 'default.png'),
    ('Megan Teo', 'megan.teo@starhub.com', 'password123', 4, 'NPC', 'default.png');

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

-- Insert sample data into cell tower energy_consumption table
INSERT INTO cell_tower_energy_consumption (cell_tower_id, date, total_energy_kwh, radio_equipment_energy_kwh, cooling_energy_kwh, backup_power_energy_kwh, misc_energy_kwh, renewable_energy_kwh, carbon_emission_kg)
VALUES
     -- Data for Cell Tower 1 (July 2024)
    (1, '2024-07-01', 120.00, 72, 36, 8, 4, 70, 20.4),
    (1, '2024-07-02', 118.90, 71, 34, 9, 4, 75, 19.2),
    (1, '2024-07-03', 122.50, 73, 35, 8, 6.5, 77, 18.1),
    (1, '2024-07-04', 121.00, 72, 34, 7, 8, 80, 16.8),
    (1, '2024-07-05', 119.70, 71, 33, 6, 9.7, 79, 17.5),
    (1, '2024-07-06', 120.20, 72, 32, 10, 6.2, 76, 18.0),
    (1, '2024-07-07', 121.80, 74, 36, 8, 3, 78, 17.0),
    (1, '2024-07-08', 123.40, 73, 34, 9, 7.4, 80, 15.7),
    
    -- Data for Cell Tower 1 (August 2024)
    (1, '2024-08-01', 121.50, 74, 35, 9, 3.5, 82, 15.4),
    (1, '2024-08-02', 120.70, 73, 34, 8, 5, 81, 16.0),
    (1, '2024-08-03', 119.80, 72, 33, 7, 7, 79, 16.7),
    (1, '2024-08-04', 118.60, 71, 32, 6, 9, 77, 17.8),
    (1, '2024-08-05', 122.00, 73, 36, 10, 3, 83, 15.0),
    (1, '2024-08-06', 123.20, 74, 37, 9, 3.2, 85, 14.5),
    (1, '2024-08-07', 121.10, 72, 34, 8, 6.9, 84, 14.9),
    (1, '2024-08-08', 120.50, 71, 35, 6, 8.5, 82, 15.3),

    -- Data for Cell Tower 1 (September 2024)
    (1, '2024-09-01', 118.90, 70, 33, 7, 8.9, 78, 16.6),
    (1, '2024-09-02', 120.00, 71, 34, 9, 6, 80, 16.0),
    (1, '2024-09-03', 122.30, 73, 36, 8, 5.5, 81, 15.2),
    (1, '2024-09-04', 121.40, 72, 33, 7, 8, 83, 15.0),
    (1, '2024-09-05', 119.00, 70, 34, 6, 9.5, 79, 16.2),
    (1, '2024-09-06', 120.60, 72, 32, 10, 6, 84, 14.7),
    (1, '2024-09-07', 121.90, 74, 35, 9, 3.1, 86, 14.0),
    (1, '2024-09-08', 123.50, 73, 37, 8, 4, 85, 13.8),

    -- Data for Cell Tower 1 (October 2024)
    (1, '2024-10-01', 123.00, 73, 36, 10, 4, 84, 14.6),
    (1, '2024-10-02', 121.20, 72, 34, 7, 6, 82, 15.2),
    (1, '2024-10-03', 120.00, 71, 33, 9, 6.7, 81, 15.8),
    (1, '2024-10-04', 124.50, 75, 37, 6, 6.5, 88, 13.2),
    (1, '2024-10-05', 122.10, 74, 35, 8, 5.9, 85, 14.3),
    (1, '2024-10-06', 120.90, 73, 36, 7, 8.1, 80, 16.1),
    (1, '2024-10-07', 119.70, 70, 34, 6, 9, 79, 16.4),
    (1, '2024-10-08', 122.80, 72, 32, 8, 6.2, 83, 15.0),
    
    -- Data for Cell Tower 2 (July 2024)
    (2, '2024-07-01', 125.00, 74, 40, 7, 4, 65, 23.3),
    (2, '2024-07-02', 126.50, 75, 41, 8, 3.5, 67, 22.9),
    (2, '2024-07-03', 124.00, 73, 39, 9, 5, 66, 23.1),
    (2, '2024-07-04', 128.20, 76, 40, 7, 6, 70, 21.5),
    (2, '2024-07-05', 127.30, 75, 38, 8, 6.8, 69, 22.2),
    (2, '2024-07-06', 126.00, 74, 37, 9, 5.5, 68, 22.4),
    (2, '2024-07-07', 129.00, 77, 41, 7, 4.3, 71, 21.1),
    (2, '2024-07-08', 128.50, 76, 40, 8, 5, 72, 20.8),

    -- Data for Cell Tower 2 (August 2024)
    (2, '2024-08-01', 128.00, 76, 38, 8, 6, 88, 13.0),
    (2, '2024-08-02', 127.50, 75, 37, 9, 6.5, 86, 13.5),
    (2, '2024-08-03', 129.00, 77, 39, 8, 7, 89, 12.8),
    (2, '2024-08-04', 130.00, 78, 40, 7, 5, 90, 12.4),
    (2, '2024-08-05', 128.80, 76, 38, 6, 8, 87, 13.2),
    (2, '2024-08-06', 129.50, 77, 39, 9, 7.5, 91, 12.2),
    (2, '2024-08-07', 126.80, 75, 37, 8, 6.5, 85, 13.7),
    (2, '2024-08-08', 127.00, 76, 38, 7, 5.9, 86, 13.3),

    -- Data for Cell Tower 2 (September 2024)
    (2, '2024-09-01', 122.00, 73, 39, 6, 4, 80, 15.8),
    (2, '2024-09-02', 123.50, 74, 40, 8, 5, 82, 15.4),
    (2, '2024-09-03', 124.00, 75, 38, 9, 5.3, 83, 14.9),
    (2, '2024-09-04', 121.20, 72, 37, 6, 6, 79, 16.0),
    (2, '2024-09-05', 122.70, 73, 39, 7, 4.5, 81, 15.7),
    (2, '2024-09-06', 125.00, 74, 40, 8, 5.8, 84, 14.3),
    (2, '2024-09-07', 126.10, 75, 41, 9, 6, 86, 13.8),
    (2, '2024-09-08', 123.80, 74, 38, 7, 6.2, 85, 14.1),

    -- Data for Cell Tower 2 (October 2024)
    (2, '2024-10-01', 126.50, 75, 37, 8, 6.5, 86, 14.2),
    (2, '2024-10-02', 127.00, 76, 38, 7, 7, 87, 13.8),
    (2, '2024-10-03', 128.20, 77, 39, 8, 6.5, 89, 13.4),
    (2, '2024-10-04', 129.50, 78, 40, 9, 5, 90, 13.0),
    (2, '2024-10-05', 127.80, 76, 38, 7, 6, 88, 13.5),
    (2, '2024-10-06', 128.60, 77, 39, 8, 5.8, 89, 13.2),
    (2, '2024-10-07', 130.00, 78, 40, 9, 5.5, 91, 12.9),
    (2, '2024-10-08', 126.30, 75, 37, 6, 6, 85, 14.4),

    -- Data for Cell Tower 3 (July 2024)
    (3, '2024-07-01', 115.00, 68, 34, 9, 4, 72, 19.5),
    (3, '2024-07-02', 116.50, 69, 33, 8, 6, 74, 18.9),
    (3, '2024-07-03', 114.80, 67, 32, 9, 6, 71, 20.0),
    (3, '2024-07-04', 117.00, 70, 34, 7, 6.5, 75, 19.3),
    (3, '2024-07-05', 118.20, 71, 33, 8, 6, 76, 18.7),
    (3, '2024-07-06', 116.00, 69, 32, 9, 6, 73, 19.0),
    (3, '2024-07-07', 119.00, 72, 35, 7, 5, 78, 18.5),
    (3, '2024-07-08', 117.80, 71, 34, 8, 6, 75, 18.8),

    -- Data for Cell Tower 3 (August 2024)
    (3, '2024-08-01', 118.00, 69, 33, 8, 8, 85, 14.5),
    (3, '2024-08-02', 119.50, 70, 34, 9, 7, 86, 14.2),
    (3, '2024-08-03', 120.00, 71, 35, 7, 7.5, 87, 14.0),
    (3, '2024-08-04', 121.00, 72, 36, 6, 8, 88, 13.8),
    (3, '2024-08-05', 119.80, 71, 34, 8, 6, 85, 14.3),
    (3, '2024-08-06', 120.50, 72, 33, 7, 7, 87, 13.9),
    (3, '2024-08-07', 121.30, 73, 35, 8, 6.8, 89, 13.5),
    (3, '2024-08-08', 120.60, 71, 34, 9, 7, 86, 14.1),

    -- Data for Cell Tower 3 (September 2024)
    (3, '2024-09-01', 116.50, 70, 32, 6, 8.5, 83, 15.0),
    (3, '2024-09-02', 117.20, 71, 33, 7, 6.8, 84, 14.8),
    (3, '2024-09-03', 118.00, 72, 34, 8, 6, 85, 14.5),
    (3, '2024-09-04', 115.90, 69, 32, 9, 7, 81, 15.2),
    (3, '2024-09-05', 116.70, 70, 33, 7, 6.5, 82, 15.0),
    (3, '2024-09-06', 119.00, 72, 34, 8, 6, 84, 14.6),
    (3, '2024-09-07', 120.10, 73, 35, 7, 6, 86, 14.3),
    (3, '2024-09-08', 118.50, 71, 33, 8, 7, 83, 14.9),

    -- Data for Cell Tower 3 (October 2024)
    (3, '2024-10-01', 120.00, 72, 34, 7, 7, 79, 15.8),
    (3, '2024-10-02', 121.50, 73, 35, 8, 6, 81, 15.4),
    (3, '2024-10-03', 119.70, 71, 33, 9, 6.5, 80, 15.2),
    (3, '2024-10-04', 122.00, 74, 36, 7, 6, 83, 14.7),
    (3, '2024-10-05', 120.80, 72, 34, 8, 6.8, 81, 15.1),
    (3, '2024-10-06', 121.10, 73, 35, 7, 7.3, 82, 14.9),
    (3, '2024-10-07', 123.00, 74, 36, 8, 7, 84, 14.5),
    (3, '2024-10-08', 122.50, 73, 35, 7, 6.8, 83, 14.6),

        -- Data for Cell Tower 4 (July 2024)
    (4, '2024-07-01', 130.00, 80, 36, 10, 4, 75, 22.5),
    (4, '2024-07-02', 131.50, 81, 37, 9, 5, 76, 22.2),
    (4, '2024-07-03', 132.00, 82, 38, 10, 5, 78, 21.8),
    (4, '2024-07-04', 130.70, 80, 35, 9, 6, 74, 22.6),
    (4, '2024-07-05', 131.80, 81, 36, 10, 5.5, 77, 22.4),
    (4, '2024-07-06', 133.00, 82, 37, 8, 6, 79, 22.0),
    (4, '2024-07-07', 132.50, 81, 36, 9, 5.7, 78, 21.9),
    (4, '2024-07-08', 134.00, 83, 38, 10, 5, 80, 21.6),

    -- Data for Cell Tower 4 (August 2024)
    (4, '2024-08-01', 132.50, 81, 35, 9, 7.5, 92, 11.5),
    (4, '2024-08-02', 133.00, 82, 36, 8, 6, 93, 11.3),
    (4, '2024-08-03', 134.20, 83, 37, 10, 5.5, 95, 10.9),
    (4, '2024-08-04', 135.00, 84, 38, 9, 5.7, 97, 10.5),
    (4, '2024-08-05', 132.80, 81, 35, 8, 7, 91, 11.7),
    (4, '2024-08-06', 134.50, 83, 37, 9, 6, 94, 11.1),
    (4, '2024-08-07', 133.30, 82, 36, 8, 6.3, 92, 11.4),
    (4, '2024-08-08', 135.20, 84, 38, 10, 5, 96, 10.8),

    -- Data for Cell Tower 4 (September 2024)
    (4, '2024-09-01', 129.00, 79, 37, 6, 7, 87, 13.8),
    (4, '2024-09-02', 130.00, 80, 36, 8, 7, 88, 13.5),
    (4, '2024-09-03', 131.50, 81, 38, 9, 6, 89, 13.3),
    (4, '2024-09-04', 132.00, 82, 37, 8, 6, 90, 13.1),
    (4, '2024-09-05', 130.50, 80, 36, 7, 6.5, 86, 13.7),
    (4, '2024-09-06', 133.00, 82, 38, 9, 7, 91, 12.9),
    (4, '2024-09-07', 131.80, 81, 37, 8, 6, 90, 13.2),
    (4, '2024-09-08', 132.20, 82, 38, 10, 6, 92, 13.0),

    -- Data for Cell Tower 4 (October 2024)
    (4, '2024-10-01', 133.00, 82, 38, 8, 5, 89, 12.6),
    (4, '2024-10-02', 133.50, 83, 39, 9, 6, 90, 12.4),
    (4, '2024-10-03', 134.00, 84, 40, 8, 5.3, 92, 12.1),
    (4, '2024-10-04', 135.00, 85, 41, 7, 5.5, 94, 11.8),
    (4, '2024-10-05', 132.80, 82, 38, 8, 6, 88, 12.9),
    (4, '2024-10-06', 133.30, 83, 39, 9, 6.2, 91, 12.5),
    (4, '2024-10-07', 134.50, 84, 40, 10, 6, 93, 12.2),
    (4, '2024-10-08', 132.00, 81, 37, 8, 6.3, 87, 13.0),

    -- Data for Cell Tower 5 (July 2024)
    (5, '2024-07-01', 110.00, 65, 30, 9, 6, 68, 18.2),
    (5, '2024-07-02', 111.50, 66, 31, 8, 7, 69, 18.0),
    (5, '2024-07-03', 112.00, 67, 32, 9, 7.5, 70, 17.7),
    (5, '2024-07-04', 113.00, 68, 33, 8, 7, 71, 17.5),
    (5, '2024-07-05', 114.00, 69, 34, 9, 7.8, 72, 17.2),
    (5, '2024-07-06', 115.00, 70, 35, 8, 8, 73, 17.0),
    (5, '2024-07-07', 116.00, 71, 36, 9, 6.7, 74, 16.8),
    (5, '2024-07-08', 117.00, 72, 37, 8, 7, 75, 16.5),

    -- Data for Cell Tower 5 (August 2024)
    (5, '2024-08-01', 112.00, 67, 31, 7, 7, 78, 16.0),
    (5, '2024-08-02', 113.00, 68, 32, 8, 6.5, 80, 15.8),
    (5, '2024-08-03', 114.00, 69, 33, 9, 6, 81, 15.6),
    (5, '2024-08-04', 115.00, 70, 34, 8, 7, 82, 15.4),
    (5, '2024-08-05', 116.00, 71, 35, 9, 6.2, 83, 15.2),
    (5, '2024-08-06', 117.00, 72, 36, 8, 7.5, 84, 15.0),
    (5, '2024-08-07', 118.00, 73, 37, 10, 7, 85, 14.8),
    (5, '2024-08-08', 119.00, 74, 38, 9, 6, 86, 14.6),

    -- Data for Cell Tower 5 (September 2024)
    (5, '2024-09-01', 114.50, 66, 29, 10, 9, 80, 15.4),
    (5, '2024-09-02', 115.00, 67, 30, 9, 8.5, 81, 15.2),
    (5, '2024-09-03', 116.00, 68, 31, 8, 7, 82, 15.0),
    (5, '2024-09-04', 117.00, 69, 32, 10, 6.5, 83, 14.8),
    (5, '2024-09-05', 118.00, 70, 33, 9, 7, 84, 14.6),
    (5, '2024-09-06', 119.00, 71, 34, 8, 6.5, 85, 14.4),
    (5, '2024-09-07', 120.00, 72, 35, 9, 6, 86, 14.2),
    (5, '2024-09-08', 121.00, 73, 36, 10, 6, 87, 14.0),

    -- Data for Cell Tower 5 (October 2024)
    (5, '2024-10-01', 116.00, 68, 30, 8, 10, 82, 14.8),
    (5, '2024-10-02', 117.00, 69, 31, 9, 9, 83, 14.5),
    (5, '2024-10-03', 118.00, 70, 32, 8, 8, 84, 14.3),
    (5, '2024-10-04', 119.00, 71, 33, 10, 7.5, 85, 14.1),
    (5, '2024-10-05', 120.00, 72, 34, 9, 8, 86, 13.9),
    (5, '2024-10-06', 121.00, 73, 35, 10, 7, 87, 13.7),
    (5, '2024-10-07', 122.00, 74, 36, 9, 6.5, 88, 13.5),
    (5, '2024-10-08', 123.00, 75, 37, 10, 6, 89, 13.3),

    -- Data for Cell Tower 6 (July 2024)
    (6, '2024-07-01', 140.00, 82, 45, 8, 5, 90, 13.0),
    (6, '2024-07-02', 141.50, 83, 46, 9, 5.2, 91, 12.8),
    (6, '2024-07-03', 142.00, 84, 47, 8, 6, 92, 12.6),
    (6, '2024-07-04', 140.50, 82, 44, 9, 5.5, 90, 13.1),
    (6, '2024-07-05', 141.00, 83, 45, 8, 6, 91, 12.9),
    (6, '2024-07-06', 143.00, 85, 48, 10, 6, 93, 12.5),
    (6, '2024-07-07', 144.00, 86, 49, 8, 5, 94, 12.3),
    (6, '2024-07-08', 145.00, 87, 50, 9, 6, 95, 12.0),

    -- Data for Cell Tower 6 (August 2024)
    (6, '2024-08-01', 138.50, 80, 42, 9, 7.5, 94, 10.5),
    (6, '2024-08-02', 139.00, 81, 43, 8, 7, 95, 10.3),
    (6, '2024-08-03', 140.00, 82, 44, 9, 6.5, 96, 10.1),
    (6, '2024-08-04', 141.00, 83, 45, 8, 7, 97, 9.9),
    (6, '2024-08-05', 139.50, 81, 43, 9, 6.8, 95, 10.2),
    (6, '2024-08-06', 140.50, 82, 44, 10, 7, 96, 10.0),
    (6, '2024-08-07', 141.50, 83, 45, 8, 7.5, 97, 9.8),
    (6, '2024-08-08', 142.00, 84, 46, 9, 6, 98, 9.6),

    -- Data for Cell Tower 6 (September 2024)
    (6, '2024-09-01', 137.00, 81, 44, 7, 5, 88, 12.8),
    (6, '2024-09-02', 138.00, 82, 45, 8, 6, 89, 12.6),
    (6, '2024-09-03', 139.00, 83, 46, 9, 6.5, 90, 12.4),
    (6, '2024-09-04', 140.00, 84, 47, 8, 7, 91, 12.2),
    (6, '2024-09-05', 138.50, 82, 45, 7, 6.5, 89, 12.5),
    (6, '2024-09-06', 139.50, 83, 46, 8, 7, 90, 12.3),
    (6, '2024-09-07', 140.50, 84, 47, 9, 6, 92, 12.1),
    (6, '2024-09-08', 141.00, 85, 48, 8, 7, 93, 11.9),

    -- Data for Cell Tower 6 (October 2024)
    (6, '2024-10-01', 141.00, 83, 43, 6, 9, 92, 11.0),
    (6, '2024-10-02', 142.00, 84, 44, 7, 8, 93, 10.8),
    (6, '2024-10-03', 143.00, 85, 45, 6, 9, 94, 10.6),
    (6, '2024-10-04', 144.00, 86, 46, 8, 6, 95, 10.4),
    (6, '2024-10-05', 145.00, 87, 47, 7, 6.5, 96, 10.2),
    (6, '2024-10-06', 146.00, 88, 48, 8, 7, 97, 10.0),
    (6, '2024-10-07', 147.00, 89, 49, 9, 6.5, 98, 9.8),
    (6, '2024-10-08', 148.00, 90, 50, 9, 7, 99, 9.6),

    -- Data for Cell Tower 7 (July 2024)
    (7, '2024-07-01', 125.50, 73, 37, 8, 7.5, 77, 17.5),
    (7, '2024-07-02', 126.00, 74, 38, 9, 6.5, 78, 17.3),
    (7, '2024-07-03', 127.00, 75, 39, 8, 7, 79, 17.0),
    (7, '2024-07-04', 128.00, 76, 40, 9, 7, 80, 16.8),
    (7, '2024-07-05', 129.00, 77, 41, 8, 6.8, 81, 16.6),
    (7, '2024-07-06', 130.00, 78, 42, 9, 7, 82, 16.3),
    (7, '2024-07-07', 131.00, 79, 43, 8, 6.5, 83, 16.1),
    (7, '2024-07-08', 132.00, 80, 44, 9, 7, 84, 15.8),

    -- Data for Cell Tower 7 (August 2024)
    (7, '2024-08-01', 123.00, 72, 35, 10, 6, 84, 14.4),
    (7, '2024-08-02', 124.00, 73, 36, 9, 7, 85, 14.2),
    (7, '2024-08-03', 125.00, 74, 37, 8, 6, 86, 14.0),
    (7, '2024-08-04', 126.00, 75, 38, 9, 6.5, 87, 13.8),
    (7, '2024-08-05', 127.00, 76, 39, 8, 7, 88, 13.6),
    (7, '2024-08-06', 128.00, 77, 40, 9, 7.2, 89, 13.4),
    (7, '2024-08-07', 129.00, 78, 41, 8, 6.5, 90, 13.2),
    (7, '2024-08-08', 130.00, 79, 42, 9, 7, 91, 13.0),

    -- Data for Cell Tower 7 (September 2024)
    (7, '2024-09-01', 124.50, 71, 34, 9, 10.5, 82, 15.2),
    (7, '2024-09-02', 125.00, 72, 35, 8, 9, 83, 15.0),
    (7, '2024-09-03', 126.00, 73, 36, 9, 8.5, 84, 14.8),
    (7, '2024-09-04', 127.00, 74, 37, 8, 9, 85, 14.6),
    (7, '2024-09-05', 128.00, 75, 38, 9, 7.5, 86, 14.4),
    (7, '2024-09-06', 129.00, 76, 39, 8, 7.2, 87, 14.2),
    (7, '2024-09-07', 130.00, 77, 40, 9, 8, 88, 14.0),
    (7, '2024-09-08', 131.00, 78, 41, 8, 7.5, 89, 13.8),

    -- Data for Cell Tower 7 (October 2024)
    (7, '2024-10-01', 126.00, 73, 36, 7, 8, 79, 15.9),
    (7, '2024-10-02', 127.00, 74, 37, 8, 7, 80, 15.7),
    (7, '2024-10-03', 128.00, 75, 38, 9, 7, 81, 15.5),
    (7, '2024-10-04', 129.00, 76, 39, 8, 6.5, 82, 15.3),
    (7, '2024-10-05', 130.00, 77, 40, 9, 6, 83, 15.1),
    (7, '2024-10-06', 131.00, 78, 41, 8, 7, 84, 14.9),
    (7, '2024-10-07', 132.00, 79, 42, 9, 6.5, 85, 14.7),
    (7, '2024-10-08', 133.00, 80, 43, 8, 7, 86, 14.5),

    -- Data for Cell Tower 8 (July 2024)
    (8, '2024-07-01', 105.00, 62, 28, 8, 7, 65, 19.0),
    (8, '2024-07-02', 106.00, 63, 29, 7, 7.5, 66, 18.8),
    (8, '2024-07-03', 107.00, 64, 30, 8, 6.5, 67, 18.6),
    (8, '2024-07-04', 108.00, 65, 31, 7, 7, 68, 18.4),
    (8, '2024-07-05', 109.00, 66, 32, 8, 6, 69, 18.2),
    (8, '2024-07-06', 110.00, 67, 33, 7, 6.5, 70, 18.0),
    (8, '2024-07-07', 111.00, 68, 34, 8, 6, 71, 17.8),
    (8, '2024-07-08', 112.00, 69, 35, 7, 7, 72, 17.6),

    -- Data for Cell Tower 8 (August 2024)
    (8, '2024-08-01', 108.00, 63, 30, 6, 9, 75, 16.5),
    (8, '2024-08-02', 109.00, 64, 31, 7, 8.5, 76, 16.3),
    (8, '2024-08-03', 110.00, 65, 32, 6, 8, 77, 16.0),
    (8, '2024-08-04', 111.00, 66, 33, 7, 7.5, 78, 15.8),
    (8, '2024-08-05', 112.00, 67, 34, 6, 8, 79, 15.6),
    (8, '2024-08-06', 113.00, 68, 35, 7, 7, 80, 15.4),
    (8, '2024-08-07', 114.00, 69, 36, 6, 7.5, 81, 15.2),
    (8, '2024-08-08', 115.00, 70, 37, 7, 7, 82, 15.0),

    -- Data for Cell Tower 8 (September 2024)
    (8, '2024-09-01', 106.50, 64, 29, 9, 4.5, 80, 15.0),
    (8, '2024-09-02', 107.00, 65, 30, 8, 5, 81, 14.8),
    (8, '2024-09-03', 108.00, 66, 31, 7, 5.5, 82, 14.6),
    (8, '2024-09-04', 109.00, 67, 32, 8, 5, 83, 14.4),
    (8, '2024-09-05', 110.00, 68, 33, 7, 4.5, 84, 14.2),
    (8, '2024-09-06', 111.00, 69, 34, 6, 4.5, 85, 14.0),
    (8, '2024-09-07', 112.00, 70, 35, 7, 5, 86, 13.8),
    (8, '2024-09-08', 113.00, 71, 36, 6, 5, 87, 13.6),

    -- Data for Cell Tower 8 (October 2024)
    (8, '2024-10-01', 109.00, 66, 31, 7, 5, 78, 15.8),
    (8, '2024-10-02', 110.00, 67, 32, 8, 5.5, 79, 15.6),
    (8, '2024-10-03', 111.00, 68, 33, 7, 6, 80, 15.4),
    (8, '2024-10-04', 112.00, 69, 34, 6, 6.5, 81, 15.2),
    (8, '2024-10-05', 113.00, 70, 35, 7, 6, 82, 15.0),
    (8, '2024-10-06', 114.00, 71, 36, 8, 6.5, 83, 14.8),
    (8, '2024-10-07', 115.00, 72, 37, 7, 6, 84, 14.6),
    (8, '2024-10-08', 116.00, 73, 38, 6, 7, 85, 14.4),

    -- Data for Cell Tower 9 (July 2024)
    (9, '2024-07-01', 135.00, 76, 38, 10, 11, 83, 15.7),
    (9, '2024-07-02', 136.00, 77, 39, 9, 10, 84, 15.5),
    (9, '2024-07-03', 137.00, 78, 40, 8, 10, 85, 15.3),
    (9, '2024-07-04', 138.00, 79, 41, 7, 9.5, 86, 15.1),
    (9, '2024-07-05', 139.00, 80, 42, 9, 9, 87, 14.9),
    (9, '2024-07-06', 140.00, 81, 43, 8, 9.5, 88, 14.7),
    (9, '2024-07-07', 141.00, 82, 44, 7, 10, 89, 14.5),
    (9, '2024-07-08', 142.00, 83, 45, 6, 10.5, 90, 14.3),

    -- Data for Cell Tower 9 (August 2024)
    (9, '2024-08-01', 137.00, 77, 39, 8, 13, 90, 12.3),
    (9, '2024-08-02', 138.00, 78, 40, 9, 12, 91, 12.1),
    (9, '2024-08-03', 139.00, 79, 41, 8, 12.5, 92, 11.9),
    (9, '2024-08-04', 140.00, 80, 42, 7, 13, 93, 11.7),
    (9, '2024-08-05', 141.00, 81, 43, 6, 12.5, 94, 11.5),
    (9, '2024-08-06', 142.00, 82, 44, 8, 13, 95, 11.3),
    (9, '2024-08-07', 143.00, 83, 45, 7, 12, 96, 11.1),
    (9, '2024-08-08', 144.00, 84, 46, 6, 11.5, 97, 10.9),

    -- Data for Cell Tower 9 (September 2024)
    (9, '2024-09-01', 138.50, 75, 37, 9, 9.5, 85, 13.4),
    (9, '2024-09-02', 139.00, 76, 38, 8, 10, 86, 13.2),
    (9, '2024-09-03', 140.00, 77, 39, 7, 11, 87, 13.0),
    (9, '2024-09-04', 141.00, 78, 40, 8, 10, 88, 12.8),
    (9, '2024-09-05', 142.00, 79, 41, 7, 9.5, 89, 12.6),
    (9, '2024-09-06', 143.00, 80, 42, 6, 9, 90, 12.4),
    (9, '2024-09-07', 144.00, 81, 43, 5, 9, 91, 12.2),
    (9, '2024-09-08', 145.00, 82, 44, 6, 9.5, 92, 12.0),

    -- Data for Cell Tower 9 (October 2024)
    (9, '2024-10-01', 134.50, 74, 36, 10, 14, 87, 13.0),
    (9, '2024-10-02', 135.00, 75, 37, 9, 13, 88, 12.8),
    (9, '2024-10-03', 136.00, 76, 38, 8, 12, 89, 12.6),
    (9, '2024-10-04', 137.00, 77, 39, 7, 11, 90, 12.4),
    (9, '2024-10-05', 138.00, 78, 40, 8, 10, 91, 12.2),
    (9, '2024-10-06', 139.00, 79, 41, 7, 9.5, 92, 12.0),
    (9, '2024-10-07', 140.00, 80, 42, 6, 9, 93, 11.8),
    (9, '2024-10-08', 141.00, 81, 43, 7, 9.5, 94, 11.6),

    -- Data for Cell Tower 10 (July 2024)
    (10, '2024-07-01', 122.00, 70, 32, 7, 13, 76, 17.8),
    (10, '2024-07-02', 123.00, 71, 33, 8, 12, 77, 17.5),
    (10, '2024-07-03', 124.00, 72, 34, 9, 11, 78, 17.2),
    (10, '2024-07-04', 125.00, 73, 35, 8, 10, 79, 16.9),
    (10, '2024-07-05', 126.00, 74, 36, 7, 9.5, 80, 16.6),
    (10, '2024-07-06', 127.00, 75, 37, 6, 9, 81, 16.3),
    (10, '2024-07-07', 128.00, 76, 38, 7, 8.5, 82, 16.0),
    (10, '2024-07-08', 129.00, 77, 39, 8, 8, 83, 15.7),

    -- Data for Cell Tower 10 (August 2024)
    (10, '2024-08-01', 124.00, 72, 33, 10, 9, 82, 15.0),
    (10, '2024-08-02', 125.00, 73, 34, 9, 8, 83, 14.7),
    (10, '2024-08-03', 126.00, 74, 35, 8, 7.5, 84, 14.4),
    (10, '2024-08-04', 127.00, 75, 36, 7, 7, 85, 14.1),
    (10, '2024-08-05', 128.00, 76, 37, 6, 6.5, 86, 13.8),
    (10, '2024-08-06', 129.00, 77, 38, 5, 6, 87, 13.5),
    (10, '2024-08-07', 130.00, 78, 39, 4, 5.5, 88, 13.2),
    (10, '2024-08-08', 131.00, 79, 40, 5, 5, 89, 12.9),

    -- Data for Cell Tower 10 (September 2024)
    (10, '2024-09-01', 123.50, 71, 34, 9, 10.5, 84, 14.2),
    (10, '2024-09-02', 124.00, 72, 35, 8, 10, 85, 14.0),
    (10, '2024-09-03', 125.00, 73, 36, 7, 9.5, 86, 13.8),
    (10, '2024-09-04', 126.00, 74, 37, 6, 9, 87, 13.5),
    (10, '2024-09-05', 127.00, 75, 38, 5, 8, 88, 13.3),
    (10, '2024-09-06', 128.00, 76, 39, 4, 7.5, 89, 13.0),
    (10, '2024-09-07', 129.00, 77, 40, 5, 7, 90, 12.7),
    (10, '2024-09-08', 130.00, 78, 41, 4, 6.5, 91, 12.4),

    -- Data for Cell Tower 10 (October 2024)
    (10, '2024-10-01', 121.00, 70, 30, 11, 10, 80, 16.2),
    (10, '2024-10-02', 122.00, 71, 31, 10, 9.5, 81, 15.9),
    (10, '2024-10-03', 123.00, 72, 32, 9, 9, 82, 15.6),
    (10, '2024-10-04', 124.00, 73, 33, 8, 8.5, 83, 15.3),
    (10, '2024-10-05', 125.00, 74, 34, 7, 8, 84, 15.0),
    (10, '2024-10-06', 126.00, 75, 35, 6, 7.5, 85, 14.7),
    (10, '2024-10-07', 127.00, 76, 36, 5, 7, 86, 14.4),
    (10, '2024-10-08', 128.00, 77, 37, 4, 6.5, 87, 14.1),


    -- Data for Cell Tower 11 (July 2024)
    (11, '2024-07-01', 128.00, 75, 40, 6, 7, 80, 15.0),
    (11, '2024-07-02', 129.00, 76, 41, 7, 6.5, 81, 14.7),
    (11, '2024-07-03', 130.00, 77, 42, 6, 7, 82, 14.4),
    (11, '2024-07-04', 131.00, 78, 43, 5, 8, 83, 14.1),
    (11, '2024-07-05', 132.00, 79, 44, 4, 7.5, 84, 13.8),
    (11, '2024-07-06', 133.00, 80, 45, 3, 7, 85, 13.5),
    (11, '2024-07-07', 134.00, 81, 46, 2, 6.5, 86, 13.2),
    (11, '2024-07-08', 135.00, 82, 47, 1, 6, 87, 12.9),

    -- Data for Cell Tower 11 (August 2024)
    (11, '2024-08-01', 126.00, 74, 38, 9, 5.5, 86, 13.0),
    (11, '2024-08-02', 127.00, 75, 39, 8, 6, 87, 12.7),
    (11, '2024-08-03', 128.00, 76, 40, 7, 5.5, 88, 12.4),
    (11, '2024-08-04', 129.00, 77, 41, 6, 5, 89, 12.1),
    (11, '2024-08-05', 130.00, 78, 42, 5, 4.5, 90, 11.8),
    (11, '2024-08-06', 131.00, 79, 43, 4, 4, 91, 11.5),
    (11, '2024-08-07', 132.00, 80, 44, 3, 3.5, 92, 11.2),
    (11, '2024-08-08', 133.00, 81, 45, 2, 3, 93, 10.9),

    -- Data for Cell Tower 11 (September 2024)
    (11, '2024-09-01', 127.50, 76, 39, 7, 5, 89, 12.2),
    (11, '2024-09-02', 128.00, 77, 40, 6, 4.5, 90, 11.9),
    (11, '2024-09-03', 129.00, 78, 41, 5, 4, 91, 11.6),
    (11, '2024-09-04', 130.00, 79, 42, 4, 3.5, 92, 11.3),
    (11, '2024-09-05', 131.00, 80, 43, 3, 3, 93, 11.0),
    (11, '2024-09-06', 132.00, 81, 44, 2, 2.5, 94, 10.7),
    (11, '2024-09-07', 133.00, 82, 45, 1, 2, 95, 10.4),
    (11, '2024-09-08', 134.00, 83, 46, 1, 1.5, 96, 10.1),

    -- Data for Cell Tower 11 (October 2024)
    (11, '2024-10-01', 129.00, 78, 37, 8, 6.5, 91, 11.8),
    (11, '2024-10-02', 130.00, 79, 38, 7, 6, 92, 11.5),
    (11, '2024-10-03', 131.00, 80, 39, 6, 5.5, 93, 11.2),
    (11, '2024-10-04', 132.00, 81, 40, 5, 5, 94, 10.9),
    (11, '2024-10-05', 133.00, 82, 41, 4, 4.5, 95, 10.6),
    (11, '2024-10-06', 134.00, 83, 42, 3, 4, 96, 10.3),
    (11, '2024-10-07', 135.00, 84, 43, 2, 3.5, 97, 10.0),
    (11, '2024-10-08', 136.00, 85, 44, 1, 3, 98, 9.7),

    -- Data for Cell Tower 12 (July 2024)
    (12, '2024-07-01', 115.00, 69, 31, 10, 5, 67, 18.7),
    (12, '2024-07-02', 116.00, 70, 32, 9, 5.5, 68, 18.3),
    (12, '2024-07-03', 117.00, 71, 33, 8, 6, 69, 18.0),
    (12, '2024-07-04', 118.00, 72, 34, 7, 6.5, 70, 17.8),
    (12, '2024-07-05', 119.00, 73, 35, 6, 7, 71, 17.5),
    (12, '2024-07-06', 120.00, 74, 36, 5, 7.5, 72, 17.3),
    (12, '2024-07-07', 121.00, 75, 37, 4, 8, 73, 17.0),
    (12, '2024-07-08', 122.00, 76, 38, 3, 8.5, 74, 16.7),

    -- Data for Cell Tower 12 (August 2024)
    (12, '2024-08-01', 117.00, 70, 30, 8, 9, 75, 16.4),
    (12, '2024-08-02', 118.00, 71, 31, 7, 8, 76, 16.0),
    (12, '2024-08-03', 119.00, 72, 32, 6, 7, 77, 15.7),
    (12, '2024-08-04', 120.00, 73, 33, 5, 6, 78, 15.4),
    (12, '2024-08-05', 121.00, 74, 34, 4, 5, 79, 15.1),
    (12, '2024-08-06', 122.00, 75, 35, 3, 4, 80, 14.8),
    (12, '2024-08-07', 123.00, 76, 36, 2, 3, 81, 14.5),
    (12, '2024-08-08', 124.00, 77, 37, 1, 2, 82, 14.2),

    -- Data for Cell Tower 12 (September 2024)
    (12, '2024-09-01', 116.20, 68, 29, 7, 12, 80, 14.5),
    (12, '2024-09-02', 117.00, 69, 30, 6, 11.5, 81, 14.3),
    (12, '2024-09-03', 118.00, 70, 31, 5, 11, 82, 14.0),
    (12, '2024-09-04', 119.00, 71, 32, 4, 10.5, 83, 13.8),
    (12, '2024-09-05', 120.00, 72, 33, 3, 10, 84, 13.5),
    (12, '2024-09-06', 121.00, 73, 34, 2, 9.5, 85, 13.2),
    (12, '2024-09-07', 122.00, 74, 35, 1, 9, 86, 13.0),
    (12, '2024-09-08', 123.00, 75, 36, 1, 8.5, 87, 12.7),

    -- Data for Cell Tower 12 (October 2024)
    (12, '2024-10-01', 118.50, 71, 32, 6, 9.5, 88, 12.9),
    (12, '2024-10-02', 119.00, 72, 33, 5, 9, 89, 12.6),
    (12, '2024-10-03', 120.00, 73, 34, 4, 8.5, 90, 12.3),
    (12, '2024-10-04', 121.00, 74, 35, 3, 8, 91, 12.0),
    (12, '2024-10-05', 122.00, 75, 36, 2, 7.5, 92, 11.8),
    (12, '2024-10-06', 123.00, 76, 37, 1, 7, 93, 11.5),
    (12, '2024-10-07', 124.00, 77, 38, 1, 6.5, 94, 11.2),
    (12, '2024-10-08', 125.00, 78, 39, 0, 6, 95, 11.0),

    (13, '2024-07-01', 140.50, 80, 40, 10, 10.5, 90, 25.0),
    (13, '2024-07-02', 138.70, 78, 39, 9, 12, 88, 24.5),
    (13, '2024-07-03', 142.30, 82, 41, 8, 11.3, 92, 23.8),
    (13, '2024-07-04', 141.00, 80, 42, 12, 7, 93, 22.9),
    (13, '2024-07-05', 139.60, 79, 38, 11, 11.6, 89, 23.6),
    (13, '2024-07-06', 143.10, 81, 37, 13, 12.1, 94, 22.4),
    (13, '2024-07-07', 142.90, 83, 40, 9, 10.9, 91, 23.2),
    (13, '2024-07-08', 140.80, 82, 39, 11, 8.8, 90, 24.0),

    -- Data for Cell Tower 13 (August 2024)
    (13, '2024-08-01', 141.20, 80, 41, 10, 10.2, 89, 24.3),
    (13, '2024-08-02', 139.50, 79, 40, 8, 12.5, 87, 24.8),
    (13, '2024-08-03', 138.30, 78, 39, 12, 9.3, 85, 25.5),
    (13, '2024-08-04', 140.90, 82, 37, 11, 10, 93, 22.7),
    (13, '2024-08-05', 142.50, 81, 38, 9, 14.5, 92, 22.2),
    (13, '2024-08-06', 141.30, 80, 41, 10, 10.3, 91, 23.1),
    (13, '2024-08-07', 139.90, 79, 40, 8, 12, 89, 24.0),
    (13, '2024-08-08', 143.20, 83, 42, 7, 11, 94, 22.0),

    -- Data for Cell Tower 13 (September 2024)
    (13, '2024-09-01', 142.80, 81, 39, 9, 13.4, 92, 22.6),
    (13, '2024-09-02', 140.70, 80, 37, 10, 13, 90, 23.7),
    (13, '2024-09-03', 143.60, 82, 38, 12, 11.6, 93, 22.1),
    (13, '2024-09-04', 139.30, 79, 40, 11, 9.3, 88, 23.8),
    (13, '2024-09-05', 138.90, 78, 42, 9, 9.2, 87, 24.5),
    (13, '2024-09-06', 141.10, 80, 41, 10, 10.6, 89, 23.4),
    (13, '2024-09-07', 142.20, 81, 37, 12, 11.1, 91, 23.0),
    (13, '2024-09-08', 143.90, 83, 39, 7, 14, 95, 21.5),

    -- Data for Cell Tower 13 (October 2024)
    (13, '2024-10-01', 144.00, 84, 41, 10, 9, 93, 22.0),
    (13, '2024-10-02', 141.50, 81, 40, 11, 9.5, 92, 22.8),
    (13, '2024-10-03', 140.20, 80, 39, 9, 11, 91, 23.5),
    (13, '2024-10-04', 143.70, 83, 38, 8, 14.7, 94, 21.8),
    (13, '2024-10-05', 142.10, 82, 37, 12, 11.5, 90, 22.6),
    (13, '2024-10-06', 139.80, 78, 41, 7, 13.3, 88, 23.7),
    (13, '2024-10-07', 141.60, 81, 38, 8, 12.2, 89, 24.0),
    (13, '2024-10-08', 142.90, 80, 39, 11, 11, 91, 22.4),

    -- Data for Cell Tower 14 (July 2024)
    (14, '2024-07-01', 130.00, 76, 38, 9, 7, 85, 21.8),
    (14, '2024-07-02', 128.40, 75, 37, 8, 8.4, 83, 22.5),
    (14, '2024-07-03', 132.50, 78, 39, 7, 8.5, 87, 21.2),
    (14, '2024-07-04', 129.70, 77, 36, 10, 6.7, 86, 22.0),
    (14, '2024-07-05', 131.30, 76, 38, 9, 8.3, 84, 21.5),
    (14, '2024-07-06', 133.80, 79, 37, 8, 9.8, 88, 20.7),
    (14, '2024-07-07', 130.90, 77, 36, 11, 6.9, 86, 21.9),
    (14, '2024-07-08', 129.60, 75, 35, 9, 10, 82, 23.0),

    -- Data for Cell Tower 14 (August 2024)
    (14, '2024-08-01', 132.10, 78, 40, 9, 5.1, 87, 20.8),
    (14, '2024-08-02', 130.80, 76, 39, 10, 5.8, 85, 21.6),
    (14, '2024-08-03', 129.50, 75, 37, 8, 9.5, 83, 22.3),
    (14, '2024-08-04', 131.70, 77, 38, 11, 5.7, 88, 20.5),
    (14, '2024-08-05', 133.30, 79, 36, 7, 11.3, 89, 20.0),
    (14, '2024-08-06', 134.60, 78, 41, 9, 6.6, 90, 19.2),
    (14, '2024-08-07', 132.50, 77, 39, 10, 6, 88, 20.4),
    (14, '2024-08-08', 130.30, 74, 37, 9, 9.3, 84, 22.1),

    -- Data for Cell Tower 14 (September 2024)
    (14, '2024-09-01', 128.90, 74, 38, 7, 9.9, 82, 22.7),
    (14, '2024-09-02', 130.20, 76, 39, 8, 7.2, 85, 21.8),
    (14, '2024-09-03', 132.40, 78, 36, 10, 8.4, 87, 20.6),
    (14, '2024-09-04', 131.00, 77, 37, 9, 8.3, 86, 21.3),
    (14, '2024-09-05', 129.80, 75, 35, 11, 8.8, 84, 22.0),
    (14, '2024-09-06', 134.00, 80, 40, 7, 7, 89, 19.5),
    (14, '2024-09-07', 133.20, 79, 38, 9, 7.2, 87, 20.2),
    (14, '2024-09-08', 131.90, 78, 36, 10, 7.9, 85, 21.4),

    -- Data for Cell Tower 14 (October 2024)
    (14, '2024-10-01', 132.00, 77, 38, 11, 6.2, 88, 20.5),
    (14, '2024-10-02', 129.90, 75, 39, 7, 8.9, 86, 21.7),
    (14, '2024-10-03', 128.70, 74, 36, 9, 9.7, 83, 22.4),
    (14, '2024-10-04', 134.20, 79, 41, 8, 6.5, 91, 19.0),
    (14, '2024-10-05', 133.00, 78, 40, 7, 8, 89, 19.8),
    (14, '2024-10-06', 131.60, 76, 37, 9, 8.6, 87, 21.1),
    (14, '2024-10-07', 130.40, 75, 35, 10, 9.3, 84, 22.3),
    (14, '2024-10-08', 132.80, 77, 38, 8, 7.5, 86, 21.5),

    -- Data for Cell Tower 15 (July 2024)
    (15, '2024-07-01', 140.00, 82, 40, 12, 6, 90, 22.0),
    (15, '2024-07-02', 138.50, 81, 39, 11, 7.5, 88, 22.8),
    (15, '2024-07-03', 141.20, 83, 42, 10, 6.2, 92, 21.7),
    (15, '2024-07-04', 139.00, 80, 38, 9, 11, 87, 23.5),
    (15, '2024-07-05', 137.60, 79, 37, 12, 9.6, 86, 24.0),
    (15, '2024-07-06', 142.10, 82, 41, 10, 9, 93, 21.4),
    (15, '2024-07-07', 140.50, 81, 39, 11, 9.5, 90, 22.6),
    (15, '2024-07-08', 139.80, 80, 40, 12, 7.8, 91, 22.1),

    -- Data for Cell Tower 15 (August 2024)
    (15, '2024-08-01', 141.50, 83, 42, 9, 7.5, 94, 20.9),
    (15, '2024-08-02', 139.70, 81, 41, 10, 7.7, 92, 21.6),
    (15, '2024-08-03', 138.00, 80, 39, 12, 6.8, 89, 22.5),
    (15, '2024-08-04', 140.20, 82, 40, 11, 7.2, 91, 22.0),
    (15, '2024-08-05', 143.30, 85, 43, 10, 5.3, 96, 19.8),
    (15, '2024-08-06', 142.80, 84, 42, 9, 7.1, 95, 20.2),
    (15, '2024-08-07', 141.10, 82, 40, 8, 10.1, 93, 21.0),
    (15, '2024-08-08', 140.40, 81, 38, 9, 12.4, 90, 22.8),

    -- Data for Cell Tower 15 (September 2024)
    (15, '2024-09-01', 137.90, 78, 37, 11, 11.9, 87, 23.6),
    (15, '2024-09-02', 139.20, 80, 39, 10, 10, 90, 22.3),
    (15, '2024-09-03', 141.60, 82, 42, 12, 5.6, 93, 20.7),
    (15, '2024-09-04', 142.50, 83, 40, 11, 8.5, 95, 19.9),
    (15, '2024-09-05', 138.30, 79, 38, 10, 11.3, 88, 23.2),
    (15, '2024-09-06', 143.10, 84, 41, 8, 10.5, 97, 19.3),
    (15, '2024-09-07', 141.80, 82, 39, 7, 13.8, 94, 20.5),
    (15, '2024-09-08', 140.10, 80, 37, 10, 12.7, 91, 21.8),

    -- Data for Cell Tower 15 (October 2024)
    (15, '2024-10-01', 143.00, 83, 43, 9, 8, 96, 19.7),
    (15, '2024-10-02', 141.20, 82, 41, 12, 6.2, 94, 20.6),
    (15, '2024-10-03', 138.90, 79, 39, 11, 9.9, 90, 22.4),
    (15, '2024-10-04', 144.50, 85, 44, 7, 8.5, 98, 18.5),
    (15, '2024-10-05', 142.70, 83, 42, 8, 8.7, 95, 19.4),
    (15, '2024-10-06', 140.80, 81, 38, 9, 11.8, 91, 21.5),
    (15, '2024-10-07', 139.50, 80, 37, 10, 9.5, 88, 22.7),
    (15, '2024-10-08', 142.20, 82, 40, 12, 7.3, 94, 20.1),

    -- Data for Cell Tower 16 (July 2024)
    (16, '2024-07-01', 135.00, 78, 38, 10, 9, 85, 21.5),
    (16, '2024-07-02', 136.80, 80, 40, 8, 8.8, 87, 21.0),
    (16, '2024-07-03', 134.50, 77, 39, 9, 9.5, 86, 22.2),
    (16, '2024-07-04', 137.20, 79, 37, 12, 9.2, 89, 20.7),
    (16, '2024-07-05', 138.00, 81, 41, 11, 5, 90, 20.0),
    (16, '2024-07-06', 135.90, 79, 40, 8, 8.9, 88, 21.3),
    (16, '2024-07-07', 134.10, 78, 36, 9, 11.1, 84, 22.5),
    (16, '2024-07-08', 137.80, 80, 42, 10, 5.8, 91, 20.2),

    -- Data for Cell Tower 16 (August 2024)
    (16, '2024-08-01', 139.30, 82, 43, 7, 7.3, 93, 19.6),
    (16, '2024-08-02', 138.50, 81, 41, 9, 7.5, 92, 20.4),
    (16, '2024-08-03', 137.60, 79, 38, 12, 8.6, 90, 21.2),
    (16, '2024-08-04', 136.40, 78, 37, 10, 11.4, 88, 22.0),
    (16, '2024-08-05', 140.70, 83, 44, 6, 7.7, 94, 19.2),
    (16, '2024-08-06', 139.00, 80, 40, 11, 8.3, 91, 20.1),
    (16, '2024-08-07', 137.10, 78, 39, 9, 10.9, 89, 21.8),
    (16, '2024-08-08', 135.70, 77, 36, 12, 10.7, 87, 22.7),

    -- Data for Cell Tower 16 (September 2024)
    (16, '2024-09-01', 138.90, 81, 40, 8, 9.9, 92, 20.8),
    (16, '2024-09-02', 137.30, 79, 38, 10, 10.3, 90, 21.4),
    (16, '2024-09-03', 136.10, 78, 37, 9, 12.1, 88, 22.6),
    (16, '2024-09-04', 139.80, 82, 42, 7, 8.8, 93, 19.9),
    (16, '2024-09-05', 140.20, 83, 41, 6, 10.2, 94, 19.3),
    (16, '2024-09-06', 137.50, 80, 39, 12, 6.5, 90, 21.7),
    (16, '2024-09-07', 138.40, 81, 40, 9, 7.9, 91, 20.9),
    (16, '2024-09-08', 136.70, 78, 38, 11, 8.7, 89, 21.9),

    -- Data for Cell Tower 16 (October 2024)
    (16, '2024-10-01', 141.50, 84, 45, 10, 2.5, 97, 18.4),
    (16, '2024-10-02', 139.80, 82, 41, 8, 8.8, 95, 19.5),
    (16, '2024-10-03', 137.90, 80, 39, 9, 9.2, 92, 20.6),
    (16, '2024-10-04', 142.20, 83, 44, 7, 8.2, 96, 18.8),
    (16, '2024-10-05', 140.70, 82, 42, 6, 10.7, 94, 19.7),
    (16, '2024-10-06', 138.50, 79, 38, 11, 10.5, 91, 21.3),
    (16, '2024-10-07', 139.00, 80, 40, 10, 9.0, 90, 21.1),
    (16, '2024-10-08', 137.30, 78, 37, 12, 9.6, 88, 22.0),

    -- Data for Cell Tower 17 (July 2024)
    (17, '2024-07-01', 110.50, 65, 30, 8, 7.5, 68, 19.0),
    (17, '2024-07-02', 109.80, 64, 29, 9, 7.8, 69, 18.6),
    (17, '2024-07-03', 111.20, 66, 31, 7, 7.2, 71, 18.0),
    (17, '2024-07-04', 112.50, 67, 32, 6, 7.5, 73, 17.5),
    (17, '2024-07-05', 113.00, 68, 33, 8, 4.5, 75, 16.9),
    (17, '2024-07-06', 110.70, 65, 31, 10, 4.7, 70, 18.8),
    (17, '2024-07-07', 109.40, 64, 30, 9, 6.4, 67, 19.4),
    (17, '2024-07-08', 111.90, 66, 33, 7, 5.9, 72, 18.2),

    -- Data for Cell Tower 17 (August 2024)
    (17, '2024-08-01', 113.50, 69, 34, 9, 1.5, 78, 16.5),
    (17, '2024-08-02', 114.20, 68, 32, 10, 4.2, 76, 17.2),
    (17, '2024-08-03', 112.70, 67, 31, 7, 7.7, 73, 17.8),
    (17, '2024-08-04', 111.40, 65, 30, 8, 8.4, 70, 18.5),
    (17, '2024-08-05', 115.30, 70, 35, 6, 4.3, 80, 16.1),
    (17, '2024-08-06', 113.60, 69, 33, 7, 4.6, 77, 16.9),
    (17, '2024-08-07', 112.10, 66, 32, 9, 5.1, 74, 17.6),
    (17, '2024-08-08', 110.80, 64, 31, 8, 7.8, 70, 18.7),

    -- Data for Cell Tower 17 (September 2024)
    (17, '2024-09-01', 112.90, 65, 30, 10, 7.9, 72, 17.4),
    (17, '2024-09-02', 111.70, 64, 29, 9, 8.7, 70, 18.2),
    (17, '2024-09-03', 113.40, 67, 33, 8, 5.4, 75, 16.8),
    (17, '2024-09-04', 114.00, 68, 34, 7, 4.6, 77, 16.4),
    (17, '2024-09-05', 110.60, 63, 30, 6, 11, 69, 18.0),
    (17, '2024-09-06', 112.50, 65, 32, 10, 5.5, 74, 17.1),
    (17, '2024-09-07', 114.30, 67, 35, 9, 2.3, 78, 16.0),
    (17, '2024-09-08', 115.60, 69, 36, 7, 3.6, 80, 15.7),

    -- Data for Cell Tower 17 (October 2024)
    (17, '2024-10-01', 116.10, 70, 36, 8, 2.1, 82, 15.4),
    (17, '2024-10-02', 114.70, 68, 34, 10, 2.7, 79, 16.2),
    (17, '2024-10-03', 113.00, 67, 33, 7, 6, 76, 17.0),
    (17, '2024-10-04', 117.20, 71, 37, 6, 3, 85, 14.7),
    (17, '2024-10-05', 115.40, 69, 35, 8, 3.4, 81, 15.8),
    (17, '2024-10-06', 113.80, 67, 34, 7, 5.8, 77, 16.5),
    (17, '2024-10-07', 112.90, 66, 33, 9, 4.9, 74, 17.3),
    (17, '2024-10-08', 115.50, 68, 35, 6, 6.5, 80, 15.6),

    -- Data for Cell Tower 18 (July 2024)
    (18, '2024-07-01', 130.50, 80, 40, 7, 3.5, 90, 24.0),
    (18, '2024-07-02', 128.70, 79, 38, 8, 3.7, 88, 25.1),
    (18, '2024-07-03', 132.20, 82, 41, 6, 3.2, 92, 23.4),
    (18, '2024-07-04', 131.50, 81, 39, 9, 2.5, 89, 24.8),
    (18, '2024-07-05', 129.80, 80, 37, 10, 2.8, 87, 25.3),
    (18, '2024-07-06', 127.90, 78, 36, 8, 5.9, 85, 26.0),
    (18, '2024-07-07', 130.00, 80, 40, 7, 3.0, 89, 24.6),
    (18, '2024-07-08', 132.50, 82, 42, 5, 3.0, 91, 23.5),

    -- Data for Cell Tower 18 (August 2024)
    (18, '2024-08-01', 134.10, 83, 43, 7, 1.1, 95, 22.2),
    (18, '2024-08-02', 133.00, 82, 42, 6, 3.0, 94, 23.0),
    (18, '2024-08-03', 132.70, 81, 40, 8, 3.7, 93, 23.6),
    (18, '2024-08-04', 131.20, 79, 39, 10, 3.2, 90, 24.4),
    (18, '2024-08-05', 135.40, 84, 43, 7, 1.4, 97, 21.7),
    (18, '2024-08-06', 133.80, 82, 41, 9, 1.8, 94, 22.6),
    (18, '2024-08-07', 131.90, 80, 38, 8, 5.0, 92, 24.0),
    (18, '2024-08-08', 134.30, 83, 42, 7, 2.3, 96, 22.0),

    -- Data for Cell Tower 18 (September 2024)
    (18, '2024-09-01', 132.10, 81, 39, 10, 2.0, 91, 23.8),
    (18, '2024-09-02', 130.80, 80, 37, 8, 5.8, 89, 24.7),
    (18, '2024-09-03', 133.60, 82, 41, 7, 3.0, 93, 23.3),
    (18, '2024-09-04', 134.50, 84, 42, 6, 2.5, 95, 22.5),
    (18, '2024-09-05', 129.90, 78, 38, 9, 4.9, 88, 25.0),
    (18, '2024-09-06', 131.70, 80, 39, 8, 4.0, 90, 24.1),
    (18, '2024-09-07', 135.00, 85, 43, 7, 1.2, 98, 21.4),
    (18, '2024-09-08', 133.90, 83, 41, 5, 4.1, 94, 22.8),

    -- Data for Cell Tower 18 (October 2024)
    (18, '2024-10-01', 136.40, 86, 44, 6, 0.4, 99, 20.7),
    (18, '2024-10-02', 134.70, 84, 42, 7, 1.7, 96, 21.9),
    (18, '2024-10-03', 133.20, 82, 40, 9, 2.0, 94, 22.6),
    (18, '2024-10-04', 137.00, 87, 45, 5, 0.8, 100, 20.3),
    (18, '2024-10-05', 135.10, 84, 43, 8, 1.5, 97, 21.5),
    (18, '2024-10-06', 132.90, 81, 41, 7, 3.0, 93, 23.4),
    (18, '2024-10-07', 130.50, 79, 38, 10, 3.5, 89, 24.5),
    (18, '2024-10-08', 134.80, 83, 40, 6, 5.0, 95, 22.1);

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
    (1, '2021-10-01', 4400.00, 52.0),
    (1, '2021-10-05', 4385.00, 52.5),
    (1, '2021-10-10', 4365.00, 53.0),
    (1, '2021-10-15', 4350.00, 53.5),
    (1, '2021-10-20', 4330.00, 54.0),
    (1, '2021-10-25', 4315.00, 54.5),
    (1, '2021-10-30', 4300.00, 55.0),
    -- 2023
    (1, '2022-08-01', 5000.00, 45.0),
    (1, '2022-09-01', 4950.00, 46.0),
    (1, '2022-10-01', 4900.00, 47.0),
    (1, '2022-10-05', 4925.00, 46.5),
    -- 2022
    (1, '2023-08-01', 5400.00, 40.0),
    (1, '2023-09-01', 5350.00, 41.0),
    (1, '2023-10-01', 5300.00, 42.0),
    (1, '2023-10-05', 5325.00, 41.5),
    -- 2021 (highest carbon emissions, lowest renewable energy percentage)
    (1, '2024-08-01', 6000.00, 35.0),
    (1, '2024-09-01', 5950.00, 36.0),
    (1, '2024-10-01', 5900.00, 37.0),
    (1, '2024-10-05', 5925.00, 36.5),

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

INSERT data_center_energy_consumption (data_center_id, date, total_energy_mwh, it_energy_mwh, cooling_energy_mwh, backup_power_energy_mwh, lighting_energy_mwh, pue, cue, wue)
SELECT * FROM (VALUES
(1, '2021-11-01', 12686.97, 4731.97, 6595.5, 1068.65, 290.85, 1.59, 0.45, 1.37),
(1, '2021-11-02', 12235.92, 5118.07, 6074.55, 544.68, 498.62, 1.66, 0.42, 1.2),
(1, '2021-11-03', 12395.13, 5183.24, 5918.3, 635.58, 658.01, 1.61, 0.55, 1.45),
(1, '2021-11-04', 12216.68, 4814.13, 6527.24, 356.22, 519.1, 1.71, 0.56, 1.46),
(1, '2021-11-05', 12357.0, 4911.24, 6560.7, 434.55, 450.52, 1.71, 0.44, 1.46),
(1, '2021-11-06', 12864.75, 5236.81, 6803.3, 627.85, 196.8, 1.6, 0.5, 1.38),
(1, '2021-11-07', 12955.61, 4989.13, 6529.04, 1110.24, 327.2, 1.64, 0.55, 1.28),
(1, '2021-11-08', 12115.93, 5014.48, 5887.55, 534.1, 679.8, 1.59, 0.55, 1.41),
(1, '2021-11-09', 12359.03, 4757.26, 6209.09, 806.09, 586.58, 1.62, 0.59, 1.29),
(1, '2021-11-10', 12450.74, 4850.13, 6682.42, 674.17, 244.03, 1.66, 0.44, 1.45),
(1, '2021-12-01', 12236.45, 4917.98, 5865.01, 966.48, 486.97, 1.66, 0.46, 1.33),
(1, '2021-12-02', 12806.16, 5031.8, 6524.38, 389.79, 860.19, 1.61, 0.47, 1.25),
(1, '2021-12-03', 12570.73, 4781.51, 6183.17, 977.84, 628.21, 1.7, 0.57, 1.36),
(1, '2021-12-04', 12750.55, 5483.68, 5944.29, 1084.97, 237.61, 1.63, 0.42, 1.42),
(1, '2021-12-05', 12716.32, 5238.4, 6006.54, 775.35, 696.03, 1.59, 0.5, 1.41),
(1, '2021-12-06', 12957.39, 5470.69, 6508.23, 535.52, 442.95, 1.6, 0.54, 1.28),
(1, '2021-12-07', 12260.08, 4974.21, 5878.79, 919.14, 487.94, 1.65, 0.56, 1.38),
(1, '2021-12-08', 12174.64, 5087.11, 5655.42, 781.46, 650.66, 1.68, 0.55, 1.38),
(1, '2021-12-09', 12319.13, 5327.79, 5613.39, 818.88, 559.08, 1.7, 0.4, 1.43),
(1, '2021-12-10', 12644.63, 5145.85, 6429.05, 717.86, 351.87, 1.6, 0.57, 1.25),
(1, '2022-11-01', 11226.32, 4652.55, 5842.25, 551.32, 180.2, 1.7, 0.49, 1.46),
(1, '2022-11-02', 11495.26, 4358.53, 5634.92, 1036.61, 465.2, 1.64, 0.46, 1.32),
(1, '2022-11-03', 11622.5, 4947.53, 5775.6, 712.48, 186.89, 1.67, 0.52, 1.43),
(1, '2022-11-04', 11210.55, 4716.67, 5410.03, 542.24, 541.6, 1.69, 0.4, 1.24),
(1, '2022-11-05', 11056.8, 4503.71, 5206.16, 909.75, 437.18, 1.62, 0.55, 1.41),
(1, '2022-11-06', 11173.16, 5132.19, 5196.91, 499.23, 344.83, 1.71, 0.6, 1.37),
(1, '2022-11-07', 11081.79, 4332.75, 5346.06, 992.4, 410.58, 1.67, 0.49, 1.33),
(1, '2022-11-08', 12324.08, 5128.44, 6083.22, 767.0, 345.41, 1.61, 0.56, 1.41),
(1, '2022-11-09', 11486.96, 4909.34, 5604.84, 778.23, 194.55, 1.61, 0.48, 1.24),
(1, '2022-11-10', 11950.1, 4815.26, 5758.51, 1046.82, 329.5, 1.62, 0.42, 1.45),
(1, '2022-12-01', 11417.24, 4746.46, 5509.21, 877.93, 283.64, 1.68, 0.5, 1.32),
(1, '2022-12-02', 11589.08, 4687.25, 5739.23, 933.56, 229.04, 1.7, 0.55, 1.26),
(1, '2022-12-03', 11483.53, 4451.51, 5953.74, 844.27, 234.01, 1.68, 0.49, 1.25),
(1, '2022-12-04', 12387.34, 5485.37, 6016.41, 546.17, 339.39, 1.68, 0.43, 1.24),
(1, '2022-12-05', 12312.65, 5033.78, 6172.56, 399.37, 706.93, 1.7, 0.44, 1.37),
(1, '2022-12-06', 12240.48, 5094.63, 6325.58, 520.33, 299.95, 1.69, 0.54, 1.22),
(1, '2022-12-07', 11864.83, 4809.86, 5982.92, 814.53, 257.52, 1.68, 0.53, 1.45),
(1, '2022-12-08', 12169.78, 4993.53, 5906.55, 955.78, 313.92, 1.67, 0.46, 1.29),
(1, '2022-12-09', 12278.39, 4714.25, 6581.75, 679.03, 303.37, 1.6, 0.54, 1.29),
(1, '2022-12-10', 11962.05, 4527.07, 6287.39, 584.92, 562.67, 1.72, 0.53, 1.37),
(1, '2023-11-01', 11904.86, 4930.16, 5586.01, 770.08, 618.61, 1.67, 0.42, 1.45),
(1, '2023-11-02', 11189.42, 4514.63, 5831.11, 628.21, 215.47, 1.71, 0.57, 1.46),
(1, '2023-11-03', 11160.81, 4482.82, 5343.51, 917.87, 416.62, 1.66, 0.57, 1.27),
(1, '2023-11-04', 11107.61, 3984.95, 5875.15, 726.49, 521.01, 1.61, 0.59, 1.42),
(1, '2023-11-05', 11908.75, 5078.72, 5685.41, 765.04, 379.58, 1.7, 0.42, 1.2),
(1, '2023-11-06', 11408.66, 4505.07, 5670.8, 855.58, 377.22, 1.6, 0.46, 1.32),
(1, '2023-11-07', 11332.76, 4332.56, 5859.85, 555.1, 585.24, 1.63, 0.51, 1.44),
(1, '2023-11-08', 11817.98, 5017.38, 5791.87, 583.18, 425.55, 1.64, 0.5, 1.24),
(1, '2023-11-09', 11294.21, 4834.48, 5492.2, 514.55, 452.98, 1.65, 0.47, 1.36),
(1, '2023-11-10', 11909.95, 4844.18, 6596.11, 346.61, 123.04, 1.72, 0.47, 1.34),
(1, '2023-12-01', 11429.72, 4767.64, 5841.38, 675.91, 144.79, 1.71, 0.48, 1.33),
(1, '2023-12-02', 11821.03, 4230.75, 6058.6, 968.61, 563.08, 1.67, 0.58, 1.37),
(1, '2023-12-03', 11513.35, 4607.39, 5715.92, 701.51, 488.53, 1.6, 0.4, 1.31),
(1, '2023-12-04', 11662.34, 4932.13, 5719.73, 846.44, 164.04, 1.69, 0.59, 1.43),
(1, '2023-12-05', 11233.66, 4606.24, 5632.66, 406.22, 588.54, 1.65, 0.58, 1.35),
(1, '2023-12-06', 11398.95, 4710.71, 6203.9, 357.76, 126.58, 1.71, 0.45, 1.32),
(1, '2023-12-07', 11839.59, 4851.53, 5997.85, 612.89, 377.32, 1.66, 0.57, 1.36),
(1, '2023-12-08', 11772.28, 4757.83, 6008.95, 694.58, 310.92, 1.71, 0.45, 1.37),
(1, '2023-12-09', 11499.18, 4778.28, 5643.94, 596.26, 480.7, 1.71, 0.57, 1.36),
(1, '2023-12-10', 11126.15, 4694.07, 5331.49, 961.72, 138.87, 1.65, 0.58, 1.48),
(1, '2024-11-01', 10312.7, 3751.32, 5198.87, 776.78, 585.73, 1.59, 0.59, 1.45),
(1, '2024-11-02', 10301.85, 3892.85, 5137.33, 688.58, 583.08, 1.6, 0.4, 1.41),
(1, '2024-11-03', 11444.02, 4884.13, 5703.42, 358.12, 498.35, 1.63, 0.41, 1.41),
(1, '2024-11-04', 10782.42, 4548.85, 5323.35, 580.64, 329.58, 1.65, 0.52, 1.46),
(1, '2024-11-05', 10403.92, 4335.08, 4977.07, 743.82, 347.95, 1.61, 0.54, 1.23),
(1, '2024-11-06', 10911.22, 4210.62, 5657.11, 623.21, 420.28, 1.59, 0.41, 1.38),
(1, '2024-11-07', 11875.7, 4560.66, 6404.2, 795.83, 115.01, 1.65, 0.53, 1.33),
(1, '2024-11-08', 11200.42, 4556.83, 5388.13, 615.87, 639.6, 1.64, 0.49, 1.44),
(1, '2024-11-09', 11475.06, 4849.04, 5817.85, 464.03, 344.14, 1.7, 0.46, 1.42),
(1, '2024-11-10', 10128.71, 4269.06, 4852.23, 769.87, 237.54, 1.59, 0.59, 1.43),
(1, '2024-12-01', 10803.98, 4434.86, 4975.4, 884.55, 509.17, 1.68, 0.51, 1.38),
(1, '2024-12-02', 10710.74, 4011.64, 5675.5, 596.31, 427.29, 1.61, 0.43, 1.25),
(1, '2024-12-03', 10742.91, 4442.17, 5265.33, 915.47, 119.95, 1.62, 0.6, 1.38),
(1, '2024-12-04', 11579.81, 4657.62, 5733.26, 763.88, 425.05, 1.6, 0.41, 1.48),
(1, '2024-12-05', 10403.11, 4148.11, 5300.43, 624.03, 330.54, 1.6, 0.56, 1.41),
(1, '2024-12-06', 10120.63, 3850.77, 5169.39, 861.37, 239.09, 1.67, 0.53, 1.29),
(1, '2024-12-07', 10174.79, 3865.6, 4933.35, 923.03, 452.81, 1.65, 0.58, 1.36),
(1, '2024-12-08', 10798.88, 4405.72, 5289.43, 529.53, 574.2, 1.68, 0.49, 1.47),
(1, '2024-12-09', 10935.88, 4459.15, 5197.14, 815.09, 464.5, 1.61, 0.46, 1.43),
(1, '2024-12-10', 11762.67, 4854.12, 6072.46, 497.56, 338.53, 1.71, 0.42, 1.35),
(2, '2021-11-01', 13463.18, 5007.15, 6945.39, 643.78, 866.85, 1.65, 0.51, 1.21),
(2, '2021-11-02', 12998.0, 5726.97, 6242.51, 558.09, 470.43, 1.66, 0.55, 1.43),
(2, '2021-11-03', 12938.03, 5554.54, 6191.01, 544.12, 648.36, 1.63, 0.41, 1.25),
(2, '2021-11-04', 13013.06, 5498.21, 6589.68, 607.94, 317.23, 1.66, 0.48, 1.26),
(2, '2021-11-05', 13450.91, 5714.09, 5934.81, 1125.66, 676.35, 1.7, 0.54, 1.32),
(2, '2021-11-06', 13383.69, 5365.03, 7223.68, 383.2, 411.78, 1.71, 0.5, 1.47),
(2, '2021-11-07', 13041.02, 5512.21, 6482.43, 442.77, 603.6, 1.62, 0.41, 1.3),
(2, '2021-11-08', 13391.97, 5349.69, 6625.05, 532.23, 885.0, 1.68, 0.55, 1.29),
(2, '2021-11-09', 13291.59, 5333.39, 6714.23, 889.45, 354.52, 1.62, 0.52, 1.44),
(2, '2021-11-10', 12951.92, 5230.88, 6609.97, 900.94, 210.13, 1.66, 0.51, 1.47),
(2, '2021-12-01', 13063.97, 5512.73, 6638.75, 551.9, 360.59, 1.66, 0.51, 1.35),
(2, '2021-12-02', 13129.48, 5148.53, 6279.46, 931.74, 769.75, 1.63, 0.42, 1.27),
(2, '2021-12-03', 13400.07, 5402.46, 7063.55, 733.57, 200.49, 1.64, 0.43, 1.42),
(2, '2021-12-04', 13286.97, 5594.52, 6558.1, 823.84, 310.52, 1.72, 0.41, 1.44),
(2, '2021-12-05', 13054.88, 4716.57, 6797.22, 1124.3, 416.79, 1.66, 0.45, 1.43),
(2, '2021-12-06', 13329.48, 5686.22, 6806.71, 438.09, 398.45, 1.63, 0.45, 1.36),
(2, '2021-12-07', 13221.39, 4992.9, 6540.57, 926.71, 761.21, 1.69, 0.59, 1.45),
(2, '2021-12-08', 13130.83, 5332.06, 6702.41, 805.83, 290.53, 1.71, 0.52, 1.32),
(2, '2021-12-09', 13003.67, 5177.74, 6560.12, 788.05, 477.76, 1.69, 0.55, 1.29),
(2, '2021-12-10', 13255.01, 5361.49, 6356.86, 888.75, 647.92, 1.58, 0.42, 1.27),
(2, '2022-11-01', 12284.15, 4818.21, 6401.08, 482.87, 581.98, 1.65, 0.52, 1.42),
(2, '2022-11-02', 12014.78, 5140.19, 6182.03, 555.38, 137.18, 1.67, 0.41, 1.21),
(2, '2022-11-03', 12401.25, 5092.06, 5883.14, 1018.96, 407.09, 1.67, 0.46, 1.38),
(2, '2022-11-04', 12717.83, 5501.65, 5745.85, 1103.93, 366.4, 1.68, 0.48, 1.42),
(2, '2022-11-05', 12717.57, 4742.57, 6419.6, 815.01, 740.39, 1.7, 0.51, 1.29),
(2, '2022-11-06', 12797.38, 5313.33, 6558.81, 495.13, 430.11, 1.6, 0.45, 1.32),
(2, '2022-11-07', 12476.09, 4857.53, 6160.52, 694.88, 763.15, 1.69, 0.47, 1.31),
(2, '2022-11-08', 12212.37, 4781.9, 6436.2, 848.66, 145.61, 1.66, 0.4, 1.47),
(2, '2022-11-09', 12226.96, 4618.77, 6292.22, 971.0, 344.97, 1.61, 0.55, 1.31),
(2, '2022-11-10', 12439.24, 5237.09, 6200.86, 405.53, 595.75, 1.7, 0.58, 1.22),
(2, '2022-12-01', 12501.69, 4857.46, 6168.63, 670.78, 804.82, 1.59, 0.46, 1.43),
(2, '2022-12-02', 12171.22, 4890.88, 6334.8, 811.16, 134.38, 1.66, 0.5, 1.28),
(2, '2022-12-03', 12711.04, 5127.17, 6377.06, 794.26, 412.55, 1.59, 0.52, 1.29),
(2, '2022-12-04', 12186.64, 4726.43, 6455.98, 358.34, 645.89, 1.61, 0.52, 1.45),
(2, '2022-12-05', 12794.94, 5254.56, 6212.51, 1067.56, 260.31, 1.7, 0.59, 1.31),
(2, '2022-12-06', 12252.2, 5121.12, 5932.26, 666.14, 532.68, 1.65, 0.47, 1.21),
(2, '2022-12-07', 12229.36, 5124.21, 6201.94, 352.61, 550.6, 1.62, 0.59, 1.35),
(2, '2022-12-08', 12467.35, 5024.51, 6052.35, 838.56, 551.93, 1.61, 0.48, 1.39),
(2, '2022-12-09', 12375.6, 4703.01, 6275.34, 755.08, 642.17, 1.67, 0.59, 1.25),
(2, '2022-12-10', 12040.82, 5191.95, 6252.62, 407.55, 188.7, 1.59, 0.45, 1.31),
(2, '2023-11-01', 11738.59, 4645.78, 5731.49, 984.96, 376.36, 1.62, 0.59, 1.42),
(2, '2023-11-02', 11740.96, 4986.25, 5384.02, 774.19, 596.5, 1.69, 0.56, 1.33),
(2, '2023-11-03', 11551.48, 5185.9, 5722.46, 362.56, 280.56, 1.67, 0.41, 1.41),
(2, '2023-11-04', 11850.77, 4621.82, 6066.21, 973.32, 189.41, 1.62, 0.53, 1.21),
(2, '2023-11-05', 11775.15, 4585.68, 5777.25, 911.72, 500.51, 1.64, 0.51, 1.47),
(2, '2023-11-06', 11595.81, 5147.19, 5508.51, 724.54, 215.58, 1.58, 0.44, 1.37),
(2, '2023-11-07', 11667.03, 4198.92, 6082.62, 931.27, 454.23, 1.59, 0.48, 1.36),
(2, '2023-11-08', 11623.09, 4688.33, 6264.57, 551.65, 118.54, 1.64, 0.55, 1.3),
(2, '2023-11-09', 11609.09, 4627.28, 5807.02, 871.35, 303.44, 1.6, 0.41, 1.42),
(2, '2023-11-10', 11613.73, 4923.5, 5595.1, 444.46, 650.67, 1.61, 0.49, 1.21),
(2, '2023-12-01', 11688.95, 4287.57, 6154.12, 997.92, 249.33, 1.72, 0.49, 1.36),
(2, '2023-12-02', 11550.68, 4752.16, 6041.61, 361.11, 395.8, 1.63, 0.49, 1.47),
(2, '2023-12-03', 11976.3, 4584.86, 5874.84, 935.7, 580.9, 1.66, 0.42, 1.31),
(2, '2023-12-04', 11952.09, 4777.65, 5967.12, 797.88, 409.43, 1.65, 0.41, 1.37),
(2, '2023-12-05', 11798.29, 4724.82, 6142.18, 754.38, 176.91, 1.61, 0.46, 1.31),
(2, '2023-12-06', 11599.02, 4316.55, 6070.44, 540.4, 671.64, 1.61, 0.57, 1.45),
(2, '2023-12-07', 11940.92, 4488.69, 6459.48, 507.75, 485.0, 1.66, 0.54, 1.38),
(2, '2023-12-08', 11555.37, 4661.08, 6195.24, 578.8, 120.25, 1.59, 0.57, 1.48),
(2, '2023-12-09', 11739.37, 4625.55, 5398.62, 970.0, 745.19, 1.64, 0.58, 1.33),
(2, '2023-12-10', 11942.09, 4754.73, 5756.32, 871.23, 559.82, 1.69, 0.58, 1.48),
(2, '2024-11-01', 11628.91, 4789.73, 5378.45, 1015.93, 444.8, 1.71, 0.52, 1.28),
(2, '2024-11-02', 11701.95, 4854.91, 5777.34, 892.68, 177.02, 1.69, 0.43, 1.3),
(2, '2024-11-03', 11591.2, 4663.88, 5367.86, 838.17, 721.3, 1.63, 0.57, 1.23),
(2, '2024-11-04', 11180.02, 4752.4, 5211.43, 719.66, 496.53, 1.62, 0.54, 1.48),
(2, '2024-11-05', 11556.11, 5271.5, 5522.7, 492.78, 269.13, 1.65, 0.51, 1.43),
(2, '2024-11-06', 11080.84, 4793.24, 5463.44, 629.18, 194.97, 1.72, 0.5, 1.36),
(2, '2024-11-07', 11791.84, 4771.25, 6343.34, 445.39, 231.86, 1.6, 0.41, 1.32),
(2, '2024-11-08', 11019.25, 4025.19, 5584.67, 858.17, 551.22, 1.64, 0.51, 1.25),
(2, '2024-11-09', 11310.19, 4551.16, 5770.2, 544.27, 444.56, 1.68, 0.52, 1.26),
(2, '2024-11-10', 11971.92, 4952.01, 6195.99, 575.57, 248.35, 1.66, 0.5, 1.39),
(2, '2024-12-01', 11495.33, 4397.12, 5895.89, 665.4, 536.92, 1.61, 0.48, 1.3),
(2, '2024-12-02', 11293.85, 4481.64, 6022.54, 469.18, 320.49, 1.72, 0.52, 1.41),
(2, '2024-12-03', 11517.89, 5283.16, 5441.21, 404.13, 389.38, 1.6, 0.42, 1.47),
(2, '2024-12-04', 11806.66, 4742.7, 5829.51, 780.43, 454.02, 1.65, 0.43, 1.28),
(2, '2024-12-05', 11191.94, 4927.71, 5090.79, 519.48, 653.96, 1.7, 0.58, 1.3),
(2, '2024-12-06', 11492.93, 4873.98, 5825.98, 302.61, 490.36, 1.68, 0.57, 1.31),
(2, '2024-12-07', 11476.72, 5147.69, 5553.05, 475.42, 300.56, 1.58, 0.46, 1.35),
(2, '2024-12-08', 11147.88, 4885.57, 5766.17, 355.65, 140.5, 1.68, 0.41, 1.39),
(2, '2024-12-09', 11348.15, 4596.2, 5301.03, 899.81, 551.11, 1.72, 0.45, 1.24),
(2, '2024-12-10', 11152.05, 4503.02, 5612.14, 453.68, 583.22, 1.68, 0.47, 1.22),
(3, '2021-11-01', 10203.4, 4298.88, 5226.91, 391.68, 285.93, 1.59, 0.57, 1.44),
(3, '2021-11-02', 10072.86, 3932.03, 5292.38, 692.21, 156.24, 1.6, 0.56, 1.28),
(3, '2021-11-03', 10023.22, 4020.78, 4871.34, 755.11, 375.98, 1.7, 0.54, 1.21),
(3, '2021-11-04', 10248.22, 4376.93, 5013.53, 338.66, 519.1, 1.64, 0.41, 1.47),
(3, '2021-11-05', 10285.21, 4292.61, 4799.19, 626.05, 567.36, 1.61, 0.56, 1.44),
(3, '2021-11-06', 10441.88, 4454.19, 5001.09, 409.47, 577.13, 1.7, 0.59, 1.38),
(3, '2021-11-07', 10336.51, 4384.57, 4841.0, 667.36, 443.59, 1.62, 0.45, 1.46),
(3, '2021-11-08', 10264.2, 4222.31, 4596.13, 810.53, 635.23, 1.65, 0.55, 1.36),
(3, '2021-11-09', 10168.53, 3923.06, 5175.77, 694.29, 375.41, 1.59, 0.48, 1.46),
(3, '2021-11-10', 10113.3, 3924.94, 4920.23, 687.53, 580.6, 1.66, 0.42, 1.41),
(3, '2021-12-01', 10458.14, 4216.46, 5470.72, 530.73, 240.23, 1.7, 0.52, 1.47),
(3, '2021-12-02', 10136.89, 3974.17, 4981.74, 596.61, 584.37, 1.61, 0.5, 1.2),
(3, '2021-12-03', 10376.58, 3989.31, 5350.57, 570.45, 466.25, 1.69, 0.43, 1.27),
(3, '2021-12-04', 10205.68, 4088.69, 4812.49, 752.96, 551.53, 1.69, 0.43, 1.38),
(3, '2021-12-05', 10303.83, 4096.35, 5620.66, 453.23, 133.58, 1.72, 0.5, 1.32),
(3, '2021-12-06', 10222.05, 4170.14, 5023.95, 592.39, 435.57, 1.64, 0.48, 1.36),
(3, '2021-12-07', 10114.39, 4344.42, 4751.39, 919.52, 99.06, 1.66, 0.54, 1.34),
(3, '2021-12-08', 10227.95, 4205.99, 5141.79, 740.13, 140.04, 1.6, 0.51, 1.24),
(3, '2021-12-09', 10287.17, 4357.98, 5242.39, 369.59, 317.21, 1.6, 0.42, 1.32),
(3, '2021-12-10', 10225.75, 4178.4, 5112.46, 572.75, 362.14, 1.59, 0.49, 1.4),
(3, '2022-11-01', 9934.81, 4245.23, 5173.45, 400.28, 115.85, 1.67, 0.46, 1.4),
(3, '2022-11-02', 9894.79, 4004.1, 4984.54, 513.29, 392.86, 1.62, 0.44, 1.24),
(3, '2022-11-03', 9966.86, 4184.42, 5131.86, 313.4, 337.18, 1.64, 0.6, 1.24),
(3, '2022-11-04', 9705.68, 4205.88, 4893.81, 284.05, 321.94, 1.62, 0.47, 1.39),
(3, '2022-11-05', 9872.88, 3904.04, 4983.93, 566.08, 418.82, 1.64, 0.41, 1.3),
(3, '2022-11-06', 9796.45, 3967.07, 5143.73, 387.67, 297.98, 1.7, 0.41, 1.47),
(3, '2022-11-07', 9957.66, 4064.87, 5015.19, 357.65, 519.94, 1.64, 0.53, 1.27),
(3, '2022-11-08', 9748.26, 3454.27, 4943.48, 762.96, 587.55, 1.71, 0.43, 1.41),
(3, '2022-11-09', 9706.22, 4259.8, 4469.74, 462.88, 513.8, 1.63, 0.59, 1.27),
(3, '2022-11-10', 9809.84, 4099.57, 4935.63, 408.48, 366.16, 1.62, 0.42, 1.29),
(3, '2022-12-01', 9882.27, 3914.55, 4838.7, 554.45, 574.57, 1.67, 0.43, 1.3),
(3, '2022-12-02', 9817.15, 3727.03, 5571.8, 367.01, 151.31, 1.68, 0.46, 1.39),
(3, '2022-12-03', 9900.3, 3948.71, 5170.87, 370.87, 409.85, 1.69, 0.53, 1.29),
(3, '2022-12-04', 9768.62, 4266.24, 5035.24, 361.86, 105.27, 1.66, 0.43, 1.27),
(3, '2022-12-05', 9912.97, 4045.76, 4608.86, 821.06, 437.29, 1.64, 0.58, 1.43),
(3, '2022-12-06', 9984.41, 3734.19, 5341.83, 654.27, 254.12, 1.59, 0.44, 1.24),
(3, '2022-12-07', 9946.0, 3964.7, 5022.95, 847.88, 110.47, 1.66, 0.59, 1.3),
(3, '2022-12-08', 9889.47, 4123.56, 4683.62, 724.62, 357.67, 1.61, 0.52, 1.39),
(3, '2022-12-09', 9848.51, 4345.64, 5068.48, 322.35, 112.04, 1.67, 0.57, 1.33),
(3, '2022-12-10', 9836.81, 3609.97, 5342.63, 761.59, 122.62, 1.72, 0.58, 1.47),
(3, '2023-11-01', 9501.27, 4108.72, 4374.35, 655.84, 362.36, 1.62, 0.56, 1.23),
(3, '2023-11-02', 9676.64, 4015.48, 4901.97, 293.04, 466.14, 1.71, 0.53, 1.43),
(3, '2023-11-03', 9471.33, 3878.33, 4767.12, 510.57, 315.31, 1.63, 0.59, 1.35),
(3, '2023-11-04', 9672.07, 3970.63, 4695.2, 461.42, 544.83, 1.61, 0.5, 1.41),
(3, '2023-11-05', 9427.08, 3476.75, 4719.59, 660.75, 569.98, 1.61, 0.44, 1.44),
(3, '2023-11-06', 9588.76, 3964.08, 4858.69, 309.47, 456.52, 1.71, 0.41, 1.23),
(3, '2023-11-07', 9569.01, 4242.14, 4442.6, 663.18, 221.09, 1.67, 0.53, 1.38),
(3, '2023-11-08', 9561.34, 3992.45, 4580.77, 499.39, 488.73, 1.6, 0.59, 1.22),
(3, '2023-11-09', 9609.92, 3870.34, 4673.94, 798.69, 266.94, 1.64, 0.5, 1.25),
(3, '2023-11-10', 9698.63, 3946.09, 4931.83, 362.06, 458.65, 1.6, 0.41, 1.41),
(3, '2023-12-01', 9431.88, 3600.95, 4982.83, 275.1, 573.0, 1.68, 0.52, 1.35),
(3, '2023-12-02', 9475.46, 3861.68, 4991.43, 515.21, 107.14, 1.72, 0.59, 1.46),
(3, '2023-12-03', 9434.78, 3846.22, 4386.61, 730.11, 471.83, 1.7, 0.41, 1.21),
(3, '2023-12-04', 9649.0, 3770.97, 4496.27, 806.37, 575.39, 1.67, 0.49, 1.31),
(3, '2023-12-05', 9457.89, 4203.1, 4588.23, 469.73, 196.83, 1.63, 0.59, 1.38),
(3, '2023-12-06', 9684.69, 3705.95, 4603.17, 791.13, 584.43, 1.63, 0.45, 1.47),
(3, '2023-12-07', 9473.88, 3551.43, 4962.09, 663.01, 297.35, 1.7, 0.56, 1.27),
(3, '2023-12-08', 9601.1, 4233.03, 4572.74, 628.02, 167.31, 1.62, 0.42, 1.39),
(3, '2023-12-09', 9501.28, 4109.92, 4917.18, 305.62, 168.56, 1.66, 0.53, 1.25),
(3, '2023-12-10', 9437.95, 4000.86, 4731.11, 376.34, 329.64, 1.65, 0.45, 1.4),
(3, '2024-11-01', 9365.84, 3885.46, 4911.74, 477.07, 91.56, 1.64, 0.43, 1.47),
(3, '2024-11-02', 9318.97, 3763.58, 4774.31, 564.83, 216.25, 1.61, 0.54, 1.26),
(3, '2024-11-03', 9132.74, 3811.32, 4490.93, 274.53, 555.95, 1.65, 0.43, 1.3),
(3, '2024-11-04', 9335.75, 4060.91, 4429.91, 407.59, 437.35, 1.68, 0.44, 1.45),
(3, '2024-11-05', 9216.03, 3884.71, 4509.33, 524.5, 297.49, 1.62, 0.46, 1.39),
(3, '2024-11-06', 9392.4, 3930.05, 4426.79, 491.08, 544.48, 1.7, 0.55, 1.27),
(3, '2024-11-07', 9301.34, 3660.65, 5101.59, 300.93, 238.17, 1.66, 0.46, 1.4),
(3, '2024-11-08', 9306.17, 4032.45, 4444.32, 566.27, 263.13, 1.69, 0.57, 1.28),
(3, '2024-11-09', 9247.12, 4164.18, 4493.82, 310.08, 279.04, 1.59, 0.53, 1.46),
(3, '2024-11-10', 9036.57, 3763.89, 4385.39, 462.1, 425.19, 1.59, 0.54, 1.37),
(3, '2024-12-01', 9338.7, 3766.67, 4506.38, 597.81, 467.84, 1.71, 0.47, 1.4),
(3, '2024-12-02', 9023.07, 3739.04, 4512.3, 553.09, 218.63, 1.59, 0.46, 1.22),
(3, '2024-12-03', 9242.97, 3655.4, 4583.89, 603.61, 400.06, 1.68, 0.54, 1.41),
(3, '2024-12-04', 9144.24, 3668.74, 4810.77, 475.71, 189.02, 1.69, 0.47, 1.32),
(3, '2024-12-05', 9180.7, 3919.35, 4138.67, 616.03, 506.65, 1.71, 0.4, 1.36),
(3, '2024-12-06', 9081.44, 3598.25, 4639.15, 530.56, 313.48, 1.62, 0.43, 1.37),
(3, '2024-12-07', 9189.66, 3515.61, 4460.6, 695.84, 517.61, 1.61, 0.58, 1.22),
(3, '2024-12-08', 9343.79, 4016.92, 4373.38, 444.98, 508.51, 1.7, 0.53, 1.21),
(3, '2024-12-09', 9207.53, 3651.01, 4715.64, 384.03, 456.86, 1.59, 0.52, 1.38),
(3, '2024-12-10', 9347.78, 4028.14, 4359.9, 794.79, 164.95, 1.72, 0.43, 1.34),
(4, '2021-11-01', 8597.58, 3188.06, 4686.48, 290.78, 432.27, 1.68, 0.51, 1.37),
(4, '2021-11-02', 8248.98, 3455.89, 3787.04, 567.72, 438.33, 1.66, 0.54, 1.35),
(4, '2021-11-03', 8231.39, 3394.15, 4044.0, 683.38, 109.86, 1.59, 0.46, 1.21),
(4, '2021-11-04', 8631.0, 3448.57, 4157.66, 649.75, 375.02, 1.6, 0.47, 1.36),
(4, '2021-11-05', 8615.82, 3495.43, 4245.32, 350.82, 524.25, 1.64, 0.45, 1.23),
(4, '2021-11-06', 8252.98, 3403.24, 4054.34, 458.72, 336.69, 1.67, 0.46, 1.22),
(4, '2021-11-07', 8524.88, 3499.17, 4196.98, 593.31, 235.43, 1.65, 0.56, 1.26),
(4, '2021-11-08', 8302.09, 3411.22, 4191.3, 317.46, 382.12, 1.69, 0.56, 1.28),
(4, '2021-11-09', 8220.99, 3244.21, 4056.71, 445.07, 475.0, 1.61, 0.48, 1.3),
(4, '2021-11-10', 8346.18, 3669.29, 3791.79, 623.96, 261.14, 1.61, 0.47, 1.46),
(4, '2021-12-01', 8246.99, 3524.04, 4153.2, 211.83, 357.91, 1.63, 0.45, 1.27),
(4, '2021-12-02', 8257.59, 3271.34, 3798.54, 686.26, 501.44, 1.72, 0.48, 1.43),
(4, '2021-12-03', 8682.46, 3620.16, 4413.66, 548.76, 99.88, 1.63, 0.57, 1.37),
(4, '2021-12-04', 8644.94, 3422.21, 4108.55, 628.87, 485.3, 1.65, 0.45, 1.34),
(4, '2021-12-05', 8681.21, 3853.59, 4244.41, 252.46, 330.75, 1.67, 0.41, 1.46),
(4, '2021-12-06', 8404.13, 3613.29, 4169.42, 475.76, 145.67, 1.72, 0.43, 1.47),
(4, '2021-12-07', 8692.52, 3864.78, 4083.64, 419.33, 324.77, 1.69, 0.52, 1.26),
(4, '2021-12-08', 8541.26, 3605.37, 4029.06, 384.05, 522.78, 1.71, 0.49, 1.31),
(4, '2021-12-09', 8295.38, 3633.36, 3887.51, 476.28, 298.23, 1.59, 0.52, 1.28),
(4, '2021-12-10', 8291.69, 3230.5, 4516.92, 343.94, 200.34, 1.71, 0.49, 1.21),
(4, '2022-11-01', 8247.65, 3545.58, 4294.75, 317.03, 90.29, 1.59, 0.54, 1.26),
(4, '2022-11-02', 8512.39, 3582.75, 4214.7, 441.15, 273.79, 1.71, 0.55, 1.33),
(4, '2022-11-03', 8286.94, 3528.96, 4061.24, 588.04, 108.7, 1.61, 0.53, 1.35),
(4, '2022-11-04', 8301.28, 3505.95, 3827.46, 722.61, 245.26, 1.59, 0.57, 1.45),
(4, '2022-11-05', 8552.39, 3428.73, 4418.07, 391.52, 314.08, 1.59, 0.44, 1.25),
(4, '2022-11-06', 8371.1, 3105.39, 4325.37, 746.59, 193.75, 1.68, 0.49, 1.22),
(4, '2022-11-07', 8628.46, 3357.15, 4113.8, 760.12, 397.38, 1.59, 0.58, 1.47),
(4, '2022-11-08', 8639.91, 3570.46, 4274.57, 263.51, 531.36, 1.69, 0.5, 1.34),
(4, '2022-11-09', 8381.45, 3480.38, 4284.22, 427.05, 189.8, 1.65, 0.54, 1.4),
(4, '2022-11-10', 8578.24, 3280.69, 4347.01, 459.78, 490.76, 1.65, 0.59, 1.23),
(4, '2022-12-01', 8315.89, 3437.87, 4152.23, 478.05, 247.75, 1.71, 0.41, 1.42),
(4, '2022-12-02', 8624.06, 3473.78, 4472.41, 227.1, 450.77, 1.62, 0.44, 1.24),
(4, '2022-12-03', 8456.56, 3554.37, 4108.58, 361.67, 431.94, 1.7, 0.48, 1.23),
(4, '2022-12-04', 8487.72, 3305.91, 4404.97, 409.96, 366.88, 1.6, 0.4, 1.47),
(4, '2022-12-05', 8206.44, 3509.14, 4237.99, 256.84, 202.47, 1.64, 0.41, 1.26),
(4, '2022-12-06', 8540.07, 3445.3, 4132.71, 714.16, 247.9, 1.58, 0.51, 1.44),
(4, '2022-12-07', 8282.97, 3304.76, 4108.7, 357.43, 512.08, 1.63, 0.49, 1.26),
(4, '2022-12-08', 8559.64, 3739.53, 4229.84, 254.51, 335.76, 1.64, 0.6, 1.22),
(4, '2022-12-09', 8683.03, 3648.75, 4260.8, 436.09, 337.39, 1.68, 0.48, 1.38),
(4, '2022-12-10', 8602.05, 3528.65, 4331.78, 655.2, 86.42, 1.63, 0.47, 1.25),
(4, '2023-11-01', 8500.5, 3659.11, 4291.43, 460.67, 89.29, 1.6, 0.45, 1.29),
(4, '2023-11-02', 8430.59, 3597.58, 4116.94, 578.1, 137.97, 1.59, 0.59, 1.36),
(4, '2023-11-03', 8479.24, 3698.51, 4024.86, 340.26, 415.6, 1.71, 0.43, 1.35),
(4, '2023-11-04', 8695.45, 3515.0, 4436.96, 230.9, 512.58, 1.59, 0.6, 1.37),
(4, '2023-11-05', 8697.79, 3603.44, 3995.26, 703.7, 395.38, 1.64, 0.48, 1.22),
(4, '2023-11-06', 8529.18, 3430.26, 4011.55, 637.66, 449.71, 1.62, 0.57, 1.44),
(4, '2023-11-07', 8642.35, 3339.87, 4412.62, 496.96, 392.9, 1.65, 0.41, 1.4),
(4, '2023-11-08', 8370.73, 3315.05, 4138.09, 602.2, 315.38, 1.67, 0.42, 1.21),
(4, '2023-11-09', 8300.66, 3516.64, 3901.97, 531.29, 350.75, 1.66, 0.55, 1.4),
(4, '2023-11-10', 8513.78, 3326.94, 4122.6, 600.39, 463.85, 1.64, 0.43, 1.45),
(4, '2023-12-01', 8617.42, 3479.21, 4209.26, 629.26, 299.68, 1.65, 0.56, 1.36),
(4, '2023-12-02', 8415.86, 3760.05, 3989.9, 317.62, 348.28, 1.61, 0.51, 1.32),
(4, '2023-12-03', 8636.57, 3604.52, 4108.86, 666.66, 256.53, 1.69, 0.51, 1.43),
(4, '2023-12-04', 8698.94, 3671.8, 4440.43, 419.15, 167.56, 1.61, 0.46, 1.38),
(4, '2023-12-05', 8451.97, 3511.79, 3958.53, 447.66, 534.0, 1.7, 0.44, 1.27),
(4, '2023-12-06', 8379.68, 3584.16, 4114.92, 339.28, 341.31, 1.63, 0.44, 1.46),
(4, '2023-12-07', 8452.76, 3405.82, 4448.5, 361.94, 236.5, 1.66, 0.48, 1.3),
(4, '2023-12-08', 8483.42, 3510.8, 4341.03, 513.96, 117.63, 1.68, 0.44, 1.46),
(4, '2023-12-09', 8621.92, 3751.99, 4421.31, 257.59, 191.04, 1.68, 0.48, 1.26),
(4, '2023-12-10', 8595.08, 3563.46, 4343.5, 466.34, 221.78, 1.65, 0.4, 1.37),
(4, '2024-11-01', 8712.72, 3934.46, 4158.76, 295.93, 323.57, 1.6, 0.52, 1.27),
(4, '2024-11-02', 8644.61, 3310.61, 4229.85, 621.9, 482.25, 1.62, 0.54, 1.21),
(4, '2024-11-03', 8597.79, 3416.08, 4508.62, 442.51, 230.59, 1.6, 0.57, 1.26),
(4, '2024-11-04', 8631.76, 3547.96, 4479.89, 266.76, 337.15, 1.69, 0.48, 1.37),
(4, '2024-11-05', 8713.08, 3595.8, 4325.5, 553.29, 238.49, 1.65, 0.53, 1.36),
(4, '2024-11-06', 8761.39, 3819.41, 4188.23, 649.43, 104.33, 1.58, 0.56, 1.21),
(4, '2024-11-07', 8417.01, 3685.78, 4101.41, 518.72, 111.09, 1.6, 0.53, 1.26),
(4, '2024-11-08', 8605.9, 3575.93, 4111.67, 549.5, 368.8, 1.65, 0.48, 1.21),
(4, '2024-11-09', 8690.28, 3952.65, 4283.16, 260.24, 194.22, 1.71, 0.49, 1.4),
(4, '2024-11-10', 8655.82, 3256.59, 4335.96, 676.24, 387.03, 1.63, 0.58, 1.23),
(4, '2024-12-01', 8682.27, 3791.44, 4121.92, 435.07, 333.84, 1.66, 0.46, 1.3),
(4, '2024-12-02', 8752.51, 3548.66, 4261.31, 776.77, 165.77, 1.59, 0.5, 1.25),
(4, '2024-12-03', 8467.07, 3400.16, 3895.04, 649.39, 522.48, 1.6, 0.54, 1.36),
(4, '2024-12-04', 8530.03, 3182.8, 4581.18, 672.78, 93.27, 1.68, 0.42, 1.47),
(4, '2024-12-05', 8619.89, 3427.68, 4048.29, 714.45, 429.47, 1.6, 0.51, 1.2),
(4, '2024-12-06', 8599.79, 3606.1, 4155.88, 336.96, 500.86, 1.65, 0.55, 1.28),
(4, '2024-12-07', 8526.42, 3462.77, 3933.86, 628.59, 501.19, 1.6, 0.4, 1.21),
(4, '2024-12-08', 8713.03, 3694.52, 4520.8, 275.05, 222.66, 1.71, 0.49, 1.4),
(4, '2024-12-09', 8517.99, 3180.81, 4169.93, 684.12, 483.14, 1.71, 0.53, 1.35),
(4, '2024-12-10', 8442.75, 3572.26, 4119.33, 395.54, 355.61, 1.62, 0.48, 1.25),
(5, '2021-11-01', 8576.35, 3468.2, 4195.14, 421.18, 491.83, 1.71, 0.42, 1.38),
(5, '2021-11-02', 8610.48, 3822.65, 4325.69, 349.26, 112.87, 1.71, 0.57, 1.45),
(5, '2021-11-03', 8596.54, 3540.78, 4080.56, 724.36, 250.83, 1.6, 0.51, 1.4),
(5, '2021-11-04', 8577.05, 3323.51, 4428.12, 608.15, 217.27, 1.58, 0.51, 1.39),
(5, '2021-11-05', 8591.64, 3551.32, 4185.8, 545.16, 309.36, 1.7, 0.58, 1.42),
(5, '2021-11-06', 8289.6, 3488.85, 3720.68, 632.8, 447.27, 1.7, 0.44, 1.34),
(5, '2021-11-07', 8435.35, 3168.4, 4554.45, 406.04, 306.46, 1.72, 0.57, 1.37),
(5, '2021-11-08', 8606.7, 3663.55, 4019.61, 427.32, 496.21, 1.67, 0.5, 1.43),
(5, '2021-11-09', 8548.34, 3452.5, 4332.83, 432.0, 331.01, 1.61, 0.59, 1.31),
(5, '2021-11-10', 8216.25, 3823.13, 4014.19, 278.55, 100.38, 1.64, 0.44, 1.29),
(5, '2021-12-01', 8572.98, 3491.78, 4024.88, 677.3, 379.02, 1.66, 0.54, 1.41),
(5, '2021-12-02', 8372.47, 3190.98, 4240.57, 656.58, 284.34, 1.59, 0.48, 1.45),
(5, '2021-12-03', 8630.7, 3236.45, 4677.97, 430.64, 285.64, 1.7, 0.43, 1.34),
(5, '2021-12-04', 8379.83, 3046.21, 4281.42, 730.05, 322.15, 1.68, 0.56, 1.37),
(5, '2021-12-05', 8594.88, 3805.95, 4170.14, 286.42, 332.37, 1.63, 0.51, 1.26),
(5, '2021-12-06', 8230.94, 3117.58, 4115.21, 593.95, 404.2, 1.59, 0.54, 1.25),
(5, '2021-12-07', 8250.75, 3276.55, 3873.03, 746.94, 354.23, 1.58, 0.43, 1.36),
(5, '2021-12-08', 8412.83, 3556.68, 4209.11, 300.41, 346.63, 1.65, 0.53, 1.44),
(5, '2021-12-09', 8605.11, 3823.6, 3907.36, 475.31, 398.84, 1.69, 0.47, 1.22),
(5, '2021-12-10', 8206.48, 3540.59, 3951.22, 513.59, 201.08, 1.71, 0.52, 1.35),
(5, '2022-11-01', 8313.09, 3689.65, 3932.15, 507.46, 183.83, 1.64, 0.46, 1.33),
(5, '2022-11-02', 8553.32, 3266.63, 4312.91, 518.76, 455.03, 1.62, 0.6, 1.37),
(5, '2022-11-03', 8384.01, 3158.93, 4312.1, 613.78, 299.19, 1.65, 0.48, 1.42),
(5, '2022-11-04', 8234.83, 3505.21, 4018.55, 500.23, 210.84, 1.69, 0.51, 1.2),
(5, '2022-11-05', 8530.25, 3640.52, 4042.02, 761.25, 86.47, 1.64, 0.58, 1.38),
(5, '2022-11-06', 8376.76, 3417.36, 4103.93, 639.52, 215.94, 1.63, 0.46, 1.28),
(5, '2022-11-07', 8211.93, 3365.05, 4302.99, 280.64, 263.25, 1.69, 0.48, 1.38),
(5, '2022-11-08', 8537.48, 3626.96, 3997.8, 637.21, 275.51, 1.63, 0.6, 1.34),
(5, '2022-11-09', 8558.08, 3183.59, 4348.45, 697.41, 328.63, 1.7, 0.51, 1.24),
(5, '2022-11-10', 8622.94, 3948.02, 4076.96, 492.85, 105.11, 1.69, 0.57, 1.22),
(5, '2022-12-01', 8206.68, 3477.09, 4274.15, 326.14, 129.3, 1.63, 0.57, 1.22),
(5, '2022-12-02', 8429.74, 3579.83, 4027.66, 561.74, 260.5, 1.6, 0.45, 1.25),
(5, '2022-12-03', 8663.64, 3297.08, 4105.6, 750.89, 510.07, 1.68, 0.55, 1.43),
(5, '2022-12-04', 8458.84, 3270.43, 4312.05, 470.85, 405.51, 1.71, 0.56, 1.31),
(5, '2022-12-05', 8595.26, 3877.63, 4342.44, 270.0, 105.2, 1.64, 0.6, 1.28),
(5, '2022-12-06', 8472.02, 3388.74, 4221.83, 369.28, 492.17, 1.69, 0.48, 1.43),
(5, '2022-12-07', 8514.05, 3138.35, 4508.15, 694.56, 172.98, 1.58, 0.51, 1.33),
(5, '2022-12-08', 8369.12, 3146.01, 4243.14, 684.99, 294.98, 1.66, 0.52, 1.35),
(5, '2022-12-09', 8398.38, 3349.12, 4440.98, 266.66, 341.62, 1.65, 0.46, 1.31),
(5, '2022-12-10', 8459.15, 3522.6, 4193.69, 590.97, 151.89, 1.62, 0.49, 1.22),
(5, '2023-11-01', 8583.25, 3458.63, 4289.04, 311.66, 523.91, 1.71, 0.58, 1.23),
(5, '2023-11-02', 8597.3, 3616.66, 4303.48, 342.99, 334.18, 1.66, 0.41, 1.41),
(5, '2023-11-03', 8561.99, 3592.74, 4153.26, 682.27, 133.72, 1.62, 0.48, 1.34),
(5, '2023-11-04', 8658.29, 3448.9, 4358.76, 705.74, 144.89, 1.62, 0.59, 1.21),
(5, '2023-11-05', 8676.95, 3498.84, 4211.12, 601.42, 365.57, 1.64, 0.47, 1.21),
(5, '2023-11-06', 8571.12, 3264.2, 4219.92, 568.25, 518.76, 1.59, 0.54, 1.43),
(5, '2023-11-07', 8314.83, 3310.07, 4045.87, 583.47, 375.42, 1.63, 0.41, 1.38),
(5, '2023-11-08', 8673.02, 3326.7, 4576.38, 582.33, 187.61, 1.71, 0.43, 1.35),
(5, '2023-11-09', 8317.64, 3342.76, 4179.49, 436.8, 358.59, 1.6, 0.59, 1.33),
(5, '2023-11-10', 8482.79, 3166.85, 4294.14, 671.68, 350.12, 1.71, 0.44, 1.21),
(5, '2023-12-01', 8554.4, 3510.55, 4425.93, 425.27, 192.65, 1.69, 0.41, 1.3),
(5, '2023-12-02', 8505.97, 3205.85, 4419.63, 523.71, 356.78, 1.64, 0.44, 1.4),
(5, '2023-12-03', 8370.55, 3395.09, 4082.41, 623.36, 269.7, 1.66, 0.57, 1.47),
(5, '2023-12-04', 8508.71, 3416.53, 4266.39, 276.42, 549.37, 1.67, 0.5, 1.23),
(5, '2023-12-05', 8536.68, 3269.88, 4324.21, 713.65, 228.94, 1.65, 0.59, 1.38),
(5, '2023-12-06', 8432.63, 3265.24, 4540.03, 265.49, 361.87, 1.68, 0.6, 1.29),
(5, '2023-12-07', 8698.81, 3366.78, 4713.28, 392.51, 226.25, 1.65, 0.42, 1.22),
(5, '2023-12-08', 8691.97, 3592.44, 4158.29, 750.12, 191.12, 1.66, 0.48, 1.38),
(5, '2023-12-09', 8569.4, 3618.99, 3930.55, 775.53, 244.34, 1.6, 0.45, 1.23),
(5, '2023-12-10', 8445.72, 3590.17, 4134.1, 534.56, 186.89, 1.66, 0.52, 1.38),
(5, '2024-11-01', 7660.62, 2911.97, 3793.59, 618.79, 336.28, 1.67, 0.5, 1.26),
(5, '2024-11-02', 7723.09, 3361.19, 3745.05, 528.7, 88.16, 1.69, 0.5, 1.33),
(5, '2024-11-03', 7454.44, 3073.56, 3848.03, 343.18, 189.67, 1.61, 0.53, 1.32),
(5, '2024-11-04', 7627.09, 2992.84, 4166.71, 283.48, 184.06, 1.58, 0.53, 1.36),
(5, '2024-11-05', 7652.89, 3183.01, 3664.07, 493.77, 312.04, 1.64, 0.6, 1.36),
(5, '2024-11-06', 7430.11, 3094.08, 3358.26, 568.17, 409.61, 1.68, 0.48, 1.47),
(5, '2024-11-07', 7633.18, 2975.34, 3808.1, 609.02, 240.73, 1.61, 0.55, 1.45),
(5, '2024-11-08', 7401.06, 2821.57, 3935.51, 264.47, 379.51, 1.64, 0.53, 1.42),
(5, '2024-11-09', 7491.07, 3156.53, 3747.57, 384.37, 202.6, 1.64, 0.53, 1.3),
(5, '2024-11-10', 7414.63, 3134.0, 3689.45, 377.49, 213.69, 1.69, 0.59, 1.27),
(5, '2024-12-01', 7669.39, 2816.64, 3962.41, 637.78, 252.56, 1.58, 0.57, 1.31),
(5, '2024-12-02', 7681.16, 3108.12, 3823.9, 457.26, 291.88, 1.72, 0.59, 1.21),
(5, '2024-12-03', 7444.69, 2894.77, 3614.2, 524.87, 410.85, 1.71, 0.56, 1.34),
(5, '2024-12-04', 7690.21, 3214.57, 3876.11, 228.92, 370.61, 1.6, 0.51, 1.4),
(5, '2024-12-05', 7723.87, 3280.6, 3628.38, 353.23, 461.66, 1.65, 0.57, 1.45),
(5, '2024-12-06', 7521.99, 2888.08, 3667.2, 615.54, 351.17, 1.59, 0.53, 1.21),
(5, '2024-12-07', 7758.12, 3018.72, 3890.56, 496.59, 352.25, 1.59, 0.55, 1.47),
(5, '2024-12-08', 7562.98, 3343.87, 3713.16, 368.69, 137.26, 1.63, 0.48, 1.47),
(5, '2024-12-09', 7794.46, 3333.95, 3798.77, 310.75, 350.99, 1.69, 0.58, 1.35),
(5, '2024-12-10', 7586.24, 3039.52, 3865.45, 388.62, 292.64, 1.72, 0.55, 1.24),
(6, '2021-11-01', 11363.22, 4523.44, 5832.98, 718.08, 288.72, 1.64, 0.42, 1.37),
(6, '2021-11-02', 11350.51, 4916.2, 5552.2, 712.42, 169.68, 1.63, 0.47, 1.24),
(6, '2021-11-03', 11209.29, 4518.58, 5855.49, 645.33, 189.89, 1.58, 0.5, 1.39),
(6, '2021-11-04', 11397.86, 4204.82, 6077.04, 433.17, 682.83, 1.69, 0.5, 1.47),
(6, '2021-11-05', 11269.19, 4710.23, 5839.14, 583.05, 136.77, 1.6, 0.54, 1.4),
(6, '2021-11-06', 11216.51, 4526.13, 5806.23, 626.91, 257.25, 1.71, 0.44, 1.37),
(6, '2021-11-07', 11147.27, 4483.74, 5575.11, 778.39, 310.03, 1.63, 0.56, 1.44),
(6, '2021-11-08', 11092.45, 4560.1, 5666.3, 720.65, 145.4, 1.61, 0.47, 1.28),
(6, '2021-11-09', 11332.74, 4272.04, 5696.23, 973.5, 390.97, 1.67, 0.46, 1.41),
(6, '2021-11-10', 11264.01, 4491.59, 5885.52, 711.52, 175.38, 1.71, 0.56, 1.24),
(6, '2021-12-01', 11204.79, 4728.15, 5518.29, 564.14, 394.2, 1.68, 0.46, 1.39),
(6, '2021-12-02', 11391.5, 5164.22, 5558.7, 547.62, 120.96, 1.61, 0.58, 1.43),
(6, '2021-12-03', 11349.93, 4704.96, 5245.2, 789.14, 610.64, 1.63, 0.47, 1.39),
(6, '2021-12-04', 11049.14, 4298.78, 5535.97, 822.82, 391.57, 1.66, 0.57, 1.44),
(6, '2021-12-05', 11257.62, 4588.71, 5822.78, 700.95, 145.18, 1.62, 0.47, 1.22),
(6, '2021-12-06', 11220.43, 4602.44, 5644.61, 687.64, 285.74, 1.69, 0.54, 1.48),
(6, '2021-12-07', 11326.75, 4851.56, 5338.77, 895.37, 241.05, 1.67, 0.53, 1.38),
(6, '2021-12-08', 11348.51, 4227.19, 5649.28, 985.93, 486.1, 1.69, 0.41, 1.42),
(6, '2021-12-09', 11237.39, 4752.95, 5923.34, 424.65, 136.45, 1.67, 0.42, 1.3),
(6, '2021-12-10', 11182.79, 4597.65, 5351.82, 808.46, 424.86, 1.61, 0.55, 1.38),
(6, '2022-11-01', 10658.28, 4223.17, 5230.66, 592.79, 611.66, 1.58, 0.55, 1.39),
(6, '2022-11-02', 10738.9, 3875.94, 5630.28, 634.79, 597.88, 1.61, 0.56, 1.41),
(6, '2022-11-03', 10753.71, 4220.81, 5315.52, 866.91, 350.47, 1.62, 0.48, 1.37),
(6, '2022-11-04', 10715.59, 4077.34, 5764.79, 329.97, 543.5, 1.7, 0.6, 1.38),
(6, '2022-11-05', 10713.4, 4322.12, 5651.9, 347.94, 391.45, 1.65, 0.57, 1.4),
(6, '2022-11-06', 10758.84, 4859.17, 5261.55, 409.77, 228.35, 1.61, 0.51, 1.41),
(6, '2022-11-07', 10622.05, 3958.06, 5759.6, 437.13, 467.26, 1.67, 0.53, 1.35),
(6, '2022-11-08', 10793.31, 4784.72, 5543.13, 352.28, 113.18, 1.63, 0.6, 1.46),
(6, '2022-11-09', 10748.11, 4265.59, 5655.68, 518.33, 308.51, 1.61, 0.44, 1.41),
(6, '2022-11-10', 10755.84, 4482.64, 5085.5, 898.69, 289.01, 1.69, 0.55, 1.24),
(6, '2022-12-01', 10708.9, 4328.6, 5515.6, 657.77, 206.94, 1.65, 0.53, 1.26),
(6, '2022-12-02', 10780.21, 4420.19, 5530.31, 613.8, 215.91, 1.72, 0.5, 1.37),
(6, '2022-12-03', 10715.22, 4648.41, 4954.94, 474.59, 637.27, 1.59, 0.46, 1.3),
(6, '2022-12-04', 10688.07, 4158.71, 5606.95, 506.57, 415.84, 1.62, 0.52, 1.3),
(6, '2022-12-05', 10701.15, 4894.54, 5041.65, 371.45, 393.51, 1.59, 0.44, 1.43),
(6, '2022-12-06', 10766.85, 4150.46, 5395.92, 783.13, 437.34, 1.66, 0.55, 1.31),
(6, '2022-12-07', 10710.58, 4369.29, 5476.83, 329.27, 535.19, 1.66, 0.59, 1.48),
(6, '2022-12-08', 10772.78, 4817.13, 5154.51, 674.46, 126.68, 1.66, 0.48, 1.38),
(6, '2022-12-09', 10695.14, 3987.86, 5525.7, 768.71, 412.86, 1.7, 0.48, 1.34),
(6, '2022-12-10', 10704.95, 4129.25, 5352.12, 712.15, 511.42, 1.66, 0.49, 1.35),
(6, '2023-11-01', 10230.3, 4104.8, 5168.76, 702.4, 254.34, 1.65, 0.41, 1.22),
(6, '2023-11-02', 10399.2, 4597.66, 5199.43, 396.27, 205.84, 1.65, 0.57, 1.22),
(6, '2023-11-03', 10340.15, 4088.5, 4880.53, 869.27, 501.84, 1.65, 0.55, 1.21),
(6, '2023-11-04', 10179.9, 4015.13, 5229.18, 491.17, 444.42, 1.6, 0.41, 1.29),
(6, '2023-11-05', 10225.31, 4150.64, 5388.21, 577.7, 108.76, 1.59, 0.55, 1.31),
(6, '2023-11-06', 10378.75, 4394.94, 5043.11, 618.08, 322.63, 1.67, 0.57, 1.44),
(6, '2023-11-07', 10433.91, 3946.53, 5290.82, 535.25, 661.32, 1.68, 0.59, 1.32),
(6, '2023-11-08', 10393.56, 3967.95, 5192.65, 581.11, 651.85, 1.68, 0.55, 1.42),
(6, '2023-11-09', 10372.33, 4213.52, 5435.95, 578.8, 144.07, 1.58, 0.45, 1.2),
(6, '2023-11-10', 10187.84, 4180.95, 4956.39, 879.92, 170.59, 1.7, 0.41, 1.27),
(6, '2023-12-01', 10291.01, 3782.02, 5285.5, 773.52, 449.97, 1.69, 0.46, 1.37),
(6, '2023-12-02', 10258.69, 4399.82, 4826.34, 830.07, 202.46, 1.69, 0.58, 1.48),
(6, '2023-12-03', 10359.8, 4431.8, 5369.82, 313.08, 245.1, 1.65, 0.46, 1.38),
(6, '2023-12-04', 10299.35, 4186.22, 4977.72, 789.64, 345.77, 1.71, 0.6, 1.38),
(6, '2023-12-05', 10292.43, 4007.92, 5257.32, 816.4, 210.79, 1.59, 0.4, 1.27),
(6, '2023-12-06', 10426.14, 4198.19, 5557.53, 514.5, 155.92, 1.6, 0.51, 1.32),
(6, '2023-12-07', 10209.05, 4131.36, 5045.43, 685.2, 347.05, 1.61, 0.54, 1.36),
(6, '2023-12-08', 10118.73, 4231.63, 5084.53, 658.19, 144.39, 1.63, 0.51, 1.31),
(6, '2023-12-09', 10475.63, 4380.56, 5470.05, 358.21, 266.81, 1.66, 0.56, 1.36),
(6, '2023-12-10', 10265.87, 4068.71, 5272.14, 410.97, 514.04, 1.7, 0.53, 1.21),
(6, '2024-11-01', 9899.49, 4146.37, 4966.94, 349.4, 436.78, 1.67, 0.59, 1.42),
(6, '2024-11-02', 9655.22, 3967.44, 4971.08, 387.87, 328.83, 1.59, 0.42, 1.27),
(6, '2024-11-03', 9603.52, 4204.74, 4702.24, 359.58, 336.97, 1.67, 0.47, 1.44),
(6, '2024-11-04', 9612.29, 3811.94, 4950.68, 635.3, 214.37, 1.64, 0.46, 1.27),
(6, '2024-11-05', 9839.83, 4039.87, 4875.95, 822.18, 101.83, 1.71, 0.43, 1.32),
(6, '2024-11-06', 9773.44, 4071.28, 5118.82, 346.32, 237.02, 1.62, 0.54, 1.47),
(6, '2024-11-07', 9839.26, 3843.76, 4649.88, 770.48, 575.13, 1.63, 0.55, 1.34),
(6, '2024-11-08', 9949.43, 4137.46, 5008.42, 316.15, 487.39, 1.72, 0.44, 1.41),
(6, '2024-11-09', 9837.53, 4404.53, 4849.14, 360.25, 223.61, 1.61, 0.42, 1.42),
(6, '2024-11-10', 9969.43, 4116.31, 4931.94, 754.34, 166.84, 1.59, 0.45, 1.37),
(6, '2024-12-01', 9838.01, 4318.96, 4651.79, 373.85, 493.4, 1.71, 0.58, 1.37),
(6, '2024-12-02', 9688.23, 4373.62, 4725.44, 496.72, 92.45, 1.59, 0.42, 1.36),
(6, '2024-12-03', 9888.32, 4180.65, 4967.84, 608.13, 131.71, 1.69, 0.52, 1.43),
(6, '2024-12-04', 10088.87, 4266.67, 5268.66, 453.24, 100.31, 1.62, 0.57, 1.44),
(6, '2024-12-05', 9776.81, 4314.22, 4785.14, 376.19, 301.26, 1.59, 0.45, 1.44),
(6, '2024-12-06', 9745.66, 4103.77, 4487.89, 825.5, 328.5, 1.68, 0.54, 1.28),
(6, '2024-12-07', 9907.23, 4066.91, 4896.28, 359.21, 584.82, 1.63, 0.59, 1.47),
(6, '2024-12-08', 9949.26, 4349.2, 4721.75, 284.23, 594.08, 1.71, 0.51, 1.33),
(6, '2024-12-09', 9652.68, 3935.39, 4825.98, 800.01, 91.3, 1.68, 0.45, 1.4),
(6, '2024-12-10', 9889.37, 4053.83, 5078.36, 294.56, 462.62, 1.66, 0.42, 1.3),
(7, '2021-11-01', 9384.29, 3712.19, 4800.42, 398.29, 473.39, 1.71, 0.41, 1.33),
(7, '2021-11-02', 9497.53, 3794.4, 4885.19, 560.59, 257.36, 1.72, 0.58, 1.45),
(7, '2021-11-03', 9209.06, 3963.19, 4241.79, 451.9, 552.18, 1.59, 0.44, 1.25),
(7, '2021-11-04', 9337.88, 3784.76, 4463.3, 770.36, 319.47, 1.7, 0.42, 1.41),
(7, '2021-11-05', 9376.87, 3925.18, 4919.06, 316.1, 216.53, 1.59, 0.43, 1.32),
(7, '2021-11-06', 9228.35, 3891.13, 4388.78, 685.39, 263.04, 1.64, 0.58, 1.27),
(7, '2021-11-07', 9380.05, 3740.0, 4852.42, 283.17, 504.45, 1.68, 0.48, 1.34),
(7, '2021-11-08', 9379.03, 3578.62, 4838.42, 749.58, 212.41, 1.68, 0.58, 1.25),
(7, '2021-11-09', 9338.03, 3637.34, 5075.23, 268.31, 357.14, 1.66, 0.5, 1.37),
(7, '2021-11-10', 9130.63, 3577.88, 4449.89, 695.62, 407.25, 1.71, 0.46, 1.28),
(7, '2021-12-01', 9328.86, 4279.26, 4433.23, 454.36, 162.01, 1.7, 0.45, 1.43),
(7, '2021-12-02', 9317.2, 3996.11, 4817.79, 304.64, 198.66, 1.59, 0.45, 1.23),
(7, '2021-12-03', 9194.62, 3716.33, 4579.78, 319.92, 578.58, 1.61, 0.41, 1.35),
(7, '2021-12-04', 9334.33, 3901.98, 4383.17, 548.06, 501.12, 1.62, 0.42, 1.42),
(7, '2021-12-05', 9167.75, 3853.99, 4432.78, 598.17, 282.81, 1.71, 0.6, 1.36),
(7, '2021-12-06', 9236.46, 3439.48, 4630.02, 731.29, 435.67, 1.58, 0.57, 1.36),
(7, '2021-12-07', 9429.05, 3864.67, 4606.77, 422.3, 535.32, 1.62, 0.56, 1.46),
(7, '2021-12-08', 9223.85, 3573.4, 4645.8, 756.94, 247.71, 1.7, 0.48, 1.45),
(7, '2021-12-09', 9116.94, 3619.19, 4662.51, 746.21, 89.03, 1.71, 0.49, 1.33),
(7, '2021-12-10', 9367.27, 3423.3, 4713.28, 689.83, 540.86, 1.71, 0.43, 1.47),
(7, '2022-11-01', 9264.35, 3699.11, 4699.19, 537.54, 328.51, 1.67, 0.58, 1.37),
(7, '2022-11-02', 9087.38, 3666.23, 4372.22, 719.38, 329.55, 1.6, 0.47, 1.39),
(7, '2022-11-03', 9361.07, 3936.99, 4712.56, 314.51, 397.01, 1.63, 0.59, 1.34),
(7, '2022-11-04', 9352.85, 3741.23, 4728.86, 325.19, 557.56, 1.69, 0.51, 1.34),
(7, '2022-11-05', 9089.06, 3833.79, 4104.12, 708.84, 442.31, 1.6, 0.45, 1.31),
(7, '2022-11-06', 9125.53, 4237.1, 4316.85, 336.03, 235.54, 1.64, 0.42, 1.3),
(7, '2022-11-07', 9245.49, 3661.17, 5043.83, 361.11, 179.38, 1.68, 0.58, 1.33),
(7, '2022-11-08', 9360.42, 3929.87, 4542.75, 575.19, 312.62, 1.65, 0.41, 1.23),
(7, '2022-11-09', 9181.81, 3480.74, 4690.21, 715.46, 295.4, 1.71, 0.49, 1.32),
(7, '2022-11-10', 9319.89, 4095.67, 4285.14, 561.85, 377.22, 1.61, 0.59, 1.45),
(7, '2022-12-01', 9270.13, 3503.8, 4479.37, 733.15, 553.81, 1.65, 0.41, 1.23),
(7, '2022-12-02', 9110.77, 3530.8, 4538.96, 813.59, 227.42, 1.61, 0.57, 1.33),
(7, '2022-12-03', 9258.25, 3801.53, 4549.83, 658.04, 248.85, 1.67, 0.59, 1.39),
(7, '2022-12-04', 9362.63, 3652.33, 4495.11, 716.52, 498.67, 1.7, 0.6, 1.28),
(7, '2022-12-05', 9348.02, 4092.46, 4541.86, 312.65, 401.06, 1.62, 0.44, 1.32),
(7, '2022-12-06', 9000.3, 3727.91, 4571.55, 247.01, 453.82, 1.64, 0.54, 1.23),
(7, '2022-12-07', 9113.68, 3608.35, 4339.73, 690.36, 475.24, 1.63, 0.56, 1.4),
(7, '2022-12-08', 9040.81, 3764.4, 4615.6, 335.77, 325.04, 1.7, 0.46, 1.44),
(7, '2022-12-09', 9044.98, 3491.14, 4638.28, 406.69, 508.88, 1.64, 0.4, 1.32),
(7, '2022-12-10', 9081.03, 3668.12, 4720.38, 576.45, 116.09, 1.59, 0.45, 1.37),
(7, '2023-11-01', 9190.1, 3781.31, 4685.04, 350.65, 373.1, 1.6, 0.5, 1.22),
(7, '2023-11-02', 9295.16, 3853.02, 4613.01, 496.44, 332.69, 1.71, 0.43, 1.31),
(7, '2023-11-03', 9265.61, 3773.91, 4659.78, 700.39, 131.52, 1.62, 0.44, 1.24),
(7, '2023-11-04', 8926.75, 3299.01, 4607.74, 776.35, 243.65, 1.66, 0.57, 1.47),
(7, '2023-11-05', 9294.22, 3741.18, 4428.27, 644.14, 480.63, 1.67, 0.56, 1.31),
(7, '2023-11-06', 8969.92, 3443.67, 4490.42, 617.23, 418.6, 1.72, 0.53, 1.47),
(7, '2023-11-07', 9192.43, 3578.74, 4420.76, 678.2, 514.73, 1.72, 0.42, 1.24),
(7, '2023-11-08', 9260.16, 3665.17, 4833.3, 334.71, 426.98, 1.61, 0.54, 1.32),
(7, '2023-11-09', 9221.35, 3638.63, 4642.19, 372.99, 567.54, 1.65, 0.54, 1.21),
(7, '2023-11-10', 9160.3, 3670.15, 4651.88, 630.01, 208.26, 1.61, 0.43, 1.45),
(7, '2023-12-01', 9003.46, 3700.59, 4719.45, 455.96, 127.46, 1.6, 0.48, 1.29),
(7, '2023-12-02', 8920.09, 3933.59, 4471.96, 428.37, 86.18, 1.59, 0.43, 1.26),
(7, '2023-12-03', 9096.75, 4059.92, 4214.16, 606.23, 216.44, 1.63, 0.42, 1.43),
(7, '2023-12-04', 8930.53, 3456.31, 4457.21, 721.03, 295.98, 1.66, 0.46, 1.39),
(7, '2023-12-05', 9037.11, 3875.77, 4586.63, 399.72, 174.99, 1.59, 0.51, 1.38),
(7, '2023-12-06', 9188.28, 3735.06, 4586.94, 437.92, 428.36, 1.61, 0.52, 1.46),
(7, '2023-12-07', 9078.09, 3683.3, 4658.95, 444.74, 291.1, 1.61, 0.41, 1.41),
(7, '2023-12-08', 8915.85, 3839.37, 4389.23, 519.74, 167.5, 1.65, 0.59, 1.46),
(7, '2023-12-09', 9217.32, 3388.57, 4942.28, 593.51, 292.95, 1.63, 0.5, 1.43),
(7, '2023-12-10', 9263.65, 3739.75, 4626.26, 523.16, 374.49, 1.62, 0.41, 1.3),
(7, '2024-11-01', 9193.41, 4055.08, 4393.4, 602.77, 142.17, 1.65, 0.57, 1.4),
(7, '2024-11-02', 8822.65, 3767.07, 4245.87, 423.41, 386.3, 1.7, 0.55, 1.31),
(7, '2024-11-03', 9160.58, 3743.82, 4931.49, 369.68, 115.6, 1.62, 0.56, 1.48),
(7, '2024-11-04', 9015.21, 3783.92, 4716.93, 321.31, 193.04, 1.6, 0.44, 1.48),
(7, '2024-11-05', 8838.55, 3352.3, 4428.57, 662.93, 394.75, 1.67, 0.45, 1.44),
(7, '2024-11-06', 9005.23, 3559.92, 4804.55, 273.07, 367.69, 1.63, 0.43, 1.42),
(7, '2024-11-07', 9029.8, 3306.96, 4716.25, 449.92, 556.68, 1.63, 0.55, 1.46),
(7, '2024-11-08', 8903.93, 3641.58, 4328.8, 499.54, 434.01, 1.68, 0.56, 1.45),
(7, '2024-11-09', 9071.84, 4069.68, 4273.07, 273.57, 455.53, 1.66, 0.47, 1.41),
(7, '2024-11-10', 9154.59, 3995.63, 4205.44, 604.69, 348.83, 1.62, 0.56, 1.32),
(7, '2024-12-01', 9002.64, 3959.59, 4163.95, 774.0, 105.11, 1.71, 0.48, 1.41),
(7, '2024-12-02', 8846.35, 3716.98, 4328.97, 699.75, 100.66, 1.61, 0.59, 1.36),
(7, '2024-12-03', 9110.16, 3598.87, 4414.14, 707.94, 389.22, 1.68, 0.41, 1.42),
(7, '2024-12-04', 9011.17, 3882.5, 4190.82, 418.55, 519.3, 1.62, 0.42, 1.33),
(7, '2024-12-05', 8993.48, 3691.62, 4717.71, 394.37, 189.78, 1.64, 0.51, 1.48),
(7, '2024-12-06', 8905.07, 3785.63, 4539.31, 323.94, 256.19, 1.64, 0.44, 1.22),
(7, '2024-12-07', 8815.51, 3837.76, 4553.78, 264.91, 159.05, 1.6, 0.56, 1.28),
(7, '2024-12-08', 9117.03, 3564.59, 4756.59, 373.85, 421.99, 1.63, 0.43, 1.32),
(7, '2024-12-09', 8814.61, 3627.78, 4480.85, 628.92, 77.06, 1.64, 0.51, 1.26),
(7, '2024-12-10', 9186.02, 3799.92, 4671.83, 327.14, 387.13, 1.61, 0.56, 1.44),
(8, '2021-11-01', 7680.13, 3435.85, 3627.24, 279.59, 337.45, 1.68, 0.44, 1.28),
(8, '2021-11-02', 7663.55, 3110.1, 3816.53, 329.9, 407.03, 1.62, 0.42, 1.46),
(8, '2021-11-03', 7754.17, 2772.86, 4035.44, 617.63, 328.24, 1.68, 0.47, 1.26),
(8, '2021-11-04', 7671.88, 2820.61, 4175.16, 330.0, 346.1, 1.6, 0.48, 1.43),
(8, '2021-11-05', 7600.4, 3157.22, 3614.32, 492.93, 335.93, 1.65, 0.47, 1.26),
(8, '2021-11-06', 7785.94, 2807.95, 3985.01, 673.24, 319.74, 1.6, 0.4, 1.2),
(8, '2021-11-07', 7786.26, 2919.57, 4194.74, 590.27, 81.68, 1.58, 0.43, 1.28),
(8, '2021-11-08', 7679.5, 3261.36, 3717.9, 336.84, 363.4, 1.63, 0.42, 1.24),
(8, '2021-11-09', 7531.65, 2869.56, 3838.15, 622.43, 201.51, 1.58, 0.54, 1.21),
(8, '2021-11-10', 7583.14, 3048.95, 3698.48, 533.55, 302.16, 1.7, 0.42, 1.44),
(8, '2021-12-01', 7669.42, 3277.02, 3765.29, 430.33, 196.78, 1.58, 0.52, 1.44),
(8, '2021-12-02', 7633.67, 2954.02, 3879.47, 417.12, 383.06, 1.61, 0.42, 1.38),
(8, '2021-12-03', 7551.99, 3065.34, 3675.52, 509.04, 302.09, 1.68, 0.48, 1.31),
(8, '2021-12-04', 7667.3, 3055.94, 3532.48, 608.47, 470.41, 1.67, 0.51, 1.22),
(8, '2021-12-05', 7556.43, 2828.09, 3751.4, 575.04, 401.91, 1.7, 0.48, 1.48),
(8, '2021-12-06', 7728.93, 3173.63, 3817.81, 373.19, 364.3, 1.6, 0.53, 1.25),
(8, '2021-12-07', 7672.74, 3414.02, 3794.05, 384.98, 79.69, 1.59, 0.57, 1.29),
(8, '2021-12-08', 7602.95, 2965.97, 3928.92, 537.83, 170.24, 1.61, 0.56, 1.23),
(8, '2021-12-09', 7547.61, 3137.1, 3584.73, 631.53, 194.24, 1.69, 0.55, 1.34),
(8, '2021-12-10', 7556.65, 3067.71, 3738.85, 318.24, 431.86, 1.65, 0.47, 1.31),
(8, '2022-11-01', 7840.16, 3194.3, 3822.11, 452.52, 371.23, 1.68, 0.48, 1.24),
(8, '2022-11-02', 7665.87, 3079.01, 3548.56, 580.54, 457.76, 1.6, 0.47, 1.37),
(8, '2022-11-03', 7733.64, 3305.77, 3824.51, 462.86, 140.5, 1.61, 0.45, 1.42),
(8, '2022-11-04', 7849.28, 3338.83, 3766.21, 402.66, 341.58, 1.58, 0.41, 1.46),
(8, '2022-11-05', 7712.46, 3215.45, 3769.02, 438.24, 289.74, 1.68, 0.59, 1.38),
(8, '2022-11-06', 7877.35, 3208.0, 3754.62, 599.18, 315.55, 1.6, 0.45, 1.22),
(8, '2022-11-07', 7654.35, 3202.26, 3806.57, 461.45, 184.08, 1.68, 0.49, 1.24),
(8, '2022-11-08', 7779.54, 3272.42, 3659.06, 470.26, 377.8, 1.65, 0.58, 1.44),
(8, '2022-11-09', 7838.27, 3000.26, 3741.64, 650.41, 445.96, 1.69, 0.54, 1.34),
(8, '2022-11-10', 7644.49, 3060.16, 3782.6, 612.73, 189.01, 1.69, 0.45, 1.39),
(8, '2022-12-01', 7758.97, 3092.33, 4216.85, 341.71, 108.08, 1.66, 0.53, 1.37),
(8, '2022-12-02', 7666.58, 2748.92, 3908.93, 587.18, 421.56, 1.64, 0.4, 1.2),
(8, '2022-12-03', 7856.58, 3219.9, 3700.17, 491.65, 444.85, 1.71, 0.52, 1.42),
(8, '2022-12-04', 7622.2, 3254.31, 3693.57, 368.62, 305.7, 1.61, 0.6, 1.48),
(8, '2022-12-05', 7852.92, 3594.86, 3808.95, 253.43, 195.68, 1.63, 0.47, 1.21),
(8, '2022-12-06', 7847.74, 3157.28, 3864.15, 685.58, 140.74, 1.64, 0.53, 1.34),
(8, '2022-12-07', 7740.99, 3276.31, 3795.88, 569.48, 99.32, 1.67, 0.5, 1.47),
(8, '2022-12-08', 7835.88, 3292.75, 3776.39, 409.67, 357.07, 1.58, 0.59, 1.24),
(8, '2022-12-09', 7648.87, 3176.66, 3560.35, 485.36, 426.5, 1.62, 0.46, 1.25),
(8, '2022-12-10', 7782.62, 3086.07, 3670.11, 598.39, 428.05, 1.66, 0.5, 1.28),
(8, '2023-11-01', 7834.19, 3356.34, 3834.83, 373.42, 269.6, 1.68, 0.45, 1.33),
(8, '2023-11-02', 7722.83, 2973.67, 3678.77, 653.79, 416.61, 1.63, 0.52, 1.29),
(8, '2023-11-03', 7950.5, 3318.04, 3740.29, 578.61, 313.56, 1.7, 0.41, 1.36),
(8, '2023-11-04', 7987.27, 2924.83, 4285.27, 301.02, 476.15, 1.7, 0.44, 1.39),
(8, '2023-11-05', 7804.96, 3177.28, 4020.34, 470.39, 136.96, 1.65, 0.49, 1.21),
(8, '2023-11-06', 7849.59, 3480.57, 3736.48, 300.63, 331.9, 1.6, 0.53, 1.28),
(8, '2023-11-07', 7993.58, 3385.25, 3858.94, 637.38, 112.01, 1.61, 0.49, 1.36),
(8, '2023-11-08', 7700.61, 3105.84, 3954.93, 426.11, 213.73, 1.63, 0.41, 1.31),
(8, '2023-11-09', 7936.44, 3095.7, 4105.93, 627.74, 107.07, 1.7, 0.59, 1.47),
(8, '2023-11-10', 7920.47, 3016.08, 3944.68, 640.85, 318.85, 1.68, 0.42, 1.35),
(8, '2023-12-01', 7963.21, 3130.62, 3868.09, 636.71, 327.78, 1.66, 0.57, 1.47),
(8, '2023-12-02', 7788.65, 3580.42, 3879.51, 243.21, 85.51, 1.65, 0.56, 1.32),
(8, '2023-12-03', 7822.6, 3044.46, 4223.13, 480.24, 74.77, 1.64, 0.43, 1.44),
(8, '2023-12-04', 7866.05, 2963.13, 3870.06, 571.16, 461.7, 1.65, 0.58, 1.45),
(8, '2023-12-05', 7818.76, 3009.52, 4123.74, 482.57, 202.92, 1.59, 0.55, 1.32),
(8, '2023-12-06', 7797.45, 3222.26, 3860.99, 552.55, 161.65, 1.7, 0.54, 1.37),
(8, '2023-12-07', 7724.7, 2940.65, 4046.27, 548.14, 189.64, 1.72, 0.5, 1.34),
(8, '2023-12-08', 7905.78, 2921.71, 4156.34, 579.95, 247.77, 1.58, 0.53, 1.38),
(8, '2023-12-09', 7961.94, 3205.14, 3811.46, 458.76, 486.57, 1.63, 0.42, 1.25),
(8, '2023-12-10', 7783.01, 3186.77, 3947.57, 487.5, 161.17, 1.58, 0.58, 1.35),
(8, '2024-11-01', 7867.66, 3096.16, 4060.35, 390.82, 320.34, 1.71, 0.53, 1.39),
(8, '2024-11-02', 7933.56, 3130.12, 4031.1, 349.31, 423.03, 1.67, 0.46, 1.26),
(8, '2024-11-03', 7956.52, 3294.78, 3993.6, 488.51, 179.63, 1.67, 0.44, 1.27),
(8, '2024-11-04', 7848.63, 3065.23, 3947.07, 339.27, 497.06, 1.59, 0.57, 1.37),
(8, '2024-11-05', 7965.42, 3533.23, 3818.72, 524.19, 89.27, 1.66, 0.52, 1.45),
(8, '2024-11-06', 7916.11, 3192.5, 3949.08, 551.55, 222.99, 1.65, 0.6, 1.42),
(8, '2024-11-07', 7949.29, 2887.42, 4157.98, 421.74, 482.15, 1.61, 0.47, 1.39),
(8, '2024-11-08', 7951.0, 3155.61, 4140.38, 255.52, 399.5, 1.67, 0.51, 1.27),
(8, '2024-11-09', 7973.49, 3420.69, 3646.59, 552.13, 354.07, 1.62, 0.6, 1.37),
(8, '2024-11-10', 7852.58, 3120.54, 4003.94, 630.96, 97.14, 1.62, 0.53, 1.38),
(8, '2024-12-01', 7920.23, 2983.99, 3856.2, 683.01, 397.03, 1.69, 0.41, 1.27),
(8, '2024-12-02', 8062.13, 3418.36, 3894.46, 597.54, 151.76, 1.67, 0.45, 1.32),
(8, '2024-12-03', 8066.93, 3219.31, 4104.75, 616.64, 126.22, 1.64, 0.6, 1.36),
(8, '2024-12-04', 8005.54, 3448.7, 3837.95, 281.7, 437.2, 1.66, 0.5, 1.26),
(8, '2024-12-05', 7847.37, 3071.11, 4040.53, 617.58, 118.14, 1.66, 0.52, 1.37),
(8, '2024-12-06', 8073.26, 3544.33, 3877.73, 520.22, 130.98, 1.59, 0.52, 1.35),
(8, '2024-12-07', 7853.08, 3301.52, 3921.71, 329.01, 300.84, 1.66, 0.41, 1.43),
(8, '2024-12-08', 8006.52, 3145.5, 4187.96, 433.32, 239.74, 1.64, 0.51, 1.33),
(8, '2024-12-09', 7846.63, 3165.74, 4010.41, 448.44, 222.05, 1.59, 0.42, 1.28),
(8, '2024-12-10', 7899.69, 3095.19, 4128.71, 229.38, 446.41, 1.65, 0.41, 1.32),
(9, '2021-11-01', 12392.05, 5067.53, 5702.78, 946.06, 675.67, 1.71, 0.48, 1.45),
(9, '2021-11-02', 12436.69, 4890.16, 6239.89, 716.23, 590.41, 1.64, 0.53, 1.21),
(9, '2021-11-03', 12304.42, 5081.41, 6168.12, 618.92, 435.97, 1.58, 0.42, 1.25),
(9, '2021-11-04', 12671.78, 4953.26, 6426.48, 1031.08, 260.95, 1.61, 0.48, 1.22),
(9, '2021-11-05', 12277.34, 4835.83, 6038.79, 916.77, 485.94, 1.65, 0.53, 1.23),
(9, '2021-11-06', 12460.2, 5087.58, 6373.68, 502.1, 496.84, 1.7, 0.56, 1.24),
(9, '2021-11-07', 12655.49, 5282.29, 5992.42, 890.61, 490.16, 1.66, 0.43, 1.27),
(9, '2021-11-08', 12280.55, 4529.54, 6087.81, 894.24, 768.97, 1.71, 0.52, 1.21),
(9, '2021-11-09', 12343.61, 4661.71, 6046.42, 864.91, 770.56, 1.66, 0.56, 1.34),
(9, '2021-11-10', 12663.76, 5253.24, 5778.99, 1048.58, 582.94, 1.69, 0.53, 1.4),
(9, '2021-12-01', 12478.75, 4671.0, 6189.79, 905.88, 712.08, 1.62, 0.5, 1.36),
(9, '2021-12-02', 12501.72, 4884.95, 6025.76, 891.32, 699.69, 1.58, 0.54, 1.31),
(9, '2021-12-03', 12614.68, 5128.25, 6127.02, 1099.7, 259.71, 1.65, 0.54, 1.24),
(9, '2021-12-04', 12545.7, 4999.85, 6457.78, 903.79, 184.27, 1.65, 0.53, 1.35),
(9, '2021-12-05', 12264.79, 4913.94, 5847.33, 818.76, 684.76, 1.66, 0.47, 1.29),
(9, '2021-12-06', 12577.34, 4644.91, 6627.59, 554.91, 749.93, 1.64, 0.55, 1.48),
(9, '2021-12-07', 12430.25, 5155.72, 6051.17, 829.74, 393.62, 1.64, 0.41, 1.37),
(9, '2021-12-08', 12341.7, 5022.89, 5954.26, 954.79, 409.77, 1.59, 0.4, 1.44),
(9, '2021-12-09', 12342.64, 5085.75, 5794.07, 837.75, 625.07, 1.66, 0.55, 1.29),
(9, '2021-12-10', 12508.7, 5197.4, 6510.68, 605.51, 195.11, 1.63, 0.54, 1.46),
(9, '2022-11-01', 12023.17, 4677.29, 6604.19, 376.08, 365.61, 1.67, 0.46, 1.24),
(9, '2022-11-02', 12140.01, 5180.91, 6039.76, 471.76, 447.58, 1.68, 0.55, 1.2),
(9, '2022-11-03', 12257.59, 4985.31, 5776.35, 848.99, 646.94, 1.7, 0.5, 1.4),
(9, '2022-11-04', 12465.12, 4926.52, 6472.78, 909.03, 156.8, 1.71, 0.55, 1.35),
(9, '2022-11-05', 12470.63, 5127.36, 6845.01, 345.37, 152.88, 1.58, 0.58, 1.34),
(9, '2022-11-06', 12211.13, 5141.46, 5995.8, 438.77, 635.1, 1.69, 0.5, 1.21),
(9, '2022-11-07', 12026.63, 4971.89, 6008.4, 408.19, 638.15, 1.59, 0.57, 1.35),
(9, '2022-11-08', 12118.78, 5153.88, 6061.58, 674.08, 229.24, 1.69, 0.4, 1.48),
(9, '2022-11-09', 12463.76, 5219.3, 6502.39, 402.35, 339.73, 1.67, 0.57, 1.47),
(9, '2022-11-10', 12386.39, 5152.45, 5786.19, 795.77, 651.98, 1.66, 0.57, 1.32),
(9, '2022-12-01', 12484.78, 5496.78, 5972.22, 674.79, 341.0, 1.65, 0.52, 1.47),
(9, '2022-12-02', 12424.33, 5229.29, 5991.06, 587.09, 616.9, 1.65, 0.45, 1.25),
(9, '2022-12-03', 12075.51, 5174.04, 5856.16, 480.51, 564.8, 1.68, 0.5, 1.41),
(9, '2022-12-04', 12073.39, 5375.63, 6064.5, 343.81, 289.45, 1.6, 0.5, 1.32),
(9, '2022-12-05', 12296.42, 4807.81, 6175.09, 563.24, 750.28, 1.65, 0.45, 1.32),
(9, '2022-12-06', 12182.37, 4978.37, 6300.58, 624.67, 278.74, 1.68, 0.49, 1.45),
(9, '2022-12-07', 12473.25, 4854.54, 6888.19, 440.01, 290.52, 1.59, 0.47, 1.32),
(9, '2022-12-08', 12226.72, 4597.19, 6376.52, 694.76, 558.25, 1.62, 0.46, 1.35),
(9, '2022-12-09', 12096.55, 4724.3, 6501.53, 579.33, 291.4, 1.68, 0.57, 1.43),
(9, '2022-12-10', 12320.14, 4904.56, 6164.22, 791.39, 459.97, 1.59, 0.4, 1.47),
(9, '2023-11-01', 11856.15, 5023.25, 5501.88, 656.91, 674.11, 1.58, 0.52, 1.44),
(9, '2023-11-02', 11958.24, 5001.99, 6019.56, 477.22, 459.48, 1.67, 0.43, 1.42),
(9, '2023-11-03', 11972.0, 4954.25, 5754.35, 650.77, 612.63, 1.65, 0.45, 1.22),
(9, '2023-11-04', 12041.49, 4863.41, 5878.44, 703.11, 596.53, 1.59, 0.45, 1.42),
(9, '2023-11-05', 11884.59, 4617.64, 6470.36, 332.21, 464.37, 1.69, 0.48, 1.38),
(9, '2023-11-06', 11878.0, 4997.2, 5951.09, 657.5, 272.2, 1.69, 0.45, 1.24),
(9, '2023-11-07', 12098.02, 4831.0, 5888.16, 646.01, 732.86, 1.64, 0.53, 1.46),
(9, '2023-11-08', 12177.21, 5124.7, 5620.19, 875.2, 557.12, 1.62, 0.6, 1.37),
(9, '2023-11-09', 12108.26, 4657.6, 5923.1, 1084.77, 442.79, 1.65, 0.5, 1.37),
(9, '2023-11-10', 11901.51, 5157.28, 5329.04, 770.23, 644.96, 1.63, 0.49, 1.34),
(9, '2023-12-01', 12133.01, 4964.09, 6147.13, 365.9, 655.89, 1.59, 0.48, 1.47),
(9, '2023-12-02', 12239.88, 5106.39, 5905.48, 924.71, 303.29, 1.61, 0.42, 1.46),
(9, '2023-12-03', 12123.76, 4899.55, 5975.5, 500.23, 748.48, 1.69, 0.45, 1.43),
(9, '2023-12-04', 11877.46, 4913.39, 5657.0, 1081.63, 225.44, 1.71, 0.52, 1.26),
(9, '2023-12-05', 12059.36, 5236.75, 5811.98, 554.82, 455.8, 1.64, 0.45, 1.39),
(9, '2023-12-06', 12167.91, 5203.17, 6265.55, 519.38, 179.81, 1.66, 0.54, 1.25),
(9, '2023-12-07', 12012.17, 4833.3, 5785.2, 949.12, 444.54, 1.64, 0.48, 1.27),
(9, '2023-12-08', 12187.91, 4947.72, 6068.05, 576.45, 595.7, 1.7, 0.6, 1.26),
(9, '2023-12-09', 11962.13, 5059.15, 5726.9, 480.25, 695.82, 1.62, 0.54, 1.43),
(9, '2023-12-10', 11984.76, 5278.6, 6087.64, 385.15, 233.37, 1.64, 0.48, 1.24),
(9, '2024-11-01', 11786.77, 4745.82, 5805.01, 1098.06, 137.88, 1.7, 0.54, 1.41),
(9, '2024-11-02', 11716.3, 4616.44, 5980.82, 893.95, 225.09, 1.67, 0.4, 1.37),
(9, '2024-11-03', 11825.71, 4915.47, 5980.53, 716.27, 213.44, 1.66, 0.51, 1.41),
(9, '2024-11-04', 11775.98, 4642.03, 5849.96, 621.48, 662.52, 1.7, 0.58, 1.46),
(9, '2024-11-05', 11899.29, 4750.16, 5885.52, 844.53, 419.08, 1.7, 0.56, 1.42),
(9, '2024-11-06', 11816.07, 4436.91, 6459.33, 411.79, 508.04, 1.71, 0.43, 1.37),
(9, '2024-11-07', 11590.0, 4834.37, 5423.1, 874.91, 457.62, 1.59, 0.49, 1.2),
(9, '2024-11-08', 11979.2, 5002.53, 6086.71, 653.51, 236.45, 1.6, 0.57, 1.29),
(9, '2024-11-09', 11515.72, 4863.58, 6073.71, 400.56, 177.87, 1.63, 0.51, 1.41),
(9, '2024-11-10', 11678.71, 4602.88, 6053.8, 918.61, 103.43, 1.65, 0.45, 1.29),
(9, '2024-12-01', 11915.32, 4728.01, 6006.09, 602.62, 578.6, 1.6, 0.49, 1.43),
(9, '2024-12-02', 11861.36, 5054.31, 5785.82, 442.8, 578.43, 1.6, 0.51, 1.34),
(9, '2024-12-03', 11671.14, 4525.05, 5732.52, 1024.1, 389.47, 1.66, 0.52, 1.37),
(9, '2024-12-04', 11565.56, 4318.2, 6356.38, 357.85, 533.13, 1.6, 0.59, 1.24),
(9, '2024-12-05', 11818.9, 4906.32, 5559.32, 688.21, 665.04, 1.69, 0.57, 1.28),
(9, '2024-12-06', 11540.07, 4691.16, 5407.56, 936.05, 505.3, 1.6, 0.44, 1.26),
(9, '2024-12-07', 11504.07, 4829.08, 5534.88, 928.89, 211.22, 1.71, 0.55, 1.23),
(9, '2024-12-08', 11850.74, 5099.74, 5894.4, 501.01, 355.59, 1.59, 0.58, 1.33),
(9, '2024-12-09', 11889.61, 4905.46, 5717.89, 715.06, 551.2, 1.63, 0.48, 1.25),
(9, '2024-12-10', 11680.33, 4945.34, 5580.01, 925.42, 229.56, 1.63, 0.59, 1.41),
(10, '2021-11-01', 6592.69, 2358.14, 3343.16, 544.23, 347.16, 1.65, 0.46, 1.4),
(10, '2021-11-02', 6326.83, 2577.84, 3438.03, 226.02, 84.94, 1.7, 0.6, 1.44),
(10, '2021-11-03', 6625.96, 2766.47, 3304.57, 298.34, 256.57, 1.59, 0.51, 1.45),
(10, '2021-11-04', 6551.59, 2573.17, 3402.52, 374.65, 201.24, 1.68, 0.59, 1.47),
(10, '2021-11-05', 6387.7, 2622.82, 3254.45, 228.47, 281.95, 1.7, 0.53, 1.41),
(10, '2021-11-06', 6326.14, 2574.58, 3095.16, 519.48, 136.92, 1.66, 0.55, 1.27),
(10, '2021-11-07', 6320.01, 2528.74, 3048.71, 557.24, 185.31, 1.59, 0.51, 1.36),
(10, '2021-11-08', 6426.15, 2894.32, 2934.61, 368.1, 229.11, 1.65, 0.43, 1.46),
(10, '2021-11-09', 6422.37, 2707.27, 2983.74, 458.55, 272.81, 1.64, 0.5, 1.22),
(10, '2021-11-10', 6627.16, 2365.55, 3450.55, 572.77, 238.29, 1.71, 0.5, 1.48),
(10, '2021-12-01', 6405.19, 2563.75, 3247.99, 468.03, 125.42, 1.65, 0.42, 1.48),
(10, '2021-12-02', 6682.78, 2658.68, 3626.98, 279.93, 117.19, 1.62, 0.54, 1.33),
(10, '2021-12-03', 6348.41, 2440.55, 3146.44, 429.16, 332.26, 1.6, 0.5, 1.27),
(10, '2021-12-04', 6365.25, 2761.84, 2947.3, 348.2, 307.91, 1.65, 0.49, 1.32),
(10, '2021-12-05', 6489.0, 2831.9, 3370.8, 208.62, 77.67, 1.59, 0.41, 1.25),
(10, '2021-12-06', 6346.09, 2599.1, 3253.22, 230.03, 263.74, 1.68, 0.53, 1.23),
(10, '2021-12-07', 6653.9, 2446.18, 3286.0, 549.63, 372.09, 1.66, 0.58, 1.23),
(10, '2021-12-08', 6543.54, 2775.87, 3178.84, 456.52, 132.3, 1.69, 0.43, 1.23),
(10, '2021-12-09', 6619.54, 2445.77, 3640.52, 352.18, 181.06, 1.71, 0.4, 1.21),
(10, '2021-12-10', 6585.63, 2693.81, 3128.77, 373.76, 389.29, 1.6, 0.46, 1.42),
(10, '2022-11-01', 6507.46, 2727.39, 3130.78, 302.98, 346.32, 1.69, 0.57, 1.37),
(10, '2022-11-02', 6755.92, 2681.93, 3557.88, 435.23, 80.89, 1.59, 0.59, 1.35),
(10, '2022-11-03', 6473.07, 2656.95, 3234.9, 229.41, 351.81, 1.72, 0.54, 1.32),
(10, '2022-11-04', 6746.5, 2573.52, 3248.67, 530.36, 393.95, 1.59, 0.54, 1.28),
(10, '2022-11-05', 6434.82, 2745.25, 3106.71, 342.5, 240.36, 1.59, 0.49, 1.27),
(10, '2022-11-06', 6615.82, 2475.92, 3250.9, 541.95, 347.05, 1.68, 0.54, 1.39),
(10, '2022-11-07', 6767.65, 2743.17, 3296.33, 286.1, 442.05, 1.69, 0.42, 1.25),
(10, '2022-11-08', 6557.63, 2421.99, 3453.29, 283.24, 399.11, 1.6, 0.46, 1.24),
(10, '2022-11-09', 6665.31, 2645.83, 3278.89, 309.42, 431.17, 1.59, 0.49, 1.22),
(10, '2022-11-10', 6409.36, 2527.07, 3369.99, 314.9, 197.39, 1.63, 0.5, 1.32),
(10, '2022-12-01', 6583.08, 2901.08, 3123.44, 312.14, 246.42, 1.63, 0.58, 1.27),
(10, '2022-12-02', 6595.07, 2564.41, 3575.11, 356.32, 99.23, 1.71, 0.41, 1.35),
(10, '2022-12-03', 6688.38, 2597.52, 3568.85, 213.35, 308.66, 1.67, 0.49, 1.36),
(10, '2022-12-04', 6678.06, 2747.2, 3098.79, 573.03, 259.03, 1.59, 0.45, 1.39),
(10, '2022-12-05', 6782.62, 2605.21, 3374.4, 556.44, 246.57, 1.59, 0.54, 1.42),
(10, '2022-12-06', 6599.73, 2803.88, 3173.23, 526.87, 95.75, 1.71, 0.58, 1.36),
(10, '2022-12-07', 6511.65, 2633.09, 3214.24, 432.67, 231.65, 1.69, 0.56, 1.27),
(10, '2022-12-08', 6507.91, 2650.59, 3330.89, 283.75, 242.69, 1.7, 0.54, 1.43),
(10, '2022-12-09', 6693.32, 2811.84, 3188.28, 451.27, 241.93, 1.64, 0.5, 1.42),
(10, '2022-12-10', 6596.79, 2766.39, 3502.73, 197.89, 129.78, 1.62, 0.51, 1.21),
(10, '2023-11-01', 6756.25, 2641.93, 3713.57, 190.15, 210.61, 1.6, 0.42, 1.47),
(10, '2023-11-02', 6507.51, 2410.01, 3275.44, 507.53, 314.53, 1.6, 0.52, 1.3),
(10, '2023-11-03', 6761.71, 2749.08, 3088.63, 547.02, 376.98, 1.61, 0.59, 1.25),
(10, '2023-11-04', 6836.18, 2613.07, 3873.42, 273.47, 76.22, 1.63, 0.49, 1.24),
(10, '2023-11-05', 6876.47, 2703.32, 3470.47, 273.33, 429.36, 1.61, 0.57, 1.2),
(10, '2023-11-06', 6841.84, 3010.72, 3201.21, 558.17, 71.74, 1.66, 0.59, 1.47),
(10, '2023-11-07', 6643.73, 2454.06, 3483.82, 593.73, 112.13, 1.64, 0.44, 1.48),
(10, '2023-11-08', 6808.29, 2591.9, 3349.82, 553.2, 313.37, 1.71, 0.52, 1.46),
(10, '2023-11-09', 6545.51, 2670.78, 3434.76, 272.55, 167.42, 1.67, 0.52, 1.39),
(10, '2023-11-10', 6886.96, 2786.32, 3273.55, 511.44, 315.65, 1.7, 0.45, 1.44),
(10, '2023-12-01', 6796.01, 2791.13, 3492.18, 373.24, 139.47, 1.71, 0.43, 1.23),
(10, '2023-12-02', 6560.86, 2829.24, 3066.44, 497.17, 168.01, 1.63, 0.49, 1.4),
(10, '2023-12-03', 6832.81, 2731.54, 3494.7, 511.73, 94.84, 1.68, 0.41, 1.32),
(10, '2023-12-04', 6646.72, 2604.67, 3554.11, 395.83, 92.11, 1.71, 0.53, 1.37),
(10, '2023-12-05', 6571.34, 2634.37, 3366.84, 192.89, 377.24, 1.68, 0.58, 1.42),
(10, '2023-12-06', 6825.22, 2777.51, 3583.44, 397.7, 66.57, 1.68, 0.51, 1.23),
(10, '2023-12-07', 6687.18, 2490.32, 3601.85, 238.43, 356.57, 1.67, 0.41, 1.28),
(10, '2023-12-08', 6679.45, 2884.21, 3224.67, 428.77, 141.8, 1.68, 0.46, 1.25),
(10, '2023-12-09', 6580.78, 2620.79, 3053.97, 536.83, 369.2, 1.63, 0.42, 1.24),
(10, '2023-12-10', 6784.62, 2735.09, 3749.91, 210.87, 88.75, 1.7, 0.56, 1.43),
(10, '2024-11-01', 6954.42, 2730.59, 3408.8, 548.67, 266.35, 1.69, 0.46, 1.37),
(10, '2024-11-02', 6899.23, 2660.17, 3386.51, 442.3, 410.25, 1.71, 0.52, 1.3),
(10, '2024-11-03', 6725.0, 2822.27, 3414.29, 353.95, 134.49, 1.61, 0.4, 1.21),
(10, '2024-11-04', 6861.26, 2885.13, 3225.67, 387.23, 363.23, 1.64, 0.53, 1.36),
(10, '2024-11-05', 6813.47, 2794.36, 3247.88, 508.93, 262.3, 1.62, 0.42, 1.46),
(10, '2024-11-06', 6823.59, 2584.03, 3384.33, 503.12, 352.11, 1.67, 0.49, 1.45),
(10, '2024-11-07', 6800.19, 2636.12, 3463.26, 495.88, 204.94, 1.6, 0.43, 1.24),
(10, '2024-11-08', 6633.9, 2849.22, 3117.0, 350.79, 316.89, 1.7, 0.54, 1.32),
(10, '2024-11-09', 6971.84, 2898.19, 3449.88, 298.32, 325.44, 1.59, 0.58, 1.44),
(10, '2024-11-10', 6686.03, 2572.41, 3675.97, 231.45, 206.2, 1.65, 0.6, 1.25),
(10, '2024-12-01', 6872.96, 2543.65, 3713.14, 455.48, 160.69, 1.61, 0.49, 1.21),
(10, '2024-12-02', 6780.93, 2828.2, 3410.78, 327.32, 214.63, 1.6, 0.58, 1.37),
(10, '2024-12-03', 6607.63, 2728.43, 3076.32, 517.51, 285.38, 1.68, 0.48, 1.36),
(10, '2024-12-04', 6980.74, 2795.56, 3287.07, 546.23, 351.88, 1.61, 0.53, 1.36),
(10, '2024-12-05', 6898.78, 2813.83, 3523.3, 477.57, 84.07, 1.66, 0.46, 1.4),
(10, '2024-12-06', 6675.93, 2558.85, 3234.26, 532.88, 349.94, 1.59, 0.52, 1.44),
(10, '2024-12-07', 6868.72, 2737.01, 3472.78, 525.5, 133.44, 1.59, 0.52, 1.37),
(10, '2024-12-08', 6793.87, 2690.86, 3422.23, 317.55, 363.23, 1.66, 0.48, 1.46),
(10, '2024-12-09', 6779.38, 2708.32, 3462.67, 365.52, 242.87, 1.59, 0.5, 1.42),
(10, '2024-12-10', 6822.44, 2853.28, 3310.66, 400.53, 257.98, 1.62, 0.5, 1.44),
(11, '2021-11-01', 8564.1, 3352.98, 4787.35, 284.6, 139.17, 1.65, 0.53, 1.29),
(11, '2021-11-02', 8582.07, 3424.88, 4408.65, 478.07, 270.46, 1.68, 0.42, 1.31),
(11, '2021-11-03', 8515.91, 3324.7, 4092.78, 691.33, 407.1, 1.66, 0.41, 1.38),
(11, '2021-11-04', 8501.14, 3315.62, 4132.23, 632.75, 420.53, 1.71, 0.49, 1.27),
(11, '2021-11-05', 8507.22, 3437.26, 3918.95, 753.83, 397.18, 1.64, 0.5, 1.43),
(11, '2021-11-06', 8571.6, 3370.27, 4281.59, 532.62, 387.13, 1.69, 0.49, 1.28),
(11, '2021-11-07', 8563.03, 3575.03, 4479.6, 371.37, 137.03, 1.63, 0.49, 1.29),
(11, '2021-11-08', 8571.03, 3165.3, 4278.48, 728.35, 398.89, 1.58, 0.54, 1.46),
(11, '2021-11-09', 8524.9, 3417.23, 4409.96, 548.33, 149.39, 1.65, 0.43, 1.39),
(11, '2021-11-10', 8509.15, 3220.88, 4404.2, 510.55, 373.51, 1.65, 0.56, 1.26),
(11, '2021-12-01', 8581.68, 3293.03, 4386.87, 718.65, 183.13, 1.67, 0.42, 1.21),
(11, '2021-12-02', 8577.97, 3769.39, 4281.56, 258.69, 268.33, 1.71, 0.6, 1.38),
(11, '2021-12-03', 8530.18, 3588.1, 4380.68, 325.86, 235.55, 1.69, 0.42, 1.47),
(11, '2021-12-04', 8507.5, 3728.73, 4085.55, 591.92, 101.3, 1.65, 0.47, 1.24),
(11, '2021-12-05', 8540.82, 3554.77, 3944.26, 655.71, 386.08, 1.6, 0.52, 1.25),
(11, '2021-12-06', 8544.36, 3409.76, 4457.34, 338.57, 338.68, 1.63, 0.55, 1.46),
(11, '2021-12-07', 8587.54, 3394.39, 4278.48, 493.77, 420.9, 1.71, 0.47, 1.38),
(11, '2021-12-08', 8505.53, 3437.97, 4213.65, 410.58, 443.33, 1.64, 0.45, 1.48),
(11, '2021-12-09', 8590.19, 3353.59, 4343.21, 623.21, 270.18, 1.71, 0.5, 1.22),
(11, '2021-12-10', 8545.96, 3319.03, 4484.01, 598.31, 144.61, 1.63, 0.4, 1.36),
(11, '2022-11-01', 8234.36, 3165.7, 4012.78, 533.71, 522.17, 1.63, 0.44, 1.24),
(11, '2022-11-02', 8245.42, 3742.05, 3869.02, 453.43, 180.92, 1.67, 0.45, 1.21),
(11, '2022-11-03', 8278.68, 3445.21, 3867.01, 571.4, 395.07, 1.59, 0.47, 1.27),
(11, '2022-11-04', 8222.62, 3224.16, 4234.72, 580.13, 183.61, 1.65, 0.48, 1.2),
(11, '2022-11-05', 8251.73, 3187.9, 4067.3, 653.98, 342.55, 1.62, 0.59, 1.48),
(11, '2022-11-06', 8188.48, 3195.48, 4118.94, 508.7, 365.36, 1.72, 0.5, 1.41),
(11, '2022-11-07', 8175.92, 3297.34, 4028.48, 462.67, 387.43, 1.62, 0.5, 1.48),
(11, '2022-11-08', 8259.53, 3337.37, 4056.93, 428.75, 436.48, 1.7, 0.52, 1.39),
(11, '2022-11-09', 8203.82, 3581.18, 3914.26, 527.39, 180.99, 1.63, 0.59, 1.25),
(11, '2022-11-10', 8217.94, 3202.62, 4034.66, 696.43, 284.22, 1.65, 0.51, 1.38),
(11, '2022-12-01', 8260.77, 3399.33, 4073.65, 608.6, 179.2, 1.7, 0.56, 1.47),
(11, '2022-12-02', 8167.82, 3492.97, 4228.17, 344.67, 102.01, 1.61, 0.49, 1.22),
(11, '2022-12-03', 8296.21, 3284.65, 4088.58, 543.18, 379.8, 1.62, 0.46, 1.46),
(11, '2022-12-04', 8212.35, 3224.1, 3885.67, 664.86, 437.72, 1.68, 0.6, 1.3),
(11, '2022-12-05', 8189.88, 3396.66, 4289.63, 418.36, 85.23, 1.67, 0.42, 1.43),
(11, '2022-12-06', 8243.27, 3340.28, 4376.11, 347.25, 179.63, 1.63, 0.52, 1.2),
(11, '2022-12-07', 8246.83, 3446.95, 4018.05, 486.2, 295.64, 1.66, 0.51, 1.45),
(11, '2022-12-08', 8242.88, 3234.53, 4191.99, 502.52, 313.84, 1.69, 0.55, 1.36),
(11, '2022-12-09', 8186.88, 3173.97, 3935.48, 589.23, 488.19, 1.62, 0.58, 1.22),
(11, '2022-12-10', 8209.67, 3189.99, 4154.44, 625.78, 239.45, 1.61, 0.44, 1.41),
(11, '2023-11-01', 8053.55, 3444.34, 3713.31, 654.05, 241.85, 1.61, 0.47, 1.34),
(11, '2023-11-02', 8064.53, 3143.39, 4421.77, 375.04, 124.33, 1.65, 0.59, 1.39),
(11, '2023-11-03', 8038.45, 3194.49, 4206.96, 429.6, 207.41, 1.67, 0.56, 1.47),
(11, '2023-11-04', 8051.7, 3523.3, 3971.0, 478.43, 78.97, 1.59, 0.57, 1.42),
(11, '2023-11-05', 8012.23, 3404.36, 3889.61, 356.37, 361.89, 1.7, 0.58, 1.46),
(11, '2023-11-06', 8033.2, 3467.14, 3908.36, 353.65, 304.05, 1.59, 0.52, 1.34),
(11, '2023-11-07', 8044.72, 3239.0, 4099.78, 625.51, 80.43, 1.71, 0.47, 1.41),
(11, '2023-11-08', 8022.17, 3353.59, 4081.01, 238.73, 348.84, 1.66, 0.59, 1.31),
(11, '2023-11-09', 8083.97, 3162.09, 3995.85, 701.76, 224.28, 1.66, 0.45, 1.21),
(11, '2023-11-10', 8046.29, 3464.48, 4051.07, 403.33, 127.4, 1.6, 0.45, 1.36),
(11, '2023-12-01', 8029.18, 3471.23, 3754.72, 424.99, 378.24, 1.64, 0.53, 1.33),
(11, '2023-12-02', 8072.7, 3138.12, 3869.1, 582.98, 482.51, 1.66, 0.52, 1.26),
(11, '2023-12-03', 8065.32, 3146.5, 4377.43, 402.59, 138.8, 1.58, 0.56, 1.32),
(11, '2023-12-04', 8077.86, 3503.59, 3597.96, 652.43, 323.87, 1.69, 0.56, 1.33),
(11, '2023-12-05', 8045.97, 3487.14, 3567.1, 663.86, 327.87, 1.7, 0.41, 1.25),
(11, '2023-12-06', 8056.26, 3571.02, 3709.69, 411.9, 363.65, 1.59, 0.51, 1.38),
(11, '2023-12-07', 8084.81, 3504.05, 3663.93, 426.92, 489.9, 1.68, 0.57, 1.35),
(11, '2023-12-08', 8039.17, 3342.35, 3808.91, 536.45, 351.45, 1.61, 0.59, 1.29),
(11, '2023-12-09', 8091.25, 3137.44, 4134.68, 654.51, 164.62, 1.61, 0.44, 1.3),
(11, '2023-12-10', 8018.16, 3244.96, 4094.64, 322.3, 356.26, 1.63, 0.51, 1.24),
(11, '2024-11-01', 7951.84, 3147.29, 3827.59, 577.47, 399.49, 1.61, 0.42, 1.3),
(11, '2024-11-02', 7892.27, 3139.76, 3961.83, 279.78, 510.9, 1.64, 0.6, 1.4),
(11, '2024-11-03', 7948.15, 2960.66, 4100.65, 529.22, 357.62, 1.69, 0.5, 1.29),
(11, '2024-11-04', 7903.51, 3219.4, 4047.07, 554.07, 82.97, 1.59, 0.5, 1.21),
(11, '2024-11-05', 7998.4, 3366.3, 3736.31, 571.11, 324.68, 1.64, 0.47, 1.4),
(11, '2024-11-06', 7901.25, 3233.93, 3782.58, 507.75, 376.98, 1.68, 0.49, 1.46),
(11, '2024-11-07', 7960.95, 2996.71, 4260.09, 422.63, 281.52, 1.59, 0.59, 1.29),
(11, '2024-11-08', 7892.92, 3440.31, 3911.56, 394.44, 146.61, 1.62, 0.46, 1.23),
(11, '2024-11-09', 7816.44, 3316.67, 3680.62, 673.65, 145.5, 1.65, 0.45, 1.33),
(11, '2024-11-10', 7816.84, 3280.63, 3856.21, 286.01, 393.99, 1.66, 0.42, 1.39),
(11, '2024-12-01', 7938.89, 3027.46, 4001.98, 557.13, 352.32, 1.58, 0.53, 1.47),
(11, '2024-12-02', 7971.41, 3379.01, 3968.53, 540.41, 83.46, 1.71, 0.46, 1.32),
(11, '2024-12-03', 7835.09, 3481.08, 3660.04, 450.48, 243.49, 1.69, 0.5, 1.41),
(11, '2024-12-04', 7810.71, 3211.22, 3915.65, 351.56, 332.28, 1.67, 0.41, 1.44),
(11, '2024-12-05', 7836.54, 2982.67, 3957.53, 661.65, 234.69, 1.71, 0.58, 1.35),
(11, '2024-12-06', 7859.3, 3445.51, 3696.09, 239.81, 477.9, 1.61, 0.59, 1.3),
(11, '2024-12-07', 7874.78, 3335.3, 3825.33, 606.44, 107.72, 1.71, 0.52, 1.25),
(11, '2024-12-08', 7809.62, 3142.96, 4085.22, 424.7, 156.74, 1.63, 0.56, 1.33),
(11, '2024-12-09', 7854.75, 3488.8, 3710.84, 309.92, 345.2, 1.71, 0.56, 1.33),
(11, '2024-12-10', 7996.45, 3309.59, 4069.1, 503.49, 114.28, 1.6, 0.57, 1.28),
(12, '2021-11-01', 10732.52, 4601.06, 5088.11, 470.76, 572.59, 1.61, 0.58, 1.28),
(12, '2021-11-02', 10963.95, 4547.67, 5784.94, 365.98, 265.36, 1.7, 0.58, 1.23),
(12, '2021-11-03', 10949.97, 4796.84, 5598.17, 343.31, 211.65, 1.66, 0.5, 1.35),
(12, '2021-11-04', 10916.48, 4536.13, 5470.0, 696.69, 213.66, 1.63, 0.45, 1.37),
(12, '2021-11-05', 10736.28, 4514.24, 5059.66, 638.13, 524.25, 1.7, 0.53, 1.28),
(12, '2021-11-06', 10825.97, 4479.35, 5381.81, 638.22, 326.59, 1.66, 0.48, 1.22),
(12, '2021-11-07', 10777.0, 4349.28, 5497.52, 709.81, 220.39, 1.69, 0.41, 1.32),
(12, '2021-11-08', 10810.78, 3912.65, 5464.43, 941.8, 491.9, 1.68, 0.59, 1.36),
(12, '2021-11-09', 10838.38, 3976.42, 5748.73, 580.97, 532.26, 1.61, 0.44, 1.34),
(12, '2021-11-10', 10844.38, 4421.5, 5397.71, 859.95, 165.22, 1.64, 0.56, 1.43),
(12, '2021-12-01', 10839.72, 4209.58, 5893.26, 378.66, 358.23, 1.6, 0.49, 1.32),
(12, '2021-12-02', 10979.52, 4614.12, 5574.36, 624.76, 166.28, 1.68, 0.42, 1.4),
(12, '2021-12-03', 10776.05, 4593.85, 5509.16, 400.97, 272.07, 1.61, 0.5, 1.47),
(12, '2021-12-04', 10806.03, 4304.89, 5369.48, 996.87, 134.79, 1.65, 0.55, 1.26),
(12, '2021-12-05', 10807.57, 4523.02, 5146.47, 543.71, 594.37, 1.58, 0.54, 1.24),
(12, '2021-12-06', 10914.77, 4572.49, 5500.5, 525.71, 316.08, 1.65, 0.59, 1.25),
(12, '2021-12-07', 10996.46, 4524.24, 5152.88, 793.11, 526.23, 1.64, 0.57, 1.31),
(12, '2021-12-08', 10827.31, 4160.46, 5313.41, 873.24, 480.2, 1.58, 0.51, 1.34),
(12, '2021-12-09', 10931.92, 4575.66, 5549.97, 445.05, 361.24, 1.69, 0.54, 1.36),
(12, '2021-12-10', 10979.06, 4192.39, 5283.36, 837.42, 665.9, 1.69, 0.48, 1.38),
(12, '2022-11-01', 10038.3, 4331.17, 4763.92, 846.65, 96.56, 1.66, 0.44, 1.46),
(12, '2022-11-02', 10072.81, 3913.18, 4744.17, 892.96, 522.5, 1.68, 0.5, 1.45),
(12, '2022-11-03', 10389.87, 4277.26, 4693.83, 881.44, 537.34, 1.6, 0.46, 1.46),
(12, '2022-11-04', 10361.17, 4555.78, 5066.25, 516.76, 222.38, 1.72, 0.55, 1.3),
(12, '2022-11-05', 10069.91, 4023.72, 4960.7, 805.85, 279.64, 1.7, 0.45, 1.35),
(12, '2022-11-06', 10127.75, 4336.05, 4965.75, 377.7, 448.24, 1.58, 0.56, 1.43),
(12, '2022-11-07', 10087.97, 4486.0, 4668.63, 529.67, 403.67, 1.62, 0.56, 1.37),
(12, '2022-11-08', 10381.39, 4171.03, 5257.52, 707.47, 245.37, 1.65, 0.55, 1.2),
(12, '2022-11-09', 10018.7, 4104.99, 4925.51, 650.32, 337.88, 1.58, 0.55, 1.36),
(12, '2022-11-10', 10382.89, 4335.15, 5211.56, 568.99, 267.19, 1.58, 0.41, 1.22),
(12, '2022-12-01', 10364.29, 4373.26, 5089.07, 325.66, 576.3, 1.71, 0.57, 1.32),
(12, '2022-12-02', 10134.88, 4323.82, 4825.19, 601.69, 384.18, 1.69, 0.51, 1.3),
(12, '2022-12-03', 10390.82, 4207.2, 4976.74, 946.15, 260.73, 1.59, 0.57, 1.28),
(12, '2022-12-04', 10052.15, 4059.53, 5490.86, 350.73, 151.03, 1.61, 0.41, 1.36),
(12, '2022-12-05', 10272.64, 4302.16, 5055.08, 617.54, 297.86, 1.6, 0.54, 1.24),
(12, '2022-12-06', 10309.04, 4212.68, 5210.69, 586.14, 299.53, 1.71, 0.57, 1.39),
(12, '2022-12-07', 10087.09, 3770.65, 5231.83, 604.83, 479.78, 1.61, 0.48, 1.37),
(12, '2022-12-08', 10231.29, 4126.24, 5123.83, 652.32, 328.89, 1.67, 0.48, 1.33),
(12, '2022-12-09', 10210.58, 4204.25, 4851.37, 747.86, 407.1, 1.67, 0.47, 1.28),
(12, '2022-12-10', 10066.27, 3848.61, 5016.02, 782.18, 419.46, 1.69, 0.55, 1.47),
(12, '2023-11-01', 9920.54, 4149.48, 4709.47, 790.8, 270.78, 1.66, 0.59, 1.36),
(12, '2023-11-02', 9739.01, 3939.14, 4897.73, 659.82, 242.32, 1.59, 0.5, 1.3),
(12, '2023-11-03', 9755.39, 4096.91, 4726.7, 336.82, 594.96, 1.7, 0.41, 1.29),
(12, '2023-11-04', 9916.24, 4008.23, 5314.62, 306.24, 287.15, 1.6, 0.41, 1.33),
(12, '2023-11-05', 9842.92, 3773.12, 4706.37, 783.13, 580.3, 1.63, 0.44, 1.48),
(12, '2023-11-06', 9744.96, 3831.32, 4976.88, 776.2, 160.57, 1.63, 0.57, 1.34),
(12, '2023-11-07', 9749.84, 3709.75, 5207.38, 428.6, 404.1, 1.64, 0.45, 1.3),
(12, '2023-11-08', 9826.79, 4036.61, 4851.07, 354.27, 584.83, 1.7, 0.56, 1.4),
(12, '2023-11-09', 9852.77, 3953.53, 5360.32, 409.85, 129.07, 1.7, 0.43, 1.26),
(12, '2023-11-10', 9895.82, 4090.58, 4767.15, 494.35, 543.74, 1.63, 0.42, 1.3),
(12, '2023-12-01', 9819.08, 4283.72, 4517.21, 545.49, 472.66, 1.64, 0.55, 1.3),
(12, '2023-12-02', 9823.98, 4136.28, 5021.13, 480.35, 186.22, 1.64, 0.54, 1.38),
(12, '2023-12-03', 9982.51, 4144.42, 5239.09, 509.25, 89.76, 1.65, 0.48, 1.36),
(12, '2023-12-04', 9904.03, 4071.15, 5090.71, 287.82, 454.36, 1.68, 0.55, 1.39),
(12, '2023-12-05', 9905.31, 3935.78, 5033.41, 352.67, 583.45, 1.71, 0.54, 1.2),
(12, '2023-12-06', 9979.45, 4136.5, 4553.8, 739.25, 549.9, 1.7, 0.47, 1.42),
(12, '2023-12-07', 9752.6, 4343.87, 4533.48, 556.84, 318.41, 1.59, 0.58, 1.35),
(12, '2023-12-08', 9926.98, 3861.17, 5043.28, 571.28, 451.25, 1.66, 0.48, 1.36),
(12, '2023-12-09', 9851.72, 3971.78, 5079.3, 483.3, 317.34, 1.59, 0.49, 1.44),
(12, '2023-12-10', 9845.43, 4227.41, 4961.65, 359.97, 296.4, 1.71, 0.54, 1.33),
(12, '2024-11-01', 9023.58, 3987.9, 4148.87, 625.62, 261.18, 1.68, 0.42, 1.22),
(12, '2024-11-02', 9219.46, 3671.55, 4807.48, 378.11, 362.31, 1.72, 0.52, 1.3),
(12, '2024-11-03', 9415.41, 3732.4, 4711.75, 779.69, 191.57, 1.69, 0.44, 1.27),
(12, '2024-11-04', 9165.06, 3825.61, 4494.82, 315.83, 528.8, 1.61, 0.48, 1.21),
(12, '2024-11-05', 9442.1, 3828.7, 4954.32, 366.81, 292.27, 1.71, 0.56, 1.33),
(12, '2024-11-06', 9260.58, 3828.85, 4694.38, 408.16, 329.19, 1.71, 0.57, 1.28),
(12, '2024-11-07', 9118.73, 3584.19, 4869.61, 367.75, 297.18, 1.67, 0.46, 1.45),
(12, '2024-11-08', 9029.96, 3626.56, 4546.37, 606.44, 250.59, 1.7, 0.53, 1.25),
(12, '2024-11-09', 9340.63, 3878.26, 4853.85, 313.42, 295.1, 1.71, 0.47, 1.25),
(12, '2024-11-10', 9210.62, 3648.2, 4802.53, 433.12, 326.77, 1.67, 0.46, 1.36),
(12, '2024-12-01', 9009.43, 3374.34, 4568.63, 589.87, 476.59, 1.69, 0.46, 1.47),
(12, '2024-12-02', 9042.73, 3474.17, 4482.06, 763.64, 322.86, 1.64, 0.51, 1.41),
(12, '2024-12-03', 9308.89, 3846.03, 4764.48, 536.26, 162.12, 1.63, 0.59, 1.39),
(12, '2024-12-04', 9248.7, 3638.81, 5075.56, 283.93, 250.4, 1.65, 0.5, 1.32),
(12, '2024-12-05', 9083.11, 3821.99, 4192.53, 555.1, 513.49, 1.58, 0.57, 1.26),
(12, '2024-12-06', 9071.42, 3724.07, 4243.52, 649.35, 454.48, 1.61, 0.48, 1.28),
(12, '2024-12-07', 9372.69, 4084.89, 4566.65, 495.66, 225.48, 1.59, 0.42, 1.36),
(12, '2024-12-08', 9153.95, 3729.77, 4320.02, 747.31, 356.85, 1.72, 0.58, 1.45),
(12, '2024-12-09', 9167.01, 3741.65, 4622.24, 434.96, 368.15, 1.6, 0.57, 1.38),
(12, '2024-12-10', 9122.67, 3692.01, 4568.03, 722.52, 140.1, 1.68, 0.45, 1.21),
(13, '2021-11-01', 7603.31, 3339.21, 3913.02, 251.65, 99.42, 1.61, 0.43, 1.33),
(13, '2021-11-02', 7750.39, 3036.95, 3956.56, 367.88, 389.0, 1.66, 0.5, 1.29),
(13, '2021-11-03', 7741.7, 3337.82, 3767.45, 402.94, 233.49, 1.64, 0.54, 1.45),
(13, '2021-11-04', 7628.39, 3268.56, 3807.53, 461.74, 90.55, 1.59, 0.4, 1.2),
(13, '2021-11-05', 7766.27, 3218.43, 3843.42, 633.55, 70.87, 1.7, 0.47, 1.34),
(13, '2021-11-06', 7790.56, 3009.15, 3929.67, 658.19, 193.55, 1.64, 0.53, 1.47),
(13, '2021-11-07', 7612.24, 2802.09, 4075.63, 552.85, 181.67, 1.6, 0.58, 1.27),
(13, '2021-11-08', 7694.73, 3076.88, 3969.36, 449.04, 199.45, 1.62, 0.51, 1.29),
(13, '2021-11-09', 7771.79, 3397.84, 3669.6, 342.54, 361.81, 1.6, 0.44, 1.26),
(13, '2021-11-10', 7600.41, 3014.34, 3820.74, 600.57, 164.75, 1.62, 0.45, 1.31),
(13, '2021-12-01', 7743.39, 2966.27, 3828.01, 469.73, 479.39, 1.67, 0.58, 1.31),
(13, '2021-12-02', 7636.45, 3010.46, 3767.8, 585.01, 273.18, 1.66, 0.4, 1.43),
(13, '2021-12-03', 7689.72, 2862.61, 3656.83, 685.94, 484.34, 1.6, 0.51, 1.46),
(13, '2021-12-04', 7792.82, 2920.41, 4028.41, 411.03, 432.97, 1.71, 0.49, 1.46),
(13, '2021-12-05', 7673.35, 3074.54, 4062.76, 229.74, 306.31, 1.66, 0.57, 1.47),
(13, '2021-12-06', 7708.5, 3288.59, 3768.39, 287.86, 363.66, 1.7, 0.47, 1.43),
(13, '2021-12-07', 7601.43, 3120.02, 3684.17, 612.11, 185.14, 1.63, 0.49, 1.43),
(13, '2021-12-08', 7673.07, 3178.08, 3979.85, 388.96, 126.18, 1.61, 0.41, 1.3),
(13, '2021-12-09', 7688.46, 3148.8, 4011.55, 258.15, 269.97, 1.62, 0.55, 1.45),
(13, '2021-12-10', 7734.35, 3181.02, 3806.26, 605.32, 141.74, 1.59, 0.55, 1.3),
(13, '2022-11-01', 7757.93, 3236.62, 3740.94, 371.62, 408.75, 1.68, 0.57, 1.46),
(13, '2022-11-02', 7884.57, 3163.14, 3946.77, 567.78, 206.88, 1.64, 0.53, 1.34),
(13, '2022-11-03', 7756.13, 3026.68, 4279.91, 318.79, 130.75, 1.6, 0.42, 1.37),
(13, '2022-11-04', 7812.09, 3178.97, 3792.44, 737.53, 103.15, 1.6, 0.51, 1.34),
(13, '2022-11-05', 7887.17, 3122.35, 4082.91, 604.62, 77.29, 1.71, 0.46, 1.29),
(13, '2022-11-06', 7837.27, 3269.0, 3909.59, 319.45, 339.23, 1.59, 0.4, 1.4),
(13, '2022-11-07', 7738.39, 2983.57, 3998.55, 420.21, 336.06, 1.71, 0.41, 1.23),
(13, '2022-11-08', 7843.82, 3179.8, 4074.39, 281.22, 308.41, 1.66, 0.57, 1.36),
(13, '2022-11-09', 7703.5, 3042.17, 3644.18, 547.71, 469.44, 1.59, 0.48, 1.35),
(13, '2022-11-10', 7723.09, 3284.96, 4011.94, 347.86, 78.34, 1.65, 0.41, 1.2),
(13, '2022-12-01', 7768.44, 3042.86, 3998.41, 403.6, 323.57, 1.7, 0.5, 1.26),
(13, '2022-12-02', 7800.74, 3375.97, 3651.21, 402.9, 370.65, 1.7, 0.53, 1.48),
(13, '2022-12-03', 7721.79, 2977.04, 3953.61, 440.6, 350.53, 1.6, 0.57, 1.27),
(13, '2022-12-04', 7886.65, 3225.84, 3779.65, 579.61, 301.56, 1.61, 0.56, 1.45),
(13, '2022-12-05', 7798.44, 3226.51, 3927.7, 524.12, 120.11, 1.62, 0.45, 1.45),
(13, '2022-12-06', 7813.38, 3055.73, 3925.93, 416.56, 415.16, 1.61, 0.49, 1.4),
(13, '2022-12-07', 7838.29, 2952.0, 3916.8, 514.39, 455.1, 1.61, 0.49, 1.23),
(13, '2022-12-08', 7723.88, 3357.1, 4023.48, 253.97, 89.32, 1.66, 0.53, 1.33),
(13, '2022-12-09', 7871.9, 3290.59, 3559.99, 587.42, 433.9, 1.72, 0.57, 1.43),
(13, '2022-12-10', 7863.37, 3145.25, 4122.94, 433.12, 162.06, 1.68, 0.46, 1.4),
(13, '2023-11-01', 7866.22, 3231.17, 3708.75, 702.27, 224.02, 1.64, 0.47, 1.37),
(13, '2023-11-02', 7812.77, 3122.91, 3741.39, 468.43, 480.05, 1.68, 0.54, 1.44),
(13, '2023-11-03', 7848.39, 3177.92, 3968.02, 404.62, 297.83, 1.72, 0.58, 1.34),
(13, '2023-11-04', 7943.4, 3442.32, 3819.28, 363.16, 318.64, 1.69, 0.42, 1.46),
(13, '2023-11-05', 7800.84, 2837.04, 4039.87, 612.54, 311.4, 1.65, 0.45, 1.41),
(13, '2023-11-06', 7922.35, 2999.02, 3880.43, 581.72, 461.18, 1.64, 0.52, 1.34),
(13, '2023-11-07', 7852.38, 3275.98, 4027.4, 244.19, 304.81, 1.68, 0.49, 1.32),
(13, '2023-11-08', 7956.17, 2885.33, 4178.19, 626.12, 266.53, 1.63, 0.59, 1.21),
(13, '2023-11-09', 7888.49, 3427.96, 3927.53, 362.55, 170.45, 1.6, 0.56, 1.43),
(13, '2023-11-10', 7923.56, 3526.46, 3727.45, 222.28, 447.36, 1.64, 0.44, 1.3),
(13, '2023-12-01', 7879.07, 3105.33, 3971.01, 394.93, 407.8, 1.59, 0.49, 1.21),
(13, '2023-12-02', 7828.82, 3354.25, 3721.41, 320.54, 432.62, 1.7, 0.44, 1.32),
(13, '2023-12-03', 7810.73, 3263.86, 3754.6, 425.3, 366.97, 1.72, 0.47, 1.4),
(13, '2023-12-04', 7993.53, 3479.4, 3757.26, 256.09, 500.78, 1.64, 0.59, 1.21),
(13, '2023-12-05', 7848.96, 3080.17, 4125.94, 311.19, 331.67, 1.72, 0.43, 1.36),
(13, '2023-12-06', 7952.97, 3489.32, 4004.23, 374.24, 85.18, 1.58, 0.55, 1.26),
(13, '2023-12-07', 7954.57, 2857.53, 4193.47, 534.68, 368.89, 1.61, 0.5, 1.42),
(13, '2023-12-08', 7853.77, 3093.78, 3894.25, 516.76, 348.97, 1.68, 0.45, 1.48),
(13, '2023-12-09', 7923.52, 3001.22, 4060.9, 439.98, 421.42, 1.68, 0.52, 1.32),
(13, '2023-12-10', 7864.1, 2787.61, 4140.21, 463.88, 472.41, 1.62, 0.56, 1.27),
(13, '2024-11-01', 8223.04, 3381.44, 4169.91, 499.12, 172.57, 1.59, 0.49, 1.42),
(13, '2024-11-02', 8051.09, 3460.77, 4040.37, 460.39, 89.55, 1.63, 0.6, 1.43),
(13, '2024-11-03', 8143.22, 3656.92, 4098.73, 280.13, 107.44, 1.67, 0.51, 1.46),
(13, '2024-11-04', 8290.98, 3158.72, 4248.38, 576.84, 307.04, 1.7, 0.55, 1.21),
(13, '2024-11-05', 8098.71, 3142.42, 3830.52, 678.83, 446.93, 1.7, 0.47, 1.22),
(13, '2024-11-06', 8021.44, 3388.44, 3975.86, 542.48, 114.66, 1.67, 0.53, 1.44),
(13, '2024-11-07', 8105.43, 2982.99, 4160.73, 462.63, 499.08, 1.62, 0.43, 1.3),
(13, '2024-11-08', 8199.53, 3234.45, 4260.2, 328.6, 376.28, 1.7, 0.51, 1.23),
(13, '2024-11-09', 8064.35, 3399.0, 3757.56, 617.04, 290.75, 1.68, 0.49, 1.46),
(13, '2024-11-10', 8267.49, 3545.73, 3750.92, 643.93, 326.92, 1.68, 0.44, 1.25),
(13, '2024-12-01', 8054.44, 2985.14, 4134.79, 624.97, 309.55, 1.59, 0.44, 1.23),
(13, '2024-12-02', 8248.12, 3112.39, 4195.07, 705.9, 234.76, 1.63, 0.5, 1.24),
(13, '2024-12-03', 8239.31, 3301.16, 4129.16, 384.28, 424.71, 1.61, 0.56, 1.27),
(13, '2024-12-04', 8177.71, 3213.75, 3932.02, 530.01, 501.93, 1.71, 0.41, 1.44),
(13, '2024-12-05', 8062.76, 3077.52, 3839.16, 660.04, 486.04, 1.64, 0.58, 1.29),
(13, '2024-12-06', 8027.64, 3051.66, 4128.35, 644.26, 203.37, 1.65, 0.46, 1.41),
(13, '2024-12-07', 8110.5, 3176.33, 4086.13, 657.07, 190.97, 1.67, 0.47, 1.28),
(13, '2024-12-08', 8218.24, 3032.43, 4051.84, 681.36, 452.62, 1.64, 0.52, 1.32),
(13, '2024-12-09', 8200.47, 3223.16, 4152.41, 535.01, 289.89, 1.63, 0.5, 1.3),
(13, '2024-12-10', 8020.51, 3374.09, 4067.69, 420.48, 158.25, 1.66, 0.52, 1.27),
(14, '2021-11-01', 7946.53, 2970.38, 4079.1, 648.14, 248.91, 1.6, 0.54, 1.28),
(14, '2021-11-02', 8016.85, 3309.7, 4186.75, 313.15, 207.25, 1.71, 0.41, 1.23),
(14, '2021-11-03', 7930.37, 3295.52, 3749.97, 644.14, 240.74, 1.58, 0.54, 1.36),
(14, '2021-11-04', 7922.32, 3196.43, 3903.17, 448.0, 374.72, 1.62, 0.55, 1.4),
(14, '2021-11-05', 7995.29, 3137.23, 4055.35, 552.36, 250.35, 1.59, 0.5, 1.4),
(14, '2021-11-06', 7988.01, 3133.71, 3991.66, 512.02, 350.61, 1.61, 0.56, 1.42),
(14, '2021-11-07', 8034.09, 3348.99, 3961.77, 465.96, 257.37, 1.63, 0.45, 1.4),
(14, '2021-11-08', 8053.2, 3004.29, 4110.78, 721.46, 216.67, 1.61, 0.46, 1.47),
(14, '2021-11-09', 8021.16, 3444.93, 3783.94, 665.58, 126.71, 1.6, 0.54, 1.27),
(14, '2021-11-10', 7911.44, 3522.12, 3904.62, 377.42, 107.28, 1.72, 0.56, 1.41),
(14, '2021-12-01', 7901.41, 3124.18, 4036.41, 510.83, 229.99, 1.64, 0.44, 1.47),
(14, '2021-12-02', 7942.43, 3513.93, 3986.62, 340.22, 101.66, 1.7, 0.53, 1.45),
(14, '2021-12-03', 7941.68, 3219.75, 3993.05, 483.01, 245.87, 1.67, 0.58, 1.45),
(14, '2021-12-04', 7955.24, 3190.13, 3805.53, 715.53, 244.06, 1.62, 0.41, 1.34),
(14, '2021-12-05', 8084.67, 3299.98, 3913.16, 659.35, 212.17, 1.67, 0.5, 1.29),
(14, '2021-12-06', 8038.96, 3467.23, 3667.18, 626.25, 278.3, 1.65, 0.56, 1.35),
(14, '2021-12-07', 8041.4, 3344.94, 4070.99, 305.86, 319.62, 1.63, 0.59, 1.39),
(14, '2021-12-08', 7908.93, 3017.37, 3999.61, 542.48, 349.47, 1.67, 0.53, 1.36),
(14, '2021-12-09', 8064.02, 2967.11, 4099.53, 627.3, 370.08, 1.66, 0.44, 1.31),
(14, '2021-12-10', 8026.69, 3480.84, 3892.04, 287.8, 366.01, 1.7, 0.46, 1.33),
(14, '2022-11-01', 8093.81, 3234.22, 3898.54, 554.24, 406.81, 1.67, 0.59, 1.45),
(14, '2022-11-02', 8099.58, 3312.24, 3697.25, 681.2, 408.89, 1.63, 0.48, 1.25),
(14, '2022-11-03', 8161.51, 3329.89, 3891.37, 715.71, 224.54, 1.71, 0.42, 1.29),
(14, '2022-11-04', 8095.02, 3296.87, 4026.99, 399.9, 371.26, 1.65, 0.52, 1.35),
(14, '2022-11-05', 8190.85, 3549.8, 4229.12, 272.28, 139.65, 1.63, 0.47, 1.39),
(14, '2022-11-06', 8071.43, 3472.07, 4060.91, 260.05, 278.4, 1.7, 0.47, 1.38),
(14, '2022-11-07', 8180.3, 3292.11, 4043.48, 377.1, 467.6, 1.6, 0.4, 1.45),
(14, '2022-11-08', 8029.43, 3269.17, 4063.72, 316.14, 380.4, 1.71, 0.54, 1.25),
(14, '2022-11-09', 8192.46, 3524.81, 3637.66, 600.89, 429.09, 1.66, 0.41, 1.45),
(14, '2022-11-10', 8099.34, 3291.67, 4146.01, 415.59, 246.06, 1.63, 0.46, 1.21),
(14, '2022-12-01', 8113.54, 3290.75, 4018.09, 315.09, 489.61, 1.62, 0.56, 1.44),
(14, '2022-12-02', 8171.86, 3306.01, 4111.06, 551.71, 203.08, 1.7, 0.5, 1.38),
(14, '2022-12-03', 8029.3, 3162.76, 3972.39, 487.7, 406.45, 1.71, 0.57, 1.21),
(14, '2022-12-04', 8023.94, 3422.4, 3760.65, 402.47, 438.43, 1.61, 0.43, 1.42),
(14, '2022-12-05', 8077.27, 3116.69, 4040.7, 536.37, 383.51, 1.59, 0.41, 1.41),
(14, '2022-12-06', 8069.35, 3238.32, 3818.41, 534.8, 477.81, 1.62, 0.44, 1.48),
(14, '2022-12-07', 8183.65, 3247.82, 4329.8, 449.64, 156.39, 1.59, 0.5, 1.33),
(14, '2022-12-08', 8012.44, 3375.93, 4061.41, 399.1, 176.0, 1.66, 0.51, 1.46),
(14, '2022-12-09', 8054.57, 3376.81, 3845.94, 330.66, 501.15, 1.63, 0.5, 1.4),
(14, '2022-12-10', 8099.98, 3529.88, 3803.25, 613.97, 152.88, 1.64, 0.52, 1.3),
(14, '2023-11-01', 8228.19, 3222.5, 3869.5, 660.66, 475.54, 1.68, 0.51, 1.37),
(14, '2023-11-02', 8204.41, 3420.5, 3927.28, 363.54, 493.09, 1.62, 0.59, 1.36),
(14, '2023-11-03', 8192.13, 3555.3, 3715.8, 598.44, 322.58, 1.63, 0.59, 1.28),
(14, '2023-11-04', 8139.39, 3318.97, 3951.78, 553.01, 315.64, 1.66, 0.45, 1.21),
(14, '2023-11-05', 8200.09, 3109.96, 4144.28, 493.35, 452.5, 1.64, 0.52, 1.38),
(14, '2023-11-06', 8204.42, 3242.55, 3951.24, 533.22, 477.41, 1.64, 0.53, 1.21),
(14, '2023-11-07', 8276.29, 3516.15, 4027.95, 464.2, 267.99, 1.62, 0.47, 1.32),
(14, '2023-11-08', 8124.7, 3282.22, 3923.99, 579.33, 339.16, 1.72, 0.55, 1.46),
(14, '2023-11-09', 8230.11, 3325.28, 4382.62, 234.49, 287.71, 1.59, 0.52, 1.36),
(14, '2023-11-10', 8250.28, 3115.01, 4137.88, 547.43, 449.96, 1.62, 0.44, 1.4),
(14, '2023-12-01', 8180.16, 3339.51, 4194.83, 229.26, 416.55, 1.62, 0.58, 1.4),
(14, '2023-12-02', 8180.41, 3573.92, 3840.46, 466.66, 299.37, 1.61, 0.42, 1.34),
(14, '2023-12-03', 8143.64, 3092.69, 3912.36, 660.01, 478.58, 1.68, 0.6, 1.21),
(14, '2023-12-04', 8102.43, 3268.77, 3992.51, 416.03, 425.12, 1.65, 0.5, 1.28),
(14, '2023-12-05', 8282.36, 3385.63, 4084.59, 337.95, 474.2, 1.69, 0.41, 1.46),
(14, '2023-12-06', 8288.64, 3472.81, 3955.55, 575.51, 284.77, 1.62, 0.55, 1.43),
(14, '2023-12-07', 8231.0, 3324.55, 4417.31, 358.15, 130.99, 1.58, 0.53, 1.44),
(14, '2023-12-08', 8222.45, 3235.93, 4234.31, 539.72, 212.49, 1.69, 0.58, 1.35),
(14, '2023-12-09', 8235.87, 3316.52, 4055.66, 734.43, 129.26, 1.62, 0.6, 1.47),
(14, '2023-12-10', 8162.3, 3187.83, 3929.83, 700.71, 343.92, 1.6, 0.55, 1.43),
(14, '2024-11-01', 8368.36, 3049.22, 4473.42, 674.34, 171.39, 1.72, 0.59, 1.27),
(14, '2024-11-02', 8344.54, 3259.4, 4246.13, 583.07, 255.94, 1.67, 0.48, 1.36),
(14, '2024-11-03', 8371.86, 3498.2, 4006.14, 449.03, 418.5, 1.64, 0.46, 1.44),
(14, '2024-11-04', 8208.05, 3505.45, 4014.62, 244.37, 443.61, 1.64, 0.42, 1.36),
(14, '2024-11-05', 8349.22, 3646.37, 3883.56, 496.35, 322.94, 1.61, 0.5, 1.29),
(14, '2024-11-06', 8245.93, 3253.55, 4271.99, 311.09, 409.31, 1.61, 0.58, 1.44),
(14, '2024-11-07', 8210.37, 3283.54, 4080.54, 373.35, 472.94, 1.68, 0.45, 1.3),
(14, '2024-11-08', 8265.96, 3101.49, 4238.79, 565.47, 360.21, 1.7, 0.55, 1.4),
(14, '2024-11-09', 8319.13, 3236.59, 3997.41, 674.95, 410.18, 1.65, 0.58, 1.22),
(14, '2024-11-10', 8374.45, 3681.74, 4037.3, 487.6, 167.8, 1.65, 0.49, 1.27),
(14, '2024-12-01', 8255.89, 3461.18, 3964.29, 596.1, 234.32, 1.61, 0.47, 1.41),
(14, '2024-12-02', 8231.54, 3424.09, 3920.46, 683.83, 203.16, 1.6, 0.59, 1.37),
(14, '2024-12-03', 8290.98, 3444.12, 4157.97, 240.36, 448.53, 1.65, 0.57, 1.24),
(14, '2024-12-04', 8223.54, 3457.87, 4104.26, 339.16, 322.25, 1.59, 0.53, 1.22),
(14, '2024-12-05', 8306.34, 3318.74, 4152.86, 433.69, 401.04, 1.65, 0.52, 1.43),
(14, '2024-12-06', 8240.26, 3544.65, 3844.08, 386.03, 465.5, 1.69, 0.58, 1.33),
(14, '2024-12-07', 8347.43, 3344.82, 4040.33, 575.73, 386.55, 1.6, 0.43, 1.28),
(14, '2024-12-08', 8213.46, 3323.58, 4104.4, 534.14, 251.34, 1.66, 0.53, 1.47),
(14, '2024-12-09', 8355.67, 3597.51, 4142.22, 503.11, 112.83, 1.67, 0.43, 1.46),
(14, '2024-12-10', 8350.41, 3585.43, 3910.29, 563.11, 291.58, 1.69, 0.6, 1.2),
(15, '2021-11-01', 7576.2, 3302.89, 3576.02, 352.75, 344.54, 1.7, 0.52, 1.35),
(15, '2021-11-02', 7509.91, 3081.1, 3444.67, 604.72, 379.42, 1.61, 0.47, 1.27),
(15, '2021-11-03', 7606.12, 2913.12, 4052.43, 427.24, 213.33, 1.59, 0.54, 1.29),
(15, '2021-11-04', 7696.18, 3035.39, 3886.25, 440.95, 333.59, 1.62, 0.43, 1.25),
(15, '2021-11-05', 7558.46, 2966.16, 3644.74, 530.75, 416.81, 1.71, 0.51, 1.31),
(15, '2021-11-06', 7572.8, 3070.76, 3739.81, 579.26, 182.97, 1.65, 0.51, 1.23),
(15, '2021-11-07', 7652.39, 3186.43, 3993.82, 301.86, 170.28, 1.68, 0.58, 1.48),
(15, '2021-11-08', 7608.4, 3030.87, 3866.99, 476.81, 233.73, 1.63, 0.41, 1.34),
(15, '2021-11-09', 7635.72, 2949.23, 3841.34, 392.41, 452.74, 1.62, 0.43, 1.26),
(15, '2021-11-10', 7578.99, 3099.98, 3377.5, 639.06, 462.45, 1.66, 0.41, 1.42),
(15, '2021-12-01', 7688.76, 3388.25, 3925.9, 234.02, 140.59, 1.6, 0.55, 1.37),
(15, '2021-12-02', 7666.0, 3096.83, 3808.1, 324.93, 436.14, 1.58, 0.55, 1.3),
(15, '2021-12-03', 7669.52, 3039.51, 3682.59, 693.07, 254.35, 1.58, 0.46, 1.29),
(15, '2021-12-04', 7683.55, 3128.63, 4018.69, 324.59, 211.64, 1.71, 0.54, 1.23),
(15, '2021-12-05', 7545.44, 3007.87, 3897.04, 431.67, 208.86, 1.71, 0.44, 1.42),
(15, '2021-12-06', 7588.31, 2976.26, 3717.51, 518.84, 375.71, 1.72, 0.57, 1.36),
(15, '2021-12-07', 7551.76, 2912.61, 3715.74, 640.8, 282.62, 1.63, 0.45, 1.29),
(15, '2021-12-08', 7591.01, 2941.84, 4094.87, 333.57, 220.72, 1.68, 0.54, 1.43),
(15, '2021-12-09', 7648.07, 3194.96, 3912.49, 409.13, 131.48, 1.7, 0.55, 1.21),
(15, '2021-12-10', 7597.85, 2770.38, 3806.61, 587.92, 432.93, 1.61, 0.4, 1.26),
(15, '2022-11-01', 7647.23, 3011.91, 3938.53, 244.09, 452.7, 1.67, 0.47, 1.22),
(15, '2022-11-02', 7632.55, 2861.53, 4041.37, 381.09, 348.56, 1.68, 0.54, 1.4),
(15, '2022-11-03', 7768.73, 3269.54, 3922.48, 249.89, 326.82, 1.61, 0.49, 1.41),
(15, '2022-11-04', 7798.1, 3518.57, 3735.93, 308.57, 235.02, 1.59, 0.55, 1.35),
(15, '2022-11-05', 7686.77, 2951.16, 4070.28, 228.23, 437.11, 1.59, 0.47, 1.42),
(15, '2022-11-06', 7762.75, 3233.01, 3918.17, 378.83, 232.74, 1.64, 0.43, 1.47),
(15, '2022-11-07', 7714.12, 3121.51, 3725.94, 654.09, 212.57, 1.68, 0.41, 1.37),
(15, '2022-11-08', 7688.09, 3227.57, 3694.52, 447.64, 318.37, 1.58, 0.55, 1.32),
(15, '2022-11-09', 7688.76, 3196.25, 3889.38, 506.56, 96.57, 1.68, 0.48, 1.3),
(15, '2022-11-10', 7715.59, 2929.25, 4022.88, 542.74, 220.72, 1.68, 0.48, 1.4),
(15, '2022-12-01', 7708.2, 3008.58, 3966.66, 531.02, 201.94, 1.65, 0.59, 1.26),
(15, '2022-12-02', 7751.93, 3252.27, 3826.81, 279.69, 393.16, 1.69, 0.54, 1.37),
(15, '2022-12-03', 7631.17, 2946.22, 3837.51, 466.36, 381.09, 1.59, 0.56, 1.27),
(15, '2022-12-04', 7719.49, 3212.4, 3600.52, 554.98, 351.6, 1.64, 0.57, 1.39),
(15, '2022-12-05', 7700.64, 2930.42, 3752.71, 610.88, 406.63, 1.68, 0.43, 1.3),
(15, '2022-12-06', 7639.07, 3152.01, 3646.89, 688.99, 151.18, 1.63, 0.4, 1.41),
(15, '2022-12-07', 7665.47, 3207.19, 3767.24, 331.78, 359.25, 1.67, 0.53, 1.42),
(15, '2022-12-08', 7768.81, 3266.91, 3731.96, 484.17, 285.77, 1.68, 0.56, 1.27),
(15, '2022-12-09', 7649.6, 3436.55, 3853.94, 254.72, 104.39, 1.63, 0.4, 1.23),
(15, '2022-12-10', 7756.01, 3439.45, 3897.78, 341.31, 77.46, 1.72, 0.49, 1.46),
(15, '2023-11-01', 7820.84, 3033.93, 3630.87, 681.04, 475.01, 1.69, 0.51, 1.28),
(15, '2023-11-02', 7702.83, 3089.0, 3690.59, 592.2, 331.04, 1.7, 0.45, 1.34),
(15, '2023-11-03', 7949.61, 2962.11, 4149.58, 354.68, 483.24, 1.6, 0.51, 1.28),
(15, '2023-11-04', 7944.73, 2943.3, 4087.61, 678.08, 235.74, 1.65, 0.48, 1.46),
(15, '2023-11-05', 7881.63, 3139.11, 4015.99, 643.83, 82.69, 1.68, 0.56, 1.44),
(15, '2023-11-06', 7907.82, 3525.57, 3720.38, 365.76, 296.11, 1.65, 0.51, 1.46),
(15, '2023-11-07', 7766.33, 3111.39, 3999.44, 555.05, 100.45, 1.71, 0.47, 1.36),
(15, '2023-11-08', 7921.93, 2999.8, 3991.18, 551.2, 379.75, 1.61, 0.5, 1.26),
(15, '2023-11-09', 7805.74, 3094.05, 4120.8, 258.17, 332.72, 1.65, 0.6, 1.25),
(15, '2023-11-10', 7707.4, 3348.07, 3710.45, 343.34, 305.53, 1.66, 0.55, 1.34),
(15, '2023-12-01', 7814.57, 3283.06, 3844.75, 399.9, 286.86, 1.62, 0.51, 1.45),
(15, '2023-12-02', 7883.56, 3271.86, 3886.7, 495.93, 229.07, 1.71, 0.43, 1.38),
(15, '2023-12-03', 7749.12, 3340.77, 3600.84, 711.58, 95.93, 1.64, 0.45, 1.29),
(15, '2023-12-04', 7710.43, 3343.13, 3918.25, 257.85, 191.21, 1.7, 0.57, 1.31),
(15, '2023-12-05', 7747.93, 3061.1, 4201.08, 240.98, 244.77, 1.67, 0.44, 1.27),
(15, '2023-12-06', 7918.53, 3244.19, 3885.1, 527.12, 262.12, 1.62, 0.48, 1.4),
(15, '2023-12-07', 7788.17, 3469.45, 3737.38, 336.65, 244.69, 1.71, 0.43, 1.35),
(15, '2023-12-08', 7815.63, 3540.52, 3805.18, 316.19, 153.74, 1.71, 0.46, 1.29),
(15, '2023-12-09', 7759.09, 3183.4, 3726.34, 520.34, 329.01, 1.66, 0.53, 1.23),
(15, '2023-12-10', 7830.19, 3347.08, 3904.54, 391.64, 186.94, 1.68, 0.41, 1.31),
(15, '2024-11-01', 7956.72, 3253.94, 3878.38, 637.32, 187.09, 1.65, 0.42, 1.29),
(15, '2024-11-02', 7883.56, 3426.14, 3609.03, 541.1, 307.3, 1.67, 0.53, 1.35),
(15, '2024-11-03', 7999.47, 3076.62, 3720.67, 728.78, 473.39, 1.65, 0.45, 1.34),
(15, '2024-11-04', 7816.41, 3149.13, 3773.7, 458.91, 434.67, 1.66, 0.44, 1.35),
(15, '2024-11-05', 7901.32, 3123.09, 3772.41, 567.66, 438.15, 1.7, 0.44, 1.28),
(15, '2024-11-06', 7921.12, 3482.88, 3706.98, 449.77, 281.49, 1.67, 0.44, 1.37),
(15, '2024-11-07', 7965.46, 3069.9, 3729.75, 696.97, 468.84, 1.68, 0.59, 1.21),
(15, '2024-11-08', 7874.57, 3140.1, 3992.41, 530.39, 211.66, 1.67, 0.42, 1.39),
(15, '2024-11-09', 7947.9, 3222.08, 3807.09, 506.17, 412.56, 1.6, 0.43, 1.21),
(15, '2024-11-10', 7885.24, 3156.01, 3878.7, 538.44, 312.1, 1.6, 0.44, 1.2),
(15, '2024-12-01', 7899.51, 3079.12, 4160.19, 507.38, 152.82, 1.59, 0.44, 1.27),
(15, '2024-12-02', 7881.49, 3184.83, 4065.92, 378.12, 252.62, 1.72, 0.5, 1.2),
(15, '2024-12-03', 7875.22, 2881.2, 4205.71, 410.64, 377.67, 1.59, 0.5, 1.34),
(15, '2024-12-04', 7841.9, 3276.39, 3882.22, 434.87, 248.43, 1.58, 0.41, 1.43),
(15, '2024-12-05', 7893.78, 3063.05, 4086.64, 367.3, 376.78, 1.7, 0.41, 1.32),
(15, '2024-12-06', 7890.41, 2982.37, 3841.64, 598.76, 467.65, 1.64, 0.54, 1.27),
(15, '2024-12-07', 7874.2, 2988.48, 4288.82, 260.64, 336.26, 1.66, 0.59, 1.29),
(15, '2024-12-08', 7855.14, 3472.21, 3896.89, 239.06, 246.98, 1.58, 0.41, 1.45),
(15, '2024-12-09', 7888.67, 2962.9, 3962.55, 649.25, 313.97, 1.62, 0.41, 1.27),
(15, '2024-12-10', 7898.22, 2991.92, 4009.39, 614.25, 282.66, 1.64, 0.49, 1.46),
(16, '2021-11-01', 7789.39, 3044.46, 3958.35, 609.88, 176.69, 1.69, 0.52, 1.39),
(16, '2021-11-02', 7712.73, 3264.48, 4024.71, 282.38, 141.16, 1.7, 0.58, 1.41),
(16, '2021-11-03', 7723.46, 2728.48, 3989.21, 564.98, 440.8, 1.62, 0.42, 1.47),
(16, '2021-11-04', 7778.41, 3265.57, 3893.17, 424.08, 195.59, 1.63, 0.46, 1.47),
(16, '2021-11-05', 7701.3, 3153.31, 3899.05, 485.45, 163.5, 1.67, 0.49, 1.37),
(16, '2021-11-06', 7617.87, 3079.98, 3613.05, 541.82, 383.03, 1.59, 0.52, 1.2),
(16, '2021-11-07', 7657.82, 3178.15, 3840.32, 365.21, 274.14, 1.68, 0.5, 1.22),
(16, '2021-11-08', 7610.4, 3315.33, 3673.96, 361.32, 259.79, 1.59, 0.41, 1.34),
(16, '2021-11-09', 7609.01, 2860.1, 3981.94, 373.8, 393.17, 1.6, 0.6, 1.41),
(16, '2021-11-10', 7778.37, 3453.93, 3581.27, 595.57, 147.6, 1.7, 0.49, 1.24),
(16, '2021-12-01', 7737.29, 3463.39, 3553.73, 276.94, 443.23, 1.6, 0.5, 1.37),
(16, '2021-12-02', 7741.75, 2798.16, 3831.5, 658.75, 453.34, 1.64, 0.49, 1.38),
(16, '2021-12-03', 7743.67, 3393.72, 3719.48, 248.77, 381.7, 1.7, 0.53, 1.45),
(16, '2021-12-04', 7652.75, 3269.26, 3880.33, 435.97, 67.19, 1.59, 0.48, 1.45),
(16, '2021-12-05', 7774.51, 3471.39, 3924.02, 249.34, 129.76, 1.71, 0.48, 1.24),
(16, '2021-12-06', 7758.86, 3157.68, 3748.95, 443.47, 408.77, 1.65, 0.6, 1.25),
(16, '2021-12-07', 7740.02, 3210.84, 3872.9, 294.62, 361.67, 1.69, 0.48, 1.31),
(16, '2021-12-08', 7721.75, 3235.16, 4071.35, 246.55, 168.69, 1.58, 0.58, 1.27),
(16, '2021-12-09', 7607.79, 3049.64, 3725.95, 511.51, 320.68, 1.61, 0.46, 1.4),
(16, '2021-12-10', 7791.89, 3385.49, 3619.16, 685.08, 102.16, 1.58, 0.55, 1.27),
(16, '2022-11-01', 7423.6, 3188.31, 3912.11, 211.56, 111.63, 1.72, 0.48, 1.22),
(16, '2022-11-02', 7537.54, 3356.95, 3747.41, 303.03, 130.15, 1.63, 0.4, 1.23),
(16, '2022-11-03', 7532.62, 2810.16, 3933.38, 592.75, 196.33, 1.66, 0.46, 1.21),
(16, '2022-11-04', 7449.11, 3006.88, 3918.43, 312.0, 211.8, 1.61, 0.59, 1.37),
(16, '2022-11-05', 7496.3, 2965.75, 3776.13, 642.38, 112.04, 1.66, 0.46, 1.25),
(16, '2022-11-06', 7402.32, 2936.92, 3707.61, 568.86, 188.94, 1.65, 0.5, 1.36),
(16, '2022-11-07', 7409.07, 3037.21, 3385.02, 537.86, 448.98, 1.7, 0.45, 1.44),
(16, '2022-11-08', 7562.17, 2969.28, 3764.78, 553.56, 274.54, 1.68, 0.49, 1.37),
(16, '2022-11-09', 7503.74, 2987.0, 3941.59, 479.11, 96.03, 1.61, 0.45, 1.27),
(16, '2022-11-10', 7577.59, 2945.96, 3711.3, 476.69, 443.64, 1.61, 0.54, 1.46),
(16, '2022-12-01', 7502.21, 2959.92, 3777.57, 554.54, 210.19, 1.7, 0.51, 1.28),
(16, '2022-12-02', 7507.31, 3419.98, 3650.34, 316.7, 120.29, 1.71, 0.46, 1.33),
(16, '2022-12-03', 7412.9, 2914.68, 3854.35, 370.55, 273.32, 1.59, 0.43, 1.2),
(16, '2022-12-04', 7503.19, 2896.44, 3845.65, 430.26, 330.84, 1.71, 0.46, 1.45),
(16, '2022-12-05', 7522.89, 3140.24, 3515.38, 682.0, 185.27, 1.69, 0.45, 1.36),
(16, '2022-12-06', 7573.45, 3020.43, 3947.44, 226.22, 379.36, 1.61, 0.44, 1.48),
(16, '2022-12-07', 7507.33, 3165.34, 3667.86, 364.26, 309.87, 1.68, 0.45, 1.28),
(16, '2022-12-08', 7436.49, 3268.89, 3603.0, 279.61, 284.98, 1.66, 0.45, 1.38),
(16, '2022-12-09', 7481.48, 3089.3, 3932.04, 218.16, 241.99, 1.61, 0.58, 1.42),
(16, '2022-12-10', 7497.18, 2879.03, 3712.33, 673.1, 232.72, 1.67, 0.48, 1.23),
(16, '2023-11-01', 7346.33, 3021.48, 3802.74, 327.57, 194.53, 1.62, 0.5, 1.46),
(16, '2023-11-02', 7349.1, 2924.65, 3774.8, 417.04, 232.6, 1.69, 0.46, 1.2),
(16, '2023-11-03', 7367.21, 3117.83, 3412.64, 508.42, 328.32, 1.71, 0.41, 1.21),
(16, '2023-11-04', 7320.28, 2862.64, 3750.01, 474.95, 232.68, 1.62, 0.58, 1.42),
(16, '2023-11-05', 7447.06, 2827.86, 3973.28, 308.68, 337.24, 1.71, 0.45, 1.29),
(16, '2023-11-06', 7477.9, 3000.75, 3694.06, 431.13, 351.96, 1.69, 0.59, 1.37),
(16, '2023-11-07', 7385.86, 2987.14, 3696.87, 346.25, 355.6, 1.63, 0.51, 1.34),
(16, '2023-11-08', 7484.56, 3047.01, 3699.84, 323.71, 413.99, 1.59, 0.41, 1.43),
(16, '2023-11-09', 7472.89, 3160.51, 3518.13, 509.78, 284.47, 1.7, 0.45, 1.41),
(16, '2023-11-10', 7430.61, 2838.22, 3760.92, 562.16, 269.32, 1.66, 0.47, 1.2),
(16, '2023-12-01', 7456.67, 3065.13, 3710.85, 432.09, 248.59, 1.62, 0.54, 1.48),
(16, '2023-12-02', 7303.14, 2963.25, 3859.96, 345.78, 134.15, 1.6, 0.5, 1.28),
(16, '2023-12-03', 7350.26, 2807.71, 3572.65, 526.83, 443.08, 1.69, 0.41, 1.38),
(16, '2023-12-04', 7446.52, 2749.43, 3907.9, 611.47, 177.72, 1.67, 0.51, 1.37),
(16, '2023-12-05', 7392.94, 2936.3, 3927.12, 410.15, 119.36, 1.6, 0.58, 1.22),
(16, '2023-12-06', 7493.23, 3017.09, 3619.0, 506.01, 351.13, 1.6, 0.58, 1.23),
(16, '2023-12-07', 7499.89, 3045.57, 3624.52, 484.7, 345.1, 1.61, 0.53, 1.47),
(16, '2023-12-08', 7414.57, 2856.79, 3748.77, 684.9, 124.11, 1.69, 0.54, 1.3),
(16, '2023-12-09', 7412.12, 3047.91, 3575.95, 553.92, 234.33, 1.58, 0.49, 1.37),
(16, '2023-12-10', 7459.84, 3345.96, 3667.35, 287.99, 158.54, 1.69, 0.58, 1.2),
(16, '2024-11-01', 7310.46, 3018.67, 3703.12, 496.09, 92.58, 1.62, 0.47, 1.28),
(16, '2024-11-02', 7371.57, 3048.65, 3378.47, 608.8, 335.64, 1.67, 0.6, 1.3),
(16, '2024-11-03', 7204.88, 3218.36, 3453.44, 270.15, 262.93, 1.65, 0.4, 1.21),
(16, '2024-11-04', 7311.71, 2832.97, 3548.63, 691.35, 238.75, 1.71, 0.51, 1.4),
(16, '2024-11-05', 7385.09, 2995.61, 3678.76, 545.7, 165.01, 1.69, 0.57, 1.46),
(16, '2024-11-06', 7278.75, 3260.99, 3444.52, 270.6, 302.64, 1.64, 0.47, 1.22),
(16, '2024-11-07', 7255.52, 2983.21, 3526.37, 423.94, 322.0, 1.67, 0.5, 1.24),
(16, '2024-11-08', 7278.17, 3007.59, 3752.27, 356.6, 161.71, 1.63, 0.51, 1.33),
(16, '2024-11-09', 7212.98, 3069.8, 3605.6, 446.71, 90.87, 1.59, 0.6, 1.42),
(16, '2024-11-10', 7370.92, 3092.69, 3677.87, 283.61, 316.75, 1.64, 0.48, 1.3),
(16, '2024-12-01', 7300.69, 2832.01, 3481.12, 623.94, 363.63, 1.6, 0.43, 1.45),
(16, '2024-12-02', 7315.62, 2876.94, 3376.65, 653.57, 408.46, 1.62, 0.53, 1.42),
(16, '2024-12-03', 7263.97, 3251.08, 3510.75, 353.86, 148.28, 1.62, 0.46, 1.27),
(16, '2024-12-04', 7333.82, 2812.69, 3618.51, 551.22, 351.39, 1.63, 0.58, 1.33),
(16, '2024-12-05', 7341.21, 3044.84, 3639.12, 527.32, 129.93, 1.66, 0.54, 1.3),
(16, '2024-12-06', 7259.23, 2979.34, 3575.97, 451.91, 252.01, 1.6, 0.4, 1.26),
(16, '2024-12-07', 7274.77, 2885.82, 3721.99, 417.14, 249.82, 1.71, 0.6, 1.35),
(16, '2024-12-08', 7381.7, 3063.51, 3656.3, 374.77, 287.12, 1.66, 0.44, 1.39),
(16, '2024-12-09', 7283.79, 2842.89, 4082.55, 268.89, 89.46, 1.69, 0.59, 1.31),
(16, '2024-12-10', 7207.69, 3182.92, 3380.42, 510.51, 133.85, 1.72, 0.52, 1.38),
(17, '2021-11-01', 9259.34, 3915.27, 4672.71, 298.16, 373.2, 1.65, 0.45, 1.23),
(17, '2021-11-02', 9233.71, 3960.31, 4486.2, 648.53, 138.67, 1.71, 0.43, 1.27),
(17, '2021-11-03', 9263.69, 4069.28, 4464.48, 460.13, 269.8, 1.7, 0.41, 1.47),
(17, '2021-11-04', 9211.9, 3803.76, 4527.94, 728.02, 152.18, 1.72, 0.43, 1.32),
(17, '2021-11-05', 9153.48, 3608.25, 4697.69, 754.19, 93.35, 1.61, 0.47, 1.36),
(17, '2021-11-06', 9234.55, 3845.03, 4483.52, 657.27, 248.73, 1.65, 0.54, 1.23),
(17, '2021-11-07', 9205.58, 4016.48, 4336.28, 288.64, 564.18, 1.63, 0.57, 1.31),
(17, '2021-11-08', 9128.48, 3996.39, 4322.26, 483.87, 325.97, 1.65, 0.42, 1.39),
(17, '2021-11-09', 9274.28, 3790.03, 4687.88, 613.65, 182.72, 1.62, 0.53, 1.38),
(17, '2021-11-10', 9270.17, 3768.65, 4240.16, 700.83, 560.52, 1.62, 0.41, 1.44),
(17, '2021-12-01', 9269.75, 3745.66, 5018.65, 328.7, 176.74, 1.64, 0.48, 1.34),
(17, '2021-12-02', 9143.3, 3955.35, 4791.2, 314.04, 82.71, 1.66, 0.5, 1.23),
(17, '2021-12-03', 9114.82, 3737.61, 4185.0, 646.87, 545.34, 1.67, 0.46, 1.23),
(17, '2021-12-04', 9106.88, 3757.2, 4549.93, 586.61, 213.14, 1.67, 0.57, 1.37),
(17, '2021-12-05', 9212.47, 3900.03, 4032.58, 743.0, 536.87, 1.69, 0.44, 1.42),
(17, '2021-12-06', 9120.02, 3760.82, 4485.71, 605.69, 267.79, 1.64, 0.6, 1.27),
(17, '2021-12-07', 9296.02, 3482.64, 4913.38, 509.34, 390.66, 1.59, 0.51, 1.29),
(17, '2021-12-08', 9265.81, 3987.72, 4592.6, 283.0, 402.49, 1.61, 0.48, 1.38),
(17, '2021-12-09', 9151.44, 3655.03, 4657.11, 435.79, 403.51, 1.59, 0.47, 1.39),
(17, '2021-12-10', 9262.89, 3976.94, 4306.79, 637.06, 342.09, 1.68, 0.55, 1.47),
(17, '2022-11-01', 9217.87, 3989.99, 4424.35, 657.15, 146.39, 1.64, 0.46, 1.29),
(17, '2022-11-02', 9323.86, 3859.71, 4456.2, 589.87, 418.08, 1.63, 0.58, 1.44),
(17, '2022-11-03', 9286.8, 3744.15, 4819.1, 543.89, 179.66, 1.71, 0.56, 1.28),
(17, '2022-11-04', 9390.21, 3931.75, 4622.63, 514.44, 321.38, 1.68, 0.55, 1.22),
(17, '2022-11-05', 9369.66, 3616.07, 4841.64, 693.86, 218.08, 1.66, 0.42, 1.21),
(17, '2022-11-06', 9211.76, 3634.33, 4479.75, 709.73, 387.95, 1.58, 0.44, 1.39),
(17, '2022-11-07', 9210.1, 3710.72, 4923.1, 452.7, 123.58, 1.66, 0.6, 1.27),
(17, '2022-11-08', 9276.17, 3774.89, 4627.74, 386.9, 486.63, 1.68, 0.47, 1.4),
(17, '2022-11-09', 9251.35, 3912.21, 4661.62, 429.61, 247.91, 1.61, 0.46, 1.26),
(17, '2022-11-10', 9315.82, 4004.28, 4307.41, 771.22, 232.92, 1.65, 0.49, 1.24),
(17, '2022-12-01', 9345.15, 4328.98, 4543.74, 377.5, 94.93, 1.67, 0.43, 1.31),
(17, '2022-12-02', 9233.51, 3902.2, 4411.41, 571.4, 348.5, 1.6, 0.52, 1.34),
(17, '2022-12-03', 9376.76, 3775.59, 4734.69, 413.5, 452.98, 1.61, 0.46, 1.22),
(17, '2022-12-04', 9394.6, 3693.9, 4931.74, 679.79, 89.18, 1.67, 0.54, 1.37),
(17, '2022-12-05', 9296.29, 3650.62, 4761.09, 668.12, 216.46, 1.69, 0.48, 1.28),
(17, '2022-12-06', 9347.09, 4272.1, 4616.58, 346.31, 112.1, 1.62, 0.49, 1.46),
(17, '2022-12-07', 9270.38, 3466.9, 4676.61, 757.71, 369.16, 1.68, 0.44, 1.27),
(17, '2022-12-08', 9308.05, 3892.48, 4463.76, 453.25, 498.56, 1.7, 0.47, 1.3),
(17, '2022-12-09', 9200.16, 3369.52, 4454.66, 819.14, 556.84, 1.59, 0.6, 1.46),
(17, '2022-12-10', 9367.27, 3686.45, 4474.55, 753.62, 452.66, 1.61, 0.43, 1.24),
(17, '2023-11-01', 9343.14, 4087.56, 4788.18, 356.51, 110.89, 1.67, 0.54, 1.36),
(17, '2023-11-02', 9442.53, 3562.61, 5201.74, 499.12, 179.05, 1.69, 0.53, 1.27),
(17, '2023-11-03', 9350.33, 3724.03, 4826.3, 364.0, 435.99, 1.62, 0.42, 1.44),
(17, '2023-11-04', 9373.14, 3874.32, 4146.45, 786.76, 565.62, 1.66, 0.51, 1.32),
(17, '2023-11-05', 9445.12, 3983.83, 4270.13, 672.95, 518.21, 1.58, 0.49, 1.4),
(17, '2023-11-06', 9300.79, 3933.24, 4593.93, 386.87, 386.74, 1.72, 0.59, 1.29),
(17, '2023-11-07', 9427.4, 3564.63, 4979.7, 407.92, 475.15, 1.62, 0.54, 1.45),
(17, '2023-11-08', 9414.55, 3617.09, 5093.91, 606.76, 96.8, 1.6, 0.6, 1.46),
(17, '2023-11-09', 9445.11, 3630.22, 5032.66, 382.25, 399.98, 1.59, 0.55, 1.35),
(17, '2023-11-10', 9385.63, 4154.8, 4761.97, 298.61, 170.25, 1.66, 0.59, 1.33),
(17, '2023-12-01', 9332.1, 3334.65, 4868.66, 764.91, 363.88, 1.62, 0.54, 1.42),
(17, '2023-12-02', 9349.89, 3459.43, 4868.49, 465.58, 556.39, 1.68, 0.41, 1.21),
(17, '2023-12-03', 9411.65, 3865.02, 4931.32, 380.78, 234.53, 1.63, 0.53, 1.37),
(17, '2023-12-04', 9415.9, 4135.84, 4342.59, 603.26, 334.21, 1.69, 0.55, 1.2),
(17, '2023-12-05', 9324.46, 3808.04, 4652.68, 552.67, 311.07, 1.67, 0.44, 1.33),
(17, '2023-12-06', 9315.37, 3925.97, 4463.27, 669.49, 256.65, 1.65, 0.59, 1.25),
(17, '2023-12-07', 9326.35, 3753.07, 4711.72, 763.93, 97.63, 1.61, 0.4, 1.46),
(17, '2023-12-08', 9443.26, 3479.94, 4946.55, 458.38, 558.39, 1.66, 0.48, 1.39),
(17, '2023-12-09', 9387.67, 3950.24, 4916.69, 301.57, 219.17, 1.59, 0.59, 1.45),
(17, '2023-12-10', 9310.15, 3635.44, 4768.84, 616.35, 289.52, 1.67, 0.56, 1.37),
(17, '2024-11-01', 9497.44, 3504.63, 4802.05, 727.05, 463.7, 1.63, 0.48, 1.42),
(17, '2024-11-02', 9506.7, 3985.94, 4713.74, 518.7, 288.32, 1.62, 0.43, 1.35),
(17, '2024-11-03', 9402.14, 3735.29, 4693.82, 606.93, 366.1, 1.64, 0.56, 1.37),
(17, '2024-11-04', 9459.43, 3890.53, 4917.33, 347.03, 304.54, 1.71, 0.46, 1.25),
(17, '2024-11-05', 9481.81, 3954.89, 4732.74, 270.49, 523.68, 1.62, 0.45, 1.24),
(17, '2024-11-06', 9502.23, 3814.58, 4780.67, 315.27, 591.71, 1.6, 0.4, 1.46),
(17, '2024-11-07', 9510.16, 3687.82, 4536.2, 804.72, 481.42, 1.62, 0.54, 1.21),
(17, '2024-11-08', 9442.58, 3897.34, 5109.02, 301.05, 135.17, 1.65, 0.46, 1.33),
(17, '2024-11-09', 9431.54, 3538.39, 4773.74, 590.07, 529.33, 1.64, 0.48, 1.47),
(17, '2024-11-10', 9435.56, 3636.97, 4700.99, 750.19, 347.42, 1.62, 0.57, 1.29),
(17, '2024-12-01', 9441.42, 3982.28, 4752.0, 350.93, 356.2, 1.65, 0.45, 1.45),
(17, '2024-12-02', 9465.56, 4113.46, 4819.61, 321.21, 211.29, 1.65, 0.58, 1.41),
(17, '2024-12-03', 9431.17, 4172.02, 4746.14, 285.8, 227.21, 1.6, 0.43, 1.29),
(17, '2024-12-04', 9517.26, 3871.5, 4930.62, 554.1, 161.04, 1.65, 0.41, 1.4),
(17, '2024-12-05', 9526.1, 4003.88, 4705.55, 326.71, 489.97, 1.61, 0.47, 1.25),
(17, '2024-12-06', 9480.6, 4356.49, 4643.46, 369.9, 110.74, 1.65, 0.48, 1.31),
(17, '2024-12-07', 9586.48, 3772.2, 4771.75, 827.01, 215.52, 1.61, 0.44, 1.44),
(17, '2024-12-08', 9525.62, 3823.48, 4842.45, 318.56, 541.13, 1.71, 0.57, 1.3),
(17, '2024-12-09', 9504.64, 3550.77, 5145.01, 446.15, 362.71, 1.66, 0.56, 1.24),
(17, '2024-12-10', 9488.42, 4230.67, 4440.11, 479.9, 337.74, 1.61, 0.51, 1.21),
(18, '2021-11-01', 9432.63, 3847.67, 4663.1, 343.71, 578.15, 1.66, 0.5, 1.37),
(18, '2021-11-02', 9473.57, 3962.3, 4913.39, 378.39, 219.49, 1.67, 0.47, 1.31),
(18, '2021-11-03', 9411.36, 3742.5, 4603.09, 725.96, 339.81, 1.72, 0.57, 1.21),
(18, '2021-11-04', 9332.74, 3775.62, 4837.64, 492.25, 227.24, 1.68, 0.48, 1.29),
(18, '2021-11-05', 9333.96, 3860.22, 4642.2, 633.8, 197.75, 1.64, 0.57, 1.24),
(18, '2021-11-06', 9303.93, 3778.73, 4587.92, 474.51, 462.77, 1.6, 0.59, 1.41),
(18, '2021-11-07', 9373.2, 4065.3, 4684.66, 486.21, 137.03, 1.69, 0.44, 1.36),
(18, '2021-11-08', 9395.69, 3492.21, 4891.63, 803.21, 208.64, 1.72, 0.59, 1.28),
(18, '2021-11-09', 9442.9, 3644.58, 4801.55, 494.91, 501.85, 1.63, 0.45, 1.44),
(18, '2021-11-10', 9378.59, 3865.62, 4443.11, 824.22, 245.65, 1.63, 0.55, 1.34),
(18, '2021-12-01', 9313.61, 3789.23, 4487.81, 523.68, 512.9, 1.62, 0.47, 1.32),
(18, '2021-12-02', 9446.04, 3747.77, 4577.25, 771.48, 349.54, 1.62, 0.51, 1.44),
(18, '2021-12-03', 9494.99, 3858.2, 4664.55, 699.07, 273.18, 1.62, 0.42, 1.28),
(18, '2021-12-04', 9475.85, 3836.68, 4551.7, 544.86, 542.61, 1.68, 0.56, 1.43),
(18, '2021-12-05', 9362.6, 3635.28, 4769.42, 703.01, 254.89, 1.66, 0.43, 1.32),
(18, '2021-12-06', 9427.96, 3640.61, 5141.15, 356.58, 289.62, 1.69, 0.41, 1.48),
(18, '2021-12-07', 9381.38, 4006.08, 4338.7, 679.21, 357.39, 1.69, 0.56, 1.47),
(18, '2021-12-08', 9403.88, 3930.15, 4525.29, 723.97, 224.47, 1.61, 0.58, 1.36),
(18, '2021-12-09', 9450.59, 3690.97, 4861.95, 772.77, 124.9, 1.68, 0.55, 1.4),
(18, '2021-12-10', 9451.75, 3849.14, 4590.64, 603.62, 408.35, 1.71, 0.55, 1.26),
(18, '2022-11-01', 8837.53, 3526.5, 4532.25, 408.24, 370.54, 1.67, 0.52, 1.44),
(18, '2022-11-02', 8937.23, 3876.33, 4496.43, 406.81, 157.66, 1.58, 0.6, 1.42),
(18, '2022-11-03', 8880.49, 3611.67, 4629.57, 308.59, 330.66, 1.69, 0.47, 1.36),
(18, '2022-11-04', 8809.65, 3409.88, 4238.78, 678.39, 482.6, 1.67, 0.56, 1.47),
(18, '2022-11-05', 8882.14, 3970.18, 4464.62, 304.76, 142.59, 1.72, 0.6, 1.25),
(18, '2022-11-06', 8876.48, 3849.07, 4385.3, 518.63, 123.48, 1.69, 0.46, 1.2),
(18, '2022-11-07', 8823.65, 3624.3, 4006.71, 671.9, 520.74, 1.6, 0.59, 1.26),
(18, '2022-11-08', 8960.88, 3647.69, 4553.13, 319.54, 440.53, 1.62, 0.6, 1.32),
(18, '2022-11-09', 8819.86, 3515.79, 4480.57, 348.22, 475.28, 1.64, 0.55, 1.45),
(18, '2022-11-10', 8955.67, 3586.19, 4688.45, 549.84, 131.19, 1.66, 0.45, 1.32),
(18, '2022-12-01', 8873.63, 3559.92, 4535.28, 676.26, 102.17, 1.69, 0.59, 1.36),
(18, '2022-12-02', 8933.69, 3980.49, 4052.26, 355.38, 545.56, 1.67, 0.47, 1.39),
(18, '2022-12-03', 8847.85, 3589.83, 4300.94, 450.92, 506.16, 1.6, 0.47, 1.32),
(18, '2022-12-04', 8864.94, 3573.96, 4652.9, 435.41, 202.67, 1.7, 0.58, 1.37),
(18, '2022-12-05', 8936.29, 3494.57, 4305.65, 663.4, 472.67, 1.63, 0.42, 1.42),
(18, '2022-12-06', 8843.19, 3840.16, 4095.41, 615.07, 292.54, 1.72, 0.41, 1.21),
(18, '2022-12-07', 8904.77, 3706.59, 4531.81, 506.69, 159.68, 1.58, 0.55, 1.41),
(18, '2022-12-08', 8906.63, 3874.91, 4611.87, 327.82, 92.03, 1.62, 0.44, 1.24),
(18, '2022-12-09', 8964.79, 3630.08, 4812.38, 272.89, 249.43, 1.63, 0.55, 1.43),
(18, '2022-12-10', 8880.49, 3674.98, 4275.75, 676.22, 253.54, 1.69, 0.53, 1.48),
(18, '2023-11-01', 8305.43, 3229.98, 4072.45, 685.63, 317.37, 1.6, 0.57, 1.45),
(18, '2023-11-02', 8361.89, 3444.6, 4128.28, 670.07, 118.94, 1.59, 0.47, 1.39),
(18, '2023-11-03', 8403.56, 3531.55, 3868.92, 557.84, 445.26, 1.7, 0.43, 1.2),
(18, '2023-11-04', 8424.38, 3200.38, 4392.72, 295.29, 535.99, 1.65, 0.51, 1.46),
(18, '2023-11-05', 8411.18, 3174.07, 4237.43, 545.32, 454.36, 1.7, 0.54, 1.41),
(18, '2023-11-06', 8334.2, 3240.16, 4594.56, 352.36, 147.12, 1.71, 0.55, 1.35),
(18, '2023-11-07', 8339.74, 3705.64, 3850.5, 430.38, 353.22, 1.67, 0.4, 1.33),
(18, '2023-11-08', 8417.59, 3283.81, 4402.26, 313.29, 418.24, 1.59, 0.48, 1.23),
(18, '2023-11-09', 8469.84, 3311.28, 4321.54, 507.85, 329.17, 1.7, 0.54, 1.35),
(18, '2023-11-10', 8301.68, 3600.21, 4269.41, 278.63, 153.43, 1.67, 0.49, 1.4),
(18, '2023-12-01', 8432.2, 3131.61, 4527.34, 448.92, 324.33, 1.66, 0.51, 1.43),
(18, '2023-12-02', 8360.79, 3540.42, 3964.29, 736.47, 119.62, 1.7, 0.49, 1.47),
(18, '2023-12-03', 8491.37, 3275.29, 4278.52, 428.47, 509.08, 1.59, 0.42, 1.21),
(18, '2023-12-04', 8323.29, 3108.88, 4413.27, 338.94, 462.2, 1.66, 0.54, 1.28),
(18, '2023-12-05', 8362.97, 3437.85, 4016.8, 470.85, 437.47, 1.64, 0.45, 1.2),
(18, '2023-12-06', 8416.03, 3410.7, 4158.68, 708.22, 138.43, 1.67, 0.52, 1.44),
(18, '2023-12-07', 8371.84, 3428.27, 4131.39, 693.56, 118.62, 1.59, 0.48, 1.32),
(18, '2023-12-08', 8492.69, 3699.22, 4026.49, 564.22, 202.75, 1.65, 0.4, 1.22),
(18, '2023-12-09', 8455.5, 3496.99, 4281.35, 311.9, 365.26, 1.65, 0.48, 1.37),
(18, '2023-12-10', 8331.92, 3366.57, 4052.95, 548.2, 364.19, 1.59, 0.49, 1.3),
(18, '2024-11-01', 7917.65, 3068.01, 3830.49, 631.33, 387.83, 1.65, 0.46, 1.26),
(18, '2024-11-02', 7873.32, 3131.11, 3703.32, 610.25, 428.64, 1.68, 0.44, 1.3),
(18, '2024-11-03', 7920.13, 3285.4, 3666.81, 716.61, 251.31, 1.58, 0.55, 1.34),
(18, '2024-11-04', 7900.18, 3464.92, 3610.99, 707.35, 116.92, 1.71, 0.54, 1.45),
(18, '2024-11-05', 7830.17, 3081.48, 3809.48, 567.83, 371.39, 1.68, 0.45, 1.39),
(18, '2024-11-06', 7947.21, 2825.01, 4110.71, 585.52, 425.96, 1.59, 0.46, 1.45),
(18, '2024-11-07', 7904.94, 3292.86, 3863.06, 637.79, 111.23, 1.63, 0.59, 1.46),
(18, '2024-11-08', 7964.29, 3147.1, 3809.66, 674.13, 333.4, 1.6, 0.56, 1.46),
(18, '2024-11-09', 7802.43, 3128.56, 4063.79, 438.86, 171.22, 1.61, 0.56, 1.34),
(18, '2024-11-10', 7966.09, 3274.15, 3996.48, 403.85, 291.61, 1.72, 0.49, 1.42),
(18, '2024-12-01', 7846.85, 3404.91, 3766.77, 382.48, 292.68, 1.61, 0.48, 1.42),
(18, '2024-12-02', 7962.74, 3548.16, 3896.95, 234.32, 283.31, 1.66, 0.48, 1.33),
(18, '2024-12-03', 7928.67, 3034.69, 3852.11, 576.87, 465.0, 1.7, 0.49, 1.26),
(18, '2024-12-04', 7897.78, 3204.56, 3695.58, 708.52, 289.12, 1.66, 0.51, 1.25),
(18, '2024-12-05', 7822.08, 3030.59, 3703.14, 686.81, 401.53, 1.65, 0.53, 1.21),
(18, '2024-12-06', 7920.49, 3095.04, 3845.87, 581.33, 398.25, 1.65, 0.51, 1.35),
(18, '2024-12-07', 7944.15, 3228.89, 3922.0, 545.94, 247.32, 1.69, 0.51, 1.26),
(18, '2024-12-08', 7830.38, 3367.22, 3819.46, 434.01, 209.69, 1.59, 0.51, 1.45),
(18, '2024-12-09', 7889.22, 3381.96, 3780.8, 537.88, 188.57, 1.69, 0.55, 1.3),
(18, '2024-12-10', 7825.71, 2924.64, 3964.84, 506.33, 429.9, 1.69, 0.41, 1.42),
(19, '2021-11-01', 8997.71, 3550.99, 4789.18, 288.96, 368.58, 1.69, 0.43, 1.43),
(19, '2021-11-02', 8760.03, 3574.37, 4049.52, 653.82, 482.32, 1.66, 0.54, 1.38),
(19, '2021-11-03', 8838.32, 3786.71, 4177.86, 766.97, 106.78, 1.61, 0.5, 1.25),
(19, '2021-11-04', 8840.69, 3490.86, 4377.25, 745.51, 227.07, 1.63, 0.41, 1.42),
(19, '2021-11-05', 8977.08, 3629.12, 4264.91, 696.65, 386.4, 1.7, 0.44, 1.32),
(19, '2021-11-06', 8960.21, 3813.97, 4623.83, 383.14, 139.27, 1.68, 0.54, 1.46),
(19, '2021-11-07', 8711.98, 3658.97, 4552.22, 285.21, 215.58, 1.62, 0.43, 1.36),
(19, '2021-11-08', 8909.39, 3534.16, 4101.32, 760.12, 513.78, 1.59, 0.49, 1.24),
(19, '2021-11-09', 8732.06, 3797.49, 4436.12, 260.21, 238.24, 1.69, 0.57, 1.45),
(19, '2021-11-10', 8897.68, 3432.51, 4332.07, 792.37, 340.73, 1.65, 0.48, 1.34),
(19, '2021-12-01', 8958.48, 3835.12, 4148.68, 463.91, 510.77, 1.66, 0.47, 1.26),
(19, '2021-12-02', 8782.53, 3799.82, 4068.74, 625.49, 288.47, 1.64, 0.54, 1.33),
(19, '2021-12-03', 8720.71, 3759.07, 4035.87, 429.2, 496.57, 1.66, 0.59, 1.37),
(19, '2021-12-04', 8700.56, 3332.24, 4272.75, 812.17, 283.39, 1.6, 0.45, 1.3),
(19, '2021-12-05', 8942.98, 3503.59, 4277.78, 729.35, 432.27, 1.67, 0.45, 1.35),
(19, '2021-12-06', 8909.82, 3449.22, 4366.9, 744.81, 348.88, 1.67, 0.46, 1.22),
(19, '2021-12-07', 8867.84, 3519.32, 4122.67, 771.47, 454.38, 1.62, 0.43, 1.23),
(19, '2021-12-08', 8712.54, 3681.45, 4241.33, 564.69, 225.08, 1.65, 0.41, 1.23),
(19, '2021-12-09', 8804.36, 3241.2, 4547.82, 745.97, 269.37, 1.66, 0.43, 1.37),
(19, '2021-12-10', 8755.53, 3721.04, 4421.76, 387.32, 225.42, 1.67, 0.56, 1.24),
(19, '2022-11-01', 8337.5, 3471.37, 3888.38, 570.83, 406.92, 1.7, 0.58, 1.33),
(19, '2022-11-02', 8373.7, 3272.63, 4209.15, 485.75, 406.16, 1.6, 0.54, 1.4),
(19, '2022-11-03', 8474.29, 3591.8, 4088.8, 516.05, 277.63, 1.69, 0.58, 1.3),
(19, '2022-11-04', 8345.14, 3370.74, 3965.98, 663.7, 344.72, 1.64, 0.43, 1.33),
(19, '2022-11-05', 8373.87, 3481.82, 4080.19, 480.43, 331.42, 1.67, 0.55, 1.29),
(19, '2022-11-06', 8438.69, 3277.04, 3940.15, 769.06, 452.45, 1.6, 0.49, 1.28),
(19, '2022-11-07', 8377.88, 3425.14, 4197.4, 453.37, 301.97, 1.58, 0.43, 1.31),
(19, '2022-11-08', 8495.78, 3853.14, 3953.41, 450.12, 239.11, 1.61, 0.41, 1.25),
(19, '2022-11-09', 8418.23, 3452.46, 4143.13, 338.39, 484.26, 1.65, 0.55, 1.28),
(19, '2022-11-10', 8382.7, 3212.26, 4354.13, 570.82, 245.5, 1.6, 0.47, 1.37),
(19, '2022-12-01', 8372.65, 3219.03, 4276.7, 402.75, 474.17, 1.7, 0.57, 1.32),
(19, '2022-12-02', 8367.69, 3495.13, 4212.31, 275.82, 384.43, 1.7, 0.44, 1.2),
(19, '2022-12-03', 8485.32, 3429.82, 4088.28, 408.03, 559.19, 1.7, 0.47, 1.25),
(19, '2022-12-04', 8475.25, 3479.74, 4215.23, 551.75, 228.53, 1.59, 0.44, 1.37),
(19, '2022-12-05', 8352.23, 3413.49, 4169.56, 341.84, 427.34, 1.58, 0.54, 1.43),
(19, '2022-12-06', 8467.45, 3227.07, 4305.73, 736.11, 198.54, 1.7, 0.57, 1.33),
(19, '2022-12-07', 8349.73, 3694.17, 4102.62, 392.11, 160.83, 1.62, 0.54, 1.21),
(19, '2022-12-08', 8304.7, 3118.56, 4240.5, 710.73, 234.9, 1.61, 0.53, 1.21),
(19, '2022-12-09', 8399.02, 3474.65, 4248.67, 371.59, 304.11, 1.62, 0.56, 1.36),
(19, '2022-12-10', 8418.45, 3731.13, 3799.16, 423.9, 464.26, 1.68, 0.48, 1.26),
(19, '2023-11-01', 7667.94, 3002.26, 4256.03, 318.51, 91.15, 1.7, 0.59, 1.27),
(19, '2023-11-02', 7654.66, 3080.14, 3987.21, 373.2, 214.11, 1.64, 0.51, 1.42),
(19, '2023-11-03', 7792.48, 3117.84, 3560.82, 670.18, 443.65, 1.63, 0.5, 1.22),
(19, '2023-11-04', 7697.42, 3135.87, 3983.06, 321.04, 257.45, 1.63, 0.45, 1.33),
(19, '2023-11-05', 7747.47, 3274.77, 3463.79, 609.09, 399.83, 1.71, 0.59, 1.27),
(19, '2023-11-06', 7622.41, 3061.7, 3905.56, 304.15, 351.0, 1.63, 0.42, 1.31),
(19, '2023-11-07', 7744.55, 3097.32, 3856.89, 652.26, 138.07, 1.64, 0.53, 1.48),
(19, '2023-11-08', 7774.31, 3298.35, 3883.5, 255.46, 337.01, 1.58, 0.43, 1.27),
(19, '2023-11-09', 7638.53, 3023.2, 3784.38, 628.56, 202.39, 1.67, 0.44, 1.36),
(19, '2023-11-10', 7675.3, 3216.74, 3646.17, 584.2, 228.19, 1.63, 0.41, 1.47),
(19, '2023-12-01', 7798.21, 3215.31, 4070.06, 281.17, 231.66, 1.71, 0.52, 1.2),
(19, '2023-12-02', 7664.31, 3187.03, 3811.68, 445.93, 219.67, 1.67, 0.58, 1.3),
(19, '2023-12-03', 7629.62, 3101.31, 3641.95, 590.87, 295.49, 1.72, 0.52, 1.36),
(19, '2023-12-04', 7695.38, 3118.17, 3733.09, 545.54, 298.57, 1.63, 0.59, 1.24),
(19, '2023-12-05', 7635.87, 3120.58, 3713.42, 366.17, 435.7, 1.67, 0.58, 1.32),
(19, '2023-12-06', 7696.4, 2895.33, 4144.63, 258.88, 397.56, 1.58, 0.43, 1.39),
(19, '2023-12-07', 7771.48, 3225.36, 3935.02, 311.41, 299.68, 1.59, 0.46, 1.22),
(19, '2023-12-08', 7648.05, 3186.89, 3708.13, 675.33, 77.71, 1.65, 0.59, 1.28),
(19, '2023-12-09', 7664.67, 2964.51, 3703.13, 683.47, 313.56, 1.67, 0.54, 1.28),
(19, '2023-12-10', 7649.83, 3276.97, 3749.36, 462.33, 161.16, 1.71, 0.44, 1.39),
(19, '2024-11-01', 7120.32, 3010.2, 3614.34, 305.79, 189.99, 1.71, 0.41, 1.42),
(19, '2024-11-02', 7002.01, 2985.94, 3507.24, 398.6, 110.23, 1.61, 0.46, 1.25),
(19, '2024-11-03', 7161.13, 2823.64, 3856.18, 409.2, 72.1, 1.66, 0.58, 1.41),
(19, '2024-11-04', 7018.31, 2671.2, 3737.66, 496.35, 113.1, 1.66, 0.53, 1.32),
(19, '2024-11-05', 7141.06, 2886.88, 3689.75, 231.89, 332.53, 1.61, 0.42, 1.47),
(19, '2024-11-06', 7010.02, 2781.39, 3387.35, 480.37, 360.91, 1.64, 0.47, 1.41),
(19, '2024-11-07', 7034.23, 2912.45, 3560.22, 345.34, 216.22, 1.6, 0.49, 1.39),
(19, '2024-11-08', 7148.38, 2991.14, 3541.07, 205.93, 410.24, 1.71, 0.43, 1.46),
(19, '2024-11-09', 7104.23, 2704.59, 3577.84, 569.17, 252.64, 1.69, 0.44, 1.45),
(19, '2024-11-10', 7073.92, 3056.36, 3593.53, 333.51, 90.52, 1.68, 0.45, 1.38),
(19, '2024-12-01', 7118.72, 2762.99, 3638.23, 361.39, 356.12, 1.6, 0.43, 1.47),
(19, '2024-12-02', 7044.88, 2751.06, 3318.52, 559.64, 415.66, 1.72, 0.58, 1.37),
(19, '2024-12-03', 7185.24, 3022.84, 3438.72, 465.06, 258.61, 1.6, 0.48, 1.23),
(19, '2024-12-04', 7165.4, 2924.98, 3543.03, 437.18, 260.21, 1.6, 0.56, 1.47),
(19, '2024-12-05', 7077.1, 2719.85, 3430.99, 572.4, 353.86, 1.58, 0.45, 1.24),
(19, '2024-12-06', 7196.4, 2994.34, 3604.24, 404.57, 193.25, 1.71, 0.41, 1.45),
(19, '2024-12-07', 7037.13, 3029.4, 3374.42, 525.88, 107.42, 1.7, 0.45, 1.45),
(19, '2024-12-08', 7156.5, 2942.01, 3708.64, 269.15, 236.7, 1.64, 0.56, 1.45),
(19, '2024-12-09', 7142.48, 2846.98, 3773.85, 255.75, 265.9, 1.62, 0.55, 1.44),
(19, '2024-12-10', 7006.9, 2933.42, 3412.3, 340.86, 320.32, 1.7, 0.43, 1.45),
(20, '2021-11-01', 8280.83, 3221.78, 4232.52, 339.5, 487.03, 1.68, 0.51, 1.31),
(20, '2021-11-02', 8462.01, 3372.02, 3986.79, 651.01, 452.2, 1.7, 0.45, 1.36),
(20, '2021-11-03', 8389.58, 3334.67, 4523.38, 303.58, 227.96, 1.65, 0.56, 1.43),
(20, '2021-11-04', 8363.36, 3562.41, 3915.67, 421.33, 463.94, 1.59, 0.43, 1.22),
(20, '2021-11-05', 8258.75, 3366.4, 4104.18, 383.83, 404.35, 1.59, 0.53, 1.3),
(20, '2021-11-06', 8408.05, 3313.78, 4313.34, 541.53, 239.41, 1.72, 0.54, 1.31),
(20, '2021-11-07', 8420.24, 3413.95, 4133.0, 607.66, 265.63, 1.65, 0.57, 1.46),
(20, '2021-11-08', 8382.2, 3535.51, 4045.66, 261.88, 539.15, 1.66, 0.41, 1.36),
(20, '2021-11-09', 8429.23, 3329.19, 4173.39, 535.25, 391.4, 1.65, 0.5, 1.31),
(20, '2021-11-10', 8263.17, 3149.79, 4015.67, 631.94, 465.78, 1.65, 0.51, 1.21),
(20, '2021-12-01', 8257.87, 3210.98, 4084.81, 589.01, 373.07, 1.65, 0.53, 1.47),
(20, '2021-12-02', 8319.94, 3552.85, 3942.23, 353.93, 470.94, 1.71, 0.53, 1.39),
(20, '2021-12-03', 8262.51, 3461.35, 3939.97, 416.7, 444.49, 1.7, 0.54, 1.43),
(20, '2021-12-04', 8377.04, 3555.09, 3928.17, 514.51, 379.27, 1.71, 0.43, 1.3),
(20, '2021-12-05', 8395.86, 3323.26, 4392.98, 311.46, 368.16, 1.71, 0.48, 1.26),
(20, '2021-12-06', 8383.45, 3111.94, 4582.12, 483.7, 205.69, 1.66, 0.41, 1.27),
(20, '2021-12-07', 8477.28, 3363.23, 4218.92, 743.44, 151.69, 1.65, 0.54, 1.24),
(20, '2021-12-08', 8471.38, 3572.12, 4170.58, 492.5, 236.18, 1.66, 0.55, 1.32),
(20, '2021-12-09', 8360.77, 3236.77, 4198.52, 523.84, 401.64, 1.59, 0.51, 1.31),
(20, '2021-12-10', 8326.16, 3374.32, 4024.07, 708.1, 219.67, 1.69, 0.46, 1.41),
(20, '2022-11-01', 7884.36, 2998.81, 4111.3, 615.02, 159.23, 1.66, 0.42, 1.36),
(20, '2022-11-02', 7854.94, 3132.2, 4154.99, 424.25, 143.5, 1.62, 0.44, 1.25),
(20, '2022-11-03', 7988.43, 3089.5, 4093.33, 378.78, 426.82, 1.66, 0.59, 1.42),
(20, '2022-11-04', 7801.9, 3127.57, 3887.26, 619.2, 167.88, 1.61, 0.5, 1.43),
(20, '2022-11-05', 7921.16, 3149.61, 4108.7, 546.38, 116.47, 1.68, 0.54, 1.37),
(20, '2022-11-06', 7953.72, 3187.7, 4042.38, 261.17, 462.47, 1.63, 0.42, 1.41),
(20, '2022-11-07', 7801.64, 3058.07, 3952.58, 641.14, 149.84, 1.63, 0.46, 1.4),
(20, '2022-11-08', 7837.96, 3012.32, 4197.62, 407.12, 220.89, 1.59, 0.4, 1.45),
(20, '2022-11-09', 7916.2, 3313.38, 4189.75, 279.37, 133.7, 1.6, 0.5, 1.44),
(20, '2022-11-10', 7876.4, 3273.7, 3940.78, 390.81, 271.11, 1.67, 0.54, 1.29),
(20, '2022-12-01', 7974.3, 2998.37, 4124.12, 590.64, 261.18, 1.67, 0.41, 1.44),
(20, '2022-12-02', 7845.94, 3182.58, 3920.79, 617.32, 125.25, 1.68, 0.6, 1.46),
(20, '2022-12-03', 7903.22, 3493.7, 3749.85, 307.05, 352.62, 1.7, 0.45, 1.34),
(20, '2022-12-04', 7828.09, 3014.98, 4115.1, 264.85, 433.16, 1.67, 0.49, 1.34),
(20, '2022-12-05', 7928.3, 3358.44, 3811.37, 587.67, 170.82, 1.58, 0.54, 1.26),
(20, '2022-12-06', 7937.98, 3302.94, 4139.75, 290.34, 204.95, 1.6, 0.56, 1.32),
(20, '2022-12-07', 7960.01, 3244.78, 3917.34, 393.63, 404.26, 1.62, 0.48, 1.36),
(20, '2022-12-08', 7813.52, 3327.65, 3612.1, 591.92, 281.85, 1.66, 0.49, 1.21),
(20, '2022-12-09', 7973.47, 3664.67, 3815.07, 330.39, 163.34, 1.6, 0.49, 1.25),
(20, '2022-12-10', 7823.75, 3002.15, 3909.78, 564.97, 346.85, 1.62, 0.57, 1.34),
(20, '2023-11-01', 7290.14, 2938.49, 3823.74, 319.63, 208.28, 1.69, 0.57, 1.22),
(20, '2023-11-02', 7281.45, 3080.63, 3568.78, 233.01, 399.03, 1.61, 0.53, 1.38),
(20, '2023-11-03', 7271.2, 3243.82, 3452.99, 288.43, 285.96, 1.68, 0.6, 1.38),
(20, '2023-11-04', 7218.79, 2745.91, 3795.3, 526.5, 151.07, 1.64, 0.43, 1.36),
(20, '2023-11-05', 7278.25, 2900.39, 3427.23, 565.54, 385.09, 1.67, 0.57, 1.47),
(20, '2023-11-06', 7268.16, 2916.95, 3983.81, 227.71, 139.7, 1.66, 0.43, 1.44),
(20, '2023-11-07', 7284.48, 2897.59, 3778.1, 429.27, 179.51, 1.66, 0.41, 1.23),
(20, '2023-11-08', 7304.83, 2932.81, 3585.61, 355.36, 431.04, 1.71, 0.53, 1.28),
(20, '2023-11-09', 7289.0, 3014.65, 3559.75, 511.93, 202.67, 1.67, 0.52, 1.23),
(20, '2023-11-10', 7309.7, 2894.91, 3624.56, 423.42, 366.81, 1.59, 0.53, 1.44),
(20, '2023-12-01', 7219.95, 2913.21, 3779.08, 212.3, 315.36, 1.7, 0.46, 1.42),
(20, '2023-12-02', 7240.67, 2738.57, 3673.08, 598.43, 230.59, 1.67, 0.57, 1.35),
(20, '2023-12-03', 7326.56, 3028.33, 3458.57, 499.15, 340.52, 1.67, 0.44, 1.45),
(20, '2023-12-04', 7357.62, 2896.28, 3731.74, 553.75, 175.84, 1.59, 0.51, 1.21),
(20, '2023-12-05', 7223.42, 3144.38, 3677.63, 329.48, 71.94, 1.62, 0.49, 1.4),
(20, '2023-12-06', 7261.18, 3070.49, 3380.36, 500.39, 309.94, 1.6, 0.52, 1.48),
(20, '2023-12-07', 7391.69, 3100.55, 3749.57, 333.09, 208.47, 1.62, 0.46, 1.41),
(20, '2023-12-08', 7347.83, 2905.65, 3555.52, 525.75, 360.91, 1.68, 0.45, 1.44),
(20, '2023-12-09', 7327.6, 3311.62, 3450.83, 386.42, 178.73, 1.71, 0.45, 1.46),
(20, '2023-12-10', 7351.4, 3110.5, 3520.76, 474.42, 245.71, 1.65, 0.46, 1.38),
(20, '2024-11-01', 6627.58, 2679.22, 3212.71, 447.46, 288.19, 1.67, 0.48, 1.43),
(20, '2024-11-02', 6646.46, 2719.61, 3382.19, 321.36, 223.3, 1.62, 0.58, 1.44),
(20, '2024-11-03', 6516.37, 2891.26, 3101.58, 265.76, 257.76, 1.62, 0.47, 1.31),
(20, '2024-11-04', 6581.7, 2768.32, 3519.32, 213.19, 80.87, 1.7, 0.57, 1.22),
(20, '2024-11-05', 6525.0, 2672.04, 3134.95, 381.44, 336.57, 1.65, 0.6, 1.37),
(20, '2024-11-06', 6518.94, 2586.51, 3209.16, 380.65, 342.62, 1.7, 0.47, 1.22),
(20, '2024-11-07', 6544.85, 2836.4, 3069.54, 566.19, 72.72, 1.65, 0.58, 1.43),
(20, '2024-11-08', 6673.69, 2907.43, 3084.15, 311.9, 370.2, 1.64, 0.44, 1.38),
(20, '2024-11-09', 6690.61, 3007.82, 3151.22, 246.23, 285.35, 1.67, 0.56, 1.24),
(20, '2024-11-10', 6557.22, 2711.12, 3213.43, 357.56, 275.1, 1.66, 0.55, 1.37),
(20, '2024-12-01', 6503.36, 2436.39, 3388.52, 371.22, 307.22, 1.6, 0.49, 1.47),
(20, '2024-12-02', 6673.82, 2737.31, 3202.46, 518.66, 215.4, 1.61, 0.47, 1.3),
(20, '2024-12-03', 6538.69, 2749.86, 3261.22, 278.28, 249.33, 1.65, 0.44, 1.43),
(20, '2024-12-04', 6652.4, 2660.84, 3522.14, 311.11, 158.31, 1.7, 0.45, 1.48),
(20, '2024-12-05', 6571.25, 2662.6, 3299.4, 444.6, 164.65, 1.7, 0.5, 1.28),
(20, '2024-12-06', 6586.62, 2630.89, 3464.24, 366.59, 124.9, 1.59, 0.48, 1.34),
(20, '2024-12-07', 6530.73, 2742.07, 3309.41, 195.67, 283.59, 1.59, 0.53, 1.3),
(20, '2024-12-08', 6662.74, 2590.98, 3412.8, 411.89, 247.07, 1.64, 0.42, 1.28),
(20, '2024-12-09', 6693.44, 2592.11, 3532.89, 394.09, 174.35, 1.59, 0.42, 1.43),
(20, '2024-12-10', 6687.06, 2623.9, 3319.43, 513.29, 230.45, 1.71, 0.59, 1.41)) AS temp (data_center_id, date, total_energy_mwh, it_energy_mwh, cooling_energy_mwh, backup_power_energy_mwh, lighting_energy_mwh, pue, cue, wue);



    
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


INSERT INTO leaderboard (user_id, distance_cycled_km, number_of_rides, time_travelled_hours, trees_planted, month, year)
VALUES
    -- General users
    (1, 227.5, 10, 8.5, 1, 1, 2025), -- John Doe
    (2, 227.5, 7, 6.0, 1, 1, 2025), -- Jane Smith
    (3, 455.0, 15, 12.0, 2, 1, 2025), -- Alice Tan
    (4, 227.5, 5, 4.0, 1, 1, 2025), -- Bob Lee
    (5, 455.0, 14, 10.5, 2, 1, 2025), -- Apple Lim
    (6, 227.5, 8, 7.0, 1, 1, 2025), -- Benedict Soh
    (7, 227.5, 6, 5.0, 1, 1, 2025), -- Cadence Tan
    (8, 227.5, 12, 9.5, 1, 1, 2025), -- Dominic Lee

    -- Singtel users
    (9, 455.0, 20, 15.5, 2, 1, 2025), -- Eve Koh
    (10, 227.5, 18, 14.0, 1, 1, 2025), -- Francis Wong
    (11, 227.5, 16, 12.5, 1, 1, 2025), -- Gina Lim
    (12, 682.5, 22, 18.0, 3, 1, 2025), -- Henry Tan
    (13, 455.0, 19, 14.5, 2, 1, 2025), -- Ivy Chua

    -- M1 users
    (14, 682.5, 25, 20.0, 3, 1, 2025), -- Olivia Tan
    (15, 227.5, 14, 10.0, 1, 1, 2025), -- Patrick Goh
    (16, 227.5, 17, 13.0, 1, 1, 2025), -- Queenie Wong
    (17, 455.0, 21, 16.5, 2, 1, 2025), -- Ryan Teo
    (18, 227.5, 12, 8.0, 1, 1, 2025), -- Sarah Chan

    -- Simba users
    (19, 455.0, 23, 17.5, 2, 1, 2025), -- Yvonne Goh
    (20, 682.5, 26, 21.0, 3, 1, 2025), -- Zachary Lee
    (21, 227.5, 18, 14.5, 1, 1, 2025), -- Aaron Tan
    (22, 227.5, 15, 12.0, 1, 1, 2025), -- Brianna Ho
    (23, 682.5, 24, 19.5, 3, 1, 2025), -- Clement Ong

    -- StarHub users
    (24, 455.0, 22, 17.0, 2, 1, 2025), -- Isaac Low
    (25, 227.5, 19, 14.0, 1, 1, 2025), -- Jessica Chua
    (26, 455.0, 21, 16.0, 2, 1, 2025), -- Keith Ho
    (27, 682.5, 28, 22.0, 3, 1, 2025), -- Lena Tan
    (28, 227.5, 13, 10.5, 1, 1, 2025); -- Megan Teo


INSERT INTO rewards_catalog (reward_name, reward_image, reward_description, points_required)
VALUES
    ('Reusable Water Bottle', 
    '/assets/rewards/waterBottle.jpg', 
    'Reduce single-use plastic by using a reusable water bottle. This eco-friendly bottle is made from 100% recycled materials.', 
    1500),

    ('Recycling Bag', 
    '/assets/rewards/reusableFoodWrap.png', 
    'Stylish and durable bag to help you carry and sort recyclables effectively.', 
    1000),

    ('Solar Power Bank', 
    '/assets/rewards/portableCharger.jpg', 
    'Charge your devices with a solar-powered bank, perfect for eco-conscious tech users.', 
    3000),

    ('Eco-Friendly Notebook', 
    '/assets/rewards/notebook.jpg', 
    'A notebook made from 100% recycled paper, perfect for jotting down your thoughts sustainably.', 
    500),

    ('Bamboo Toothbrush', 
    '/assets/rewards/BambooToothBrush.png', 
    'Switch to a biodegradable bamboo toothbrush to reduce plastic waste.', 
    300),

    ('Compost Bin', 
    '/assets/rewards/compostBin.jpg', 
    'A compact compost bin for your kitchen to turn food scraps into valuable compost.', 
    2000),

    ('Plant a Tree Certificate', 
    '/assets/rewards/plantTreeCert.jpg', 
    'Contribute to reforestation efforts by planting a tree in your name.', 
    2500),

    ('Organic Cotton Tote Bag', 
    '/assets/rewards/cottonBag.png', 
    'A durable and reusable tote bag made from 100% organic cotton.', 
    1200);

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