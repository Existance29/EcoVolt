const treeThreshold = 24.62; // 24.62 kg of carbon avoided = 1 tree
const distancePerTree = treeThreshold / 0.1082; // In kilometers
document.addEventListener('DOMContentLoaded', async () => {
    await pageRequireSignIn(); // Redirect to sign-in page if not logged in
    await checkStravaLogin();
    const scene = initializeScene();
    const renderer = initializeRenderer(scene.camera);

    fetchAndVisualizeData(scene, renderer);
    const donutChart = initializeDonutChart();
    await updateDonutChart(donutChart);
    await updatestats();
});

async function checkStravaLogin() {
    try {
        const response = await get('/fitness/stats');
        if (!response.ok) {
            // If not logged into Strava
            // window.location.href = 'fitnessLogOut.html';
        } else {
            const data = await response.json();
            if (!data || !data.totalDistance) {
                // If Strava data is missing
                // window.location.href = 'fitnessLogOut.html';
            }
        }
    } catch (error) {
        console.error('Error checking Strava login status:', error);
        // Redirect to fitnessLogOut.html on error
    //     window.location.href = 'fitnessLogOut.html';
    }
}

// Initializes the Three.js scene and camera
function initializeScene() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    return { scene, camera };
}

// Sets up and returns the renderer
function initializeRenderer(camera) {
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0); // Transparent background
    const container = document.getElementById('container-tree');
    container.appendChild(renderer.domElement);
    setupRenderer(renderer, camera);

    // Handle window resize
    window.addEventListener('resize', () => setupRenderer(renderer, camera));

    return renderer;
}

// Adjusts renderer and camera to match the container
function setupRenderer(renderer, camera) {
    const container = document.getElementById('container-tree');
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    console.log("Renderer size updated:", { width, height });
}

// Fetches carbon reduction data and updates the visualization
async function fetchAndVisualizeData(scene, renderer) {
    let treesPlanted = 0; // Track trees planted

    try {
        const data = await fetchFitnessStats();
        const totalDistance = data.totalDistance / 1000; // Convert meters to km

        const carbonReduced = calculateCarbonReduced(totalDistance);
        const treesToPlant = CalculateTreesToPlant(totalDistance); // Calculate trees based on distance

        // Update UI
        document.getElementById('carbon-avoided').textContent = `Carbon Avoided: ${carbonReduced.toFixed(2)} kg`;
        document.getElementById('total-distance').textContent = `Total distance cycled: ${totalDistance.toFixed(2)} km`;

        treesPlanted = updateTreeVisualization(scene, treesToPlant, treesPlanted);

        if (treesPlanted === 0 || treesPlanted === 1) {
            document.getElementById('trees-planted-message').textContent = `Your distance cycled is equivalent to carbon absorption of ${treesPlanted} tree`;
        } else {
            document.getElementById('trees-planted-message').textContent = `Your distance cycled is equivalent to carbon absorption of ${treesPlanted} trees`;
        }

        // Save user stats
        await saveUserStats(data, treesPlanted);
    } catch (error) {
        console.error('Error fetching stats:', error);
        document.getElementById('carbon-avoided').textContent = 'Failed to load carbon data';
        document.getElementById('total-distance').textContent = 'Failed to load distance data';
        document.getElementById('trees-planted-message').textContent = 'Failed to calculate trees planted.';
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene.scene, scene.camera);
    }
    animate();
}

// Fetches fitness stats from the API
async function fetchFitnessStats() {
    const response = await get('/fitness/stats');
    if (!response.ok) {
        throw new Error(`Error fetching stats: ${response.statusText}`);
    }
    return response.json();
}

// Saves the user's fitness stats to the server
async function saveUserStats(fetchUserStats, treesPlanted) {
    try {
        const userStats = {
            distance_cycled_km: fetchUserStats.totalDistance / 1000, // Convert meters to kilometers
            number_of_rides: fetchUserStats.totalRides, // Assuming this is part of the response
            time_travelled_hours: fetchUserStats.totalTime / 3600, // Convert seconds to hours
            trees_planted: treesPlanted,
            month: new Date().getMonth() + 1, // JavaScript months are 0-based
            year: new Date().getFullYear()
        };
        const response = await post('/fitness/save-records', userStats);
        if (!response.ok) {
            throw new Error(`Error saving stats: ${response.statusText}`);
        }
        console.log('User stats saved successfully.');
    } catch (error) {
        console.error('Error saving user stats:', error);
    }
}

// Calculates the carbon reduced based on total distance
function calculateCarbonReduced(totalDistance) {
    const carbonEmissionPerKm = 0.1082;
    return totalDistance * carbonEmissionPerKm;
}

function CalculateTreesToPlant(totalDistance) {
    return Math.floor(totalDistance / distancePerTree);
    // return 2;
}

// Updates the tree visualization based on trees to plant
function updateTreeVisualization(scene, treesToPlant, treesPlanted) {
    const container = document.getElementById('container-tree');

    while (treesPlanted < treesToPlant) {
        const position = getRandomPositionWithinImage(container);
        plantTree(scene.scene, position);
        treesPlanted++;
    }

    console.log(`Trees Planted: ${treesPlanted}`);
    return treesPlanted;
}

// Function to calculate a random position within the container
function getRandomPositionWithinImage(container) {
    const { width, height } = container.getBoundingClientRect();

    const xMin = -(width / 2) / 100; // Convert to Three.js space
    const xMax = (width / 2) / 100;
    const zMin = -(height / 2) / 100;
    const zMax = (height / 2) / 100;

    return {
        x: Math.random() * (xMax - xMin) + xMin,
        y: 0,
        z: Math.random() * (zMax - zMin) + zMin
    };
}

// Function to plant a tree
function plantTree(scene, position) {
    const loader = new THREE.TextureLoader();
    const barkTexture = loader.load('./assets/tree/trunk_texture.jpg');
    const leavesTexture = loader.load('./assets/tree/foliage_texture.jpg');

    // Trunk
    const trunkHeight = 2;
    const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, trunkHeight, 16);
    const trunkMaterial = new THREE.MeshStandardMaterial({ map: barkTexture });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(position.x, position.y + trunkHeight / 2, position.z);
    scene.add(trunk);

    // Leaves
    const leavesRadius = 0.7;
    const leavesGeometry = new THREE.SphereGeometry(leavesRadius, 16, 16);
    const leavesMaterial = new THREE.MeshStandardMaterial({ map: leavesTexture, transparent: true, opacity: 0.9 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(position.x, position.y + trunkHeight + leavesRadius / 2, position.z);
    scene.add(leaves);
}

async function updatestats() {
    try {
        const data = await fetchFitnessStats(); // Await the async fetch call
        console.log(data);
        const numberOfRidesFetched = data.totalRides;
        const timeTravelledFetched = data.totalTime;
        console.log("data:", numberOfRidesFetched, timeTravelledFetched);
        // Update the DOM with the fetched data
        const numberOfRidesElement = document.querySelector('.number-of-rides .value');
        const timeTravelledElement = document.querySelector('.time-travelled .value');
        numberOfRidesElement.textContent = numberOfRidesFetched;
        timeTravelledElement.textContent = formatTime(timeTravelledFetched);
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

function initializeDonutChart() {
    const ctx = document.getElementById('donutChart').getContext('2d');
    

    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'], // Labels remain as per your context
            datasets: [
                {
                    data: [34, 66], // Example data: 34 completed, 66 remaining
                    backgroundColor: ['#4FD1C5', '#E0E0E0'], // Green for Completed, Gray for Remaining
                    borderWidth: 0, // No border
                },
            ],
        },
        options: {
            responsive: true,
            cutout: '70%', // Creates the ring effect
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => {
                            const label = tooltipItem.label; // Get the label ('Completed' or 'Remaining')
                            const value = tooltipItem.raw; // Get the value
                            return `${label}: ${value.toFixed(2)} km`; // Format as kilometers
                        },
                    },
                },
                legend: {
                    display: false, // Hide built-in legend (custom legend is used)
                },
                centerText: {
                    display: true,
                    text: '34',
                    subtext: 'Completed',
                },
            },
        },
    });

    return chart;
}

async function updateDonutChart(chart) {
    try {
        const data = await fetchFitnessStats();
        const totalDistance = data.totalDistance / 1000; // Convert meters to km

        const progress = totalDistance % distancePerTree;
        const remaining = distancePerTree - progress;

        // Update chart data
        chart.data.datasets[0].data = [progress, remaining];
        chart.options.plugins.centerText.text = `${progress.toFixed(2)} km`;

        // Update the chart-number element
        const chartNumberElement = document.querySelector('.chart-number');
        if (chartNumberElement) {
            chartNumberElement.textContent = `${progress.toFixed(2)}`;
        }

        chart.update();
    } catch (error) {
        console.error('Error updating donut chart:', error);
    }
}




// Plugin for center text
Chart.register({
    id: 'centerText',
    beforeDraw: (chart) => {
        if (chart.options.plugins.centerText && chart.options.plugins.centerText.display) {
            const ctx = chart.ctx;
            const { width } = chart;
            const text = chart.options.plugins.centerText.text;
            const subtext = chart.options.plugins.centerText.subtext;

            ctx.save();

            // Main text (large number)
            ctx.font = 'bold 25px Arial'; // Bold and larger font size
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000'; // Black color for the text

            const centerX = width / 2;
            const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2 - 10; // Adjusted slightly higher

            ctx.fillText(text, centerX, centerY); // Draw the central number

            // Subtext (smaller label below the main text)
            ctx.font = '14px Arial'; // Smaller font size for the subtext
            ctx.fillStyle = '#666'; // Gray color for the subtext
            ctx.fillText(subtext, centerX, centerY + 20); // Positioned below the number

            ctx.restore();
        }
    },
});

// Helper function to format time as hours and minutes
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) {
        return `${minutes} min`;
    }
    return `${hours}h ${minutes}m`;
}

