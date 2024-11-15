// Imports
const sql = require("mssql"); 
const dbConfig = require("../database/dbConfig.js");

// Constructor for post object
class Posts {
    constructor (post_id, user_id, user_name, company_id, 
        data_center_id, context, media_url, 
        carbon_emission, energy_consumption, 
        activity_type, location, date, time, likes_count,
        dislikes_count, comments_count) {
            this.post_id = post_id;
            this.user_id = user_id;
            this.user_name = user_name;
            this.company_id = company_id;
            this.data_center_id = data_center_id;
            this.context = context;
            this.media_url = media_url;
            this.carbon_emission = carbon_emission;
            this.energy_consumption = energy_consumption;
            this.activity_type = activity_type;
            this.location = location;
            this.date = date;
            this.time = time;
            this.likes_count = likes_count;
            this.dislikes_count = dislikes_count;
            this.comments_count = comments_count;
        }
    
        // Function to get all posts
        static async getAllPosts() {
            try {
                const connection = await sql.connect(dbConfig)
                const query = `
                SELECT 
                    af.post_id, af.user_id, u.name AS user_name, af.company_id, af.context, af.location, af.date,
                    af.time, af.carbon_emission, af.energy_consumption, af.activity_type, 
                    COUNT(DISTINCT l.like_id) AS total_likes,
                    COUNT(DISTINCT d.dislike_id) AS total_dislikes,
                    COUNT(DISTINCT c.comment_id) AS total_comments
                    FROM activity_feed af
                    LEFT JOIN likes l ON af.post_id = l.post_id
                    LEFT JOIN dislikes d ON af.post_id = d.post_id
                    LEFT JOIN comments c ON af.post_id = c.post_id
                    LEFT JOIN users u ON u.id = af.user_id
                    GROUP BY af.post_id, af.user_id, u.name, af.company_id, af.context, af.location, af.date,
                    af.time, af.carbon_emission, af.energy_consumption, af.activity_type
                `;
                const request = connection.request();
                const result = await request.query(query);
                connection.close();

                return result.recordset.map((row) => {
                    const formattedDate = new Date(row.date).toISOString().split("T")[0];
                    return new Posts(row.post_id, row.user_id, row.user_name, row.company_id, 
                        row.data_center_id, row.context, row.media_url, row.carbon_emission, 
                        row.energy_consumption, row.activity_type, row.location, 
                        formattedDate, row.time, row.total_likes, row.total_dislikes, row.total_comments)
                    }
                );
            } catch (error) {
                console.error("Error getting all posts", error);
            }
        }

        // Function to check whether a post is liked
        static async isLiked(post_id, user_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `SELECT COUNT(*) AS likes_count FROM likes WHERE post_id = @post_id AND user_id = @user_id;`;

                const request = connection.request();
                request.input("post_id", post_id);
                request.input("user_id", user_id);

                const result = await request.query(query);
                connection.close();

                return result.recordset[0].likes_count > 0;
            } catch (error) {
                console.error("Error checking if post is liked by user: ", error);
                return false;
            }
        }

        // Function to add likes data into database
        static async addLike(post_id, user_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `INSERT INTO likes (post_id, user_id, date, time) VALUES (@post_id, @user_id, GETDATE(), GETDATE());`;

                const request = connection.request();
                request.input("post_id", post_id);
                request.input("user_id", user_id);
                
                const result = await request.query(query);

                connection.close();
            } catch (error) {
                console.error("Error adding likes: ", error);
            }  
        }

        // Function to remove like data from database
        static async removeLike(post_id, user_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `DELETE FROM likes WHERE post_id = @post_id AND user_id = @user_id;`;

                const request = connection.request();
                request.input("post_id", post_id);
                request.input("user_id", user_id);
                
                const result = await request.query(query);

                connection.close();
            } catch (error) {
                console.error("Error removing likes: ", error);
            }
        }

        // Function to get the number of likes on a post
        static async getLikeCount(post_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `SELECT COUNT(*) AS likes_count FROM likes WHERE post_id = @post_id;`;
                
                const request = connection.request();
                request.input("post_id", post_id);
                const result = await request.query(query);
                connection.close();
                return result.recordset[0].likes_count;
            } catch (error) {
                console.error("Error getting like count", error);
            }
        }

        // Function to check whether a post is disliked
        static async isDisliked(post_id, user_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `SELECT COUNT(*) AS dislikes_count FROM dislikes WHERE post_id = @post_id AND user_id = @user_id;`;

                const request = connection.request();
                request.input("post_id", post_id);
                request.input("user_id", user_id);

                const result = await request.query(query);
                connection.close();

                return result.recordset[0].dislikes_count > 0;
            } catch (error) {
                console.error("Error checking if post is disliked by user: ", error);
                return false;
            }
        }

        // Function to add dislikes data into database
        static async addDislike(post_id, user_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `INSERT INTO dislikes (post_id, user_id, date, time) VALUES (@post_id, @user_id, GETDATE(), GETDATE());`;

                const request = connection.request();
                request.input("post_id", post_id);
                request.input("user_id", user_id);
                
                const result = await request.query(query);

                connection.close();
            } catch (error) {
                console.error("Error adding dislikes: ", error);
            }  
        }

        // Function to remove dislike data from database
        static async removeDislike(post_id, user_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `DELETE FROM dislikes WHERE post_id = @post_id AND user_id = @user_id;`;

                const request = connection.request();
                request.input("post_id", post_id);
                request.input("user_id", user_id);
                
                const result = await request.query(query);

                connection.close();
            } catch (error) {
                console.error("Error removing dislikes: ", error);
            }
        }

        // Function to get the number of dislikes on a post
        static async getDislikeCount(post_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `SELECT COUNT(*) AS dislikes_count FROM dislikes WHERE post_id = @post_id;`;
                
                const request = connection.request();
                request.input("post_id", post_id);
                const result = await request.query(query);
                connection.close();
                return result.recordset[0].dislikes_count;
            } catch (error) {
                console.error("Error getting dislike count", error);
            }
        }

        // Function to get all comments of a specific post
        static async getCommentsByPostId(post_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `SELECT c.comment_id, c.comment_text, u.id, u.name
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN activity_feed af ON c.post_id = af.post_id
                WHERE af.post_id = @post_id`;
                
                const request = connection.request();
                const result = await request
                .input("post_id", sql.Int, post_id)
                .query(query);

                connection.close();
                return result.recordset;
            } catch (error) {
                console.error("Error fetching comments: ", error);
            }
        }

        // Function to add new comment to a post
        static async addNewComment(post_id, user_id, company_id, comment_text) {
            try {
                const connection = await sql.connect(dbConfig);

                const companyid = `SELECT company_id, name FROM users WHERE id = @user_id`;
                const companyIdRequest = connection.request();
                companyIdRequest.input("user_id", user_id);

                const companyResult = await companyIdRequest.query(companyid);
                company_id = companyResult.recordset[0].company_id;
                const username = companyResult.recordset[0].name;

                if (company_id === null || company_id === undefined) {
                    console.log("Not connected to company.");
                    company_id = 0;
                }

                const query = `INSERT INTO comments (post_id, user_id, company_id, comment_text, date, time) VALUES (@post_id, @user_id, @company_id, @comment_text, GETDATE(), GETDATE())`;
                
                const request = connection.request();
                request.input("post_id", post_id);
                request.input("user_id", user_id);
                request.input("company_id", company_id);
                request.input("comment_text", comment_text);

                const result = await request.query(query);
                connection.close();

                return result.rowsAffected[0] > 0 ? { post_id, user_id, username, company_id, comment_text } : null;
            } catch (error) {
                console.error("Error adding new comments: ", error);
            }
        }

        // Function to get the number of comments on a post
        static async getCommentCount(post_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `SELECT COUNT(*) AS comments_count FROM comments WHERE post_id = @post_id;`;
                
                const request = connection.request();
                request.input("post_id", post_id);
                const result = await request.query(query);
                connection.close();
                return result.recordset[0].comments_count;
            } catch (error) {
                console.error("Error getting comments count", error);
            }
        }

        // Function to add post to the activity page
        static async addNewPost (user_id, company_id, context, media_url, carbon_emission, energy_consumption, category, location) {
            try{
                const connection = await sql.connect(dbConfig);
                const query = `
                INSERT INTO activity_feed (user_id, company_id, context, media_url, carbon_emission, energy_consumption, activity_type, location, date, time) 
                VALUES (@user_id, @company_id, @context, @media_url, @carbon_emission, @energy_consumption, @category, @location, GETDATE(), GETDATE());
                SELECT SCOPE_IDENTITY() AS post_id;`;

                const request = connection.request();
                request.input("user_id", user_id);
                request.input("company_id", sql.Int, company_id);
                request.input("context", context);
                request.input("media_url", media_url);
                request.input("carbon_emission", carbon_emission);
                request.input("energy_consumption", energy_consumption);
                request.input("category", category);
                request.input("location", location);

                const result = await request.query(query);
                connection.close();

                return result.recordset[0];
            } catch (error) {
                console.error("Error adding new post: ", error);
                throw error;
            }
        }

        // Function to add the activity of the user interaction to the database
        static async trackActivity (user_id, company_id, post_id, activity_type, points) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `INSERT INTO activity_points (user_id, company_id, post_id, activity_type, points_awarded) 
                VALUES (@user_id, @company_id, @post_id, @activity_type, @points);`;

                const request = connection.request();
                request.input("user_id", user_id);
                request.input("company_id", company_id);
                request.input("post_id", post_id);
                request.input("activity_type", activity_type);
                request.input("points", sql.Int, points);

                const result = await request.query(query);
                connection.close();
                return result;
            } catch (error) {
                console.error("Error tracking activity : ", error);
            }
        }

        // Function to get the total points gained by the user
        static async getTotalPoints (user_id, company_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const sumQuery = `SELECT SUM(points_awarded) AS total_points FROM activity_points WHERE user_id = @user_id;`;
                const sumRequest = connection.request();
                sumRequest.input("user_id", user_id);
                const sumResult = await sumRequest.query(sumQuery);
                
                const insertQuery = `INSERT INTO user_rewards (user_id, company_id, total_points) 
                VALUES (@user_id, @company_id, @total_points);`;
                const insertRequest = connection.request();
                insertRequest.input("user_id", user_id);
                insertRequest.input("company_id", company_id);
                insertRequest.input("total_points", sumResult.recordset[0].total_points);
                const insertResult = await insertRequest.query(insertQuery);

                connection.close();
                
                return sumResult.recordset[0].total_points;

            } catch (error) {
                console.error("Error getting total points: ", error);
                throw new Error("Error fetching total points.");
            }
        }

        // Function to get the summary of the user interaction for the reward system
        static async getActivitySummary(user_id, company_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `SELECT activity_type, COUNT(*) AS activity_count, SUM(points_awarded) AS points
                FROM activity_points WHERE user_id = @user_id
                GROUP BY activity_type;`;

                const request = connection.request();
                request.input("user_id", user_id);

                const result = await request.query(query);
                connection.close();
                return result.recordset;
            } catch (error) {
                console.error("Error fetching activity summary: ", error);
                throw new Error("Error fetching activity summary.");
            }
        }

        // Function to work with the points for reward redeemption
        static async deductPoints(user_id, company_id, pointsRequired) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `UPDATE user_rewards SET total_points = total_points - @points
                WHERE user_id = @user_id;`;

                const request = connection.request();
                request.input("user_id", user_id);
                request.input("points", pointsRequired);

                const result = await request.query(query);
                connection.close();

            } catch (error) {
                console.error("Error deducting points:", error);
                throw new Error("Error deducting points.");
            }
        }
}

module.exports = Posts;