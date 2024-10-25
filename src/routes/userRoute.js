const userController = require("../controllers/userController");
const validateUser = require("../middlewares/validateUser");
const authenticateToken = require("../middlewares/authenticateToken")

// Create routes
const userRoute = (app) => {
    app.post("/users/signup", validateUser.validateSignUpUser, userController.createUser) //sign up
    app.post("/users/signin", userController.signInUser) //sign in
    app.get("/users/decodejwt", authenticateToken, userController.decodeJWT) //this route is for decoding the jwt
};

module.exports = userRoute;