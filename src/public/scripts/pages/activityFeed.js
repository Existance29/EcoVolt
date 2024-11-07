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

            actionButtons.appendChild(likeButton)
            actionButtons.appendChild(dislikeButton) 
            actionButtons.appendChild(commentButton);
            postFooter.appendChild(actionButtons);

            postElement.append(postHeader, postContent, postFooter);

            postsContainer.appendChild(postElement);
        });
        } else {
            postsContainer.innerHTML = '<p>No posts available.</p>';
        }
    } catch (error) {
        console.error("Error getting all posts : ", error);
    }
};

async function updateLikes(post_id, likeButton) {
    try {
        const userId = 2;
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
        const userId = 2;
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