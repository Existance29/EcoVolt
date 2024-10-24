const usersController = require("../controllers/userController");
const validateUser = require("../middlewares/validateUser");

// Create routes
const userRoute = (app) => {
    app.post("/users/signup", validateUser.validateSignUpUser, usersController.createUser) //sign up
};

module.exports = userRoute;