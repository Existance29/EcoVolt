//import sql stuff
const query = require("../libs/query")

class User{
    static async createUser(user) {
        //add user data
        console.log("a")
        const result = await query.query("INSERT INTO users (name, email, password, company_id, about, profile_picture_file_name) VALUES (@name, @email, @password, @company_id, @about, @profile_picture_file_name); SELECT SCOPE_IDENTITY() AS id;", user)
        console.log("b")
        //update employee_access to link it to users
        await query.query("UPDATE employee_access SET user_id = (SELECT id FROM users WHERE email = @email) WHERE email = @email", {"email": user.email})
        return this.getUserById(result.recordset[0].id)
    }

    //get a user by their id
    static async getUserById(id){
        //get first user from database that matches id
        const result = (await query.exceptQuery(["password", "email"],"SELECT u.*, e.access_level FROM Users AS u INNER JOIN employee_access AS e ON u.id = e.user_id WHERE id = @id", {"id": id})).recordset[0]
        //return null if no user found
        return result ? result : null
    }

    //get a public user by their id
    static async getPublicUserById(id){
        //get first user from database that matches id
        const result = (await query.exceptQuery(["password", "email", "profile_picture_file_name"],"SELECT u.*, c.alias AS company_alias FROM Users AS u INNER JOIN companies AS c ON u.company_id = c.id WHERE u.id = @id", {"id": id})).recordset[0]
        //return null if no user found
        return result ? result : null
    }

    //get a user by their email
    static async  getUserByEmail(email){
        //get first user from database that matches id
        const result = (await query.query("SELECT u.*, e.access_level FROM Users AS u INNER JOIN employee_access AS e ON u.id = e.user_id WHERE u.email = @email", {"email": email})).recordset[0]
        //return null if no user found
        return result ? result : null
    }

    static async getPrivateUserById(id){
        //unlike getUserById, this function is only meant to be accessed by the logged in user
        //returns email, still exclude password
         //get first user from database that matches id and exclude the password
        const result = (await query.exceptQuery(["password"],"SELECT * FROM Users WHERE id = @id", {"id": id})).recordset[0]
        //return null if no user found
        return result ? result : null
    }

    static async updateUserAccountInfo(id,user){
        //accept a object and add it to the database
        user.id = id
        await query.query("UPDATE Users SET name = @name, email = @email, about = @about WHERE id = @id", user)
        //return the updated user
        return this.getUserById(id)
    }

    static async changePassword(id, newPassword){
        await query.query("UPDATE Users SET password = @password WHERE id = @id", {"id":id,"password":newPassword})
        //return the updated hashed password
        return {password: newPassword}
    }

    static async updateProfilePicture(id, fileName) {
        await query.query("UPDATE Users SET profile_picture_file_name = @fileName WHERE id = @id", {
            id,
            fileName
        });
    }

    static async getUserPublicActivity(id){
        //get first user from database that matches id
        //adapted from activityModel getAllPosts
        const posts = (await query.query(
        `
        SELECT 
            af.post_id, af.context, af.date, 
            COUNT(DISTINCT l.like_id) AS likes,
            COUNT(DISTINCT d.dislike_id) AS dislikes,
            COUNT(DISTINCT c.comment_id) AS comments
            FROM activity_feed af
            LEFT JOIN likes l ON af.post_id = l.post_id
            LEFT JOIN dislikes d ON af.post_id = d.post_id
            LEFT JOIN comments c ON af.post_id = c.post_id
            LEFT JOIN users u ON u.id = af.user_id
            WHERE af.user_id=@id
            GROUP BY af.post_id, af.context, af.date
        `, {"id": id})).recordset

        const comments = (await query.query(
            `SELECT comment_id, c.post_id, comment_text, c.date, context FROM comments AS c INNER JOIN activity_feed AS p ON c.post_id = p.post_id WHERE c.user_id=@id`
            , {"id": id})).recordset

        const result = {
            posts: posts,
            comments: comments
        }
        return result
    }
    
}

module.exports = User