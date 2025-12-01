import * as THREE from 'three';

// -----------------------------
// Scene, camera, renderer
// -----------------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.querySelector('#app').appendChild(renderer.domElement);

// -----------------------------
// Helpers
// -----------------------------
function boxFromCenterAndSize(center, size) {
    const half = size.clone().multiplyScalar(0.5);
    return new THREE.Box3().set(
        new THREE.Vector3(center.x - half.x, center.y - half.y, center.z - half.z),
        new THREE.Vector3(center.x + half.x, center.y + half.y, center.z + half.z)
    );
}

function computeAABB(obj) {
    return new THREE.Box3().setFromObject(obj);
}

function getMTV(a, b) {
    const overlapX = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
    const overlapY = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
    const overlapZ = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);
    if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) return null;

    let minOverlap = overlapX, axis = 'x';
    if (overlapY < minOverlap) { minOverlap = overlapY; axis = 'y'; }
    if (overlapZ < minOverlap) { minOverlap = overlapZ; axis = 'z'; }

    const mtv = new THREE.Vector3(0, 0, 0);
    const centerA = a.getCenter(new THREE.Vector3());
    const centerB = b.getCenter(new THREE.Vector3());

    if (axis === 'x') mtv.x = (centerA.x < centerB.x) ? -minOverlap : minOverlap;
    else if (axis === 'y') mtv.y = (centerA.y < centerB.y) ? -minOverlap : minOverlap;
    else mtv.z = (centerA.z < centerB.z) ? -minOverlap : minOverlap;

    return mtv;
}

function projectVectorOnPlane(vec, planeNormal) {
    const n = planeNormal.clone().normalize();
    const comp = n.multiplyScalar(vec.dot(n));
    return vec.clone().sub(comp);
}

// -----------------------------
// Ground
// -----------------------------
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// -----------------------------
// Obstacles container
// -----------------------------
const obstacles = [];

// -----------------------------
// Walls
// -----------------------------
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
const wallHeight = 5;
const wallThickness = 1;

function createWall(width, height, depth, x, y, z, rotation = { x: 0, y: 0, z: 0 }) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMaterial);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    scene.add(mesh);
    obstacles.push(mesh);
    return mesh;
}

createWall(100, wallHeight, wallThickness, 0, wallHeight / 2, -50);
createWall(100, wallHeight, wallThickness, 0, wallHeight / 2, 50);
createWall(wallThickness, wallHeight, 100, 50, wallHeight / 2, 0);
createWall(wallThickness, wallHeight, 100, -50, wallHeight / 2, 0);

// -----------------------------
// Ramps
// -----------------------------
const rampMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });

function createRamp(x, z, inclineRadians) {
    const rampLength = 10;
    const rampWidth = 5;
    const rampHeight = 2;

    const rampGeometry = new THREE.BoxGeometry(rampWidth, rampHeight, rampLength);
    const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(x, rampHeight / 2, z);
    ramp.rotation.x = inclineRadians;
    scene.add(ramp);
    return { mesh: ramp, length: rampLength, width: rampWidth, height: rampHeight };
}

function createRampWall(rampObj, offsetX, offsetZ) {
    const wallThicknessLocal = 0.3;
    const wallHeightLocal = 2.5;
    const wallLengthLocal = rampObj.length;

    const wallGeo = new THREE.BoxGeometry(wallThicknessLocal, wallHeightLocal, wallLengthLocal);
    const wall = new THREE.Mesh(wallGeo, wallMaterial);
    rampObj.mesh.add(wall);
    wall.position.set(offsetX, wallHeightLocal / 2, offsetZ);
    wall.rotation.set(0, 0, 0);
    obstacles.push(wall);
    return wall;
}

const ramp1 = createRamp(20, 20, -Math.PI / 6);
createRampWall(ramp1, -ramp1.width / 2 - 0.3, -ramp1.length / 2 + 0.1);
createRampWall(ramp1, ramp1.width / 2 + 0.3, -ramp1.length / 2 + 0.1);

const ramp2 = createRamp(-20, -20, Math.PI / 6);
createRampWall(ramp2, -ramp2.width / 2 - 0.3, -ramp2.length / 2 + 0.1);
createRampWall(ramp2, ramp2.width / 2 + 0.3, -ramp2.length / 2 + 0.1);

// -----------------------------
// Cones
// -----------------------------
const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
const coneGeometry = new THREE.ConeGeometry(0.5, 2, 8);
function addCone(x, z) {
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(x, 1, z);
    scene.add(cone);
    obstacles.push(cone);
}
addCone(10, 10);
addCone(-10, -10);
addCone(0, 30);

// -----------------------------
// Path
// -----------------------------
const pathMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
const pathPoints = [
    new THREE.Vector3(-40, 0.1, 0),
    new THREE.Vector3(-20, 0.1, 20),
    new THREE.Vector3(0, 0.1, 40),
    new THREE.Vector3(20, 0.1, 20),
    new THREE.Vector3(40, 0.1, 0),
    new THREE.Vector3(20, 0.1, -20),
    new THREE.Vector3(0, 0.1, -40),
    new THREE.Vector3(-20, 0.1, -20),
    new THREE.Vector3(-40, 0.1, 0)
];
const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
scene.add(new THREE.Line(pathGeometry, pathMaterial));

// -----------------------------
// Car
// -----------------------------
const carWidth = 2;
const carHeight = 1;
const carLength = 4;
const carGeometry = new THREE.BoxGeometry(carWidth, carHeight, carLength);
const carMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const car = new THREE.Mesh(carGeometry, carMaterial);
car.position.set(0, carHeight / 2, 5);
scene.add(car);

camera.position.set(0, 10, 20);
camera.lookAt(car.position);

// -----------------------------
// Physics state
// -----------------------------
let velocity = new THREE.Vector3(0, 0, 0);
let throttle = 0;
let steering = 0;

const maxSpeed = 1.2;
const accelerationRate = 0.02;
const brakingRate = 0.04;
const reverseRate = 0.01;
const frictionGround = 0.96;
const airDrag = 0.995;
const gravity = -0.015;
const restitution = 0.3;
const jumpForce = 0.35;
const deltaTime = 1/60;

// -----------------------------
// Input
// -----------------------------
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

// -----------------------------
// Ramp helpers
// -----------------------------
function getRampPlane(rampMesh) {
    const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(rampMesh.getWorldQuaternion(new THREE.Quaternion()));
    const p = rampMesh.getWorldPosition(new THREE.Vector3());
    return { normal, point: p };
}
function planeHeightAtXZ(plane, x, z) {
    const nx = plane.normal.x, ny = plane.normal.y, nz = plane.normal.z;
    const px = plane.point.x, py = plane.point.y, pz = plane.point.z;
    if (Math.abs(ny) < 1e-6) return null;
    return py - (nx*(x-px) + nz*(z-pz))/ny;
}

// -----------------------------
// Core physics + movement
// -----------------------------
function resolveCollisionsAndMove(dt) {
    const forwardLocal = new THREE.Vector3(0, 0, -1).applyQuaternion(car.quaternion);

    let forwardAccel = 0;
    if (keys['ArrowUp'] || keys['KeyW']) forwardAccel += accelerationRate;
    if (keys['ArrowDown'] || keys['KeyS']) forwardAccel -= brakingRate;

    let turn = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) turn += 0.035;
    if (keys['ArrowRight'] || keys['KeyD']) turn -= 0.035;

    const speedForward = velocity.dot(forwardLocal);
    if (Math.abs(speedForward) > 0.02) {
        const yaw = turn * Math.sign(speedForward) * Math.min(1, Math.abs(speedForward)/maxSpeed);
        car.rotation.y += yaw;
    }

    const forward = new THREE.Vector3(0,0,-1).applyQuaternion(car.quaternion);
    velocity.add(forward.multiplyScalar(forwardAccel));

    velocity.multiplyScalar(airDrag);
    if (velocity.length() > maxSpeed) velocity.setLength(maxSpeed);

    // Jump
    if ((keys['Space'] || keys['Spacebar']) && car.position.y <= carHeight/2 + 0.01) {
        velocity.y += jumpForce;
    }

    const nextPos = car.position.clone().add(velocity.clone().multiplyScalar(dt/deltaTime));
    const carAABB = boxFromCenterAndSize(nextPos.clone(), new THREE.Vector3(carWidth, carHeight, carLength));

    let combinedMTV = new THREE.Vector3();
    for (const obj of obstacles) {
        const objBox = computeAABB(obj);
        if (carAABB.intersectsBox(objBox)) {
            const mtv = getMTV(carAABB, objBox);
            if (mtv && mtv.length() > combinedMTV.length()) combinedMTV.copy(mtv);
        }
    }

    if (combinedMTV.lengthSq() > 0) {
        car.position.add(combinedMTV);
        const absMtv = new THREE.Vector3(Math.abs(combinedMTV.x), Math.abs(combinedMTV.y), Math.abs(combinedMTV.z));
        let collisionAxis = new THREE.Vector3();
        if (absMtv.x >= absMtv.y && absMtv.x >= absMtv.z) collisionAxis.set(1,0,0);
        else if (absMtv.y >= absMtv.x && absMtv.y >= absMtv.z) collisionAxis.set(0,1,0);
        else collisionAxis.set(0,0,1);

        const speedAlongAxis = velocity.dot(collisionAxis);
        if (speedAlongAxis > 0) velocity.add(collisionAxis.clone().multiplyScalar(-(1+restitution)*speedAlongAxis));

        const mtvDir = combinedMTV.clone().normalize();
        velocity = projectVectorOnPlane(velocity, mtvDir);
    } else {
        car.position.copy(nextPos);
    }

    // Gravity & ramps
    let onAnyRamp = false;
    const ramps = [ramp1.mesh, ramp2.mesh];
    for (const r of ramps) {
        const rampBox = computeAABB(r);
        rampBox.min.x -= 0.5; rampBox.max.x += 0.5;
        rampBox.min.z -= 0.5; rampBox.max.z += 0.5;

        const carFootAABB = boxFromCenterAndSize(new THREE.Vector3(car.position.x,0,car.position.z), new THREE.Vector3(carWidth,0.1,carLength));
        if (carFootAABB.intersectsBox(rampBox)) {
            const plane = getRampPlane(r);
            const targetY = planeHeightAtXZ(plane, car.position.x, car.position.z);
            if (targetY !== null) {
                const desiredY = targetY + carHeight/2;
                if (car.position.y < desiredY-0.001) { car.position.y = desiredY; velocity.y = 0; }
                else car.position.y = THREE.MathUtils.lerp(car.position.y, desiredY, 0.3);
                velocity.y = 0;
                onAnyRamp = true;
                break;
            }
        }
    }

    if (!onAnyRamp) {
        velocity.y += gravity*(dt/deltaTime);
        car.position.y += velocity.y*(dt/deltaTime);
        if (car.position.y < carHeight/2) { car.position.y = carHeight/2; velocity.y = 0; }
    }
}

// -----------------------------
// Free-follow camera
// -----------------------------
function updateCamera() {
    const desiredPos = car.position.clone().add(new THREE.Vector3(0,10,20));
    camera.position.lerp(desiredPos, 0.05);
    camera.lookAt(car.position);
}

// -----------------------------
// Main loop
// -----------------------------
let lastTime = performance.now();
function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dtMs = now - lastTime;
    lastTime = now;
    const dt = Math.min(50, dtMs)/1000;

    resolveCollisionsAndMove(dt);
    updateCamera();

    renderer.render(scene, camera);
}
animate();

// -----------------------------
// Resize
// -----------------------------
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});