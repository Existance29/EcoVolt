const treeThreshold = .5; // 24.62 kg of carbon avoided = 1 tree
const TREE_DISTANCE_GOAL = 227.5; // 227.5 km to offset 1 tree's annual CO₂ absorption
const carbonEmissionPerKm = 0.1082; // 120 grams/km = 0.1082 kg/km
// Select containers
const stravaLoginContainer = document.getElementById('strava-login-container');
const combinedContainer = document.getElementById('combined-container');
const newContainers = document.getElementById('new-containers');
const leaderboard = document.querySelector('.leaderboard');
const leaderboardPerformance = document.querySelector('.leaderboard-performance'); // Select the leaderboard-performance


fetch('/fitness/stats')
    .then((response) => {
        if (response.status === 401) {
            setTimeout(() => {
                applySpecialLayoutInline(false);
            }, 0);
            throw new Error('User not authenticated');
        }
        return response.json();
    })
    .then((data) => {
        setTimeout(() => {
            applySpecialLayoutInline(true);
            updateStats(data); // Call the updateStats function
        }, 0);
    })
    .catch((err) => {
        console.error('Error fetching stats:', err);
        document.querySelector('.time-travelled').textContent = 'Failed to load time data';
        document.querySelector('.number-of-rides').textContent = 'Failed to load rides data';
        document.querySelector('.carbon-emission-reduced').textContent = 'Failed to load carbon data';
    });





    function updateStats(data) {    
        // Extract stats from the data
        const totalDistance = Number((data.totalDistance / 1000).toFixed(2)); // Convert meters to kilometers
        const totalTime = data.totalTime; // Time in seconds
        const totalRides = data.totalRides;
    
        // Calculate additional stats
        const completedDistance = totalDistance % TREE_DISTANCE_GOAL; // Distance towards current goal
        const remainingDistance = TREE_DISTANCE_GOAL - completedDistance; // Remaining distance for the next tree
        const completedColor = completedDistance >= TREE_DISTANCE_GOAL / 2 ? '#15789a' : '#FF5722'; // Dynamic color
        
        // Convert total time to hours and minutes
        const totalHours = Math.floor(totalTime / 3600);
        const totalMinutes = Math.floor((totalTime % 3600) / 60);
        const formattedTime = totalHours > 0 
            ? `${totalHours}h ${totalMinutes}m` 
            : `${totalMinutes} min`;
    
        const carbonReduced = totalDistance * carbonEmissionPerKm; // Calculate carbon reduced in kg
        const treesToPlant = Math.floor(carbonReduced / treeThreshold); // Calculate trees to plant
    
        // Save user stats
        const userStats = {
            distance_cycled_km: totalDistance,
            number_of_rides: totalRides,
            time_travelled_hours: parseFloat((totalHours + totalMinutes / 60).toFixed(2)), // Hours as decimal
            trees_planted: treesToPlant,
        };
        saveUserStats(userStats);
    
        // Update the UI elements
        document.querySelector('.number-of-rides .value').textContent = `${totalRides}`;
        document.querySelector('.time-travelled .value').textContent = formattedTime;

        // Update the chart
        const ctx = document.getElementById('donutChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', "Remaining distance to 1 tree's effort"],
                datasets: [{
                    data: [completedDistance, remainingDistance],
                    backgroundColor: [completedColor, '#CCCCCC'], // Dynamic color
                    hoverOffset: 4,
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                }],
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 14 },
                            color: '#333',
                            padding: 20,
                        },
                    },
                    tooltip: {
                        enabled: true, // Enable tooltips explicitly
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                if (label === 'Remaining distance to 1 tree\'s effort') {
                                    return [
                                        `You need ${context.raw.toFixed(2)} km more`,
                                        `to match the effort of 1 tree's carbon absorption`
                                    ]; // Return an array for multi-line text
                                }
                                return `You have completed ${context.raw.toFixed(2)} km`;
                            },
                        },
                        backgroundColor: '#fff', // Change background color
                        titleFont: {
                            size: 16, // Increase title font size
                            weight: 'bold', // Make it bold
                        },
                        bodyFont: {
                            size: 14, // Increase body font size
                            family: 'Arial, sans-serif', // Customize font family
                        },
                        boxPadding: 10, // Add padding inside the tooltip box
                        padding: 15, // Add extra padding around text
                        borderColor: '#ccc', // Add a border to the tooltip
                        borderWidth: 1, // Border width
                        bodyColor: '#333', // Change text color
                        titleColor: '#4FD1C5', // Change title color
                        cornerRadius: 10, // Rounded corners
                    },                    
                },
                interaction: {
                    mode: 'nearest', // Determines which elements are considered "hovered"
                    intersect: true, // Show tooltip only when cursor intersects with an element
                },
                cutout: '70%', // Hollow center
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: (chart) => {
                    const { width, height } = chart;
                    const { ctx } = chart;
                    const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
                    const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
        
                    ctx.save();
                    ctx.clearRect(0, 0, width, height);
        
                    // Determine text color
                    const textColor = completedDistance >= TREE_DISTANCE_GOAL / 2 ? '#15789a' : '#FF5722';
        
                    // Draw center text
                    ctx.font = `bold ${Math.min(height / 12, 20)}px Arial`;
                    ctx.fillStyle = textColor;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${completedDistance.toFixed(2)} km`, centerX, centerY);
        
                    ctx.restore();
                },
            }],
        });
    }
        
    

    async function saveUserStats(userStats) {
        try {
            const response = await post('/fitness/save-records', userStats);
    
            if (!response.ok) {
                const errorMessage = await response.text(); // Retrieve error message from the response body if any
                throw new Error(`Failed to save stats: ${response.status} - ${response.statusText} - ${errorMessage}`);
            }
    
            const result = await response.json();
            console.log('Stats saved successfully:', result);
        } catch (error) {
            console.error('Error saving user stats:', error);
        }
    }
    


// Fetch leaderboard data and populate podium and leaderboard
async function fetchLeaderboard() {
    try {
        const response = await get(`/fitness/display-leaderboard`);
        if (!response.ok) {
            throw new Error(`Error fetching leaderboard: ${response.status}`);
        }
        const data = await response.json();

        // Add a message to display the current month
        const now = new Date();
        const month = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();
        document.querySelector('.leaderboard-header h2').textContent = `Leaderboard for ${month} ${year}`;

        // // Check if today is the first day of the month
        // if (now.getDate() === 13) {
        //     localStorage.removeItem('shownMonth');
        //     // Show the popup if it hasn't been shown for the current month
        //     const shownMonth = localStorage.getItem('shownMonth');
        //     if (shownMonth !== `${month}-${year}`) {
        //         showWinnerPopup(data.slice(0, 3)); // Pass top 3 winners
        //         localStorage.setItem('shownMonth', `${month}-${year}`);
        //     }
        // }
        // Populate podium and leaderboard
        populatePodium(data);
        populateLeaderboard(data);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        document.querySelector('.leaderboard').textContent = 'Failed to load leaderboard';
    }
}

// Function to populate the top 3 podium
async function populatePodium(data) {
    // Default profile picture fallback
    const defaultProfilePicture = '/assets/profile/defaultprofilepic.jpg';

    // Loop through the top 3 users
    data.slice(0, 3).forEach((item, index) => {
        const podiumBlock = document.querySelector(`.podium-block.${['first', 'second', 'third'][index]}`);
        if (!podiumBlock) return;

        // Construct the profile picture URL using the new endpoint
        const avatarUrl = item.user_id
            ? `/users/profile-picture/public/${item.user_id}`
            : defaultProfilePicture;

        // Ensure proper values for distance, rides, and time
        const distance = item.distance_cycled_km.toFixed(2); // Ensures 2 decimal places
        const carbonReduced = item.distance_cycled_km * carbonEmissionPerKm; // Calculate carbon reduced in kg
        const treesToPlant = Math.floor(carbonReduced / treeThreshold); // Calculate trees to plant
    
        // Select the avatar image element
        const avatarImg = podiumBlock.querySelector('.avatar img');

        // Update the podium block with the user data
        avatarImg.src = avatarUrl;
        avatarImg.alt = `${item.name || 'Player'} Avatar`;

        // Add an error handler for the image
        avatarImg.onerror = () => {
            avatarImg.src = defaultProfilePicture;
        };

        podiumBlock.querySelector('.name').textContent = item.name || 'Anonymous';
        podiumBlock.querySelector('.stats').innerHTML = `
            ${distance} km<br>${treesToPlant} tree${treesToPlant === 1 ? '' : "s'"} effort
        `;
    });
}

// Function to populate the leaderboard below the top 3
async function populateLeaderboard(data) {
    const leaderboardContainer = document.querySelector('.leaderboard-items');

    if (!leaderboardContainer) {
        console.error('Leaderboard container not found!');
        return;
    }

    leaderboardContainer.innerHTML = ''; // Clear existing leaderboard items

    // Default profile picture fallback
    const defaultProfilePicture = '/assets/profile/defaultprofilepic.jpg';

    // Generate Leaderboard Cards Dynamically (skip top 3)
    data.slice(3).forEach((item, index) => {
        console.log("data: ", data);
        const card = document.createElement('div');
        card.className = 'leaderboard-item';

        // Construct the profile picture URL using the new endpoint
        const avatarUrl = item.user_id
            ? `/users/profile-picture/public/${item.user_id}`
            : defaultProfilePicture;

        // Ensure proper data keys are used
        const distance = item.distance_cycled_km.toFixed(2); // Ensures 2 decimal places
        const carbonReduced = item.distance_cycled_km * carbonEmissionPerKm; // Calculate carbon reduced in kg
        const treesToPlant = Math.floor(carbonReduced / treeThreshold); // Calculate trees to plant
        
        card.innerHTML = `
            <div class="rank">${index + 4}</div>
            <div class="avatar">
                <img src="${avatarUrl}" alt="${item.name || 'Anonymous'}" onerror="this.src='${defaultProfilePicture}'">
            </div>
            <div class="info">
                <div class="name">${item.name || 'Anonymous'}</div>
                <div class="stats-trees">
                    ${treesToPlant} trees<br>
                </div>
                <div class="stats">
                    ${distance} km<br>
                </div>
            </div>
        `;

        leaderboardContainer.appendChild(card);
    });
}



fetchLeaderboard();






document.addEventListener('DOMContentLoaded', async () => {
    const stravaLoginContainer = document.getElementById('strava-login-container');
    const fitnessImage = document.querySelector('.fitness-image');

    if (stravaLoginContainer) stravaLoginContainer.style.visibility = 'hidden';
    if (fitnessImage) fitnessImage.style.visibility = 'hidden';

    // Ensure the user is signed in
    const signedIn = await isSignedIn(); // Check if the user is signed in
    console.log('Is user signed in?', signedIn);
    if (!signedIn) {
        await pageRequireSignIn(); // Redirect if not signed in
        return;
    }
});

function applySpecialLayoutInline(isLoggedIn) {
    console.log("Applying layout. Is not logged in:", isLoggedIn);

    const stravaLoginContainer = document.getElementById('strava-login-container');
    const fitnessImage = document.querySelector('.fitness-image');
    const newContainers = document.getElementById('new-containers');
    const leaderboard = document.querySelector('.leaderboard');
    const podium = document.querySelector('.podium');
    const leaderboardItems = document.querySelector('.leaderboard-items');
    const contributionContainer = document.querySelector('.contribution-container');

    // Handle visibility of new-containers
    if (isLoggedIn) {
        if (newContainers) newContainers.style.display = 'block';
        if (stravaLoginContainer) {
            stravaLoginContainer.style.visibility = 'hidden'; // Hide the Strava login container
            stravaLoginContainer.style.display = 'none';
        }
        if (fitnessImage) {
            fitnessImage.style.visibility = 'visible'; // Show the fitness image
            fitnessImage.style.display = 'block';
        }

        // Reset contribution container position
        if (contributionContainer) {
            contributionContainer.style.gridColumn = '';
            contributionContainer.style.gridRow = '';
        }

        // Reset leaderboard items
        if (leaderboardItems) {
            leaderboardItems.style.marginTop = '';
            leaderboardItems.style.height = '';
        }
        leaderboardRanking(true);
    } else {
        if (newContainers) newContainers.style.display = 'none';
        if (stravaLoginContainer) {
            stravaLoginContainer.style.visibility = 'visible'; // Show the Strava login container
            stravaLoginContainer.style.display = 'block';
        }
        if (fitnessImage) {
            fitnessImage.style.visibility = 'hidden'; // Hide the fitness image
            fitnessImage.style.display = 'none';
        }
        // Move contribution container to occupy the position of the new containers
        contributionContainer.style.gridColumn = '1 / 2';
        contributionContainer.style.gridRow = '2 / 3';

        // Adjust leaderboard items to bring them higher up and make them taller
        if (leaderboardItems && podium) {
            const podiumHeight = podium.offsetHeight; // Height of the podium
            const leaderboardHeight = leaderboard.offsetHeight; // Total height of the leaderboard container

            leaderboardItems.style.marginTop = `-${podiumHeight - 330}px`; // Bring leaderboard-items closer to the podium
            leaderboardItems.style.maxHeight = `${leaderboardHeight}px`; // Adjust height dynamically (add padding if needed)
            leaderboardItems.style.overflowY = 'auto'; // Add scrolling for overflowing items
        }
        leaderboardRanking(false);
    }

    const elementsToStyle = [
        {
            element: document.querySelector('.content-wrapper'),
            styles: { display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: 'auto auto', gap: '20px', padding: '20px' },
        },
        {
            element: stravaLoginContainer,
            styles: { gridColumn: '1 / 2', gridRow: '1 / 2' },
        },
    ];

    elementsToStyle.forEach(({ element, styles }) => {
        if (!element) {
            console.error("Element not found:", styles);
            return;
        }

        if (isLoggedIn) {
            // Reset styles to use the main CSS
            Object.keys(styles).forEach((styleKey) => {
                element.style[styleKey] = '';
            });
            console.log(`Explicitly reset styles for: ${element.className || element.id}`);
        } else {
            // Apply the special layout styles
            Object.keys(styles).forEach((styleKey) => {
                element.style[styleKey] = styles[styleKey];
            });
            console.log("Applied styles to:", element.className || element.id);
        }
    });
}

async function leaderboardRanking(isLoggedIn) {
    const leaderboardPerformance = document.querySelector('.leaderboard-performance');

    const rankElement = leaderboardPerformance.querySelector('.rank');
    const messageElement = leaderboardPerformance.querySelector('p');

    if (!isLoggedIn) {
        // When the user is logged out
        if (rankElement) rankElement.style.display = 'none'; // Hide the rank
        if (messageElement) messageElement.textContent = 'Join Strava to track and join the leaderboard';
        return;
    }

    try {
        // Fetch user rank and percentage
        const response = await get('/fitness/user-rank');
        if (!response.ok) {
            throw new Error('Failed to fetch user rank');
        }

        const { rank, percentage } = await response.json();
        console.log(rank);
        localStorage.setItem('rank', rank);

        // Update UI with rank and percentage
        if (rankElement) {
            rankElement.textContent = `# ${rank}`;
        }

        if (messageElement) {
            messageElement.textContent = `You are doing better than ${percentage}% of other players!`;
        }
    } catch (error) {
        console.error('Error fetching leaderboard ranking:', error);

        // Display an error message in case of failure
        if (messageElement) {
            messageElement.textContent = 'Failed to load your ranking. Please try again later.';
        }
    }
}


async function stravaTooltip() {
    try {
        // Fetch leaderboard data
        const response = await get(`/fitness/display-leaderboard`);
        if (!response.ok) {
            throw new Error(`Error fetching leaderboard: ${response.status}`);
        }
        const data = await response.json();

        // Extract top 3 winners
        const topWinners = data.slice(0, 3).map((item) => ({
            user_id: item.user_id,
            name: item.name || 'Anonymous',
            distance_cycled_km: item.distance_cycled_km,
        }));

        // Show the popup with the tooltip tab active
        // Store winners in the dataset for use when switching tabs
        const popupContainer = document.getElementById("popup-container");
        popupContainer.dataset.winners = JSON.stringify(topWinners);

        // Show the tooltip tab
        showPopup("tooltip");
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
}

function showPopup(contentType) {
    const popupOverlay = document.getElementById("popup-overlay");
    const popupContainer = document.getElementById("popup-container");
    const winnersContent = document.getElementById("winners-content");
    const tooltipContent = document.getElementById("tooltip-content");
    const winnersTab = document.getElementById("winners-tab");
    const tooltipTab = document.getElementById("tooltip-tab");
    const tooltipImage = document.querySelector(".tooltip-image");
    const redeemBtn = document.getElementById("redeem-now-button");
    const winnerList = document.getElementById("winner-list");
    const header = document.querySelector(".popup-content h2");

    // Show the popup and overlay
    popupOverlay.style.display = "block";
    popupContainer.style.display = "flex";

    document.body.classList.add("body-no-scroll");

    // Reset active tabs and content
    winnersTab.classList.remove("active");
    tooltipTab.classList.remove("active");
    winnersContent.classList.remove("active");
    tooltipContent.classList.remove("active");

    // Handle content for the tooltip tab
    if (contentType === "tooltip") {
        tooltipTab.classList.add("active");
        tooltipContent.style.display = "block"; // Ensure tooltip content is visible
        tooltipImage.style.display = "none"; // Show the infographic image
        winnerList.innerHTML = ""; // Clear existing content
        if (redeemBtn) redeemBtn.style.display = "none"; // Hide "Redeem Now" button
        if (header) {
            header.textContent = "How the Campaign Works";
        }
    }

    // Handle content for the winners tab
    if (contentType === "winners") {
        winnersTab.classList.add("active");
        winnersContent.classList.add("active");
        tooltipImage.style.display = "block"; // Show the image for winners tab
        redeemBtn.style.display = "block"; // Show the "Redeem Now" button
        if (header) {
            header.textContent = "Congratulations to Our Top Performers!";
        }
        tooltipContent.style.display = "none";
    
        // Retrieve winners from dataset
        const winners = JSON.parse(popupContainer.dataset.winners || "[]");
        const userRank = parseInt(localStorage.getItem("userRank") || -1);
        console.log("user rank: ", userRank);
        // Hide the redeem button if the user is not in the top 3
        if (userRank > 3 || userRank === -1) {
            redeemBtn.style.display = "none";
        } else {
            redeemBtn.style.display = "block";
        }
        const winnerList = document.getElementById("winner-list");
        winnerList.innerHTML = ""; // Clear existing content
    
        // Populate winners list
        if (winners.length === 0) {
            winnerList.innerHTML = "<p>No winners to display.</p>";
        } else {
            // Desired sequence for the winners: 2, 1, 3
            const sequence = [1, 0, 2]; // Map indexes to new order: 2nd, 1st, 3rd
        
            sequence.forEach((mappedIndex, index) => {
                const winner = winners[mappedIndex]; // Get the winner from the mapped index
                const defaultProfilePicture = '/assets/profile/defaultprofilepic.jpg';
                const avatarUrl = winner.user_id
                    ? `/users/profile-picture/public/${winner.user_id}`
                    : defaultProfilePicture;
        
                const carbonReduced = winner.distance_cycled_km * carbonEmissionPerKm; // Calculate carbon reduced in kg
                const treesToPlant = Math.floor(carbonReduced / treeThreshold); // Calculate trees to plant
        
                const winnerDiv = document.createElement("div");
                winnerDiv.classList.add("winner-item", `winner-${index + 1}`); // Add a specific class based on the new rank (1, 2, 3)
        
                winnerDiv.innerHTML = `
                    <div class="name">${winner.name || "Anonymous"}</div>
                    <div class="avatar">
                        <img src="${avatarUrl}" alt="${winner.name || "Anonymous"} Avatar" onerror="this.src='${defaultProfilePicture}'">
                    </div>
                    <div class="stats">${winner.distance_cycled_km.toFixed(2)} km</div>
                    <div class="trees">${treesToPlant} tree${treesToPlant === 1 ? "" : "s"}' effort</div>
                `;
        
                winnerList.appendChild(winnerDiv);
            });
        }                
    } 
}

function closePopup() {
    const popupOverlay = document.getElementById("popup-overlay");
    const popupContainer = document.getElementById("popup-container");

    popupOverlay.style.display = "none";
    popupContainer.style.display = "none";
    document.body.classList.remove("body-no-scroll");
}

function showWinnersTab() {
    showPopup("winners");
}

function showTooltipTab() {
    showPopup("tooltip");
}
