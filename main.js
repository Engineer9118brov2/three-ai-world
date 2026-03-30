import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2.5;
controls.maxDistance = 50;

const globeGroup = new THREE.Group();
scene.add(globeGroup);

// --- High-Visibility Globe & Continents ---
const globeGeom = new THREE.SphereGeometry(2, 64, 64);
const globeMat = new THREE.MeshStandardMaterial({ 
    color: 0x050505,
    wireframe: false,
    emissive: 0xffffff,
    emissiveIntensity: 0.02
});
const baseGlobe = new THREE.Mesh(globeGeom, globeMat);
globeGroup.add(baseGlobe);

// Add continent outlines using a high-contrast texture
const textureLoader = new THREE.TextureLoader();
const earthLand = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
const landMat = new THREE.MeshBasicMaterial({ 
    map: earthLand,
    transparent: true,
    opacity: 0.4,
    color: 0xffffff,
    wireframe: true
});
const landGlobe = new THREE.Mesh(globeGeom, landMat);
globeGroup.add(landGlobe);

// --- DATASET ---
const HQs = { MSFT: { lat: 47.6, lon: -122.1 }, OPENAI: { lat: 37.7, lon: -122.4 }, NVIDIA: { lat: 37.3, lon: -121.9 } };
const dataCenters = [
    { id: 1, name: "MSFT Fairwater", lat: 42.7, lon: -87.8, hardware: "Nvidia B200", company: "Microsoft", load: "1.2GW" },
    { id: 2, name: "Meta Hyperion", lat: 32.4, lon: -91.7, hardware: "350k H100s", company: "Meta", load: "2.0GW" },
    { id: 3, name: "Google Council Bluffs", lat: 41.2, lon: -95.8, hardware: "TPU v6", company: "Google", load: "1.0GW" },
    { id: 4, name: "xAI Colossus", lat: 35.1, lon: -90.0, hardware: "100k H100s", company: "xAI", load: "150MW" },
    { id: 5, name: "AWS Dublin", lat: 53.3, lon: -6.2, hardware: "H100 Clusters", company: "Amazon", load: "600MW" },
    { id: 6, name: "Nvidia Mumbai", lat: 19.0, lon: 72.8, hardware: "GB200", company: "Reliance", load: "2.0GW" },
    { id: 7, name: "MSFT Sydney", lat: -33.8, lon: 151.2, hardware: "Azure AI-1", company: "Microsoft", load: "500MW" },
    { id: 8, name: "Vantage JHB", lat: -26.2, lon: 28.0, hardware: "Nvidia MGX", company: "Vantage", load: "80MW" }
];

const markers = new THREE.Group();
globeGroup.add(markers);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

// --- Create Markers ---
dataCenters.forEach(dc => {
    const pos = latLonToVector3(dc.lat, dc.lon, 2.02);
    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    marker.position.copy(pos);
    marker.userData = dc;
    markers.add(marker);
    
    // High-impact spikes
    const spike = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.02, 0.5),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
    );
    spike.position.copy(pos.clone().multiplyScalar(1.1));
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
    globeGroup.add(spike);
});

// --- Animated Money Loop ---
const loopGroup = new THREE.Group();
globeGroup.add(loopGroup);

function createPulsingArc(start, end) {
    const startVec = latLonToVector3(start.lat, start.lon, 2.05);
    const endVec = latLonToVector3(end.lat, end.lon, 2.05);
    const midVec = startVec.clone().lerp(endVec, 0.5).normalize().multiplyScalar(3);
    const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
    
    const points = curve.getPoints(100);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.2 }));
    
    // Flowing particle
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    loopGroup.add(line, dot);
    
    return { curve, dot, progress: Math.random() };
}

const activeFlows = [
    createPulsingArc(HQs.MSFT, HQs.OPENAI),
    createPulsingArc(HQs.OPENAI, HQs.MSFT),
    createPulsingArc(HQs.MSFT, HQs.NVIDIA),
    createPulsingArc(HQs.NVIDIA, HQs.OPENAI)
];

window.toggleLoop = () => { loopGroup.visible = !loopGroup.visible; };
loopGroup.visible = false;

// --- Interaction ---
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(markers.children);
    
    if (intersects.length > 0) {
        const data = intersects[0].object.userData;
        document.getElementById('info-panel').innerHTML = `
            <div style="color:#00ff00">[NODE_SELECTED]</div>
            NAME: ${data.name}<br>
            CORP: ${data.company}<br>
            LOAD: ${data.load}<br>
            HW: ${data.hardware}
        `;
        playBeep(200, 0.1);
    }
});

function playBeep(f, d) {
    const a = new (window.AudioContext || window.webkitAudioContext)();
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.value = f;
    g.gain.setValueAtTime(0.05, a.currentTime);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + d);
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // Animate flows
    activeFlows.forEach(f => {
        f.progress += 0.005;
        if (f.progress > 1) f.progress = 0;
        const p = f.curve.getPoint(f.progress);
        f.dot.position.copy(p);
    });
    
    renderer.render(scene, camera);
}

camera.position.z = 6;
animate();
