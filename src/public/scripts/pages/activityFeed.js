document.addEventListener("DOMContentLoaded", function() {
    fetch('/posts')
        .then (response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data received: ', data);
        })
        .then (posts => {
            if (posts.length > 0) {
                const postsContainer = document.querySelector('.posts');
                postsContainer.innerHTML = '';

                posts.forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.classList.add('post');

                    const postHeader = document.createElement('div');
                    postHeader.classList.add('post-header');
                    postHeader.innerHTML = `<h3> ${post.user_id}</h3>
                                            <span class="timestamp">Posted on: ${post.date} ${post.time}</span>`;

                    const postContent = document.createElement('p');
                    postContent.classList.add('post-content');
                    postContent.textContent = post.context;

                    const postFooter = document.createElement('div');
                    postFooter.classList.add('post-footer');

                    const actionButtons = document.createElement('div');
                    actionButtons.classList.add('action-buttons');
                    actionButtons.innerHTML = `
                        <button class="action-btn like-button">
                            <i class="fa fa-thumbs-up"></i><span class="likes-count">${post.likes_count} Likes</span>
                        </button>
                        <button class="action-btn dislike-button">
                            <i class="fa fa-thumbs-down"></i><span class="dislikes-count">${post.dislikes_count} Dislikes</span>
                        </button>
                        <button class="action-btn comment-button">
                            <i class="fa fa-comment"></i><span class="comments-count">${post.comments_count} Comments</span>
                        </button>
                    `;
                    postFooter.appendChild(actionButtons);
                    postElement.appendChild(postHeader);
                    postElement.appendChild(postContent);
                    postElement.appendChild(postFooter);
                    postsContainer.appendChild(postElement);
                });
            }else {
                alert("No posts found.");
            }
        })
        .catch(error => console.error("Error fetching activity posts data:", error));
});
