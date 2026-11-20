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

function createParkingTotemTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 512);

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 240, 496);

  ctx.fillStyle = '#10b981';
  ctx.fillRect(22, 24, 212, 74);
  ctx.fillStyle = '#031c12';
  ctx.font = '900 32px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NEO®', 128, 62);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 84px Inter, Arial, sans-serif';
  ctx.fillText('P', 128, 168);

  ctx.fillStyle = '#34d399';
  ctx.font = '800 30px Inter, Arial, sans-serif';
  ctx.fillText('LIBRE 18/24', 128, 248);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(26, 294, 204, 82);
  ctx.fillStyle = '#fde047';
  ctx.font = '800 28px Inter, Arial, sans-serif';
  ctx.fillText('⚡ 150 kW EV', 128, 336);

  ctx.fillStyle = '#4ade80';
  ctx.font = '800 24px Inter, Arial, sans-serif';
  ctx.fillText('🌿 65% BIO', 128, 428);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createEcoDriveSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#052e16';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 34px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CLICK & COLLECT EV', 256, 48);

  ctx.fillStyle = '#34d399';
  ctx.font = '700 22px Inter, Arial, sans-serif';
  ctx.fillText('ZERO-EMISSION PICKUP BAY', 256, 90);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRoadArrowMesh(dirAngle, mat) {
  const arrow = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.018, 0.78), mat);
  shaft.position.set(0, 0, -0.08);
  arrow.add(shaft);

  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.018, 0.44), mat);
  leftWing.position.set(-0.14, 0, 0.25);
  leftWing.rotation.y = Math.PI / 4;
  arrow.add(leftWing);

  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.018, 0.44), mat);
  rightWing.position.set(0.14, 0, 0.25);
  rightWing.rotation.y = -Math.PI / 4;
  arrow.add(rightWing);

  arrow.rotation.y = dirAngle;
  return arrow;
}

function createParkedEvCar(colorHex, headLightMats, tailLightMats, isVan = false) {
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

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, isVan ? 0.56 : 0.38, isVan ? 2.62 : 2.38),
    bodyMat
  );
  body.position.y = isVan ? 0.45 : 0.36;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.02, isVan ? 0.48 : 0.34, isVan ? 1.85 : 1.24),
    isVan ? bodyMat : glassMat
  );
  cabin.position.set(0, isVan ? 0.92 : 0.7, isVan ? -0.18 : -0.1);
  cabin.castShadow = true;
  car.add(cabin);

  if (isVan) {
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.36, 0.1), glassMat);
    windshield.position.set(0, 0.9, 0.72);
    car.add(windshield);
  } else {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.06, 1.0), bodyMat);
    roof.position.set(0, 0.89, -0.1);
    car.add(roof);
  }

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

  const zEnd = isVan ? 1.32 : 1.19;
  const headBar = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.09, 0.05), headMat);
  headBar.position.set(0, 0.42, zEnd);
  car.add(headBar);

  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.08, 0.05), tailMat);
  tailBar.position.set(0, 0.44, -zEnd);
  car.add(tailBar);

  const wheelGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.14, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 10);
  rimGeo.rotateZ(Math.PI / 2);
  const wzOff = isVan ? 0.84 : 0.72;
  [
    [-0.58, 0.19, wzOff],
    [0.58, 0.19, wzOff],
    [-0.58, 0.19, -wzOff],
    [0.58, 0.19, -wzOff]
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

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.95, 8), trunkMat);
  trunk.position.y = 0.48;
  trunk.castShadow = true;
  tree.add(trunk);

  if (variant === 2) {
    // Ornamental blossom tree
    const p1 = new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.72 });
    const p2 = new THREE.MeshStandardMaterial({ color: '#fbcfe8', roughness: 0.68 });
    [
      [0, 1.38, 0, 0.72, p1],
      [0.32, 1.56, 0.18, 0.5, p2],
      [-0.3, 1.52, -0.16, 0.52, p2],
      [0.04, 1.84, 0, 0.45, p1]
    ].forEach(([bx, by, bz, r, mat]) => {
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
      foliage.position.set(bx, by, bz);
      foliage.castShadow = true;
      tree.add(foliage);
    });
  } else {
    const c1 = new THREE.MeshStandardMaterial({ color: greens[variant % 2], roughness: 0.78 });
    const c2 = new THREE.MeshStandardMaterial({ color: greens[(variant % 2) + 2], roughness: 0.72 });
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
  }

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

function createPedestrianWalker(shirtColor) {
  const walker = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: '#f5d0b5', roughness: 0.7 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.09), pantsMat);
  leftLeg.position.set(-0.055, 0.14, 0);
  walker.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.09), pantsMat);
  rightLeg.position.set(0.055, 0.14, 0);
  walker.add(rightLeg);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.13), shirtMat);
  torso.position.set(0, 0.41, 0);
  torso.castShadow = true;
  walker.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), skinMat);
  head.position.set(0, 0.63, 0);
  head.castShadow = true;
  walker.add(head);

  walker.userData = { leftLeg, rightLeg };
  return walker;
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
    this.windRotors = [];
    this.movingCars = [];
    this.walkers = [];
    this.windBeaconMats = [];
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
          <div class="ac-studio-title-wrap">
            <span class="ac-studio-badge" id="parking-studio-badge"></span>
            <h2 id="parking-studio-title"></h2>
            <p id="parking-studio-subtitle"></p>
          </div>
          <div class="ac-studio-header-actions">
            <button type="button" id="parking-btn-quote" class="ac-btn-primary"></button>
            <button type="button" id="parking-btn-close" class="ac-btn-close"></button>
          </div>
        </header>

        <div class="ac-studio-grid">
          <aside class="ac-specs-col left" id="parking-specs-left"></aside>

          <section class="ac-stage-center">
            <div class="home-telemetry-bar">
              <div class="home-tele-pill solar">
                <span class="home-tele-lbl" id="parking-lbl-solar"></span>
                <strong id="parking-val-solar">96.4 kW</strong>
              </div>
              <div class="home-tele-pill battery">
                <span class="home-tele-lbl" id="parking-lbl-wind"></span>
                <strong id="parking-val-wind">8.2 kW</strong>
              </div>
              <div class="home-tele-pill grid">
                <span class="home-tele-lbl" id="parking-lbl-ev"></span>
                <strong id="parking-val-ev">44 kW (4 EV)</strong>
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

            <div class="ac-cam-pills">
              <button type="button" class="ac-cam-btn active" data-pcam="overview" id="pcam-overview"></button>
              <button type="button" class="ac-cam-btn" data-pcam="canopy" id="pcam-canopy"></button>
              <button type="button" class="ac-cam-btn" data-pcam="bio" id="pcam-bio"></button>
              <button type="button" class="ac-cam-btn" data-pcam="field" id="pcam-field"></button>
              <button type="button" class="ac-cam-btn" data-pcam="market" id="pcam-market"></button>
              <button type="button" class="ac-cam-btn" id="parking-btn-spin"></button>
            </div>
          </section>

          <aside class="ac-specs-col right" id="parking-specs-right"></aside>
        </div>

        <footer class="ac-control-dock">
          <div class="ac-dock-group home-mode-group">
            <button type="button" class="ac-mode-btn active" data-pmode="sunny" id="pmode-sunny"></button>
            <button type="button" class="ac-mode-btn" data-pmode="windy" id="pmode-windy"></button>
            <button type="button" class="ac-mode-btn" data-pmode="hybrid" id="pmode-hybrid"></button>
          </div>
          <div class="ac-dock-group">
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
    this.scene.fog = new THREE.FogExp2('#4a8fd4', 0.0085);

    this.camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.2, 220);
    this.camera.position.set(...PARKING_CAMERA_PRESETS.overview.pos);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 7.0;
    this.controls.maxDistance = 52.0;
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
    this.sunLight.position.set(-18, 28, 22);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(perf.shadowMapSize, perf.shadowMapSize);
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 95;
    const sd = 26;
    this.sunLight.shadow.camera.left = -sd;
    this.sunLight.shadow.camera.right = sd;
    this.sunLight.shadow.camera.top = sd;
    this.sunLight.shadow.camera.bottom = -sd;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 20, 20),
      new THREE.MeshBasicMaterial({ color: '#fef08a' })
    );
    this.sunOrb.position.set(-22, 18, -26);
    this.scene.add(this.sunOrb);

    // Subtle twilight starfield
    const starCount = 300;
    const sPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 0.72 + 0.22);
      const r = 68 + Math.random() * 18;
      sPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      sPos[i * 3 + 1] = r * Math.cos(ph);
      sPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    this.starsMat = new THREE.PointsMaterial({
      color: '#e2e8f0',
      size: 0.42,
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
    const roadAsphaltMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.88, metalness: 0.04 });
    const meadowMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.9 });
    const bioGridMat = new THREE.MeshStandardMaterial({ color: '#2b5e38', roughness: 0.88 });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: '#facc15' });

    // -------------------------------------------------------------------------
    // 1. EXPANDED MASTER ISLAND PLINTH (42 x 30), BOULEVARD ROAD & AISLE NETWORK
    // -------------------------------------------------------------------------
    const baseSlab = new THREE.Mesh(
      new THREE.BoxGeometry(42.0, 0.95, 30.0),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.75 })
    );
    baseSlab.position.set(0, -0.5, 0);
    baseSlab.receiveShadow = true;
    this.rootGroup.add(baseSlab);

    this.plinthBorderMat = new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.6
    });
    const borderTrim = new THREE.Mesh(new THREE.BoxGeometry(42.25, 0.09, 30.25), this.plinthBorderMat);
    borderTrim.position.set(0, -0.06, 0);
    this.rootGroup.add(borderTrim);

    // Commercial Asphalt Plaza (X = -19.5 .. +7.5, Z = -13.8 .. +9.5)
    const parkingAsphalt = new THREE.Mesh(new THREE.BoxGeometry(27.0, 0.12, 23.3), asphaltMat);
    parkingAsphalt.position.set(-6.0, 0.0, -2.15);
    parkingAsphalt.receiveShadow = true;
    this.rootGroup.add(parkingAsphalt);

    // Adjacent Side Eco-Energy Meadow / Field (X = +7.5 .. +20.4, Z = -13.8 .. +9.5)
    const sideMeadow = new THREE.Mesh(new THREE.BoxGeometry(12.9, 0.16, 23.3), meadowMat);
    sideMeadow.position.set(13.95, 0.02, -2.15);
    sideMeadow.receiveShadow = true;
    this.rootGroup.add(sideMeadow);

    // Clean stone border dividing commercial plaza and renewable meadow
    const meadowCurb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 23.3), sidewalkMat);
    meadowCurb.position.set(7.5, 0.08, -2.15);
    this.rootGroup.add(meadowCurb);

    // Rolling meadow turf hillocks under the two wind turbines
    [
      [14.8, -6.8, 3.2, 4.0],
      [17.4, 2.8, 2.3, 3.0]
    ].forEach(([hx, hz, r1, r2]) => {
      const hill = new THREE.Mesh(
        new THREE.CylinderGeometry(r1, r2, 0.24, 20),
        new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.9 })
      );
      hill.position.set(hx, 0.12, hz);
      hill.receiveShadow = true;
      this.rootGroup.add(hill);
    });

    // Two-Lane Front Boulevard Road (X = -20.4 .. +20.4, Z = +9.5 .. +14.3)
    const boulevardRoad = new THREE.Mesh(new THREE.BoxGeometry(40.8, 0.13, 4.8), roadAsphaltMat);
    boulevardRoad.position.set(0, 0.005, 11.9);
    boulevardRoad.receiveShadow = true;
    this.rootGroup.add(boulevardRoad);

    // Outer sidewalk apron along front road edge
    const outerSidewalk = new THREE.Mesh(new THREE.BoxGeometry(40.8, 0.15, 0.62), sidewalkMat);
    outerSidewalk.position.set(0, 0.02, 14.56);
    outerSidewalk.receiveShadow = true;
    this.rootGroup.add(outerSidewalk);

    // Boulevard lane striping (dashed centerline + crisp edge lines)
    [9.72, 14.12].forEach((lz) => {
      const edgeLine = new THREE.Mesh(new THREE.BoxGeometry(40.4, 0.018, 0.1), whiteLineMat);
      edgeLine.position.set(0, 0.075, lz);
      this.rootGroup.add(edgeLine);
    });
    for (let dx = -19.0; dx <= 19.2; dx += 2.6) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.018, 0.1), whiteLineMat);
      dash.position.set(dx, 0.075, 11.9);
      this.rootGroup.add(dash);
    }

    // Boulevard Pedestrian Zebra Crosswalk at x = -3.0
    const bCrossPad = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.014, 4.15),
      new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.75 })
    );
    bCrossPad.position.set(-3.0, 0.072, 11.9);
    this.rootGroup.add(bCrossPad);
    for (let cz = 10.15; cz <= 13.7; cz += 0.68) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.018, 0.34), whiteLineMat);
      stripe.position.set(-3.0, 0.078, cz);
      this.rootGroup.add(stripe);
    }

    // Landscaped Boulevard Median Segments with ENTRY (-15.2) & EXIT (+5.8) Driveway Cuts
    [
      [-18.3, 2.4],
      [-4.35, 17.5],
      [13.85, 12.9]
    ].forEach(([mx, mw]) => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(mw, 0.2, 0.72), sidewalkMat);
      curb.position.set(mx, 0.1, 9.48);
      this.rootGroup.add(curb);
      const soil = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.4, mw - 0.18), 0.22, 0.52), meadowMat);
      soil.position.set(mx, 0.11, 9.48);
      this.rootGroup.add(soil);
    });

    // Illuminated Smart Parking Entrance Totem Pylon next to ENTRY Driveway
    const totemGroup = new THREE.Group();
    totemGroup.position.set(-13.05, 0.08, 9.45);
    const totemBase = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.55), slateMat);
    totemBase.position.y = 0.11;
    totemGroup.add(totemBase);
    const totemBody = new THREE.Mesh(new THREE.BoxGeometry(0.82, 2.35, 0.34), steelMat);
    totemBody.position.y = 1.38;
    totemBody.castShadow = true;
    totemGroup.add(totemBody);
    const totemTex = createParkingTotemTexture();
    const totemScreenMat = new THREE.MeshStandardMaterial({
      map: totemTex,
      emissiveMap: totemTex,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.45,
      roughness: 0.2
    });
    const totemFaceF = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 2.18), totemScreenMat);
    totemFaceF.position.set(0, 1.38, 0.175);
    totemGroup.add(totemFaceF);
    const totemFaceB = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 2.18), totemScreenMat);
    totemFaceB.position.set(0, 1.38, -0.175);
    totemFaceB.rotation.y = Math.PI;
    totemGroup.add(totemFaceB);
    this.rootGroup.add(totemGroup);

    // Wide Internal Driving Aisle Painted Arrows (Entry, Exit, North & South Aisles)
    // Entry arrows pointing North (-Z, Math.PI) at x = -15.3
    [-15.3].forEach((ax) => {
      [10.2, 8.2].forEach((az) => {
        const arr = createRoadArrowMesh(Math.PI, whiteLineMat);
        arr.position.set(ax, 0.075, az);
        this.rootGroup.add(arr);
      });
    });
    // Exit arrows pointing South (+Z, 0) at x = +5.9
    [8.2, 10.2].forEach((az) => {
      const arr = createRoadArrowMesh(0, whiteLineMat);
      arr.position.set(5.9, 0.075, az);
      this.rootGroup.add(arr);
    });
    // North Driving Aisle arrows (Z = -1.5: Eastward top lane + Westward bottom lane)
    [-12.0, -6.0, 0.0].forEach((ax) => {
      const arrE = createRoadArrowMesh(Math.PI / 2, whiteLineMat);
      arrE.position.set(ax, 0.075, -1.9);
      this.rootGroup.add(arrE);
      const arrW = createRoadArrowMesh(-Math.PI / 2, whiteLineMat);
      arrW.position.set(ax + 1.8, 0.075, -1.0);
      this.rootGroup.add(arrW);
    });
    // South Driving Aisle arrows (Z = +7.35)
    [-12.0, -6.0, 0.0].forEach((ax) => {
      const arrE = createRoadArrowMesh(Math.PI / 2, whiteLineMat);
      arrE.position.set(ax, 0.075, 7.35);
      this.rootGroup.add(arrE);
    });
    // Boulevard arrows (Westbound z = +10.8, Eastbound z = +12.95)
    [-11.0, -5.0, 4.0, 13.0].forEach((ax) => {
      const arrW = createRoadArrowMesh(-Math.PI / 2, whiteLineMat);
      arrW.position.set(ax, 0.08, 10.8);
      this.rootGroup.add(arrW);
      const arrE = createRoadArrowMesh(Math.PI / 2, whiteLineMat);
      arrE.position.set(ax + 1.5, 0.08, 12.95);
      this.rootGroup.add(arrE);
    });

    // Pedestrian Promenade along Supermarket Facade (X = -18.8 .. +6.4, Z = -5.8 .. -3.3)
    const promenade = new THREE.Mesh(new THREE.BoxGeometry(25.2, 0.14, 2.5), sidewalkMat);
    promenade.position.set(-6.2, 0.05, -4.55);
    promenade.receiveShadow = true;
    this.rootGroup.add(promenade);

    // Tactile yellow curb strip along promenade edge
    const curbTrim = new THREE.Mesh(new THREE.BoxGeometry(25.2, 0.02, 0.14), yellowLineMat);
    curbTrim.position.set(-6.2, 0.125, -3.34);
    this.rootGroup.add(curbTrim);

    // 2 Zebra Crosswalks over North Driving Aisle (Z = -1.5) to Canopy & Bio-Parking
    [-8.5, 1.6].forEach((cx) => {
      for (let s = -0.9; s <= 0.91; s += 0.45) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.018, 2.9), whiteLineMat);
        stripe.position.set(cx + s, 0.072, -1.5);
        this.rootGroup.add(stripe);
      }
    });

    // Entry & Exit driveway crosswalks
    [-15.3, 5.9].forEach((dx) => {
      for (let s = -1.1; s <= 1.11; s += 0.55) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.018, 0.9), whiteLineMat);
        stripe.position.set(dx + s, 0.075, 9.48);
        this.rootGroup.add(stripe);
      }
    });

    // Tall Modern Boulevard Street Lamps along outer & inner sidewalks
    [-18.0, -10.5, -2.5, 7.5, 16.5].forEach((lx) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.1, 8), steelMat);
      pole.position.set(lx, 2.05, 14.56);
      pole.castShadow = true;
      this.rootGroup.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), steelMat);
      arm.position.set(lx, 4.02, 14.15);
      this.rootGroup.add(arm);

      const bulbMat = new THREE.MeshStandardMaterial({
        color: '#fef08a',
        emissive: new THREE.Color('#fde047'),
        emissiveIntensity: 0.12
      });
      this.lampBulbMats.push(bulbMat);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.22), bulbMat);
      head.position.set(lx, 3.96, 13.78);
      this.rootGroup.add(head);
    });

    // -------------------------------------------------------------------------
    // 2. GRAND MULTI-WING NEO® ECO-MARKET COMPLEX (Z = -13.2 .. -5.8)
    // -------------------------------------------------------------------------
    const marketGroup = new THREE.Group();
    marketGroup.position.set(-5.8, 0.06, -9.2);

    // Main Hypermarket Hall (centered slightly left at x = -0.8)
    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(15.2, 3.85, 6.2), creamMat);
    mainHall.position.set(-0.8, 1.92, 0);
    mainHall.castShadow = true;
    mainHall.receiveShadow = true;
    marketGroup.add(mainHall);

    // Double-tier architectural red fascia parapet & crisp roof slab
    const fasciaBand = new THREE.Mesh(new THREE.BoxGeometry(15.65, 0.42, 6.6), accentRedMat);
    fasciaBand.position.set(-0.8, 3.96, 0);
    fasciaBand.castShadow = true;
    marketGroup.add(fasciaBand);

    const upperParapet = new THREE.Mesh(new THREE.BoxGeometry(15.35, 0.16, 6.32), creamMat);
    upperParapet.position.set(-0.8, 4.22, 0);
    upperParapet.receiveShadow = true;
    marketGroup.add(upperParapet);

    // Left Wing: Click-&-Collect EV Pickup Zone (local x = -10.6 -> world X = -18.6..-14.2)
    const clickWing = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.1, 5.0), slateMat);
    clickWing.position.set(-10.6, 1.55, 0.3);
    clickWing.castShadow = true;
    clickWing.receiveShadow = true;
    marketGroup.add(clickWing);

    const clickTrim = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.2, 5.25), creamMat);
    clickTrim.position.set(-10.6, 3.16, 0.3);
    marketGroup.add(clickTrim);

    const pickupAwning = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 1.2), steelMat);
    pickupAwning.position.set(-10.6, 2.35, 3.3);
    pickupAwning.castShadow = true;
    marketGroup.add(pickupAwning);

    const ecoDriveTex = createEcoDriveSignTexture();
    const ecoDriveMat = new THREE.MeshStandardMaterial({
      map: ecoDriveTex,
      emissiveMap: ecoDriveTex,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.38,
      roughness: 0.25
    });
    const ecoDriveSign = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.9), ecoDriveMat);
    ecoDriveSign.position.set(-10.6, 2.75, 2.86);
    marketGroup.add(ecoDriveSign);

    // Right Wing: Organic Bakery & Rooftop Garden Cafe (local x = +9.2 -> world X = +0.8..+6.0)
    const cafeWing = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.0, 5.2), slateMat);
    cafeWing.position.set(9.2, 1.5, 0.4);
    cafeWing.castShadow = true;
    cafeWing.receiveShadow = true;
    marketGroup.add(cafeWing);

    const cafeDeckTrim = new THREE.Mesh(new THREE.BoxGeometry(5.45, 0.2, 5.45), creamMat);
    cafeDeckTrim.position.set(9.2, 3.06, 0.4);
    marketGroup.add(cafeDeckTrim);

    // Timber cafe rooftop terrace guard & planters
    const deckFloor = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 4.6), timberMat);
    deckFloor.position.set(9.2, 3.2, 0.4);
    marketGroup.add(deckFloor);

    [7.4, 9.2, 11.0].forEach((px, idx) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.36, 1.1), timberMat);
      box.position.set(px, 3.4, -0.9);
      marketGroup.add(box);
      const miniTree = createLushTree(0.72, idx === 1 ? 2 : idx);
      miniTree.position.set(px, 3.55, -0.9);
      marketGroup.add(miniTree);
    });

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

    const shopInterior = new THREE.Mesh(new THREE.BoxGeometry(14.0, 2.55, 0.2), this.marketInteriorMat);
    shopInterior.position.set(-0.8, 1.38, 3.04);
    marketGroup.add(shopInterior);

    const shopGlass = new THREE.Mesh(new THREE.BoxGeometry(14.3, 2.65, 0.08), glassFrontMat);
    shopGlass.position.set(-0.8, 1.38, 3.13);
    marketGroup.add(shopGlass);

    for (let mx = -7.6; mx <= 6.01; mx += 1.7) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.7, 0.15), steelMat);
      mullion.position.set(mx, 1.38, 3.14);
      marketGroup.add(mullion);
    }

    // Cafe Wing glowing glass + Click-&-Collect service window
    const cafeInterior = new THREE.Mesh(new THREE.BoxGeometry(4.3, 2.05, 0.18), this.marketInteriorMat);
    cafeInterior.position.set(9.2, 1.15, 2.96);
    marketGroup.add(cafeInterior);

    const clickInterior = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.7, 0.18), this.marketInteriorMat);
    clickInterior.position.set(-10.6, 0.98, 2.76);
    marketGroup.add(clickInterior);

    // Grand Entrance Atrium Canopy & Large Illuminated "NEO® ECO-MARKET" Billboard
    const entryCanopy = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.24, 1.85), accentRedMat);
    entryCanopy.position.set(-0.8, 2.75, 3.9);
    entryCanopy.castShadow = true;
    marketGroup.add(entryCanopy);

    [ -3.3, 1.7 ].forEach((px) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 2.7, 10), steelMat);
      pillar.position.set(px, 1.35, 4.65);
      pillar.castShadow = true;
      marketGroup.add(pillar);
    });

    const marketSignTex = createMarketSignTexture();
    this.marketSignMat = new THREE.MeshStandardMaterial({
      map: marketSignTex,
      emissiveMap: marketSignTex,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.45,
      roughness: 0.25
    });
    const signBox = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.5, 0.26), steelMat);
    signBox.position.set(-0.8, 4.92, 3.18);
    signBox.castShadow = true;
    marketGroup.add(signBox);

    const signFace = new THREE.Mesh(new THREE.PlaneGeometry(6.95, 1.32), this.marketSignMat);
    signFace.position.set(-0.8, 4.92, 3.32);
    marketGroup.add(signFace);

    // Rooftop Solar Power Plant: 3 rows x 6 panels on Main Hall + 3 panels on Click Wing
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 6; c++) {
        const panel = createSolarPanelMesh(2.05, 1.25, 0.28, solarMat, frameMat);
        panel.group.position.set(-6.3 + c * 2.2, 4.3, -1.9 + r * 1.85);
        marketGroup.add(panel.group);
        this.trackingPanels.push({ panelGroup: panel.panelGroup, baseTilt: 0.28, phase: r + c * 0.35 });
      }
    }
    for (let c = 0; c < 3; c++) {
      const wPanel = createSolarPanelMesh(1.22, 1.65, 0.3, solarMat, frameMat);
      wPanel.group.position.set(-11.95 + c * 1.35, 3.26, 0.3);
      marketGroup.add(wPanel.group);
      this.trackingPanels.push({ panelGroup: wPanel.panelGroup, baseTilt: 0.3, phase: c * 0.5 });
    }

    // 2 Rooftop Heat-Pump / HVAC Units behind main parapet
    [-5.8, 3.8].forEach((hx) => {
      const hvac = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.72, 1.05), slateMat);
      hvac.position.set(hx, 4.66, -2.15);
      hvac.castShadow = true;
      marketGroup.add(hvac);
    });

    // Outdoor Bakery / Cafe Tables & Parasols along Promenade (world X = +1.4 .. +5.4)
    [7.2, 8.2, 9.2, 10.2, 11.2].forEach((tx, idx) => {
      const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 10), creamMat);
      tbl.position.set(tx, 0.48, 4.55 + (idx % 2) * 0.35);
      marketGroup.add(tbl);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.35, 6), steelMat);
      pole.position.set(tx, 0.72, 4.55 + (idx % 2) * 0.35);
      marketGroup.add(pole);
      const parasol = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.26, 8), idx % 2 === 0 ? creamMat : accentRedMat);
      parasol.position.set(tx, 1.44, 4.55 + (idx % 2) * 0.35);
      marketGroup.add(parasol);
    });

    this.marketLight = new THREE.PointLight('#fde68a', 0.45, 22);
    this.marketLight.position.set(-0.8, 2.5, 4.6);
    marketGroup.add(this.marketLight);

    this.rootGroup.add(marketGroup);

    // Click-&-Collect Electric Delivery Van parked neatly beside West Promenade edge
    const ecoVan = createParkedEvCar('#10b981', this.carHeadMats, this.carTailMats, true);
    ecoVan.position.set(-17.4, 0.07, -4.55);
    ecoVan.rotation.y = Math.PI / 2;
    this.rootGroup.add(ecoVan);

    // Covered Shopping Cart Corral on Promenade (world x = -8.4, z = -4.2)
    const corralGroup = new THREE.Group();
    corralGroup.position.set(-8.4, 0.12, -4.25);
    const corralFrame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 1.05), glassFrontMat);
    corralFrame.position.y = 0.5;
    corralGroup.add(corralFrame);
    const corralRoof = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.1, 1.2), accentRedMat);
    corralRoof.position.y = 1.02;
    corralGroup.add(corralRoof);
    for (let cx = -0.65; cx <= 0.66; cx += 0.32) {
      const cart = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, 0.48), frameMat);
      cart.position.set(cx, 0.25, 0);
      corralGroup.add(cart);
    }
    this.rootGroup.add(corralGroup);

    // Solar E-Bike & E-Scooter Charging Shelter on West Promenade (world x = -14.2, z = -4.25)
    const bikeDock = new THREE.Group();
    bikeDock.position.set(-14.2, 0.12, -4.25);
    [-0.95, 0.95].forEach((bx) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25, 6), steelMat);
      post.position.set(bx, 0.62, -0.35);
      bikeDock.add(post);
    });
    const bikePv = createSolarPanelMesh(2.2, 0.9, 0.18, solarMat, frameMat);
    bikePv.group.position.set(0, 1.28, -0.05);
    bikeDock.add(bikePv.group);
    [-0.6, -0.2, 0.2, 0.6].forEach((bx) => {
      const bikeWheel1 = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 12), steelMat);
      bikeWheel1.rotation.y = Math.PI / 2;
      bikeWheel1.position.set(bx, 0.18, 0.15);
      bikeDock.add(bikeWheel1);
      const bikeFrame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.45), new THREE.MeshStandardMaterial({ color: '#38bdf8' }));
      bikeFrame.position.set(bx, 0.32, 0);
      bikeDock.add(bikeFrame);
    });
    this.rootGroup.add(bikeDock);

    // -------------------------------------------------------------------------
    // 3. SECTOR 1: EXPANDED NEO® HUWART 6-BAY SOLAR EV CHARGING CANOPY
    // -------------------------------------------------------------------------
    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(-8.5, 0.06, 2.9);

    const evBayXs = [-4.125, -2.475, -0.825, 0.825, 2.475, 4.125];
    for (let i = -4.95; i <= 4.96; i += 1.65) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 4.7), whiteLineMat);
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
      const pad = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.02, 3.4), padMat);
      pad.position.set(bx, 0.025, 0.1);
      canopyGroup.add(pad);

      // NEO® Bornes 150 kW Fast-Charging Pedestal
      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.28, 0.24), creamMat);
      ped.position.set(bx, 0.65, -2.0);
      ped.castShadow = true;
      canopyGroup.add(ped);

      const scrMat = new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? '#10b981' : '#38bdf8' });
      this.evPadMats.push(scrMat);
      const scr = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.26), scrMat);
      scr.position.set(bx, 0.94, -2.0);
      canopyGroup.add(scr);
    });

    // Cantilevered Steel & Timber Y-Frame Structure on Bay Divider Lines
    [-4.95, -1.65, 1.65, 4.95].forEach((px) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.82, 0.26), steelMat);
      col.position.set(px, 1.42, -1.95);
      col.castShadow = true;
      canopyGroup.add(col);

      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 4.95), timberMat);
      brace.position.set(px, 2.75, 0.12);
      brace.rotation.x = 0.11;
      canopyGroup.add(brace);
    });

    const canopyDeck = new THREE.Group();
    canopyDeck.position.set(0, 2.88, 0.12);
    canopyDeck.rotation.x = 0.11;

    const purlin = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.14, 4.95), steelMat);
    purlin.castShadow = true;
    canopyDeck.add(purlin);

    this.canopyLedMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.06, 0.12), this.canopyLedMat);
    ledStrip.position.set(0, -0.09, 2.0);
    canopyDeck.add(ledStrip);

    // 6 Large Bifacial Solar PV Panels atop the EV Canopy
    evBayXs.forEach((bx) => {
      const pv = createSolarPanelMesh(1.56, 4.35, 0.0, solarMat, frameMat);
      pv.group.position.set(bx, 0.08, 0);
      canopyDeck.add(pv.group);
    });
    canopyGroup.add(canopyDeck);

    // 4 Parked EVs Charging in Bays 1, 2, 4, and 5
    [
      { x: -4.125, col: '#f8fafc' },
      { x: -2.475, col: '#38bdf8' },
      { x: 0.825, col: '#e2e8f0' },
      { x: 2.475, col: '#22c55e' }
    ].forEach((cSpec) => {
      const ev = createParkedEvCar(cSpec.col, this.carHeadMats, this.carTailMats);
      ev.position.set(cSpec.x, 0.03, 0.22);
      ev.rotation.y = Math.PI;
      canopyGroup.add(ev);
    });

    this.canopyLight = new THREE.PointLight('#7dd3fc', 0.4, 18);
    this.canopyLight.position.set(0, 2.4, 0.2);
    canopyGroup.add(this.canopyLight);

    this.rootGroup.add(canopyGroup);

    // -------------------------------------------------------------------------
    // 4. CENTRAL TREE ISLAND & SECTOR 2: VEGETATED BIO-PARKING (4 BAYS)
    // -------------------------------------------------------------------------
    const medianCurb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 5.1), sidewalkMat);
    medianCurb.position.set(-2.5, 0.12, 2.9);
    this.rootGroup.add(medianCurb);

    const medianSoil = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.22, 4.85), meadowMat);
    medianSoil.position.set(-2.5, 0.13, 2.9);
    this.rootGroup.add(medianSoil);

    const bioGroup = new THREE.Group();
    bioGroup.position.set(1.6, 0.06, 2.9);

    const bioPad = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.06, 4.8), bioGridMat);
    bioPad.position.set(0, 0.02, 0);
    bioPad.receiveShadow = true;
    bioGroup.add(bioPad);

    const bioBayXs = [-2.325, -0.775, 0.775, 2.325];
    for (let lx = -3.1; lx <= 3.12; lx += 1.55) {
      const div = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 4.5), whiteLineMat);
      div.position.set(lx, 0.06, 0);
      bioGroup.add(div);
    }

    // Living Evergreen Timber Pergola (columns aligned strictly on outer/center dividers)
    [-3.1, 0.0, 3.1].forEach((px) => {
      [-1.85, 1.85].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.6, 8), timberMat);
        post.position.set(px, 1.3, pz);
        post.castShadow = true;
        bioGroup.add(post);
      });
    });

    const pergolaFrame = new THREE.Mesh(new THREE.BoxGeometry(6.45, 0.14, 4.1), timberMat);
    pergolaFrame.position.set(0, 2.6, 0);
    pergolaFrame.castShadow = true;
    bioGroup.add(pergolaFrame);

    const vineMats = [
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.75 }),
      new THREE.MeshStandardMaterial({ color: '#4ade80', roughness: 0.72 })
    ];
    for (let vx = -2.65; vx <= 2.7; vx += 0.88) {
      for (let vz = -1.5; vz <= 1.55; vz += 1.0) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(0.86, 0.24 + ((Math.abs(vx * 3 + vz) % 3) * 0.05), 0.96),
          vineMats[Math.abs(Math.round(vx * 2 + vz * 3)) % vineMats.length]
        );
        block.position.set(vx, 2.74, vz);
        block.castShadow = true;
        bioGroup.add(block);
      }
    }

    // 3 Parked Cars in Bays 1, 2, 4 (leaving Bay 3 open to show eco-pavers)
    [
      { x: bioBayXs[0], col: '#e2e8f0' },
      { x: bioBayXs[1], col: '#f97316' },
      { x: bioBayXs[3], col: '#60a5fa' }
    ].forEach((cSpec) => {
      const bc = createParkedEvCar(cSpec.col, this.carHeadMats, this.carTailMats);
      bc.position.set(cSpec.x, 0.05, 0.18);
      bc.rotation.y = Math.PI;
      bioGroup.add(bc);
    });

    this.rootGroup.add(bioGroup);

    // Rich Perimeter & Median Shade + Ornamental Blossom Trees (20 trees)
    const parkTrees = [
      [-2.5, 1.15, 0.95, 0],
      [-2.5, 2.9, 0.85, 2],
      [-2.5, 4.65, 0.95, 1],
      [-18.4, 5.2, 1.15, 0],
      [-18.4, 0.4, 1.05, 2],
      [-18.2, -10.5, 1.15, 1],
      [-11.8, 9.48, 0.92, 0],
      [-6.8, 9.48, 0.88, 2],
      [-1.8, 9.48, 0.95, 1],
      [2.6, 9.48, 0.92, 0],
      [6.2, -4.4, 0.92, 2],
      [8.8, -11.5, 1.2, 0],
      [12.2, -11.8, 1.05, 2],
      [18.8, -10.5, 1.25, 1],
      [18.8, -3.5, 1.05, 0],
      [18.8, 7.2, 1.15, 2],
      [14.2, 8.2, 1.0, 0],
      [9.4, 8.0, 0.95, 1],
      [6.5, 3.0, 0.85, 2],
      [-18.2, 9.48, 0.92, 0]
    ];
    parkTrees.forEach(([tx, tz, sc, v]) => {
      const tr = createLushTree(sc, v);
      tr.position.set(tx, 0.14, tz);
      this.rootGroup.add(tr);
    });

    // Colorful 3D Flower Beds across medians, boulevard border, and side meadow (22 beds)
    const flowerSpots = [
      [-2.5, 0.24, 2.05],
      [-2.5, 0.24, 3.8],
      [-18.4, 0.14, 2.9],
      [-18.4, 0.14, 7.6],
      [-9.5, 0.22, 9.48],
      [-4.3, 0.22, 9.48],
      [0.4, 0.22, 9.48],
      [9.2, 0.22, 9.48],
      [12.6, 0.22, 9.48],
      [16.8, 0.22, 9.48],
      [9.0, 0.12, -2.0],
      [9.2, 0.12, 1.8],
      [9.2, 0.12, 5.2],
      [11.8, 0.12, 6.8],
      [15.6, 0.12, 6.5],
      [18.0, 0.12, -0.6],
      [17.8, 0.12, -6.5],
      [12.5, 0.12, -8.8],
      [15.6, 0.12, -10.8],
      [10.2, 0.12, -9.8],
      [-1.0, 0.12, -4.3],
      [-11.8, 0.12, -4.3]
    ];
    flowerSpots.forEach(([fx, fy, fz]) => {
      this.rootGroup.add(createFlowerCluster(fx, fy, fz, 7));
    });

    // Warm Solar Garden Bollard Lamps along Promenade, Medians & Meadow Edge
    [
      [-15.8, -3.55], [-11.5, -3.55], [-5.2, -3.55], [0.8, -3.55], [5.4, -3.55],
      [-2.5, 0.55], [-2.5, 5.3], [7.8, -4.5], [7.8, 1.5], [7.8, 6.5]
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
    // 5. EXPANDED SIDE ECO-ENERGY MEADOW: DUAL WIND TURBINES + 12 SOLAR + LFP HUB
    // -------------------------------------------------------------------------
    const turbineWhite = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.28, metalness: 0.25 });
    const turbineAccent = new THREE.MeshStandardMaterial({ color: '#10b981', roughness: 0.32, metalness: 0.2 });

    const buildWindTurbine = (tx, ty, tz, towerHeight, bladeLen, speedMult) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(tx, ty, tz);

      const scaleFactor = towerHeight / 5.6;
      const padBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62 * scaleFactor, 0.8 * scaleFactor, 0.26, 14),
        sidewalkMat
      );
      padBase.position.y = 0.13;
      tGroup.add(padBase);

      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11 * scaleFactor, 0.24 * scaleFactor, towerHeight, 16),
        turbineWhite
      );
      tower.position.y = towerHeight * 0.5 + 0.22;
      tower.castShadow = true;
      tGroup.add(tower);

      const mastRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16 * scaleFactor, 0.17 * scaleFactor, 0.28, 16),
        turbineAccent
      );
      mastRing.position.y = towerHeight * 0.82;
      tGroup.add(mastRing);

      const nacelleHead = new THREE.Group();
      nacelleHead.position.set(0, towerHeight + 0.24, 0);
      nacelleHead.rotation.y = -0.38;

      const nacelleBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.42 * scaleFactor, 0.44 * scaleFactor, 1.15 * scaleFactor),
        turbineWhite
      );
      nacelleBody.position.z = -0.18 * scaleFactor;
      nacelleBody.castShadow = true;
      nacelleHead.add(nacelleBody);

      const beaconMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
      this.windBeaconMats.push(beaconMat);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.08 * scaleFactor, 10, 10), beaconMat);
      beacon.position.set(0, 0.28 * scaleFactor, -0.52 * scaleFactor);
      nacelleHead.add(beacon);

      const rotor = new THREE.Group();
      rotor.position.set(0, 0, 0.46 * scaleFactor);

      const spinner = new THREE.Mesh(
        new THREE.ConeGeometry(0.22 * scaleFactor, 0.48 * scaleFactor, 14),
        turbineWhite
      );
      spinner.rotation.x = Math.PI / 2;
      spinner.position.z = 0.18 * scaleFactor;
      rotor.add(spinner);

      for (let b = 0; b < 3; b++) {
        const bladePivot = new THREE.Group();
        bladePivot.rotation.z = (b * Math.PI * 2) / 3;

        const bladeMain = new THREE.Mesh(
          new THREE.BoxGeometry(0.18 * scaleFactor, bladeLen, 0.055),
          turbineWhite
        );
        bladeMain.position.y = bladeLen * 0.54;
        bladeMain.rotation.y = 0.14;
        bladeMain.castShadow = true;
        bladePivot.add(bladeMain);

        const bladeTip = new THREE.Mesh(
          new THREE.BoxGeometry(0.12 * scaleFactor, 0.44 * scaleFactor, 0.045),
          turbineAccent
        );
        bladeTip.position.y = bladeLen * 1.1;
        bladeTip.rotation.y = 0.14;
        bladePivot.add(bladeTip);

        rotor.add(bladePivot);
      }
      nacelleHead.add(rotor);
      this.windRotors.push({ rotor, speedMult });

      tGroup.add(nacelleHead);
      this.rootGroup.add(tGroup);
    };

    // 5A. Primary 18 kW Turbine + Secondary 12 kW Companion Turbine in Field
    buildWindTurbine(14.8, 0.22, -6.8, 6.4, 2.55, 1.0);
    buildWindTurbine(17.4, 0.2, 2.8, 4.9, 1.95, 1.22);

    // 5B. Ground-Mounted Meadow Solar Array (3 rows x 4 panels = 12 tracking panels)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const sx = 9.8 + c * 1.92;
        const sz = -1.6 + r * 2.25;

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.72, 8), steelMat);
        post.position.set(sx, 0.44, sz);
        this.rootGroup.add(post);

        const pv = createSolarPanelMesh(1.52, 1.08, 0.45, solarMat, frameMat);
        pv.group.position.set(sx, 0.74, sz);
        this.rootGroup.add(pv.group);
        this.trackingPanels.push({ panelGroup: pv.panelGroup, baseTilt: 0.45, phase: r * 0.65 + c * 0.38 });
      }
    }

    // 5C. Dual-Cabinet Hybrid LFP Battery & Smart Substation Hub (180 kWh at x = 9.4, z = -6.2)
    const hubCab = new THREE.Group();
    hubCab.position.set(9.4, 0.1, -6.2);

    const cabBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 1.45), sidewalkMat);
    cabBase.position.y = 0.09;
    hubCab.add(cabBase);

    [-0.65, 0.65].forEach((cx) => {
      const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.72, 0.92), creamMat);
      cabBody.position.set(cx, 1.0, 0);
      cabBody.castShadow = true;
      hubCab.add(cabBody);

      const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.0), steelMat);
      cabRoof.position.set(cx, 1.9, 0);
      hubCab.add(cabRoof);

      for (let i = 0; i < 5; i++) {
        const bm = new THREE.MeshBasicMaterial({ color: '#10b981' });
        this.batteryBarMats.push({ mat: bm, levelIdx: i });
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.11, 0.05), bm);
        bar.position.set(cx, 0.58 + i * 0.23, 0.47);
        hubCab.add(bar);
      }
    });
    this.rootGroup.add(hubCab);

    // -------------------------------------------------------------------------
    // 6. ANIMATED 3D ENERGY CONDUITS CONNECTING ALL SOURCES & LOADS
    // -------------------------------------------------------------------------
    this.circuits.roofToHub = createEnergyStream(
      [
        new THREE.Vector3(-2.5, 4.7, -9.2),
        new THREE.Vector3(3.6, 3.8, -7.8),
        new THREE.Vector3(9.4, 1.6, -6.2)
      ],
      '#facc15',
      8,
      0.065
    );
    this.rootGroup.add(this.circuits.roofToHub.group);

    this.circuits.canopyToEv = createEnergyStream(
      [
        new THREE.Vector3(-8.5, 3.0, 2.9),
        new THREE.Vector3(-8.5, 1.8, 1.0),
        new THREE.Vector3(-10.1, 0.88, 2.9)
      ],
      '#38bdf8',
      7,
      0.06
    );
    this.rootGroup.add(this.circuits.canopyToEv.group);

    this.circuits.fieldSolarToHub = createEnergyStream(
      [
        new THREE.Vector3(12.6, 1.2, 0.6),
        new THREE.Vector3(11.0, 1.05, -2.8),
        new THREE.Vector3(9.4, 1.25, -6.2)
      ],
      '#fbbf24',
      7,
      0.06
    );
    this.rootGroup.add(this.circuits.fieldSolarToHub.group);

    this.circuits.windToHub = createEnergyStream(
      [
        new THREE.Vector3(14.8, 6.4, -6.8),
        new THREE.Vector3(14.8, 1.5, -6.8),
        new THREE.Vector3(12.1, 1.2, -6.5),
        new THREE.Vector3(9.4, 1.45, -6.2)
      ],
      '#10b981',
      8,
      0.065
    );
    this.rootGroup.add(this.circuits.windToHub.group);

    this.circuits.wind2ToHub = createEnergyStream(
      [
        new THREE.Vector3(17.4, 4.9, 2.8),
        new THREE.Vector3(17.4, 1.4, 2.8),
        new THREE.Vector3(13.8, 1.15, -1.8),
        new THREE.Vector3(9.4, 1.35, -6.2)
      ],
      '#10b981',
      8,
      0.058
    );
    this.rootGroup.add(this.circuits.wind2ToHub.group);

    this.circuits.hubToMarketAndEv = createEnergyStream(
      [
        new THREE.Vector3(9.4, 1.1, -6.2),
        new THREE.Vector3(5.8, 0.72, -3.5),
        new THREE.Vector3(-2.5, 0.72, -2.8),
        new THREE.Vector3(-8.5, 0.95, 0.9)
      ],
      '#38bdf8',
      9,
      0.062
    );
    this.rootGroup.add(this.circuits.hubToMarketAndEv.group);

    // -------------------------------------------------------------------------
    // 7. ANIMATED BOULEVARD EV TRAFFIC, INTERNAL AISLE CRUISER & PROMENADE WALKERS
    // -------------------------------------------------------------------------
    const bCarEast = createParkedEvCar('#38bdf8', this.carHeadMats, this.carTailMats);
    bCarEast.position.set(-14.0, 0.08, 12.95);
    bCarEast.rotation.y = Math.PI / 2;
    this.rootGroup.add(bCarEast);
    this.movingCars.push({ type: 'boulevard', mesh: bCarEast, x: -14.0, z: 12.95, dir: 1, speed: 4.8 });

    const bCarWest = createParkedEvCar('#f8fafc', this.carHeadMats, this.carTailMats);
    bCarWest.position.set(16.0, 0.08, 10.8);
    bCarWest.rotation.y = -Math.PI / 2;
    this.rootGroup.add(bCarWest);
    this.movingCars.push({ type: 'boulevard', mesh: bCarWest, x: 16.0, z: 10.8, dir: -1, speed: 4.2 });

    const loopCar = createParkedEvCar('#10b981', this.carHeadMats, this.carTailMats);
    loopCar.position.set(-15.4, 0.07, -1.5);
    this.rootGroup.add(loopCar);
    this.movingCars.push({
      type: 'loop',
      mesh: loopCar,
      progress: 0.0,
      speed: 0.058,
      curAngle: Math.PI / 2,
      waypoints: [
        new THREE.Vector3(-15.4, 0.07, -1.5),
        new THREE.Vector3(6.1, 0.07, -1.5),
        new THREE.Vector3(6.1, 0.07, 7.35),
        new THREE.Vector3(-15.4, 0.07, 7.35)
      ]
    });

    [
      { x: -12.0, z: -4.45, minX: -13.4, maxX: -9.8, dir: 1, speed: 0.72, col: '#38bdf8' },
      { x: -3.2, z: -4.15, minX: -6.8, maxX: -1.6, dir: -1, speed: 0.65, col: '#f472b6' },
      { x: 1.5, z: -4.35, minX: -0.6, maxX: 4.2, dir: 1, speed: 0.7, col: '#facc15' },
      { x: -7.0, z: -3.9, minX: -9.2, maxX: -4.0, dir: 1, speed: 0.62, col: '#34d399' }
    ].forEach((wSpec, idx) => {
      const walker = createPedestrianWalker(wSpec.col);
      walker.position.set(wSpec.x, 0.12, wSpec.z);
      walker.rotation.y = wSpec.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      this.rootGroup.add(walker);
      this.walkers.push({ ...wSpec, mesh: walker, phase: idx * 1.4 });
    });
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
    this.trackingPanels = [];
    this.batteryBarMats = [];
    this.lampBulbMats = [];
    this.evPadMats = [];
    this.carHeadMats = [];
    this.carTailMats = [];
    this.windRotors = [];
    this.windBeaconMats = [];
    this.movingCars = [];
    this.walkers = [];

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
      this.sunOrb.position.set(isHybrid ? -24 : -20, isHybrid ? 10 : 18, -26);
      this.sunOrb.material.color.set(isHybrid ? '#fb923c' : '#fef08a');
    }
    if (this.starsMat) {
      this.starsMat.opacity = isWindyNight ? 0.9 : isHybrid ? 0.25 : 0.0;
    }

    // 2. Dual Wind Turbine Rotors & Beacons
    const rotorSpeed = isWindyNight ? 3.8 : isHybrid ? 2.4 : 1.1;
    this.windRotors.forEach(({ rotor, speedMult }) => {
      rotor.rotation.z -= rotorSpeed * speedMult * dt;
    });
    const beaconHex = Math.sin(elapsed * 4.5) > 0 ? 0x10b981 : 0x38bdf8;
    this.windBeaconMats.forEach((bm) => bm.color.setHex(beaconHex));

    // 3. Solar Panel Gentle Sun-Tracking
    this.trackingPanels.forEach(({ panelGroup, baseTilt, phase }) => {
      panelGroup.rotation.x = baseTilt + Math.sin(elapsed * 0.55 + phase) * 0.035;
    });

    // 4. Evening / Night Illumination for Market, EV Canopy, Cars & Boulevard Lamps
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
    animStream(this.circuits.wind2ToHub, true, windSpeed * 1.12);
    animStream(this.circuits.hubToMarketAndEv, true, isWindyNight ? 0.54 : 0.38);

    const fillCount = isWindyNight ? 4 : 5;
    this.batteryBarMats.forEach(({ mat, levelIdx }) => {
      if (levelIdx < fillCount) {
        const pulse = 0.65 + 0.35 * Math.sin(elapsed * 4 - levelIdx * 0.6);
        mat.color.set(levelIdx === fillCount - 1 && pulse > 0.72 ? '#38bdf8' : '#10b981');
      } else {
        mat.color.set('#1e293b');
      }
    });

    // 6. Animate Moving EV Traffic & Walking Promenade Shoppers
    this.movingCars.forEach((car) => {
      if (car.type === 'boulevard') {
        car.x += car.dir * car.speed * dt;
        if (car.dir > 0 && car.x > 19.6) car.x = -19.6;
        if (car.dir < 0 && car.x < -19.6) car.x = 19.6;
        car.mesh.position.set(car.x, 0.08, car.z);
      } else if (car.type === 'loop') {
        car.progress = (car.progress + car.speed * dt) % 1;
        const wps = car.waypoints;
        const n = wps.length;
        const segFloat = car.progress * n;
        const idx = Math.floor(segFloat) % n;
        const t = segFloat - Math.floor(segFloat);
        const p0 = wps[idx];
        const p1 = wps[(idx + 1) % n];
        car.mesh.position.lerpVectors(p0, p1, t);

        const targetAngle = Math.atan2(p1.x - p0.x, p1.z - p0.z);
        const diff = ((targetAngle - car.curAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        car.curAngle += diff * Math.min(1, dt * 8.0);
        car.mesh.rotation.y = car.curAngle;
      }
    });

    this.walkers.forEach((w) => {
      w.x += w.dir * w.speed * dt;
      if (w.x > w.maxX) {
        w.x = w.maxX;
        w.dir = -1;
      } else if (w.x < w.minX) {
        w.x = w.minX;
        w.dir = 1;
      }
      w.mesh.position.x = w.x;
      w.mesh.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;

      const stride = Math.sin(elapsed * 7.2 + w.phase) * 0.45;
      if (w.mesh.userData?.leftLeg && w.mesh.userData?.rightLeg) {
        w.mesh.userData.leftLeg.rotation.x = stride;
        w.mesh.userData.rightLeg.rotation.x = -stride;
      }
    });

    // 7. Project Floating 2-Line 3D Callouts
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
