const TREE_DISTANCE_GOAL = 175; // 175 km to offset 1 tree's annual CO₂ absorption

// Select containers
const stravaLoginContainer = document.getElementById('strava-login-container');
const combinedContainer = document.getElementById('combined-container');
const newContainers = document.getElementById('new-containers');
const leaderboard = document.querySelector('.leaderboard');

// Fetch athlete stats from the backend
fetch('/fitness/stats') // Fetch data without query parameters
    .then((response) => {
        if (response.status === 401) {
            // User is not logged in
            stravaLoginContainer.style.display = 'block'; // Show Strava login container
            combinedContainer.style.display = 'none'; // Hide combined container
            newContainers.style.display = 'none'; // Hide new containers
            leaderboard.style.display = 'flex'; // Ensure leaderboard remains visible
            throw new Error('User not authenticated');
        }
        return response.json();
    })
    .then((data) => {
        // Hide login and show data containers
        stravaLoginContainer.style.display = 'none'; // Hide login container
        combinedContainer.style.display = 'block'; // Show combined container
        newContainers.style.display = 'grid'; // Show new containers
        leaderboard.style.display = 'flex'; // Ensure leaderboard is visible

        // Extract total distance, total time, and total rides
        let totalDistance = (data.totalDistance / 1000).toFixed(2); // Convert distance to km
        const totalTime = data.totalTime; // Time in seconds
        const totalRides = data.totalRides; // Number of rides

        // Reset distance and increment trees planted if goal reached
        let completedDistance = totalDistance % TREE_DISTANCE_GOAL; // Distance towards current goal
        // uncomment the code below to test
        // completedDistance = 120;
        const remainingDistance = TREE_DISTANCE_GOAL - completedDistance; // Remaining distance for the next tree

        // Determine color based on halfway point
        const completedColor = completedDistance >= TREE_DISTANCE_GOAL / 2 ? '#15789a' : '#FF5722'; // Green or default color

        // Convert total time to hours and minutes
        const totalHours = Math.floor(totalTime / 3600);
        const totalMinutes = Math.floor((totalTime % 3600) / 60);

        // Format the time based on the presence of hours
        let formattedTime = totalHours > 0 
            ? `${totalHours}h ${totalMinutes}m` 
            : `${totalMinutes} min`;

        // Update the chart
        const ctx = document.getElementById('donutChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', "Remaining distance to 1 tree's effort"],
                datasets: [{
                    data: [completedDistance, remainingDistance],
                    backgroundColor: [completedColor, '#CCCCCC'], // Dynamic color for completed
                    hoverOffset: 4,
                    borderColor: '#FFFFFF',
                    borderWidth: 2
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom', // Ensure the legend is at the bottom
                        labels: {
                            font: { size: 14 },
                            color: '#333',
                            padding: 20 // Add padding around legend items
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const datasetLabel = context.dataset.label || '';
                                const value = context.raw.toFixed(2);
                                return `${datasetLabel}: ${value} km`;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: true
                },
                cutout: '70%' // Hollow in the center
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: (chart) => {
                    const { width, height } = chart;
                    const { ctx } = chart;

                    ctx.save();
                    ctx.clearRect(0, 0, width, height);

                    // Get chart center
                    const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
                    const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;

                    // Determine text color based on the halfway point
                    const textColor = completedDistance >= TREE_DISTANCE_GOAL / 2 ? '#15789a' : '#FF5722';

                    // Main text: Distance completed
                    const fontSizeMain = Math.min(height / 12, 20); // Adjust dynamically but cap at 20px
                    ctx.font = `bold ${fontSizeMain}px Arial`;
                    ctx.fillStyle = textColor; // Dynamic color based on completed distance
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${completedDistance.toFixed(2)} km`, centerX, centerY);

                    ctx.restore();
                }
            }]
        });

        // Update the UI
        document.querySelector('.number-of-rides .value').textContent = `${totalRides}`;
        document.querySelector('.time-travelled .value').textContent = formattedTime;

    })
    .catch((err) => {
        console.error('Error fetching stats:', err);
        document.querySelector('.time-travelled').textContent = 'Failed to load time data';
        document.querySelector('.number-of-rides').textContent = 'Failed to load rides data';
        document.querySelector('.carbon-emission-reduced').textContent = 'Failed to load carbon data';
    });
