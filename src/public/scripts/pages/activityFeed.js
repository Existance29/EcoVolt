window.onload = async function() {
    try {
        const response = await fetch('http://localhost:3000/posts', { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const posts = await response.json();
        const postsContainer = document.querySelector('.posts');
        postsContainer.innerHTML = '';

        if (posts.length > 0) {
            posts.forEach((post) => {
            const postElement = document.createElement("div");
            postElement.classList.add("post");
            postElement.setAttribute("data-post-id", post.post_id);

            const postHeader = document.createElement("div");
            postHeader.classList.add("post-header");
            postHeader.innerHTML = `
            <h3>${post.user_name || "Anonymous"}</h3>
            <span class="timestamp">Posted on: ${post.date}</span>
            `;

            const postContent = document.createElement("p");
            postContent.classList.add("post-content");
            postContent.textContent = post.context || "No content available.";

            const postFooter = document.createElement("div");
            postFooter.classList.add("postfooter");

            const actionButtons = document.createElement("div");
            actionButtons.classList.add("action-buttons");

            const likeButton = document.createElement("button");
            likeButton.classList.add("action-btn", "like-button");
            likeButton.innerHTML = `
            <i class = "fa fa-thumbs-up"></i>
            <span class="likes-count">${post.likes_count || 0} Likes</span>
            `;
            likeButton.addEventListener("click", () => updateLikes(post.post_id, likeButton));

            const dislikeButton = document.createElement("button");
            dislikeButton.classList.add("action-btn", "dislike-button");
            dislikeButton.innerHTML = `
            <i class = "fa fa-thumbs-down"></i>
            <span class="dislikes-count">${post.dislikes_count || 0} Dislikes</span>
            `;
            dislikeButton.addEventListener("click", () => updateDislikes(post.post_id, dislikeButton));

            const commentButton = document.createElement("button");
            commentButton.classList.add("action-btn", "comment-button");
            commentButton.innerHTML = `
            <i class = "fa fa-comment"></i>
            <span class="comments-count">${post.comments_count || 0} Comments</span>
            `;
            commentButton.addEventListener("click", () => showComments(post.post_id));

            actionButtons.appendChild(likeButton)
            actionButtons.appendChild(dislikeButton) 
            actionButtons.appendChild(commentButton);
            postFooter.appendChild(actionButtons);

            const commentsContainer = document.createElement("div");
            commentsContainer.classList.add("comments-container");
            commentsContainer.style.display = "none";

            postElement.append(postHeader, postContent, postFooter, commentsContainer);

            postsContainer.appendChild(postElement);
        });
        } else {
            postsContainer.innerHTML = '<p>No posts available.</p>';
        }

        const addNewPostButton = document.getElementById("new-post-button");
        const closeModalButton = document.getElementById("closeModalBtn");
        const modal = document.getElementById("postModal");

        addNewPostButton.addEventListener("click", () => {
            modal.style.display = "flex";
            //addNewPost(user_id);
            closeModalButton.addEventListener("click", () => {
                modal.style.display = "none";
            });
            
        });
        
    } catch (error) {
        console.error("Error getting all posts : ", error);
    }
};

async function updateLikes(post_id, likeButton) {
    try {
        const response = await fetch('http://localhost:3000/toggleLike', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ post_id, user_id: userId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const likesCountElement = likeButton.querySelector('.likes-count');
        likesCountElement.textContent = `${data.likeCount} Likes`;

        if (data.isLiked) {
            likeButton.classList.add("liked");
        } else {
            likeButton.classList.remove("liked");
        }
    } catch (error) {
        console.error("Error updating likes: ", error);
    }
}


async function updateDislikes(post_id, dislikeButton) {
    try {
        const response = await fetch('http://localhost:3000/toggleDislike', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ post_id, user_id: userId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const dislikesCountElement = dislikeButton.querySelector('.dislikes-count');
        dislikesCountElement.textContent = `${data.dislikeCount} Dislikes`;

        if (data.isDisliked) {
            dislikeButton.classList.add("disliked");
        } else {
            dislikeButton.classList.remove("disliked");
        }
    } catch (error) {
        console.error("Error updating dislikes: ", error);
    }
}

async function showComments(postId) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    const commentsContainer = postElement.querySelector('.comments-container');
    commentsContainer.style.display = commentsContainer.style.display === 'none' ? 'block' : 'none';

    if (commentsContainer.style.display === 'block') {
        loadComments(postId, commentsContainer);
    }
}

async function loadComments(post_id, commentsContainer) {
    try {
        const response = await fetch(`http://localhost:3000/comment/${post_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if(!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const comments = await response.json();
        console.log("Fetched comments: ", comments);
        commentsContainer.innerHTML = "";

        if (comments.length === 0) {
            commentsContainer.innerHTML = "<p>No comments yet.</p>";
        } else {
            comments.forEach(comment => {
                const commentElement = document.createElement("div");
                commentElement.classList.add("comment");
                console.log("Comment: ", comment);

                const userName = comment.name || "Anonymous";
                const commentText = comment.comment_text || "No comment.";
                commentElement.innerHTML = `
                <strong>${userName}</strong> 
                <p>${commentText}</p>
                `;
                commentsContainer.appendChild(commentElement);
            });
        }

        const newCommentDiv = document.createElement("div");
        newCommentDiv.classList.add("new-comment");
        newCommentDiv.innerHTML = `
        <input type="text" id="new-comment-${post_id}" placeholder="Add a comment...." />
        <button class="add-comment-btn">Post</button>`;

        const postButton = newCommentDiv.querySelector('.add-comment-btn');
        postButton.addEventListener("click", () => {
            const commentInput = document.getElementById(`new-comment-${post_id}`);
            console.log("comment input in text box : ", commentInput.value);
            addComment(post_id, commentInput.value, postButton);
        });

        commentsContainer.appendChild(newCommentDiv);

    } catch (error) {
        console.error("Error loading comments: ", error);
    }
}

async function addComment(post_id, commentText, commentButton) {
    user_id = 13;
    console.log("Comment Text : ", commentText);
    if (!commentText) return;

    try {
        const response = await fetch('http://localhost:3000/newComments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ post_id, user_id, comment_text: commentText })
        });

        console.log("Comment text in front-end: ", commentText);

        if(!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const newComment = await response.json();

        console.log("New comment added: ", newComment);

        const commentsContainer = document.querySelector(`[data-post-id="${post_id}"] .comments-container`);
        const commentElement = document.createElement("div");
        commentElement.classList.add("comment");
        commentElement.innerHTML = `
            <strong>${newComment.username || "Anonymous"}</strong>
            <p>${newComment.comment_text || "No comment."}</p>
        `;
        commentsContainer.appendChild(commentElement);

        document.getElementById(`new-comment-${post_id}`).value = "";

    } catch (error) {
        console.error("Error adding comments: ", error);
    }
}

async function addNewPost(user_id, company_id) {
    const postContext = document.getElementById('postContext').value || null;
    const postLocation = document.getElementById('postLocation').value || null;
    const postCarbonEmission = parseFloat(document.getElementById('postCarbonEmission').value) || 0;
    const postEnergyConsumption = parseFloat(document.getElementById('postEnergyConsumption').value) || 0;
    const postActivityType = document.getElementById('postActivityType').value|| null;

    if (!postContext && !postLocation && !postActivityType) {
        alert("Discard?")
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/addPost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id, company_id, data_center_id, 
                context: postContext, 
                media_url, 
                carbon_emission: postCarbonEmission,
                energy_consumption: postEnergyConsumption,
                activity_type: postActivityType,
                location: postLocation 
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("New post added successfully:", data);

        document.getElementById('postContext').value = '';
        document.getElementById('postLocation').value = '';
        document.getElementById('postCarbonEmission').value = '';
        document.getElementById('postEnergyConsumption').value = '';
        document.getElementById('postActivityType').value = '';
        
        alert("Post added successfully!");
        document.getElementById("modal").style.display = "none";

    } catch (error) {
        console.error("Error adding post:", error);
    }
}