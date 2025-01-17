document.addEventListener('DOMContentLoaded', async () => {
    // Getting the user information from the storage 
    const accessToken = sessionStorage.accessToken || localStorage.accessToken;

    const payloadBase64Url = accessToken.split('.')[1];
    const payload = decodeBase64Url(payloadBase64Url);
    const user_id = payload.userId;
    const company_id = payload.companyId;
    let user_name = "";
    
    try {
        // Load all the fetched posts in the activity feed
        loadPosts(user_id, company_id);

        // Leads to the reward page for more reward information 
        document.getElementById("reward-progress-container").addEventListener("click", function() {
            window.location.href = "../../rewards.html";
        })

        // Post modal for adding a new post
        const addNewPostButton = document.getElementById("new-post-button");
        const closeModalButton = document.getElementById("closeModalBtn");
        const modal = document.getElementById("postModal");

        // Show post modal when new post button is clicked
        addNewPostButton.addEventListener("click", () => {
            modal.style.display = "flex";
            document.getElementById('submitPostBtn').addEventListener("click", async () => {
                await addNewPost(user_id, company_id);
            });
        });

        // Close the post modal when the button is clicked
        closeModalButton.addEventListener("click", () => {
            modal.style.display = "none";
        });


    } catch (error) {
        console.error("Error getting all posts : ", error);
    }

});

// Decoding base64 URL-encoded string and parsing to JSON
function decodeBase64Url(base64Url) {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded);
}

// Function to load all the post that is fetched from the database
async function loadPosts(user_id, company_id) {
    try{
        const response = await fetch('/posts', { 
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

        // Fetches and displays the posts
        if (posts.length > 0) {
            posts.forEach(async (post) => {
                // Create an element for each post
                const postElement = document.createElement("div");
                postElement.classList.add("post");
                postElement.setAttribute("data-post-id", post.post_id);

                // Adding post header 
                const postHeader = document.createElement("div");
                postHeader.classList.add("post-header");
                postHeader.innerHTML = `
                <h3>${post.user_name || "Anonymous"}</h3>
                <span class="timestamp">Posted on: ${post.date}</span>
                `;

                // Adding in post contents
                const postContent = document.createElement("p");
                postContent.classList.add("post-content");
                postContent.textContent = post.context || "No content available.";

                const postImage = document.createElement('img');
                postImage.classList.add('post-image');
                postImage.alt = 'Post Media';

                try {
                    const mediaResponse = await fetch(`/getMedia/${post.post_id}`, {
                        method:'GET', 
                    });
                    if (mediaResponse.ok) {
                        const blob = await mediaResponse.blob();
                        const media_url = URL.createObjectURL(blob);
                        console.log("Media url : ", media_url);
                        if (media_url) {
                            postImage.src = media_url; // Set the image source to the fetched URL
                            postImage.style.display = 'block';
                        } else {
                            console.warn("Media URL not found for post:", post.post_id);
                            postImage.style.display = 'none';
                        }
                    } else {
                        console.error(`Failed to fetch media for post ${post.post_id}:`, mediaResponse.status);
                        postImage.style.display = 'none';
                    }
                } catch (error) {
                    console.error("Error fetching media: ", error);
                    postImage.style.display = 'none';
                }
                

                const postFooter = document.createElement("div");
                postFooter.classList.add("postfooter");

                // Adding in interaction buttons to a post
                const actionButtons = document.createElement("div");
                actionButtons.classList.add("action-buttons");

                const likeButton = document.createElement("button");
                likeButton.classList.add("action-btn", "like-button");
                likeButton.innerHTML = `
                <i class = "fa fa-thumbs-up"></i>
                <span class="likes-count">${post.likes_count || 0} Likes</span>
                `;
                likeButton.addEventListener("click", () => updateLikes(user_id, company_id, post.post_id, likeButton));

                const dislikeButton = document.createElement("button");
                dislikeButton.classList.add("action-btn", "dislike-button");
                dislikeButton.innerHTML = `
                <i class = "fa fa-thumbs-down"></i>
                <span class="dislikes-count">${post.dislikes_count || 0} Dislikes</span>
                `;
                dislikeButton.addEventListener("click", () => updateDislikes(user_id, company_id, post.post_id, dislikeButton));

                const commentButton = document.createElement("button");
                commentButton.classList.add("action-btn", "comment-button");
                commentButton.innerHTML = `
                <i class = "fa fa-comment"></i>
                <span class="comments-count">${post.comments_count || 0} Comments</span>
                `;
                commentButton.addEventListener("click", () => showComments(user_id, company_id, post.post_id, commentButton));

                // Append buttons and post elements
                actionButtons.appendChild(likeButton)
                actionButtons.appendChild(dislikeButton) 
                actionButtons.appendChild(commentButton);
                postFooter.appendChild(actionButtons);

                const commentsContainer = document.createElement("div");
                commentsContainer.classList.add("comments-container");
                commentsContainer.style.display = "none";

                postElement.append(postHeader, postContent, postImage, postFooter, commentsContainer);

                postsContainer.appendChild(postElement);
            });
        } else {
            postsContainer.innerHTML = '<p>No posts available.</p>';
        }
    } catch (error) {
        console.error("Error getting all posts: ", error);
    }
}

// Function that helps to update like function of a post
async function updateLikes(user_id, company_id, post_id, likeButton) {
    try {
        const response = await fetch('/toggleLike', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ post_id, company_id, user_id: user_id })
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

// Function that helps to update dislike function of a post
async function updateDislikes(user_id, company_id, post_id, dislikeButton) {
    try {
        const response = await fetch('/toggleDislike', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ post_id, company_id, user_id: user_id })
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

// Function that show all of the comments of a post
async function showComments(user_id, company_id, postId, commentButton) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    const commentsContainer = postElement.querySelector('.comments-container');
    commentsContainer.style.display = commentsContainer.style.display === 'none' ? 'block' : 'none';

    if (commentsContainer.style.display === 'block') {
        // loading all fetched comments
        loadComments(user_id, company_id, postId, commentsContainer, commentButton);
    }
}

// Function to take care of the incoming comment data
async function loadComments(user_id, company_id, post_id, commentsContainer, commentButton) {
    try {
        const response = await fetch(`/comment/${post_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if(!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const comments = await response.json();
        commentsContainer.innerHTML = "";

        if (comments.length === 0) {
            commentsContainer.innerHTML = "<p>No comments yet.</p>";
        } else {
            comments.forEach(comment => {
                // Creating and appending comment elements
                const commentElement = document.createElement("div");
                commentElement.classList.add("comment");

                const userName = comment.name || "Anonymous";
                const commentText = comment.comment_text || "No comment.";
                commentElement.innerHTML = `
                <strong>${userName}</strong> 
                <p>${commentText}</p>
                `;
                commentsContainer.appendChild(commentElement);
            });
        }

        // Adding a new comment function
        const newCommentDiv = document.createElement("div");
        newCommentDiv.classList.add("new-comment");
        newCommentDiv.innerHTML = `
        <input type="text" id="new-comment-${post_id}" placeholder="Add a comment...." />
        <button class="add-comment-btn">Post</button>`;

        const postButton = newCommentDiv.querySelector('.add-comment-btn');
        postButton.addEventListener("click", () => {
            const commentInput = document.getElementById(`new-comment-${post_id}`);
            // Helps to call the function that add the new comment to the database
            addComment(post_id, company_id, user_id, commentInput.value, commentButton);
        });

        commentsContainer.appendChild(newCommentDiv);

    } catch (error) {
        console.error("Error loading comments: ", error);
    }
}

// Add the new comment to the database and ensure the comment counts is updated
async function addComment(post_id, company_id, user_id, commentText, commentButton) {
    if (!commentText) return;

    try {
        const response = await fetch('/newComments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ post_id, user_id, company_id, comment_text: commentText })
        });

        if(!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const newComment = await response.json();

        // Creates and shows the new comment added with the username
        const commentsContainer = document.querySelector(`[data-post-id="${post_id}"] .comments-container`);
        const commentElement = document.createElement("div");
        commentElement.classList.add("comment");
        commentElement.innerHTML = `
            <strong>${newComment.newComment.username || "Anonymous"}</strong>
            <p>${newComment.newComment.comment_text || "No comment."}</p>
        `;
        // Updates the comment count
        const commentsCount = newComment.commentsCount;
        const commentCountElement = commentButton.querySelector('.comments-count');
        commentCountElement.textContent = `${commentsCount} Comments`;

        commentsContainer.appendChild(commentElement);

        document.getElementById(`new-comment-${post_id}`).value = "";
        
    } catch (error) {
        console.error("Error adding comments: ", error);
    }
}

// Add a new post to the database and fetch it to the activity page 
async function addNewPost(user_id, company_id) {
    const postContext = document.getElementById('postContext').value || null;
    const postMediaUrl = document.getElementById('postMediaUrl').value || null;
    const form = document.getElementById('postForm');

    if (!postContext || !postMediaUrl) {
        alert("Both fields are required.");
        return;
    }
    const formData = new FormData(form);
    formData.append("user_id", user_id);
    formData.append("company_id", company_id);
    formData.append("context", postContext);
    formData.append("media", postMediaUrl);

    try {
        const response = await fetch('/addPost', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        document.getElementById('postContext').value = '';
        document.getElementById('postMediaUrl').value = '';
        
        alert("Post added successfully!");
        document.getElementById("postModal").style.display = "none";
        loadPosts();

    } catch (error) {
        console.error("Error adding post:", error);
    }
}

// Function to track the user interaction in the activity page
async function trackActivity(user_id, company_id, post_id, activity_type, points) {
    try {
        const response = await fetch('/trackActivity', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify({ post_id, user_id: user_id, company_id: company_id, activity_type, points})
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const activity = await response.json();

        if (activity) {
            // Calls the function to update the total point of a user
            updateTotalPoints(user_id);
        } else {
            console.log("Error tracking activity");
        }
    } catch (error) {
        console.error("Error tracking activity : ", error)
    } 
}

// Function to update the total point to help with the point calculation and reward system 
async function updateTotalPoints(user_id) {
    try {
        const response = await fetch('/getTotalPoints', {
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify({ user_id: user_id })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const totalPoint = await response.json();

        // if (totalPoint) {
        //     console.log("Total points fetch successfully");
        // } else {
        //     console.log("Error getting total points")
        // }

    } catch (error) {
        console.error("Error fetching total points: ", error);
    }
}

async function checkAndRedirect(event) {
    event.preventDefault(); // Prevent the default link behavior

    try {
        // Make a GET request to check the user's Strava login status
        const response = await get('/fitness/stats');

        const isLoggedIn = response.ok; // If response is OK, the user is logged into Strava

        // Redirect based on login status
        if (isLoggedIn) {
            window.location.href = 'fitnessLogIn.html'; // Redirect to the logged-in page
        } else {
            window.location.href = 'fitnessLogOut.html'; // Redirect to the logged-out page
        }
    } catch (error) {
        console.error('Error checking Strava login status:', error);
        alert('An error occurred while checking your login status. Please try again.');
    }
}
