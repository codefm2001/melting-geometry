// Global variables
let scene, camera, renderer, geometry, material, mesh, controls;
let clock = new THREE.Clock();
let noise = new THREE.SimplexNoise();

// Animation parameters
const params = {
    amplitude: 0.5,
    frequency: 0.5,
    speed: 0.3,
    meltFactor: 1.5
};

// Initialize the scene
function init() {
    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Create the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Create the geometry
    geometry = new THREE.IcosahedronGeometry(1, 4); // A highly subdivided icosahedron
    
    // Store original positions for animation
    geometry.userData = {
        originalPositions: geometry.attributes.position.array.slice()
    };

    // Create a custom shader material for the melting effect
    material = new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        metalness: 0.5,
        roughness: 0.2,
        emissive: 0x004466,
        emissiveIntensity: 0.5
    });

    // Create the mesh
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xff0066, 1, 100);
    pointLight1.position.set(5, 3, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0066ff, 1, 100);
    pointLight2.position.set(-5, -3, 5);
    scene.add(pointLight2);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start the animation
    animate();
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Get elapsed time
    const time = clock.getElapsedTime();

    // Update the geometry (melting effect)
    updateGeometry(time);

    // Rotate the mesh slightly
    mesh.rotation.y = time * 0.1;

    // Update controls
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

// Update the geometry for the melting effect
function updateGeometry(time) {
    const positions = geometry.attributes.position.array;
    const originalPositions = geometry.userData.originalPositions;

    for (let i = 0; i < positions.length; i += 3) {
        const x = originalPositions[i];
        const y = originalPositions[i + 1];
        const z = originalPositions[i + 2];

        // Calculate vertex distance from origin (normalized)
        const distance = Math.sqrt(x * x + y * y + z * z);

        // Calculate noise value based on position and time
        const noiseValue = noise.noise3d(
            x * params.frequency,
            y * params.frequency,
            z * params.frequency + time * params.speed
        );

        // Calculate displacement based on noise and distance
        const displacement = params.amplitude * noiseValue;

        // Apply more displacement to vertices in the lower half of the geometry (melting effect)
        const meltEffect = y < 0 ? Math.abs(y) * params.meltFactor : 0;
        const totalDisplacement = displacement + meltEffect * Math.sin(time * params.speed);

        // Apply displacement in the direction of the vertex
        positions[i] = x + (x / distance) * totalDisplacement;
        positions[i + 1] = y + (y / distance) * totalDisplacement;
        positions[i + 2] = z + (z / distance) * totalDisplacement;
    }

    // Update the geometry
    geometry.attributes.position.needsUpdate = true;
}

// Initialize the scene when the page loads
window.addEventListener('load', init);