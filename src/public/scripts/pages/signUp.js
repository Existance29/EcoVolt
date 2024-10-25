pageRequireNotSignIn()
//sign up
document.getElementById("submit-btn").addEventListener("click", async (event) => {
    signUpData = {
        "name": document.getElementById("name").value,
        "email": document.getElementById("email").value,
        "password": document.getElementById("password").value
    }
    const response = await post("users/signup", signUpData)
    const body = await response.json()
    if (response.status == 400 && "message" in body){
        //iterate through all errors, display the error message
        body.errors.forEach(x => {
            const errorEle = document.getElementById(`${x[0]}-error`) //get the error messasge element associated with the error
            errorEle.innerText = x[1].replaceAll("_"," ").replaceAll('"','') //do a bit of formatting to make the message more readable
            errorEle.style.opacity = "1"
            
        });
        return
    }

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
        document.getElementById(`${event.target.id}-error`).style.opacity = "0"
    })
}