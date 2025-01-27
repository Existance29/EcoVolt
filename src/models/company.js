//import sql stuff
const query = require("../libs/query")

class Company{
    //get a company by their email domain
    static async getCompanyByEmailDomain(domain){
        //get first company that matches
        const result = (await query.query("SELECT * FROM companies WHERE email_domain = @domain", {"domain": domain})).recordset[0]
        //return null if no company found
        return result ? result : null
    }

    static async isEmailValid(email){
        //check the employee_access_level table and ensure that the company has such an email
        const result = (await query.query("SELECT * FROM employee_access WHERE email = @email", {"email": email})).recordset[0]
        return Boolean(result)
    }
}

module.exports = Company