/* 
=====================
Account tab
=====================
*/
const accountTextFields = ["name", "email", "about"]
var accountTextFieldValues = {} //store the value of the textboxes before editing

//hide the error message when the input field is changed
function inputChanged(e){
    //get the associated error message based on the id of the input field
    const error = document.getElementById(`${e.target.id}-error`)
    error.style.opacity = "0"
}

Array.from(document.getElementsByTagName("input")).forEach(x => {
    if (x.type == "text" || x.type == "password") x.addEventListener("input", inputChanged)
})

function closeTextBox(editBtn, textbox){
    textbox.classList.remove("active")
    editBtn.innerText = "Edit"
    textbox.disabled = true
    //revert back to previous value
    textbox.value = accountTextFieldValues[textbox.id]
    //hide errors
    inputChanged({target: textbox})

}

function getTextBox(editBtn){
    return editBtn.parentElement.parentElement.children[1]
}

async function updateAccountInfo(){
    let updateData = {}
    accountTextFields.forEach(x => updateData[x] = document.getElementById(x).value)
    const resp = await put("users/account/private", updateData)
    const body = await resp.json()
    //check if error
    if (resp.status == 200){ 
        accountTextFieldValues = body
        return true
    }

    //iterate through all errors, display the error message
    for (var i = 0; i < body.errors.length; i++){
        const x  = body.errors[i]
        const errorEle = document.getElementById(`${x[0]}-error`) //get the error messasge element associated with the error
        errorEle.innerText = x[1].replaceAll("_"," ").replaceAll('"','') //do a bit of formatting to make the message more readable
        errorEle.style.opacity = "1"
    }
    return false

}

function closeAllTextBoxes(){
    Array.from(document.getElementsByClassName("edit")).forEach(x => closeTextBox(x, getTextBox(x)))
}


//click input text input edit buttons
async function editClicked(x){
    const textbox = getTextBox(x)
    if (textbox.classList.contains("active")){
        if (await updateAccountInfo()) closeTextBox(x, textbox)
    } else{
        //close all existing textboxes and show the active one
        closeAllTextBoxes()
        textbox.classList.add("active")
        x.innerText = "Save"
        textbox.disabled = false
        textbox.focus()
        //a little hack to get the cursor to the back of the text
        var val = textbox.value
        textbox.value = '' 
        textbox.value = val
    }
}

//deal with clicks
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("edit")){
        editClicked(event.target)
    }
    else if (event.target.classList.contains("settings-container")){
        //close textboxes if user clicks elsewhere
        closeAllTextBoxes()
    }
});

/* 
=====================
Tab Navigation
=====================
*/

const navItems = document.getElementsByTagName("nav")[0].children

//deal with the tab navigation
function navClicked(navItem){
    //hide all tabs
    Array.from(document.getElementsByClassName("settings-container")).forEach(x => x.style.display = "none" )

    Array.from(navItems).forEach(x => x.classList.remove("active")) 

    document.getElementById(navItem.dataset.tab).style.display = "block"
    navItem.classList.add("active")

}
//add event handler
Array.from(navItems).forEach(x => {
    x.addEventListener("click", event => navClicked(x))
})

//load the first tab
navClicked(navItems[0])

//load the setting data
async function loadData(){
    const accountData = await (await get("users/account/private")).json()

    //load inputs
    accountTextFields.forEach(x => {
        accountTextFieldValues[x] = accountData[x]
        document.getElementById(x).value = accountData[x]
    })
}

loadData()

/* 
=====================
Password Tab
=====================
*/

const changePasswordFields = ["old_password", "new_password", "confirm_new_password"]

//change password
document.getElementById("reset-password-btn").addEventListener("click", async()=> {
    let passwordData = {}
    changePasswordFields.forEach(x => passwordData[x] = document.getElementById(x.replaceAll("_","-")).value)
    const resp = await put("users/password", passwordData)
    const body = await resp.json()
    if (resp.status == 200){ 
        //success, clear input fields and show sucess message
        changePasswordFields.forEach(x => document.getElementById(x.replaceAll("_","-")).value = "")
        const successMsgElement = document.getElementById("change-password-success").style.opacity = "1"  
        return
    }

    //iterate through all errors, display the error message
    for (var i = 0; i < body.errors.length; i++){
        const x  = body.errors[i]
        const errorEle = document.getElementById(`${x[0].replaceAll("_","-")}-error`) //get the error messasge element associated with the error
        errorEle.innerText = x[1].replaceAll("_"," ").replaceAll('"','') //do a bit of formatting to make the message more readable
        errorEle.style.opacity = "1"
    }
    return false
})


/* 
=====================
Profile Image 
=====================
*/

document.getElementById("edit-profile-picture").addEventListener("change", async function () {
    const formData = new FormData();
    formData.append("file", this.files[0]);

    try {
        const response = await fetch("/users/profile-picture", {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": `Bearer ${sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken")}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            document.getElementById("profile-img").src = `./uploads/profile-pictures/${result.fileName}`;
        } else {
            console.error("Failed to upload image");
        }
    } catch (error) {
        console.error("Error uploading image:", error);
    }
});


async function loadData() {
    const accountData = await (await get("users/account/private")).json();

    // Load inputs
    accountTextFields.forEach(x => {
        accountTextFieldValues[x] = accountData[x];
        document.getElementById(x).value = accountData[x];
    });

    // load profile picture, check if `profile_picture_file_name` exists
    const profileImg = document.getElementById("profile-img");
    if (accountData.profile_picture_file_name) {
        // try loading the custom profile picture
        profileImg.src = `/uploads/profile-pictures/${accountData.profile_picture_file_name}`;
    } else {
        // fall back to the default profile picture if no custom picture is available
        profileImg.src = "/assets/profile/defaultprofilepic.jpg";
    }
}


// check whether got badge or not

document.addEventListener("DOMContentLoaded", function() {
    const badgeIcon = document.getElementById("badge-icon");
    if (localStorage.getItem("badgeUnlocked") === "true") {
        badgeIcon.style.display = "block"; // Show the badge icon if unlocked
    } else {
        badgeIcon.style.display = "none"; // Hide the badge icon if not unlocked
    }
});
