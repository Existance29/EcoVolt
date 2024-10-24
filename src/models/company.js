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
}

module.exports = Company