import * as THREE from 'three';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const globe = new THREE.Mesh(
    new THREE.SphereGeometry(2, 64, 64),
    new THREE.MeshStandardMaterial({ 
        color: 0x000000, 
        wireframe: true, 
        emissive: 0xffffff, 
        emissiveIntensity: 0.1 
    })
);
globeGroup.add(globe);

// --- GLOBAL AI DATASET (MARKET CAP INTEGRATION) ---
const groundCenters = [
    { name: "MSFT Fairwater (WI)", lat: 42.70, lon: -87.85, date: "2024-05", power: 1000, hardware: "Nvidia B200", models: "GPT-5", company: "MSFT", cap: "$3.1T" },
    { name: "Meta Hyperion (LA)", lat: 32.40, lon: -91.70, date: "2024-09", power: 2000, hardware: "350k H100s", models: "Llama-4", company: "META", cap: "$1.2T" },
    { name: "xAI Colossus (TN)", lat: 35.15, lon: -90.05, date: "2024-07", power: 150, hardware: "100k H100s", models: "Grok-3", company: "xAI", cap: "Private" },
    { name: "Google Quilicura (Chile)", lat: -33.36, lon: -70.73, date: "2025-01", power: 400, hardware: "TPU v5p", models: "Gemini Pro", company: "GOOGL", cap: "$2.1T" },
    { name: "AWS São Paulo (Brazil)", lat: -23.55, lon: -46.63, date: "2025-03", power: 800, hardware: "Trainium 2", models: "Claude 3.5", company: "AMZN", cap: "$1.9T" },
    { name: "MSFT Narvik (Norway)", lat: 68.43, lon: 17.42, date: "2025-03", power: 500, hardware: "Blackwell", models: "Green LLM", company: "MSFT", cap: "$3.1T" },
    { name: "AWS Dublin (Ireland)", lat: 53.35, lon: -6.26, date: "2024-06", power: 600, hardware: "H100 Clusters", models: "European AI", company: "AMZN", cap: "$1.9T" },
    { name: "Vantage JHB (South Africa)", lat: -26.20, lon: 28.04, date: "2025-04", power: 80, hardware: "Nvidia MGX", models: "African AI", company: "Vantage", cap: "Private" },
    { name: "Nvidia Reliance (Mumbai)", lat: 19.07, lon: 72.87, date: "2025-11", power: 2000, hardware: "Blackwell GB200", models: "Bharat LLM", company: "NVDA", cap: "$3.2T" },
    { name: "MSFT Sydney (Australia)", lat: -33.86, lon: 151.20, date: "2024-11", power: 500, hardware: "Azure AI-1", models: "Gemini-Sydney", company: "MSFT", cap: "$3.1T" },
    { name: "Starcloud Orbital", lat: 0, lon: 0, date: "2025-12", power: 50, isSpace: true, distance: 10, hardware: "Space-H100", company: "Lumen", cap: "Seed" },
    { name: "Lonestar Lunar", lat: 0, lon: 0, date: "2026-06", power: 100, isSpace: true, distance: 30, hardware: "Lunar RISC-V", company: "Lonestar", cap: "Series A" }
];

const markers = new THREE.Group();
const heatLayer = new THREE.Group();
globeGroup.add(markers);
globeGroup.add(heatLayer);

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

let currentFilter = "";
let currentDateIndex = 0;

function updateMarkers() {
    markers.clear();
    heatLayer.clear();
    const dates = [...new Set(groundCenters.map(d => d.date))].sort();
    const date = dates[currentDateIndex] || dates[dates.length - 1];
    
    // Save state to URL
    const url = new URL(window.location);
    url.searchParams.set('date', currentDateIndex);
    if (currentFilter) url.searchParams.set('q', currentFilter);
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);

    let totalPower = 0;
    groundCenters.forEach(dc => {
        const matchesFilter = !currentFilter || 
            dc.name.toLowerCase().includes(currentFilter.toLowerCase()) || 
            dc.hardware.toLowerCase().includes(currentFilter.toLowerCase()) ||
            dc.company.toLowerCase().includes(currentFilter.toLowerCase());

        if (dc.date <= date && matchesFilter) {
            totalPower += dc.power || 0;
            let pos;
            if (dc.isSpace) {
                pos = new THREE.Vector3(dc.distance, Math.sin(dc.distance) * 5, Math.cos(dc.distance) * 5);
            } else {
                pos = latLonToVector3(dc.lat, dc.lon, 2.05);
                const heatPoint = new THREE.PointLight(0xffffff, dc.power / 500, 1.5);
                heatPoint.position.copy(pos);
                heatLayer.add(heatPoint);
            }
            
            const marker = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            marker.position.copy(pos);
            markers.add(marker);
            
            if (!dc.isSpace) {
                const spikeHeight = (dc.power / 2000) * 1.5;
                const spike = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.02, spikeHeight), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
                spike.position.copy(pos.clone().multiplyScalar(1 + spikeHeight/4));
                spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
                markers.add(spike);
            }
        }
    });
    
    document.getElementById('total-power').innerText = `${totalPower} MW`;
    const gpuEstimate = Math.round((totalPower * 1000000) / 700);
    document.getElementById('gpu-count').innerText = gpuEstimate.toLocaleString();
}

// --- Interaction ---
window.updateTimeline = (val) => {
    currentDateIndex = parseInt(val);
    const dates = [...new Set(groundCenters.map(d => d.date))].sort();
    document.getElementById('date-label').innerText = dates[currentDateIndex];
    
    const currentDC = groundCenters.find(d => d.date === dates[currentDateIndex]);
    if (currentDC) {
        document.getElementById('info-panel').innerHTML = `
            <div style="border-bottom: 1px solid #fff; padding-bottom: 5px; margin-bottom: 10px;">[${currentDC.name}]</div>
            COMPANY: ${currentDC.company}<br>
            MARKET CAP: ${currentDC.cap}<br>
            POWER: ${currentDC.power} MW<br>
            HARDWARE: ${currentDC.hardware}<br>
            <br>
            <button onclick="alert('Contacting Sales...')">DOWNLOAD INVESTOR REPORT</button>
        `;
    }
    updateMarkers();
};

window.handleSearch = (val) => {
    currentFilter = val;
    updateMarkers();
};

let mouseX = 0, mouseY = 0;
let isRotating = false;

window.addEventListener('mousedown', () => isRotating = true);
window.addEventListener('mouseup', () => isRotating = false);
window.addEventListener('mousemove', (e) => {
    if (isRotating) {
        globeGroup.rotation.y += e.movementX * 0.005;
        globeGroup.rotation.x += e.movementY * 0.005;
    }
});

scene.add(new THREE.AmbientLight(0x444444));
camera.position.z = 6;

window.addEventListener('wheel', (e) => {
    camera.position.z = Math.max(3, Math.min(camera.position.z + e.deltaY * 0.01, 100));
    
    const spaceOpacity = Math.max(0, Math.min((camera.position.z - 15) / 15, 1));
    document.getElementById('space-alert').style.opacity = spaceOpacity;
    
    globe.material.opacity = 1 - spaceOpacity;
    globe.material.transparent = true;
});

function animate() {
    requestAnimationFrame(animate);
    if (!isRotating) {
        globeGroup.rotation.y += 0.001;
    }
    starMaterial.size = 0.02 + Math.sin(Date.now() * 0.001) * 0.005;
    renderer.render(scene, camera);
}
const starMaterial = scene.children.find(c => c instanceof THREE.Points).material;

animate();

// Load state from URL
const params = new URLSearchParams(window.location.search);
if (params.has('date')) {
    const d = parseInt(params.get('date'));
    document.querySelector('input[type=range]').value = d;
    updateTimeline(d);
} else {
    updateTimeline(0);
}
