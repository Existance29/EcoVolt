$(document).ready(function() {
    $("#nav1").load("commonHTML/navBar1.html");
    $("#nav2").load("commonHTML/navBar2.html");
    $("footer").load("commonHTML/footer.html");
    $(".mainHeader").load("commonHTML/mainHeader.html");
    $(".sidebar").load("commonHTML/sidebar.html");
});

//prevent reloading page when form submitted
document.addEventListener("DOMContentLoaded", function () {
    //get all forms
    const forms = document.getElementsByTagName("form")
    //add listener to trigger when submitted
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        //stop reloading behaviour
        event.preventDefault()
      }, false)
    })
    
  
  })

