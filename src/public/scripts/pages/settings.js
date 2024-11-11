
//add event handler to text input edit buttons
Array.from(document.getElementsByClassName("edit")).forEach(x => {
    x.addEventListener("click", (event) => {
        const textbox = x.parentElement.parentElement.children[1]
        if (textbox.classList.contains("active")){
            textbox.classList.remove("active")
            x.innerText = "Edit"
            textbox.disabled = true
        } else{
            textbox.classList.add("active")
            x.innerText = "Save"
            textbox.disabled = false
            textbox.focus()
            //a little hack to get the cursor to the back of the text
            var val = textbox.value
            textbox.value = '' 
            textbox.value = val 
        }
        console.log(textbox)
    } )
})

const navItems = document.getElementsByTagName("nav")[0].children

//deal with the tab navigation
function navClicked(navItem){
    console.log(navItem.dataset.tab)
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