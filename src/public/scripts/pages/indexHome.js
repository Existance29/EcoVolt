let slideIndex = 0;
showSlides();

function showSlides() {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    
    // Hide all slides initially
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";  
    }

    // Increment slide index
    slideIndex++;
    
    // If slideIndex exceeds number of slides, reset to 1
    if (slideIndex > slides.length) {slideIndex = 1}  
    
    // Show the current slide
    slides[slideIndex-1].style.display = "block";  
    
    // Set timeout to move to the next slide automatically every 3 seconds
    setTimeout(showSlides, 3000); 
}

// Function for manual control of next/previous buttons
function plusSlides(n) {
    slideIndex += n - 1; // Adjust slide index for manual navigation
    showSlides();
}

