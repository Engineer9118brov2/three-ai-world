import * as THREE from 'three';

// --- Scene & Camera ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- The Globe (Enhanced) ---
const globeGeometry = new THREE.SphereGeometry(2, 64, 64);
const globeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0a0a0a, 
    wireframe: true,
    emissive: 0x002244,
    emissiveIntensity: 0.5
});
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// --- REAL DATA: AI INFRASTRUCTURE & IMPACT ---
const dataCenters = [
    { name: "MSFT Fairwater (WI)", lat: 42.70, lon: -87.85, date: "2024-05", power: "1000MW", water: "1.2B Gal/yr", co2: "High", color: 0xff3300 },
    { name: "Meta Hyperion (LA)", lat: 32.40, lon: -91.70, date: "2024-09", power: "5000MW", water: "800M Gal/yr", co2: "Extreme", color: 0xff0000 },
    { name: "Google Council Bluffs (IA)", lat: 41.26, lon: -95.85, date: "2024-01", power: "800MW", water: "1.0B Gal/yr", co2: "Medium", color: 0xffaa00 },
    { name: "AWS Salem (PA)", lat: 41.10, lon: -76.15, date: "2025-01", power: "2000MW", water: "Nuclear Cooling", co2: "Low (Nuclear)", color: 0x00ffcc },
    { name: "xAI Colossus (TN)", lat: 35.15, lon: -90.05, date: "2024-07", power: "150MW", water: "Local Grid Stress", co2: "High", color: 0xff4400 },
    { name: "Google Selengor (MY)", lat: 3.13, lon: 101.68, date: "2025-04", power: "600MW", water: "High Humidity", co2: "Medium", color: 0xff8800 },
    { name: "Nvidia Reliance (IN)", lat: 18.97, lon: 72.82, date: "2025-11", power: "2000MW", water: "Coastal Cooling", co2: "High", color: 0xff3300 },
    { name: "MSFT Narvik (NO)", lat: 68.43, lon: 17.42, date: "2025-03", power: "500MW", water: "Natural Cooling", co2: "Zero-Carbon", color: 0x00ffaa },
    { name: "Meta Beaver Dam (WI)", lat: 43.45, lon: -88.83, date: "2025-11", power: "1000MW", water: "Aquifer Usage", co2: "High", color: 0xff5500 },
    { name: "AWS Mississippi (MS)", lat: 32.32, lon: -90.18, date: "2025-06", power: "2000MW", water: "High Heat Stress", co2: "Extreme", color: 0xff1100 }
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
            
            // Core Marker
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 16, 16),
                new THREE.MeshBasicMaterial({ color: dc.color })
            );
            marker.position.copy(pos);
            markers.add(marker);
            
            // Impact Spike (Height proportional to power/impact)
            const spikeHeight = dc.co2 === "Extreme" ? 1.0 : 0.4;
            const spike = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01, 0.05, spikeHeight),
                new THREE.MeshBasicMaterial({ color: dc.color, transparent: true, opacity: 0.6 })
            );
            spike.position.copy(pos.clone().multiplyScalar(1 + spikeHeight/4));
            spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
            markers.add(spike);
        }
    });
}

// --- Lights ---
scene.add(new THREE.AmbientLight(0x444444));
const light = new THREE.PointLight(0xffffff, 2, 100);
light.position.set(10, 10, 10);
scene.add(light);
camera.position.z = 6;

// --- Interaction ---
window.updateTimeline = (val) => {
    const dates = [...new Set(dataCenters.map(d => d.date))].sort();
    const date = dates[val] || dates[dates.length - 1];
    document.getElementById('date-label').innerText = date;
    
    // Find active DC to show info
    const currentDC = dataCenters.find(d => d.date === date);
    if (currentDC) {
        document.getElementById('info-panel').innerHTML = `
            <h3>${currentDC.name}</h3>
            <p>⚡ Power: ${currentDC.power}</p>
            <p>💧 Water: ${currentDC.water}</p>
            <p>🌍 Impact: ${currentDC.co2}</p>
        `;
    }
    updateMarkers(date);
};

function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.001;
    markers.rotation.y += 0.001;
    renderer.render(scene, camera);
}
animate();
updateTimeline(0);
