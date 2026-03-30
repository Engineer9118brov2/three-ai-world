import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const infoPanel = document.getElementById('info-panel');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (error) {
  infoPanel.innerText = '[ERROR] WEBGL FAILED TO INITIALIZE.';
  throw error;
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 0, 6.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2.6;
controls.maxDistance = 50;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.55);
keyLight.position.set(4, 3, 4);
scene.add(keyLight);

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const globeRadius = 2;
globeGroup.add(
  new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x030303 })
  )
);

globeGroup.add(
  new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius * 0.994, 36, 36),
    new THREE.MeshBasicMaterial({
      color: 0x0a0a0a,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    })
  )
);

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function pseudoNoise(a, b) {
  return (
    Math.sin(a * 3.0) * 0.5 +
    Math.cos(b * 2.15) * 0.35 +
    Math.sin((a + b) * 1.5) * 0.15
  );
}

function createProceduralLandPoints() {
  const positions = [];
  const haloPositions = [];
  for (let lat = -84; lat <= 84; lat += 1.7) {
    for (let lon = -180; lon <= 180; lon += 1.7) {
      const latRad = (lat * Math.PI) / 180;
      const lonRad = (lon * Math.PI) / 180;
      const landScore =
        pseudoNoise(latRad, lonRad) -
        (Math.abs(lat) / 90) * 0.3 +
        Math.cos(latRad * 2.1) * 0.05;

      if (landScore > 0.02) {
        const point = latLonToVector3(lat, lon, globeRadius + 0.03);
        positions.push(point.x, point.y, point.z);
        const haloPoint = latLonToVector3(lat, lon, globeRadius + 0.038);
        haloPositions.push(haloPoint.x, haloPoint.y, haloPoint.z);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xf2fff8,
    size: 0.018,
    sizeAttenuation: true
  });

  const haloGeometry = new THREE.BufferGeometry();
  haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
  const haloMaterial = new THREE.PointsMaterial({
    color: 0x60ffbf,
    size: 0.028,
    transparent: true,
    opacity: 0.28,
    sizeAttenuation: true
  });

  const group = new THREE.Group();
  group.add(new THREE.Points(geometry, material));
  group.add(new THREE.Points(haloGeometry, haloMaterial));
  return group;
}

globeGroup.add(createProceduralLandPoints());

const HQs = {
  MSFT: { lat: 47.6, lon: -122.1 },
  OPENAI: { lat: 37.7, lon: -122.4 },
  NVIDIA: { lat: 37.3, lon: -121.9 }
};

const dataCenters = [
  { name: 'MSFT Fairwater', lat: 42.7, lon: -87.8, hardware: 'Nvidia B200', company: 'Microsoft', load: '1.2GW' },
  { name: 'Meta Hyperion', lat: 32.4, lon: -91.7, hardware: '350k H100s', company: 'Meta', load: '2.0GW' },
  { name: 'Google Council Bluffs', lat: 41.2, lon: -95.8, hardware: 'TPU v6', company: 'Google', load: '1.0GW' },
  { name: 'xAI Colossus', lat: 35.1, lon: -90.0, hardware: '100k H100s', company: 'xAI', load: '150MW' },
  { name: 'AWS Dublin', lat: 53.3, lon: -6.2, hardware: 'H100 Clusters', company: 'Amazon', load: '600MW' },
  { name: 'Nvidia Mumbai', lat: 19.0, lon: 72.8, hardware: 'GB200', company: 'Reliance', load: '2.0GW' },
  { name: 'MSFT Sydney', lat: -33.8, lon: 151.2, hardware: 'Azure AI-1', company: 'Microsoft', load: '500MW' },
  { name: 'Vantage JHB', lat: -26.2, lon: 28.0, hardware: 'Nvidia MGX', company: 'Vantage', load: '80MW' }
];

const markerGroup = new THREE.Group();
globeGroup.add(markerGroup);

dataCenters.forEach((center) => {
  const position = latLonToVector3(center.lat, center.lon, globeRadius + 0.03);
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.046, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  marker.userData = center;
  marker.position.copy(position);
  markerGroup.add(marker);

  const spike = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.018, 0.34, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.48 })
  );
  spike.position.copy(position.clone().multiplyScalar(1.08));
  spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), position.clone().normalize());
  globeGroup.add(spike);
});

function createArc(start, end, color = 0x00ff00, opacity = 0.22, height = 3.0) {
  const startVec = latLonToVector3(start.lat, start.lon, globeRadius + 0.06);
  const endVec = latLonToVector3(end.lat, end.lon, globeRadius + 0.06);
  const midVec = startVec.clone().lerp(endVec, 0.5).normalize().multiplyScalar(height);
  const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
  const points = curve.getPoints(80);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.Line(geometry, material);
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 8, 8),
    new THREE.MeshBasicMaterial({ color })
  );
  return { curve, line, dot, progress: Math.random() };
}

const loopGroup = new THREE.Group();
globeGroup.add(loopGroup);

const flows = [
  createArc(HQs.MSFT, HQs.OPENAI),
  createArc(HQs.OPENAI, HQs.MSFT),
  createArc(HQs.MSFT, HQs.NVIDIA),
  createArc(HQs.NVIDIA, HQs.OPENAI)
];

flows.forEach((flow) => {
  loopGroup.add(flow.line);
  loopGroup.add(flow.dot);
});
loopGroup.visible = false;

window.toggleLoop = () => {
  loopGroup.visible = !loopGroup.visible;
  infoPanel.innerHTML = loopGroup.visible
    ? '[MODE] MONEY LOOP ACTIVE.<br>ANIMATED CAPITAL FLOWS ONLINE.'
    : '[MODE] MONEY LOOP DISABLED.<br>CLICK A GLOBAL NODE TO INITIALIZE DATA STREAM.';
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let suppressClickUntil = 0;

controls.addEventListener('start', () => {
  suppressClickUntil = performance.now() + 120;
});

window.addEventListener('pointerdown', () => {
  suppressClickUntil = performance.now() + 120;
});

window.addEventListener('click', (event) => {
  if (performance.now() < suppressClickUntil) return;

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(markerGroup.children);
  if (hits.length === 0) return;

  const selected = hits[0].object.userData;
  infoPanel.innerHTML = [
    '<span style="color:#00ff00">[NODE_SELECTED]</span>',
    `NAME: ${selected.name}`,
    `CORP: ${selected.company}`,
    `LOAD: ${selected.load}`,
    `HW: ${selected.hardware}`
  ].join('<br>');
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  globeGroup.rotation.y += 0.0007;

  if (loopGroup.visible) {
    flows.forEach((flow) => {
      flow.progress += 0.004;
      if (flow.progress > 1) flow.progress = 0;
      flow.dot.position.copy(flow.curve.getPoint(flow.progress));
    });
  }

  renderer.render(scene, camera);
}

animate();
