const User = require("../models/user")
const Company = require("../models/company")
const bcrypt = require('bcryptjs');
const fs = require('fs');
const jwt = require("jsonwebtoken")
require("dotenv").config()

class userController{
    //function to encrypt password
    static hashPassword(password){
        const salt = bcrypt.genSaltSync(10)
        return bcrypt.hashSync(password,salt)
    }
    
    static generateAccessToken(user){
        //make a jsonwetoken containing the user's id and role
        const accessToken = jwt.sign({userId: user.id, companyId: user.company_id}, process.env.ACCESS_TOKEN_SECRET)
        return {accessToken: accessToken, companyId: user.company_id}
    }

    static async createUser(req, res, next) {
        const newUser = req.body;
        try {
            //hash the password and replace the password field with the new hashed password
            newUser.password = userController.hashPassword(newUser.password)
            newUser.company_id = (await Company.getCompanyByEmailDomain(newUser.email.slice(newUser.email.indexOf('@')+1))).id
            const createdUser = await User.createUser(newUser)
            //create user successful, display it as json
            res.status(201).json(userController.generateAccessToken(createdUser));
        } catch (error) {
            console.error(error);
            res.status(500).send("Error creating user")
        }
    }

}

module.exports = userController