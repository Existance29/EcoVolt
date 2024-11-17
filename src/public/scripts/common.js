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



  

// Activity Feed and Garden Navigation
document.getElementById('activityFeedButton').addEventListener('click', () => {
  window.location.href = 'activityFeed.html'; // Redirect to Activity Feed page
});

document.getElementById('virtualGardenButton').addEventListener('click', () => {
  window.location.href = 'garden.html'; // Redirect to Virtual Garden page
});

// Dynamically set the active class based on the current page
const currentPage1 = window.location.pathname;

if (currentPage1.includes('activityFeed.html')) {
  document.getElementById('activityFeedButton').classList.add('active');
  document.getElementById('virtualGardenButton').classList.remove('active');
} else if (currentPage1.includes('garden.html')) {
  document.getElementById('virtualGardenButton').classList.add('active');
  document.getElementById('activityFeedButton').classList.remove('active');
}
