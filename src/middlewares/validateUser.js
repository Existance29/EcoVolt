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

const isPasswordCorrect = async (id,password,helper) => {
    const user = await User.getPrivateUserById(id)
    //if result exists, then password is valid
    if (user == null){
      return helper.message('could not find user') //this in theory should never trigger, but a fail safe is nice
    }
    //call the getUserByEmail to get the password
    const privateUser = await User.getUserByEmail(user.email)
    //check if password is valid
    if (!bcrypt.compareSync(password,privateUser.password)){
      return helper.message("password is incorrect")
    }
    return password
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

    static async validateAccountUpdate(req, res, next){
        const schema = Joi.object({
            name: Joi.string().min(1).max(40).required(), //no blanks, max 40 chars
            email: Joi.string().min(3).max(50).required().email().external(async(email, helper) => {
    
                const res = await customEmailValidation(email, helper)
                //check if the email belongs to the user
                const user = await User.getPrivateUserById(req.user.userId)
                if (user.email !== email) return res
            }),
            about: Joi.string().max(250).required().allow(''), //can be blank, max 250 chars
          })
          //check if validation successful
          if (await validateSchema(req,res,schema)) next()
    }

    static async validateNewPassword(req,res,next){
        const schema = Joi.object({
        old_password: Joi.string().required().external((value,helper) => isPasswordCorrect(req.user.userId,value,helper)), //make sure current password is correct
        new_password: Joi.string().min(5).max(100).required(), //ensure new password matches the basic password req (min 5 chars)
        //check that repeat new password matches with the new password
        confirm_new_password: Joi.string().required().external((value,helper) => (req.body.new_password == value)? value : helper.message('password does not match the new password')),
        })
        //check if validation successful
        if (await validateSchema(req,res,schema)) next()
    }
}
module.exports = validateUser