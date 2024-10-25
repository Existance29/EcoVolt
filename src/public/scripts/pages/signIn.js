pageRequireNotSignIn()
//show/hide the error message
//state: "show" / "hide"
function errorMessage(state){
    //iterate through all error elements and show them
    Array.from(document.getElementsByClassName("field-error")).forEach(x => x.style.opacity = state == "show" ? "1" : "0")
}

//sign in
document.getElementById("submit-btn").addEventListener("click", async (event) => {
    signInData = {
        "email": document.getElementById("email").value,
        "password": document.getElementById("password").value
    }
    const response = await post("users/signin", signInData)
    if (response.status == 404){
        //display the error message
        errorMessage("show")
        return
    }
    const body = await response.json()
    //TODO: wrap this in a function and share it with signUp.js
    //save login info
    const rememberMe = document.getElementById("remember-me").checked
    const storageObj = rememberMe ? localStorage : sessionStorage
    storageObj.accessToken = body.accessToken
    storageObj.company_id = body.companyId
    
    location.href = "index.html"
})

//hide the error associated with the input when its typed
const inputs = document.getElementsByTagName("input")
for (let i = 0; i < inputs.length; i++){
    const element = inputs[i]
    if (element.type != "text" && element.type != "password") continue

    element.addEventListener("input", (event) => {
        errorMessage("hide")
    })
}