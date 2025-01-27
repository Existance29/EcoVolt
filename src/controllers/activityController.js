// Import
const activityModel = require("../models/activityModel");
const fs = require('fs');
const path = require('path');

// Controller to fetch all posts
const getAllPosts = async (req, res) => {
    try {
        const posts = await activityModel.getAllPosts();
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching all posts: ", error);
        res.status(500).json({ error: "failed to fetch posts" });
    }
}

// Controller to toggle like status of a post
const toggleLike = async (req, res) => {
    const { post_id, user_id, company_id } = req.body;

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


// Controller to toggle dislike status of a post
const toggleDislike = async (req, res) => {
    const { post_id, user_id, company_id } = req.body;

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


// Controller to fetch comments for a specific post by post ID
const getCommentsByPostId = async (req, res) => {
    const post_id = parseInt(req.params.post_id);

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


// Controller to add a new comment to a post
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


// Controller to add a new post
const addNewPost = async (req, res) => {
    const { user_id, company_id, context } = req.body;

    const tempPath = req.file.path;
    const fileName = `${user_id}_${Date.now()}.png`;
    const targetPath = path.join(__dirname, `../uploads/activity-feed/${fileName}`);

    try {
        if (path.extname(req.file.originalname).toLowerCase() === ".png") {
            await fs.promises.rename(tempPath, targetPath);
            const media_url = `${fileName}`;
            const newPost = await activityModel.addNewPost(
                user_id, company_id, context, media_url
            );
            if (newPost) {
                res.status(201).json({ message: "Post created successfully", post_id: newPost.post_id });
                const postId = newPost.post_id;
                await activityModel.trackActivity(user_id, company_id, postId, "posts", 20);
            } else {
                await fs.promises.unline(targetPath);
                res.status(500).json({ error: "Failed to create post" });
            }
        } else {
            await fs.promises.unlink(tempPath);
            res.status(403).json({ error: "Only .png files are allowed" });
        }
    } catch (error) {
        console.error("Error creating post: ", error);
        res.status(500).json({ error: "Failed to create post" });
    }
}

const getMedia = async (req, res) => {
    try {
        const post_id = req.params.post_id;
        console.log("post:id", post_id);
        const media = await activityModel.getMedia(post_id);
        if (!media || !media.media_url) {
            return res.status(404).json({ error: "Media not found"})
        }
        
        const mediaPath = path.join(__dirname, `../uploads/activity-feed/${media.media_url}`);
        console.log("Serving file: ", mediaPath);

        res.sendFile(mediaPath);
    } catch (error) {
        console.error("Error retrieving media: ", error);
        res.status(500).send("Error retrieving post media");
    }
}

// Controller to track an activity for reward system
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

// Controller to get the summary of the interactions and total points for a user
const getActivitySummary = async (req, res) => {
    const { user_id, company_id } = req.body;

    try {
        const totalPoints = await activityModel.getTotalPoints(user_id, company_id);
        const activitySummary = await activityModel.getActivitySummary(user_id, company_id);
        res.status(201).json({
            totalPoints, 
            activitySummary,
        });
    } catch (error) {
        console.error("Error fetching activity summary: ", error);
        res.status(500).json({ error: "Failed to fetch activity summary" });
    }
};

// Controller to allow user to redeem a reward by working with points of a user
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

const getCurrentEvents = async (req, res) => {
    try {
        const events = await activityModel.getCurrentEvents();
        res.status(200).json({ message: "Getting current events successful." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getUserProgress = async (req, res) => {
    try {
        const { userId } = req.params;
        const progress = await activityModel.getUserProgress(userId);
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const logUserProgress = async (req, res) => {
    try {
        const { userId, eventId, reductionAmount, postId } = req.body;
        await activityModel.logUserProgress(userId, eventId, reductionAmount, postId);
        res.json({ message: "Progress logged!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Exports
module.exports = {
    getAllPosts,
    toggleLike,
    toggleDislike,
    getCommentsByPostId,
    addNewComment,
    addNewPost,
    getMedia,
    trackActivity,
    getActivitySummary,
    redeemReward,
    getCurrentEvents, 
    getUserProgress,
    logUserProgress,
}