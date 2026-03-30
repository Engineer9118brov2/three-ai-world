import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import earthTextureUrl from './assets/earth_atmos_2048.jpg';

const infoPanel = document.getElementById('info-panel');
const centerListEl = document.getElementById('center-list');
const searchInput = document.getElementById('search-centers');
const statSites = document.getElementById('stat-sites');
const statPower = document.getElementById('stat-power');
const statOperational = document.getElementById('stat-operational');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (error) {
  infoPanel.innerText = '[ERROR] WEBGL FAILED TO INITIALIZE.';
  throw error;
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.26;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 6.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2.5;
controls.maxDistance = 52;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(5, 2, 5);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x75beff, 0.45);
rimLight.position.set(-4, -2, -5);
scene.add(rimLight);

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const globeRadius = 2;
const earthTexture = new THREE.TextureLoader().load(earthTextureUrl);
earthTexture.colorSpace = THREE.SRGBColorSpace;
earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const earthSphere = new THREE.Mesh(
  new THREE.SphereGeometry(globeRadius, 112, 112),
  new THREE.MeshPhongMaterial({
    map: earthTexture,
    shininess: 14,
    specular: new THREE.Color(0x2b3f52),
    emissive: new THREE.Color(0x1a3042),
    emissiveIntensity: 0.24
  })
);
globeGroup.add(earthSphere);

const cloudShell = new THREE.Mesh(
  new THREE.SphereGeometry(globeRadius * 1.01, 80, 80),
  new THREE.MeshBasicMaterial({
    color: 0xe9f6ff,
    transparent: true,
    opacity: 0.07
  })
);
globeGroup.add(cloudShell);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(globeRadius * 1.03, 72, 72),
  new THREE.MeshBasicMaterial({
    color: 0x77c4ff,
    transparent: true,
    opacity: 0.14,
    side: THREE.BackSide
  })
);
globeGroup.add(atmosphere);

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

const OPERATOR_LINKS = {
  AWS: [
    { label: 'AWS Global Infrastructure', url: 'https://aws.amazon.com/about-aws/global-infrastructure/regions_az/' },
    { label: 'AWS Sustainability', url: 'https://sustainability.aboutamazon.com/environment/the-cloud' }
  ],
  AZURE: [
    { label: 'Azure Global Infrastructure', url: 'https://azure.microsoft.com/en-us/explore/global-infrastructure' },
    { label: 'Microsoft Datacenters', url: 'https://www.microsoft.com/en-us/datacenters' }
  ],
  GOOGLE: [
    { label: 'Google Cloud Locations', url: 'https://cloud.google.com/about/locations' },
    { label: 'Google Data Centers', url: 'https://www.google.com/about/datacenters/' }
  ],
  META: [
    { label: 'Meta Data Center Operations', url: 'https://datacenters.atmeta.com/' },
    { label: 'Meta Sustainability', url: 'https://sustainability.atmeta.com/' }
  ],
  ORACLE: [
    { label: 'Oracle Cloud Regions', url: 'https://www.oracle.com/cloud/public-cloud-regions/' },
    { label: 'Oracle Environment', url: 'https://www.oracle.com/corporate/citizenship/environment/' }
  ],
  IBM: [
    { label: 'IBM Cloud Data Centers', url: 'https://www.ibm.com/cloud/data-centers' },
    { label: 'IBM Sustainability', url: 'https://www.ibm.com/sustainability' }
  ],
  COLOCATION: [
    { label: 'Digital Realty Data Centers', url: 'https://www.digitalrealty.com/data-centers' },
    { label: 'QTS Locations', url: 'https://www.qtsdatacenters.com/data-center-locations' }
  ],
  COREWEAVE: [
    { label: 'CoreWeave', url: 'https://www.coreweave.com/' },
    { label: 'NVIDIA Data Center Platform', url: 'https://www.nvidia.com/en-us/data-center/' }
  ],
  XAI: [
    { label: 'xAI (Company)', url: 'https://x.ai/' },
    { label: 'Memphis Utility Context', url: 'https://www.mlgw.com/' }
  ],
  CHINA: [
    { label: 'Alibaba Cloud Global Infrastructure', url: 'https://www.alibabacloud.com/global-locations' },
    { label: 'Tencent Cloud Regions', url: 'https://www.tencentcloud.com/products/regions' }
  ],
  NVIDIA: [
    { label: 'NVIDIA Data Center', url: 'https://www.nvidia.com/en-us/data-center/' },
    { label: 'NVIDIA Sustainability', url: 'https://www.nvidia.com/en-us/about-nvidia/corporate-responsibility/' }
  ]
};

const DATA_CENTERS = [
  { id: 'aws-1', name: 'AWS US-East (N. Virginia)', operator: 'AWS', lat: 38.95, lon: -77.45, status: 'Operational', powerMW: 620, models: ['Claude', 'Llama', 'Mistral', 'Titan'], cooling: 'Air + liquid retrofit', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '1100 direct / 3600 indirect', role: 'Primary east-coast AI inference + training region.' },
  { id: 'aws-2', name: 'AWS US-West (Oregon)', operator: 'AWS', lat: 45.6, lon: -121.18, status: 'Operational', powerMW: 480, models: ['Claude', 'Llama', 'Titan', 'Stable Diffusion'], cooling: 'Evaporative + liquid loops', waterRisk: 'Medium', gridRisk: 'Low', jobs: '850 / 2500', role: 'West-coast low-latency model serving and batch training.' },
  { id: 'aws-3', name: 'AWS EU (Dublin)', operator: 'AWS', lat: 53.34, lon: -6.26, status: 'Operational', powerMW: 420, models: ['Llama', 'Mistral', 'Claude'], cooling: 'Air-side economization', waterRisk: 'Low', gridRisk: 'Medium', jobs: '720 / 1900', role: 'EU sovereignty-aligned AI workloads.' },
  { id: 'aws-4', name: 'AWS AP (Singapore)', operator: 'AWS', lat: 1.35, lon: 103.82, status: 'Operational', powerMW: 360, models: ['Llama', 'Titan', 'Claude'], cooling: 'High-efficiency chilled water', waterRisk: 'High', gridRisk: 'Medium', jobs: '560 / 1400', role: 'ASEAN low-latency inference fabric.' },
  { id: 'aws-5', name: 'AWS AP (Tokyo)', operator: 'AWS', lat: 35.68, lon: 139.76, status: 'Operational', powerMW: 330, models: ['Llama', 'Mistral', 'Titan'], cooling: 'Liquid-assist racks', waterRisk: 'Medium', gridRisk: 'Low', jobs: '520 / 1300', role: 'Japan enterprise AI serving and DR.' },
  { id: 'aws-6', name: 'AWS AP (Sydney)', operator: 'AWS', lat: -33.86, lon: 151.2, status: 'Expansion', powerMW: 250, models: ['Llama', 'Claude', 'Titan'], cooling: 'Hybrid free cooling', waterRisk: 'Medium', gridRisk: 'Low', jobs: '430 / 1200', role: 'Oceania model hosting and compliance workloads.' },

  { id: 'az-1', name: 'Azure East US (Virginia)', operator: 'AZURE', lat: 38.9, lon: -77.2, status: 'Operational', powerMW: 680, models: ['GPT family', 'Phi', 'Llama', 'Mistral'], cooling: 'Direct-to-chip rollout', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '1300 / 3900', role: 'Large OpenAI-aligned serving and enterprise Copilot backend.' },
  { id: 'az-2', name: 'Azure West Europe (Netherlands)', operator: 'AZURE', lat: 52.37, lon: 4.9, status: 'Operational', powerMW: 510, models: ['GPT family', 'Phi', 'Llama'], cooling: 'Air + rear-door heat exchangers', waterRisk: 'Low', gridRisk: 'Low', jobs: '900 / 2600', role: 'EU regulated AI workloads and model APIs.' },
  { id: 'az-3', name: 'Azure Sweden Central', operator: 'AZURE', lat: 60.67, lon: 17.14, status: 'Operational', powerMW: 340, models: ['GPT family', 'Phi', 'Llama'], cooling: 'Low-ambient free cooling', waterRisk: 'Low', gridRisk: 'Low', jobs: '580 / 1700', role: 'Low-carbon training cluster placement.' },
  { id: 'az-4', name: 'Azure Japan East', operator: 'AZURE', lat: 35.68, lon: 139.65, status: 'Operational', powerMW: 300, models: ['GPT family', 'Phi'], cooling: 'Liquid-assist', waterRisk: 'Medium', gridRisk: 'Low', jobs: '490 / 1350', role: 'Japanese language model deployment hub.' },
  { id: 'az-5', name: 'Azure Australia East', operator: 'AZURE', lat: -33.87, lon: 151.2, status: 'Expansion', powerMW: 270, models: ['GPT family', 'Llama', 'Phi'], cooling: 'Hybrid mechanical + economizer', waterRisk: 'Medium', gridRisk: 'Low', jobs: '430 / 1180', role: 'Regional sovereign hosting.' },
  { id: 'az-6', name: 'Azure Qatar Central', operator: 'AZURE', lat: 25.29, lon: 51.53, status: 'Announced', powerMW: 180, models: ['GPT family', 'Phi'], cooling: 'High-density liquid planned', waterRisk: 'High', gridRisk: 'Medium', jobs: '290 / 900', role: 'MENA low-latency inference entrypoint.' },

  { id: 'gcp-1', name: 'Google Council Bluffs (Iowa)', operator: 'GOOGLE', lat: 41.26, lon: -95.86, status: 'Operational', powerMW: 590, models: ['Gemini', 'Imagen', 'Llama'], cooling: 'Liquid + evaporative', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '960 / 3000', role: 'Core Gemini training and TPU orchestration region.' },
  { id: 'gcp-2', name: 'Google The Dalles (Oregon)', operator: 'GOOGLE', lat: 45.59, lon: -121.18, status: 'Operational', powerMW: 470, models: ['Gemini', 'Imagen', 'Codey'], cooling: 'River/air-assisted cooling', waterRisk: 'Medium', gridRisk: 'Low', jobs: '820 / 2400', role: 'West inference + multimodal serving.' },
  { id: 'gcp-3', name: 'Google Hamina (Finland)', operator: 'GOOGLE', lat: 60.57, lon: 27.2, status: 'Operational', powerMW: 310, models: ['Gemini', 'Gemma'], cooling: 'Seawater cooling', waterRisk: 'Low', gridRisk: 'Low', jobs: '500 / 1450', role: 'Low-carbon EU model capacity.' },
  { id: 'gcp-4', name: 'Google St. Ghislain (Belgium)', operator: 'GOOGLE', lat: 50.45, lon: 3.82, status: 'Operational', powerMW: 320, models: ['Gemini', 'Gemma', 'Imagen'], cooling: 'Economizer + liquid assist', waterRisk: 'Low', gridRisk: 'Low', jobs: '520 / 1500', role: 'EU enterprise API footprint.' },
  { id: 'gcp-5', name: 'Google Singapore', operator: 'GOOGLE', lat: 1.35, lon: 103.82, status: 'Operational', powerMW: 290, models: ['Gemini', 'Gemma'], cooling: 'Chilled water optimized', waterRisk: 'High', gridRisk: 'Medium', jobs: '470 / 1300', role: 'Southeast Asia model access node.' },
  { id: 'gcp-6', name: 'Google Milan Region', operator: 'GOOGLE', lat: 45.46, lon: 9.19, status: 'Announced', powerMW: 200, models: ['Gemini', 'Gemma'], cooling: 'Planned high-density liquid', waterRisk: 'Medium', gridRisk: 'Low', jobs: '320 / 980', role: 'Southern Europe sovereignty coverage.' },

  { id: 'meta-1', name: 'Meta Altoona (Iowa)', operator: 'META', lat: 41.65, lon: -93.48, status: 'Operational', powerMW: 430, models: ['Llama family', 'Multimodal assistants'], cooling: 'Air + liquid pilots', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '710 / 2200', role: 'Large social graph + model serving backend.' },
  { id: 'meta-2', name: 'Meta New Albany (Ohio)', operator: 'META', lat: 40.08, lon: -82.81, status: 'Operational', powerMW: 520, models: ['Llama family', 'Recommender models'], cooling: 'Hybrid direct-to-chip', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '860 / 2700', role: 'US east personalized ranking and generative serving.' },
  { id: 'meta-3', name: 'Meta Clonee (Ireland)', operator: 'META', lat: 53.41, lon: -6.47, status: 'Operational', powerMW: 300, models: ['Llama family'], cooling: 'Free-air optimized', waterRisk: 'Low', gridRisk: 'Medium', jobs: '500 / 1500', role: 'EU data residency workload split.' },
  { id: 'meta-4', name: 'Meta Odense (Denmark)', operator: 'META', lat: 55.4, lon: 10.39, status: 'Expansion', powerMW: 350, models: ['Llama family', 'Vision encoders'], cooling: 'Heat recovery + liquid', waterRisk: 'Low', gridRisk: 'Low', jobs: '560 / 1650', role: 'Nordic low-carbon AI capacity growth.' },

  { id: 'orcl-1', name: 'Oracle Ashburn', operator: 'ORACLE', lat: 39.04, lon: -77.49, status: 'Operational', powerMW: 280, models: ['Cohere Command', 'Llama', 'OCI Generative AI'], cooling: 'Air + rear-door HX', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '420 / 1200', role: 'OCI AI enterprise workloads.' },
  { id: 'orcl-2', name: 'Oracle Frankfurt', operator: 'ORACLE', lat: 50.11, lon: 8.68, status: 'Operational', powerMW: 220, models: ['Cohere Command', 'Llama'], cooling: 'Economizer-centric', waterRisk: 'Low', gridRisk: 'Low', jobs: '340 / 980', role: 'EU mission-critical model inference.' },
  { id: 'orcl-3', name: 'Oracle Mumbai', operator: 'ORACLE', lat: 19.08, lon: 72.88, status: 'Expansion', powerMW: 260, models: ['Llama', 'OCI GenAI'], cooling: 'High-density liquid design', waterRisk: 'High', gridRisk: 'Medium', jobs: '390 / 1100', role: 'India growth market model serving.' },

  { id: 'ibm-1', name: 'IBM Dallas', operator: 'IBM', lat: 32.78, lon: -96.8, status: 'Operational', powerMW: 170, models: ['Granite', 'Watsonx'], cooling: 'Air + liquid row cooling', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '280 / 760', role: 'Watsonx model hosting and enterprise AI.' },
  { id: 'ibm-2', name: 'IBM Frankfurt', operator: 'IBM', lat: 50.12, lon: 8.68, status: 'Operational', powerMW: 150, models: ['Granite', 'Watsonx'], cooling: 'Air-side economization', waterRisk: 'Low', gridRisk: 'Low', jobs: '250 / 700', role: 'EU regulated IBM AI workloads.' },

  { id: 'cw-1', name: 'CoreWeave New Jersey', operator: 'COREWEAVE', lat: 40.73, lon: -74.17, status: 'Operational', powerMW: 210, models: ['Llama', 'Mistral', 'Stable Diffusion', 'Video models'], cooling: 'Liquid-heavy GPU clusters', waterRisk: 'Medium', gridRisk: 'High', jobs: '330 / 920', role: 'GPU-dense model training and fine-tuning.' },
  { id: 'cw-2', name: 'CoreWeave Illinois', operator: 'COREWEAVE', lat: 41.88, lon: -87.63, status: 'Expansion', powerMW: 230, models: ['Llama', 'Mistral', 'Diffusion models'], cooling: 'Direct-to-chip planned', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '350 / 980', role: 'Midwest training + backup inference pool.' },

  { id: 'colo-1', name: 'Digital Realty Ashburn', operator: 'COLOCATION', lat: 39.03, lon: -77.48, status: 'Operational', powerMW: 260, models: ['Hosted GPU clouds', 'Private Llama clusters'], cooling: 'Tenant-specific liquid retrofits', waterRisk: 'Medium', gridRisk: 'High', jobs: '410 / 1200', role: 'Multi-tenant AI backbone interconnection hub.' },
  { id: 'colo-2', name: 'Digital Realty Singapore', operator: 'COLOCATION', lat: 1.29, lon: 103.85, status: 'Operational', powerMW: 190, models: ['Hosted enterprise copilots'], cooling: 'Chilled water systems', waterRisk: 'High', gridRisk: 'Medium', jobs: '300 / 860', role: 'APAC enterprise colocation AI services.' },
  { id: 'colo-3', name: 'QTS Phoenix Metro', operator: 'COLOCATION', lat: 33.45, lon: -112.07, status: 'Expansion', powerMW: 310, models: ['Hyperscaler GPU pods', 'Private model serving'], cooling: 'Liquid retrofit in progress', waterRisk: 'High', gridRisk: 'Medium', jobs: '500 / 1500', role: 'Southwest hyperscale AI growth corridor.' },
  { id: 'colo-4', name: 'QTS Atlanta Metro', operator: 'COLOCATION', lat: 33.75, lon: -84.39, status: 'Operational', powerMW: 220, models: ['Hybrid cloud model hosting'], cooling: 'Air-side + adiabatic', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '360 / 1020', role: 'Southeast enterprise and media AI serving.' },

  { id: 'nv-1', name: 'NVIDIA DGX Cloud Hub (Santa Clara)', operator: 'NVIDIA', lat: 37.35, lon: -121.95, status: 'Operational', powerMW: 120, models: ['NIM services', 'Llama', 'Nemotron'], cooling: 'Advanced liquid racks', waterRisk: 'Low', gridRisk: 'Medium', jobs: '210 / 560', role: 'Reference AI platform and partner enablement.' },
  { id: 'xai-1', name: 'xAI Colossus (Memphis)', operator: 'XAI', lat: 35.15, lon: -90.05, status: 'Operational', powerMW: 260, models: ['Grok family'], cooling: 'Containerized liquid + air hybrid', waterRisk: 'Medium', gridRisk: 'High', jobs: '340 / 1000', role: 'Fast-iteration frontier model training site.' },

  { id: 'cn-1', name: 'Alibaba Zhangbei Cluster', operator: 'CHINA', lat: 41.15, lon: 114.7, status: 'Operational', powerMW: 390, models: ['Qwen family', 'Industry LLMs'], cooling: 'Air + direct liquid pilots', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '620 / 1800', role: 'Large-scale domestic foundation model hosting.' },
  { id: 'cn-2', name: 'Tencent Qingyuan Cluster', operator: 'CHINA', lat: 23.68, lon: 113.06, status: 'Operational', powerMW: 320, models: ['Hunyuan family', 'Multimodal assistants'], cooling: 'Hybrid chilled water', waterRisk: 'High', gridRisk: 'Medium', jobs: '520 / 1500', role: 'South China inference and AI cloud serving.' },
  { id: 'cn-3', name: 'Baidu Yangquan AI DC', operator: 'CHINA', lat: 37.86, lon: 113.58, status: 'Expansion', powerMW: 280, models: ['ERNIE family', 'Autonomous driving models'], cooling: 'Free-air + liquid assist', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '430 / 1300', role: 'Search + autonomous AI workloads.' },
  { id: 'cn-4', name: 'Huawei Guizhou Region', operator: 'CHINA', lat: 26.65, lon: 106.63, status: 'Operational', powerMW: 340, models: ['Pangu family', 'Enterprise copilot models'], cooling: 'Low-ambient optimized', waterRisk: 'Medium', gridRisk: 'Low', jobs: '570 / 1700', role: 'Domestic enterprise model platform backend.' },
  { id: 'cn-5', name: 'ByteDance Ulanqab Hub', operator: 'CHINA', lat: 41.03, lon: 113.12, status: 'Expansion', powerMW: 300, models: ['Recommendation + video generation models'], cooling: 'Air + liquid retrofit', waterRisk: 'Low', gridRisk: 'Medium', jobs: '480 / 1400', role: 'Massive recommender and media model infrastructure.' }
];

const HQS = {
  AWS: { lat: 47.62, lon: -122.33 },
  AZURE: { lat: 47.67, lon: -122.12 },
  GOOGLE: { lat: 37.42, lon: -122.08 },
  META: { lat: 37.48, lon: -122.15 },
  ORACLE: { lat: 37.53, lon: -122.26 },
  IBM: { lat: 41.11, lon: -73.72 },
  COREWEAVE: { lat: 40.73, lon: -74.0 },
  COLOCATION: { lat: 39.04, lon: -77.49 },
  NVIDIA: { lat: 37.39, lon: -121.96 },
  XAI: { lat: 35.15, lon: -90.05 },
  CHINA: { lat: 31.23, lon: 121.47 }
};

const markers = new THREE.Group();
const markerHitTargets = new THREE.Group();
const arcs = new THREE.Group();
const loopGroup = new THREE.Group();
const chinaFlowGroup = new THREE.Group();
globeGroup.add(markers, markerHitTargets, arcs, loopGroup, chinaFlowGroup);

function createArc(start, end, color = 0x79ffd0, opacity = 0.18, height = 2.8) {
  const startVec = latLonToVector3(start.lat, start.lon, globeRadius + 0.03);
  const endVec = latLonToVector3(end.lat, end.lon, globeRadius + 0.03);
  const midVec = startVec.clone().lerp(endVec, 0.5).normalize().multiplyScalar(height);
  const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
  const points = curve.getPoints(70);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.Line(geometry, material);
}

function statusColor(status) {
  if (status === 'Operational') return 0xffffff;
  if (status === 'Expansion') return 0x62ffd2;
  return 0xffcf70;
}

const markerById = new Map();
DATA_CENTERS.forEach((center) => {
  const position = latLonToVector3(center.lat, center.lon, globeRadius + 0.03);
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.036, 10, 10),
    new THREE.MeshBasicMaterial({ color: statusColor(center.status) })
  );
  marker.userData = center;
  marker.position.copy(position);
  markers.add(marker);
  markerById.set(center.id, marker);

  const hitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 12, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    })
  );
  hitTarget.userData = center;
  hitTarget.position.copy(position);
  markerHitTargets.add(hitTarget);

  const hq = HQS[center.operator];
  if (hq && !(hq.lat === center.lat && hq.lon === center.lon)) {
    arcs.add(createArc(center, hq, 0x70f8c6, 0.12, 2.7));
  }
});

const moneyFlows = [
  createArc(HQS.AZURE, HQS.NVIDIA, 0x2aff87, 0.44, 2.6),
  createArc(HQS.GOOGLE, HQS.NVIDIA, 0x2aff87, 0.44, 2.6),
  createArc(HQS.AWS, HQS.NVIDIA, 0x2aff87, 0.44, 2.6),
  createArc(HQS.META, HQS.NVIDIA, 0x2aff87, 0.44, 2.6),
  createArc(HQS.AZURE, HQS.AWS, 0x2aff87, 0.26, 2.5),
  createArc(HQS.AWS, HQS.GOOGLE, 0x2aff87, 0.26, 2.5)
];
moneyFlows.forEach((line) => loopGroup.add(line));
loopGroup.visible = false;

window.toggleLoop = () => {
  loopGroup.visible = !loopGroup.visible;
};

const chinaFlows = [
  createArc(HQS.NVIDIA, HQS.CHINA, 0xffb55e, 0.45, 2.55),
  createArc(HQS.GOOGLE, HQS.CHINA, 0xffb55e, 0.28, 2.5),
  createArc(HQS.AWS, HQS.CHINA, 0xffb55e, 0.28, 2.5),
  createArc(HQS.CHINA, HQS.NVIDIA, 0xffd18a, 0.4, 2.6),
  createArc(HQS.CHINA, HQS.COREWEAVE, 0xffb55e, 0.2, 2.45)
];
chinaFlows.forEach((line) => chinaFlowGroup.add(line));
chinaFlowGroup.visible = false;

window.toggleChinaFlow = () => {
  chinaFlowGroup.visible = !chinaFlowGroup.visible;
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let suppressClickUntil = 0;
let activeCenterId = null;
let focusPoint = null;
let pointerDownPos = null;
let draggedSincePointerDown = false;

controls.addEventListener('start', () => {
  draggedSincePointerDown = true;
  suppressClickUntil = performance.now() + 120;
});

window.addEventListener('pointerdown', (event) => {
  pointerDownPos = { x: event.clientX, y: event.clientY };
  draggedSincePointerDown = false;
});

function centerLinks(center) {
  return OPERATOR_LINKS[center.operator] ?? [];
}

function centerDetailsHtml(center) {
  const modelTags = center.models.map((model) => `<span class="chip">${model}</span>`).join('');
  const links = centerLinks(center)
    .map((link) => `<div><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a></div>`)
    .join('');

  return [
    `<div style="font-size:13px;color:#adffd8;margin-bottom:8px;">${center.name}</div>`,
    `<div><b>Operator:</b> ${center.operator}</div>`,
    `<div><b>Status:</b> ${center.status}</div>`,
    `<div><b>Estimated Power:</b> ${center.powerMW} MW</div>`,
    `<div><b>Role:</b> ${center.role}</div>`,
    `<div style="margin-top:8px;"><b>Model Coverage (Likely):</b></div>`,
    `<div>${modelTags || 'No model details available.'}</div>`,
    `<div style="margin-top:8px;"><b>Impact Breakdown:</b></div>`,
    `<div>Cooling: ${center.cooling}</div>`,
    `<div>Water Stress: ${center.waterRisk}</div>`,
    `<div>Grid Carbon Pressure: ${center.gridRisk}</div>`,
    `<div>Local Employment: ${center.jobs}</div>`,
    `<div style="margin-top:8px;"><b>Learn More:</b></div>`,
    `<div>${links}</div>`,
    `<div style="margin-top:10px;opacity:0.6;font-size:9px;">MODEL SUPPORT + IMPACT VALUES ARE CURATED ESTIMATES FROM PUBLIC OPERATOR DISCLOSURES.</div>`
  ].join('');
}

function selectCenter(center, focus = true) {
  activeCenterId = center.id;
  infoPanel.innerHTML = centerDetailsHtml(center);

  markerById.forEach((marker, id) => {
    const material = marker.material;
    if (!material || Array.isArray(material)) return;
    material.color.setHex(statusColor(marker.userData.status));
    marker.scale.setScalar(id === center.id ? 1.65 : 1);
    if (id === center.id) material.color.setHex(0x94ffd9);
  });

  if (focus) {
    focusPoint = latLonToVector3(center.lat, center.lon, globeRadius + 0.03);
  }

  renderCenterList(searchInput.value || '');
}

function renderCenterList(query = '') {
  const q = query.trim().toLowerCase();
  const filtered = DATA_CENTERS.filter((center) => {
    const hay = `${center.name} ${center.operator} ${center.status} ${center.models.join(' ')}`.toLowerCase();
    return !q || hay.includes(q);
  });

  centerListEl.innerHTML = filtered
    .map((center) => `
      <div class="center-row" data-id="${center.id}" style="${center.id === activeCenterId ? 'border-color:#8fffd0;background:#123025;' : ''}">
        <div class="center-name">${center.name}</div>
        <div class="center-meta">
          ${center.operator} // ${center.status}<br>
          POWER: ${center.powerMW} MW // MODELS: ${center.models.length}
        </div>
      </div>
    `)
    .join('');

  centerListEl.querySelectorAll('.center-row').forEach((el) => {
    el.addEventListener('click', () => {
      const selected = DATA_CENTERS.find((center) => center.id === el.dataset.id);
      if (selected) selectCenter(selected, true);
    });
  });
}

function updateStats() {
  const totalPower = DATA_CENTERS.reduce((sum, center) => sum + center.powerMW, 0);
  const operational = DATA_CENTERS.filter((center) => center.status === 'Operational').length;
  statSites.innerText = String(DATA_CENTERS.length);
  statPower.innerText = `${totalPower} MW`;
  statOperational.innerText = String(operational);
}

searchInput.addEventListener('input', () => {
  renderCenterList(searchInput.value || '');
});

window.addEventListener('click', (event) => {
  if (performance.now() < suppressClickUntil) return;
  if (draggedSincePointerDown) return;
  if (pointerDownPos) {
    const dx = event.clientX - pointerDownPos.x;
    const dy = event.clientY - pointerDownPos.y;
    if (Math.hypot(dx, dy) > 8) return;
  }

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(markerHitTargets.children);
  if (hits.length === 0) return;
  const center = hits[0].object.userData;
  selectCenter(center, true);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

updateStats();
renderCenterList('');
selectCenter(DATA_CENTERS[0], false);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  cloudShell.rotation.y += 0.0002;
  globeGroup.rotation.y += 0.00045;

  if (focusPoint) {
    controls.target.lerp(focusPoint, 0.06);
  }

  renderer.render(scene, camera);
}

animate();
