const sql = require("mssql"); 
const dbConfig = require("../database/dbConfig.js");

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
    
        static async getAllPosts() {
            try {
                const connection = await sql.connect(dbConfig)
                const query = `
                SELECT 
                    af.post_id, af.user_id, u.name AS user_name, af.company_id, af.context, af.location, af.date,
                    af.time, af.carbon_emission, af.energy_consumption, af.activity_type, 
                    COUNT(DISTINCT l.like_id) AS totsal_likes,
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
            });
            } catch (error) {
                console.error("Error getting all posts", error);
            }
        }

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

        static async addLike(post_id, user_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `INSERT INTO likes (post_id, user_id, date, time) VALUES (@post_id, @user_id, GETDATE(), GETDATE());`;

                const request = connection.request();
                request.input("post_id", post_id);
                request.input("user_id", user_id);
                
                const result = await request.query(query);
                console.log("Like added: ", result);

                connection.close();
            } catch (error) {
                console.error("Error adding likes: ", error);
            }  
        }

        static async removeLike(post_id, user_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `DELETE FROM likes WHERE post_id = @post_id AND user_id = @user_id;`;

                const request = connection.request();
                request.input("post_id", post_id);
                request.input("user_id", user_id);
                
                const result = await request.query(query);
                console.log("Like removed: ", result);

                connection.close();
            } catch (error) {
                console.error("Error removing likes: ", error);
            }
        }

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

        static async addDislike(post_id, user_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `INSERT INTO dislikes (post_id, user_id, date, time) VALUES (@post_id, @user_id, GETDATE(), GETDATE());`;

                const request = connection.request();
                request.input("post_id", post_id);
                request.input("user_id", user_id);
                
                const result = await request.query(query);
                console.log("Dislike added: ", result);

                connection.close();
            } catch (error) {
                console.error("Error adding dislikes: ", error);
            }  
        }

        static async removeDislike(post_id, user_id) {
            try {
                const connection = await sql.connect(dbConfig);
                const query = `DELETE FROM dislikes WHERE post_id = @post_id AND user_id = @user_id;`;

                const request = connection.request();
                request.input("post_id", post_id);
                request.input("user_id", user_id);
                
                const result = await request.query(query);
                console.log("Dislike removed: ", result);

                connection.close();
            } catch (error) {
                console.error("Error removing dislikes: ", error);
            }
        }

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

        static async addNewComment(post_id, user_id, company_id, comment_text) {
            try {
                const connection = await sql.connect(dbConfig);

                console.log("Received comment text: ", comment_text);

                const companyid = `SELECT company_id, name FROM users WHERE id = @user_id`;
                const companyIdRequest = connection.request();
                companyIdRequest.input("user_id", user_id);

                const companyResult = await companyIdRequest.query(companyid);
                company_id = companyResult.recordset[0].company_id;
                const username = companyResult.recordset[0].name;
                console.log("CompanyID : ", company_id);
                console.log("Username: ", username);

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
                console.log("json result: ", result);
                connection.close();

                return result.rowsAffected[0] > 0 ? { post_id, user_id, username, company_id, comment_text } : null;
            } catch (error) {
                console.error("Error adding new comments: ", error);
            }
        }

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

        static async addNewPost (user_id, company_id, context, media_url, carbon_emission, energy_consumption, activity_type, location) {
            try{
                const connection = await sql.connect(dbConfig);
                const query = `
                INSERT INTO activity_feed (user_id, company_id, context, media_url, carbon_emission, energy_consumption, activity_type, location, date, time) 
                VALUES (@user_id, @company_id, @context, @media_url, @carbon_emission, @energy_consumption, @activity_type, @location, GETDATE(), GETDATE());
                SELECT SCOPE_IDENTITY() AS post_id;`;

                const request = connection.request();
                request.input("user_id", user_id);
                request.input("company_id", sql.Int, company_id);
                request.input("context", context);
                request.input("media_url", media_url);
                request.input("carbon_emission", carbon_emission);
                request.input("energy_consumption", energy_consumption);
                request.input("activity_type", activity_type);
                request.input("location", location);

                const result = await request.query(query);
                connection.close();

                return result.recordset[0];
            } catch (error) {
                console.error("Error adding new post: ", error);
                throw error;
            }
        }
}

module.exports = Posts;