import * as THREE from 'three';

// --- Scene & Camera ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010103);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- The Globe (Earth) ---
const globe = new THREE.Mesh(
    new THREE.SphereGeometry(2, 64, 64),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, wireframe: true, emissive: 0x002244, emissiveIntensity: 0.5 })
);
scene.add(globe);

// --- Space Elements ---
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
const starVertices = [];
for (let i = 0; i < 5000; i++) {
    starVertices.push((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// --- THE ULTIMATE DATASET ---
const groundCenters = [
    { name: "MSFT Fairwater (WI)", lat: 42.70, lon: -87.85, date: "2024-05", power: 1000, water: 1200, hardware: "Nvidia B200 (Blackwell)", models: "GPT-5, o1", color: 0xff3300 },
    { name: "Meta Hyperion (LA)", lat: 32.40, lon: -91.70, date: "2024-09", power: 2000, water: 2200, hardware: "350k H100s", models: "Llama-4", color: 0xff0000 },
    { name: "Google Council Bluffs (IA)", lat: 41.26, lon: -95.85, date: "2024-01", power: 1000, water: 1400, hardware: "TPU v5p / v6e", models: "Gemini 2.0", color: 0xffaa00 },
    { name: "AWS Salem (PA)", lat: 41.10, lon: -76.15, date: "2025-01", power: 2000, water: 0, hardware: "Trainium 2", models: "Claude 3.5", color: 0x00ffcc },
    { name: "xAI Colossus (TN)", lat: 35.15, lon: -90.05, date: "2024-07", power: 150, water: 5, hardware: "100k H100s", models: "Grok-3", color: 0xff4400 },
    { name: "Nvidia Reliance (IN)", lat: 18.97, lon: 72.82, date: "2025-11", power: 2000, water: 600, hardware: "Nvidia MGX", models: "Sovereign AI", color: 0xff3300 },
    { name: "Starcloud Orbital", lat: 0, lon: 0, date: "2025-12", power: 50, water: 0, hardware: "Space-Hardened H100", models: "Orbital LLM", color: 0xffffff, isSpace: true, distance: 10 },
    { name: "Lonestar Lunar", lat: 0, lon: 0, date: "2026-06", power: 100, water: 0, hardware: "RISC-V AI", models: "Lunar DRaaS", color: 0xaaaaaa, isSpace: true, distance: 30 }
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
    let totalPower = 0;
    groundCenters.forEach(dc => {
        if (dc.date <= currentDate) {
            totalPower += dc.power;
            let pos;
            if (dc.isSpace) {
                pos = new THREE.Vector3(dc.distance, Math.sin(dc.distance) * 5, Math.cos(dc.distance) * 5);
            } else {
                pos = latLonToVector3(dc.lat, dc.lon, 2.05);
            }
            
            const marker = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), new THREE.MeshBasicMaterial({ color: dc.color }));
            marker.position.copy(pos);
            markers.add(marker);
            
            if (!dc.isSpace) {
                const spikeHeight = (dc.power / 2000) * 1.5;
                const spike = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.05, spikeHeight), new THREE.MeshBasicMaterial({ color: dc.color, transparent: true, opacity: 0.6 }));
                spike.position.copy(pos.clone().multiplyScalar(1 + spikeHeight/4));
                spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
                markers.add(spike);
            }
        }
    });
    document.getElementById('total-power').innerText = `${totalPower} MW`;
}

// --- Interaction ---
window.updateTimeline = (val) => {
    const dates = [...new Set(groundCenters.map(d => d.date))].sort();
    const date = dates[val] || dates[dates.length - 1];
    document.getElementById('date-label').innerText = date;
    const currentDC = groundCenters.find(d => d.date === date);
    if (currentDC) {
        document.getElementById('info-panel').innerHTML = `
            <h3>${currentDC.name}</h3>
            <p>⚡ Power: ${currentDC.power} MW</p>
            <p>💧 Water: ${currentDC.water} M Gal/yr</p>
            <p>🧠 Hardware: ${currentDC.hardware}</p>
            <p>🔮 AI Model: ${currentDC.models}</p>
        `;
    }
    updateMarkers(date);
};

// --- Camera Logic ---
scene.add(new THREE.AmbientLight(0x444444));
const light = new THREE.PointLight(0xffffff, 2, 1000);
light.position.set(50, 50, 50);
scene.add(light);
camera.position.z = 6;

window.addEventListener('wheel', (e) => {
    camera.position.z += e.deltaY * 0.01;
    camera.position.z = Math.max(3, Math.min(camera.position.z, 100));
    
    if (camera.position.z > 15) {
        document.getElementById('space-alert').style.opacity = 1;
    } else {
        document.getElementById('space-alert').style.opacity = 0;
    }
});

function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.001;
    markers.rotation.y += 0.001;
    renderer.render(scene, camera);
}
animate();
updateTimeline(0);
