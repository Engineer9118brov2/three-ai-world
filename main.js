import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import earthTextureUrl from './assets/earth_atmos_2048.jpg';

const infoPanel = document.getElementById('info-panel');
const centerListEl = document.getElementById('center-list');
const searchInput = document.getElementById('search-centers');
const statSites = document.getElementById('stat-sites');
const statPower = document.getElementById('stat-power');
const statOperational = document.getElementById('stat-operational');
const bubbleSummary = document.getElementById('bubble-summary');
const bubbleGrid = document.getElementById('bubble-grid');
const rateShockInput = document.getElementById('rate-shock');
const utilizationInput = document.getElementById('utilization');
const powerInflationInput = document.getElementById('power-inflation');
const revenueGrowthInput = document.getElementById('revenue-growth');
const rateShockVal = document.getElementById('rate-shock-val');
const utilizationVal = document.getElementById('utilization-val');
const powerInflationVal = document.getElementById('power-inflation-val');
const revenueGrowthVal = document.getElementById('revenue-growth-val');
const bubbleBaseBtn = document.getElementById('bubble-base');
const bubbleStressBtn = document.getElementById('bubble-stress');
const bubbleResetBtn = document.getElementById('bubble-reset');
const timelineYearEl = document.getElementById('timeline-year');
const timelinePhaseEl = document.getElementById('timeline-phase');
const timelineDescEl = document.getElementById('timeline-desc');
const timelineSlider = document.getElementById('timeline-slider');
const timelinePrevBtn = document.getElementById('timeline-prev');
const timelineNextBtn = document.getElementById('timeline-next');
const timelinePlayBtn = document.getElementById('timeline-play');
const timelineSpeedSelect = document.getElementById('timeline-speed');
const timelineChartEl = document.getElementById('timeline-chart');
const timelineDeepDiveEl = document.getElementById('timeline-deepdive');
const frontierOverlayEl = document.getElementById('frontier-overlay');

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
controls.maxDistance = 70;
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
const starsGroup = new THREE.Group();
scene.add(starsGroup);

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

const starCount = 2800;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  const radius = 160 + Math.random() * 260;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = radius * Math.cos(phi);
  starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({
  color: 0xcde6ff,
  size: 0.95,
  transparent: true,
  opacity: 0.15,
  depthWrite: false
});
const starField = new THREE.Points(starGeometry, starMaterial);
starsGroup.add(starField);

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

const BUBBLE_OPERATORS = {
  AWS: { debtB: 67, capexB: 54, revenueB: 107, ebitdaMargin: 0.38, baseRate: 4.5, aiShare: 0.24, maturityYear: 2026, riskScore: 32, debtToEquity: 0.45, cashB: 82 },
  AZURE: { debtB: 80, capexB: 58, revenueB: 130, ebitdaMargin: 0.42, baseRate: 4.2, aiShare: 0.22, maturityYear: 2026, riskScore: 28, debtToEquity: 0.38, cashB: 105 },
  GOOGLE: { debtB: 30, capexB: 52, revenueB: 101, ebitdaMargin: 0.36, baseRate: 4.1, aiShare: 0.2, maturityYear: 2027, riskScore: 24, debtToEquity: 0.22, cashB: 110 },
  META: { debtB: 50, capexB: 45, revenueB: 68, ebitdaMargin: 0.34, baseRate: 4.7, aiShare: 0.3, maturityYear: 2026, riskScore: 38, debtToEquity: 0.31, cashB: 65 },
  ORACLE: { debtB: 92, capexB: 24, revenueB: 53, ebitdaMargin: 0.31, baseRate: 5.2, aiShare: 0.19, maturityYear: 2025, riskScore: 54, debtToEquity: 1.15, cashB: 12 },
  IBM: { debtB: 57, capexB: 14, revenueB: 31, ebitdaMargin: 0.24, baseRate: 5.4, aiShare: 0.12, maturityYear: 2025, riskScore: 48, debtToEquity: 0.95, cashB: 14 },
  COREWEAVE: { debtB: 21, capexB: 13, revenueB: 4.8, ebitdaMargin: 0.18, baseRate: 8.5, aiShare: 0.72, maturityYear: 2025, riskScore: 78, debtToEquity: 2.4, cashB: 1.8 },
  COLOCATION: { debtB: 120, capexB: 28, revenueB: 39, ebitdaMargin: 0.29, baseRate: 6.1, aiShare: 0.28, maturityYear: 2026, riskScore: 65, debtToEquity: 1.8, cashB: 4.2 },
  NVIDIA: { debtB: 14, capexB: 9, revenueB: 80, ebitdaMargin: 0.52, baseRate: 3.8, aiShare: 0.64, maturityYear: 2027, riskScore: 12, debtToEquity: 0.15, cashB: 32 },
  XAI: { debtB: 12, capexB: 11, revenueB: 1.5, ebitdaMargin: 0.08, baseRate: 9.2, aiShare: 0.9, maturityYear: 2024, riskScore: 82, debtToEquity: 3.2, cashB: 0.5 },
  CHINA: { debtB: 210, capexB: 78, revenueB: 95, ebitdaMargin: 0.2, baseRate: 5.0, aiShare: 0.34, maturityYear: 2026, riskScore: 58, debtToEquity: 1.4, cashB: 45 }
};

const DATA_CENTERS = [
  { id: 'aws-1', name: 'AWS US-East (N. Virginia)', operator: 'AWS', lat: 38.95, lon: -77.45, status: 'Operational', powerMW: 620, estGPUs: 142000, chipType: 'NVIDIA H100 / A100', co2Tons: 215000, models: ['Claude', 'Llama', 'Mistral', 'Titan'], cooling: 'Air + liquid retrofit', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '1100 direct / 3600 indirect', role: 'Primary east-coast AI inference + training region.' },
  { id: 'aws-2', name: 'AWS US-West (Oregon)', operator: 'AWS', lat: 45.6, lon: -121.18, status: 'Operational', powerMW: 480, estGPUs: 109000, chipType: 'NVIDIA H100 / Trainium', co2Tons: 62000, models: ['Claude', 'Llama', 'Titan', 'Stable Diffusion'], cooling: 'Evaporative + liquid loops', waterRisk: 'Medium', gridRisk: 'Low', jobs: '850 / 2500', role: 'West-coast low-latency model serving and batch training.' },
  { id: 'aws-3', name: 'AWS EU (Dublin)', operator: 'AWS', lat: 53.34, lon: -6.26, status: 'Operational', powerMW: 420, estGPUs: 96000, chipType: 'NVIDIA H100 / A100', co2Tons: 112000, models: ['Llama', 'Mistral', 'Claude'], cooling: 'Air-side economization', waterRisk: 'Low', gridRisk: 'Medium', jobs: '720 / 1900', role: 'EU sovereignty-aligned AI workloads.' },
  { id: 'aws-4', name: 'AWS AP (Singapore)', operator: 'AWS', lat: 1.35, lon: 103.82, status: 'Operational', powerMW: 360, estGPUs: 82000, chipType: 'NVIDIA H100 / Inferentia', co2Tons: 148000, models: ['Llama', 'Titan', 'Claude'], cooling: 'High-efficiency chilled water', waterRisk: 'High', gridRisk: 'Medium', jobs: '560 / 1400', role: 'ASEAN low-latency inference fabric.' },
  { id: 'aws-5', name: 'AWS AP (Tokyo)', operator: 'AWS', lat: 35.68, lon: 139.76, status: 'Operational', powerMW: 330, estGPUs: 75000, chipType: 'NVIDIA A100 / H100', co2Tons: 122000, models: ['Llama', 'Mistral', 'Titan'], cooling: 'Liquid-assist racks', waterRisk: 'Medium', gridRisk: 'Low', jobs: '520 / 1300', role: 'Japan enterprise AI serving and DR.' },
  { id: 'aws-6', name: 'AWS AP (Sydney)', operator: 'AWS', lat: -33.86, lon: 151.2, status: 'Expansion', powerMW: 250, estGPUs: 57000, chipType: 'NVIDIA H100', co2Tons: 105000, models: ['Llama', 'Claude', 'Titan'], cooling: 'Hybrid free cooling', waterRisk: 'Medium', gridRisk: 'Low', jobs: '430 / 1200', role: 'Oceania model hosting and compliance workloads.' },

  { id: 'az-1', name: 'Azure East US (Virginia)', operator: 'AZURE', lat: 38.9, lon: -77.2, status: 'Operational', powerMW: 680, estGPUs: 155000, chipType: 'NVIDIA H100 / Maia 100', co2Tons: 235000, models: ['GPT family', 'Phi', 'Llama', 'Mistral'], cooling: 'Direct-to-chip rollout', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '1300 / 3900', role: 'Large OpenAI-aligned serving and enterprise Copilot backend.' },
  { id: 'az-2', name: 'Azure West Europe (Netherlands)', operator: 'AZURE', lat: 52.37, lon: 4.9, status: 'Operational', powerMW: 510, estGPUs: 116000, chipType: 'NVIDIA H100 / A100', co2Tons: 82000, models: ['GPT family', 'Phi', 'Llama'], cooling: 'Air + rear-door heat exchangers', waterRisk: 'Low', gridRisk: 'Low', jobs: '900 / 2600', role: 'EU regulated AI workloads and model APIs.' },
  { id: 'az-3', name: 'Azure Sweden Central', operator: 'AZURE', lat: 60.67, lon: 17.14, status: 'Operational', powerMW: 340, estGPUs: 77000, chipType: 'NVIDIA H100 (H100 NVL)', co2Tons: 5000, models: ['GPT family', 'Phi', 'Llama'], cooling: 'Low-ambient free cooling', waterRisk: 'Low', gridRisk: 'Low', jobs: '580 / 1700', role: 'Low-carbon training cluster placement.' },
  { id: 'az-4', name: 'Azure Japan East', operator: 'AZURE', lat: 35.68, lon: 139.65, status: 'Operational', powerMW: 300, estGPUs: 68000, chipType: 'NVIDIA H100 / A100', co2Tons: 110000, models: ['GPT family', 'Phi'], cooling: 'Liquid-assist', waterRisk: 'Medium', gridRisk: 'Low', jobs: '490 / 1350', role: 'Japanese language model deployment hub.' },
  { id: 'az-5', name: 'Azure Australia East', operator: 'AZURE', lat: -33.87, lon: 151.2, status: 'Expansion', powerMW: 270, estGPUs: 61000, chipType: 'NVIDIA H100', co2Tons: 115000, models: ['GPT family', 'Llama', 'Phi'], cooling: 'Hybrid mechanical + economizer', waterRisk: 'Medium', gridRisk: 'Low', jobs: '430 / 1180', role: 'Regional sovereign hosting.' },
  { id: 'az-6', name: 'Azure Qatar Central', operator: 'AZURE', lat: 25.29, lon: 51.53, status: 'Announced', powerMW: 180, estGPUs: 41000, chipType: 'NVIDIA H100 / B200 (Planned)', co2Tons: 85000, models: ['GPT family', 'Phi'], cooling: 'High-density liquid planned', waterRisk: 'High', gridRisk: 'Medium', jobs: '290 / 900', role: 'MENA low-latency inference entrypoint.' },

  { id: 'gcp-1', name: 'Google Council Bluffs (Iowa)', operator: 'GOOGLE', lat: 41.26, lon: -95.86, status: 'Operational', powerMW: 590, estGPUs: 135000, chipType: 'TPU v4 / v5p', co2Tons: 210000, models: ['Gemini', 'Imagen', 'Llama'], cooling: 'Liquid + evaporative', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '960 / 3000', role: 'Core Gemini training and TPU orchestration region.' },
  { id: 'gcp-2', name: 'Google The Dalles (Oregon)', operator: 'GOOGLE', lat: 45.59, lon: -121.18, status: 'Operational', powerMW: 470, estGPUs: 107000, chipType: 'TPU v4 / NVIDIA H100', co2Tons: 60000, models: ['Gemini', 'Imagen', 'Codey'], cooling: 'River/air-assisted cooling', waterRisk: 'Medium', gridRisk: 'Low', jobs: '820 / 2400', role: 'West inference + multimodal serving.' },
  { id: 'gcp-3', name: 'Google Hamina (Finland)', operator: 'GOOGLE', lat: 60.57, lon: 27.2, status: 'Operational', powerMW: 310, estGPUs: 70000, chipType: 'TPU v4 / NVIDIA A100', co2Tons: 8000, models: ['Gemini', 'Gemma'], cooling: 'Seawater cooling', waterRisk: 'Low', gridRisk: 'Low', jobs: '500 / 1450', role: 'Low-carbon EU model capacity.' },
  { id: 'gcp-4', name: 'Google St. Ghislain (Belgium)', operator: 'GOOGLE', lat: 50.45, lon: 3.82, status: 'Operational', powerMW: 320, estGPUs: 73000, chipType: 'TPU v4 / v5e', co2Tons: 45000, models: ['Gemini', 'Gemma', 'Imagen'], cooling: 'Economizer + liquid assist', waterRisk: 'Low', gridRisk: 'Low', jobs: '520 / 1500', role: 'EU enterprise API footprint.' },
  { id: 'gcp-5', name: 'Google Singapore', operator: 'GOOGLE', lat: 1.35, lon: 103.82, status: 'Operational', powerMW: 290, estGPUs: 66000, chipType: 'TPU v4 / NVIDIA H100', co2Tons: 120000, models: ['Gemini', 'Gemma'], cooling: 'Chilled water optimized', waterRisk: 'High', gridRisk: 'Medium', jobs: '470 / 1300', role: 'Southeast Asia model access node.' },
  { id: 'gcp-6', name: 'Google Milan Region', operator: 'GOOGLE', lat: 45.46, lon: 9.19, status: 'Announced', powerMW: 200, estGPUs: 45000, chipType: 'TPU v5p / NVIDIA B200', co2Tons: 55000, models: ['Gemini', 'Gemma'], cooling: 'Planned high-density liquid', waterRisk: 'Medium', gridRisk: 'Low', jobs: '320 / 980', role: 'Southern Europe sovereignty coverage.' },

  { id: 'meta-1', name: 'Meta Altoona (Iowa)', operator: 'META', lat: 41.65, lon: -93.48, status: 'Operational', powerMW: 430, estGPUs: 98000, chipType: 'NVIDIA H100 / MTIA', co2Tons: 155000, models: ['Llama family', 'Multimodal assistants'], cooling: 'Air + liquid pilots', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '710 / 2200', role: 'Large social graph + model serving backend.' },
  { id: 'meta-2', name: 'Meta New Albany (Ohio)', operator: 'META', lat: 40.08, lon: -82.81, status: 'Operational', powerMW: 520, estGPUs: 118000, chipType: 'NVIDIA H100 / A100', co2Tons: 195000, models: ['Llama family', 'Recommender models'], cooling: 'Hybrid direct-to-chip', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '860 / 2700', role: 'US east personalized ranking and generative serving.' },
  { id: 'meta-3', name: 'Meta Clonee (Ireland)', operator: 'META', lat: 53.41, lon: -6.47, status: 'Operational', powerMW: 300, estGPUs: 68000, chipType: 'NVIDIA H100', co2Tons: 80000, models: ['Llama family'], cooling: 'Free-air optimized', waterRisk: 'Low', gridRisk: 'Medium', jobs: '500 / 1500', role: 'EU data residency workload split.' },
  { id: 'meta-4', name: 'Meta Odense (Denmark)', operator: 'META', lat: 55.4, lon: 10.39, status: 'Expansion', powerMW: 350, estGPUs: 80000, chipType: 'NVIDIA H100 / B200', co2Tons: 12000, models: ['Llama family', 'Vision encoders'], cooling: 'Heat recovery + liquid', waterRisk: 'Low', gridRisk: 'Low', jobs: '560 / 1650', role: 'Nordic low-carbon AI capacity growth.' },

  { id: 'orcl-1', name: 'Oracle Ashburn', operator: 'ORACLE', lat: 39.04, lon: -77.49, status: 'Operational', powerMW: 280, estGPUs: 64000, chipType: 'NVIDIA H100 / A100', co2Tons: 98000, models: ['Cohere Command', 'Llama', 'OCI Generative AI'], cooling: 'Air + rear-door HX', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '420 / 1200', role: 'OCI AI enterprise workloads.' },
  { id: 'orcl-2', name: 'Oracle Frankfurt', operator: 'ORACLE', lat: 50.11, lon: 8.68, status: 'Operational', powerMW: 220, estGPUs: 50000, chipType: 'NVIDIA H100', co2Tons: 35000, models: ['Cohere Command', 'Llama'], cooling: 'Economizer-centric', waterRisk: 'Low', gridRisk: 'Low', jobs: '340 / 980', role: 'EU mission-critical model inference.' },
  { id: 'orcl-3', name: 'Oracle Mumbai', operator: 'ORACLE', lat: 19.08, lon: 72.88, status: 'Expansion', powerMW: 260, estGPUs: 59000, chipType: 'NVIDIA H100', co2Tons: 110000, models: ['Llama', 'OCI GenAI'], cooling: 'High-density liquid design', waterRisk: 'High', gridRisk: 'Medium', jobs: '390 / 1100', role: 'India growth market model serving.' },

  { id: 'ibm-1', name: 'IBM Dallas', operator: 'IBM', lat: 32.78, lon: -96.8, status: 'Operational', powerMW: 170, estGPUs: 38000, chipType: 'NVIDIA A100 / IBM Telum', co2Tons: 60000, models: ['Granite', 'Watsonx'], cooling: 'Air + liquid row cooling', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '280 / 760', role: 'Watsonx model hosting and enterprise AI.' },
  { id: 'ibm-2', name: 'IBM Frankfurt', operator: 'IBM', lat: 50.12, lon: 8.68, status: 'Operational', powerMW: 150, estGPUs: 34000, chipType: 'NVIDIA A100', co2Tons: 25000, models: ['Granite', 'Watsonx'], cooling: 'Air-side economization', waterRisk: 'Low', gridRisk: 'Low', jobs: '250 / 700', role: 'EU regulated IBM AI workloads.' },

  { id: 'cw-1', name: 'CoreWeave New Jersey', operator: 'COREWEAVE', lat: 40.73, lon: -74.17, status: 'Operational', powerMW: 210, estGPUs: 48000, chipType: 'NVIDIA H100 HGX', co2Tons: 75000, models: ['Llama', 'Mistral', 'Stable Diffusion', 'Video models'], cooling: 'Liquid-heavy GPU clusters', waterRisk: 'Medium', gridRisk: 'High', jobs: '330 / 920', role: 'GPU-dense model training and fine-tuning.' },
  { id: 'cw-2', name: 'CoreWeave Illinois', operator: 'COREWEAVE', lat: 41.88, lon: -87.63, status: 'Expansion', powerMW: 230, estGPUs: 52000, chipType: 'NVIDIA H100 / B200', co2Tons: 82000, models: ['Llama', 'Mistral', 'Diffusion models'], cooling: 'Direct-to-chip planned', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '350 / 980', role: 'Midwest training + backup inference pool.' },

  { id: 'colo-1', name: 'Digital Realty Ashburn', operator: 'COLOCATION', lat: 39.03, lon: -77.48, status: 'Operational', powerMW: 260, estGPUs: 59000, chipType: 'Mixed NVIDIA H100/A100', co2Tons: 92000, models: ['Hosted GPU clouds', 'Private Llama clusters'], cooling: 'Tenant-specific liquid retrofits', waterRisk: 'Medium', gridRisk: 'High', jobs: '410 / 1200', role: 'Multi-tenant AI backbone interconnection hub.' },
  { id: 'colo-2', name: 'Digital Realty Singapore', operator: 'COLOCATION', lat: 1.29, lon: 103.85, status: 'Operational', powerMW: 190, estGPUs: 43000, chipType: 'NVIDIA H100', co2Tons: 78000, models: ['Hosted enterprise copilots'], cooling: 'Chilled water systems', waterRisk: 'High', gridRisk: 'Medium', jobs: '300 / 860', role: 'APAC enterprise colocation AI services.' },
  { id: 'colo-3', name: 'QTS Phoenix Metro', operator: 'COLOCATION', lat: 33.45, lon: -112.07, status: 'Expansion', powerMW: 310, estGPUs: 70000, chipType: 'NVIDIA H100 / H200', co2Tons: 110000, models: ['Hyperscaler GPU pods', 'Private model serving'], cooling: 'Liquid retrofit in progress', waterRisk: 'High', gridRisk: 'Medium', jobs: '500 / 1500', role: 'Southwest hyperscale AI growth corridor.' },
  { id: 'colo-4', name: 'QTS Atlanta Metro', operator: 'COLOCATION', lat: 33.75, lon: -84.39, status: 'Operational', powerMW: 220, estGPUs: 50000, chipType: 'NVIDIA A100', co2Tons: 78000, models: ['Hybrid cloud model hosting'], cooling: 'Air-side + adiabatic', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '360 / 1020', role: 'Southeast enterprise and media AI serving.' },

  { id: 'nv-1', name: 'NVIDIA DGX Cloud Hub (Santa Clara)', operator: 'NVIDIA', lat: 37.35, lon: -121.95, status: 'Operational', powerMW: 120, estGPUs: 27000, chipType: 'NVIDIA H100 / B200 (Testing)', co2Tons: 35000, models: ['NIM services', 'Llama', 'Nemotron'], cooling: 'Advanced liquid racks', waterRisk: 'Low', gridRisk: 'Medium', jobs: '210 / 560', role: 'Reference AI platform and partner enablement.' },
  { id: 'xai-1', name: 'xAI Colossus (Memphis)', operator: 'XAI', lat: 35.15, lon: -90.05, status: 'Operational', powerMW: 260, estGPUs: 100000, chipType: 'NVIDIA H100 (Direct liquid)', co2Tons: 92000, models: ['Grok family'], cooling: 'Containerized liquid + air hybrid', waterRisk: 'Medium', gridRisk: 'High', jobs: '340 / 1000', role: 'Fast-iteration frontier model training site.' },

  { id: 'cn-1', name: 'Alibaba Zhangbei Cluster', operator: 'CHINA', lat: 41.15, lon: 114.7, status: 'Operational', powerMW: 390, estGPUs: 89000, chipType: 'H20 / Ascend 910B', co2Tons: 155000, models: ['Qwen family', 'Industry LLMs'], cooling: 'Air + direct liquid pilots', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '620 / 1800', role: 'Large-scale domestic foundation model hosting.' },
  { id: 'cn-2', name: 'Tencent Qingyuan Cluster', operator: 'CHINA', lat: 23.68, lon: 113.06, status: 'Operational', powerMW: 320, estGPUs: 73000, chipType: 'Ascend 910B / H20', co2Tons: 135000, models: ['Hunyuan family', 'Multimodal assistants'], cooling: 'Hybrid chilled water', waterRisk: 'High', gridRisk: 'Medium', jobs: '520 / 1500', role: 'South China inference and AI cloud serving.' },
  { id: 'cn-3', name: 'Baidu Yangquan AI DC', operator: 'CHINA', lat: 37.86, lon: 113.58, status: 'Expansion', powerMW: 280, estGPUs: 64000, chipType: 'Kunlun / Ascend 910B', co2Tons: 110000, models: ['ERNIE family', 'Autonomous driving models'], cooling: 'Free-air + liquid assist', waterRisk: 'Medium', gridRisk: 'Medium', jobs: '430 / 1300', role: 'Search + autonomous AI workloads.' },
  { id: 'cn-4', name: 'Huawei Guizhou Region', operator: 'CHINA', lat: 26.65, lon: 106.63, status: 'Operational', powerMW: 340, estGPUs: 77000, chipType: 'Ascend 910B (Full Stack)', co2Tons: 15000, models: ['Pangu family', 'Enterprise copilot models'], cooling: 'Low-ambient optimized', waterRisk: 'Medium', gridRisk: 'Low', jobs: '570 / 1700', role: 'Domestic enterprise model platform backend.' },
  { id: 'cn-5', name: 'ByteDance Ulanqab Hub', operator: 'CHINA', lat: 41.03, lon: 113.12, status: 'Expansion', powerMW: 300, estGPUs: 68000, chipType: 'NVIDIA H20 / Ascend', co2Tons: 115000, models: ['Recommendation + video generation models'], cooling: 'Air + liquid retrofit', waterRisk: 'Low', gridRisk: 'Medium', jobs: '480 / 1400', role: 'Massive recommender and media model infrastructure.' },
  { id: 'orbital-1', name: 'NEXUS-1 Orbital Node', operator: 'AWS', lat: 0, lon: 0, status: 'Announced', powerMW: 1200, estGPUs: 350000, chipType: 'Radiation-Hardened Photonic AI', co2Tons: 0, models: ['Next-Gen Frontier Models'], cooling: 'Radiative vacuum cooling', waterRisk: 'None', gridRisk: 'None', jobs: '50 remote / 200 ground', role: 'Space-based compute escaping Earth\'s power/climate constraints.' }
];

const CENTER_ONLINE_YEAR = {
  'aws-1': 2019, 'aws-2': 2019, 'aws-3': 2020, 'aws-4': 2021, 'aws-5': 2021, 'aws-6': 2025,
  'az-1': 2019, 'az-2': 2020, 'az-3': 2021, 'az-4': 2020, 'az-5': 2025, 'az-6': 2028,
  'gcp-1': 2019, 'gcp-2': 2019, 'gcp-3': 2020, 'gcp-4': 2020, 'gcp-5': 2021, 'gcp-6': 2027,
  'meta-1': 2020, 'meta-2': 2021, 'meta-3': 2020, 'meta-4': 2025,
  'orcl-1': 2021, 'orcl-2': 2021, 'orcl-3': 2026,
  'ibm-1': 2021, 'ibm-2': 2022,
  'cw-1': 2023, 'cw-2': 2026,
  'colo-1': 2020, 'colo-2': 2021, 'colo-3': 2026, 'colo-4': 2022,
  'nv-1': 2024, 'xai-1': 2024,
  'cn-1': 2022, 'cn-2': 2022, 'cn-3': 2026, 'cn-4': 2023, 'cn-5': 2026,
  'orbital-1': 2030
};

DATA_CENTERS.forEach((center) => {
  const mappedYear = CENTER_ONLINE_YEAR[center.id];
  if (mappedYear == null) {
    throw new Error(`Missing CENTER_ONLINE_YEAR entry for center id: ${center.id}`);
  }
  center.onlineYear = mappedYear;
});

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
const historyMarkers = new THREE.Group();
const historyHitTargets = new THREE.Group();
const arcs = new THREE.Group();
const loopGroup = new THREE.Group();
const chinaFlowGroup = new THREE.Group();
globeGroup.add(markers, markerHitTargets, historyMarkers, historyHitTargets, arcs, loopGroup, chinaFlowGroup);
historyMarkers.visible = false;

const AI_BREAKTHROUGHS = [
  { year: 1956, name: 'Dartmouth Workshop', loc: 'Hanover, NH', lat: 43.7, lon: -72.2, desc: 'The birth of "Artificial Intelligence" as a field of study.' },
  { year: 1997, name: 'Deep Blue vs Kasparov', loc: 'New York, NY', lat: 40.7, lon: -74.0, desc: 'IBM\'s Deep Blue becomes the first computer to beat a reigning world chess champion.' },
  { year: 2012, name: 'AlexNet Breakthrough', loc: 'Toronto, Canada', lat: 43.6, lon: -79.3, desc: 'Deep learning revolution: A neural network shatters image recognition records.' },
  { year: 2016, name: 'AlphaGo Victory', loc: 'Seoul, South Korea', lat: 37.5, lon: 126.9, desc: 'Google DeepMind\'s AlphaGo beats Lee Sedol, a milestone in intuitive AI.' },
  { year: 2017, name: 'Transformer Architecture', loc: 'Mountain View, CA', lat: 37.4, lon: -122.0, desc: 'Google researchers publish "Attention Is All You Need", the foundation for GPT.' }
];

AI_BREAKTHROUGHS.forEach((bt) => {
  const position = latLonToVector3(bt.lat, bt.lon, globeRadius + 0.04);
  const marker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.045, 0),
    new THREE.MeshBasicMaterial({ color: 0xffd700 }) // Gold for breakthroughs
  );
  marker.userData = { ...bt, isBreakthrough: true };
  marker.position.copy(position);
  historyMarkers.add(marker);

  const hitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  hitTarget.userData = marker.userData;
  hitTarget.position.copy(position);
  historyHitTargets.add(hitTarget);
});

window.toggleHistoryMode = () => {
  historyMarkers.visible = !historyMarkers.visible;
  historyHitTargets.visible = historyMarkers.visible;
  const btn = document.getElementById('btn-history');
  if (btn) btn.innerText = historyMarkers.visible ? 'HIDE BREAKTHROUGHS' : 'AI BREAKTHROUGHS';
};

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
const centerSceneMeta = new Map();
DATA_CENTERS.forEach((center) => {
  const position = latLonToVector3(center.lat, center.lon, globeRadius + 0.03);
  const color = statusColor(center.status);
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.036, 10, 10),
    new THREE.MeshStandardMaterial({ 
      color: color,
      emissive: color,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8
    })
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
    const arc = createArc(center, hq, 0x70f8c6, 0.12, 2.7);
    arcs.add(arc);
    centerSceneMeta.set(center.id, { marker, hitTarget, arc });
  } else {
    centerSceneMeta.set(center.id, { marker, hitTarget, arc: null });
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
let currentTimelineYear = 2019;
let timelineTimer = null;
let spaceTransition = 0;
let simplifiedMode = false;
let storyModeActive = false;
let bubbleLabExpanded = false;

const SPACE_ZOOM_START = 14;
const SPACE_ZOOM_FULL = 36;

controls.addEventListener('start', () => {
  draggedSincePointerDown = true;
  suppressClickUntil = performance.now() + 120;
  focusPoint = null;
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
  
  const fin = BUBBLE_OPERATORS[center.operator] || { debtToEquity: 'N/A', cashB: 'N/A', riskScore: 'N/A' };

  return [
    `<div style="font-size:13px;color:#adffd8;margin-bottom:8px;">${center.name}</div>`,
    `<div><b>Operator:</b> ${center.operator}</div>`,
    `<div><b>Status:</b> ${center.status}</div>`,
    `<div style="margin-top:8px;border-top:1px solid #333;padding-top:8px;"><b>Operator Financial Health:</b></div>`,
    `<div>Debt-to-Equity: ${fin.debtToEquity}x</div>`,
    `<div>Cash Reserves: $${fin.cashB}B</div>`,
    `<div>Bubble Risk Base: ${fin.riskScore}/100</div>`,
    `<div style="margin-top:8px;border-top:1px solid #333;padding-top:8px;"><b>Technical Specs:</b></div>`,
    `<div>Estimated Power: ${center.powerMW} MW</div>`,
    `<div>Estimated Capacity: ${center.estGPUs.toLocaleString()} GPUs</div>`,
    `<div>Hardware Spec: <span style="color:#ffd700;">${center.chipType}</span></div>`,
    `<div>Role: ${center.role}</div>`,
    `<div style="margin-top:8px;"><b>Model Coverage (Likely):</b></div>`,
    `<div>${modelTags || 'No model details available.'}</div>`,
    `<div style="margin-top:8px;"><b>Environmental Impact:</b></div>`,
    `<div>Annual CO2 Output: <span style="color:#ff8787;">${center.co2Tons.toLocaleString()} Tons</span></div>`,
    `<div>Cooling: ${center.cooling}</div>`,
    `<div>Water Stress: ${center.waterRisk}</div>`,
    `<div>Grid Carbon Pressure: ${center.gridRisk}</div>`,
    `<div>Local Employment: ${center.jobs}</div>`,
    `<div style="margin-top:8px;"><b>Learn More:</b></div>`,
    `<div>${links}</div>`,
    `<div style="margin-top:10px;opacity:0.6;font-size:9px;">MODEL SUPPORT + IMPACT VALUES ARE CURATED ESTIMATES FROM PUBLIC OPERATOR DISCLOSURES.</div>`
  ].join('');
}

function riskBand(score) {
  if (score >= 68) return { label: 'HIGH', className: 'risk-high' };
  if (score >= 42) return { label: 'MEDIUM', className: 'risk-med' };
  return { label: 'LOW', className: 'risk-low' };
}

function simulateOperator(operator, params) {
  const base = BUBBLE_OPERATORS[operator];
  if (!base) return null;

  const utilFactor = params.utilization / 78;
  const revenue = base.revenueB * (1 + params.revenueGrowth / 100) * (0.78 + utilFactor * 0.22);
  const aiRevenue = revenue * base.aiShare * utilFactor;

  const powerOpex = base.capexB * 0.11 * (1 + params.powerInflation / 100) * (0.86 + utilFactor * 0.14);
  const operatingProfit = revenue * base.ebitdaMargin - powerOpex;
  const interestRate = base.baseRate + params.rateShock;
  const interestCost = base.debtB * (interestRate / 100);
  const maintenanceCapex = base.capexB * 0.36;
  const freeCash = operatingProfit - interestCost - maintenanceCapex;

  const debtToOp = base.debtB / Math.max(operatingProfit, 0.1);
  const coverage = operatingProfit / Math.max(interestCost, 0.1);
  const capexRatio = base.capexB / Math.max(revenue, 0.1);

  // Mark Tilbury's focus: Negative FCF and high debt coverage risk
  const score = Math.max(
    0,
    Math.min(
      100,
      debtToOp * 8 +
        Math.max(0, 3 - coverage) * 15 +
        Math.max(0, capexRatio - 0.2) * 100 +
        Math.max(0, -freeCash / 5) * 25 +
        Math.max(0, 0.8 - utilFactor) * 40
    )
  );

  return {
    operator,
    revenue,
    aiRevenue,
    operatingProfit,
    freeCash,
    debtToOp,
    coverage,
    capexRatio,
    score,
    risk: riskBand(score),
    debtToEquity: base.debtToEquity,
    cashB: base.cashB
  };
}

function currentBubbleParams() {
  return {
    rateShock: Number.parseFloat(rateShockInput.value),
    utilization: Number.parseFloat(utilizationInput.value),
    powerInflation: Number.parseFloat(powerInflationInput.value),
    revenueGrowth: Number.parseFloat(revenueGrowthInput.value)
  };
}

function formatB(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}B`;
}

function updateBubbleLab() {
  const params = currentBubbleParams();
  rateShockVal.innerText = `${params.rateShock.toFixed(1)}%`;
  utilizationVal.innerText = `${params.utilization.toFixed(0)}%`;
  powerInflationVal.innerText = `${params.powerInflation.toFixed(0)}%`;
  revenueGrowthVal.innerText = `${params.revenueGrowth.toFixed(0)}%`;

  const results = Object.keys(BUBBLE_OPERATORS)
    .map((operator) => {
      const res = simulateOperator(operator, params);
      const maturityPressure = currentTimelineYear >= BUBBLE_OPERATORS[operator].maturityYear ? 1.25 : 1.0;
      res.score = Math.min(100, res.score * maturityPressure); // Inflate risk if near/past maturity year
      res.risk = riskBand(res.score);
      return res;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const marketBubble = results.reduce((sum, row) => sum + row.score, 0) / Math.max(results.length, 1);
  const atRisk = results.filter((row) => row.score >= 68).length;
  const globalRisk = riskBand(marketBubble);

  const quickSummaryEl = document.getElementById('bubble-quick-summary');
  if (quickSummaryEl) {
    quickSummaryEl.innerHTML = `BUBBLE INDEX: <span class="${globalRisk.className}">${marketBubble.toFixed(1)} / 100 (${globalRisk.label})</span> — ${atRisk}/${results.length} HIGH RISK`;
  }

  bubbleSummary.innerHTML = [
    `<div style="font-size:10px;margin-bottom:8px;border-bottom:1px solid #333;padding-bottom:4px;">MARKET STRESS ANALYSIS</div>`,
    `GLOBAL BUBBLE INDEX: <span class="${globalRisk.className}">${marketBubble.toFixed(1)} / 100 (${globalRisk.label})</span><br>`,
    `OPERATORS IN HIGH-RISK ZONE: ${atRisk}/${results.length}<br>`,
    `<div style="margin-top:8px;font-size:9px;opacity:0.8;color:#ff7676;"><b>MATURITY WALL WARNING:</b> MAJOR REFINANCING DUE IN 2025–2026. RE-PRICING DEBT AT HIGHER RATES IS THE PRIMARY BUBBLE TRIGGER.</div>`
  ].join('');

  bubbleGrid.innerHTML = `
    <table id="bubble-table">
      <thead>
        <tr>
          <th>Operator</th>
          <th>Risk</th>
          <th>Cash</th>
          <th>D/E</th>
          <th>FCF</th>
        </tr>
      </thead>
      <tbody>
        ${results
          .map((row) => {
            const active = row.operator === (DATA_CENTERS.find((center) => center.id === activeCenterId)?.operator ?? '');
            return `
              <tr style="${active ? 'background:#173226;' : ''}">
                <td>${row.operator}</td>
                <td class="${row.risk.className}">${row.score.toFixed(0)}</td>
                <td>$${row.cashB}B</td>
                <td>${row.debtToEquity}x</td>
                <td>${formatB(row.freeCash)}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;
}

function timelineMetrics(year) {
  return TIMELINE_METRICS.find((item) => item.year === year) ?? TIMELINE_METRICS[0];
}

function syncBubbleToTimeline(year) {
  const m = timelineMetrics(year);
  rateShockInput.value = m.rateShock.toFixed(1);
  utilizationInput.value = String(m.util);
  powerInflationInput.value = String(m.powerInflation);
  revenueGrowthInput.value = String(m.growth);
}

const CHART_WIDTH = 288;
const CHART_HEIGHT = 80;
const CHART_MAX_Y = 120;
const CHART_COLOR_CAPEX = '#7ef0c2';
const CHART_COLOR_DEBT = '#ffbf7f';
const CHART_COLOR_BUBBLE = '#ff7676';

function renderTimelineChart() {
  const x = (idx) => (idx / (TIMELINE_METRICS.length - 1)) * (CHART_WIDTH - 8) + 4;
  const y = (val) => CHART_HEIGHT - ((val / CHART_MAX_Y) * (CHART_HEIGHT - 12) + 6);

  const pathFor = (key) =>
    TIMELINE_METRICS.map((row, idx) => `${idx === 0 ? 'M' : 'L'}${x(idx).toFixed(1)},${y(row[key]).toFixed(1)}`).join(' ');

  const currentIdx = TIMELINE_METRICS.findIndex((row) => row.year === currentTimelineYear);
  const cx = currentIdx >= 0 ? x(currentIdx).toFixed(1) : '4';

  timelineChartEl.innerHTML = `
    <svg viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" width="100%" height="${CHART_HEIGHT}" preserveAspectRatio="none">
      <path d="${pathFor('capex')}" fill="none" stroke="${CHART_COLOR_CAPEX}" stroke-width="1.8" />
      <path d="${pathFor('debt')}" fill="none" stroke="${CHART_COLOR_DEBT}" stroke-width="1.6" />
      <path d="${pathFor('bubble')}" fill="none" stroke="${CHART_COLOR_BUBBLE}" stroke-width="1.6" />
      <line x1="${cx}" y1="4" x2="${cx}" y2="${CHART_HEIGHT - 4}" stroke="#ffffff55" stroke-width="1" />
    </svg>
  `;
}

function renderTimelineDeepDive(year) {
  const deep = TIMELINE_DEEP_DIVE[year] ?? TIMELINE_DEEP_DIVE[2019];
  const m = timelineMetrics(year);
  const maturityPressure =
    year <= 2022 ? 'LOW' : year <= 2025 ? 'MEDIUM' : year <= 2027 ? 'HIGH' : 'MEDIUM';

  timelineDeepDiveEl.innerHTML = [
    `<div><span class="deep-label">DRIVER:</span> ${deep.driver}</div>`,
    `<div><span class="deep-label">DEBT SIGNAL:</span> ${deep.debt}</div>`,
    `<div><span class="deep-label">TRIGGER:</span> ${deep.trigger}</div>`,
    `<div><span class="deep-label">RESPONSE:</span> ${deep.response}</div>`,
    `<div style="margin-top:6px;"><span class="deep-label">MATURITY PRESSURE:</span> ${maturityPressure}</div>`,
    `<div><span class="deep-label">UTILIZATION BASELINE:</span> ${m.util}%</div>`
  ].join('');
}

function timelineEntry(year) {
  return TIMELINE.find((item) => item.year === year) ?? TIMELINE[0];
}

function applyTimelineVisibility() {
  const visibleCenters = DATA_CENTERS.filter((center) => center.onlineYear <= currentTimelineYear);
  const visibleSet = new Set(visibleCenters.map((center) => center.id));

  centerSceneMeta.forEach((meta, centerId) => {
    const isVisible = visibleSet.has(centerId);
    meta.marker.visible = isVisible;
    meta.hitTarget.visible = isVisible;
    if (meta.arc) meta.arc.visible = isVisible;
  });

  if (activeCenterId && !visibleSet.has(activeCenterId)) {
    const fallback = visibleCenters[visibleCenters.length - 1];
    if (fallback) selectCenter(fallback, false);
  }

  updateStats(visibleCenters);
  renderCenterList(searchInput.value || '');
}

function setTimelineYear(year) {
  const clamped = Math.max(2019, Math.min(2030, Math.round(year)));
  currentTimelineYear = clamped;

  const entry = timelineEntry(clamped);
  timelineYearEl.innerText = String(clamped);
  timelinePhaseEl.innerText = entry.phase;
  timelineDescEl.innerText = entry.desc;
  timelineSlider.value = String(clamped);

  syncBubbleToTimeline(clamped);
  updateBubbleLab();
  renderTimelineChart();
  renderTimelineDeepDive(clamped);
  applyTimelineVisibility();
}

function selectCenter(center, focus = true) {
  activeCenterId = center.id;
  
  // Update info content but respect current mode
  const siteHtml = simplifiedMode ? renderSimplifiedInfoHtml(center) : centerDetailsHtml(center);
  const infoContentEl = document.getElementById('info-content');
  if (infoContentEl && currentInfoMode === 'site') {
    infoContentEl.classList.remove('content-update');
    void infoContentEl.offsetWidth; // Trigger reflow
    infoContentEl.innerHTML = siteHtml;
    infoContentEl.classList.add('content-update');
  }
  // Store the site HTML so we can switch back to it
  lastSiteHtml = siteHtml;

  markerById.forEach((marker, id) => {
    const material = marker.material;
    if (!material || Array.isArray(material)) return;
    const baseColor = new THREE.Color(statusColor(marker.userData.status));
    material.color.copy(baseColor);
    material.emissive.copy(baseColor);
    marker.scale.setScalar(id === center.id ? 1.65 : 1);
    if (id === center.id) {
      material.color.setHex(0x94ffd9);
      material.emissive.setHex(0x94ffd9);
      material.emissiveIntensity = 0.8;
    } else {
      material.emissiveIntensity = 0.4;
    }
  });

  if (focus) {
    focusPoint = latLonToVector3(center.lat, center.lon, globeRadius + 0.03);
  }

  renderCenterList(searchInput.value || '');
  updateBubbleLab();
}

// ─── AI KNOWLEDGE BASE ─────────────────────────────────────────────────────────

let currentInfoMode = 'site';
let lastSiteHtml = '[SYSTEM ONLINE]<br>SELECT A SITE FOR FULL IMPACT + MODEL BREAKDOWN.';

const AI_KNOWLEDGE = {
  basics: {
    title: 'AI FUNDAMENTALS',
    content: `
      <b>What is AI?</b> AI refers to computer systems capable of performing tasks that typically require human intelligence.
      <br><br><b>How it works:</b> Modern AI (Machine Learning) uses Neural Networks inspired by the brain. They are trained on massive datasets to recognize patterns and make predictions.
      <br><br><b>Key Breakthroughs:</b>
      <ul>
        <li><b>The Transformer (2017):</b> The architecture behind GPT, allowing AI to process data in parallel and understand context.</li>
        <li><b>GPU Acceleration:</b> Using graphics chips (NVIDIA) to perform the billions of math operations needed for training.</li>
      </ul>
    `
  },
  climate: {
    title: 'AI & CLIMATE IMPACT',
    content: `
      <b>The Energy Cost:</b> Training a single large model can consume as much energy as 100 homes use in a year.
      <br><br><b>Water Usage:</b> Data centers require millions of gallons of water for cooling. Microsoft and Google have reported significant spikes in water consumption due to AI demand.
      <br><br><b>Global Warming:</b> As AI capex explodes, the demand for power is often met by fossil fuels when grids are stressed, complicating global net-zero goals.
    `
  },
  bubble: {
    title: 'THE DEBT BUBBLE',
    content: `
      <b>The Thesis:</b> Mark Tilbury and other analysts warn of an "AI Debt Bubble." Companies are borrowing billions to buy GPUs (Capex) before they have proven AI can generate matching profits (ROI).
      <br><br><b>The Tilbury Trigger:</b> The primary risk is an <b>Interest Rate Shock</b>. If rates stay high or rise, the cost of servicing massive GPU-linked debt becomes unsustainable for operators with thin margins.
      <br><br><b>The Risk:</b> If AI adoption slows, companies may be stuck with massive debt and underutilized hardware, leading to a market crash similar to the Dot-com bubble.
    `
  },
  warming: {
    title: 'AI & GLOBAL WARMING',
    content: `
      <b>The Paradox:</b> While AI can help optimize energy grids and discover new materials for solar cells, its own infrastructure is a major carbon driver.
      <br><br><b>Grid Strain:</b> In regions like Ireland and Northern Virginia, data centers now consume over 20% of total electricity, often forcing utilities to keep fossil fuel plants online longer than planned.
      <br><br><b>Net Zero Risk:</b> Hyperscalers (Google, Microsoft) have reported carbon footprint increases of 30-50% since the Gen-AI boom began, threatening their 2030 climate commitments.
    `
  }
};

window.showInfoMode = function(mode) {
  currentInfoMode = mode;
  const contentEl = document.getElementById('info-content');
  const btnSite = document.getElementById('btn-info-site');
  const btnKb = document.getElementById('btn-info-kb');

  contentEl.classList.remove('content-update');
  void contentEl.offsetWidth; // Trigger reflow

  if (mode === 'site') {
    contentEl.innerHTML = lastSiteHtml;
    btnSite.style.opacity = '1';
    btnKb.style.opacity = '0.5';
  } else {
    contentEl.innerHTML = `
      <div style="font-size:11px;color:#adffd8;margin-bottom:10px;">AI KNOWLEDGE BASE</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button onclick="renderKbArticle('basics')" style="padding:6px;font-size:9px;text-align:left;">1. AI BASICS</button>
        <button onclick="renderKbArticle('climate')" style="padding:6px;font-size:9px;text-align:left;">2. CLIMATE IMPACT</button>
        <button onclick="renderKbArticle('warming')" style="padding:6px;font-size:9px;text-align:left;">3. GLOBAL WARMING</button>
        <button onclick="renderKbArticle('bubble')" style="padding:6px;font-size:9px;text-align:left;">4. DEBT BUBBLE</button>
      </div>
      <div id="kb-article" style="margin-top:12px;font-size:10px;line-height:1.4;border-top:1px solid #333;padding-top:10px;">
        Select a topic above to learn more about AI history and risks.
      </div>
    `;
    btnSite.style.opacity = '0.5';
    btnKb.style.opacity = '1';
  }
  contentEl.classList.add('content-update');
};

window.renderKbArticle = function(key) {
  const article = AI_KNOWLEDGE[key];
  const artEl = document.getElementById('kb-article');
  if (artEl) {
    artEl.classList.remove('content-update');
    void artEl.offsetWidth;
    artEl.innerHTML = `<b>${article.title}</b><br><br>${article.content}`;
    artEl.classList.add('content-update');
  }
};

function renderCenterList(query = '') {
  const q = query.trim().toLowerCase();
  const filtered = DATA_CENTERS.filter((center) => {
    if (center.onlineYear > currentTimelineYear) return false;
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

function updateStats(centers = DATA_CENTERS) {
  const totalPower = centers.reduce((sum, center) => sum + center.powerMW, 0);
  const operational = centers.filter((center) => center.status === 'Operational').length;
  statSites.innerText = String(centers.length);
  statPower.innerText = `${totalPower} MW`;
  statOperational.innerText = String(operational);
}

searchInput.addEventListener('input', () => {
  renderCenterList(searchInput.value || '');
});

timelineSlider.addEventListener('input', (event) => {
  setTimelineYear(Number.parseInt(event.target.value, 10));
});

timelinePrevBtn.addEventListener('click', () => {
  setTimelineYear(currentTimelineYear - 1);
});

timelineNextBtn.addEventListener('click', () => {
  setTimelineYear(currentTimelineYear + 1);
});

function stopTimelinePlayback() {
  if (timelineTimer) {
    clearInterval(timelineTimer);
    timelineTimer = null;
  }
  timelinePlayBtn.innerText = 'PLAY';
}

function startTimelinePlayback() {
  stopTimelinePlayback();
  timelinePlayBtn.innerText = 'PAUSE';
  const speed = Number.parseInt(timelineSpeedSelect.value, 10) || 1300;
  timelineTimer = setInterval(() => {
    if (currentTimelineYear >= 2030) {
      stopTimelinePlayback();
      return;
    }
    setTimelineYear(currentTimelineYear + 1);
  }, speed);
}

timelinePlayBtn.addEventListener('click', () => {
  if (timelineTimer) {
    stopTimelinePlayback();
  } else {
    startTimelinePlayback();
  }
});

timelineSpeedSelect.addEventListener('change', () => {
  if (timelineTimer) startTimelinePlayback();
});

[rateShockInput, utilizationInput, powerInflationInput, revenueGrowthInput].forEach((input) => {
  input.addEventListener('input', updateBubbleLab);
});

bubbleBaseBtn.addEventListener('click', () => {
  rateShockInput.value = '0.5';
  utilizationInput.value = '82';
  powerInflationInput.value = '8';
  revenueGrowthInput.value = '18';
  updateBubbleLab();
});

bubbleStressBtn.addEventListener('click', () => {
  rateShockInput.value = '3.5';
  utilizationInput.value = '61';
  powerInflationInput.value = '37';
  revenueGrowthInput.value = '2';
  updateBubbleLab();
});

bubbleResetBtn.addEventListener('click', () => {
  rateShockInput.value = '0';
  utilizationInput.value = '78';
  powerInflationInput.value = '0';
  revenueGrowthInput.value = '12';
  updateBubbleLab();
});

function renderBreakthroughHtml(bt) {
  return `
    <div style="font-size:13px;color:#ffd700;margin-bottom:10px;">HISTORICAL BREAKTHROUGH: ${bt.year}</div>
    <div style="margin-bottom:8px;"><b>Name:</b> ${bt.name}</div>
    <div style="margin-bottom:8px;"><b>Location:</b> ${bt.loc}</div>
    <div style="margin-bottom:8px;line-height:1.5;"><b>Impact:</b> ${bt.desc}</div>
    <div style="margin-top:12px;opacity:0.6;font-size:9px;">THIS SITE REPRESENTS A PIVOTAL MOMENT IN THE EVOLUTION OF ARTIFICIAL INTELLIGENCE.</div>
  `;
}

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

  // Check history targets first if visible
  if (historyMarkers.visible) {
    const historyHits = raycaster.intersectObjects(historyHitTargets.children);
    if (historyHits.length > 0) {
      const bt = historyHits[0].object.userData;
      lastSiteHtml = renderBreakthroughHtml(bt);
      if (currentInfoMode === 'site') {
        document.getElementById('info-content').innerHTML = lastSiteHtml;
      }
      focusPoint = latLonToVector3(bt.lat, bt.lon, globeRadius + 0.04);
      return;
    }
  }

  const visibleHitTargets = markerHitTargets.children.filter((obj) => obj.visible);
  const hits = raycaster.intersectObjects(visibleHitTargets);
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

setTimelineYear(2019);
const initialCenter = DATA_CENTERS.find((center) => center.onlineYear <= 2019);
if (initialCenter) selectCenter(initialCenter, false);
updateBubbleLab();

// ─── STORY MODE ────────────────────────────────────────────────────────────────

const STORY_CHAPTERS = {
  2019: { title: 'THE FOUNDATION', headline: 'Transformer Breakthrough & Deep Learning', story: 'The 2017 "Attention Is All You Need" paper sets the stage. AI shifts from niche research to real products as Large Language Models (LLMs) begin to scale. Early data centers house experiments that will soon reshape the world.', stat: 'Compute used for largest AI training runs grows 10x per year' },
  2020: { title: 'DIGITAL ACCELERATION', headline: 'GPT-3 & The Pandemic Shock', story: 'Lockdowns force the world online. GPT-3 proves that scaling parameters leads to emergent reasoning. Cloud demand spikes 40%, and the GPU arms race begins as companies realize intelligence is the new oil.', stat: 'GPT-3 released with 175B parameters' },
  2021: { title: 'SCALE-UP ERA', headline: 'Foundation Models & Enterprise Bet', story: 'AI becomes serious business. Multi-year cloud contracts are signed to lock in GPU capacity. The environmental cost becomes visible as training runs consume massive amounts of electricity and water for cooling.', stat: 'Training compute doubles every ~6 months' },
  2022: { title: 'THE INFLECTION POINT', headline: 'ChatGPT & The Global AI Fever', story: 'ChatGPT launches, reaching 100M users in record time. Capital markets reward AI growth at any cost. Debt-backed expansion becomes easy to justify as the "Gold Rush" narrative overwhelms fiscal discipline.', stat: '$100B+ in new AI commitments announced in 90 days' },
  2023: { title: 'THE GPU SCRAMBLE', headline: 'NVIDIA H100s & The Scarcity War', story: 'GPU lease premiums and data center retrofits spike. The carbon footprint of AI training becomes a major climate concern. Execution risk rises as operators race to add capacity faster than the grid can support.', stat: 'H100 spot prices hit $40K+; 12-month wait lists form' },
  2024: { title: 'HYPERSCALE CAPEX CYCLE', headline: 'The $300B Infrastructure Gamble', story: 'Hyperscalers pledge massive capex. The narrative shifts to monetization pressure. If usage doesn\'t convert to revenue, the massive debt used to buy these GPUs could trigger a financial reset.', stat: '$300B+ combined 2024 AI capex pledges' },
  2025: { title: 'MONETIZATION TEST', headline: 'The ROI Crisis & Climate Pressure', story: 'Revenue per token becomes the metric that matters. AI\'s contribution to global warming via power consumption is now a global policy issue. Weak utilization starts to hurt margins and investor confidence.', stat: 'Data center power use projected to double by 2026' },
  2026: { title: 'DEBT REPRICING WINDOW', headline: 'The Bubble Meets Reality', story: 'Mark Tilbury\'s "AI Debt Bubble" thesis takes center stage. Debt maturities cluster, and interest coverage ratios deteriorate. The cost of capital rises, forcing a reckoning for over-leveraged operators.', stat: '$200B+ in AI-linked debt maturing 2026–2028' },
  2027: { title: 'CONSOLIDATION RISK', headline: 'Stranded Assets & Model Efficiency', story: 'Overbuilt GPU clusters risk becoming stranded assets. Efficiency gains in model architecture mean less compute is needed for the same output, leaving weaker data centers underutilized and underwater.', stat: 'Estimated 15–25% of installed AI capacity sits underutilized' },
  2028: { title: 'EFFICIENCY WARS', headline: 'Survival of the Leanest', story: 'Inference optimization slashes costs. Modern, liquid-cooled facilities survive while older air-cooled data centers struggle. The market bifurcates into "Compute-Rich" and "Debt-Burdened" players.', stat: 'Inference cost per 1M tokens falls 80% from 2023 peak' },
  2029: { title: 'RESET OR RE-ACCELERATION', headline: 'The Great AI Consolidation', story: 'High-utilization winners compound their advantage. Over-levered players sell assets. Climate-conscious "Green AI" becomes the new standard for the survivors of the debt cycle.', stat: 'Top-3 operators hold 60%+ of profitable AI workloads' },
  2030: { title: 'THE NEW BASELINE', headline: 'AI as a Global Utility', story: 'AI infrastructure matures into stable, utility-like economics. The frontier moves to energy abundance and space-based compute to escape Earth\'s power constraints. Debt discipline decided who made it.', stat: 'AI data center market consolidates to ~8 dominant operators' }
};

const storyOverlayEl = document.getElementById('story-overlay');
const storyYearEl = document.getElementById('story-year');
const storyTitleEl = document.getElementById('story-title');
const storyHeadlineEl = document.getElementById('story-headline');
const storyTextEl = document.getElementById('story-text');
const storyStatEl = document.getElementById('story-stat');
const storyProgressEl = document.getElementById('story-progress');
const storyPrevBtn = document.getElementById('story-prev');
const storyNextBtn = document.getElementById('story-next');
const storyExitBtn = document.getElementById('story-exit');
const storyPlayBtn = document.getElementById('story-play');
const storyModeBtn = document.getElementById('btn-story-mode');

let storyTimer = null;

function renderStoryCard(year) {
  const ch = STORY_CHAPTERS[year] ?? STORY_CHAPTERS[2019];
  const entry = timelineEntry(year);
  const idx = year - 2019;
  storyYearEl.innerText = String(year);
  storyTitleEl.innerText = ch.title;
  storyHeadlineEl.innerText = ch.headline;
  storyTextEl.innerText = ch.story;
  storyStatEl.innerText = ch.stat;

  const dots = Array.from({ length: 12 }, (_, i) =>
    `<span class="story-dot${i === idx ? ' active' : ''}"></span>`
  ).join('');
  storyProgressEl.innerHTML = dots;

  storyPrevBtn.disabled = year <= 2019;
  storyNextBtn.disabled = year >= 2030;
  storyNextBtn.innerText = year >= 2030 ? 'FINISH' : 'NEXT CHAPTER';

  setTimelineYear(year);

  // Auto-select a key center for the year to guide the camera
  const yearCenters = DATA_CENTERS.filter(c => c.onlineYear === year);
  if (yearCenters.length > 0) {
    selectCenter(yearCenters[0], true);
  }
}

function stopStoryPlayback() {
  if (storyTimer) { clearInterval(storyTimer); storyTimer = null; }
  if (storyPlayBtn) storyPlayBtn.innerText = 'AUTO-PLAY';
}

function startStoryPlayback() {
  stopStoryPlayback();
  if (storyPlayBtn) storyPlayBtn.innerText = 'PAUSE';
  storyTimer = setInterval(() => {
    if (currentTimelineYear >= 2030) { stopStoryPlayback(); return; }
    renderStoryCard(currentTimelineYear + 1);
  }, 3500);
}

window.enterStoryMode = function() {
  storyModeActive = true;
  storyModeBtn.innerText = '[STORY] EXIT STORY';
  storyOverlayEl.classList.add('show');
  renderStoryCard(currentTimelineYear);
};

window.exitStoryMode = function() {
  storyModeActive = false;
  storyModeBtn.innerText = '[STORY] STORY MODE';
  storyOverlayEl.classList.remove('show');
  stopStoryPlayback();
};

window.toggleStoryMode = function() {
  if (storyModeActive) window.exitStoryMode(); else window.enterStoryMode();
};

if (storyPrevBtn) storyPrevBtn.addEventListener('click', () => { stopStoryPlayback(); renderStoryCard(currentTimelineYear - 1); });
if (storyNextBtn) storyNextBtn.addEventListener('click', () => {
  stopStoryPlayback();
  if (currentTimelineYear >= 2030) { window.exitStoryMode(); return; }
  renderStoryCard(currentTimelineYear + 1);
});
if (storyExitBtn) storyExitBtn.addEventListener('click', window.exitStoryMode);
if (storyPlayBtn) storyPlayBtn.addEventListener('click', () => { if (storyTimer) stopStoryPlayback(); else startStoryPlayback(); });

// ─── SIMPLIFIED VIEW ────────────────────────────────────────────────────────────

const simplifiedBtnEl = document.getElementById('btn-simplified');

function simplifiedStatusLabel(status) {
  if (status === 'Operational') return 'Online';
  if (status === 'Expansion') return 'Growing';
  return 'Planned';
}

function simplifiedRiskLabel(level) {
  if (level === 'High') return 'High impact';
  if (level === 'Medium') return 'Moderate impact';
  return 'Low impact';
}

function renderSimplifiedInfoHtml(center) {
  return [
    `<div style="font-size:13px;color:#adffd8;margin-bottom:10px;">${center.name}</div>`,
    `<div style="margin-bottom:6px;"><b>Company:</b> ${center.operator}</div>`,
    `<div style="margin-bottom:6px;"><b>Status:</b> ${simplifiedStatusLabel(center.status)}</div>`,
    `<div style="margin-bottom:6px;"><b>Energy use:</b> ${center.powerMW} megawatts — enough to power ~${Math.round(center.powerMW * 750).toLocaleString()} homes</div>`,
    `<div style="margin-bottom:6px;"><b>GPU Capacity:</b> ~${center.estGPUs.toLocaleString()} processors</div>`,
    `<div style="margin-bottom:6px;"><b>Carbon Impact:</b> <span style="color:#ff8787;">${center.co2Tons.toLocaleString()} tons of CO2 per year</span></div>`,
    `<div style="margin-bottom:6px;"><b>Hardware Spec:</b> <span style="color:#ffd700;">${center.chipType}</span></div>`,
    `<div style="margin-bottom:6px;"><b>What it does:</b> ${center.role}</div>`,
    `<div style="margin-bottom:6px;"><b>AI models hosted here:</b> ${center.models.join(', ')}</div>`,
    `<div style="margin-bottom:6px;"><b>Cooling method:</b> ${center.cooling}</div>`,
    `<div style="margin-bottom:6px;"><b>Water usage concern:</b> ${simplifiedRiskLabel(center.waterRisk)}</div>`,
    `<div style="margin-bottom:6px;"><b>Local jobs:</b> ${center.jobs}</div>`,
    `<div style="margin-top:10px;opacity:0.55;font-size:9px;">DATA IS CURATED FROM PUBLIC OPERATOR DISCLOSURES.</div>`
  ].join('');
}

window.toggleSimplified = function() {
  simplifiedMode = !simplifiedMode;
  document.body.classList.toggle('simplified', simplifiedMode);
  if (simplifiedBtnEl) simplifiedBtnEl.innerText = simplifiedMode ? 'EXPERT MODE' : 'SIMPLIFIED VIEW';
  const activeCenter = DATA_CENTERS.find((c) => c.id === activeCenterId);
  if (activeCenter) {
    infoPanel.innerHTML = simplifiedMode ? renderSimplifiedInfoHtml(activeCenter) : centerDetailsHtml(activeCenter);
  }
};

// ─── BUBBLE LAB COLLAPSE ────────────────────────────────────────────────────

window.toggleBubbleLab = function() {
  bubbleLabExpanded = !bubbleLabExpanded;
  const body = document.getElementById('bubble-body');
  const icon = document.getElementById('bubble-toggle-icon');
  if (body) body.classList.toggle('bubble-hidden', !bubbleLabExpanded);
  if (icon) icon.innerText = bubbleLabExpanded ? '▼' : '▶';
};

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  cloudShell.rotation.y += 0.0002;
  globeGroup.rotation.y += 0.00045;
  starsGroup.rotation.y += 0.00006;

  const cameraDistance = camera.position.distanceTo(controls.target);
  const rawTransition = (cameraDistance - SPACE_ZOOM_START) / (SPACE_ZOOM_FULL - SPACE_ZOOM_START);
  spaceTransition = THREE.MathUtils.clamp(rawTransition, 0, 1);

  globeGroup.position.set(-5.6 * spaceTransition, 0.45 - 0.22 * spaceTransition, 0);
  globeGroup.rotation.z = -0.08 * spaceTransition;

  const globeCenterWithOffset = globeGroup.position.clone();
  globeCenterWithOffset.x += 2.2 * spaceTransition;
  globeCenterWithOffset.y -= 0.38;

  // Always center target on the globe (with previous offset)
  controls.target.lerp(globeCenterWithOffset, 0.08);

  if (focusPoint) {
    // Spin the globe to the area: Rotate camera to face the marker relative to globe center
    // We calculate marker position in world space by adding it to globeGroup.position
    // But markers are children of globeGroup, so they already rotate with it.
    // However, focusPoint is static from latLonToVector3.
    // To 'spin' to it, we need the camera to move to focusPoint's direction relative to globe center.
    const dir = focusPoint.clone().applyQuaternion(globeGroup.quaternion).normalize();
    const dist = camera.position.distanceTo(globeCenterWithOffset);
    const desiredCameraPos = globeCenterWithOffset.clone().add(dir.multiplyScalar(dist));
    camera.position.lerp(desiredCameraPos, 0.05);
  }

  if (starMaterial) {
    starMaterial.opacity = 0.12 + spaceTransition * 0.86;
  }
  if (frontierOverlayEl) {
    frontierOverlayEl.classList.toggle('show', spaceTransition > 0.28);
    frontierOverlayEl.style.opacity = (Math.max(0, (spaceTransition - 0.2) / 0.8)).toFixed(3);
  }

  renderer.render(scene, camera);
}

animate();

const TIMELINE = [
  { year: 2019, phase: 'PRE-BOOM', desc: 'AI spend is meaningful but still niche. Capex and debt loads are manageable; utilization is variable.' },
  { year: 2020, phase: 'DIGITAL ACCELERATION', desc: 'Pandemic demand accelerates cloud migration. GPU demand starts outpacing supply in key regions.' },
  { year: 2021, phase: 'SCALE-UP', desc: 'Large model training budgets rise sharply; infrastructure commitments lock in multiyear power contracts.' },
  { year: 2022, phase: 'GEN-AI INFLECTION', desc: 'Public launch moment. Capital markets reward growth; debt-backed expansion becomes easier to justify.' },
  { year: 2023, phase: 'GPU SCRAMBLE', desc: 'Datacenter retrofits, colocation GPU deals, and leasing premiums spike. Execution risk rises.' },
  { year: 2024, phase: 'HYPERSCALE CAPEX CYCLE', desc: 'Massive AI capex wave. Narrative shifts from capability race to monetization pressure.' },
  { year: 2025, phase: 'MONETIZATION TEST', desc: 'Revenue per token and enterprise conversion rates become key. Weak utilization starts hurting margins.' },
  { year: 2026, phase: 'DEBT REPRICING WINDOW', desc: 'Refinancing and power-cost sensitivity matter more. Operators with low coverage ratios face stress.' },
  { year: 2027, phase: 'CONSOLIDATION RISK', desc: 'If demand growth slows, overbuilt clusters and idle accelerators can force write-downs.' },
  { year: 2028, phase: 'EFFICIENCY WARS', desc: 'Model compression and inference efficiency reduce spend per output; weaker facilities struggle to stay full.' },
  { year: 2029, phase: 'RESET OR RE-ACCELERATION', desc: 'Market bifurcates: high-utilization operators compound, over-levered players cut capex aggressively.' },
  { year: 2030, phase: 'NEW BASELINE', desc: 'AI infrastructure matures into utility-like economics for winners; debt discipline decides survivorship.' }
];

const TIMELINE_METRICS = [
  { year: 2019, capex: 18, debt: 22, bubble: 16, util: 74, powerInflation: 2, growth: 9, rateShock: 0.1 },
  { year: 2020, capex: 23, debt: 27, bubble: 20, util: 77, powerInflation: 4, growth: 14, rateShock: 0.2 },
  { year: 2021, capex: 31, debt: 34, bubble: 27, util: 81, powerInflation: 7, growth: 18, rateShock: 0.4 },
  { year: 2022, capex: 43, debt: 48, bubble: 39, util: 86, powerInflation: 10, growth: 28, rateShock: 0.8 },
  { year: 2023, capex: 57, debt: 64, bubble: 53, util: 88, powerInflation: 16, growth: 31, rateShock: 1.2 },
  { year: 2024, capex: 71, debt: 79, bubble: 62, util: 85, powerInflation: 18, growth: 24, rateShock: 1.5 },
  { year: 2025, capex: 83, debt: 94, bubble: 67, util: 79, powerInflation: 22, growth: 17, rateShock: 2.0 },
  { year: 2026, capex: 88, debt: 107, bubble: 73, util: 73, powerInflation: 27, growth: 10, rateShock: 2.6 },
  { year: 2027, capex: 82, debt: 112, bubble: 78, util: 68, powerInflation: 33, growth: 6, rateShock: 3.1 },
  { year: 2028, capex: 74, debt: 110, bubble: 70, util: 71, powerInflation: 25, growth: 9, rateShock: 2.4 },
  { year: 2029, capex: 69, debt: 104, bubble: 64, util: 75, powerInflation: 19, growth: 12, rateShock: 1.8 },
  { year: 2030, capex: 66, debt: 98, bubble: 58, util: 78, powerInflation: 14, growth: 14, rateShock: 1.2 }
];

const TIMELINE_DEEP_DIVE = {
  2019: { driver: 'EARLY FOUNDATION MODEL EXPERIMENTS', debt: 'BALANCE SHEETS STILL FLEXIBLE', trigger: 'GPU PRICES OUTPACE CUSTOMER VALUE', response: 'KEEP SPEND DISCIPLINED' },
  2020: { driver: 'PANDEMIC DIGITAL DEMAND SHOCK', debt: 'CHEAP CREDIT SUPPORTS CAPEX', trigger: 'DEMAND NORMALIZATION', response: 'LOCK LONG-TERM CONTRACTS CAUTIOUSLY' },
  2021: { driver: 'MULTI-CLOUD ENTERPRISE UPTAKE', debt: 'DEBT BUILDING BUT COVERED', trigger: 'CLOUD PRICE COMPRESSION', response: 'PRIORITIZE HIGH-MARGIN USE CASES' },
  2022: { driver: 'GEN-AI PRODUCT BREAKOUT', debt: 'CAPEX COMMITMENTS ACCELERATE', trigger: "USAGE DOESN'T CONVERT TO REVENUE", response: 'TIGHTEN UNIT ECONOMICS' },
  2023: { driver: 'GPU SUPPLY SCRAMBLE', debt: 'LEASE + FINANCING STACK EXPANDS', trigger: 'IDLE CAPACITY POST-BUYING WAVE', response: 'SHIFT TO FLEXIBLE CAPACITY' },
  2024: { driver: 'HYPERSCALE ARMS RACE', debt: 'LARGE MATURITY WALL FORMING', trigger: 'RATE STAYS HIGHER FOR LONGER', response: 'DE-LAYER CAPEX PRIORITIES' },
  2025: { driver: 'ROI PRESSURE FROM INVESTORS', debt: 'INTEREST COVERAGE STARTS FRAGILE FOR SOME', trigger: 'TOKEN PRICING DETERIORATION', response: 'FOCUS ON PROFITABLE VERTICALS' },
  2026: { driver: 'REFINANCING WINDOW OPENS', debt: 'ROLLING DEBT COSTS STEP UP', trigger: 'UTILIZATION < 70%', response: 'CAPEX CUTS + CONSOLIDATION' },
  2027: { driver: 'EFFICIENCY MODELS REDUCE DEMAND PER TOKEN', debt: 'LEGACY ASSETS RISK STRANDING', trigger: 'WRITE-DOWNS ON OLD CLUSTERS', response: 'RETIRE LOW-EFFICIENCY FLEETS' },
  2028: { driver: 'PLATFORM CONSOLIDATION', debt: 'SURVIVORS IMPROVE COVERAGE', trigger: 'POWER SUPPLY SHOCK', response: 'GEOGRAPHIC LOAD BALANCING' },
  2029: { driver: 'MARKET REPRICING', debt: 'DEBT METRICS STABILIZE FOR WINNERS', trigger: 'SECOND DEMAND SLOWDOWN', response: 'ASSET-LIGHT EXPANSION' },
  2030: { driver: 'UTILITY-LIKE AI INFRA MODEL', debt: 'DISCIPLINED CAPITAL RETURNS', trigger: 'POLICY/GRID CONSTRAINTS', response: 'LONG-HORIZON CAPACITY PLANNING' }
};
