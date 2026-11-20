import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getDevicePerfTier, destroyStudioRenderer } from './utils/webgl-memory.js';
import { createSolarTexture } from './scene/textures-helpers.js';
import {
  HOME_STUDIO_TEXT,
  HOME_MODE_TELEMETRY,
  HOME_LEFT_SPECS,
  HOME_RIGHT_SPECS,
  HOME_CAMERA_PRESETS,
  HOME_HOTSPOTS
} from './data/home-studio-data.js';

function createInverterCoreTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#09111f';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 240, 240);

  const glow = ctx.createRadialGradient(128, 128, 6, 128, 128, 102);
  glow.addColorStop(0, '#fffbeb');
  glow.addColorStop(0.22, '#fde047');
  glow.addColorStop(0.55, '#f59e0b');
  glow.addColorStop(1, 'rgba(9, 17, 31, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(14, 14, 228, 228);

  [78, 52].forEach((r) => {
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRealisticEvCoupe() {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: '#f8fafc',
    roughness: 0.16,
    metalness: 0.25,
    clearcoat: 0.88,
    clearcoatRoughness: 0.1
  });
  const cabinGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    roughness: 0.08,
    metalness: 0.65,
    clearcoat: 0.9
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.65 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.25, metalness: 0.85 });

  const bodyProfile = new THREE.Shape();
  bodyProfile.moveTo(-1.14, 0.14);
  bodyProfile.lineTo(1.14, 0.14);
  bodyProfile.lineTo(1.16, 0.36);
  bodyProfile.quadraticCurveTo(1.06, 0.57, 0.62, 0.59);
  bodyProfile.lineTo(-0.56, 0.61);
  bodyProfile.quadraticCurveTo(-1.05, 0.59, -1.16, 0.34);
  bodyProfile.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyProfile, {
    depth: 1.0,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 3
  });
  bodyGeo.translate(0, 0, -0.5);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  car.add(body);

  const cabinProfile = new THREE.Shape();
  cabinProfile.moveTo(-0.64, 0.57);
  cabinProfile.quadraticCurveTo(-0.34, 0.91, 0.08, 0.91);
  cabinProfile.quadraticCurveTo(0.46, 0.89, 0.68, 0.57);
  cabinProfile.closePath();

  const cabinGeo = new THREE.ExtrudeGeometry(cabinProfile, {
    depth: 0.84,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 3
  });
  cabinGeo.translate(0, 0, -0.42);
  const cabin = new THREE.Mesh(cabinGeo, cabinGlassMat);
  cabin.castShadow = true;
  car.add(cabin);

  const headLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.06, 0.88),
    new THREE.MeshBasicMaterial({ color: '#e0f2fe' })
  );
  headLed.position.set(-1.15, 0.42, 0);
  car.add(headLed);

  const tailLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.84),
    new THREE.MeshBasicMaterial({ color: '#fb7185' })
  );
  tailLed.position.set(1.15, 0.46, 0);
  car.add(tailLed);

  const tireGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.14, 20);
  tireGeo.rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.15, 16);
  rimGeo.rotateX(Math.PI / 2);

  [
    [-0.72, 0.21, 0.47],
    [0.72, 0.21, 0.47],
    [-0.72, 0.21, -0.47],
    [0.72, 0.21, -0.47]
  ].forEach(([wx, wy, wz]) => {
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.position.set(wx, wy, wz);
    car.add(tire);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(wx, wy, wz);
    car.add(rim);
  });

  return car;
}

function createPineTree(scale = 1) {
  const tree = new THREE.Group();
  const darkPineMat = new THREE.MeshStandardMaterial({ color: '#0d1826', roughness: 0.9 });
  [
    { y: 1.0, r: 0.85, h: 1.45 },
    { y: 1.95, r: 0.68, h: 1.3 },
    { y: 2.8, r: 0.50, h: 1.15 },
    { y: 3.55, r: 0.34, h: 0.95 }
  ].forEach((tier) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(tier.r, tier.h, 10), darkPineMat);
    cone.position.y = tier.y;
    tree.add(cone);
  });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 8), darkPineMat);
  trunk.position.y = 0.2;
  tree.add(trunk);
  tree.scale.setScalar(scale);
  return tree;
}

export class HomeStudio3D {
  constructor({ i18n, onRequestQuote, onClose }) {
    this.i18n = i18n;
    this.onRequestQuote = onRequestQuote;
    this.onClose = onClose;

    this.state = {
      mode: 'day', // 'day' | 'battery' | 'grid'
      xray: false,
      autoRotate: false,
      activePreset: 'overview',
      activeSpecId: 'solarRoof'
    };

    this.isOpen = false;
    this.rafId = null;
    this.lastTime = null;
    this.elapsed = 0;

    this.camTransition = null;
    this.desiredCamPos = new THREE.Vector3(...HOME_CAMERA_PRESETS.overview.pos);
    this.desiredTarget = new THREE.Vector3(...HOME_CAMERA_PRESETS.overview.target);

    this.xrayTargets = [];
    this.batteryBarMats = [];
    this.interiorLights = [];
    this.circuits = {};

    this.modalEl = document.getElementById('home-studio-modal');
    if (!this.modalEl) return;

    this.renderShellDOM();
    this.bindUIEvents();
    this.syncLanguage();
    this.syncStateToUI();
  }

  t(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const lang = this.i18n?.lang || 'en';
    return obj[lang] || obj.en || obj.fr || '';
  }

  ui() {
    const lang = this.i18n?.lang || 'en';
    return HOME_STUDIO_TEXT[lang] || HOME_STUDIO_TEXT.en;
  }

  renderShellDOM() {
    const u = this.ui();
    const tm = HOME_MODE_TELEMETRY[this.state.mode];

    this.modalEl.innerHTML = `
      <div class="ac-studio-backdrop" id="home-studio-backdrop"></div>
      <div class="ac-studio-shell" role="dialog" aria-modal="true" aria-labelledby="home-studio-title">
        <header class="ac-studio-header">
          <div class="ac-studio-title-wrap">
            <span class="ac-studio-badge" id="home-studio-badge">${u.badge}</span>
            <h2 id="home-studio-title">${u.title}</h2>
            <p id="home-studio-subtitle">${u.subtitle}</p>
          </div>
          <div class="ac-studio-header-actions">
            <button type="button" class="ac-btn-primary" id="home-btn-quote">${u.requestQuote}</button>
            <button type="button" class="ac-btn-close" id="home-btn-close">${u.closeBtn}</button>
          </div>
        </header>

        <div class="ac-studio-grid">
          <aside class="ac-specs-col left" id="home-specs-left"></aside>

          <section class="ac-stage-center">
            <div class="home-telemetry-bar" id="home-telemetry-bar">
              <div class="home-tele-pill">
                <span class="home-tele-lbl" id="home-tele-lbl-indoor">${u.telemetryIndoor}</span>
                <strong id="home-tele-val-indoor">${tm.indoor}</strong>
              </div>
              <div class="home-tele-pill solar">
                <span class="home-tele-lbl" id="home-tele-lbl-solar">${u.telemetrySolar}</span>
                <strong id="home-tele-val-solar">${tm.solar}</strong>
              </div>
              <div class="home-tele-pill battery">
                <span class="home-tele-lbl" id="home-tele-lbl-battery">${u.telemetryBattery}</span>
                <strong id="home-tele-val-battery">${tm.battery}</strong>
              </div>
              <div class="home-tele-pill grid">
                <span class="home-tele-lbl" id="home-tele-lbl-grid">${u.telemetryGrid}</span>
                <strong id="home-tele-val-grid">${tm.grid}</strong>
              </div>
            </div>

            <div class="ac-live-banner day" id="home-live-banner">
              <span class="ac-live-dot"></span>
              <span id="home-live-status-text">${u.modeStatus.day}</span>
            </div>

            <div class="ac-canvas-wrap">
              <canvas id="home-studio-canvas" aria-label="Interactive 3D Smart Glass Solar Villa"></canvas>
              <div class="ac-hotspot-layer" id="home-hotspot-layer"></div>
            </div>

            <div class="home-conduit-legend">
              <span class="legend-chip solar"><i></i><span id="home-leg-solar">${u.legendSolar}</span></span>
              <span class="legend-chip battery"><i></i><span id="home-leg-battery">${u.legendBattery}</span></span>
              <span class="legend-chip loads"><i></i><span id="home-leg-loads">${u.legendLoads}</span></span>
              <span class="legend-chip grid"><i></i><span id="home-leg-grid">${u.legendGrid}</span></span>
            </div>

            <div class="ac-cam-pills" id="home-cam-pills">
              <button type="button" class="ac-cam-btn active" data-hcam="overview">${u.camOverview}</button>
              <button type="button" class="ac-cam-btn" data-hcam="station">${u.camStation}</button>
              <button type="button" class="ac-cam-btn" data-hcam="roof">${u.camRoof}</button>
              <button type="button" class="ac-cam-btn" data-hcam="interior">${u.camInterior}</button>
              <button type="button" class="ac-cam-btn" data-hcam="ev">${u.camEv}</button>
              <button type="button" class="ac-cam-btn" id="home-btn-autospin">${u.autoSpin}</button>
            </div>
          </section>

          <aside class="ac-specs-col right" id="home-specs-right"></aside>
        </div>

        <footer class="ac-control-dock">
          <div class="ac-dock-group home-mode-group">
            <button type="button" class="ac-mode-btn active" data-hmode="day">${u.modeDay}</button>
            <button type="button" class="ac-mode-btn" data-hmode="battery">${u.modeBattery}</button>
            <button type="button" class="ac-mode-btn" data-hmode="grid">${u.modeGrid}</button>
          </div>

          <div class="ac-dock-group">
            <button type="button" class="ac-cam-btn" id="home-btn-xray">${u.xrayBtn}</button>
            <span class="ac-drag-hint home-hint" id="home-drag-hint">${u.dragHint}</span>
          </div>
        </footer>
      </div>
    `;

    this.renderSpecCards();
    this.renderHotspotsDOM();
  }

  renderSpecCards() {
    const leftEl = document.getElementById('home-specs-left');
    const rightEl = document.getElementById('home-specs-right');
    const cardHtml = (sp, idx) => `
      <button type="button" class="ac-spec-card ${this.state.activeSpecId === sp.id ? 'active' : ''}"
              data-hspec-id="${sp.id}" data-hcam="${sp.camPreset}" style="--stagger:${idx * 65}ms">
        <div class="ac-spec-head">
          <span class="ac-spec-icon">${sp.icon}</span>
          <span class="ac-spec-label">${this.t(sp.label)}</span>
        </div>
        <strong class="ac-spec-val">${sp.value}</strong>
        <p class="ac-spec-detail">${this.t(sp.detail)}</p>
      </button>
    `;

    if (leftEl) leftEl.innerHTML = HOME_LEFT_SPECS.map((s, i) => cardHtml(s, i)).join('');
    if (rightEl) rightEl.innerHTML = HOME_RIGHT_SPECS.map((s, i) => cardHtml(s, i)).join('');

    this.modalEl.querySelectorAll('[data-hspec-id]').forEach((card) => {
      card.addEventListener('click', () => {
        this.state.activeSpecId = card.dataset.hspecId;
        this.focusCameraPreset(card.dataset.hcam || 'overview');
        this.syncStateToUI();
      });
    });
  }

  renderHotspotsDOM() {
    const layer = document.getElementById('home-hotspot-layer');
    if (!layer) return;
    layer.innerHTML = HOME_HOTSPOTS.map(
      (h) => `
      <button type="button" class="ac-hotspot-pin" data-hspot-id="${h.id}" data-hcam="${h.camPreset}">
        <span class="ac-hotspot-dot"></span>
        <span class="ac-hotspot-text">
          <span class="ac-hotspot-title">${this.t(h.label)}</span>
          <span class="ac-hotspot-sub">${this.t(h.sub)}</span>
        </span>
      </button>
    `
    ).join('');

    this.hotspotPins = HOME_HOTSPOTS.map((h) => ({
      ...h,
      vec: new THREE.Vector3(...h.pos),
      el: layer.querySelector(`[data-hspot-id="${h.id}"]`)
    }));

    this.hotspotPins.forEach((hp) => {
      hp.el?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.focusCameraPreset(hp.camPreset);
      });
    });
  }

  initScene() {
    const canvas = document.getElementById('home-studio-canvas');
    if (!canvas) return;

    const perf = getDevicePerfTier();
    this.xrayTargets = [];
    this.batteryBarMats = [];
    this.interiorLights = [];
    this.circuits = {};

    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !perf.isMobile,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(perf.maxPixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.1, 90);
    this.camera.position.set(...HOME_CAMERA_PRESETS.overview.pos);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 4.2;
    this.controls.maxDistance = 21.0;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minPolarAngle = 0.12;
    this.controls.target.set(...HOME_CAMERA_PRESETS.overview.target);
    this.controls.addEventListener('start', () => {
      this.camTransition = null;
    });

    this.hemiLight = new THREE.HemisphereLight('#d8e6f8', '#09111f', 1.25);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#fff5e0', 2.1);
    this.sunLight.position.set(7, 11, 8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight('#38bdf8', 0.9);
    this.rimLight.position.set(-8, 5, -6);
    this.scene.add(this.rimLight);

    this.sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 24, 24),
      new THREE.MeshBasicMaterial({ color: '#fde047' })
    );
    this.sunOrb.position.set(-4.5, 7.2, -3.5);
    this.scene.add(this.sunOrb);

    this.moonOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 24, 24),
      new THREE.MeshBasicMaterial({ color: '#dbeafe' })
    );
    this.moonOrb.position.set(-4.5, 7.2, -3.5);
    this.scene.add(this.moonOrb);

    this.buildSmartHomeModel();
    this.buildEnergyCircuits();
  }

  buildSmartHomeModel() {
    this.homeRoot = new THREE.Group();

    const solarTex = createSolarTexture();
    const inverterTex = createInverterCoreTexture();

    const tidewaterMat = new THREE.MeshStandardMaterial({
      color: '#081526',
      roughness: 0.16,
      metalness: 0.52
    });
    const basaltMat = new THREE.MeshStandardMaterial({
      color: '#6b7582',
      roughness: 0.68,
      metalness: 0.08
    });
    const slabMat = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.52,
      metalness: 0.08,
      transparent: true,
      opacity: 0.97
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: '#111827',
      roughness: 0.35,
      metalness: 0.65
    });
    const limestoneMat = new THREE.MeshStandardMaterial({
      color: '#e5dfd7',
      roughness: 0.58,
      transparent: true,
      opacity: 0.95
    });
    const plumAccentMat = new THREE.MeshStandardMaterial({
      color: '#6e5266',
      roughness: 0.62,
      transparent: true,
      opacity: 0.96
    });
    const darkWalnutMat = new THREE.MeshStandardMaterial({
      color: '#3f2e24',
      roughness: 0.58
    });
    const furnitureMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.45
    });
    const warmCoveMat = new THREE.MeshBasicMaterial({
      color: '#ffd27d'
    });
    const framingGlassMat = new THREE.MeshPhysicalMaterial({
      color: '#9fd8f5',
      transparent: true,
      opacity: 0.22,
      roughness: 0.06,
      metalness: 0.15,
      depthWrite: false
    });
    const solarMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.16,
      metalness: 0.72,
      emissive: new THREE.Color('#0c4a6e'),
      emissiveIntensity: 0.35
    });

    this.xrayTargets.push(slabMat, limestoneMat, plumAccentMat);

    // -------------------------------------------------------------------------
    // 1. TIDEWATER STUDIO BASE, STEPPED BASALT SLABS & COASTAL PINE SILHOUETTES
    // -------------------------------------------------------------------------
    const harborWater = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 11.5, 0.08, 64), tidewaterMat);
    harborWater.position.set(0.8, -0.22, 0.0);
    harborWater.receiveShadow = true;
    this.homeRoot.add(harborWater);

    const stepLower = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.22, 5.4), basaltMat);
    stepLower.position.set(1.05, -0.08, 0.0);
    stepLower.receiveShadow = true;
    this.homeRoot.add(stepLower);

    const stepMain = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.22, 4.9), slabMat);
    stepMain.position.set(1.05, 0.14, 0.0);
    stepMain.receiveShadow = true;
    this.homeRoot.add(stepMain);

    this.plinthBorderMat = new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.42 });
    const plinthEdge = new THREE.Mesh(new THREE.BoxGeometry(11.1, 0.04, 5.0), this.plinthBorderMat);
    plinthEdge.position.set(1.05, 0.03, 0.0);
    this.homeRoot.add(plinthEdge);

    // Stylized Dark Coastal Pine Trees flanking background left & right (like reference)
    [
      [-4.9, -2.5, 1.05],
      [-4.0, -3.1, 0.85],
      [6.4, -2.2, 1.15],
      [7.1, -2.8, 0.95],
      [5.8, -3.2, 0.78]
    ].forEach(([tx, tz, sc]) => {
      const p = createPineTree(sc);
      p.position.set(tx, -0.1, tz);
      this.homeRoot.add(p);
    });

    // -------------------------------------------------------------------------
    // 2. LEVEL 1: GROUND GLASS PAVILION (x: -3.2..+2.3) + ATTACHED EV GARAGE (x: +2.3..+5.7)
    // All Level 1 structural columns span y = 0.25 .. 2.37 strictly below Level 2 slab (2.38)
    // -------------------------------------------------------------------------
    const colH1 = 2.12;
    const colY1 = 0.25 + colH1 / 2;
    [
      [-3.15, 1.85], [-1.05, 1.85], [0.65, 1.85], [2.32, 1.85], [5.48, 1.85],
      [-3.15, -1.85], [0.65, -1.85], [2.32, -1.85], [5.48, -1.85]
    ].forEach(([cx, cz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.11, colH1, 0.11), steelMat);
      col.position.set(cx, colY1, cz);
      col.castShadow = true;
      this.homeRoot.add(col);
    });

    // Back structural limestone & glass walls for Level 1
    const backWallL1 = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.12, 0.12), basaltMat);
    backWallL1.position.set(-0.9, 1.31, -1.85);
    this.homeRoot.add(backWallL1);

    // Front frameless glass enclosure across Ground Pavilion + Garage bay
    const frontGlassL1 = new THREE.Mesh(new THREE.BoxGeometry(8.65, 2.10, 0.04), framingGlassMat);
    frontGlassL1.position.set(1.16, 1.31, 1.85);
    this.homeRoot.add(frontGlassL1);

    // A) Floor-to-Ceiling Basalt Hearth / Fireplace on Left + Sofa Lounge
    const fireplaceCol = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.12, 0.56), basaltMat);
    fireplaceCol.position.set(-2.15, 1.31, 0.72);
    fireplaceCol.castShadow = true;
    this.homeRoot.add(fireplaceCol);

    const hearthGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.22, 0.06),
      new THREE.MeshBasicMaterial({ color: '#fbbf24' })
    );
    hearthGlow.position.set(-2.15, 0.62, 1.01);
    this.homeRoot.add(hearthGlow);

    const sofaMain = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.34, 0.62), furnitureMat);
    sofaMain.position.set(-1.55, 0.42, -0.45);
    this.homeRoot.add(sofaMain);

    // B) Signature Center Floating Open-Riser Staircase (-0.68..+0.05)
    for (let s = 0; s < 10; s++) {
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.055, 0.24), basaltMat);
      tread.position.set(-0.32, 0.40 + s * 0.20, 0.88 - s * 0.19);
      tread.castShadow = true;
      this.homeRoot.add(tread);
    }

    // C) Center-Right Dining Pavilion Table + 5 Hanging Warm Globe Lights
    const diningTable = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.08, 0.76), darkWalnutMat);
    diningTable.position.set(1.15, 0.76, 0.28);
    this.homeRoot.add(diningTable);

    [-0.42, 0.0, 0.42].forEach((cx) => {
      [-0.45, 0.45].forEach((cz) => {
        const chair = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.28), basaltMat);
        chair.position.set(1.15 + cx, 0.46, 0.28 + cz);
        this.homeRoot.add(chair);
      });
    });

    [
      [0.88, 2.02, 0.18],
      [1.08, 1.90, 0.36],
      [1.24, 2.12, 0.22],
      [1.40, 1.96, 0.38],
      [1.14, 2.08, 0.08]
    ].forEach(([lx, ly, lz]) => {
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), warmCoveMat);
      globe.position.set(lx, ly, lz);
      this.homeRoot.add(globe);
    });

    // Warm Cedar Ceiling Soffit Cove Strips along Level 1 Underside
    const soffitStrip1 = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.035, 0.08), warmCoveMat);
    soffitStrip1.position.set(-0.5, 2.36, 1.68);
    this.homeRoot.add(soffitStrip1);

    // D) Attached Right-Side Glass EV Garage & Energy Control Wall (x = 2.3..5.6)
    const garageBackWall = new THREE.Mesh(new THREE.BoxGeometry(3.25, 2.12, 0.14), basaltMat);
    garageBackWall.position.set(3.92, 1.31, -1.85);
    this.homeRoot.add(garageBackWall);

    const garageRightGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.10, 3.66), framingGlassMat);
    garageRightGlass.position.set(5.48, 1.31, 0.0);
    this.homeRoot.add(garageRightGlass);

    // DUAL 10 kW HYBRID SOLAR INVERTERS inside Garage Back Wall
    [3.0, 3.72].forEach((ix) => {
      const invHousing = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.20), furnitureMat);
      invHousing.position.set(ix, 1.48, -1.68);
      invHousing.castShadow = true;
      this.homeRoot.add(invHousing);

      const invCore = new THREE.Mesh(
        new THREE.PlaneGeometry(0.46, 0.46),
        new THREE.MeshBasicMaterial({ map: inverterTex })
      );
      invCore.position.set(ix, 1.52, -1.57);
      this.homeRoot.add(invCore);
    });

    // 20 kWh NEO All-In-One® LiFePO4 Battery Cabinet inside Garage Back Wall (right of dual inverters)
    const batBody = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.24, 0.34), furnitureMat);
    batBody.position.set(4.58, 0.90, -1.62);
    batBody.castShadow = true;
    this.homeRoot.add(batBody);

    for (let b = 0; b < 5; b++) {
      const bMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.09, 0.05), bMat);
      bar.position.set(4.58, 0.52 + b * 0.17, -1.43);
      this.homeRoot.add(bar);
      this.batteryBarMats.push(bMat);
    }

    // Smart ATS Meter Box & Exterior Grid Pillar
    const atsBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.56, 0.38), steelMat);
    atsBox.position.set(5.32, 1.42, -0.95);
    this.homeRoot.add(atsBox);
    this.meterLedMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const atsLed = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.22), this.meterLedMat);
    atsLed.position.set(5.19, 1.45, -0.95);
    this.homeRoot.add(atsLed);

    const gridPillar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.15, 0.34), steelMat);
    gridPillar.position.set(6.15, 0.65, -1.25);
    this.homeRoot.add(gridPillar);
    this.gridBeaconMat = new THREE.MeshBasicMaterial({ color: '#64748b' });
    const gridCap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.10, 0.38), this.gridBeaconMat);
    gridCap.position.set(6.15, 1.25, -1.25);
    this.homeRoot.add(gridCap);

    // NEO Bornes 11 kW Wallbox & Sculpted White EV Coupe Parked inside Garage!
    const wallbox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.26), steelMat);
    wallbox.position.set(5.34, 1.32, 0.35);
    this.homeRoot.add(wallbox);
    this.wallboxLedMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const wbStrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.12), this.wallboxLedMat);
    wbStrip.position.set(5.23, 1.32, 0.35);
    this.homeRoot.add(wbStrip);

    const evCoupe = createRealisticEvCoupe();
    evCoupe.position.set(3.92, 0.25, 0.38);
    evCoupe.rotation.y = -0.14;
    this.homeRoot.add(evCoupe);

    this.evRingMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide
    });
    const evRing = new THREE.Mesh(new THREE.RingGeometry(1.22, 1.34, 32), this.evRingMat);
    evRing.rotation.x = -Math.PI / 2;
    evRing.position.set(3.92, 0.265, 0.38);
    this.homeRoot.add(evRing);

    // -------------------------------------------------------------------------
    // 3. LEVEL 2: CANTILEVERED SUITES, LIMESTONE SPA & OVER-GARAGE TERRACE
    // Slab sits y = 2.38 .. 2.56; Level 2 columns span 2.56 .. 4.58 flush under Main Roof
    // -------------------------------------------------------------------------
    const slabL2 = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.18, 5.05), slabMat);
    slabL2.position.set(0.95, 2.46, 0.0);
    slabL2.castShadow = true;
    slabL2.receiveShadow = true;
    this.homeRoot.add(slabL2);

    // Wrap-around Frameless Glass Balcony Balustrades (front overhang + over-garage deck)
    const balFront = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.52, 0.04), framingGlassMat);
    balFront.position.set(0.95, 2.81, 2.46);
    this.homeRoot.add(balFront);

    const balLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 4.9), framingGlassMat);
    balLeft.position.set(-4.68, 2.81, 0.0);
    this.homeRoot.add(balLeft);

    const balRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 4.9), framingGlassMat);
    balRight.position.set(6.58, 2.81, 0.0);
    this.homeRoot.add(balRight);

    // Strict Level 2 Steel Columns (height = 2.02 -> spans y = 2.56 .. 4.58)
    const colH2 = 2.02;
    const colY2 = 2.56 + colH2 / 2;
    [
      [-3.15, 1.80], [-0.95, 1.80], [0.75, 1.80], [2.42, 1.80],
      [-3.15, -1.80], [2.42, -1.80]
    ].forEach(([cx, cz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.11, colH2, 0.11), steelMat);
      col.position.set(cx, colY2, cz);
      col.castShadow = true;
      this.homeRoot.add(col);
    });

    // Level 2 Back Walls, Plum Suite Partition & Limestone Spa Partition
    const backWallL2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.02, 0.14), limestoneMat);
    backWallL2.position.set(-0.38, 3.57, -1.80);
    this.homeRoot.add(backWallL2);

    const plumWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.02, 3.5), plumAccentMat);
    plumWall.position.set(-0.92, 3.57, -0.05);
    this.homeRoot.add(plumWall);

    const spaWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.02, 3.5), limestoneMat);
    spaWall.position.set(0.75, 3.57, -0.05);
    this.homeRoot.add(spaWall);

    // Master Beds in Cantilevered Left & Center Suites
    [-2.05, -0.1].forEach((bx) => {
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.30, 1.52), furnitureMat);
      bed.position.set(bx, 2.71, 0.15);
      this.homeRoot.add(bed);
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.32), slabMat);
      pillow.position.set(bx, 2.90, -0.35);
      this.homeRoot.add(pillow);
    });

    // Sculpted Oval Freestanding Soaking Tub + Backlit Spa Vanity Mirror on Right Suite
    const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.56, 24), furnitureMat);
    tub.scale.set(1.35, 1.0, 0.82);
    tub.position.set(1.58, 2.84, 0.42);
    this.homeRoot.add(tub);

    const vanityMirror = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.04), warmCoveMat);
    vanityMirror.position.set(1.58, 3.68, -1.68);
    this.homeRoot.add(vanityMirror);

    const soffitStrip2 = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.035, 0.08), warmCoveMat);
    soffitStrip2.position.set(-0.38, 4.56, 1.68);
    this.homeRoot.add(soffitStrip2);

    // -------------------------------------------------------------------------
    // 4. LEVEL 3: MAIN FLAT ROOF SLAB + ROOFTOP SOLAR PERGOLA & FIRE LOUNGE
    // Roof slab y = 4.58 .. 4.76; Pergola posts span y = 4.76 .. 5.88
    // -------------------------------------------------------------------------
    const roofMainSlab = new THREE.Mesh(new THREE.BoxGeometry(6.45, 0.18, 4.45), slabMat);
    roofMainSlab.position.set(-0.38, 4.67, 0.0);
    roofMainSlab.castShadow = true;
    roofMainSlab.receiveShadow = true;
    this.homeRoot.add(roofMainSlab);

    // Rooftop Glass Deck Railing (y = 4.76 .. 5.26)
    const rGlassFront = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.50, 0.04), framingGlassMat);
    rGlassFront.position.set(-0.38, 5.01, 1.88);
    this.homeRoot.add(rGlassFront);
    const rGlassLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.50, 3.76), framingGlassMat);
    rGlassLeft.position.set(-3.16, 5.01, 0.0);
    this.homeRoot.add(rGlassLeft);
    const rGlassRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.50, 3.76), framingGlassMat);
    rGlassRight.position.set(2.40, 5.01, 0.0);
    this.homeRoot.add(rGlassRight);

    // Steel Solar Pergola Structure (-2.05..+0.85, y = 4.76..5.90, z = -1.1..+1.1)
    [
      [-1.95, 1.05], [0.75, 1.05],
      [-1.95, -1.05], [0.75, -1.05]
    ].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.12, 0.10), steelMat);
      post.position.set(px, 5.32, pz);
      this.homeRoot.add(post);
    });

    const pergolaRoofFrame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.09, 2.35), steelMat);
    pergolaRoofFrame.position.set(-0.6, 5.91, 0.0);
    pergolaRoofFrame.castShadow = true;
    this.homeRoot.add(pergolaRoofFrame);

    // Warm golden LED strips along underside of pergola beam (as seen in reference image!)
    const pergolaLedF = new THREE.Mesh(new THREE.BoxGeometry(2.92, 0.03, 0.06), warmCoveMat);
    pergolaLedF.position.set(-0.6, 5.85, 1.12);
    this.homeRoot.add(pergolaLedF);
    const pergolaLedB = new THREE.Mesh(new THREE.BoxGeometry(2.92, 0.03, 0.06), warmCoveMat);
    pergolaLedB.position.set(-0.6, 5.85, -1.12);
    this.homeRoot.add(pergolaLedB);

    // 12 Integrated Bifacial Solar PV Panels atop Pergola Canopy (3 rows x 4 cols)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const pv = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.045, 0.68), solarMat);
        pv.position.set(-1.62 + col * 0.68, 5.98, -0.72 + row * 0.72);
        this.homeRoot.add(pv);
      }
    }

    // Rooftop Fire-Pit Bowl Lounge on Right Half of Roof Deck (1.55, 4.88, 0.25)
    const fireBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.26, 0.22, 24), basaltMat);
    fireBowl.position.set(1.55, 4.87, 0.25);
    this.homeRoot.add(fireBowl);
    const flameMat = new THREE.MeshBasicMaterial({ color: '#fb923c' });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 12), flameMat);
    flame.position.set(1.55, 5.08, 0.25);
    this.homeRoot.add(flame);

    // Warm Interior Suite & Spa Illumination Lights
    const l1 = new THREE.PointLight('#ffcf87', 1.4, 6.2);
    l1.position.set(-1.7, 2.0, 0.3);
    const l2 = new THREE.PointLight('#ffe0a6', 1.5, 5.8);
    l2.position.set(1.15, 2.05, 0.25);
    const l3 = new THREE.PointLight('#ffcf87', 1.35, 6.0);
    l3.position.set(-1.5, 4.15, 0.1);
    const l4 = new THREE.PointLight('#ffe4b5', 1.4, 5.5);
    l4.position.set(1.55, 4.1, 0.1);
    const l5 = new THREE.PointLight('#7dd3fc', 1.25, 5.8);
    l5.position.set(3.95, 2.05, 0.2);

    this.interiorLights.push(l1, l2, l3, l4, l5);
    this.interiorLights.forEach((l) => this.homeRoot.add(l));

    this.scene.add(this.homeRoot);
  }

  buildEnergyCircuits() {
    this.circuitsGroup = new THREE.Group();

    const makeCircuit = (key, rawPoints, colorHex, count, radius = 0.036) => {
      const curve = new THREE.CatmullRomCurve3(
        rawPoints.map((p) => new THREE.Vector3(...p)),
        false,
        'catmullrom',
        0.12
      );
      const tubeMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.42
      });
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 8, false), tubeMat);
      this.circuitsGroup.add(tube);

      const beadGeo = new THREE.SphereGeometry(radius * 2.1, 10, 10);
      const beadMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.96 });
      const beads = [];
      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(beadGeo, beadMat);
        this.circuitsGroup.add(mesh);
        beads.push({ mesh, offset: i / count });
      }

      this.circuits[key] = {
        curve,
        tubeMat,
        beadMat,
        beads,
        dir: 1,
        speed: 0.38,
        active: true
      };
    };

    // 1. Rooftop Solar Pergola -> Rear Spine -> Garage Dual Hybrid Inverters
    makeCircuit(
      'solarToInverter',
      [
        [0.45, 5.92, -0.85],
        [0.85, 4.78, -1.55],
        [2.32, 4.55, -1.72],
        [2.32, 1.85, -1.72],
        [3.38, 1.55, -1.62]
      ],
      '#facc15',
      7,
      0.038
    );

    // 2. Garage Dual Inverters <-> 20 kWh Garage Battery Cabinet (Reversible!)
    makeCircuit(
      'inverterToBattery',
      [
        [3.72, 1.48, -1.55],
        [4.15, 1.48, -1.55],
        [4.58, 1.18, -1.48]
      ],
      '#10b981',
      5,
      0.038
    );

    // 3. Garage Dual Inverters -> Wallbox Charger -> Parked White EV Coupe
    makeCircuit(
      'inverterToEv',
      [
        [3.72, 1.22, -1.55],
        [5.22, 1.22, -1.15],
        [5.22, 1.32, 0.35],
        [4.85, 0.32, 0.38],
        [3.92, 0.32, 0.38]
      ],
      '#38bdf8',
      7,
      0.036
    );

    // 4. Dual Inverters -> Ground Floor Dining Pavilion, Floating Stair & Hearth
    makeCircuit(
      'inverterToGround',
      [
        [3.00, 1.32, -1.55],
        [2.20, 0.32, -1.45],
        [1.15, 0.32, 0.28],
        [-0.32, 0.32, 0.55],
        [-2.15, 0.45, 0.72]
      ],
      '#fbbf24',
      7,
      0.034
    );

    // 5. Dual Inverters -> Level 2 Limestone Spa & Cantilevered Suites
    makeCircuit(
      'inverterToUpper',
      [
        [3.00, 1.68, -1.55],
        [2.25, 2.52, -1.45],
        [1.58, 2.58, 0.42],
        [-0.1, 2.58, 0.15],
        [-2.05, 2.58, 0.15]
      ],
      '#38bdf8',
      7,
      0.034
    );

    // 6. Exterior Utility Grid Pillar <-> Smart ATS Meter <-> Dual Inverters
    makeCircuit(
      'gridToMeter',
      [
        [6.15, 1.05, -1.25],
        [5.32, 1.38, -0.95],
        [4.55, 1.48, -1.55],
        [3.72, 1.48, -1.55]
      ],
      '#f59e0b',
      6,
      0.036
    );

    this.scene.add(this.circuitsGroup);
  }

  bindUIEvents() {
    document.getElementById('home-btn-close')?.addEventListener('click', () => this.close());
    document.getElementById('home-studio-backdrop')?.addEventListener('click', () => this.close());

    document.getElementById('home-btn-quote')?.addEventListener('click', () => {
      this.close();
      if (this.onRequestQuote) this.onRequestQuote();
    });

    this.modalEl.querySelectorAll('[data-hmode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.mode = btn.dataset.hmode;
        this.syncStateToUI();
      });
    });

    document.getElementById('home-btn-xray')?.addEventListener('click', () => {
      this.state.xray = !this.state.xray;
      this.syncStateToUI();
    });

    this.modalEl.querySelectorAll('[data-hcam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.focusCameraPreset(btn.dataset.hcam);
      });
    });

    document.getElementById('home-btn-autospin')?.addEventListener('click', () => {
      this.state.autoRotate = !this.state.autoRotate;
      if (this.controls) {
        this.controls.autoRotate = this.state.autoRotate;
        this.controls.autoRotateSpeed = 1.45;
      }
      this.syncStateToUI();
    });

    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
      }
    });

    window.addEventListener('resize', () => {
      if (this.isOpen) this.resize();
    });
  }

  focusCameraPreset(presetName) {
    const preset = HOME_CAMERA_PRESETS[presetName] || HOME_CAMERA_PRESETS.overview;
    this.state.activePreset = presetName;
    this.state.autoRotate = false;
    if (this.controls) {
      this.controls.autoRotate = false;
    }
    this.desiredCamPos.set(...preset.pos);
    this.desiredTarget.set(...preset.target);
    this.camTransition = { active: true };
    this.syncStateToUI();
  }

  syncLanguage() {
    const u = this.ui();
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setText('home-studio-badge', u.badge);
    setText('home-studio-title', u.title);
    setText('home-studio-subtitle', u.subtitle);
    setText('home-drag-hint', u.dragHint);
    setText('home-btn-quote', u.requestQuote);
    setText('home-btn-close', u.closeBtn);
    setText('home-btn-xray', u.xrayBtn);
    setText('home-btn-autospin', u.autoSpin);
    setText('home-tele-lbl-indoor', u.telemetryIndoor);
    setText('home-tele-lbl-solar', u.telemetrySolar);
    setText('home-tele-lbl-battery', u.telemetryBattery);
    setText('home-tele-lbl-grid', u.telemetryGrid);
    setText('home-leg-solar', u.legendSolar);
    setText('home-leg-battery', u.legendBattery);
    setText('home-leg-loads', u.legendLoads);
    setText('home-leg-grid', u.legendGrid);

    const camMap = {
      overview: u.camOverview,
      station: u.camStation,
      roof: u.camRoof,
      interior: u.camInterior,
      ev: u.camEv
    };
    this.modalEl.querySelectorAll('[data-hcam]').forEach((b) => {
      if (camMap[b.dataset.hcam]) b.textContent = camMap[b.dataset.hcam];
    });
    const modeMap = { day: u.modeDay, battery: u.modeBattery, grid: u.modeGrid };
    this.modalEl.querySelectorAll('[data-hmode]').forEach((b) => {
      if (modeMap[b.dataset.hmode]) b.textContent = modeMap[b.dataset.hmode];
    });

    this.renderSpecCards();
    this.renderHotspotsDOM();
    this.syncStateToUI();
  }

  syncStateToUI() {
    const { mode, xray, activePreset, activeSpecId, autoRotate } = this.state;
    const u = this.ui();
    const tm = HOME_MODE_TELEMETRY[mode];

    this.modalEl.dataset.thermalMode = mode;

    const banner = document.getElementById('home-live-banner');
    if (banner) {
      banner.className = `ac-live-banner ${mode}`;
    }
    const statusTxt = document.getElementById('home-live-status-text');
    if (statusTxt) statusTxt.textContent = u.modeStatus[mode] || u.modeStatus.day;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setVal('home-tele-val-indoor', tm.indoor);
    setVal('home-tele-val-solar', tm.solar);
    setVal('home-tele-val-battery', tm.battery);
    setVal('home-tele-val-grid', tm.grid);

    this.modalEl.querySelectorAll('[data-hmode]').forEach((b) => {
      b.classList.toggle('active', b.dataset.hmode === mode);
    });
    this.modalEl.querySelectorAll('[data-hcam]').forEach((b) => {
      b.classList.toggle('active', b.dataset.hcam === activePreset && !autoRotate);
    });
    document.getElementById('home-btn-autospin')?.classList.toggle('active', autoRotate);
    document.getElementById('home-btn-xray')?.classList.toggle('active', xray);

    this.modalEl.querySelectorAll('[data-hspec-id]').forEach((card) => {
      card.classList.toggle('active', card.dataset.hspecId === activeSpecId);
    });
  }

  resize() {
    if (!this.canvas || !this.renderer) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = Math.max(200, parent.clientWidth);
    const h = Math.max(200, parent.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  open(initialMode = null) {
    if (!this.modalEl) return;
    if (initialMode && HOME_MODE_TELEMETRY[initialMode]) {
      this.state.mode = initialMode;
    }
    this.isOpen = true;
    this.modalEl.hidden = false;
    this.modalEl.classList.add('is-open');
    document.body.classList.add('ac-studio-open');

    if (!this.renderer) {
      this.initScene();
    }

    this.syncLanguage();
    this.syncStateToUI();
    this.focusCameraPreset('overview');

    requestAnimationFrame(() => {
      if (!this.isOpen) return;
      this.resize();
      this.startLoop();
    });
  }

  close() {
    if (!this.modalEl) return;
    const wasOpen = this.isOpen;
    this.isOpen = false;
    this.modalEl.classList.remove('is-open');
    this.modalEl.hidden = true;
    document.body.classList.remove('ac-studio-open');
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    destroyStudioRenderer(this);
    if (wasOpen) {
      this.onClose?.();
    }
  }

  startLoop() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.lastTime = null;

    const tick = (now) => {
      if (!this.isOpen) return;
      this.rafId = requestAnimationFrame(tick);

      if (this.lastTime === null) this.lastTime = now;
      const dt = Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000));
      this.lastTime = now;
      this.elapsed += dt;

      this.update3D(dt, this.elapsed);
      this.renderer.render(this.scene, this.camera);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  update3D(dt, elapsed) {
    const { mode, xray } = this.state;

    // 1. Camera glide
    if (this.camTransition?.active) {
      const k = 1 - Math.exp(-6.2 * dt);
      this.camera.position.lerp(this.desiredCamPos, k);
      this.controls.target.lerp(this.desiredTarget, k);
      if (this.camera.position.distanceTo(this.desiredCamPos) < 0.03) {
        this.camTransition = null;
      }
    }
    this.controls.update();

    // 2. X-Ray Cutaway Wall/Slab Opacity
    const targetWallOpacity = xray ? 0.24 : 0.96;
    this.xrayTargets.forEach((m) => {
      m.opacity += (targetWallOpacity - m.opacity) * Math.min(1, dt * 8);
    });

    // 3. Day vs Evening Harbor Atmosphere & Warm Suite Lighting
    const isDay = mode === 'day';
    this.sunOrb.visible = isDay;
    this.moonOrb.visible = !isDay;

    this.sunLight.intensity += ((isDay ? 2.25 : 0.72) - this.sunLight.intensity) * Math.min(1, dt * 6);
    this.hemiLight.intensity += ((isDay ? 1.45 : 0.95) - this.hemiLight.intensity) * Math.min(1, dt * 6);
    this.rimLight.color.set(isDay ? '#38bdf8' : mode === 'battery' ? '#34d399' : '#f59e0b');
    this.sunLight.color.set(isDay ? '#fff8eb' : '#93c5fd');

    const targetInterior = isDay ? 1.05 : 2.35;
    this.interiorLights.forEach((l) => {
      l.intensity += (targetInterior - l.intensity) * Math.min(1, dt * 6);
    });

    // 4. Configure 6 Energy Circuits by Mode
    const cSolar = this.circuits.solarToInverter;
    const cBat = this.circuits.inverterToBattery;
    const cEv = this.circuits.inverterToEv;
    const cGround = this.circuits.inverterToGround;
    const cUpper = this.circuits.inverterToUpper;
    const cGrid = this.circuits.gridToMeter;

    if (mode === 'day') {
      cSolar.active = true; cSolar.dir = 1; cSolar.speed = 0.48;
      cSolar.tubeMat.color.set('#facc15'); cSolar.beadMat.color.set('#fde047');

      cBat.active = true; cBat.dir = 1; cBat.speed = 0.36;
      cBat.tubeMat.color.set('#10b981'); cBat.beadMat.color.set('#34d399');

      cEv.tubeMat.color.set('#38bdf8'); cEv.beadMat.color.set('#6ee7b7');
      cGround.tubeMat.color.set('#fbbf24'); cGround.beadMat.color.set('#fde047');
      cUpper.tubeMat.color.set('#38bdf8'); cUpper.beadMat.color.set('#7dd3fc');

      cGrid.active = true; cGrid.dir = -1; cGrid.speed = 0.24; // Surplus export to Grid
      cGrid.tubeMat.color.set('#38bdf8'); cGrid.beadMat.color.set('#7dd3fc');

      this.meterLedMat.color.set('#38bdf8');
      this.gridBeaconMat.color.set('#38bdf8');
      this.evRingMat.color.set('#38bdf8');
    } else if (mode === 'battery') {
      cSolar.active = false;

      // 20 kWh Battery DISCHARGING into Garage Dual Hybrid Inverters
      cBat.active = true; cBat.dir = -1; cBat.speed = 0.54;
      cBat.tubeMat.color.set('#10b981'); cBat.beadMat.color.set('#6ee7b7');

      cEv.tubeMat.color.set('#34d399'); cEv.beadMat.color.set('#6ee7b7');
      cGround.tubeMat.color.set('#34d399'); cGround.beadMat.color.set('#6ee7b7');
      cUpper.tubeMat.color.set('#34d399'); cUpper.beadMat.color.set('#6ee7b7');

      // Zero utility grid usage!
      cGrid.active = false;

      this.meterLedMat.color.set('#334155');
      this.gridBeaconMat.color.set('#334155');
      this.evRingMat.color.set('#10b981');
    } else {
      cSolar.active = false;

      cBat.active = true; cBat.dir = 1; cBat.speed = 0.22;
      cBat.tubeMat.color.set('#60a5fa'); cBat.beadMat.color.set('#93c5fd');

      cEv.tubeMat.color.set('#f59e0b'); cEv.beadMat.color.set('#fde047');
      cGround.tubeMat.color.set('#fb923c'); cGround.beadMat.color.set('#fdba74');
      cUpper.tubeMat.color.set('#fb923c'); cUpper.beadMat.color.set('#fdba74');

      cGrid.active = true; cGrid.dir = 1; cGrid.speed = 0.50;
      cGrid.tubeMat.color.set('#f59e0b'); cGrid.beadMat.color.set('#fbbf24');

      this.meterLedMat.color.set('#f59e0b');
      this.gridBeaconMat.color.set('#f59e0b');
      this.evRingMat.color.set('#f59e0b');
    }

    Object.values(this.circuits).forEach((c) => {
      c.tubeMat.opacity = c.active ? 0.42 : 0.06;
      c.beads.forEach((b) => {
        b.mesh.visible = c.active;
        if (!c.active) return;
        const raw = (b.offset + elapsed * c.speed * c.dir) % 1;
        const u = raw < 0 ? raw + 1 : raw;
        c.curve.getPointAt(u, b.mesh.position);
      });
    });

    const fillCount = mode === 'day' ? 5 : mode === 'battery' ? 4 : 2;
    this.batteryBarMats.forEach((bm, idx) => {
      if (idx < fillCount) {
        const pulse = 0.7 + 0.3 * Math.sin(elapsed * 4 - idx * 0.6);
        bm.color.set(mode === 'grid' ? '#f59e0b' : mode === 'day' && idx === fillCount - 1 && pulse > 0.75 ? '#38bdf8' : '#10b981');
      } else {
        bm.color.set('#1e293b');
      }
    });

    const accentHex = mode === 'day' ? '#38bdf8' : mode === 'battery' ? '#10b981' : '#f59e0b';
    this.plinthBorderMat.color.set(accentHex);
    this.wallboxLedMat.color.set(accentHex);

    // 5. Project 2-Line Floating Callouts
    if (this.hotspotPins && this.canvas) {
      const cw = this.canvas.clientWidth;
      const ch = this.canvas.clientHeight;
      this.hotspotPins.forEach((hp) => {
        if (!hp.el) return;
        const proj = hp.vec.clone().project(this.camera);
        if (proj.z > 1) {
          hp.el.style.opacity = '0';
          hp.el.style.pointerEvents = 'none';
          return;
        }
        const rawX = (proj.x * 0.5 + 0.5) * cw;
        const padX = cw < 480 ? Math.min(72, cw * 0.25) : 0;
        const x = padX > 0 ? Math.max(padX, Math.min(cw - padX, rawX)) : rawX;
        const y = (-proj.y * 0.5 + 0.5) * ch;
        hp.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
        hp.el.style.opacity = '1';
        hp.el.style.pointerEvents = 'auto';
      });
    }
  }
}
