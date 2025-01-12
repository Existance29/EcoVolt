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
            const sqlQuery = `
            update leaderboard set distance_cycled_km = @distance_cycled_km, number_of_rides = @number_of_rides, time_travelled_hours = @time_travelled_hours, trees_planted = @trees_planted
            where user_id = @user_id
            `;
            const request = connection.request();
            request.input('user_id', userid);
            request.input('distance_cycled_km', data.distance_cycled_km);
            request.input('number_of_rides', data.number_of_rides);
            request.input('time_travelled_hours', data.time_travelled_hours);
            request.input('trees_planted', data.trees_planted);
            const result = await request.query(sqlQuery);
            if (result.rowsAffected[0] === 0) {
                return false;
            }
            return true;
        } catch (error) {
            throw new Error("Error updating user stats");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async saveUserStats(userid, data) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            insert into leaderboard (user_id, distance_cycled_km, number_of_rides, time_travelled_hours, trees_planted)
            values (@user_id, @distance_cycled_km, @number_of_rides, @time_travelled_hours, @trees_planted)
            `;
            const request = connection.request();
            request.input('user_id', userid);
            request.input('distance_cycled_km', data.distance_cycled_km);
            request.input('number_of_rides', data.number_of_rides);
            request.input('time_travelled_hours', data.time_travelled_hours);
            request.input('trees_planted', data.trees_planted);
            const result = await request.query(sqlQuery);
            if (result.rowsAffected[0] === 0) {
                return false;
            }
            return true;
        } catch (error) {
            throw new Error("Error saving user stats");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }


    static async displayLeaderboard(company_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            select 
            users.id,
            users.name, leaderboard.distance_cycled_km, 
            number_of_rides, time_travelled_hours, trees_planted 
            from leaderboard inner join users 
            on leaderboard.user_id = users.id
            where users.company_id = @company_id
            ORDER BY distance_cycled_km DESC;
            `;
            const request = connection.request();
            request.input('company_id', company_id);
            const result = await request.query(sqlQuery);
            if (result.recordset.length === 0) {
                return null;
            }
            return result.recordset;
        } catch (error) {
            throw new Error("Error retrieving display user stats");
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