const sql = require("mssql"); 
const dbConfig = require("../database/dbConfig");

class Reward {

    static async getUserById(id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT * FROM users WHERE id = @id
            `;
            const request = connection.request();
            request.input('id', id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getAllRewards() {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT * FROM rewards_catalog
            `;
            const request = connection.request();
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getRewardById(id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT * FROM rewards_catalog WHERE reward_id = @id
            `;
            const request = connection.request();
            request.input('id', id);
            const result = await request.query(sqlQuery);
            return result.recordset[0];
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getUserAvailablePoints(userId) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT total_points from user_rewards WHERE user_id = @id
            `;
            const request = connection.request();
            request.input('id', userId);
            const result = await request.query(sqlQuery);
            return result.recordset[0]?.total_points || 0; // Default to 0 if undefined
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async addUserAvailablePoints(userId, points) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                INSERT INTO user_rewards (user_id, total_points) 
                VALUES (@id, @points)
            `;
            const request = connection.request();
            request.input('id', userId);
            request.input('points', points);
            const result = await request.query(sqlQuery);
            return result;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async updateUserAvailablePoints(userId, points) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `UPDATE user_rewards SET total_points = @points WHERE user_id = @id`;
            const request = connection.request();
            request.input('id', userId);
            request.input('points', points);
            const result = await request.query(sqlQuery);
            return result;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async updateRewardHistory(userId, rewardId, pointsSpent) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                INSERT INTO reward_history (user_id, reward_id, points_spent, redemption_date) 
                VALUES (@userId, @rewardId, @pointsSpent, GETDATE())
            `;
            const request = connection.request();
            request.input('userId', userId);
            request.input('rewardId', rewardId);
            request.input('pointsSpent', pointsSpent);
            const result = await request.query(sqlQuery);
            return result;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getRewardHistory(userId) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
				select * from reward_history inner join rewards_catalog
				on reward_history.reward_id = rewards_catalog.reward_id
				where reward_history.user_id = @userId
            `;
            const request = connection.request();
            request.input('userId', userId);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

}
module.exports = Reward;