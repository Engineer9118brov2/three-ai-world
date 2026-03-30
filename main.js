import * as THREE from 'three';

// --- Scene Setup (Conductor Aesthetic) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const globeGroup = new THREE.Group();
scene.add(globeGroup);

// --- The Globe (Minimalist Wireframe) ---
const globe = new THREE.Mesh(
    new THREE.SphereGeometry(2, 64, 64),
    new THREE.MeshStandardMaterial({ 
        color: 0x000000, 
        wireframe: true, 
        emissive: 0xffffff, 
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 1
    })
);
globeGroup.add(globe);

// --- GLOBAL AI DATASET ---
const groundCenters = [
    { name: "MSFT Fairwater (WI)", lat: 42.70, lon: -87.85, date: "2024-05", power: 1000, hardware: "Nvidia B200", company: "MSFT", price: "$415" },
    { name: "Meta Hyperion (LA)", lat: 32.40, lon: -91.70, date: "2024-09", power: 2000, hardware: "350k H100s", company: "META", price: "$512" },
    { name: "xAI Colossus (TN)", lat: 35.15, lon: -90.05, date: "2024-07", power: 150, hardware: "100k H100s", company: "xAI", price: "N/A" },
    { name: "Google Quilicura (Chile)", lat: -33.36, lon: -70.73, date: "2025-01", power: 400, hardware: "TPU v5p", company: "GOOGL", price: "$168" },
    { name: "AWS São Paulo (Brazil)", lat: -23.55, lon: -46.63, date: "2025-03", power: 800, hardware: "Trainium 2", company: "AMZN", price: "$175" },
    { name: "MSFT Narvik (Norway)", lat: 68.43, lon: 17.42, date: "2025-03", power: 500, hardware: "Blackwell", company: "MSFT", price: "$440" },
    { name: "AWS Dublin (Ireland)", lat: 53.35, lon: -6.26, date: "2024-06", power: 600, hardware: "H100 Clusters", company: "AMZN", price: "$185" },
    { name: "Vantage JHB (South Africa)", lat: -26.20, lon: 28.04, date: "2025-04", power: 80, hardware: "Nvidia MGX", company: "Vantage", price: "N/A" },
    { name: "Nvidia Reliance (Mumbai)", lat: 19.07, lon: 72.87, date: "2025-11", power: 2000, hardware: "Blackwell GB200", company: "NVDA", price: "$145" },
    { name: "MSFT Sydney (Australia)", lat: -33.86, lon: 151.20, date: "2024-11", power: 500, hardware: "Azure AI-1", company: "MSFT", price: "$425" },
    { name: "Starcloud Orbital", lat: 0, lon: 0, date: "2025-12", power: 50, isSpace: true, distance: 10, hardware: "Space-H100", company: "Lumen", price: "N/A" },
    { name: "Lonestar Lunar", lat: 0, lon: 0, date: "2026-06", power: 100, isSpace: true, distance: 30, hardware: "Lunar RISC-V", company: "Lonestar", price: "N/A" }
];

const nvidiaHQ = { lat: 37.35, lon: -121.95 }; // Santa Clara, CA

const markers = new THREE.Group();
const arcs = new THREE.Group();
globeGroup.add(markers);
globeGroup.add(arcs);

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

function createArc(start, end) {
    const startVec = latLonToVector3(start.lat, start.lon, 2.05);
    const endVec = latLonToVector3(end.lat, end.lon, 2.05);
    const midVec = startVec.clone().lerp(endVec, 0.5).normalize().multiplyScalar(3);
    const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
    return new THREE.Line(geometry, material);
}

let currentDateIndex = 0;
let currentFilter = "";

function updateMarkers() {
    markers.clear();
    arcs.clear();
    const dates = [...new Set(groundCenters.map(d => d.date))].sort();
    const date = dates[currentDateIndex] || dates[dates.length - 1];
    
    // Update URL State
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
                if (dc.company !== "NVDA" && dc.company !== "Vantage") {
                    arcs.add(createArc({ lat: dc.lat, lon: dc.lon }, nvidiaHQ));
                }
            }
            const marker = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            marker.position.copy(pos);
            markers.add(marker);
        }
    });
    
    document.getElementById('total-power').innerText = `${totalPower} MW`;
    document.getElementById('gpu-count').innerText = Math.round((totalPower * 1000000) / 700).toLocaleString();
    
    const activeDC = groundCenters.find(d => d.date === date);
    if (activeDC) {
        document.getElementById('info-panel').innerHTML = `
            <div style="border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 12px; font-weight: 600;">[${activeDC.name}]</div>
            COMPANY: ${activeDC.company}<br>
            STOCK: <span style="color: #00ff00;">${activeDC.price}</span><br>
            LOAD: ${activeDC.power} MW<br>
            HW: ${activeDC.hardware}<br>
            <br>
            <div style="font-size: 9px; opacity: 0.4;">DEPENDENCY: NVIDIA_CORP</div>
        `;
    }
}

window.updateTimeline = (val) => {
    currentDateIndex = parseInt(val);
    const dates = [...new Set(groundCenters.map(d => d.date))].sort();
    document.getElementById('date-label').innerText = dates[currentDateIndex];
    updateMarkers();
};

window.handleSearch = (val) => {
    currentFilter = val;
    updateMarkers();
};

// --- Camera & Interaction ---
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
camera.position.z = 6;

let isRotating = false;
window.addEventListener('mousedown', () => isRotating = true);
window.addEventListener('mouseup', () => isRotating = false);
window.addEventListener('mousemove', (e) => {
    if (isRotating) {
        globeGroup.rotation.y += e.movementX * 0.005;
        globeGroup.rotation.x += e.movementY * 0.005;
    }
});

window.addEventListener('wheel', (e) => {
    camera.position.z = Math.max(3, Math.min(camera.position.z + e.deltaY * 0.01, 100));
    const spaceOpacity = Math.max(0, Math.min((camera.position.z - 15) / 15, 1));
    document.getElementById('space-alert').style.opacity = spaceOpacity;
    globe.material.opacity = 1 - spaceOpacity;
});

function animate() {
    requestAnimationFrame(animate);
    if (!isRotating) globeGroup.rotation.y += 0.001;
    renderer.render(scene, camera);
}
animate();

// --- Initialization ---
const params = new URLSearchParams(window.location.search);
if (params.has('date')) {
    const d = parseInt(params.get('date'));
    document.querySelector('input[type=range]').value = d;
    updateTimeline(d);
} else {
    updateTimeline(0);
}
if (params.has('q')) {
    const q = params.get('q');
    document.querySelector('#search-bar input').value = q;
    handleSearch(q);
}
