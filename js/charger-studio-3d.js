import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getDevicePerfTier, destroyStudioRenderer } from './utils/webgl-memory.js';
import {
  createSolarTexture,
  createSolarPanelMesh,
  createEnergyStream
} from './scene/textures-helpers.js';
import {
  CHARGER_STUDIO_TEXT,
  CHARGER_MODE_TELEMETRY,
  CHARGER_LEFT_SPECS,
  CHARGER_RIGHT_SPECS,
  CHARGER_CAMERA_PRESETS,
  CHARGER_HOTSPOTS
} from './data/charger-studio-data.js';

function createControlPanelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0d131f';
  ctx.fillRect(0, 0, 256, 768);

  // Subtle metallic frame edge
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 760);

  // Top Status Bar
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(88, 56, 80, 12);

  // Crisp Stylized QR Code Block
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(68, 108, 120, 120);
  ctx.fillStyle = '#0f172a';
  const qrPattern = [
    '1110110111',
    '1010010101',
    '1110100111',
    '0000110000',
    '1011011010',
    '0100100111',
    '1110110101',
    '1010011010',
    '1110101101',
    '0011010011'
  ];
  const cell = 10;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (qrPattern[r][c] === '1') {
        ctx.fillRect(78 + c * cell, 118 + r * cell, cell - 1, cell - 1);
      }
    }
  }

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 16px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN QR · UNLOCK', 128, 254);

  // Numeric PIN Keypad (1-9, 0)
  ctx.fillStyle = '#151f32';
  ctx.fillRect(42, 290, 172, 265);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 290, 172, 265);

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['·', '0', '✓']
  ];
  ctx.font = '700 28px Inter, Arial, sans-serif';
  keys.forEach((row, rIdx) => {
    row.forEach((k, cIdx) => {
      const kx = 74 + cIdx * 54;
      const ky = 335 + rIdx * 56;
      ctx.fillStyle = k === '✓' ? '#10b981' : '#f8fafc';
      ctx.fillText(k, kx, ky);
    });
  });

  // Contactless NFC / RFID Icon at Bottom
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.strokeRect(94, 598, 68, 46);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 18px Inter, Arial, sans-serif';
  ctx.fillText('((•))', 128, 627);
  ctx.fillStyle = '#64748b';
  ctx.font = '700 13px Inter, Arial, sans-serif';
  ctx.fillText('PIN / QR / RFID', 128, 678);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createNaionBadgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#062028';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 244);

  ctx.fillStyle = '#34d399';
  ctx.font = '900 54px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Na-ion 100 kWh', 256, 98);

  ctx.fillStyle = '#bae6fd';
  ctx.font = '700 30px Inter, Arial, sans-serif';
  ctx.fillText('500V DC · 60 kW FAST', 256, 158);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 22px Inter, Arial, sans-serif';
  ctx.fillText('SODIUM-ION SAFE STORAGE', 256, 206);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createParkedEvCoupe(headLightMats, tailLightMats) {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: '#38bdf8',
    roughness: 0.18,
    metalness: 0.35,
    clearcoat: 0.85
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    roughness: 0.08,
    metalness: 0.7,
    clearcoat: 0.9
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.78 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.22, metalness: 0.85 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.48, 3.35), bodyMat);
  body.position.y = 0.44;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.44, 1.72), glassMat);
  cabin.position.set(0, 0.88, -0.15);
  cabin.castShadow = true;
  car.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.07, 1.38), bodyMat);
  roof.position.set(0, 1.12, -0.15);
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

  const headBar = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.1, 0.05), headMat);
  headBar.position.set(0, 0.48, 1.68);
  car.add(headBar);

  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.09, 0.05), tailMat);
  tailBar.position.set(0, 0.5, -1.68);
  car.add(tailBar);

  // Charge port glowing ring on driver-side front-left fender (facing charger)
  const portRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.02, 8, 16),
    new THREE.MeshBasicMaterial({ color: '#10b981' })
  );
  portRing.rotation.y = Math.PI / 2;
  portRing.position.set(-0.79, 0.62, 0.65);
  car.add(portRing);

  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.19, 12);
  rimGeo.rotateZ(Math.PI / 2);
  [
    [-0.76, 0.24, 1.02],
    [0.76, 0.24, 1.02],
    [-0.76, 0.24, -1.02],
    [0.76, 0.24, -1.02]
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

export class ChargerStudio3D {
  constructor({ i18n, onRequestQuote, onClose }) {
    this.i18n = i18n;
    this.onRequestQuote = onRequestQuote;
    this.onClose = onClose;

    this.isOpen = false;
    this.mode = 'day'; // 'day' | 'night-bat' | 'night-grid'
    this.doorOpen = false;
    this.xray = false;
    this.autoSpin = false;
    this.activeCam = 'overview';
    this.rafId = null;
    this.lastTime = null;
    this.elapsed = 0;

    this.camTargetGoal = new THREE.Vector3(...CHARGER_CAMERA_PRESETS.overview.target);
    this.camPosGoal = new THREE.Vector3(...CHARGER_CAMERA_PRESETS.overview.pos);
    this.isLerpingCam = false;

    this.hotspotPins = [];
    this.circuits = {};
    this.naionBarMats = [];
    this.carHeadMats = [];
    this.carTailMats = [];
    this.lampBulbMats = [];
    this.doorPivot = null;
    this.coiledCableGroup = null;
    this.dockedGunGroup = null;
    this.activeCableGroup = null;
    this.rearCoverMat = null;
    this.topLedMat = null;
    this.doorLedMat = null;
    this.windRotor = null;
    this.windBeaconMat = null;
    this.starsMat = null;
    this.sunOrb = null;
    this.plinthBorderMat = null;

    this.buildModalDOM();
    this.bindEvents();
  }

  t(key) {
    const lang = this.i18n?.lang || 'en';
    const dict = CHARGER_STUDIO_TEXT[lang] || CHARGER_STUDIO_TEXT.en;
    return dict[key] ?? CHARGER_STUDIO_TEXT.en[key] ?? key;
  }

  loc(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const lang = this.i18n?.lang || 'en';
    return obj[lang] || obj.en || '';
  }

  buildModalDOM() {
    const modal = document.createElement('div');
    modal.id = 'charger-studio-modal';
    modal.className = 'ac-studio-modal';
    modal.setAttribute('data-thermal-mode', 'day');
    modal.hidden = true;
    modal.innerHTML = `
      <div class="ac-studio-backdrop" id="charger-studio-backdrop"></div>
      <div class="ac-studio-shell" role="dialog" aria-modal="true" aria-labelledby="charger-studio-title">
        <header class="ac-studio-header">
          <div class="ac-studio-title-wrap">
            <span class="ac-studio-badge" id="charger-studio-badge"></span>
            <h2 id="charger-studio-title"></h2>
            <p id="charger-studio-subtitle"></p>
          </div>
          <div class="ac-studio-header-actions">
            <button type="button" id="charger-btn-quote" class="ac-btn-primary"></button>
            <button type="button" id="charger-btn-close" class="ac-btn-close"></button>
          </div>
        </header>

        <div class="ac-studio-grid">
          <aside class="ac-specs-col left" id="charger-specs-left"></aside>

          <section class="ac-stage-center">
            <div class="home-telemetry-bar">
              <div class="home-tele-pill solar">
                <span class="home-tele-lbl" id="charger-lbl-power"></span>
                <strong id="charger-val-power">60 kW (60 kWh)</strong>
              </div>
              <div class="home-tele-pill grid">
                <span class="home-tele-lbl" id="charger-lbl-voltage"></span>
                <strong id="charger-val-voltage">500 V DC · 120 A</strong>
              </div>
              <div class="home-tele-pill battery">
                <span class="home-tele-lbl" id="charger-lbl-battery"></span>
                <strong id="charger-val-battery">92% (Charging)</strong>
              </div>
              <div class="home-tele-pill">
                <span class="home-tele-lbl" id="charger-lbl-door"></span>
                <strong id="charger-val-door">LOCKED (PIN/QR)</strong>
              </div>
            </div>

            <div class="ac-live-banner" id="charger-live-banner">
              <span class="ac-live-dot"></span>
              <span id="charger-live-status"></span>
            </div>

            <div class="ac-canvas-wrap">
              <canvas id="charger-studio-canvas"></canvas>
              <div class="ac-hotspot-layer" id="charger-hotspot-layer"></div>
            </div>

            <div class="home-conduit-legend">
              <span class="legend-chip solar"><i></i><span id="charger-leg-renew"></span></span>
              <span class="legend-chip battery"><i></i><span id="charger-leg-naion"></span></span>
              <span class="legend-chip loads"><i></i><span id="charger-leg-ev"></span></span>
              <span class="legend-chip grid"><i></i><span id="charger-leg-grid"></span></span>
            </div>

            <div class="ac-cam-pills">
              <button type="button" class="ac-cam-btn active" data-ccam="overview" id="ccam-overview"></button>
              <button type="button" class="ac-cam-btn" data-ccam="door" id="ccam-door"></button>
              <button type="button" class="ac-cam-btn" data-ccam="naion" id="ccam-naion"></button>
              <button type="button" class="ac-cam-btn" data-ccam="ev" id="ccam-ev"></button>
              <button type="button" class="ac-cam-btn" data-ccam="renew" id="ccam-renew"></button>
              <button type="button" class="ac-cam-btn" id="charger-btn-spin"></button>
            </div>
          </section>

          <aside class="ac-specs-col right" id="charger-specs-right"></aside>
        </div>

        <footer class="ac-control-dock">
          <div class="ac-dock-group home-mode-group">
            <button type="button" class="ac-mode-btn active" data-cmode="day" id="cmode-day"></button>
            <button type="button" class="ac-mode-btn" data-cmode="night-bat" id="cmode-night-bat"></button>
            <button type="button" class="ac-mode-btn" data-cmode="night-grid" id="cmode-night-grid"></button>
          </div>
          <div class="ac-dock-group">
            <button type="button" class="ac-cam-btn" id="charger-btn-unlock"></button>
            <button type="button" class="ac-cam-btn" id="charger-btn-xray"></button>
            <span class="ac-drag-hint home-hint" id="charger-drag-hint"></span>
          </div>
        </footer>
      </div>
    `;
    document.body.appendChild(modal);
    this.modal = modal;
    this.canvas = modal.querySelector('#charger-studio-canvas');
    this.hotspotLayer = modal.querySelector('#charger-hotspot-layer');
    this.syncLanguage();
  }

  initScene() {
    if (this.renderer) return;
    this.canvas = this.modal.querySelector('#charger-studio-canvas');
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
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#4a8fd4');
    this.scene.fog = new THREE.FogExp2('#4a8fd4', 0.015);

    this.camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.15, 140);
    this.camera.position.set(...CHARGER_CAMERA_PRESETS.overview.pos);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 2.6;
    this.controls.maxDistance = 22.0;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.target.set(...CHARGER_CAMERA_PRESETS.overview.target);
    this.controls.addEventListener('start', () => {
      this.isLerpingCam = false;
    });

    this.ambientLight = new THREE.AmbientLight('#dbeafe', 0.65);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight('#e0f2fe', '#1e293b', 1.15);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#fff8eb', 2.4);
    this.sunLight.position.set(-8, 14, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(perf.shadowMapSize, perf.shadowMapSize);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 45;
    const sd = 10;
    this.sunLight.shadow.camera.left = -sd;
    this.sunLight.shadow.camera.right = sd;
    this.sunLight.shadow.camera.top = sd;
    this.sunLight.shadow.camera.bottom = -sd;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 20, 20),
      new THREE.MeshBasicMaterial({ color: '#fef08a' })
    );
    this.sunOrb.position.set(-10, 10, -14);
    this.scene.add(this.sunOrb);

    // Night starfield
    const starCount = 220;
    const sPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 0.75 + 0.2);
      const r = 36 + Math.random() * 12;
      sPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      sPos[i * 3 + 1] = r * Math.cos(ph);
      sPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    this.starsMat = new THREE.PointsMaterial({
      color: '#e2e8f0',
      size: 0.28,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.scene.add(new THREE.Points(starGeo, this.starsMat));

    this.buildChargerDiorama();
    this.buildHotspotPins();
  }

  buildChargerDiorama() {
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    const silverMat = new THREE.MeshPhysicalMaterial({
      color: '#dbe2ea',
      roughness: 0.24,
      metalness: 0.72,
      clearcoat: 0.45
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.42,
      metalness: 0.68
    });
    const charcoalMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.58,
      metalness: 0.35
    });
    const smokedGlassMat = new THREE.MeshPhysicalMaterial({
      color: '#1e293b',
      transparent: true,
      opacity: 0.34,
      roughness: 0.04,
      metalness: 0.35,
      clearcoat: 1.0,
      reflectivity: 1.0,
      depthWrite: false
    });
    const concreteMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.8 });
    const asphaltMat = new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.88 });
    const meadowMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.88 });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.5 });

    // -------------------------------------------------------------------------
    // 1. PARKING ISLAND, BAY STRIPES, SOLAR & WIND BAY + UTILITY GRID CABINET
    // -------------------------------------------------------------------------
    const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.7, 10.5), charcoalMat);
    baseSlab.position.set(0, -0.35, -0.2);
    baseSlab.receiveShadow = true;
    this.rootGroup.add(baseSlab);

    this.plinthBorderMat = new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.65
    });
    const borderTrim = new THREE.Mesh(new THREE.BoxGeometry(14.7, 0.07, 10.7), this.plinthBorderMat);
    borderTrim.position.set(0, -0.02, -0.2);
    this.rootGroup.add(borderTrim);

    // Asphalt parking bay + green garden backdrop
    const asphalt = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.1, 6.4), asphaltMat);
    asphalt.position.set(0, 0.04, 1.6);
    asphalt.receiveShadow = true;
    this.rootGroup.add(asphalt);

    const garden = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.14, 3.8), meadowMat);
    garden.position.set(0, 0.06, -3.45);
    garden.receiveShadow = true;
    this.rootGroup.add(garden);

    const curb = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.18, 0.24), concreteMat);
    curb.position.set(0, 0.08, -1.55);
    this.rootGroup.add(curb);

    // Charger Concrete Pad at (0, 0.1, 0)
    const chargerPad = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 1.5), concreteMat);
    chargerPad.position.set(0, 0.12, 0);
    chargerPad.receiveShadow = true;
    this.rootGroup.add(chargerPad);

    // EV Parking Bay Striping & Yellow Wheel Stop
    [1.4, 4.5].forEach((lx) => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 4.4), whiteLineMat);
      stripe.position.set(lx, 0.095, 1.1);
      this.rootGroup.add(stripe);
    });
    const wheelStop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 0.18), yellowMat);
    wheelStop.position.set(2.95, 0.13, -1.05);
    this.rootGroup.add(wheelStop);

    // -------------------------------------------------------------------------
    // 2. HERO ANTI-THEFT 500V 60kW EV CHARGER + 100 kWh NA-ION BATTERY TOWER
    // -------------------------------------------------------------------------
    const towerGroup = new THREE.Group();
    towerGroup.position.set(0, 0.18, 0);

    // Plinth Base (dark charcoal)
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.22, 0.92), charcoalMat);
    plinth.position.y = 0.11;
    plinth.castShadow = true;
    towerGroup.add(plinth);

    // Brushed Aluminum Outer Shell (left, right, top cap — recessed front for door, cutaway rear for Na-ion!)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.38, 0.88), silverMat);
    leftWall.position.set(-0.53, 1.4, 0);
    leftWall.castShadow = true;
    towerGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.38, 0.88), silverMat);
    rightWall.position.set(0.53, 1.4, 0);
    rightWall.castShadow = true;
    towerGroup.add(rightWall);

    // Side ventilation louvers (5 dark slots on each side)
    [-0.605, 0.605].forEach((lx) => {
      for (let i = 0; i < 5; i++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.032, 0.18), charcoalMat);
        slot.position.set(lx, 2.02 + i * 0.075, -0.1);
        towerGroup.add(slot);
      }
    });

    // Top Silver Crown + Wrap-around Glowing Emerald LED Halo
    const topCap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.88), silverMat);
    topCap.position.y = 2.65;
    topCap.castShadow = true;
    towerGroup.add(topCap);

    this.topLedMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    const topLed = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.065, 0.9), this.topLedMat);
    topLed.position.y = 2.57;
    towerGroup.add(topLed);

    // Center Vertical Divider Bulkhead (separates front cable chamber from rear 100 kWh Na-ion bank)
    const midBulkhead = new THREE.Mesh(new THREE.BoxGeometry(0.94, 2.32, 0.08), darkMetalMat);
    midBulkhead.position.set(0, 1.38, 0.06);
    towerGroup.add(midBulkhead);

    // Rear Cutaway Cover (fades translucent in Na-ion Cutaway mode)
    this.rearCoverMat = new THREE.MeshPhysicalMaterial({
      color: '#cbd5e1',
      roughness: 0.28,
      metalness: 0.65,
      transparent: true,
      opacity: 0.96
    });
    const rearCover = new THREE.Mesh(new THREE.BoxGeometry(0.96, 2.34, 0.06), this.rearCoverMat);
    rearCover.position.set(0, 1.38, -0.41);
    towerGroup.add(rearCover);

    // Internal 100 kWh Na-ion Sodium-Ion Battery Stack (4 glowing modules in rear bay)
    const naionBadgeTex = createNaionBadgeTexture();
    const naionPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.76, 0.38),
      new THREE.MeshStandardMaterial({
        map: naionBadgeTex,
        emissiveMap: naionBadgeTex,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.55
      })
    );
    naionPlate.position.set(0, 2.22, -0.35);
    naionPlate.rotation.y = Math.PI;
    towerGroup.add(naionPlate);

    for (let m = 0; m < 4; m++) {
      const modBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.34, 0.32),
        new THREE.MeshStandardMaterial({ color: '#0f293a', roughness: 0.35, metalness: 0.55 })
      );
      modBox.position.set(0, 0.5 + m * 0.42, -0.18);
      towerGroup.add(modBox);

      const barMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
      this.naionBarMats.push(barMat);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.07, 0.04), barMat);
      bar.position.set(0, 0.5 + m * 0.42, -0.35);
      towerGroup.add(bar);
    }

    // Front Cable Chamber Interior (Holster + Docked Gun + Coiled Copper Cable)
    const chamberFloor = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.06, 0.34), charcoalMat);
    chamberFloor.position.set(0, 0.24, 0.25);
    towerGroup.add(chamberFloor);

    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.16), darkMetalMat);
    holster.position.set(0.18, 1.72, 0.16);
    towerGroup.add(holster);

    // Docked CCS2 Fast-Charging Gun
    this.dockedGunGroup = new THREE.Group();
    this.dockedGunGroup.position.set(0.18, 1.62, 0.24);
    const gunHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.34, 0.12),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 })
    );
    gunHandle.rotation.x = 0.22;
    this.dockedGunGroup.add(gunHandle);
    const gunNozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.16, 10),
      charcoalMat
    );
    gunNozzle.rotation.x = Math.PI / 2;
    gunNozzle.position.set(0, 0.12, -0.06);
    this.dockedGunGroup.add(gunNozzle);
    towerGroup.add(this.dockedGunGroup);

    // Coiled Heavy-Duty Copper Cable Loops hanging inside locked chamber
    this.coiledCableGroup = new THREE.Group();
    const blackCableMat = new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.55 });
    for (let loop = 0; loop < 3; loop++) {
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(0.24 + loop * 0.025, 0.028, 10, 26),
        blackCableMat
      );
      coil.scale.set(0.75, 1.9, 1.0);
      coil.position.set(0.16, 1.05 - loop * 0.02, 0.21 + loop * 0.02);
      this.coiledCableGroup.add(coil);
    }
    towerGroup.add(this.coiledCableGroup);

    // Active Extended 500V Cable (visible when Door is Unlocked & Charging EV!)
    this.activeCableGroup = new THREE.Group();
    this.activeCableGroup.visible = false;
    const extCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, 1.35, 0.22),
      new THREE.Vector3(0.72, 0.65, 0.68),
      new THREE.Vector3(1.45, 0.22, 0.92),
      new THREE.Vector3(2.14, 0.62, 0.65)
    ]);
    const extCableMesh = new THREE.Mesh(
      new THREE.TubeGeometry(extCurve, 24, 0.032, 8, false),
      new THREE.MeshStandardMaterial({
        color: '#0f172a',
        emissive: new THREE.Color('#0284c7'),
        emissiveIntensity: 0.35,
        roughness: 0.35
      })
    );
    this.activeCableGroup.add(extCableMesh);
    const extGun = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.12, 0.14),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25 })
    );
    extGun.position.set(2.14, 0.62, 0.65);
    this.activeCableGroup.add(extGun);
    towerGroup.add(this.activeCableGroup);

    // Front Anti-Theft Armored Glass Door (hinged at x = -0.46, z = +0.44)
    this.doorPivot = new THREE.Group();
    this.doorPivot.position.set(-0.46, 1.38, 0.44);

    // Door Frame Borders
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.05, 0.05), darkMetalMat);
    frameTop.position.set(0.46, 1.14, 0);
    this.doorPivot.add(frameTop);
    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.05, 0.05), darkMetalMat);
    frameBot.position.set(0.46, -1.14, 0);
    this.doorPivot.add(frameBot);
    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.32, 0.05), darkMetalMat);
    frameRight.position.set(0.91, 0, 0);
    this.doorPivot.add(frameRight);

    // Vertical Door Grab Handle
    const grabHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.07), darkMetalMat);
    grabHandle.position.set(0.87, -0.05, 0.04);
    this.doorPivot.add(grabHandle);

    // Left Integrated PIN / QR / RFID Control Panel inside Door
    const ctrlPanelTex = createControlPanelTexture();
    const ctrlPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 2.22, 0.03),
      new THREE.MeshStandardMaterial({
        map: ctrlPanelTex,
        emissiveMap: ctrlPanelTex,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.42,
        roughness: 0.18
      })
    );
    ctrlPanel.position.set(0.21, 0, 0.01);
    this.doorPivot.add(ctrlPanel);

    // Door Lock Status LED Indicator
    this.doorLedMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    const doorLockLed = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.04), this.doorLedMat);
    doorLockLed.position.set(0.21, 0.94, 0.015);
    this.doorPivot.add(doorLockLed);

    // Right Armored Smoked Glass Window covering Copper Cable Chamber
    const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.52, 2.22, 0.03), smokedGlassMat);
    doorGlass.position.set(0.66, 0, 0.01);
    doorGlass.renderOrder = 2;
    this.doorPivot.add(doorGlass);

    towerGroup.add(this.doorPivot);
    this.rootGroup.add(towerGroup);

    // -------------------------------------------------------------------------
    // 3. PARKED EV COUPE IN CHARGING BAY (x = 2.95, z = 0.55)
    // -------------------------------------------------------------------------
    const evCar = createParkedEvCoupe(this.carHeadMats, this.carTailMats);
    evCar.position.set(2.95, 0.09, 0.55);
    this.rootGroup.add(evCar);

    // -------------------------------------------------------------------------
    // 4. DAY RENEWABLES: SOLAR PV RACK + COMPACT WIND TURBINE (Left Side)
    // -------------------------------------------------------------------------
    const solarTex = createSolarTexture();
    const solarMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.22,
      metalness: 0.65,
      emissive: new THREE.Color('#0a2957'),
      emissiveIntensity: 0.24
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.35, metalness: 0.6 });

    for (let c = 0; c < 3; c++) {
      const sx = -4.6 + c * 1.48;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.72, 8), darkMetalMat);
      post.position.set(sx, 0.45, -2.85);
      this.rootGroup.add(post);

      const pv = createSolarPanelMesh(1.3, 1.0, 0.45, solarMat, frameMat);
      pv.group.position.set(sx, 0.78, -2.85);
      this.rootGroup.add(pv.group);
    }

    // Compact Wind Turbine at (-5.4, 0.12, -4.1)
    const tGroup = new THREE.Group();
    tGroup.position.set(-5.4, 0.12, -4.1);
    const whiteTurbMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 });
    const greenTipMat = new THREE.MeshStandardMaterial({ color: '#10b981', roughness: 0.35 });

    const tTower = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 4.2, 14), whiteTurbMat);
    tTower.position.y = 2.1;
    tTower.castShadow = true;
    tGroup.add(tTower);

    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.85), whiteTurbMat);
    nacelle.position.set(0, 4.25, -0.1);
    tGroup.add(nacelle);

    this.windBeaconMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), this.windBeaconMat);
    beacon.position.set(0, 4.48, -0.38);
    tGroup.add(beacon);

    this.windRotor = new THREE.Group();
    this.windRotor.position.set(0, 4.25, 0.36);
    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 12), whiteTurbMat);
    spinner.rotation.x = Math.PI / 2;
    spinner.position.z = 0.12;
    this.windRotor.add(spinner);

    for (let b = 0; b < 3; b++) {
      const piv = new THREE.Group();
      piv.rotation.z = (b * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.55, 0.04), whiteTurbMat);
      blade.position.y = 0.85;
      blade.rotation.y = 0.14;
      piv.add(blade);
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.035), greenTipMat);
      tip.position.y = 1.72;
      tip.rotation.y = 0.14;
      piv.add(tip);
      this.windRotor.add(piv);
    }
    tGroup.add(this.windRotor);
    this.rootGroup.add(tGroup);

    // -------------------------------------------------------------------------
    // 5. UTILITY GRID CABINET (Back-Right) + GARDEN HEDGES & LAMP
    // -------------------------------------------------------------------------
    const gridCab = new THREE.Group();
    gridCab.position.set(4.5, 0.14, -3.5);
    const gBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.45, 0.8), darkMetalMat);
    gBody.position.y = 0.72;
    gBody.castShadow = true;
    gridCab.add(gBody);
    const gStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.12, 0.04),
      new THREE.MeshBasicMaterial({ color: '#f59e0b' })
    );
    gStripe.position.set(0, 1.15, 0.41);
    gridCab.add(gStripe);
    this.rootGroup.add(gridCab);

    // Parking Bollard Lamp
    const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.2, 8), darkMetalMat);
    lampPost.position.set(-1.35, 0.7, -1.45);
    this.rootGroup.add(lampPost);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: '#fef08a',
      emissive: new THREE.Color('#fbbf24'),
      emissiveIntensity: 0.1
    });
    this.lampBulbMats.push(bulbMat);
    const lampCap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), bulbMat);
    lampCap.position.set(-1.35, 1.34, -1.45);
    this.rootGroup.add(lampCap);

    // Lush Green Shrubs matching reference background
    const bushMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.82 });
    [-2.0, -0.7, 0.8, 2.2, 5.8, -6.2].forEach((bx, idx) => {
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + (idx % 2) * 0.15, 1), bushMat);
      bush.scale.set(1.2, 0.85, 1.0);
      bush.position.set(bx, 0.45, -4.4);
      bush.castShadow = true;
      this.rootGroup.add(bush);
    });

    // -------------------------------------------------------------------------
    // 6. ANIMATED 3D ENERGY CONDUITS
    // -------------------------------------------------------------------------
    this.circuits.solarToCharger = createEnergyStream(
      [
        new THREE.Vector3(-3.1, 1.05, -2.85),
        new THREE.Vector3(-1.5, 0.85, -1.4),
        new THREE.Vector3(-0.3, 1.0, -0.2)
      ],
      '#facc15',
      6,
      0.048
    );
    this.rootGroup.add(this.circuits.solarToCharger.group);

    this.circuits.windToCharger = createEnergyStream(
      [
        new THREE.Vector3(-5.4, 4.1, -4.1),
        new THREE.Vector3(-5.4, 1.1, -4.1),
        new THREE.Vector3(-2.6, 0.8, -2.0),
        new THREE.Vector3(-0.3, 1.0, -0.2)
      ],
      '#10b981',
      7,
      0.048
    );
    this.rootGroup.add(this.circuits.windToCharger.group);

    this.circuits.naionToBus = createEnergyStream(
      [
        new THREE.Vector3(0.0, 0.85, -0.22),
        new THREE.Vector3(0.0, 1.55, -0.15),
        new THREE.Vector3(0.18, 1.6, 0.18)
      ],
      '#34d399',
      5,
      0.042
    );
    this.rootGroup.add(this.circuits.naionToBus.group);

    this.circuits.gridToCharger = createEnergyStream(
      [
        new THREE.Vector3(4.5, 1.05, -3.5),
        new THREE.Vector3(2.2, 0.65, -2.0),
        new THREE.Vector3(0.25, 0.9, -0.3)
      ],
      '#f59e0b',
      6,
      0.048
    );
    this.rootGroup.add(this.circuits.gridToCharger.group);

    this.circuits.chargerToEv = createEnergyStream(
      [
        new THREE.Vector3(0.18, 1.53, 0.4),
        new THREE.Vector3(0.72, 0.83, 0.86),
        new THREE.Vector3(1.45, 0.4, 1.1),
        new THREE.Vector3(2.14, 0.8, 0.83)
      ],
      '#38bdf8',
      7,
      0.052
    );
    this.rootGroup.add(this.circuits.chargerToEv.group);
  }

  buildHotspotPins() {
    if (!this.hotspotLayer) return;
    this.hotspotLayer.innerHTML = '';
    this.hotspotPins = CHARGER_HOTSPOTS.map((h) => {
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
      return { ...h, el: btn, vec: new THREE.Vector3(...h.pos) };
    });
  }

  bindEvents() {
    this.modal.querySelector('#charger-studio-backdrop')?.addEventListener('click', () => this.close());
    this.modal.querySelector('#charger-btn-close')?.addEventListener('click', () => this.close());
    this.modal.querySelector('#charger-btn-quote')?.addEventListener('click', () => {
      this.close();
      if (this.onRequestQuote) this.onRequestQuote();
    });

    this.modal.querySelectorAll('[data-cmode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setMode(btn.getAttribute('data-cmode'));
      });
    });

    this.modal.querySelectorAll('[data-ccam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.focusCamera(btn.getAttribute('data-ccam'));
      });
    });

    this.modal.querySelector('#charger-btn-unlock')?.addEventListener('click', () => {
      this.toggleDoor();
    });

    this.modal.querySelector('#charger-btn-xray')?.addEventListener('click', (e) => {
      this.xray = !this.xray;
      e.currentTarget.classList.toggle('active', this.xray);
    });

    this.modal.querySelector('#charger-btn-spin')?.addEventListener('click', (e) => {
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

  toggleDoor(forceState = null) {
    this.doorOpen = forceState !== null ? forceState : !this.doorOpen;
    if (this.coiledCableGroup) this.coiledCableGroup.visible = !this.doorOpen;
    if (this.dockedGunGroup) this.dockedGunGroup.visible = !this.doorOpen;
    if (this.activeCableGroup) this.activeCableGroup.visible = this.doorOpen;
    this.syncUnlockAndTelemetry();
  }

  setMode(mode) {
    if (!['day', 'night-bat', 'night-grid'].includes(mode)) return;
    this.mode = mode;
    this.modal.setAttribute('data-thermal-mode', mode);
    this.modal.querySelectorAll('[data-cmode]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-cmode') === mode);
    });
    this.syncUnlockAndTelemetry();
  }

  focusCamera(presetKey) {
    const p = CHARGER_CAMERA_PRESETS[presetKey];
    if (!p) return;
    this.activeCam = presetKey;
    this.camPosGoal.set(...p.pos);
    this.camTargetGoal.set(...p.target);
    this.isLerpingCam = true;
    this.modal.querySelectorAll('[data-ccam]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-ccam') === presetKey);
    });
    if (presetKey === 'naion' && !this.xray) {
      this.xray = true;
      this.modal.querySelector('#charger-btn-xray')?.classList.add('active');
    }
  }

  syncUnlockAndTelemetry() {
    const tel = CHARGER_MODE_TELEMETRY[this.mode] || CHARGER_MODE_TELEMETRY.day;
    const setText = (id, val) => {
      const el = this.modal.querySelector(`#${id}`);
      if (el) el.textContent = val;
    };
    setText('charger-val-power', tel.power);
    setText('charger-val-voltage', tel.voltage);
    setText('charger-val-battery', tel.battery);
    setText('charger-val-door', this.t(this.doorOpen ? 'doorOpenTxt' : 'doorLockedTxt'));

    const unlockBtn = this.modal.querySelector('#charger-btn-unlock');
    if (unlockBtn) {
      unlockBtn.textContent = this.t(this.doorOpen ? 'unlockBtnOpen' : 'unlockBtnLocked');
      unlockBtn.classList.toggle('active', this.doorOpen);
    }

    const statusObj = this.t('modeStatus');
    const statusText = typeof statusObj === 'object' ? statusObj[this.mode] || '' : '';
    setText('charger-live-status', statusText);

    const banner = this.modal.querySelector('#charger-live-banner');
    if (banner) {
      banner.classList.remove('heat', 'battery', 'grid');
      if (this.mode === 'night-bat') banner.classList.add('battery');
      else if (this.mode === 'night-grid') banner.classList.add('grid');
    }
  }

  syncLanguage() {
    if (!this.modal) return;
    const setText = (id, key) => {
      const el = this.modal.querySelector(`#${id}`);
      if (el) el.textContent = this.t(key);
    };
    setText('charger-studio-badge', 'badge');
    setText('charger-studio-title', 'title');
    setText('charger-studio-subtitle', 'subtitle');
    setText('charger-btn-quote', 'requestQuote');
    setText('charger-btn-close', 'closeBtn');
    setText('charger-lbl-power', 'telemetryPower');
    setText('charger-lbl-voltage', 'telemetryVoltage');
    setText('charger-lbl-battery', 'telemetryBattery');
    setText('charger-lbl-door', 'telemetryDoor');
    setText('charger-leg-renew', 'legendRenew');
    setText('charger-leg-naion', 'legendNaion');
    setText('charger-leg-ev', 'legendEv');
    setText('charger-leg-grid', 'legendGrid');
    setText('ccam-overview', 'camOverview');
    setText('ccam-door', 'camDoor');
    setText('ccam-naion', 'camNaion');
    setText('ccam-ev', 'camEv');
    setText('ccam-renew', 'camRenew');
    setText('charger-btn-spin', 'autoSpin');
    setText('charger-btn-xray', 'xrayBtn');
    setText('cmode-day', 'modeDay');
    setText('cmode-night-bat', 'modeNightBat');
    setText('cmode-night-grid', 'modeNightGrid');
    setText('charger-drag-hint', 'dragHint');

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

    renderSpecs('charger-specs-left', CHARGER_LEFT_SPECS);
    renderSpecs('charger-specs-right', CHARGER_RIGHT_SPECS);
    this.syncUnlockAndTelemetry();

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
    document.body.classList.add('ac-studio-open');
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
    document.body.classList.remove('ac-studio-open');
    document.body.style.overflow = '';
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.hotspotLayer) this.hotspotLayer.innerHTML = '';
    this.naionBarMats = [];
    this.carHeadMats = [];
    this.carTailMats = [];
    this.lampBulbMats = [];
    this.doorPivot = null;
    this.coiledCableGroup = null;
    this.dockedGunGroup = null;
    this.activeCableGroup = null;
    this.rearCoverMat = null;
    this.topLedMat = null;
    this.doorLedMat = null;
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
        this.camera.position.distanceTo(this.camPosGoal) < 0.05 &&
        this.controls.target.distanceTo(this.camTargetGoal) < 0.05
      ) {
        this.isLerpingCam = false;
      }
    }

    this.controls.autoRotate = this.autoSpin;
    this.controls.autoRotateSpeed = 0.85;
    this.controls.update();

    const mode = this.mode;
    const isDay = mode === 'day';
    const isNightBat = mode === 'night-bat';
    const isNightGrid = mode === 'night-grid';

    // 1. Sky & Day / Night Lighting
    const targetSky = isDay ? '#4a8fd4' : isNightBat ? '#071626' : '#0f1322';
    this.scene.background.lerp(new THREE.Color(targetSky), 1 - Math.exp(-4 * dt));
    if (this.scene.fog) this.scene.fog.color.copy(this.scene.background);

    this.sunLight.intensity = isDay ? 2.4 : 0.55;
    this.sunLight.color.set(isDay ? '#fff8eb' : '#93c5fd');
    this.hemiLight.intensity = isDay ? 1.15 : 0.48;
    this.ambientLight.intensity = isDay ? 0.65 : 0.35;
    if (this.sunOrb) this.sunOrb.visible = isDay;
    if (this.starsMat) this.starsMat.opacity = isDay ? 0.0 : 0.85;

    const nightGlow = isDay ? 0.08 : 1.0;
    this.lampBulbMats.forEach((m) => {
      m.emissiveIntensity = nightGlow * 2.4;
    });
    this.carHeadMats.forEach((m) => {
      m.emissiveIntensity = 0.15 + nightGlow * 2.2;
    });
    this.carTailMats.forEach((m) => {
      m.emissiveIntensity = 0.2 + nightGlow * 1.9;
    });

    // 2. Smooth Anti-Theft Door Swing & Top LED Halo Color
    if (this.doorPivot) {
      const targetAngle = this.doorOpen ? -1.48 : 0.0;
      this.doorPivot.rotation.y += (targetAngle - this.doorPivot.rotation.y) * Math.min(1, dt * 7.5);
    }
    if (this.topLedMat) {
      this.topLedMat.color.set(
        this.doorOpen ? '#38bdf8' : isNightGrid ? '#f59e0b' : '#10b981'
      );
    }
    if (this.doorLedMat) {
      this.doorLedMat.color.set(this.doorOpen ? '#38bdf8' : '#10b981');
    }

    // 3. Rear Cutaway Transparency for 100 kWh Na-ion Battery Inspection
    if (this.rearCoverMat) {
      const targetOp = this.xray ? 0.14 : 0.96;
      this.rearCoverMat.opacity += (targetOp - this.rearCoverMat.opacity) * Math.min(1, dt * 6.0);
    }

    // 4. Wind Turbine Spin & Na-ion Battery Bars
    if (this.windRotor) {
      this.windRotor.rotation.z -= (isDay ? 2.4 : 0.8) * dt;
    }
    if (this.windBeaconMat) {
      this.windBeaconMat.color.setHex(Math.sin(elapsed * 4.5) > 0 ? 0xff2a4b : 0x10b981);
    }
    this.naionBarMats.forEach((bm, idx) => {
      const pulse = 0.65 + 0.35 * Math.sin(elapsed * 4 - idx * 0.6);
      bm.color.set(isNightBat && idx === 3 && pulse > 0.72 ? '#38bdf8' : '#10b981');
    });

    // 5. Animated Energy Conduits
    const animStream = (stream, active, speed) => {
      if (!stream) return;
      stream.tubeMat.opacity = active ? 0.5 : 0.05;
      stream.beads.forEach((b) => {
        b.mesh.visible = active;
        if (!active) return;
        const u = (b.offset + elapsed * speed) % 1;
        stream.curve.getPointAt(u, b.mesh.position);
      });
    };

    animStream(this.circuits.solarToCharger, isDay, 0.45);
    animStream(this.circuits.windToCharger, isDay, 0.42);
    animStream(this.circuits.naionToBus, isDay || isNightBat, isNightBat ? 0.52 : 0.3);
    animStream(this.circuits.gridToCharger, isNightGrid, 0.48);
    animStream(this.circuits.chargerToEv, this.doorOpen, 0.56);

    // 6. Floating 2-Line 3D Callouts
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
