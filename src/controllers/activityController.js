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
            // await activityModel.trackActivity(user_id, company_id, post_id, "like", 5);
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
            // await activityModel.trackActivity(user_id, company_id, post_id, "dislike", 1);
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
            // await activityModel.trackActivity(user_id, company_id, post_id, "comment", 10);
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
        const media = await activityModel.getMedia(post_id);
        if (!media || !media.media_url) {
            return res.status(404).json({ error: "Media not found"})
        }
        
        const mediaPath = path.join(__dirname, `../uploads/activity-feed/${media.media_url}`);
        
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
        res.status(200).json({ message: "Getting current events successful.", events: events });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Controller to log user progress
const logUserProgress = async (req, res) => {
    const { user_id, post_id, event_id, reduction_amount } = req.body;
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    let newStreak = 1;
    let highestStreak = 1;
    let totalPosts = 1;
    let updatedReduction = reduction_amount;

    try {
        const lastRecord = await activityModel.getLastRecord(user_id, event_id);

        if (lastRecord) {
            totalPosts = lastRecord.total_post + 1;
            const lastUpdated = lastRecord.last_updated.toISOString().split('T')[0]; // Format: YYYY-MM-DD

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            if (lastUpdated === yesterdayStr) {
                newStreak = lastRecord.streak_count + 1;
                highestStreak = Math.max(lastRecord.highest_streak, newStreak);
            } else {
                highestStreak = Math.max(lastRecord.highest_streak, lastRecord.streak_count);
            }

            updatedReduction += lastRecord.reduction_amount;
        }
    
        await activityModel.logUserProgress(user_id, post_id, event_id, updatedReduction, newStreak, highestStreak, totalPosts);
        res.status(200).json({ message: "Progress logged successfully"});
    } catch (error) {
        console.error("Error logging user progress:", error);
        res.status(500).json({ error: "Failed to log user progress." });
    }
};

const getUserProgress = async (req, res) => {
    const { user_id, event_id } = req.params;

    try {
        const userProgress = await activityModel.getUserProgress(user_id, event_id);

        if (userProgress.length === 0) {
            return res.json({ streak_count: 0, reduction_amount: 0 });
        }

        const { streak_count, reduction_amount } = userProgress[0];

        res.status(200).json({
            streak_count,
            reduction_amount,
        });

    } catch (error) {
        console.error("Error fetching progress:", error);
        res.status(500).json({ error: "Failed to retrieve progress data" });
    }
}

const getTopContributorsWithinCompany = async(req, res) => {
    try{
        const { company_id } = req.params;
        const contributors = await activityModel.getTopContributorsWithinCompany(company_id);

        res.status(200).json(contributors);
    } catch (error) {
        res.status(500).json({ message: "Error fetching top contributors", error: error.message });
    }
}

const updateCompanyContributions = async(req, res) => {
    try {
        const { company_id, reduction_amount } = req.body;
        await activityModel.updateCompanyContributions(company_id, reduction_amount);
        res.status(200).json({ message: "Company contributions updated successfully. "});
    } catch (error) {
        res.status(500).json({ message: "Error fetching top contributors", error: error.message });
    }
}

const getTopCompanies = async(req, res) => {
    try {

        const companyContributors = await activityModel.getTopCompanies();
        res.status(200).json(companyContributors);
    } catch (error) {
        res.status(500).json({ message: "Error fetching top contributors", error: error.message });
    }
}


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
    logUserProgress,
    getUserProgress,
    getTopContributorsWithinCompany,
    updateCompanyContributions,
    getTopCompanies,
}