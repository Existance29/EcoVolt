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

const toggleLike = async (req, res) => {
    const { post_id, user_id } = req.body;
    console.log(`postId: ${post_id}, userID: ${user_id}`);

    try {
        const isLiked = await activityModel.isLiked(post_id, user_id);

        if (isLiked) {
            await activityModel.removeLike(post_id, user_id);
        } else {
            await activityModel.addLike(post_id, user_id);
        }

        const updatedLikeCount = await activityModel.getLikeCount(post_id);
        res.status(200).json({ likeCount: updatedLikeCount });
    } catch (error) {
        console.error("Error toggling like: ", error);
        res.status(500).json({ error: "Failed to toggle like" });
    }
};


const toggleDislike = async (req, res) => {
    const { post_id, user_id } = req.body;
    console.log(`postId: ${post_id}, userID: ${user_id}`);

    try {
        const isDisliked = await activityModel.isDisliked(post_id, user_id);

        if (isDisliked) {
            await activityModel.removeDislike(post_id, user_id);
        } else {
            await activityModel.addDislike(post_id, user_id);
        }

        const updatedDislikeCount = await activityModel.getDislikeCount(post_id);
        res.status(200).json({ dislikeCount: updatedDislikeCount });
    } catch (error) {
        console.error("Error toggling dislike: ", error);
        res.status(500).json({ error: "Failed tp toggle dilike" });
    }
};

module.exports = {
    getAllPosts,
    toggleLike,
    toggleDislike,
}