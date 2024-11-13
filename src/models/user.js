//import sql stuff
const query = require("../libs/query")

class User{
    static async createUser(user) {
        //add user data
        const result = await query.query("INSERT INTO users (name, email, password, company_id, about, profile_picture_file_name) VALUES (@name, @email, @password, @company_id, @about, @profile_picture_file_name); SELECT SCOPE_IDENTITY() AS id;", user)
        return this.getUserById(result.recordset[0].id)
    }

    //get a user by their id
    static async getUserById(id){
        //get first user from database that matches id
        const result = (await query.exceptQuery(["password", "email"],"SELECT * FROM Users WHERE id = @id", {"id": id})).recordset[0]
        //return null if no user found
        return result ? result : null
    }

    //get a user by their email
    static async getUserByEmail(email){
        //get first user from database that matches id
        const result = (await query.query("SELECT * FROM Users WHERE email = @email", {"email": email})).recordset[0]
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
}

module.exports = User