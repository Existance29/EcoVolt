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
                    COUNT(DISTINCT l.like_id) AS total_likes,
                    COUNT(DISTINCT d.dislike_id) AS total_dislikes,
                    COUNT(DISTINCT c.comment_id) AS total_comments
                    FROM activity_feed af
                    INNER JOIN likes l ON af.post_id = l.post_id
                    INNER JOIN dislikes d ON af.post_id = d.post_id
                    INNER JOIN comments c ON af.post_id = c.post_id
                    INNER JOIN users u ON u.id = af.user_id
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

}

module.exports = Posts;