let currentEventID = null;
let carbonSaved = null;
let currentIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
    // Assuming user_id and company_id are already set
    const user_id = 2;
    const company_id = 2;
    try {
        // Load events and get current event details
        const { currentEventID: eventId, carbonSaved: carbon } = await loadEvents(user_id);

        const startButton = document.getElementById('start-btn');
        const closeModalButton = document.getElementById("closeModalBtn");
        const modal = document.getElementById("postModal");

        // Show post modal when new post button is clicked
        startButton.addEventListener("click", () => {
            modal.style.display = "flex";
            console.log("currentEventID: ", currentEventID);
            console.log("carbon saved: ", carbonSaved);
            document.getElementById('submitEventPostBtn').addEventListener("click", async () => {   
                console.log("currentEventID: ", currentEventID);
                console.log("carbon saved: ", carbonSaved);
                const eventTitle = document.querySelector(".event-title");
                await addNewPost(user_id, company_id);
                await logUserProgress(user_id, currentEventID, carbonSaved, eventTitle.textContent);
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
    const participateBtn = document.querySelector(".participate-btn");

    if (!events || events.length === 0) {
        eventTitle.textContent = "No Active Events";
        eventDescription.textContent = "Stay tuned for upcoming events!";
        participateBtn.style.display = "none";
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
        console.log("data in log function: ", data);

        if (!response.ok) throw new Error(data.error || "Failed to log progress");

        updateUserProgress(user_id, currentEventID, eventName);
        console.log("User progress logged:", data);
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
        console.log("update user progress event id: ", event_id);
        console.log("update user progress user id: ", user_id);

        console.log("User Progress Data:", data);

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
