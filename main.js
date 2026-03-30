import * as THREE from 'three';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const globeGroup = new THREE.Group();
scene.add(globeGroup);

// --- High-Resolution Point Cloud Continents ---
const loader = new THREE.TextureLoader();
// Using a high-contrast world map to generate points only on landmasses
loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg', (texture) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024; canvas.height = 512;
    ctx.drawImage(texture.image, 0, 0, 1024, 512);
    const data = ctx.getImageData(0, 0, 1024, 512).data;
    
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < data.length; i += 4 * 4) {
        const x = (i / 4) % 1024;
        const y = Math.floor((i / 4) / 1024);
        if (data[i] > 10) { // If pixel is not black (land)
            const phi = (y / 512) * Math.PI;
            const theta = (x / 1024) * 2 * Math.PI;
            positions.push(
                -2 * Math.sin(phi) * Math.cos(theta),
                2 * Math.cos(phi),
                2 * Math.sin(phi) * Math.sin(theta)
            );
        }
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.01 }));
    globeGroup.add(points);
});

// --- Generic Wireframe for Depth ---
globeGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.98, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true, transparent: true, opacity: 0.1 })
));

const HQs = { MSFT: { lat: 47.67, lon: -122.12 }, OPENAI: { lat: 37.77, lon: -122.41 }, NVIDIA: { lat: 37.35, lon: -121.95 } };

const aiNews = {
    "2024-01": "[SIGNAL] GOOGLE REVEALS LUMIERE. INFRASTRUCTURE ARMS RACE ACCELERATES.",
    "2024-03": "[SIGNAL] NVIDIA UNVEILS BLACKWELL B200. DEMAND IS 'INSANE'.",
    "2024-05": "[SIGNAL] STARGATE REVEALED: MSFT/OPENAI $100B PROJECT LEAKED.",
    "2024-07": "[SIGNAL] xAI COLOSSUS ONLINE: 100,000 H100s IN 122 DAYS.",
    "2024-09": "[SIGNAL] META HYPERION: LLAMA-4 TRAINING COMMENCES.",
    "2025-01": "[SIGNAL] NVIDIA RTX 50-SERIES LAUNCH. CONSUMER PEAK.",
    "2025-03": "[SIGNAL] OPENAI RAISES $40B. VALUATION HITS $300B.",
    "2025-09": "[SIGNAL] DATA WALL ALERT: HUMAN DATA EXHAUSTION BY 2027.",
    "2025-12": "[SIGNAL] STARCLOUD SUCCESS: ORBITAL LLM TRAINING.",
    "2026-03": "[SIGNAL] LONESTAR LUNAR NODE ACTIVE. MOON STORAGE SECURED."
};

const groundCenters = [
    { name: "MSFT Fairwater (WI)", lat: 42.70, lon: -87.85, date: "2024-05", power: 1000, hardware: "Nvidia B200", company: "MSFT", price: "$415" },
    { name: "Meta Hyperion (LA)", lat: 32.40, lon: -91.70, date: "2024-09", power: 2000, hardware: "350k H100s", company: "META", price: "$512" },
    { name: "xAI Colossus (TN)", lat: 35.15, lon: -90.05, date: "2024-07", power: 150, hardware: "100k H100s", company: "xAI", price: "N/A" },
    { name: "Google Quilicura (Chile)", lat: -33.36, lon: -70.73, date: "2025-01", power: 400, hardware: "TPU v5p", company: "GOOGL", price: "$168" },
    { name: "AWS Dublin (Ireland)", lat: 53.35, lon: -6.26, date: "2024-06", power: 600, hardware: "H100 Clusters", company: "AMZN", price: "$185" },
    { name: "Nvidia Reliance (Mumbai)", lat: 19.07, lon: 72.87, date: "2025-11", power: 2000, hardware: "Blackwell", company: "NVDA", price: "$145" },
    { name: "Starcloud Orbital", lat: 0, lon: 0, date: "2025-12", power: 50, isSpace: true, distance: 10, hardware: "Space-H100", company: "Lumen" },
    { name: "Lonestar Lunar", lat: 0, lon: 0, date: "2026-06", power: 100, isSpace: true, distance: 30, hardware: "Lunar RISC-V", company: "Lonestar" }
];

const markers = new THREE.Group();
const arcs = new THREE.Group();
const loopArcs = new THREE.Group();
globeGroup.add(markers, arcs, loopArcs);

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

function createArc(start, end, color = 0xffffff, opacity = 0.1, height = 3) {
    const startVec = latLonToVector3(start.lat, start.lon, 2.05);
    const endVec = latLonToVector3(end.lat, end.lon, 2.05);
    const midVec = startVec.clone().lerp(endVec, 0.5).normalize().multiplyScalar(height);
    const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

let currentDateIndex = 0;
function updateMarkers() {
    markers.clear(); arcs.clear();
    const dates = [...new Set(groundCenters.map(d => d.date))].sort();
    const date = dates[currentDateIndex] || dates[dates.length - 1];
    
    document.getElementById('news-content').innerText = aiNews[date] || "[SYSTEM IDLE] MONITORING DEPLOYMENTS...";

    let totalPower = 0;
    groundCenters.forEach(dc => {
        if (dc.date <= date) {
            totalPower += dc.power || 0;
            let pos;
            if (dc.isSpace) {
                pos = new THREE.Vector3(dc.distance, Math.sin(dc.distance) * 5, Math.cos(dc.distance) * 5);
            } else {
                pos = latLonToVector3(dc.lat, dc.lon, 2.05);
                if (dc.company !== "NVDA") arcs.add(createArc({ lat: dc.lat, lon: dc.lon }, HQs.NVIDIA));
            }
            const marker = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            marker.position.copy(pos);
            markers.add(marker);
        }
    });
    document.getElementById('total-power').innerText = `${totalPower} MW`;
}

window.toggleLoop = () => { loopArcs.visible = !loopArcs.visible; };
window.updateTimeline = (val) => { currentDateIndex = parseInt(val); updateMarkers(); document.getElementById('date-label').innerText = [...new Set(groundCenters.map(d => d.date))].sort()[currentDateIndex]; };

window.startSequence = async () => {
    console.log("Starting Sequence...");
    updateTimeline(0); camera.position.set(0, 0, 6);
    document.getElementById('info-panel').innerText = "SEQUENCE_01: TERRESTRIAL EXPANSION.";
    await new Promise(r => setTimeout(r, 2000));
    updateTimeline(5); document.getElementById('info-panel').innerText = "SEQUENCE_02: LOAD PEAK.";
    await new Promise(r => setTimeout(r, 2000));
    loopArcs.visible = true; document.getElementById('info-panel').innerText = "SEQUENCE_03: MONEY LOOP ACTIVE.";
    await new Promise(r => setTimeout(r, 2000));
    camera.position.set(0, 0, 30); document.getElementById('info-panel').innerText = "SEQUENCE_04: THE FINAL FRONTIER.";
};

const flows = [{ from: HQs.MSFT, to: HQs.OPENAI }, { from: HQs.OPENAI, to: HQs.MSFT }, { from: HQs.MSFT, to: HQs.NVIDIA }, { from: HQs.NVIDIA, to: HQs.OPENAI }];
flows.forEach(f => loopArcs.add(createArc(f.from, f.to, 0x00ff00, 0.8, 2.5)));
loopArcs.visible = false;

camera.position.z = 6;
function animate() { requestAnimationFrame(animate); globeGroup.rotation.y += 0.001; renderer.render(scene, camera); }
animate(); updateTimeline(0);
