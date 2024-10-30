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

            const dislikeButton = document.createElement("button");
            dislikeButton.classList.add("action-btn", "dislike-button");
            dislikeButton.innerHTML = `
            <i class = "fa fa-thumbs-down"></i>
            <span class="dislikes-count">${post.dislikes_count || 0} Dislikes</span>
            `;

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