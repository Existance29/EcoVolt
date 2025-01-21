    // Fetch leaderboard data from the API and dynamically populate the leaderboard entries
    async function fetchLeaderboard() {
        try {
            // Make the API request
            const response = await get('/fitness/display-leaderboard');

            // Parse the JSON response
            const leaderboardData = await response.json();
            console.log(leaderboardData);
            // Select the container for leaderboard entries
            const leaderboardContainer = document.querySelector('.leaderboard-container');

            // Clear any existing content
            leaderboardContainer.innerHTML = '';

            // Loop through the leaderboard data and generate HTML
            leaderboardData.forEach((entry, index) => { // Use index to determine rank
                const rank = index + 1; // Rank starts at 1, not 0
                const leaderboardEntry = `
                    <div class="leaderboard-entry">
                        <div class="details">
                            <div class="icon">
                                <!-- Dynamic Rank SVG -->
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="80" height="80">
                                    <!-- Rank Number -->
                                    <text x="60" y="60" text-anchor="middle" dominant-baseline="middle" fill="#1b190d" font-size="100" font-family="Arial, sans-serif" font-weight="bold">
                                        ${rank}
                                    </text>
                                </svg>
                            </div>
                            <div>
                                <p class="text">${entry.name}</p>
                                <p class="points">🚴‍♂️ Cycled ${entry.distance_cycled_km}km</p> <!-- Dynamic distance -->
                            </div>
                        </div>
                        <div>
                            <p class="rank">🌳 ${entry.trees_planted} Trees Planted</p> <!-- Dynamic trees planted -->
                        </div>
                    </div>
                `;

                // Append the generated HTML to the container
                leaderboardContainer.innerHTML += leaderboardEntry;
            });
        } catch (error) {
            console.error('Error fetching leaderboard data:', error);
        }
    }


    async function updateContentBasedOnLogin() {
        try {
            const response = await get('/fitness/stats'); // Assuming this returns user stats in JSON format
            const button = document.querySelector('.button');
            // Check if the response contains user statistics (e.g., `userId`)
            if (response && response.ok) {
                // User is logged in
                const rank = await isLoggedInToStrava();
                document.querySelector('.title').textContent = `You are currently ranked #${rank}`;
                document.querySelector('.subtitle').textContent = 'Check your rewards';
                button.textContent = 'View Rewards';

                // Set button click action for logged-in users
                button.onclick = () => {
                    window.location.href = 'rewards.html';
                };
                } else {
                // User is not logged in
                document.querySelector('.title').textContent = 'Link your Strava account and make every kilometer count for the planet.';
                document.querySelector('.subtitle').textContent = 'Start tracking your eco-impact and help make a difference!';
                button.textContent = 'Log In with Strava';

                // Set button click action for non-logged-in users
                button.onclick = () => {
                    redirectToStravaAuth();
                };
            }
        } catch (error) {
            console.error('Error fetching user status:', error);
        }
    }
    
    async function isLoggedInToStrava() {
        try {
            const response = await get('/fitness/user-rank'); // Fetch user rank from the endpoint
            const data = await response.json();
            if (response.ok && data.rank) {
                return data.rank; // Return the rank
            } else {
                return null; // Return null if rank is not found
            }
        } catch (error) {
            console.error('Error fetching user rank:', error);
            return null; // Return null in case of an error
        }
    }
    
    
    document.addEventListener('DOMContentLoaded', () => {
        // Call the function to update the content
        updateContentBasedOnLogin();
    
        // Call the function to populate the leaderboard
        fetchLeaderboard();
    });
    