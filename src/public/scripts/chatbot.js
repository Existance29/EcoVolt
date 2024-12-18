// Toggle chatbot visibility
function toggleChatbot() {
    const chatbotContent = document.getElementById("chatbotContent");
    if (chatbotContent) {
        chatbotContent.style.display = chatbotContent.style.display === "none" ? "block" : "none";
    } else {
        console.error("Chatbot content element not found.");
    }
}

// Handle Enter key press in input field
function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// Display message in chat window
function displayMessage(message, className) {
    const messageContainer = document.createElement("div");
    messageContainer.className = `message ${className}`;
    messageContainer.textContent = message;
    document.getElementById("chatbotMessages").appendChild(messageContainer);

    // Scroll to the bottom of the messages
    const messagesContainer = document.querySelector(".chatbot-messages");
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
        console.error("Chatbot messages container not found.");
    }
}

// Send user message to the backend and display the bot's response
async function sendMessage() {
    const userMessage = document.getElementById("userMessage").value.trim();
    if (!userMessage) return;

    displayMessage(userMessage, "user-message");
    document.getElementById("userMessage").value = "";

    try {
        const response = await fetch("/chatbot", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Company-ID": sessionStorage.getItem("company_id")
            },
            body: JSON.stringify({ userMessage }),
        });

        const data = await response.json();
        displayMessage(data.reply || "Server error. Please try again.", "bot-message");
    } catch (error) {
        console.error("Error:", error);
        displayMessage("Server error. Please try again.", "bot-message");
    }
}

// Set up event listeners once the DOM content is loaded
document.addEventListener("DOMContentLoaded", () => {
    const userMessageInput = document.getElementById("userMessage");
    const chatbotToggle = document.getElementById("chatbotToggle");

    if (userMessageInput) userMessageInput.addEventListener("keypress", handleKeyPress);
    if (chatbotToggle) chatbotToggle.addEventListener("click", toggleChatbot);
});