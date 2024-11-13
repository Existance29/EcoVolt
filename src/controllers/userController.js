const User = require("../models/user")
const Company = require("../models/company")
const bcrypt = require('bcryptjs');
const fs = require('fs');
const jwt = require("jsonwebtoken")
const path = require("path")
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
            //set default values
            newUser.about = "Hello!"
            newUser.profile_picture_file_name = "default.png"
            const createdUser = await User.createUser(newUser)
            //create user successful, display it as json
            res.status(201).json(userController.generateAccessToken(createdUser));
        } catch (error) {
            console.error(error);
            res.status(500).send("Error creating user")
        }
    }

    static async signInUser(req, res, next){ 
        const email = req.body.email
        const password = req.body.password
        try {
            //check if email exists
            const user = await User.getUserByEmail(email)
            if (!user) {
            return res.status(404).send("Incorrect login details")
            }
            //verify password
            if (!bcrypt.compareSync(password,user.password)){
            return res.status(404).send("Incorrect login details")
            }
            //generate jwt token
            res.json(userController.generateAccessToken(user));
        } catch (error) {
            console.error(error)
            res.status(500).send("Error logging in")
        }
    } 
    static async decodeJWT(req, res){
        res.status(200).json(req.user)
    }

    static async getPrivateUserById(req, res){

        const id = parseInt(req.user.userId);
        try {
          const user = await User.getPrivateUserById(id)
          if (!user) {
            return res.status(404).send("User not found")
          }
          res.json(user);
        } catch (error) {
          console.error(error)
          res.status(500).send("Error retrieving users")
        }
    }

    static async updateUserAccountInfo(req, res){

        try {
          const updatedUser = await User.updateUserAccountInfo(req.user.userId, req.body)
          res.status(200).json(updatedUser)
        } catch (error) {
          console.error(error);
          res.status(500).send("Error updating user")
        }
      }
    
    static async getPublicUserById(req, res){
      const id = req.params.id
        try {
          const user = await User.getUserById(id)
          if (!user) {
            return res.status(404).send("User not found")
          }
          res.json(user);
        } catch (error) {
          console.error(error)
          res.status(500).send("Error retrieving users")
        }
    }

    static async changePassword(req, res){
      try {
        const updatedUser = await User.changePassword(req.user.userId, userController.hashPassword(req.body.new_password))
        res.status(200).json({"Success":"Success"})
      } catch (error) {
        console.error(error)
        res.status(500).send("Error changing user password")
      }
    }

    static async uploadProfilePicture(req, res){
        const tempPath = req.file.path;
        const targetPath = path.join(__dirname, "./uploads/image.png");

        if (path.extname(req.file.originalname).toLowerCase() === ".png") {
        fs.rename(tempPath, targetPath, err => {
            if (err) console.log(err)

            res
            .status(200)
            .contentType("text/plain")
            .end("File uploaded!");
        });
        } else {
        fs.unlink(tempPath, err => {
            if (err) return handleError(err, res);

            res
            .status(403)
            .contentType("text/plain")
            .end("Only .png files are allowed!");
        })
        }
    } 
    static async getProfilePictureById(req, res){
      try {
        const user = await User.getUserById(req.params.id)
        if (!user) {
          return res.status(404).send("User not found")
        }
        res.sendFile(path.join(__dirname, `./uploads/${user.profile_picture_file_name}`));
      } catch (error) {
        console.error(error)
        res.status(500).send("Error retrieving profile picture")
      }
    }

}

module.exports = userController