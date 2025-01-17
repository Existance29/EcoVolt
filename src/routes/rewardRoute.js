const rewardController = require("../controllers/rewardController");
const authenticateToken = require("../middlewares/authenticateToken")


const rewardRoute = (app) => {
    app.get("/rewards", authenticateToken, rewardController.getAllRewards);
    app.get("/rewards/available-points", authenticateToken, rewardController.getUserAvailablePoints);
    app.get("/rewards-history", authenticateToken, rewardController.getRewardHistory);
    app.get("/rewards/activity-history", authenticateToken, rewardController.getActivityHistory);
    app.post("/redeem-reward", authenticateToken, rewardController.redeemReward);
};

module.exports = rewardRoute;
