const activityModel = require("../models/activityModel");

const getAllPosts = async (req, res) => {
    try {
        const posts = await activityModel.getAllPosts();
        // res.json(posts);
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "failed to fetch posts" });
    }
}

module.exports = {
    getAllPosts,
}