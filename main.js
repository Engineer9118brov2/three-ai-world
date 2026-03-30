import * as THREE from 'three';

// --- Scene & Camera (Conductor Theme: Pure Black) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- The Globe (Conductor Style: Sharp White Lines) ---
const globe = new THREE.Mesh(
    new THREE.SphereGeometry(2, 64, 64),
    new THREE.MeshStandardMaterial({ 
        color: 0x000000, 
        wireframe: true, 
        emissive: 0xffffff, 
        emissiveIntensity: 0.1 
    })
);
scene.add(globe);

// --- Space Elements (Minimalist) ---
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02 });
const starVertices = [];
for (let i = 0; i < 3000; i++) {
    starVertices.push((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
scene.add(new THREE.Points(starGeometry, starMaterial));

// --- GLOBAL AI DATASET (CONDUCTOR EXPANSION) ---
const groundCenters = [
    // --- North America ---
    { name: "MSFT Fairwater (WI)", lat: 42.70, lon: -87.85, date: "2024-05", power: 1000, water: 1200, hardware: "Nvidia B200", models: "GPT-5" },
    { name: "Meta Hyperion (LA)", lat: 32.40, lon: -91.70, date: "2024-09", power: 2000, water: 2200, hardware: "350k H100s", models: "Llama-4" },
    { name: "xAI Colossus (TN)", lat: 35.15, lon: -90.05, date: "2024-07", power: 150, water: 5, hardware: "100k H100s", models: "Grok-3" },
    
    // --- South America ---
    { name: "Google Quilicura (Chile)", lat: -33.36, lon: -70.73, date: "2025-01", power: 400, water: 200, hardware: "TPU v5p", models: "Gemini Pro" },
    { name: "AWS São Paulo (Brazil)", lat: -23.55, lon: -46.63, date: "2025-03", power: 800, water: 500, hardware: "Trainium 2", models: "Claude 3.5" },
    
    // --- Europe ---
    { name: "MSFT Narvik (Norway)", lat: 68.43, lon: 17.42, date: "2025-03", power: 500, water: 0, hardware: "Blackwell", models: "Green LLM" },
    { name: "AWS Dublin (Ireland)", lat: 53.35, lon: -6.26, date: "2024-06", power: 600, water: 400, hardware: "H100 Clusters", models: "European AI" },
    
    // --- Africa ---
    { name: "Vantage JHB (South Africa)", lat: -26.20, lon: 28.04, date: "2025-04", power: 80, water: 100, hardware: "Nvidia MGX", models: "African Sovereign AI" },
    { name: "MSFT Cape Town (SA)", lat: -33.92, lon: 18.42, date: "2025-08", power: 100, water: 150, hardware: "Azure AI Infrastructure", models: "Llama-4 Distro" },
    
    // --- Asia & Oceania ---
    { name: "Nvidia Reliance (Mumbai)", lat: 19.07, lon: 72.87, date: "2025-11", power: 2000, hardware: "Blackwell GB200", models: "Bharat LLM" },
    { name: "MSFT Sydney (Australia)", lat: -33.86, lon: 151.20, date: "2024-11", power: 500, water: 300, hardware: "Azure AI-1", models: "Gemini-Sydney" },
    { name: "GDS Johor (Malaysia)", lat: 1.48, lon: 103.76, date: "2025-02", power: 600, water: 400, hardware: "GPU Clusters", models: "Sovereign AI" },
    
    // --- Space ---
    { name: "Starcloud Orbital", lat: 0, lon: 0, date: "2025-12", power: 50, isSpace: true, distance: 10, hardware: "Space-H100" },
    { name: "Lonestar Lunar", lat: 0, lon: 0, date: "2026-06", power: 100, isSpace: true, distance: 30, hardware: "Lunar RISC-V" }
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
            totalPower += dc.power || 0;
            let pos;
            if (dc.isSpace) {
                pos = new THREE.Vector3(dc.distance, Math.sin(dc.distance) * 5, Math.cos(dc.distance) * 5);
            } else {
                pos = latLonToVector3(dc.lat, dc.lon, 2.05);
            }
            
            // White Marker (Stark)
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
}

// --- Camera & Interaction ---
scene.add(new THREE.AmbientLight(0x888888));
camera.position.z = 6;

window.updateTimeline = (val) => {
    const dates = [...new Set(groundCenters.map(d => d.date))].sort();
    const date = dates[val] || dates[dates.length - 1];
    document.getElementById('date-label').innerText = date;
    const currentDC = groundCenters.find(d => d.date === date);
    if (currentDC) {
        document.getElementById('info-panel').innerHTML = `
            <div style="border-bottom: 1px solid #fff; padding-bottom: 5px; margin-bottom: 10px;">[${currentDC.name}]</div>
            POWER: ${currentDC.power || "N/A"} MW<br>
            HARDWARE: ${currentDC.hardware || "N/A"}<br>
            MODELS: ${currentDC.models || "N/A"}
        `;
    }
    updateMarkers(date);
};

window.addEventListener('wheel', (e) => {
    camera.position.z = Math.max(3, Math.min(camera.position.z + e.deltaY * 0.01, 100));
    document.getElementById('space-alert').style.opacity = camera.position.z > 15 ? 1 : 0;
});

function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.001;
    markers.rotation.y += 0.001;
    renderer.render(scene, camera);
}
animate();
updateTimeline(0);
