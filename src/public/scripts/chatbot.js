function openChatbotModal() {
    const chatbotModal = document.getElementById("chatbotModal");
    if (chatbotModal) {
        chatbotModal.style.display = "flex"; // Display the modal in flex layout
    } else {
        console.error("Chatbot modal not found.");
    }
}

function closeChatbotModal() {
    const chatbotModal = document.getElementById("chatbotModal");
    if (chatbotModal) {
        chatbotModal.style.display = "none"; // Hide the modal
    } else {
        console.error("Chatbot modal not found.");
    }
}
function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

function displayMessage(message, className) {
    const messageContainer = document.createElement("div");
    messageContainer.className = `message ${className}`;
    messageContainer.textContent = message;

    const messages = document.getElementById("chatbotMessages");
    messages.appendChild(messageContainer);
    messages.scrollTop = messages.scrollHeight; // Ensure the latest message is visible
}

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

document.addEventListener("DOMContentLoaded", () => {
    const userMessageInput = document.getElementById("userMessage");
    const chatbotToggle = document.getElementById("chatbotToggle");

    if (userMessageInput) userMessageInput.addEventListener("keypress", handleKeyPress);
    if (chatbotToggle) chatbotToggle.addEventListener("click", openChatbotModal);
});