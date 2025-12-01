// Initialize Three.js scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add ground plane
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Create simple car model (box)
const carGeometry = new THREE.BoxGeometry(2, 1, 4);
const carMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const car = new THREE.Mesh(carGeometry, carMaterial);
car.position.y = 0.5;
scene.add(car);

// Camera position
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// Car physics variables
let velocity = new THREE.Vector3(0, 0, 0);
let acceleration = 0;
let steering = 0;
const maxSpeed = 0.5;
const accelerationRate = 0.01;
const friction = 0.98;
const steeringRate = 0.02;

// Keyboard controls
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Handle input
    acceleration = 0;
    steering = 0;
    if (keys['ArrowUp'] || keys['KeyW']) acceleration = accelerationRate;
    if (keys['ArrowDown'] || keys['KeyS']) acceleration = -accelerationRate;
    if (keys['ArrowLeft'] || keys['KeyA']) steering = steeringRate;
    if (keys['ArrowRight'] || keys['KeyD']) steering = -steeringRate;

    // Update car rotation (steering)
    car.rotation.y += steering;

    // Calculate forward direction
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(car.quaternion);

    // Apply acceleration
    velocity.add(forward.clone().multiplyScalar(acceleration));

    // Limit speed
    if (velocity.length() > maxSpeed) {
        velocity.normalize().multiplyScalar(maxSpeed);
    }

    // Apply friction
    velocity.multiplyScalar(friction);

    // Update car position
    car.position.add(velocity);

    // Update camera to follow car
    camera.position.x = car.position.x;
    camera.position.z = car.position.z + 20;
    camera.lookAt(car.position);

    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
