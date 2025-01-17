const axios = require('axios');
const sql = require("mssql"); 
const dbConfig = require("../database/dbConfig");

class Fitness {

    static async getUserByStravaAthleteId(athleteId) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            const sqlQuery = `
                SELECT user_id
                FROM strava_tokens
                WHERE strava_athlete_id = @strava_athlete_id;
            `;
    
            const request = connection.request();
            request.input('strava_athlete_id', athleteId);
    
            const result = await request.query(sqlQuery);
            return result.recordset[0];
        } catch (error) {
            console.error('Error fetching user by Strava athlete ID:', error);
            return null;
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async saveStravaToken(userId, athleteId, accessToken, refreshToken, tokenExpiry) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            const sqlQuery = `
                IF EXISTS (SELECT 1 FROM strava_tokens WHERE user_id = @user_id)
                BEGIN
                    UPDATE strava_tokens
                    SET 
                        strava_athlete_id = @strava_athlete_id,
                        access_token = @access_token,
                        refresh_token = @refresh_token,
                        token_expiry = @token_expiry
                    WHERE user_id = @user_id;
                END
                ELSE
                BEGIN
                    INSERT INTO strava_tokens (user_id, strava_athlete_id, access_token, refresh_token, token_expiry)
                    VALUES (@user_id, @strava_athlete_id, @access_token, @refresh_token, @token_expiry);
                END
            `;
    
            const request = connection.request();
            request.input('user_id', sql.Int, userId);
            request.input('strava_athlete_id', sql.BigInt, athleteId);
            request.input('access_token', sql.VarChar(512), accessToken);
            request.input('refresh_token', sql.VarChar(512), refreshToken);
            request.input('token_expiry', sql.DateTime, tokenExpiry);
    
            await request.query(sqlQuery);
            return true;
        } catch (error) {
            console.error('Error saving Strava token:', error);
            return false;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async getStravaToken(userId) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            const sqlQuery = `
                SELECT access_token, strava_athlete_id, token_expiry
                FROM strava_tokens
                WHERE user_id = @user_id;
            `;
    
            const request = connection.request();
            request.input('user_id', sql.Int, userId);
    
            const result = await request.query(sqlQuery);
    
            if (result.recordset.length === 0) {
                return null; // No token found
            }
            return result.recordset[0];
        } catch (error) {
            console.error('Error retrieving Strava token:', error);
            throw new Error('Error retrieving Strava token');
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
    
    static async refreshStravaToken(userId) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            // Get the current refresh token for the user
            const tokenQuery = `
                SELECT refresh_token
                FROM strava_tokens
                WHERE user_id = @user_id;
            `;
    
            const tokenRequest = connection.request();
            tokenRequest.input('user_id', sql.Int, userId);
    
            const tokenResult = await tokenRequest.query(tokenQuery);
            if (tokenResult.recordset.length === 0) {
                throw new Error('No refresh token found for user');
            }
    
            const refreshToken = tokenResult.recordset[0].refresh_token;
    
            // Exchange the refresh token for a new access token
            const response = await axios.post('https://www.strava.com/oauth/token', {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            });
    
            const newAccessToken = response.data.access_token;
            const newRefreshToken = response.data.refresh_token;
            const newTokenExpiry = new Date(response.data.expires_at * 1000); // Convert to Date
    
            // Update the database with the new tokens
            const updateQuery = `
                UPDATE strava_tokens
                SET access_token = @access_token,
                    refresh_token = @refresh_token,
                    token_expiry = @token_expiry
                WHERE user_id = @user_id;
            `;
    
            const updateRequest = connection.request();
            updateRequest.input('access_token', sql.VarChar(512), newAccessToken);
            updateRequest.input('refresh_token', sql.VarChar(512), newRefreshToken);
            updateRequest.input('token_expiry', sql.DateTime, newTokenExpiry);
            updateRequest.input('user_id', sql.Int, userId);
    
            await updateRequest.query(updateQuery);
    
            return newAccessToken; // Return the new access token
        } catch (error) {
            console.error('Error refreshing Strava token:', error);
            return null; // Return null if token refresh fails
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
    
    
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
    
    
}

module.exports = Fitness;