// Check if user is signed in before proceeding
document.addEventListener('DOMContentLoaded', async () => {
    await pageRequireSignIn(); // Redirect to sign-in page if not logged in
    
    let treesPlanted = 0; // Track trees planted
    const treeThreshold = 24.62; // 24.62 kg of carbon avoided = 1 tree

    // Function to calculate a random position within the container
    function getRandomPositionWithinImage(container) {
        const { width, height } = container.getBoundingClientRect();
    
        // Adjust boundaries for Three.js positioning
        const xMin = -(width / 2) / 100; // Convert to Three.js space
        const xMax = (width / 2) / 100;
        const zMin = -(height / 2) / 100;
        const zMax = (height / 2) / 100;
    
        // Generate random position within container
        const position = {
            x: Math.random() * (xMax - xMin) + xMin, // Random x within bounds
            y: 0, // Ground level
            z: Math.random() * (zMax - zMin) + zMin // Random z within bounds
        };
    
        console.log("Random Tree Position (calculated):", position);
        return position;
    }
    

    // Function to plant a tree
    function plantTree(scene, position) {
        console.log("Planting a tree at:", position);

        const loader = new THREE.TextureLoader();
        const barkTexture = loader.load('./assets/tree/trunk_texture.jpg');
        const leavesTexture = loader.load('./assets/tree/foliage_texture.jpg');

        // Trunk
        const trunkHeight = 2; // Set trunk height
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, trunkHeight, 16);
        const trunkMaterial = new THREE.MeshStandardMaterial({ map: barkTexture });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

        // Adjust trunk position
        trunk.position.set(position.x, position.y + trunkHeight / 2, position.z);
        scene.add(trunk);

        // Leaves
        const leavesRadius = 0.7; // Slightly bigger leaves for proportional look
        const leavesGeometry = new THREE.SphereGeometry(leavesRadius, 16, 16);
        const leavesMaterial = new THREE.MeshStandardMaterial({
            map: leavesTexture,
            transparent: true,
            opacity: 0.9
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);

        // Position the leaves just above the trunk
        leaves.position.set(position.x, position.y + trunkHeight + leavesRadius / 2, position.z);
        scene.add(leaves);

        console.log(`Tree planted at (${position.x}, ${position.y}, ${position.z})`);
    }

    // Adjust renderer and camera to match the container
    function setupRenderer(renderer, camera) {
        const container = document.getElementById('container-tree');
        const { width, height } = container.getBoundingClientRect();
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        console.log("Renderer size updated:", { width, height });
    }

    // Update tree visualization based on carbon reduction
    function updateTreeVisualization(carbonReduced) {
        const container = document.getElementById('container-tree');
        const treesToPlant = Math.floor(carbonReduced / treeThreshold); // Calculate trees to plant

        while (treesPlanted < treesToPlant) {
            const position = getRandomPositionWithinImage(container);
            plantTree(scene, position);
            treesPlanted++;
        }

        console.log(`Trees Planted: ${treesPlanted}`);
    }

    // Fetch carbon reduction data and update visualization
    function fetchCarbonReductionAndUpdate() {
        fetch('/fitness/stats') // Fetch stats without query parameters
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Error fetching stats: ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                let totalDistance = data.totalDistance / 1000; // Convert meters to km

                // uncomment the code below to test
                // totalDistance = 500;

                const carbonEmissionPerKm = 0.1082;
                const carbonReduced = totalDistance * carbonEmissionPerKm;

                // Update carbon emission text
                document.getElementById('carbon-avoided').textContent = `Carbon Avoided: ${carbonReduced.toFixed(2)} kg`;
                document.getElementById('total-distance').textContent = `Total distance cycled: ${totalDistance.toFixed(2)} km`;

                // Update tree visualization
                updateTreeVisualization(carbonReduced);
                if (treesPlanted === 0 || treesPlanted === 1) {
                    document.getElementById('trees-planted-message').textContent = `Your distance cycled is equivalent to carbon absorption of ${treesPlanted} tree`;
                }
                else {
                    document.getElementById('trees-planted-message').textContent = `Your distance cycled is equivalent to carbon absorption of ${treesPlanted} trees`;
                }
            })
            .catch((error) => {
                console.error('Error fetching stats:', error);
                document.getElementById('carbon-avoided').textContent = 'Failed to load carbon data';
                document.getElementById('total-distance').textContent = 'Failed to load distance data';
                document.getElementById('trees-planted-message').textContent = 'Failed to calculate trees planted.';
            });
    }

    // Set up Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0); // Transparent background
    document.getElementById('container-tree').appendChild(renderer.domElement);
    setupRenderer(renderer, camera);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Call to fetch and update
    fetchCarbonReductionAndUpdate();

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    window.addEventListener('resize', () => setupRenderer(renderer, camera));
});