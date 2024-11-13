import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

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
            goals.forEach(goal => {
                console.log("Checking goal:", goal); // Log goal details
        
                // Determine if the goal is "higher is better" or "lower is better"
                const isHigherBetter = ['Renewable Energy Usage'].includes(goal.goal_name);
        
                // Check if the goal is achieved by considering both "higher is better" and "lower is better" cases
                const isGoalAchieved = isHigherBetter
                    ? goal.current_value >= goal.target_value // Higher or equal meets the target
                    : goal.current_value <= goal.target_value; // Lower or equal meets the target
        
                console.log(`Goal Name: ${goal.goal_name}, Target Achieved: ${isGoalAchieved}`);
        
                if (isGoalAchieved) {
                    console.log("Goal achieved:", goal.goal_name); // Log when a goal is achieved
                    plantTree(scene); // Plant a tree if the goal is achieved
                }
            });
        } else {
            console.error("Sustainability goals data is not an array:", goals);
        }
        
        
    } catch (error) {
        console.error("Error fetching goals:", error);
    }
}

// Function to create the main realistic tree
async function createRealisticTree(scene) {
    const loader = new THREE.TextureLoader();
    const barkTexture = loader.load('./assets/tree/trunk_texture.jpg');
    const leavesTexture = loader.load('./assets/tree/foliage_texture.jpg');

    // Tree trunk (slightly larger to balance the smaller branches and leaves)
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.6, 6, 12); // Adjust radius and height
    const trunkMaterial = new THREE.MeshStandardMaterial({
        map: barkTexture,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 3; // Adjust the position
    scene.add(trunk);

    // Recursive function for branches (slightly larger to appear fuller)
    function createBranch(level, position, rotation, branchScale = 0.7) { // Increased initial branch scale
        if (level > 3) return;

        const branchGeometry = new THREE.CylinderGeometry(0.15 * branchScale, 0.3 * branchScale, 3 * branchScale, 8); // Adjust dimensions
        const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
        branch.position.copy(position);
        branch.rotation.copy(rotation);

        branch.position.y += 1.5 * branchScale; // Adjust length for fuller branches
        branch.rotation.z += 0.3 * Math.random(); // Random rotation for natural appearance

        scene.add(branch);

        for (let i = 0; i < 3; i++) { // Increase branches per level for a fuller look
            const newPosition = branch.position.clone();
            const newRotation = branch.rotation.clone();
            newRotation.z += (Math.random() - 0.5) * 0.3;
            newRotation.x += (Math.random() - 0.5) * 0.3;
            newPosition.x += (Math.random() - 0.5) * 1;
            newPosition.y += Math.random() * 1.5;

            createBranch(level + 1, newPosition, newRotation, branchScale * 0.8);
        }
    }

    createBranch(0, trunk.position.clone(), new THREE.Euler(0, 0, 0), 0.7); // Adjust branch scale for fullness

    // Leaves clusters (denser and positioned closer together)
    function createLeavesCluster(position, scale = 3) { // Smaller, but slightly denser clusters
        const leavesGeometry = new THREE.SphereGeometry(2 * scale, 8, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({
            map: leavesTexture,
            transparent: true,
            opacity: 0.9,
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.copy(position);
        leaves.position.x += (Math.random() - 0.5) * 1.2;
        leaves.position.y += (Math.random() - 0.5) * 1.2;
        leaves.position.z += (Math.random() - 0.5) * 1.2;
        scene.add(leaves);
    }

    for (let i = 0; i < 90; i++) { // Increase leaves count for a fuller look
        createLeavesCluster(new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            trunk.position.y + 4 + Math.random() * 2,
            (Math.random() - 0.5) * 3
        ), 0.5); // Adjust scale for leaves
    }
}



// Function to plant a tree in the scene

function plantTree(scene) {
    console.log("Planting a new tree");
    const loader = new THREE.TextureLoader();
    const barkTexture = loader.load('./assets/tree/trunk_texture.jpg');
    const leavesTexture = loader.load('./assets/tree/foliage_texture.jpg');

    const trunkGeometry = new THREE.CylinderGeometry(0.5, 1.5, 10, 12);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        map: barkTexture,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(Math.random() * 20 - 10, 5, Math.random() * 20 - 10);
    scene.add(trunk);

    for (let i = 0; i < 65; i++) {
        const leavesGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({
            map: leavesTexture,
            transparent: true,
            opacity: 0.9,
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(
            trunk.position.x + (Math.random() - 0.5) * 4,
            trunk.position.y + 6 + Math.random() * 3,
            trunk.position.z + (Math.random() - 0.5) * 4
        );
        scene.add(leaves);
    }
}

// Set up the scene, camera, and lights
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 20);

const renderer = new THREE.WebGLRenderer({ alpha: true }); // Enable transparency
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // Make the background transparent

// Attach the renderer to the `#container-tree` div instead of the body
document.getElementById('container-tree').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Fetch goals and plant trees if any goal is achieved
fetchGoalsAndPlantTrees(scene);
createRealisticTree(scene);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
