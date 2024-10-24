//import sql stuff
const query = require("../libs/query")

class User{
    static async createUser(user) {
        //accept a object and add it to the database
        //add user data
        const params = {
            "name": user.name,
            "email": user.email,
            "password": user.password,
            "company_id": user.company_id,
        }
        
        const result = await query.query("INSERT INTO users (name, email, password, company_id) VALUES (@name, @email, @password, @company_id); SELECT SCOPE_IDENTITY() AS id;", params)
        return this.getUserById(result.recordset[0].id)
    }

    //get a user by their id
    static async getUserById(id){
        //get first user from database that matches id
        const result = (await query.query("SELECT * FROM users WHERE id = @id", {"id": id})).recordset[0]
        //return null if no user found
        return result ? result : null
    }

    //get a user by their email
    static async getUserByEmail(email){
        //assign sql params to their respective values
        const params = {"email": email}
            //get first user from database that matches id
        const result = (await query.query("SELECT * FROM users WHERE email = @email", params)).recordset[0]
        //return null if no user found
        return result ? result : null
    }
}

module.exports = User