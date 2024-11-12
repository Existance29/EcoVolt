const accountTextFields = ["name", "email", "about"]

//hide the error message when the input field is changed
function inputChanged(e){
    //get the associated error message based on the id of the input field
    const error = document.getElementById(`${e.target.id.replaceAll("-","_")}-error`)
    console.log(error)
    error.style.opacity = "0"
}

Array.from(document.getElementsByTagName("input")).forEach(x => {
    if (x.type == "text") x.addEventListener("input", inputChanged)
})

function closeTextBox(editBtn, textbox){
    textbox.classList.remove("active")
    editBtn.innerText = "Edit"
    textbox.disabled = true
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
    if (resp.status == 200) return true

    //iterate through all errors, display the error message
    for (var i = 0; i < body.errors.length; i++){
        const x  = body.errors[i]
        const errorEle = document.getElementById(`${x[0]}-error`) //get the error messasge element associated with the error
        errorEle.innerText = x[1].replaceAll("_"," ").replaceAll('"','') //do a bit of formatting to make the message more readable
        errorEle.style.opacity = "1"
    }
    return false

}


//add event handler to text input edit buttons
Array.from(document.getElementsByClassName("edit")).forEach(x => {
    x.addEventListener("click", async() => {
        const textbox = getTextBox(x)
        if (textbox.classList.contains("active")){
            if (await updateAccountInfo()) closeTextBox(x, textbox)
        } else{
            //close all textboxes
            Array.from(document.getElementsByClassName("edit")).forEach(y => closeTextBox(y, getTextBox(y)))
            textbox.classList.add("active")
            x.innerText = "Save"
            textbox.disabled = false
            textbox.focus()
            //a little hack to get the cursor to the back of the text
            var val = textbox.value
            textbox.value = '' 
            textbox.value = val 
            //close all other active textboxes
        }
    } )
})

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
    accountTextFields.forEach(x => document.getElementById(x).value = accountData[x])
}

loadData()