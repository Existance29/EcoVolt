const activityModel = require("../models/activityModel");

const getAllPosts = async (req, res) => {
    try {
        const posts = await activityModel.getAllPosts();
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching all posts: ", error);
        res.status(500).json({ error: "failed to fetch posts" });
    }
}

const toggleLike = async (req, res) => {
    const { post_id, user_id, company_id } = req.body;
    console.log(`postId: ${post_id}, userID: ${user_id}`);

    try {
        const isLiked = await activityModel.isLiked(post_id, user_id);

        if (isLiked) {
            await activityModel.removeLike(post_id, user_id);
        } else {
            await activityModel.addLike(post_id, user_id);
            await activityModel.trackActivity(user_id, company_id, post_id, "like", 5);
        }

        const updatedLikeCount = await activityModel.getLikeCount(post_id);
        res.status(200).json({ likeCount: updatedLikeCount });
    } catch (error) {
        console.error("Error toggling like: ", error);
        res.status(500).json({ error: "Failed to toggle like" });
    }
};


const toggleDislike = async (req, res) => {
    const { post_id, user_id, company_id } = req.body;
    console.log(`postId: ${post_id}, userID: ${user_id}`);

    try {
        const isDisliked = await activityModel.isDisliked(post_id, user_id);

        if (isDisliked) {
            await activityModel.removeDislike(post_id, user_id);
        } else {
            await activityModel.addDislike(post_id, user_id);
            await activityModel.trackActivity(user_id, company_id, post_id, "dislike", 1);
        }

        const updatedDislikeCount = await activityModel.getDislikeCount(post_id);
        res.status(200).json({ dislikeCount: updatedDislikeCount });
    } catch (error) {
        console.error("Error toggling dislike: ", error);
        res.status(500).json({ error: "Failed to toggle dislike" });
    }
};

const getCommentsByPostId = async (req, res) => {
    const post_id = parseInt(req.params.post_id);
    console.log(`postId: ${post_id}`);
    try {
        const comments = await activityModel.getCommentsByPostId(post_id);
        if (!comments) {
            return res.status(404).send({ message: "No comments found" });
        }
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "failed to fetch comments" });
    }
};

const addNewComment = async (req, res) => {
    const { post_id, user_id, company_id, comment_text } = req.body;
    try {
        const newComment = await activityModel.addNewComment(post_id, user_id, company_id, comment_text);
        const updatedComments = await activityModel.getCommentsByPostId(post_id);
        if (newComment) {
            res.status(200).json({newComment, commentsCount: updatedComments.length});
            await activityModel.trackActivity(user_id, company_id, post_id, "comment", 10);
        } else {
            res.status(500).json({ error: "Failed to add comment"})
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "failed to post new comment" });
    }
};

const addNewPost = async (req, res) => {
    const { user_id, company_id, context, media_url, carbon_emission, energy_consumption, category, location} = req.body;
    try {
        const newPost = await activityModel.addNewPost(
            user_id, company_id, context, media_url, carbon_emission, energy_consumption, category, location
        );

        if (newPost) {
            res.status(201).json({ message: "Post created successfully", post_id: newPost.post_id });
            const postId = newPost.post_id;
            await activityModel.trackActivity(user_id, company_id, postId, "posts", 20);
        } else {
            res.status(500).json({ error: "Failed to create post" });
        }
    } catch (error) {
        console.error("Error creating post: ", error);
        res.status(500).json({ error: "Failed to create post" });
    }
}

const trackActivity = async (req, res) => {
    const { user_id, company_id, post_id, activity_type, points } = req.body;
    
    try {
        const activity = await activityModel.trackActivity(
            user_id, company_id, post_id, activity_type, points
        );

        if (activity) {
            res.status(201).json({ message: "Track activity successfully"});
        } else {
            res.status(500).json({ error: "Failed to track activity "});
        }
    } catch (error) {
        console.error("Error tracking activity : ", error);
        res.status(500).json({ error: "Failed to track activity" });
    }
}

const getActivitySummary = async (req, res) => {
    const { user_id, company_id } = req.body;

    try {
        const totalPoints = await activityModel.getTotalPoints(user_id, company_id);
        const activitySummary = await activityModel.getActivitySummary(user_id, company_id);
        console.log("Backend", totalPoints);
        res.status(201).json({
            totalPoints, 
            activitySummary,
        });
    } catch (error) {
        console.error("Error fetching activity summary: ", error);
        res.status(500).json({ error: "Failed to fetch activity summary" });
    }
};

const redeemReward = async (req, res) => {
    const { user_id, company_id, reward_id } = req.body;

    try {
        const totalPoints = await activityModel.getTotalPoints(user_id, company_id);
        const pointsRequired = 1000;

        if (totalPoints >= pointsRequired) {
            await activityModel.deductPoints(user_id, pointsRequired);
            res.status(200).json({ message: "Reward redeemed successfully." });
        } else {
            res.status(400).json({ error: "Not enough points to redeem reward." });
        }

    } catch (error) {
        console.error("Error redeeming reward:", error);
        res.status(500).json({ error: "Failed to redeem reward." });
    }
};

module.exports = {
    getAllPosts,
    toggleLike,
    toggleDislike,
    getCommentsByPostId,
    addNewComment,
    addNewPost,
    trackActivity,
    getActivitySummary,
    redeemReward,
}