import * as THREE from 'three';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- The Globe ---
const globeGeometry = new THREE.SphereGeometry(2, 64, 64);
const globeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x111111, 
    wireframe: true,
    emissive: 0x1133ff,
    emissiveIntensity: 0.2
});
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// --- Data Center Markers ---
// Mock data for "New Data Centers"
const dataCenters = [
    { name: "Ashburn-1", lat: 39.04, lon: -77.48, date: "2024-01" },
    { name: "Dublin-A", lat: 53.34, lon: -6.26, date: "2024-03" },
    { name: "Singapore-Cloud", lat: 1.35, lon: 103.81, date: "2024-06" },
    { name: "Tokyo-AI", lat: 35.67, lon: 139.65, date: "2024-09" },
    { name: "Dallas-GPU", lat: 32.77, lon: -96.79, date: "2025-01" },
    { name: "Berlin-Deep", lat: 52.52, lon: 13.40, date: "2025-04" }
];

const markers = new THREE.Group();
scene.add(markers);

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

function updateMarkers(currentDate) {
    markers.clear();
    dataCenters.forEach(dc => {
        if (dc.date <= currentDate) {
            const pos = latLonToVector3(dc.lat, dc.lon, 2.05);
            const markerGeom = new THREE.SphereGeometry(0.05, 16, 16);
            const markerMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const marker = new THREE.Mesh(markerGeom, markerMat);
            marker.position.copy(pos);
            markers.add(marker);
        }
    });
}

// --- Lights & Camera ---
const light = new THREE.PointLight(0xffffff, 2, 100);
light.position.set(10, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x444444));
camera.position.z = 5;

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.002;
    markers.rotation.y += 0.002;
    renderer.render(scene, camera);
}
animate();

// --- Timeline UI Logic ---
window.updateTimeline = (val) => {
    const dateMap = ["2024-01", "2024-03", "2024-06", "2024-09", "2025-01", "2025-04"];
    const date = dateMap[val];
    document.getElementById('date-label').innerText = date;
    updateMarkers(date);
};

updateMarkers("2024-01");
