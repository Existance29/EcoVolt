const reward = require("../models/reward")

class rewardController {

    static async getAllRewards(req, res) {
        try {
            const rewards = await reward.getAllRewards();
            if (rewards === null) {
                return res.status(404).json({ message: "No rewards found" });
            }
            return res.status(200).json(rewards);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async getUserAvailablePoints(req, res) {
        try {
            const userId = req.user.userId;
            // console.log(userId);
            if (!userId) {
                return res.status(400).json({ message: "User ID is required" });
            }
            const points = await reward.getUserAvailablePoints(userId);
            // console.log(points);
            return res.status(200).json({ points });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    
    static async redeemReward(req, res) {
        try {
            const rewardId = req.body.id;
            const userId = req.user.userId;
            if (!rewardId || !userId) {
                return res.status(400).json({ message: "Reward ID and user ID are required" });
            }
            const checkUser = await reward.getUserById(userId);
            if (checkUser === null) {
                return res.status(404).json({ message: "User not found" });
            }
            const checkRewardId = await reward.getRewardById(rewardId);
            if (checkRewardId === null) {
                return res.status(404).json({ message: "Reward not found" });
            }
            const checkUserAvailPoints = await reward.getUserAvailablePoints(userId);
            if (checkUserAvailPoints === 0) {
                return res.status(400).json({ message: "Insufficient points" });
            }
            const remainingPoints = checkUserAvailPoints - checkRewardId.points_required;
            // console.log(checkRewardId);
            if (remainingPoints < 0) {
                return res.status(400).json({ message: "Insufficient points" });
            }
            await reward.updateUserAvailablePoints(userId, remainingPoints);
            await reward.updateRewardHistory(userId, rewardId, checkRewardId.points_required);

            return res.status(200).json({ message: "Reward redeemed successfully" });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async getRewardHistory(req, res) {
        const userId = req.user.userId;
        try {
            if (!userId) {
                return res.status(400).json({ message: "User ID is required" });
            }
            const rewardHistory = await reward.getRewardHistory(userId);
            // console.log("rewardHistory",rewardHistory);
            return res.status(200).json(rewardHistory);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

module.exports = rewardController