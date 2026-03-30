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
    emissiveIntensity: 0.1
});
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// --- REAL DATA CENTERS (2024-2026) ---
const dataCenters = [
    { name: "MSFT Fairwater (WI)", lat: 42.70, lon: -87.85, date: "2024-05", info: "Microsoft's 315-acre Blackwell cluster." },
    { name: "Meta Hyperion (LA)", lat: 32.40, lon: -91.70, date: "2024-09", info: "Meta's $10B campus for Llama 4." },
    { name: "Google Texas (TX)", lat: 35.20, lon: -101.80, date: "2024-12", info: "$40B TPU-focused AI supercomputer." },
    { name: "MSFT Narvik (Norway)", lat: 68.40, lon: 17.40, date: "2025-03", info: "Hyperscale AI in the Arctic." },
    { name: "AWS Mississippi (MS)", lat: 32.30, lon: -90.20, date: "2025-06", info: "$10B AWS Generative AI hub." },
    { name: "xAI Colossus (TN)", lat: 35.15, lon: -90.05, date: "2025-08", info: "Elon Musk's 100k H100 GPU cluster." },
    { name: "Nvidia Reliance (India)", lat: 19.07, lon: 72.87, date: "2025-11", info: "2,000 MW Sovereign AI project." },
    { name: "Meta Indiana (IN)", lat: 40.05, lon: -86.45, date: "2026-02", info: "$10B Prometheus GPU cluster." }
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
            // Glowing Marker
            const markerGeom = new THREE.SphereGeometry(0.06, 16, 16);
            const markerMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
            const marker = new THREE.Mesh(markerGeom, markerMat);
            marker.position.copy(pos);
            markers.add(marker);
            
            // Spike to show scale (Visual Hype)
            const spikeGeom = new THREE.CylinderGeometry(0.01, 0.04, 0.5);
            const spikeMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.5 });
            const spike = new THREE.Mesh(spikeGeom, spikeMat);
            spike.position.copy(pos.clone().multiplyScalar(1.1));
            spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
            markers.add(spike);
        }
    });
}

// --- Lights & Interactivity ---
scene.add(new THREE.AmbientLight(0x444444));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 3, 5);
scene.add(light);
camera.position.z = 6;

function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.001;
    markers.rotation.y += 0.001;
    renderer.render(scene, camera);
}
animate();

window.updateTimeline = (val) => {
    const dates = dataCenters.map(d => d.date).sort();
    const date = dates[val] || dates[dates.length - 1];
    document.getElementById('date-label').innerText = date;
    updateMarkers(date);
};

updateMarkers(dataCenters[0].date);
