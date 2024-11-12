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
    const error = document.getElementById(`${e.target.id.replaceAll("-","_")}-error`)
    error.style.opacity = "0"
}

Array.from(document.getElementsByTagName("input")).forEach(x => {
    if (x.type == "text") x.addEventListener("input", inputChanged)
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
    else{
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
