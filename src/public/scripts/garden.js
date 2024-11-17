import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

let treesPlanted = 0; // Track how many trees are planted

const goalCoordinates = [
    { x: -0.8792145173612731, y: 2.5, z: -5.374388866164352 },
    { x: 2.05917606061755693, y: 2.5, z: 0.024575523735354762 },
    { x: 7.133209284698885, y: 2.5, z: 0.48074781658198873 },
    { x: -2.0592663952500967, y: 2.5, z: 9.600906707072512 },
    { x: 5.61514304939320275, y: 2.5, z: -9.102356010995563 }
];

// Function to fetch sustainability goals and plant trees if goals are completed
async function fetchGoalsAndPlantTrees(scene) {
    const company_id = sessionStorage.getItem("company_id") || localStorage.getItem("company_id");
    try {
        const response = await fetch("/dashboard-overview", {
            headers: {
                "Authorization": `Bearer ${sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken")}`,
                "Company-ID": company_id
            }
        });

        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);

        const data = await response.json();
        const goals = data.sustainabilityGoals;

        if (Array.isArray(goals)) {
            console.log("Fetched Sustainability Goals:", goals);

            goals.forEach((goal, index) => {
                console.log(`Goal: ${goal.goal_name}, Progress: ${goal.progress_percentage}%`);

                // Plant a tree for goals that are 100% complete
                if (goal.progress_percentage >= 100 && treesPlanted < goalCoordinates.length) {
                    plantTree(scene, goalCoordinates[treesPlanted]);
                    treesPlanted++;
                }

                // Update goal status dynamically in the DOM
                const statusElement = document.getElementById(`goal-status-${index + 1}`);
                if (statusElement) {
                    statusElement.textContent =
                        goal.progress_percentage >= 100
                            ? "Status: Completed"
                            : `Status: In Progress (${goal.progress_percentage.toFixed(1)}%)`;
                }
            });

            // Unlock the badge button if all trees are planted
            if (treesPlanted === goalCoordinates.length) {
                unlockButton();
            }
        } else {
            console.error("Sustainability goals data is not in the expected format:", goals);
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
document.getElementById("add-badge-button").addEventListener("click", function () {
    document.getElementById("garden-badge-modal").style.display = "flex";
});

// Handle close modal
document.getElementById("garden-close-modal-btn").addEventListener("click", function () {
    document.getElementById("garden-badge-modal").style.display = "none";
});

// Handle view profile button
document.getElementById("garden-view-profile-btn").addEventListener("click", function () {
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

// Carousel functionality
document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.carousel-track');
    const cards = Array.from(track.children);
    const prevButton = document.getElementById('carousel-prev');
    const nextButton = document.getElementById('carousel-next');
    const headingElement = document.getElementById('carousel-heading');

    let currentIndex = 0;

    // Dynamically populate card <h4> elements
    cards.forEach((card) => {
        const headingText = card.getAttribute('data-heading');
        const headingElementInCard = card.querySelector('.card-heading');
        if (headingElementInCard && headingText) {
            headingElementInCard.textContent = headingText; // Set the card <h4> content
        }
    });

    // Update carousel heading based on the current card
    const updateHeading = (index) => {
        const currentCard = cards[index];
        const headingText = currentCard.getAttribute('data-heading');
        headingElement.textContent = headingText; // Update external carousel heading
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
