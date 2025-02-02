//tabs switching

function getTabFromButton(btn){
    tabId = btn.id.split("-")[0]
    return document.getElementById(tabId)
}

function tabSwitch(tabElement){
    //hide all
    Array.from(document.querySelectorAll(".tabs button")).forEach(y => {
        y.classList.remove("active")
        getTabFromButton(y).style.display = "none"
    })

    tabElement.classList.add("active")
    getTabFromButton(tabElement).style.display = "block"
}

Array.from(document.querySelectorAll(".tabs button")).forEach(x => x.addEventListener("click", ()=> tabSwitch(x)))
tabSwitch(document.getElementById("posts-btn"))

async function loadData(){
    userId = getUrlParameter("id") || (await getUserJWTPayload()).userId
    //profile picture
    let profilePictureResponse = await get(`/users/profile-picture/public/${userId}`)
    let profilePictureSRC = "assets/profile/defaultprofilepic.jpg" //default profile picture
    if (profilePictureResponse.ok){
        //convert the ReadableStream into a Blob
        const reader = (await profilePictureResponse.body).getReader();
        const chunks = [];
        let done = false;

        while (!done) {
            const { value, done: isDone} = await reader.read()
            if (value) chunks.push(value)
            done = isDone
        }

        if (chunks.length){  
            const blob = new Blob(chunks)
            profilePictureSRC = URL.createObjectURL(blob)
        }
    }
    document.getElementById('profile-picture').src = profilePictureSRC

    //user information
    let userData = await(await get(`/users/account/public/${userId}`)).json()
    document.getElementById("name").innerText = userData.name
    document.getElementById("company").innerText = userData.company_alias
    document.getElementById("about").innerText = userData.about

    //activtity
    let activityData = await(await get(`/users/activity/public/${userId}`)).json()
    let postHTML = ""
    let totalLikes = 0
    for (const post of activityData.posts){
        const mediaResponse = await get(`/getMedia/${post.post_id}`)
        let showImage = false
        if (mediaResponse.ok) showImage = true
        const blob = await mediaResponse.blob()
        const media_url = URL.createObjectURL(blob)
        
        totalLikes += post.likes
        postHTML += `
            <div class="post profile-section">
                <div class="body">${post.context}</div>
                <div class="date">${post.date.split("T")[0]}</div>
                <img class="img" src=${media_url} style="display: ${showImage? 'block' : 'none'}">
                <div class="stats-container">
                    <div class="stat" style="color: rgb(153, 224, 147);">
                        <i class="fa-regular fa-thumbs-up" aria-hidden="true"></i>
                        <span>${post.likes}</span>
                    </div>
                    <div class="stat" style="color: rgb(247, 143, 140);">
                        <i class="fa-regular fa-thumbs-down" aria-hidden="true"></i>
                        <span>${post.dislikes}</span>
                    </div>
                    <div class="stat" style="color: rgb(90, 215, 253);">
                        <i class="fa-regular fa-comment" aria-hidden="true"></i>
                        <span>${post.comments}</span>
                    </div>
                </div>
            </div>
        `

    }
    if (postHTML) document.getElementById("posts").innerHTML = postHTML

    let commentHTML = ""
    for (const comment of activityData.comments){
        commentHTML += `
            <div class="post profile-section" style="padding-bottom: 3px; padding-top: 3px;">
                <div class="comment-post-body">Commented on: ${comment.context}</div>
                <div class="comment">${comment.comment_text}</div>
                <div class="date">${comment.date.split("T")[0]}</div>
            </div>
        `
    }
    if (commentHTML) document.getElementById("comments").innerHTML = commentHTML

    //user's likes
    document.getElementById("likes").innerText = `${totalLikes} ${totalLikes === 1 ? "Like" : "Likes"}`
}
loadData()