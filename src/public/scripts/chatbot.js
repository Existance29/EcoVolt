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

function levenshteinDistance(s1, s2) {
    const len1 = s1.length;
    const len2 = s2.length;
    let matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) {
        for (let j = 0; j <= len2; j++) {
            if (i === 0) matrix[i][j] = j;
            else if (j === 0) matrix[i][j] = i;
            else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1, // Deletion
                    matrix[i][j - 1] + 1, // Insertion
                    matrix[i - 1][j - 1] + (s1[i - 1] !== s2[j - 1] ? 1 : 0) // Substitution
                );
            }
        }
    }
    return matrix[len1][len2];
}

function isSimilar(userMessage, intentKeys, threshold = 2) {
    let bestMatch = intentKeys.reduce((best, key) => {
        let distance = levenshteinDistance(userMessage.toLowerCase(), key.toLowerCase());
        return distance < best.distance ? { key, distance } : best;
    }, { key: null, distance: Infinity });

    return bestMatch.distance <= threshold ? bestMatch.key : null; // Allow minor typos
}

async function sendMessage() {
    const accessToken = sessionStorage.getItem("accessToken"); // Retrieve the token from sessionStorage

    const userMessage = document.getElementById("userMessage").value.trim();
    if (!userMessage) return;

    displayMessage(userMessage, "user-message");
    document.getElementById("userMessage").value = "";

    displayMessage("...", "bot-message");

    try {
        const companyId = sessionStorage.getItem("company_id");
        if (!companyId) {
            throw new Error("Company ID is not available.");
        }

        const availableYears = await fetchAvailableYears(companyId);
        const latestYear = availableYears[0];
        const reportData = await fetchReportData(companyId, latestYear);

        // Define the list of intents we want to match against
        const intentKeys = [
            "company initiatives",
            "company efforts",
            "company initiative",
            "company effort"
        ];

        // Check if userMessage is similar to any predefined intents
        const matchedIntent = isSimilar(userMessage, intentKeys, 2);
        const isHTMLResponse = matchedIntent !== null; // If matched, assume HTML content

        if (isHTMLResponse) {
            localStorage.setItem("company_id", companyId);
            localStorage.setItem("accessToken", accessToken);
        }

        const response = await fetch("/chatbot", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "company-id": companyId,
            },
            body: JSON.stringify({ userMessage, reportData, accessToken }),
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
        displayMessage(data.reply, "bot-message", isHTMLResponse);
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