const userController = require("../controllers/userController");
const validateUser = require("../middlewares/validateUser");

// Create routes
const userRoute = (app) => {
    app.post("/users/signup", validateUser.validateSignUpUser, userController.createUser) //sign up
    app.post("/users/signin", userController.signInUser) //sign in
};

module.exports = userRoute;