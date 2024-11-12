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
        } else {
            res.status(500).json({ error: "Failed to add comment"})
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "failed to post new comment" });
    }
};

const addNewPost = async (req, res) => {
    const { user_id, company_id, context, media_url, carbon_emission, energy_consumption, activity_type, location} = req.body;

    try {
        const newPost = await activityModel.addNewPost(
            user_id, company_id, context, media_url, carbon_emission, energy_consumption, activity_type, location
        );

        if (newPost) {
            res.status(201).json({ message: "Post created successfully", post_id: newPost.post_id });
        } else {
            res.status(500).json({ error: "Failed to create post" });
        }
    } catch (error) {
        console.error("Error creating post: ", error);
        res.status(500).json({ error: "Failed to create post" });
    }
}

module.exports = {
    getAllPosts,
    toggleLike,
    toggleDislike,
    getCommentsByPostId,
    addNewComment,
    addNewPost,
}