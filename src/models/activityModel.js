const sql = require("mssql"); 
const dbConfig = require("../database/dbConfig.js");

class Posts {
    constructor (post_id, user_id, company_id, 
        data_center_id, context, media_url, 
        carbon_emission, energy_consumption, 
        activity_type, location, timestamp, likes_count,
        dislikes_count, comments_count) {
            this.post_id = post_id;
            this.user_id = user_id;
            this.company_id = company_id;
            this.data_center_id = data_center_id;
            this.context = context;
            this.media_url = media_url;
            this.carbon_emission = carbon_emission;
            this.energy_consumption = energy_consumption;
            this.activity_type = activity_type;
            this.location = location;
            this.timestamp = timestamp;
            this.likes_count = likes_count;
            this.dislikes_count = dislikes_count;
            this.comments_count = comments_count;
        }
    
        static async getAllPosts() {
            try {
                const connection = await sql.connect(dbConfig)
                const query = `
                SELECT * FROM activity_feed`;
            } catch (error) {
                console.error("Error getting all posts", error);
            }
        }
}

module.exports = Posts;