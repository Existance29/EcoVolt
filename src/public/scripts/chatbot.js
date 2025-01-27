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
function displayMessage(message, className, isHTML = false) {
    const messageContainer = document.createElement("div");
    messageContainer.className = `message ${className}`;

    if (isHTML) {
        messageContainer.innerHTML = message; // Render as HTML for links
    } else {
        messageContainer.textContent = message; // Render as plain text
    }

    const messages = document.getElementById("chatbotMessages");
    messages.appendChild(messageContainer);
    messages.scrollTop = messages.scrollHeight;
}

function displayTypingIndicator() {
    const messages = document.getElementById("chatbotMessages");
    const typingIndicator = document.createElement("div");
    typingIndicator.id = "typing-indicator";
    typingIndicator.className = "message bot-message";
    typingIndicator.textContent = "...";
    messages.appendChild(typingIndicator);
    messages.scrollTop = messages.scrollHeight; // Scroll to the latest message
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function fetchAvailableYears(companyId) {
    try {
        const response = await fetch(`/reports/${companyId}/years`);
        if (!response.ok) {
            throw new Error(`Failed to fetch available years. Status: ${response.status}`);
        }

        const years = await response.json();
        if (!Array.isArray(years) || years.length === 0) {
            throw new Error("No available years found for the company.");
        }

        return years.sort((a, b) => b - a); // Sort years in descending order
    } catch (error) {
        console.error("Error fetching available years:", error);
        throw error;
    }
}

async function fetchReportData(companyId, year) {
    try {
        const response = await fetch(`/reports/${companyId}/generate?year=${year}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch report data. Status: ${response.status}`);
        }

        const reportData = await response.json();
        if (!reportData) {
            throw new Error("Failed to fetch report data.");
        }

        return reportData;
    } catch (error) {
        console.error("Error fetching report data:", error);
        throw error;
    }
}

async function sendMessage() {
    const userMessage = document.getElementById("userMessage").value.trim();
    if (!userMessage) return;

    // Display the user's message
    displayMessage(userMessage, "user-message");
    document.getElementById("userMessage").value = "";

    // Show typing indicator
    displayMessage("...", "bot-message");

    try {
        const companyId = sessionStorage.getItem("company_id");
        if (!companyId) {
            throw new Error("Company ID is not available.");
        }

        // Fetch available years and the latest report
        const availableYears = await fetchAvailableYears(companyId);
        const latestYear = availableYears[0];
        const reportData = await fetchReportData(companyId, latestYear);

        // Send user message along with report data to the chatbot backend
        const response = await fetch("/chatbot", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "company-id": companyId, // Add company-id header
            },
            body: JSON.stringify({
                userMessage,
                reportData,
                latestYear
            }),
        });

        // Remove typing indicator once response is received
        const typingIndicator = document.querySelector(".bot-message:last-child");
        if (typingIndicator && typingIndicator.textContent === "...") {
            typingIndicator.remove();
        }

        if (!response.ok) {
            throw new Error(`Chatbot API call failed. Status: ${response.status}`);
        }

        const data = await response.json();
        const isHTMLResponse = userMessage.toLowerCase().includes("company initiatives") || userMessage.toLowerCase().includes("company efforts");
        displayMessage(data.reply, "bot-message", isHTMLResponse); // Render as HTML for specific intents
    } catch (error) {
        console.error(error);
        const typingIndicator = document.querySelector(".bot-message:last-child");
        if (typingIndicator && typingIndicator.textContent === "...") {
            typingIndicator.remove();
        }
        displayMessage("Something went wrong. Please try again later.", "bot-message");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const userMessageInput = document.getElementById("userMessage");
    const chatbotToggle = document.getElementById("chatbotToggle");

    if (userMessageInput) userMessageInput.addEventListener("keypress", handleKeyPress);
    if (chatbotToggle) chatbotToggle.addEventListener("click", openChatbotModal);
});