const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req,res,next) => {
    //get token and check if its valid
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);
    //verify token
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,user) => {
        if (err) return res.sendStatus(403);

        const adminRoutes = ["Dashboard", "reports"]
        const accessLevel = user.accessLevel
        const requestEndpoint = req.url.split('?')[0]
        const paths = requestEndpoint.split("/")
        
        adminRoutes.forEach(x => {
            if (paths[0] == adminRoutes && accessLevel == 0){
                return res.status(403).json({ message: 'Forbidden' })
            }
        })
        req.user = user;
        next();
    })
}

module.exports = authenticateToken