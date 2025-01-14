const sql = require("mssql"); 
const dbConfig = require("../database/dbConfig");

class Fitness {


    static async getUserStats(userid) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            select * from leaderboard where user_id = @user_id
            `;
            const request = connection.request();
            request.input('user_id', userid);
            const result = await request.query(sqlQuery);
            if (result.recordset.length === 0) {
                return null;
            }
            return result.recordset[0];
        } catch (error) {
            throw new Error("Error retrieving user stats");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async updateUserStats(userid, data) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // SQL query to update stats based on user_id, month, and year
            const sqlQuery = `
            UPDATE leaderboard 
            SET 
                distance_cycled_km = @distance_cycled_km, 
                number_of_rides = @number_of_rides, 
                time_travelled_hours = @time_travelled_hours, 
                trees_planted = @trees_planted
            WHERE 
                user_id = @user_id AND 
                month = @month AND 
                year = @year
            `;
    
            const request = connection.request();
    
            // Inputs for the query
            request.input('user_id', sql.Int, userid);
            request.input('distance_cycled_km', sql.Decimal(10, 2), data.distance_cycled_km);
            request.input('number_of_rides', sql.Int, data.number_of_rides);
            request.input('time_travelled_hours', sql.Decimal(10, 2), data.time_travelled_hours);
            request.input('trees_planted', sql.Int, data.trees_planted);
    
            // Dynamically calculate the current month and year
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
            const currentYear = currentDate.getFullYear();
    
            // Add month and year to the request
            request.input('month', sql.Int, currentMonth);
            request.input('year', sql.Int, currentYear);
    
            // Execute the query
            const result = await request.query(sqlQuery);
    
            // Check if any rows were affected
            if (result.rowsAffected[0] === 0) {
                return false; // Update failed
            }
            return true; // Update successful
        } catch (error) {
            console.error("Error updating user stats:", error);
            throw new Error("Error updating user stats");
        } finally {
            if (connection) {
                await connection.close(); // Ensure the connection is closed
            }
        }
    }
    

    static async saveUserStats(userid, data) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // Updated SQL query to include month and year
            const sqlQuery = `
            INSERT INTO leaderboard (user_id, distance_cycled_km, number_of_rides, time_travelled_hours, trees_planted, month, year)
            VALUES (@user_id, @distance_cycled_km, @number_of_rides, @time_travelled_hours, @trees_planted, @month, @year)
            `;
    
            const request = connection.request();
    
            // Inputs for the query
            console.log(userid);
            request.input('user_id', userid);
            request.input('distance_cycled_km', sql.Decimal(10, 2), data.distance_cycled_km);
            request.input('number_of_rides', data.number_of_rides);
            request.input('time_travelled_hours', sql.Decimal(10, 2), data.time_travelled_hours);
            request.input('trees_planted', data.trees_planted);
    
            // Dynamically calculate the current month and year
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
            const currentYear = currentDate.getFullYear();
    
            // Add month and year to the request
            request.input('month', sql.Int, currentMonth);
            request.input('year', sql.Int, currentYear);
    
            // Execute the query
            const result = await request.query(sqlQuery);
    
            // Check if any rows were affected
            if (result.rowsAffected[0] === 0) {
                return false; // Insert failed
            }
            return true; // Insert successful
        } catch (error) {
            console.error("Error saving user stats:", error);
            throw new Error("Error saving user stats");
        } finally {
            if (connection) {
                await connection.close(); // Ensure the connection is closed
            }
        }
    }
    


    static async displayLeaderboard() {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // Get the current month and year
            const now = new Date();
            const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
            const currentYear = now.getFullYear();
    
            const sqlQuery = `
                SELECT 
                    users.id AS user_id,
                    users.name,
                    leaderboard.distance_cycled_km,
                    leaderboard.number_of_rides,
                    leaderboard.time_travelled_hours,
                    leaderboard.trees_planted
                FROM leaderboard
                INNER JOIN users ON leaderboard.user_id = users.id
                WHERE leaderboard.month = @month AND leaderboard.year = @year
                ORDER BY leaderboard.distance_cycled_km DESC;
            `;
    
            const request = connection.request();
            request.input('month',  currentMonth); // Bind current month
            request.input('year', currentYear);   // Bind current year
    
            const result = await request.query(sqlQuery);
    
            if (result.recordset.length === 0) {
                return null;
            }
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving leaderboard stats");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }    
    
    

    static async getUserRank(userid) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    (SELECT COUNT(*) + 1 
                    FROM leaderboard 
                    WHERE distance_cycled_km > (
                        SELECT distance_cycled_km 
                        FROM leaderboard 
                        WHERE user_id = @userId
                    )) AS rank,
                    (SELECT COUNT(*) 
                    FROM leaderboard) AS total_users
                FROM leaderboard
                WHERE user_id = @userId;
            `;
            const request = connection.request();
            request.input('userId', userid);
            const result = await request.query(sqlQuery);
            if (result.recordset.length === 0) {
                return null;
            }
            return result.recordset[0];
        } catch (error) {
            throw new Error("Error retrieving user rank");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
    
    static async addPoints(userid, points) {
        let connection;
        console.log(points)
        try {
            connection = await sql.connect(dbConfig);
    
            const sqlQuery = `
                UPDATE user_rewards
                SET total_points = total_points + @points,
                    last_updated = GETDATE()
                WHERE user_id = @user_id;
            `;
    
            const request = connection.request();
            request.input('user_id', userid);
            request.input('points', points);
    
            const result = await request.query(sqlQuery);
    
            // If no rows are affected, it could mean a logic issue
            if (result.rowsAffected[0] === 0) {
                console.error(`No rows updated for user_id: ${userid}`);
                return false; // Indicate failure
            }
    
            return true; // Operation successful
        } catch (error) {
            console.error("Error adding points:", error);
            throw new Error("Error adding points to user_rewards");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }


    static async addPointsInsert(userid, points, companyId) {
        let connection;
        console.log(points);
        try {
            connection = await sql.connect(dbConfig);
    
            const sqlQuery = `
                INSERT INTO user_rewards (user_id, company_id, total_points, last_updated)
                VALUES (@user_id, @company_id, @points, GETDATE());
            `;
    
            const request = connection.request();
            request.input('user_id', sql.Int, userid);
            request.input('company_id', sql.Int, companyId);
            request.input('points', sql.Int, points);
    
            const result = await request.query(sqlQuery);
    
            // Check if the row was inserted successfully
            if (result.rowsAffected[0] === 0) {
                console.error(`No rows inserted for user_id: ${userid}`);
                return false; // Indicate failure
            }
    
            return true; // Operation successful
        } catch (error) {
            console.error("Error inserting points:", error);
            throw new Error("Error inserting points into user_rewards");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
    
    static async checkUserInRewardsTable(userid) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            const sqlQuery = `
                SELECT COUNT(*) AS count
                FROM user_rewards
                WHERE user_id = @user_id;
            `;
    
            const request = connection.request();
            request.input('user_id', userid);
    
            const result = await request.query(sqlQuery);
    
            return result.recordset[0].count > 0; // True if count > 0, false otherwise
        } catch (error) {
            console.error("Error checking user in rewards table:", error);
            throw new Error("Error checking user in rewards table");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
    
}

module.exports = Fitness;