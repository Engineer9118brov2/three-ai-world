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

// --- The Globe ---
const globe = new THREE.Mesh(
    new THREE.SphereGeometry(2, 64, 64),
    new THREE.MeshStandardMaterial({ color: 0x000000, wireframe: true, emissive: 0xffffff, emissiveIntensity: 0.05, transparent: true, opacity: 1 })
);
globeGroup.add(globe);

const HQs = { MSFT: { lat: 47.67, lon: -122.12 }, OPENAI: { lat: 37.77, lon: -122.41 }, NVIDIA: { lat: 37.35, lon: -121.95 } };

const groundCenters = [
    { name: "MSFT Fairwater (WI)", lat: 42.70, lon: -87.85, date: "2024-05", power: 1000, hardware: "Nvidia B200", company: "MSFT", price: "$415" },
    { name: "Meta Hyperion (LA)", lat: 32.40, lon: -91.70, date: "2024-09", power: 2000, hardware: "350k H100s", company: "META", price: "$512" },
    { name: "xAI Colossus (TN)", lat: 35.15, lon: -90.05, date: "2024-07", power: 150, hardware: "100k H100s", company: "xAI", price: "N/A" },
    { name: "Google Quilicura (Chile)", lat: -33.36, lon: -70.73, date: "2025-01", power: 400, hardware: "TPU v5p", company: "GOOGL", price: "$168" },
    { name: "AWS São Paulo (Brazil)", lat: -23.55, lon: -46.63, date: "2025-03", power: 800, hardware: "Trainium 2", company: "AMZN", price: "$175" },
    { name: "MSFT Narvik (Norway)", lat: 68.43, lon: 17.42, date: "2025-03", power: 500, hardware: "Blackwell", company: "MSFT", price: "$440" },
    { name: "AWS Dublin (Ireland)", lat: 53.35, lon: -6.26, date: "2024-06", power: 600, hardware: "H100 Clusters", company: "AMZN", price: "$185", stressed: true },
    { name: "Vantage JHB (South Africa)", lat: -26.20, lon: 28.04, date: "2025-04", power: 80, hardware: "Nvidia MGX", company: "Vantage", price: "N/A" },
    { name: "Nvidia Reliance (Mumbai)", lat: 19.07, lon: 72.87, date: "2025-11", power: 2000, hardware: "Blackwell GB200", company: "NVDA", price: "$145" },
    { name: "MSFT Sydney (Australia)", lat: -33.86, lon: 151.20, date: "2024-11", power: 500, hardware: "Azure AI-1", company: "MSFT", price: "$425" },
    { name: "Starcloud Orbital", lat: 0, lon: 0, date: "2025-12", power: 50, isSpace: true, distance: 10, hardware: "Space-H100", company: "Lumen", price: "N/A" },
    { name: "Lonestar Lunar", lat: 0, lon: 0, date: "2026-06", power: 100, isSpace: true, distance: 30, hardware: "Lunar RISC-V", company: "Lonestar", price: "N/A" }
];

const markers = new THREE.Group();
const arcs = new THREE.Group();
const loopArcs = new THREE.Group();
const stressGlows = new THREE.Group();
globeGroup.add(markers, arcs, loopArcs, stressGlows);

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

function updateMarkers() {
    markers.clear(); arcs.clear(); stressGlows.clear();
    const dates = [...new Set(groundCenters.map(d => d.date))].sort();
    const date = dates[currentDateIndex] || dates[dates.length - 1];
    groundCenters.forEach(dc => {
        if (dc.date <= date) {
            let pos;
            if (dc.isSpace) {
                pos = new THREE.Vector3(dc.distance, Math.sin(dc.distance) * 5, Math.cos(dc.distance) * 5);
            } else {
                pos = latLonToVector3(dc.lat, dc.lon, 2.05);
                if (dc.company !== "NVDA" && dc.company !== "Vantage") arcs.add(createArc({ lat: dc.lat, lon: dc.lon }, HQs.NVIDIA));
                if (dc.stressed) {
                    const glow = new THREE.PointLight(0xff0000, 2, 1.5);
                    glow.position.copy(pos);
                    stressGlows.add(glow);
                }
            }
            markers.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })));
            markers.children[markers.children.length - 1].position.copy(pos);
        }
    });
}

window.toggleLoop = () => { loopArcs.visible = !loopArcs.visible; document.getElementById('loop-status').innerText = loopArcs.visible ? "LOOP_LAYER: ACTIVE" : "LOOP_LAYER: NULL"; };
window.updateTimeline = (val) => { currentDateIndex = parseInt(val); updateMarkers(); document.getElementById('date-label').innerText = [...new Set(groundCenters.map(d => d.date))].sort()[currentDateIndex]; };

window.startSequence = async () => {
    updateTimeline(0); camera.position.set(0, 0, 6); document.getElementById('info-panel').innerText = "SEQUENCE_01: TERRESTRIAL EXPANSION.";
    await new Promise(r => setTimeout(r, 2000));
    updateTimeline(8); document.getElementById('info-panel').innerText = "SEQUENCE_02: LOAD PEAK. BUBBLE 95%.";
    await new Promise(r => setTimeout(r, 2000));
    toggleLoop(); document.getElementById('info-panel').innerText = "SEQUENCE_03: CIRCULAR CAPITAL FLOW.";
    await new Promise(r => setTimeout(r, 2000));
    camera.position.set(0, 0, 30); document.getElementById('info-panel').innerText = "SEQUENCE_04: OFF-WORLD RELOCATION.";
};

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
camera.position.z = 6;
// Pre-create loop
const flows = [{ from: HQs.MSFT, to: HQs.OPENAI }, { from: HQs.OPENAI, to: HQs.MSFT }, { from: HQs.MSFT, to: HQs.NVIDIA }, { from: HQs.NVIDIA, to: HQs.OPENAI }];
flows.forEach(f => loopArcs.add(createArc(f.from, f.to, 0x00ff00, 0.8, 2.5)));
loopArcs.visible = false;

function animate() { requestAnimationFrame(animate); globeGroup.rotation.y += 0.001; renderer.render(scene, camera); }
animate(); updateTimeline(0);
