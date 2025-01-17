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

  async function checkAndRedirect(event) {
    event.preventDefault(); // Prevent the default link behavior

    try {
        // Make a GET request to check the user's Strava login status
        const response = await get('/fitness/stats');

        const isLoggedIn = response.ok; // If response is OK, the user is logged into Strava

        // Redirect based on login status
        if (isLoggedIn) {
            window.location.href = 'fitnessLogIn.html'; // Redirect to the logged-in page
        } else {
            window.location.href = 'fitnessLogOut.html'; // Redirect to the logged-out page
        }
    } catch (error) {
        console.error('Error checking Strava login status:', error);
        alert('An error occurred while checking your login status. Please try again.');
    }
}
