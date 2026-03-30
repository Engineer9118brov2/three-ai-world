import * as THREE from 'three';

// --- Global Config & Scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- The Globe (Enhanced Detail) ---
const globeGeometry = new THREE.SphereGeometry(2, 64, 64);
const globeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0a0a0a, 
    wireframe: true,
    emissive: 0x002244,
    emissiveIntensity: 0.3
});
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// --- THE DATASET: GLOBAL AI IMPACT (2024-2026) ---
const dataCenters = [
    { name: "MSFT Fairwater (WI, USA)", lat: 42.70, lon: -87.85, date: "2024-05", power: 1000, water: 1200, co2: "High", grid: "Stable", color: 0xff3300 },
    { name: "Meta Hyperion (LA, USA)", lat: 32.40, lon: -91.70, date: "2024-09", power: 5000, water: 800, co2: "Extreme", grid: "Stressed", color: 0xff0000 },
    { name: "Google Council Bluffs (IA, USA)", lat: 41.26, lon: -95.85, date: "2024-01", power: 800, water: 1000, co2: "High", grid: "Stable", color: 0xffaa00 },
    { name: "AWS Dublin (Ireland)", lat: 53.35, lon: -6.26, date: "2024-06", power: 600, water: 500, co2: "Extreme", grid: "20% Capacity", color: 0xff1100 },
    { name: "MSFT Narvik (Norway)", lat: 68.43, lon: 17.42, date: "2025-03", power: 500, water: 0, co2: "Zero-Carbon", grid: "Hydro-Powered", color: 0x00ffaa },
    { name: "AWS Quilicura (Chile)", lat: -33.36, lon: -70.73, date: "2025-04", power: 400, water: 200, co2: "High (Grid)", grid: "Stressed", color: 0xff6600 },
    { name: "Nvidia NEOM (Saudi Arabia)", lat: 28.17, lon: 34.83, date: "2025-08", power: 2000, water: "Desalinated", co2: "Solar-Negative", grid: "Independent", color: 0x00ffcc },
    { name: "Google Selangor (Malaysia)", lat: 3.13, lon: 101.68, date: "2025-04", power: 600, water: 400, co2: "Medium", grid: "Developing", color: 0xff8800 },
    { name: "Nvidia Reliance (India)", lat: 18.97, lon: 72.82, date: "2025-11", power: 2000, water: 600, co2: "High", grid: "Coal-Heavy", color: 0xff3300 },
    { name: "xAI Colossus (TN, USA)", lat: 35.15, lon: -90.05, date: "2024-07", power: 150, water: 10, co2: "High", grid: "Local Conflict", color: 0xff4400 },
    { name: "MSFT Loughton (UK)", lat: 51.65, lon: 0.07, date: "2025-02", power: 400, water: 300, co2: "Medium", grid: "Stable", color: 0xff9900 },
    { name: "Meta Lebanon (IN, USA)", lat: 40.05, lon: -86.45, date: "2026-02", power: 1000, water: 800, co2: "High", grid: "Expanding", color: 0xff5500 },
    { name: "AWS Pennsylvania (PA, USA)", lat: 41.10, lon: -76.15, date: "2025-01", power: 2000, water: 0, co2: "Nuclear-Zero", grid: "Dedicated Nuclear", color: 0x00ffcc },
    { name: "Google Pine Island (MN, USA)", lat: 44.20, lon: -92.65, date: "2026-04", power: 500, water: 400, co2: "Medium", grid: "Stable", color: 0xffaa00 },
    { name: "Microsoft Mt. Pleasant (WI, USA)", lat: 42.71, lon: -87.89, date: "2025-05", power: 3000, water: 2000, co2: "Extreme", grid: "High Expansion", color: 0xff0000 }
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
    let totalWater = 0;
    
    dataCenters.forEach(dc => {
        if (dc.date <= currentDate) {
            totalPower += dc.power || 0;
            totalWater += typeof dc.water === 'number' ? dc.water : 0;
            
            const pos = latLonToVector3(dc.lat, dc.lon, 2.05);
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 16, 16),
                new THREE.MeshBasicMaterial({ color: dc.color })
            );
            marker.position.copy(pos);
            markers.add(marker);
            
            const spikeHeight = dc.power ? (dc.power / 5000) * 1.5 : 0.2;
            const spike = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01, 0.05, spikeHeight),
                new THREE.MeshBasicMaterial({ color: dc.color, transparent: true, opacity: 0.7 })
            );
            spike.position.copy(pos.clone().multiplyScalar(1 + spikeHeight/4));
            spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
            markers.add(spike);
        }
    });
    
    document.getElementById('total-power').innerText = `${totalPower} MW`;
    document.getElementById('total-water').innerText = `${totalWater} M Gal/yr`;
}

// --- Interaction & UI ---
window.updateTimeline = (val) => {
    const dates = [...new Set(dataCenters.map(d => d.date))].sort();
    const date = dates[val] || dates[dates.length - 1];
    document.getElementById('date-label').innerText = date;
    
    const currentDC = dataCenters.find(d => d.date === date);
    if (currentDC) {
        document.getElementById('info-panel').innerHTML = `
            <h3>${currentDC.name}</h3>
            <p>⚡ Power: ${currentDC.power} MW</p>
            <p>💧 Water: ${currentDC.water} M Gal/yr</p>
            <p>🏢 Grid: ${currentDC.grid}</p>
            <p>🌍 Impact: <span style="color:red">${currentDC.co2}</span></p>
        `;
    }
    updateMarkers(date);
};

// --- Camera & Lights ---
scene.add(new THREE.AmbientLight(0x444444));
const light = new THREE.PointLight(0xffffff, 2, 100);
light.position.set(10, 10, 10);
scene.add(light);
camera.position.z = 6;

function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.001;
    markers.rotation.y += 0.001;
    renderer.render(scene, camera);
}
animate();
updateTimeline(0);
