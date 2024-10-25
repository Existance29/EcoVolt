const Joi = require("joi")
const User = require("../models/user")
const Company = require("../models/company")
const bcrypt = require('bcryptjs');
const validateSchema = require("../libs/validateSchema")

const customEmailValidation = async(email, helper) => {
    //extract the domain from the email
    var i = email.indexOf('@')
    var emailDomain = email.slice(i+1)
    //ensure that email is a valid company email
    const companyEmailResult = await Company.getCompanyByEmailDomain(emailDomain)
    if (!companyEmailResult) return helper.message('this email is not a valid company email')
    //ensure that email is unique
    const repeatEmailResult = await User.getUserByEmail(email)
    //if result exists, then email is taken
    return repeatEmailResult ? helper.message('this email is already taken') : email
}

class validateUser{

    static async validateSignUpUser(req, res, next){

        const schema = Joi.object({
          name: Joi.string().min(1).max(40).required(), //no blanks, max 40 chars
          email: Joi.string().min(3).max(50).required().email().external(customEmailValidation), //must be valid email + not taken
          password: Joi.string().min(5).max(100).required(), //min 5 chars, max 100
        })
        //check if validation successful
        if (await validateSchema(req,res,schema)) next()
    }
}
module.exports = validateUser