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

    displayMessage(userMessage, "user-message");
    document.getElementById("userMessage").value = "";

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
            }),
        });

        if (!response.ok) {
            throw new Error(`Chatbot API call failed. Status: ${response.status}`);
        }

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