let currentEventID = null;
let carbonSaved = null;
let currentIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
    const accessToken = sessionStorage.accessToken || localStorage.accessToken;

    const payloadBase64Url = accessToken.split('.')[1];
    const payload = decodeBase64Url(payloadBase64Url);
    const user_id = payload.userId;
    const company_id = payload.companyId;
    let user_name = "";

    try {
        // Load events and get current event details
        const { currentEventID: eventId, carbonSaved: carbon } = await loadEvents(user_id);
        fetchTopContributors(company_id);
        fetchTopCompanies();


        const startButton = document.getElementById('start-btn');
        const closeModalButton = document.getElementById("closeModalBtn");
        const modal = document.getElementById("postModal");

        // Show post modal when new post button is clicked
        startButton.addEventListener("click", () => {
            modal.style.display = "flex";
            document.getElementById('submitEventPostBtn').addEventListener("click", async () => {   
                const eventTitle = document.querySelector(".event-title");
                await addNewPost(user_id, company_id);
                await logUserProgress(user_id, currentEventID, carbonSaved, eventTitle.textContent);
                updateCompanyContributions(company_id, carbonSaved);
                await loadEvents(user_id, currentIndex); // Refresh events after posting
                currentEventID = null;
                carbonSaved = null;

                // modal.style.display = "none";
            
            });
        });

        // Close the post modal when the button is clicked
        closeModalButton.addEventListener("click", () => {
            modal.style.display = "none";
        });

    } catch (error) {
        console.error("Error in event page: ", error);
    }
});

function openTab(event, tabName) {
    let contents = document.querySelectorAll('.leaderboard-content');
    let buttons = document.querySelectorAll('.tab-btn');
    
    contents.forEach(content => content.classList.remove('active'));
    buttons.forEach(button => button.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Function to load events and return event data
async function loadEvents(user_id, indexToShow = currentIndex) {
    const response = await fetch('/events/current', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    });

    const data = await response.json();
    const events = data.events;

    const eventTitle = document.querySelector(".event-title");
    const eventCategory = document.querySelector(".event-category");
    const eventDescription = document.querySelector(".event-description-text");
    // const participateBtn = document.querySelector(".participate-btn");


    if (!events || events.length === 0) {
        eventTitle.textContent = "No Active Events";
        eventDescription.textContent = "Stay tuned for upcoming events!";
        // participateBtn.style.display = "none";

        return { currentEventID: null, carbonSaved: null };
    }

    currentIndex = indexToShow;

    // Render event data based on the current index
    function renderEvent(index) {
        const event = events[index];
        currentEventID = event.event_id;
        carbonSaved = event.average_carbon_savings_per_post;
        const eventName = event.event_title;
        eventTitle.textContent = event.event_title;
        eventCategory.textContent = `Category: ${event.category || "General"}`;
        eventDescription.textContent = event.event_description;

        updateUserProgress(user_id, currentEventID, eventName)
    }

    document.getElementById("prevEvent").addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + events.length) % events.length;
        renderEvent(currentIndex);
    });

    document.getElementById("nextEvent").addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % events.length;
        renderEvent(currentIndex);
    });

    // Initial rendering of first event
    renderEvent(currentIndex);
    return { currentEventID: events[currentIndex].event_id, carbonSaved: events[currentIndex].average_carbon_savings_per_post };
}

// Decoding base64 URL-encoded string and parsing to JSON
function decodeBase64Url(base64Url) {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded);
}

// Function to log user progress
async function logUserProgress(user_id, currentEventID, carbonSaved, eventName) {
    try {
        const response = await fetch('/log-progress', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id, event_id: currentEventID, reduction_amount: carbonSaved }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Failed to log progress");

        updateUserProgress(user_id, currentEventID, eventName);

    } catch (error) {
        console.error("Error logging user progress: ", error);
    }
}

// Function to update user progress
async function updateUserProgress(user_id, event_id, eventName) {
    try {
        const response = await fetch(`/progress/${user_id}/${event_id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const errorData = await response.text(); // Read raw response to debug
            throw new Error(`Failed to fetch progress: ${response.status} - ${errorData}`);
        }

        const data = await response.json();

        const streak = data.streak_count || 0;
        const carbonSavedTotal = data.reduction_amount || 0;

        // Update UI with the progress data
        document.getElementById("eventName").textContent = eventName;
        document.getElementById("streakDays").textContent = streak;
        document.getElementById("carbonSavedAmount").textContent = carbonSavedTotal;

    } catch (error) {
        console.error("Error fetching user progress:", error);
    }
}

async function fetchTopContributors(company_id) {
    try {
        const response = await fetch(`/top-contributors/${company_id}`);
        const data = await response.json();

        const leaderboardContainer = document.getElementById("leaderboardList");
        leaderboardContainer.innerHTML = "";

        data.forEach((contributor, index) => {
            const rankIcon = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <div class="contributor-item">
                    <span class="rank-icon">${rankIcon}</span>
                    <span class="contributor-name"><strong>${contributor.name}</strong></span>
                    <div class="contributor-info">
                        <span>📢 <strong>${contributor.total_posts}</strong> posts</span> 
                        <span>🌱 <strong>${contributor.total_carbon_saved.toFixed(2)}</strong> kg saved</span>
                    </div>
                </div>
            `;
            leaderboardContainer.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error fetching top contributors:", error);
    }
}

// Function to update company contributions when an event is participated in
async function updateCompanyContributions(company_id, reduction_amount) {
    try {
        const response = await fetch('/update-contributions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                company_id,
                reduction_amount,
            }),
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log('Company contributions updated successfully');
        } else {
            console.error('Error updating contributions:', data.message);
        }
    } catch (error) {
        console.error('Error during the request:', error);
    }
}

// Function to fetch the top 3 companies based on the total carbon reduction
async function fetchTopCompanies() {
    try {
        const response = await fetch('/top-companies');
        const data = await response.json();

        const leaderboardContainer = document.getElementById("topCompaniesList");
        leaderboardContainer.innerHTML = "";

        // Loop through the companies data and create a list item for each company
        data.forEach((company, index) => {
            const rankIcon = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <div class="company-item">
                    <span class="rank-icon">${rankIcon}</span>
                    <span class="company-name"><strong>${company.name}</strong></span>
                    <div class="company-info">
                        <span>🌱 <strong>${company.total_carbon_reduction.toFixed(2)}</strong> kg carbon saved</span> 
                        <span>📢 <strong>${company.total_posts}</strong> posts</span>
                    </div>
                </div>
            `;
            leaderboardContainer.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error fetching top companies:", error);
    }
}

