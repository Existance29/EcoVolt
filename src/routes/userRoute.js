const userController = require("../controllers/userController");
const validateUser = require("../middlewares/validateUser");
const authenticateToken = require("../middlewares/authenticateToken")
const multer = require("multer");

const upload = multer({
    dest: "../uploads/profile-pictures"
    // you might also want to set some limits: https://github.com/expressjs/multer#limits
});

// Create routes
const userRoute = (app) => {
    app.post("/users/signup", validateUser.validateSignUpUser, userController.createUser) //sign up
    app.post("/users/signin", userController.signInUser) //sign in
    app.get("/users/decodejwt", authenticateToken, userController.decodeJWT) //this route is for decoding the jwt
    app.get("/users/account/public/:id", userController.getPublicUserById) //this route is for decoding the jwt
    app.get("/users/account/private", authenticateToken, userController.getPrivateUserById)
    app.put("/users/account/private", authenticateToken, validateUser.validateAccountUpdate, userController.updateUserAccountInfo)
    app.put("/users/password", authenticateToken, validateUser.validateNewPassword, userController.changePassword)
    app.post("/users/profile-picture", upload.single("file"), userController.uploadProfilePicture)
};

module.exports = userRoute;