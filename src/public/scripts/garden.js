import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

let treesPlanted = 0; // Track how many trees are planted

const goalCoordinates = [
    { x: -0.8792145173612731, y: 2.5, z: -5.374388866164352 },
    { x: 2.05917606061755693, y: 2.5, z: 0.024575523735354762 },
    { x: 7.133209284698885, y: 2.5, z: 0.48074781658198873 },
    { x: -2.0592663952500967, y: 2.5, z: 9.600906707072512 },
    { x: 5.61514304939320275, y: 2.5, z: -9.102356010995563 }
];

// Function to calculate overall progress towards net zero by 2050
function calculateOverallProgress(goals) {
    let totalProgress = 0;

    goals.forEach(goal => {
        let progressPercentage = 0;

        if (goal.goal_name === "Renewable Energy Usage") {
            // Higher current value means better progress
            progressPercentage = goal.current_value >= goal.target_value
                ? 100
                : (goal.current_value / goal.target_value) * 100;
        } else {
            // Lower current value means better progress
            progressPercentage = goal.current_value <= goal.target_value
                ? 100
                : (goal.target_value / goal.current_value) * 100;
        }

        totalProgress += Math.min(progressPercentage, 100);
    });

    return totalProgress / goals.length; // Return the average progress
}



// Function to fetch sustainability goals and plant trees if goals are completed
async function fetchGoalsAndPlantTrees(scene) {
    const company_id = sessionStorage.getItem("company_id") || localStorage.getItem("company_id");
    try {
        const response = await fetch("/dashboard-overview", {
            headers: {
                "Authorization": `Bearer ${sessionStorage.accessToken || localStorage.accessToken}`,
                "Company-ID": company_id
            }
        });

        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);

        const data = await response.json();
        const goals = data.sustainabilityGoals;

        if (Array.isArray(goals)) {
            // Calculate overall progress and add as a virtual goal
            const overallProgress = calculateOverallProgress(goals);
            goals.push({
                goal_name: "Overall Progress",
                current_value: overallProgress,
                target_value: 100
            });

            goals.forEach((goal, index)=> {
                // plantTree(scene, goalCoordinates[treesPlanted]);
                // treesPlanted++;
                console.log("Checking goal:", goal);
                const statusElement = document.getElementById(`goal-status-${index + 1}`);
                if (statusElement) {
                    const progressPercentage = goal.goal_name === "Renewable Energy Usage" || goal.goal_name === "Overall Progress"
                        ? (goal.current_value / goal.target_value) * 100
                        : (goal.target_value / goal.current_value) * 100;

                    if (progressPercentage >= 100) {
                        statusElement.textContent = "Status: Completed";
                    } else {
                        statusElement.textContent = "Status: In Progress";
                    }
                }
                // Determine if the goal is "higher is better" or "lower is better"
                const isHigherBetter = ['Renewable Energy Usage', 'Overall Progress'].includes(goal.goal_name);

                // Check if the goal is achieved
                const isGoalAchieved = isHigherBetter
                    ? goal.current_value >= goal.target_value
                    : goal.current_value <= goal.target_value;

                console.log(`Goal Name: ${goal.goal_name}, Target Achieved: ${isGoalAchieved}`);

                if (isGoalAchieved && treesPlanted < goalCoordinates.length) {
                    // Plant a tree if the goal is achieved and positions are available
                    plantTree(scene, goalCoordinates[treesPlanted]);
                    treesPlanted++;
                }
            });

            // Unlock the button if all trees have been planted
            if (treesPlanted === goalCoordinates.length) {
                unlockButton();
            }
        } else {
            console.error("Sustainability goals data is not an array:", goals);
        }
        
    } catch (error) {
        console.error("Error fetching goals:", error);
    }
}


function plantTree(scene, position) {
    console.log("Planting a new tree at:", position);
    const loader = new THREE.TextureLoader();
    const barkTexture = loader.load('./assets/tree/trunk_texture.jpg');
    const leavesTexture = loader.load('./assets/tree/foliage_texture.jpg');

    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.5, 5, 12);
    const trunkMaterial = new THREE.MeshStandardMaterial({ map: barkTexture });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(position.x, position.y, position.z);
    scene.add(trunk);

    for (let i = 0; i < 60; i++) {
        const leavesGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({
            map: leavesTexture,
            transparent: true,
            opacity: 0.9,
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(
            trunk.position.x + (Math.random() - 0.5) * 2,
            trunk.position.y + 3 + Math.random() * 1.5,
            trunk.position.z + (Math.random() - 0.5) * 2
        );
        scene.add(leaves);
    }
}

// Set up the scene, camera, and lights
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 20);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.getElementById('container-tree').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Fetch goals and plant trees if any goal is achieved
fetchGoalsAndPlantTrees(scene);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Unlock the button when all trees are planted
function unlockButton() {
    const button = document.getElementById("add-badge-button");
    button.disabled = false;
    button.textContent = "Add badge to profile";
    button.classList.add("enabled");
}

// Handle click event on the button
document.getElementById("add-badge-button").addEventListener("click", function() {
    document.getElementById("garden-badge-modal").style.display = "flex";
});

// Handle close modal
document.getElementById("garden-close-modal-btn").addEventListener("click", function() {
    document.getElementById("garden-badge-modal").style.display = "none";
});

// Handle view profile button
document.getElementById("garden-view-profile-btn").addEventListener("click", function() {
    localStorage.setItem("badgeUnlocked", "true");
    window.location.href = "settings.html";
});










// Function to fetch the company name and update the title
async function fetchCompanyNameAndUpdateTitle() {
    try {
        const company_id = sessionStorage.getItem("company_id") || localStorage.getItem("company_id");
        const response = await fetch(`/VirtualGarden/CompanyName/${company_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')}`,
                'Company-ID': company_id
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch company name: ${response.statusText}`);
        }

        const data = await response.json();

        // Check if the response is an array and has at least one element
        if (Array.isArray(data) && data.length > 0 && data[0].name) {
            const titleElement = document.getElementById('virtual-garden-title');
            titleElement.textContent = `${data[0].name}'s Virtual Garden`;
        } else {
            console.error("Company name not found in response:", data);
        }
    } catch (error) {
        console.error("Error fetching company name:", error);
    }
}

// Call the function to fetch the company name and update the title
fetchCompanyNameAndUpdateTitle();





document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.carousel-track');
    const cards = Array.from(track.children);
    const prevButton = document.getElementById('carousel-prev');
    const nextButton = document.getElementById('carousel-next');
    const headingElement = document.getElementById('carousel-heading');

    let currentIndex = 0;

    // Update heading based on the current card
    const updateHeading = (index) => {
        const currentCard = cards[index];
        const headingText = currentCard.getAttribute('data-heading');
        headingElement.textContent = headingText;
    };

    // Move to the next or previous card
    const moveToCard = (index) => {
        const cardWidth = cards[0].getBoundingClientRect().width;
        track.style.transform = `translateX(-${index * cardWidth}px)`;
        currentIndex = index;
        updateHeading(currentIndex);
        updateButtons();
    };

    // Enable/disable navigation buttons
    const updateButtons = () => {
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex === cards.length - 1;
    };

    // Event Listeners
    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) moveToCard(currentIndex - 1);
    });

    nextButton.addEventListener('click', () => {
        if (currentIndex < cards.length - 1) moveToCard(currentIndex + 1);
    });

    // Initialize the first card and heading
    updateHeading(currentIndex);
    updateButtons();
});
