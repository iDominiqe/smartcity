import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getDevicePerfTier, destroyStudioRenderer } from './utils/webgl-memory.js';
import {
  createSolarTexture,
  createSolarPanelMesh,
  createEnergyStream
} from './scene/textures-helpers.js';
import {
  PARKING_STUDIO_TEXT,
  PARKING_MODE_TELEMETRY,
  PARKING_LEFT_SPECS,
  PARKING_RIGHT_SPECS,
  PARKING_CAMERA_PRESETS,
  PARKING_HOTSPOTS
} from './data/parking-studio-data.js';

function createMarketSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 1024, 220);
  grad.addColorStop(0, '#0b1e33');
  grad.addColorStop(0.5, '#12314e');
  grad.addColorStop(1, '#0b1e33');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 220);

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 1008, 204);

  // Eco leaf-sun badge on left
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(105, 110, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#052e16';
  ctx.font = '800 56px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌿', 105, 114);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 62px Inter, Arial, sans-serif';
  ctx.fillText('NEO® ECO-MARKET', 560, 78);

  ctx.fillStyle = '#10b981';
  ctx.fillRect(235, 128, 665, 56);
  ctx.fillStyle = '#031c12';
  ctx.font = '800 28px Inter, Arial, sans-serif';
  ctx.fillText('HUWART 35% SOLAR · 65% BIO-PARKING', 568, 157);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createParkedEvCar(colorHex, headLightMats, tailLightMats) {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.2,
    metalness: 0.3,
    clearcoat: 0.8
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    roughness: 0.08,
    metalness: 0.7,
    clearcoat: 0.85
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.75 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.25, metalness: 0.8 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.38, 2.38), bodyMat);
  body.position.y = 0.36;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.34, 1.24), glassMat);
  cabin.position.set(0, 0.7, -0.1);
  cabin.castShadow = true;
  car.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.06, 1.0), bodyMat);
  roof.position.set(0, 0.89, -0.1);
  car.add(roof);

  const headMat = new THREE.MeshStandardMaterial({
    color: '#fffbeb',
    emissive: new THREE.Color('#fde68a'),
    emissiveIntensity: 0.2
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    emissive: new THREE.Color('#f43f5e'),
    emissiveIntensity: 0.25
  });
  headLightMats.push(headMat);
  tailLightMats.push(tailMat);

  const headBar = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.09, 0.05), headMat);
  headBar.position.set(0, 0.4, 1.19);
  car.add(headBar);

  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.08, 0.05), tailMat);
  tailBar.position.set(0, 0.42, -1.19);
  car.add(tailBar);

  const wheelGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.14, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 10);
  rimGeo.rotateZ(Math.PI / 2);
  [
    [-0.58, 0.19, 0.72],
    [0.58, 0.19, 0.72],
    [-0.58, 0.19, -0.72],
    [0.58, 0.19, -0.72]
  ].forEach(([wx, wy, wz]) => {
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.position.set(wx, wy, wz);
    car.add(tire);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(wx, wy, wz);
    car.add(rim);
  });

  return car;
}

function createLushTree(scale = 1, variant = 0) {
  const tree = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#6b4423', roughness: 0.88 });
  const greens = ['#15803d', '#16a34a', '#22c55e', '#4ade80'];
  const c1 = new THREE.MeshStandardMaterial({ color: greens[variant % 2], roughness: 0.78 });
  const c2 = new THREE.MeshStandardMaterial({ color: greens[(variant % 2) + 2], roughness: 0.72 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.95, 8), trunkMat);
  trunk.position.y = 0.48;
  trunk.castShadow = true;
  tree.add(trunk);

  const blobs =
    variant % 2 === 0
      ? [
          [0, 1.35, 0, 0.76, c1],
          [0.35, 1.55, 0.2, 0.52, c2],
          [-0.32, 1.5, -0.18, 0.55, c2],
          [0.05, 1.85, -0.05, 0.48, c1]
        ]
      : [
          [0, 1.28, 0, 0.7, c1],
          [0, 1.72, 0, 0.54, c2],
          [0, 2.1, 0, 0.36, c1]
        ];

  blobs.forEach(([bx, by, bz, r, mat]) => {
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
    foliage.position.set(bx, by, bz);
    foliage.castShadow = true;
    tree.add(foliage);
  });

  tree.scale.setScalar(scale);
  return tree;
}

function createFlowerCluster(x, y, z, count = 7) {
  const group = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.8 });
  const petalColors = ['#facc15', '#a855f7', '#f472b6', '#fb7185', '#f8fafc', '#fb923c'];
  const bush = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.28, 0),
    new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.82 })
  );
  bush.scale.set(1.5, 0.65, 1.4);
  bush.position.y = 0.12;
  group.add(bush);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (x + z) * 0.3;
    const rad = 0.08 + (i % 3) * 0.11;
    const fx = Math.cos(angle) * rad;
    const fz = Math.sin(angle) * rad;
    const fy = 0.22 + (i % 2) * 0.08;

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, fy, 4), stemMat);
    stem.position.set(fx, fy * 0.5, fz);
    group.add(stem);

    const petalMat = new THREE.MeshStandardMaterial({
      color: petalColors[(i + Math.abs(Math.round(x * 3))) % petalColors.length],
      roughness: 0.45
    });
    const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.068, 6, 6), petalMat);
    blossom.position.set(fx, fy + 0.04, fz);
    group.add(blossom);
  }

  group.position.set(x, y, z);
  return group;
}

export class ParkingStudio3D {
  constructor({ i18n, onRequestQuote, onClose }) {
    this.i18n = i18n;
    this.onRequestQuote = onRequestQuote;
    this.onClose = onClose;

    this.isOpen = false;
    this.mode = 'sunny'; // 'sunny' | 'windy' | 'hybrid'
    this.autoSpin = false;
    this.activeCam = 'overview';
    this.rafId = null;
    this.lastTime = null;
    this.elapsed = 0;

    this.camTargetGoal = new THREE.Vector3(...PARKING_CAMERA_PRESETS.overview.target);
    this.camPosGoal = new THREE.Vector3(...PARKING_CAMERA_PRESETS.overview.pos);
    this.isLerpingCam = false;

    this.hotspotPins = [];
    this.circuits = {};
    this.trackingPanels = [];
    this.batteryBarMats = [];
    this.lampBulbMats = [];
    this.evPadMats = [];
    this.carHeadMats = [];
    this.carTailMats = [];
    this.windRotor = null;
    this.windBeaconMat = null;
    this.marketInteriorMat = null;
    this.marketSignMat = null;
    this.canopyLedMat = null;
    this.marketLight = null;
    this.canopyLight = null;
    this.plinthBorderMat = null;
    this.starsMat = null;

    this.buildModalDOM();
    this.bindEvents();
  }

  t(key) {
    const lang = this.i18n?.lang || 'en';
    const dict = PARKING_STUDIO_TEXT[lang] || PARKING_STUDIO_TEXT.en;
    return dict[key] ?? PARKING_STUDIO_TEXT.en[key] ?? key;
  }

  loc(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const lang = this.i18n?.lang || 'en';
    return obj[lang] || obj.en || '';
  }

  buildModalDOM() {
    const modal = document.createElement('div');
    modal.id = 'parking-studio-modal';
    modal.className = 'ac-studio-modal';
    modal.setAttribute('data-thermal-mode', 'sunny');
    modal.hidden = true;
    modal.innerHTML = `
      <div class="ac-studio-backdrop" id="parking-studio-backdrop"></div>
      <div class="ac-studio-shell" role="dialog" aria-modal="true" aria-labelledby="parking-studio-title">
        <header class="ac-studio-header">
          <div>
            <span class="ac-studio-badge" id="parking-studio-badge"></span>
            <h2 id="parking-studio-title"></h2>
            <p id="parking-studio-subtitle"></p>
          </div>
          <div class="ac-studio-header-actions">
            <button type="button" id="parking-btn-quote" class="btn-primary"></button>
            <button type="button" id="parking-btn-close" class="ac-close-btn"></button>
          </div>
        </header>

        <div class="ac-studio-stage">
          <aside class="ac-specs-col left" id="parking-specs-left"></aside>

          <div class="ac-stage-center">
            <div class="home-telemetry-bar">
              <div class="home-tele-pill solar">
                <span class="home-tele-lbl" id="parking-lbl-solar"></span>
                <strong id="parking-val-solar">64.2 kW</strong>
              </div>
              <div class="home-tele-pill battery">
                <span class="home-tele-lbl" id="parking-lbl-wind"></span>
                <strong id="parking-val-wind">5.4 kW</strong>
              </div>
              <div class="home-tele-pill grid">
                <span class="home-tele-lbl" id="parking-lbl-ev"></span>
                <strong id="parking-val-ev">28 kW (3 EV)</strong>
              </div>
              <div class="home-tele-pill">
                <span class="home-tele-lbl" id="parking-lbl-eco"></span>
                <strong id="parking-val-eco">35% PV / 65% Bio</strong>
              </div>
            </div>

            <div class="ac-live-banner" id="parking-live-banner">
              <span class="ac-live-dot"></span>
              <span id="parking-live-status"></span>
            </div>

            <div class="ac-canvas-wrap">
              <canvas id="parking-studio-canvas"></canvas>
              <div class="ac-hotspot-layer" id="parking-hotspot-layer"></div>
            </div>

            <div class="home-conduit-legend">
              <span class="legend-chip solar"><i></i><span id="parking-leg-solar"></span></span>
              <span class="legend-chip battery"><i></i><span id="parking-leg-wind"></span></span>
              <span class="legend-chip loads"><i></i><span id="parking-leg-ev"></span></span>
              <span class="legend-chip bio"><i></i><span id="parking-leg-bio"></span></span>
            </div>

            <div class="ac-cam-bar">
              <button type="button" class="ac-cam-btn active" data-pcam="overview" id="pcam-overview"></button>
              <button type="button" class="ac-cam-btn" data-pcam="canopy" id="pcam-canopy"></button>
              <button type="button" class="ac-cam-btn" data-pcam="bio" id="pcam-bio"></button>
              <button type="button" class="ac-cam-btn" data-pcam="field" id="pcam-field"></button>
              <button type="button" class="ac-cam-btn" data-pcam="market" id="pcam-market"></button>
              <button type="button" class="ac-cam-btn" id="parking-btn-spin"></button>
            </div>
          </div>

          <aside class="ac-specs-col right" id="parking-specs-right"></aside>
        </div>

        <footer class="ac-studio-controls">
          <div class="ac-ctrl-group">
            <button type="button" class="ac-mode-btn active" data-pmode="sunny" id="pmode-sunny"></button>
            <button type="button" class="ac-mode-btn" data-pmode="windy" id="pmode-windy"></button>
            <button type="button" class="ac-mode-btn" data-pmode="hybrid" id="pmode-hybrid"></button>
          </div>
          <div class="ac-ctrl-group">
            <span class="ac-drag-hint home-hint" id="parking-drag-hint"></span>
          </div>
        </footer>
      </div>
    `;
    document.body.appendChild(modal);
    this.modal = modal;
    this.canvas = modal.querySelector('#parking-studio-canvas');
    this.hotspotLayer = modal.querySelector('#parking-hotspot-layer');
    this.syncLanguage();
  }

  initScene() {
    if (this.renderer) return;
    this.canvas = this.modal.querySelector('#parking-studio-canvas');
    if (!this.canvas) return;

    const perf = getDevicePerfTier();
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !perf.isMobile,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(perf.maxPixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#4a8fd4');
    this.scene.fog = new THREE.FogExp2('#4a8fd4', 0.011);

    this.camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.2, 160);
    this.camera.position.set(...PARKING_CAMERA_PRESETS.overview.pos);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 6.5;
    this.controls.maxDistance = 36;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.target.set(...PARKING_CAMERA_PRESETS.overview.target);
    this.controls.addEventListener('start', () => {
      this.isLerpingCam = false;
    });

    // Lighting Rig
    this.ambientLight = new THREE.AmbientLight('#dbeafe', 0.55);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight('#e0f2fe', '#1e293b', 1.05);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#fff8eb', 2.4);
    this.sunLight.position.set(-14, 22, 16);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(perf.shadowMapSize, perf.shadowMapSize);
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 65;
    const sd = 17;
    this.sunLight.shadow.camera.left = -sd;
    this.sunLight.shadow.camera.right = sd;
    this.sunLight.shadow.camera.top = sd;
    this.sunLight.shadow.camera.bottom = -sd;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 20, 20),
      new THREE.MeshBasicMaterial({ color: '#fef08a' })
    );
    this.sunOrb.position.set(-15, 14, -18);
    this.scene.add(this.sunOrb);

    // Subtle twilight starfield
    const starCount = 260;
    const sPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 0.72 + 0.22);
      const r = 52 + Math.random() * 14;
      sPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      sPos[i * 3 + 1] = r * Math.cos(ph);
      sPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    this.starsMat = new THREE.PointsMaterial({
      color: '#e2e8f0',
      size: 0.38,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.scene.add(new THREE.Points(starGeo, this.starsMat));

    this.buildSupermarketDiorama();
    this.buildHotspotPins();
  }

  buildSupermarketDiorama() {
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    const solarTex = createSolarTexture();
    const solarMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.22,
      metalness: 0.65,
      emissive: new THREE.Color('#0a2957'),
      emissiveIntensity: 0.24
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.35, metalness: 0.6 });
    const steelMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.42, metalness: 0.65 });
    const slateMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.55, metalness: 0.3 });
    const creamMat = new THREE.MeshStandardMaterial({ color: '#efeae2', roughness: 0.68, metalness: 0.04 });
    const timberMat = new THREE.MeshStandardMaterial({ color: '#a16236', roughness: 0.72, metalness: 0.06 });
    const accentRedMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.38, metalness: 0.15 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.78 });
    const asphaltMat = new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.85, metalness: 0.05 });
    const meadowMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.9 });
    const bioGridMat = new THREE.MeshStandardMaterial({ color: '#2b5e38', roughness: 0.88 });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });

    // -------------------------------------------------------------------------
    // 1. RAISED ISLAND PLINTH: COMMERCIAL PARKING LOT + SIDE GREEN MEADOW
    // -------------------------------------------------------------------------
    const baseSlab = new THREE.Mesh(
      new THREE.BoxGeometry(25.2, 0.9, 17.8),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.75 })
    );
    baseSlab.position.set(0.2, -0.48, -0.2);
    baseSlab.receiveShadow = true;
    this.rootGroup.add(baseSlab);

    this.plinthBorderMat = new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.6
    });
    const borderTrim = new THREE.Mesh(new THREE.BoxGeometry(25.45, 0.08, 18.05), this.plinthBorderMat);
    borderTrim.position.set(0.2, -0.06, -0.2);
    this.rootGroup.add(borderTrim);

    // Asphalt Commercial Parking Deck (Left + Center: x = -11.8..+5.2)
    const parkingAsphalt = new THREE.Mesh(new THREE.BoxGeometry(17.0, 0.12, 16.8), asphaltMat);
    parkingAsphalt.position.set(-3.3, 0.0, -0.2);
    parkingAsphalt.receiveShadow = true;
    this.rootGroup.add(parkingAsphalt);

    // Adjacent Side Eco-Energy Meadow / Field (Right: x = +5.2..+12.2)
    const sideMeadow = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.16, 16.8), meadowMat);
    sideMeadow.position.set(8.7, 0.02, -0.2);
    sideMeadow.receiveShadow = true;
    this.rootGroup.add(sideMeadow);

    // Subtle rolling meadow turf hillock around the wind turbine
    const hillock = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 3.3, 0.24, 18),
      new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.9 })
    );
    hillock.position.set(8.8, 0.12, -3.2);
    hillock.receiveShadow = true;
    this.rootGroup.add(hillock);

    // Stone entrance promenade along supermarket facade
    const promenade = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.14, 2.3), sidewalkMat);
    promenade.position.set(-3.2, 0.05, -0.95);
    promenade.receiveShadow = true;
    this.rootGroup.add(promenade);

    // White parking lane striping & entrance crosswalk
    for (let s = -1.2; s <= 1.2; s += 0.48) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 1.2), whiteLineMat);
      strip.position.set(-3.5 + s, 0.075, 0.6);
      this.rootGroup.add(strip);
    }

    // -------------------------------------------------------------------------
    // 2. ECO-SUPERMARKET EXTERIOR (L-SHAPED MODERN RETAIL + ROOFTOP PV)
    // -------------------------------------------------------------------------
    const marketGroup = new THREE.Group();
    marketGroup.position.set(-3.8, 0.06, -4.6);

    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(11.0, 3.25, 4.8), creamMat);
    mainHall.position.set(0, 1.62, 0);
    mainHall.castShadow = true;
    mainHall.receiveShadow = true;
    marketGroup.add(mainHall);

    // Right attached bakery / bio-cafe terrace wing (nod to Image 2)
    const cafeWing = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.55, 3.8), slateMat);
    cafeWing.position.set(6.9, 1.28, 0.5);
    cafeWing.castShadow = true;
    cafeWing.receiveShadow = true;
    marketGroup.add(cafeWing);

    const cafeDeckTrim = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.18, 4.0), creamMat);
    cafeDeckTrim.position.set(6.9, 2.6, 0.5);
    marketGroup.add(cafeDeckTrim);

    // Sleek red & white curved-feel cornice parapet around main supermarket (nod to Image 1)
    const fasciaBand = new THREE.Mesh(new THREE.BoxGeometry(11.35, 0.34, 5.15), accentRedMat);
    fasciaBand.position.set(0, 3.35, 0);
    fasciaBand.castShadow = true;
    marketGroup.add(fasciaBand);

    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(11.1, 0.14, 4.9), creamMat);
    roofCap.position.set(0, 3.55, 0);
    roofCap.receiveShadow = true;
    marketGroup.add(roofCap);

    // Glowing Supermarket Glass Storefronts & Interior Aisles
    this.marketInteriorMat = new THREE.MeshStandardMaterial({
      color: '#fef3c7',
      emissive: new THREE.Color('#fde68a'),
      emissiveIntensity: 0.32,
      roughness: 0.25
    });
    const glassFrontMat = new THREE.MeshPhysicalMaterial({
      color: '#bae6fd',
      transparent: true,
      opacity: 0.36,
      roughness: 0.08,
      metalness: 0.2
    });

    const shopInterior = new THREE.Mesh(new THREE.BoxGeometry(10.0, 2.05, 0.2), this.marketInteriorMat);
    shopInterior.position.set(0, 1.15, 2.34);
    marketGroup.add(shopInterior);

    const shopGlass = new THREE.Mesh(new THREE.BoxGeometry(10.2, 2.15, 0.08), glassFrontMat);
    shopGlass.position.set(0, 1.15, 2.43);
    marketGroup.add(shopGlass);

    // Vertical dark mullions along storefront
    for (let mx = -4.8; mx <= 4.8; mx += 1.6) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.14), steelMat);
      mullion.position.set(mx, 1.15, 2.44);
      marketGroup.add(mullion);
    }

    // Cafe Wing glowing glass + outdoor patio umbrellas
    const cafeInterior = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.65, 0.18), this.marketInteriorMat);
    cafeInterior.position.set(6.9, 0.95, 2.36);
    marketGroup.add(cafeInterior);

    // Entrance Canopy & Illuminated "NEO® ECO-MARKET" Billboard
    const entryCanopy = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 1.5), accentRedMat);
    entryCanopy.position.set(0, 2.42, 3.1);
    entryCanopy.castShadow = true;
    marketGroup.add(entryCanopy);

    const marketSignTex = createMarketSignTexture();
    this.marketSignMat = new THREE.MeshStandardMaterial({
      map: marketSignTex,
      emissiveMap: marketSignTex,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.45,
      roughness: 0.25
    });
    const signBox = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.25, 0.22), steelMat);
    signBox.position.set(0, 4.18, 2.52);
    signBox.castShadow = true;
    marketGroup.add(signBox);

    const signFace = new THREE.Mesh(new THREE.PlaneGeometry(5.55, 1.08), this.marketSignMat);
    signFace.position.set(0, 4.18, 2.64);
    marketGroup.add(signFace);

    // Rooftop Solar PV Rows (2 rows x 4 panels mounted cleanly on struts above roofCap y=3.62)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const panel = createSolarPanelMesh(2.05, 1.25, 0.28, solarMat, frameMat);
        panel.group.position.set(-3.45 + c * 2.3, 3.62, -1.05 + r * 1.95);
        marketGroup.add(panel.group);
        this.trackingPanels.push({ panelGroup: panel.panelGroup, baseTilt: 0.28, phase: r + c * 0.4 });
      }
    }

    // Rooftop Green Planter Terrace on Cafe Wing (nod to Image 2!)
    [5.6, 8.2].forEach((px, idx) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.32, 1.1), timberMat);
      box.position.set(px, 2.84, 0.5);
      marketGroup.add(box);
      const miniTree = createLushTree(0.68, idx);
      miniTree.position.set(px, 2.95, 0.5);
      marketGroup.add(miniTree);
    });

    // Cafe Patio Tables & Parasols on Promenade
    [5.6, 7.2, 8.6].forEach((tx) => {
      const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 10), creamMat);
      tbl.position.set(tx, 0.48, 3.45);
      marketGroup.add(tbl);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.35, 6), steelMat);
      pole.position.set(tx, 0.72, 3.45);
      marketGroup.add(pole);
      const parasol = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.28, 8), creamMat);
      parasol.position.set(tx, 1.44, 3.45);
      marketGroup.add(parasol);
    });

    this.marketLight = new THREE.PointLight('#fde68a', 0.4, 15);
    this.marketLight.position.set(0, 2.2, 4.0);
    marketGroup.add(this.marketLight);

    this.rootGroup.add(marketGroup);

    // -------------------------------------------------------------------------
    // 3. SECTOR 1: NEO® HUWART SOLAR EV CHARGING CANOPY (x = -5.8, z = +3.6)
    // -------------------------------------------------------------------------
    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(-5.8, 0.06, 3.6);

    // 4 EV Parking Bays with crisp white dividers & glowing emerald charge pads
    const evBayXs = [-3.3, -1.1, 1.1, 3.3];
    for (let i = -4.4; i <= 4.41; i += 2.2) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 4.4), whiteLineMat);
      line.position.set(i, 0.02, 0);
      canopyGroup.add(line);
    }

    evBayXs.forEach((bx, idx) => {
      const padMat = new THREE.MeshBasicMaterial({
        color: '#10b981',
        transparent: true,
        opacity: 0.28
      });
      this.evPadMats.push(padMat);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.02, 3.2), padMat);
      pad.position.set(bx, 0.025, 0.1);
      canopyGroup.add(pad);

      // NEO® Bornes EV Fast-Charging Pedestal
      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.25, 0.26), creamMat);
      ped.position.set(bx, 0.64, -1.75);
      ped.castShadow = true;
      canopyGroup.add(ped);

      const scrMat = new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? '#10b981' : '#38bdf8' });
      this.evPadMats.push(scrMat);
      const scr = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.28), scrMat);
      scr.position.set(bx, 0.92, -1.75);
      canopyGroup.add(scr);
    });

    // Cantilevered Steel & Timber Y-Frame Canopy Structure
    [-3.6, 0.0, 3.6].forEach((px) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.26, 2.75, 0.28), steelMat);
      col.position.set(px, 1.38, -1.5);
      col.castShadow = true;
      canopyGroup.add(col);

      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 4.6), timberMat);
      brace.position.set(px, 2.68, 0.15);
      brace.rotation.x = 0.12;
      canopyGroup.add(brace);
    });

    const canopyDeck = new THREE.Group();
    canopyDeck.position.set(0, 2.82, 0.15);
    canopyDeck.rotation.x = 0.12;

    const purlin = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.14, 4.6), steelMat);
    purlin.castShadow = true;
    canopyDeck.add(purlin);

    this.canopyLedMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.06, 0.12), this.canopyLedMat);
    ledStrip.position.set(0, -0.09, 1.8);
    canopyDeck.add(ledStrip);

    // 2x4 Bifacial Solar PV Panels flush atop the EV canopy
    for (let c = 0; c < 4; c++) {
      const pv = createSolarPanelMesh(2.05, 4.15, 0.0, solarMat, frameMat);
      pv.group.position.set(-3.3 + c * 2.2, 0.08, 0);
      canopyDeck.add(pv.group);
    }
    canopyGroup.add(canopyDeck);

    // 3 Parked Electric Cars charging under the Solar Canopy
    [
      { x: -3.3, col: '#f8fafc' },
      { x: -1.1, col: '#38bdf8' },
      { x: 1.1, col: '#cbd5e1' }
    ].forEach((cSpec) => {
      const ev = createParkedEvCar(cSpec.col, this.carHeadMats, this.carTailMats);
      ev.position.set(cSpec.x, 0.03, 0.2);
      ev.rotation.y = Math.PI;
      canopyGroup.add(ev);
    });

    this.canopyLight = new THREE.PointLight('#7dd3fc', 0.35, 13);
    this.canopyLight.position.set(0, 2.4, 0.2);
    canopyGroup.add(this.canopyLight);

    this.rootGroup.add(canopyGroup);

    // -------------------------------------------------------------------------
    // 4. SECTOR 2: VEGETATED BIO-PARKING WITH TREES, PERGOLA & FLOWER BEDS
    // -------------------------------------------------------------------------
    const bioGroup = new THREE.Group();
    bioGroup.position.set(1.8, 0.06, 3.6);

    // Permeable eco-grass paver bay pad
    const bioPad = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.06, 4.5), bioGridMat);
    bioPad.position.set(0, 0.02, 0);
    bioPad.receiveShadow = true;
    bioGroup.add(bioPad);

    for (let lx = -3.0; lx <= 3.01; lx += 2.0) {
      const div = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 4.2), whiteLineMat);
      div.position.set(lx, 0.06, 0);
      bioGroup.add(div);
    }

    // NEO® HUWART 65% Vegetated Timber & Stainless-Steel Shade Pergola
    [-2.9, 0.0, 2.9].forEach((px) => {
      [-1.7, 1.7].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.55, 8), timberMat);
        post.position.set(px, 1.28, pz);
        post.castShadow = true;
        bioGroup.add(post);
      });
    });

    const pergolaFrame = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.14, 3.9), timberMat);
    pergolaFrame.position.set(0, 2.55, 0);
    pergolaFrame.castShadow = true;
    bioGroup.add(pergolaFrame);

    // Lush evergreen climbing foliage blocks + jasmine blossoms draped over pergola roof
    const vineMats = [
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.75 }),
      new THREE.MeshStandardMaterial({ color: '#4ade80', roughness: 0.72 })
    ];
    for (let vx = -2.5; vx <= 2.55; vx += 0.85) {
      for (let vz = -1.4; vz <= 1.45; vz += 0.95) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(0.84, 0.24 + ((Math.abs(vx * 3 + vz) % 3) * 0.05), 0.92),
          vineMats[Math.abs(Math.round(vx * 2 + vz * 3)) % vineMats.length]
        );
        block.position.set(vx, 2.7, vz);
        block.castShadow = true;
        bioGroup.add(block);
      }
    }

    // 2 Parked Cars in the cool vegetated bays
    const bioCar1 = createParkedEvCar('#e2e8f0', this.carHeadMats, this.carTailMats);
    bioCar1.position.set(-2.0, 0.05, 0.15);
    bioCar1.rotation.y = Math.PI;
    bioGroup.add(bioCar1);

    const bioCar2 = createParkedEvCar('#f97316', this.carHeadMats, this.carTailMats);
    bioCar2.position.set(2.0, 0.05, 0.15);
    bioCar2.rotation.y = Math.PI;
    bioGroup.add(bioCar2);

    this.rootGroup.add(bioGroup);

    // Landscaped Green Median Planter Island between Sector 1 (Canopy) & Sector 2 (Bio-Parking)
    const medianCurb = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.2, 5.2), sidewalkMat);
    medianCurb.position.set(-0.95, 0.12, 3.6);
    this.rootGroup.add(medianCurb);

    const medianSoil = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 4.95), meadowMat);
    medianSoil.position.set(-0.95, 0.13, 3.6);
    this.rootGroup.add(medianSoil);

    // Perimeter Garden Planter Strip along Front Edge (z = +6.9)
    const frontGarden = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.2, 1.5), meadowMat);
    frontGarden.position.set(-3.2, 0.12, 6.95);
    this.rootGroup.add(frontGarden);

    // Lush Shade Trees & Vibrant Flower Beds balancing the parking lot with nature!
    const parkTrees = [
      [-0.95, 2.0, 0.95, 0],
      [-0.95, 5.1, 0.9, 1],
      [-10.4, 6.9, 1.1, 0],
      [-6.2, 6.9, 0.88, 1],
      [-1.8, 6.9, 1.0, 0],
      [3.8, 6.9, 1.05, 1],
      [-10.6, 0.6, 1.05, 0],
      [4.4, -0.8, 0.92, 1],
      [10.8, -6.2, 1.15, 0],
      [10.6, 5.8, 1.0, 1]
    ];
    parkTrees.forEach(([tx, tz, sc, v]) => {
      const tr = createLushTree(sc, v);
      tr.position.set(tx, 0.14, tz);
      this.rootGroup.add(tr);
    });

    // Colorful 3D Flower Beds across medians, front border, and side meadow
    const flowerSpots = [
      [-0.95, 0.24, 3.55],
      [-0.95, 0.24, 1.15],
      [-8.3, 0.22, 6.95],
      [-4.0, 0.22, 6.95],
      [0.4, 0.22, 6.95],
      [2.1, 0.22, 6.95],
      [6.2, 0.12, 5.6],
      [7.6, 0.12, 6.2],
      [10.2, 0.12, 0.6],
      [6.6, 0.12, -5.4],
      [10.4, 0.12, -1.5]
    ];
    flowerSpots.forEach(([fx, fy, fz]) => {
      this.rootGroup.add(createFlowerCluster(fx, fy, fz, 7));
    });

    // Warm Solar Garden Bollard Lamps along walkway & bio-parking
    [
      [-10.2, -0.3], [-6.8, -0.3], [-0.95, -0.3], [4.5, -0.3],
      [-0.95, 6.2], [4.9, 3.6], [5.8, 0.5]
    ].forEach(([lx, lz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.72, 8), steelMat);
      post.position.set(lx, 0.42, lz);
      this.rootGroup.add(post);

      const bulbMat = new THREE.MeshStandardMaterial({
        color: '#fef08a',
        emissive: new THREE.Color('#fbbf24'),
        emissiveIntensity: 0.1
      });
      this.lampBulbMats.push(bulbMat);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), bulbMat);
      cap.position.set(lx, 0.82, lz);
      this.rootGroup.add(cap);
    });

    // -------------------------------------------------------------------------
    // 5. SIDE ECO-ENERGY MEADOW: COMPACT WIND TURBINE + GROUND SOLAR + LFP HUB
    // -------------------------------------------------------------------------
    // 5A. Compact 3-Blade Wind Turbine at (x = +8.8, z = -3.2)
    const turbineGroup = new THREE.Group();
    turbineGroup.position.set(8.8, 0.22, -3.2);

    const turbineWhite = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.28, metalness: 0.25 });
    const turbineAccent = new THREE.MeshStandardMaterial({ color: '#10b981', roughness: 0.32, metalness: 0.2 });

    const padBase = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 0.26, 14), sidewalkMat);
    padBase.position.y = 0.13;
    turbineGroup.add(padBase);

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.24, 5.6, 16), turbineWhite);
    tower.position.y = 3.0;
    tower.castShadow = true;
    turbineGroup.add(tower);

    // Emerald eco-ring collar on mast
    const mastRing = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.165, 0.26, 16), turbineAccent);
    mastRing.position.y = 4.6;
    turbineGroup.add(mastRing);

    // Nacelle housing facing slightly toward front-left camera
    const nacelleHead = new THREE.Group();
    nacelleHead.position.set(0, 5.82, 0);
    nacelleHead.rotation.y = -0.35;

    const nacelleBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 1.15), turbineWhite);
    nacelleBody.position.z = -0.18;
    nacelleBody.castShadow = true;
    nacelleHead.add(nacelleBody);

    this.windBeaconMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), this.windBeaconMat);
    beacon.position.set(0, 0.28, -0.52);
    nacelleHead.add(beacon);

    // Spinning 3-Blade Rotor
    const rotor = new THREE.Group();
    rotor.position.set(0, 0, 0.46);

    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.48, 14), turbineWhite);
    spinner.rotation.x = Math.PI / 2;
    spinner.position.z = 0.18;
    rotor.add(spinner);

    for (let b = 0; b < 3; b++) {
      const bladePivot = new THREE.Group();
      bladePivot.rotation.z = (b * Math.PI * 2) / 3;

      const bladeMain = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.25, 0.055), turbineWhite);
      bladeMain.position.y = 1.25;
      bladeMain.rotation.y = 0.14;
      bladeMain.castShadow = true;
      bladePivot.add(bladeMain);

      const bladeTip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.045), turbineAccent);
      bladeTip.position.y = 2.52;
      bladeTip.rotation.y = 0.14;
      bladePivot.add(bladeTip);

      rotor.add(bladePivot);
    }
    nacelleHead.add(rotor);
    this.windRotor = rotor;

    turbineGroup.add(nacelleHead);
    this.rootGroup.add(turbineGroup);

    // 5B. Ground-Mounted Meadow Solar Array (2 rows x 3 tracking panels at x = +8.5, z = +2.6)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const sx = 6.9 + c * 1.75;
        const sz = 1.5 + r * 2.15;

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.72, 8), steelMat);
        post.position.set(sx, 0.44, sz);
        this.rootGroup.add(post);

        const pv = createSolarPanelMesh(1.42, 1.05, 0.45, solarMat, frameMat);
        pv.group.position.set(sx, 0.72, sz);
        this.rootGroup.add(pv.group);
        this.trackingPanels.push({ panelGroup: pv.panelGroup, baseTilt: 0.45, phase: r * 0.7 + c * 0.4 });
      }
    }

    // 5C. Hybrid LFP Battery & Inverter Storage Cabinet (x = +5.75, z = -2.2)
    const hubCab = new THREE.Group();
    hubCab.position.set(5.75, 0.1, -2.2);

    const cabBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 1.3), sidewalkMat);
    cabBase.position.y = 0.08;
    hubCab.add(cabBase);

    const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.65, 0.88), creamMat);
    cabBody.position.y = 0.96;
    cabBody.castShadow = true;
    hubCab.add(cabBody);

    const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.12, 0.96), steelMat);
    cabRoof.position.y = 1.82;
    hubCab.add(cabRoof);

    // 5 Animated LED Battery Charge Bars on Front Face
    for (let i = 0; i < 5; i++) {
      const bm = new THREE.MeshBasicMaterial({ color: '#10b981' });
      this.batteryBarMats.push(bm);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.11, 0.05), bm);
      bar.position.set(0, 0.56 + i * 0.22, 0.45);
      hubCab.add(bar);
    }
    this.rootGroup.add(hubCab);

    // -------------------------------------------------------------------------
    // 6. ANIMATED 3D ENERGY CONDUITS CONNECTING ALL SOURCES & LOADS
    // -------------------------------------------------------------------------
    this.circuits.roofToHub = createEnergyStream(
      [
        new THREE.Vector3(-1.0, 4.1, -4.6),
        new THREE.Vector3(2.8, 3.2, -3.4),
        new THREE.Vector3(5.75, 1.5, -2.2)
      ],
      '#facc15',
      7,
      0.06
    );
    this.rootGroup.add(this.circuits.roofToHub.group);

    this.circuits.canopyToEv = createEnergyStream(
      [
        new THREE.Vector3(-5.8, 2.9, 3.5),
        new THREE.Vector3(-5.8, 1.8, 1.9),
        new THREE.Vector3(-6.9, 0.85, 3.4)
      ],
      '#38bdf8',
      7,
      0.058
    );
    this.rootGroup.add(this.circuits.canopyToEv.group);

    this.circuits.fieldSolarToHub = createEnergyStream(
      [
        new THREE.Vector3(8.5, 1.2, 2.0),
        new THREE.Vector3(7.2, 0.95, 0.0),
        new THREE.Vector3(5.75, 1.2, -2.2)
      ],
      '#fbbf24',
      6,
      0.055
    );
    this.rootGroup.add(this.circuits.fieldSolarToHub.group);

    this.circuits.windToHub = createEnergyStream(
      [
        new THREE.Vector3(8.8, 5.7, -3.2),
        new THREE.Vector3(8.8, 1.4, -3.2),
        new THREE.Vector3(7.2, 1.0, -2.6),
        new THREE.Vector3(5.75, 1.4, -2.2)
      ],
      '#10b981',
      8,
      0.062
    );
    this.rootGroup.add(this.circuits.windToHub.group);

    this.circuits.hubToMarketAndEv = createEnergyStream(
      [
        new THREE.Vector3(5.75, 1.1, -2.2),
        new THREE.Vector3(2.6, 0.65, -1.6),
        new THREE.Vector3(-2.6, 0.75, -1.4),
        new THREE.Vector3(-5.8, 0.9, 1.8)
      ],
      '#38bdf8',
      8,
      0.058
    );
    this.rootGroup.add(this.circuits.hubToMarketAndEv.group);
  }

  buildHotspotPins() {
    if (!this.hotspotLayer) return;
    this.hotspotLayer.innerHTML = '';
    this.hotspotPins = PARKING_HOTSPOTS.map((h) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ac-hotspot-pin';
      btn.innerHTML = `
        <span class="ac-hotspot-dot"></span>
        <span class="ac-hotspot-text">
          <span class="ac-hotspot-title">${this.loc(h.title)}</span>
          <span class="ac-hotspot-sub">${this.loc(h.sub)}</span>
        </span>
      `;
      btn.addEventListener('click', () => {
        this.focusCamera(h.focusCam);
      });
      this.hotspotLayer.appendChild(btn);
      return {
        ...h,
        el: btn,
        vec: new THREE.Vector3(...h.pos)
      };
    });
  }

  bindEvents() {
    this.modal.querySelector('#parking-studio-backdrop')?.addEventListener('click', () => this.close());
    this.modal.querySelector('#parking-btn-close')?.addEventListener('click', () => this.close());
    this.modal.querySelector('#parking-btn-quote')?.addEventListener('click', () => {
      this.close();
      if (this.onRequestQuote) this.onRequestQuote();
    });

    this.modal.querySelectorAll('[data-pmode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setMode(btn.getAttribute('data-pmode'));
      });
    });

    this.modal.querySelectorAll('[data-pcam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.focusCamera(btn.getAttribute('data-pcam'));
      });
    });

    this.modal.querySelector('#parking-btn-spin')?.addEventListener('click', (e) => {
      this.autoSpin = !this.autoSpin;
      e.currentTarget.classList.toggle('active', this.autoSpin);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
    window.addEventListener('resize', () => {
      if (this.isOpen) this.handleResize();
    });
  }

  setMode(mode) {
    if (!['sunny', 'windy', 'hybrid'].includes(mode)) return;
    this.mode = mode;
    this.modal.setAttribute('data-thermal-mode', mode);
    this.modal.querySelectorAll('[data-pmode]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-pmode') === mode);
    });
    this.updateLiveBannerAndTelemetry();
  }

  focusCamera(presetKey) {
    const p = PARKING_CAMERA_PRESETS[presetKey];
    if (!p) return;
    this.activeCam = presetKey;
    this.camPosGoal.set(...p.pos);
    this.camTargetGoal.set(...p.target);
    this.isLerpingCam = true;
    this.modal.querySelectorAll('[data-pcam]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-pcam') === presetKey);
    });
  }

  updateLiveBannerAndTelemetry() {
    const tel = PARKING_MODE_TELEMETRY[this.mode] || PARKING_MODE_TELEMETRY.sunny;
    const setText = (id, val) => {
      const el = this.modal.querySelector(`#${id}`);
      if (el) el.textContent = val;
    };
    setText('parking-val-solar', tel.solar);
    setText('parking-val-wind', tel.wind);
    setText('parking-val-ev', tel.ev);
    setText('parking-val-eco', tel.eco);

    const statusObj = this.t('modeStatus');
    const statusText = typeof statusObj === 'object' ? statusObj[this.mode] || '' : '';
    setText('parking-live-status', statusText);

    const banner = this.modal.querySelector('#parking-live-banner');
    if (banner) {
      banner.classList.remove('heat', 'battery', 'grid');
      if (this.mode === 'windy') banner.classList.add('battery');
      else if (this.mode === 'hybrid') banner.classList.add('grid');
    }
  }

  syncLanguage() {
    if (!this.modal) return;
    const setText = (id, key) => {
      const el = this.modal.querySelector(`#${id}`);
      if (el) el.textContent = this.t(key);
    };
    setText('parking-studio-badge', 'badge');
    setText('parking-studio-title', 'title');
    setText('parking-studio-subtitle', 'subtitle');
    setText('parking-btn-quote', 'requestQuote');
    setText('parking-btn-close', 'closeBtn');
    setText('parking-lbl-solar', 'telemetrySolar');
    setText('parking-lbl-wind', 'telemetryWind');
    setText('parking-lbl-ev', 'telemetryEv');
    setText('parking-lbl-eco', 'telemetryEco');
    setText('parking-leg-solar', 'legendSolar');
    setText('parking-leg-wind', 'legendWind');
    setText('parking-leg-ev', 'legendEv');
    setText('parking-leg-bio', 'legendBio');
    setText('pcam-overview', 'camOverview');
    setText('pcam-canopy', 'camCanopy');
    setText('pcam-bio', 'camBio');
    setText('pcam-field', 'camField');
    setText('pcam-market', 'camMarket');
    setText('parking-btn-spin', 'autoSpin');
    setText('pmode-sunny', 'modeSunny');
    setText('pmode-windy', 'modeWindy');
    setText('pmode-hybrid', 'modeHybrid');
    setText('parking-drag-hint', 'dragHint');

    const renderSpecs = (containerId, specs) => {
      const col = this.modal.querySelector(`#${containerId}`);
      if (!col) return;
      col.innerHTML = specs
        .map(
          (s) => `
          <button type="button" class="ac-spec-card" data-focus-cam="${s.focusCam}">
            <div class="ac-spec-head">
              <span class="ac-spec-icon">${s.icon}</span>
              <span class="ac-spec-label">${this.loc(s.label)}</span>
            </div>
            <div class="ac-spec-val">${s.value}</div>
            <p class="ac-spec-detail">${this.loc(s.detail)}</p>
          </button>
        `
        )
        .join('');
      col.querySelectorAll('.ac-spec-card').forEach((card) => {
        card.addEventListener('click', () => {
          col.parentElement?.querySelectorAll('.ac-spec-card').forEach((c) => c.classList.remove('active'));
          card.classList.add('active');
          this.focusCamera(card.getAttribute('data-focus-cam'));
        });
      });
    };

    renderSpecs('parking-specs-left', PARKING_LEFT_SPECS);
    renderSpecs('parking-specs-right', PARKING_RIGHT_SPECS);
    this.updateLiveBannerAndTelemetry();

    if (this.hotspotPins.length) {
      this.hotspotPins.forEach((hp) => {
        const titleEl = hp.el?.querySelector('.ac-hotspot-title');
        const subEl = hp.el?.querySelector('.ac-hotspot-sub');
        if (titleEl) titleEl.textContent = this.loc(hp.title);
        if (subEl) subEl.textContent = this.loc(hp.sub);
      });
    }
  }

  handleResize() {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const w = this.canvas.clientWidth || 640;
    const h = this.canvas.clientHeight || 420;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.modal.hidden = false;
    document.body.style.overflow = 'hidden';

    this.initScene();
    this.syncLanguage();
    this.setMode(this.mode);
    this.focusCamera('overview');

    requestAnimationFrame(() => {
      this.handleResize();
    });

    this.lastTime = null;
    const loop = (now) => {
      if (!this.isOpen) return;
      if (this.lastTime === null) this.lastTime = now;
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      this.elapsed += dt;

      this.update3D(dt, this.elapsed);
      this.renderer?.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.modal.hidden = true;
    document.body.style.overflow = '';
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.hotspotLayer) this.hotspotLayer.innerHTML = '';
    this.trackingPanels = [];
    this.lampBulbMats = [];
    this.evPadMats = [];
    this.carHeadMats = [];
    this.carTailMats = [];
    this.windRotor = null;

    destroyStudioRenderer(this);
    this.onClose?.();
  }

  update3D(dt, elapsed) {
    if (!this.controls || !this.camera) return;

    if (this.isLerpingCam) {
      const k = 1 - Math.exp(-5.0 * dt);
      this.camera.position.lerp(this.camPosGoal, k);
      this.controls.target.lerp(this.camTargetGoal, k);
      if (
        this.camera.position.distanceTo(this.camPosGoal) < 0.06 &&
        this.controls.target.distanceTo(this.camTargetGoal) < 0.06
      ) {
        this.isLerpingCam = false;
      }
    }

    this.controls.autoRotate = this.autoSpin;
    this.controls.autoRotateSpeed = 0.85;
    this.controls.update();

    const mode = this.mode;
    const isWindyNight = mode === 'windy';
    const isHybrid = mode === 'hybrid';

    // 1. Sky, Sun & Atmospheric Lighting per Mode
    const targetSky = isWindyNight ? '#0a1326' : isHybrid ? '#4b3b60' : '#4a8fd4';
    this.scene.background.lerp(new THREE.Color(targetSky), 1 - Math.exp(-4 * dt));
    if (this.scene.fog) this.scene.fog.color.copy(this.scene.background);

    this.sunLight.intensity = isWindyNight ? 0.65 : isHybrid ? 1.65 : 2.4;
    this.sunLight.color.set(isWindyNight ? '#93c5fd' : isHybrid ? '#ff9f5a' : '#fff8eb');
    this.hemiLight.intensity = isWindyNight ? 0.55 : isHybrid ? 0.88 : 1.08;
    this.ambientLight.intensity = isWindyNight ? 0.36 : 0.55;
    if (this.sunOrb) {
      this.sunOrb.visible = !isWindyNight;
      this.sunOrb.position.set(isHybrid ? -18 : -14, isHybrid ? 8.5 : 14.5, -18);
      this.sunOrb.material.color.set(isHybrid ? '#fb923c' : '#fef08a');
    }
    if (this.starsMat) {
      this.starsMat.opacity = isWindyNight ? 0.9 : isHybrid ? 0.25 : 0.0;
    }

    // 2. Wind Turbine Rotor Spin & Beacon Pulse
    const rotorSpeed = isWindyNight ? 3.8 : isHybrid ? 2.4 : 1.1;
    if (this.windRotor) {
      this.windRotor.rotation.z -= rotorSpeed * dt;
    }
    if (this.windBeaconMat) {
      this.windBeaconMat.color.setHex(Math.sin(elapsed * 4.5) > 0 ? 0x10b981 : 0x38bdf8);
    }

    // 3. Solar Panel Gentle Sun-Tracking
    this.trackingPanels.forEach(({ panelGroup, baseTilt, phase }) => {
      panelGroup.rotation.x = baseTilt + Math.sin(elapsed * 0.55 + phase) * 0.035;
    });

    // 4. Evening / Night Illumination for Market, EV Canopy, Cars & Park Lamps
    const nightGlow = isWindyNight ? 1.0 : isHybrid ? 0.55 : 0.08;
    if (this.marketInteriorMat) this.marketInteriorMat.emissiveIntensity = 0.25 + nightGlow * 1.15;
    if (this.marketSignMat) this.marketSignMat.emissiveIntensity = 0.4 + nightGlow * 0.85;
    if (this.marketLight) this.marketLight.intensity = 0.35 + nightGlow * 2.8;
    if (this.canopyLight) this.canopyLight.intensity = 0.3 + nightGlow * 2.2;
    this.lampBulbMats.forEach((m) => {
      m.emissiveIntensity = nightGlow * 2.4;
    });
    this.carHeadMats.forEach((m) => {
      m.emissiveIntensity = 0.15 + nightGlow * 2.2;
    });
    this.carTailMats.forEach((m) => {
      m.emissiveIntensity = 0.2 + nightGlow * 1.9;
    });

    // 5. Energy Conduits & LFP Battery Bars
    const solarActive = !isWindyNight;
    const windSpeed = isWindyNight ? 0.65 : isHybrid ? 0.45 : 0.25;

    const animStream = (stream, active, speed) => {
      if (!stream) return;
      stream.tubeMat.opacity = active ? 0.46 : 0.06;
      stream.beads.forEach((b) => {
        b.mesh.visible = active;
        if (!active) return;
        const u = (b.offset + elapsed * speed) % 1;
        stream.curve.getPointAt(u, b.mesh.position);
      });
    };

    animStream(this.circuits.roofToHub, solarActive, isHybrid ? 0.34 : 0.48);
    animStream(this.circuits.canopyToEv, true, solarActive ? 0.52 : 0.36);
    animStream(this.circuits.fieldSolarToHub, solarActive, isHybrid ? 0.32 : 0.45);
    animStream(this.circuits.windToHub, true, windSpeed);
    animStream(this.circuits.hubToMarketAndEv, true, isWindyNight ? 0.54 : 0.38);

    const fillCount = isWindyNight ? 4 : 5;
    this.batteryBarMats.forEach((bm, idx) => {
      if (idx < fillCount) {
        const pulse = 0.65 + 0.35 * Math.sin(elapsed * 4 - idx * 0.6);
        bm.color.set(idx === fillCount - 1 && pulse > 0.72 ? '#38bdf8' : '#10b981');
      } else {
        bm.color.set('#1e293b');
      }
    });

    // 6. Project Floating 2-Line 3D Callouts
    if (this.hotspotPins && this.canvas) {
      const cw = this.canvas.clientWidth;
      const ch = this.canvas.clientHeight;
      const padX = cw < 480 ? Math.min(72, cw * 0.25) : 0;
      this.hotspotPins.forEach((hp) => {
        if (!hp.el) return;
        const proj = hp.vec.clone().project(this.camera);
        if (proj.z > 1) {
          hp.el.style.opacity = '0';
          hp.el.style.pointerEvents = 'none';
          return;
        }
        const rawX = (proj.x * 0.5 + 0.5) * cw;
        const x = padX > 0 ? Math.max(padX, Math.min(cw - padX, rawX)) : rawX;
        const y = (-proj.y * 0.5 + 0.5) * ch;
        hp.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
        hp.el.style.opacity = '1';
        hp.el.style.pointerEvents = 'auto';
      });
    }
  }
}
