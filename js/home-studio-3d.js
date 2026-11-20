import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSolarTexture } from './scene/textures-helpers.js';
import {
  HOME_STUDIO_TEXT,
  HOME_MODE_TELEMETRY,
  HOME_LEFT_SPECS,
  HOME_RIGHT_SPECS,
  HOME_CAMERA_PRESETS,
  HOME_HOTSPOTS
} from './data/home-studio-data.js';

function createWoodFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#c58f5e';
  ctx.fillRect(0, 0, 512, 512);

  const planks = 8;
  const ph = 512 / planks;
  for (let i = 0; i < planks; i++) {
    const shade = (i % 3) * 7 - 7;
    ctx.fillStyle = `rgb(${194 + shade}, ${140 + shade}, ${91 + shade})`;
    ctx.fillRect(0, i * ph + 2, 512, ph - 3);
    ctx.fillStyle = 'rgba(72, 42, 18, 0.25)';
    ctx.fillRect(0, i * ph, 512, 2);
    const joinX = ((i * 173 + 90) % 420) + 40;
    ctx.fillRect(joinX, i * ph, 2, ph);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createInverterCoreTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0c1629';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, 484, 484);

  const glow = ctx.createRadialGradient(256, 256, 12, 256, 256, 210);
  glow.addColorStop(0, '#fffbeb');
  glow.addColorStop(0.18, '#fde047');
  glow.addColorStop(0.45, '#f59e0b');
  glow.addColorStop(0.78, 'rgba(56, 189, 248, 0.35)');
  glow.addColorStop(1, 'rgba(12, 22, 41, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(24, 24, 464, 464);

  [165, 118, 72].forEach((r, idx) => {
    ctx.strokeStyle = idx === 0 ? 'rgba(56, 189, 248, 0.8)' : 'rgba(253, 224, 71, 0.9)';
    ctx.lineWidth = idx === 2 ? 6 : 4;
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Circuit traces out to top, bottom, left, right
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 6;
  [[256, 18, 256, 90], [256, 422, 256, 494], [18, 256, 90, 256], [422, 256, 494, 256]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createRealisticEvCoupe() {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: '#f8fafc',
    roughness: 0.18,
    metalness: 0.25,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12
  });
  const cabinGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    roughness: 0.08,
    metalness: 0.65,
    clearcoat: 0.9
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.65 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.25, metalness: 0.85 });

  // Lower sculpted body aligned along X axis (front facing -X toward house entrance or +X)
  const bodyProfile = new THREE.Shape();
  bodyProfile.moveTo(-1.12, 0.14);
  bodyProfile.lineTo(1.12, 0.14);
  bodyProfile.lineTo(1.14, 0.36);
  bodyProfile.quadraticCurveTo(1.06, 0.56, 0.62, 0.58);
  bodyProfile.lineTo(-0.56, 0.60);
  bodyProfile.quadraticCurveTo(-1.05, 0.58, -1.14, 0.34);
  bodyProfile.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyProfile, {
    depth: 0.98,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 3
  });
  bodyGeo.translate(0, 0, -0.49);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  car.add(body);

  // Fastback glass roof silhouette
  const cabinProfile = new THREE.Shape();
  cabinProfile.moveTo(-0.62, 0.56);
  cabinProfile.quadraticCurveTo(-0.34, 0.90, 0.08, 0.90);
  cabinProfile.quadraticCurveTo(0.45, 0.88, 0.66, 0.56);
  cabinProfile.closePath();

  const cabinGeo = new THREE.ExtrudeGeometry(cabinProfile, {
    depth: 0.82,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 3
  });
  cabinGeo.translate(0, 0, -0.41);
  const cabin = new THREE.Mesh(cabinGeo, cabinGlassMat);
  cabin.castShadow = true;
  car.add(cabin);

  // LED Headlight & Taillight strips
  const headLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.06, 0.86),
    new THREE.MeshBasicMaterial({ color: '#e0f2fe' })
  );
  headLed.position.set(-1.13, 0.42, 0);
  car.add(headLed);

  const tailLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.84),
    new THREE.MeshBasicMaterial({ color: '#fb7185' })
  );
  tailLed.position.set(1.13, 0.46, 0);
  car.add(tailLed);

  // 4 Spoked Alloy Wheels
  const tireGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.14, 20);
  tireGeo.rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.15, 16);
  rimGeo.rotateX(Math.PI / 2);

  [
    [-0.72, 0.21, 0.46],
    [0.72, 0.21, 0.46],
    [-0.72, 0.21, -0.46],
    [0.72, 0.21, -0.46]
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

export class HomeStudio3D {
  constructor({ i18n, onRequestQuote }) {
    this.i18n = i18n;
    this.onRequestQuote = onRequestQuote;

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
    this.batteryEdgeMats = [];
    this.batteryBarMats = [];
    this.interiorLights = [];
    this.lampGlowMats = [];
    this.circuits = {};
    this.heatPumpFan = null;

    this.modalEl = document.getElementById('home-studio-modal');
    if (!this.modalEl) return;

    this.renderShellDOM();
    this.initScene();
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
              <canvas id="home-studio-canvas" aria-label="Interactive 3D Smart Solar Home"></canvas>
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
        <span class="ac-hotspot-label">${this.t(h.label)}</span>
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

    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.1, 80);
    this.camera.position.set(...HOME_CAMERA_PRESETS.overview.pos);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 4.2;
    this.controls.maxDistance = 20.0;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minPolarAngle = 0.12;
    this.controls.target.set(...HOME_CAMERA_PRESETS.overview.target);
    this.controls.addEventListener('start', () => {
      this.camTransition = null;
    });

    // Atmospheric Daylight + Evening Studio Lights
    this.hemiLight = new THREE.HemisphereLight('#f0f9ff', '#09111f', 1.35);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#fff8eb', 2.35);
    this.sunLight.position.set(6, 11, 7);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight('#38bdf8', 0.95);
    this.rimLight.position.set(-7, 5, -6);
    this.scene.add(this.rimLight);

    this.sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 24, 24),
      new THREE.MeshBasicMaterial({ color: '#fde047' })
    );
    this.sunOrb.position.set(-4.2, 7.2, -3.0);
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

    const woodTex = createWoodFloorTexture();
    const inverterCoreTex = createInverterCoreTexture();
    const solarTex = createSolarTexture();

    const studioFloorMat = new THREE.MeshStandardMaterial({
      color: '#071122',
      roughness: 0.22,
      metalness: 0.42
    });
    const concreteMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.72, metalness: 0.12 });
    const darkSlateMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.65, metalness: 0.18 });
    const plasterMat = new THREE.MeshStandardMaterial({
      color: '#f1f5f9',
      roughness: 0.52,
      transparent: true,
      opacity: 0.96
    });
    const warmWoodFloorMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62 });
    const timberSlatMat = new THREE.MeshStandardMaterial({ color: '#9a6842', roughness: 0.68 });
    const roofTileMat = new THREE.MeshStandardMaterial({
      color: '#1b2636',
      roughness: 0.48,
      metalness: 0.25,
      transparent: true,
      opacity: 0.97
    });
    const furnitureWhiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.45 });
    const sofaMat = new THREE.MeshStandardMaterial({ color: '#e2dcd3', roughness: 0.75 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.35, metalness: 0.55 });
    const bushMat = new THREE.MeshStandardMaterial({ color: '#2b593f', roughness: 0.85 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#bae6fd',
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

    this.xrayTargets.push(plasterMat, roofTileMat);

    // 1. Reflective Studio Stage & Architectural Foundation Plinth
    const studioStage = new THREE.Mesh(new THREE.CylinderGeometry(8.8, 9.2, 0.08, 64), studioFloorMat);
    studioStage.position.set(0.4, -0.06, 0.0);
    studioStage.receiveShadow = true;
    this.homeRoot.add(studioStage);

    const foundationPlinth = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.16, 4.9), concreteMat);
    foundationPlinth.position.set(0.55, 0.06, 0.05);
    foundationPlinth.receiveShadow = true;
    this.homeRoot.add(foundationPlinth);

    const plinthBorder = new THREE.Mesh(
      new THREE.BoxGeometry(10.12, 0.04, 5.02),
      new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.45 })
    );
    plinthBorder.position.set(0.55, 0.0, 0.05);
    this.homeRoot.add(plinthBorder);
    this.plinthBorderMat = plinthBorder.material;

    // 2. Terraced Stone Planters & Illuminated Bushes (Left & Right Exterior Gardens)
    const addPlanter = (x, z, w, d, h) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), darkSlateMat);
      box.position.set(x, h / 2 + 0.12, z);
      box.castShadow = true;
      box.receiveShadow = true;
      this.homeRoot.add(box);

      const bushCount = w > 1.2 ? 3 : 2;
      for (let b = 0; b < bushCount; b++) {
        const bx = x - w * 0.28 + b * (w * 0.28);
        const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), bushMat);
        shrub.position.set(bx, h + 0.26, z);
        shrub.scale.set(1.15, 0.85, 1.0);
        shrub.castShadow = true;
        this.homeRoot.add(shrub);
      }

      const uplightMat = new THREE.MeshBasicMaterial({ color: '#fbbf24' });
      const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 0.03, 0.06), uplightMat);
      glowStrip.position.set(x, h + 0.14, z + d / 2 - 0.06);
      this.homeRoot.add(glowStrip);
      this.lampGlowMats.push(uplightMat);
    };

    addPlanter(-3.35, 1.25, 1.5, 1.2, 0.52);
    addPlanter(-3.35, 0.0, 1.35, 1.1, 0.88);
    addPlanter(3.55, 2.05, 2.8, 0.65, 0.48);

    // -------------------------------------------------------------------------
    // 3. LEVEL 0: LOWER TECHNICAL ENERGY VAULT (x = -2.50..+2.30, y = 0.14..1.44)
    // -------------------------------------------------------------------------
    const vaultFloor = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 3.55), darkSlateMat);
    vaultFloor.position.set(-0.1, 0.16, -0.05);
    vaultFloor.receiveShadow = true;
    this.homeRoot.add(vaultFloor);

    const vaultBackWall = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.28, 0.14), concreteMat);
    vaultBackWall.position.set(-0.1, 0.80, -1.76);
    vaultBackWall.castShadow = true;
    this.homeRoot.add(vaultBackWall);

    const vaultLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.28, 3.55), darkSlateMat);
    vaultLeftWall.position.set(-2.43, 0.80, -0.05);
    this.homeRoot.add(vaultLeftWall);

    const vaultRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.28, 3.55), concreteMat);
    vaultRightWall.position.set(2.23, 0.80, -0.05);
    this.homeRoot.add(vaultRightWall);

    // Glass-fronted vault enclosure
    const vaultGlass = new THREE.Mesh(new THREE.BoxGeometry(4.55, 1.24, 0.04), glassMat);
    vaultGlass.position.set(-0.1, 0.80, 1.66);
    this.homeRoot.add(vaultGlass);

    // A) 20 kWh NEO All-In-One® LiFePO4 Battery Monolith (Left Vault Bay, matching reference)
    const batteryBody = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.98, 0.68), furnitureWhiteMat);
    batteryBody.position.set(-1.25, 0.69, 0.55);
    batteryBody.castShadow = true;
    this.homeRoot.add(batteryBody);

    // Vertical glowing cyan & golden LED edge strips on Battery front corners
    [
      { x: -1.78, color: '#38bdf8' },
      { x: -0.72, color: '#fbbf24' }
    ].forEach((edge) => {
      const eMat = new THREE.MeshBasicMaterial({ color: edge.color });
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.94, 0.06), eMat);
      strip.position.set(edge.x, 0.69, 0.88);
      this.homeRoot.add(strip);
      this.batteryEdgeMats.push(eMat);
    });

    for (let b = 0; b < 5; b++) {
      const bMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.04), bMat);
      bar.position.set(-1.25, 0.36 + b * 0.14, 0.90);
      this.homeRoot.add(bar);
      this.batteryBarMats.push(bMat);
    }

    // B) NEO Clim® Reversible Heat Pump Condenser Unit (Right Vault Bay, with Spinning Fan!)
    const hpBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.84, 0.44), furnitureWhiteMat);
    hpBody.position.set(1.05, 0.62, 0.55);
    hpBody.castShadow = true;
    this.homeRoot.add(hpBody);

    const hpRing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 24), darkMetalMat);
    hpRing.rotation.x = Math.PI / 2;
    hpRing.position.set(0.92, 0.64, 0.77);
    this.homeRoot.add(hpRing);

    const fanHub = new THREE.Group();
    fanHub.position.set(0.92, 0.64, 0.80);
    for (let k = 0; k < 5; k++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.27, 0.02), concreteMat);
      blade.rotation.z = (k * Math.PI * 2) / 5;
      blade.position.set(Math.sin(blade.rotation.z) * 0.14, -Math.cos(blade.rotation.z) * 0.14, 0);
      fanHub.add(blade);
    }
    this.heatPumpFan = fanHub;
    this.homeRoot.add(fanHub);

    // C) Smart Grid Bi-Directional Meter / ATS Board + Right-Side External Utility Grid Pillar
    const meterBoard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.48), darkMetalMat);
    meterBoard.position.set(2.36, 0.78, -0.45);
    this.homeRoot.add(meterBoard);
    this.meterLedMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const meterLed = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.24), this.meterLedMat);
    meterLed.position.set(2.45, 0.84, -0.45);
    this.homeRoot.add(meterLed);

    const gridPillar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.22, 0.36), darkSlateMat);
    gridPillar.position.set(5.12, 0.74, -1.25);
    gridPillar.castShadow = true;
    this.homeRoot.add(gridPillar);
    this.gridBeaconMat = new THREE.MeshBasicMaterial({ color: '#64748b' });
    const gridCap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.4), this.gridBeaconMat);
    gridCap.position.set(5.12, 1.38, -1.25);
    this.homeRoot.add(gridCap);

    // -------------------------------------------------------------------------
    // 4. LEVEL 1: GROUND LIVING/DINING/KITCHEN (y = 1.44..3.06) + RIGHT GARAGE
    // -------------------------------------------------------------------------
    const level1Slab = new THREE.Mesh(new THREE.BoxGeometry(4.92, 0.10, 3.66), plasterMat);
    level1Slab.position.set(-0.1, 1.46, -0.05);
    level1Slab.castShadow = true;
    level1Slab.receiveShadow = true;
    this.homeRoot.add(level1Slab);

    const woodFloorL1 = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.03, 3.4), warmWoodFloorMat);
    woodFloorL1.position.set(-0.1, 1.52, -0.05);
    woodFloorL1.receiveShadow = true;
    this.homeRoot.add(woodFloorL1);

    // Ground Floor Back & Left Walls (end strictly at Level 2 slab y=3.06)
    const wallBackL1 = new THREE.Mesh(new THREE.BoxGeometry(4.84, 1.58, 0.14), plasterMat);
    wallBackL1.position.set(-0.1, 2.28, -1.78);
    wallBackL1.castShadow = true;
    this.homeRoot.add(wallBackL1);

    const wallLeftL1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.58, 3.55), plasterMat);
    wallLeftL1.position.set(-2.45, 2.28, -0.05);
    this.homeRoot.add(wallLeftL1);

    const wallDividerL1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.58, 2.2), timberSlatMat);
    wallDividerL1.position.set(-0.08, 2.28, -0.75);
    this.homeRoot.add(wallDividerL1);

    // Slim dark Level 1 mullions supporting Level 2 slab (height=1.56 -> top 3.06)
    [-2.42, 0.0, 2.24].forEach((px) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.56, 0.12), darkMetalMat);
      col.position.set(px, 2.28, 1.68);
      this.homeRoot.add(col);
    });
    const glassFrontL1 = new THREE.Mesh(new THREE.BoxGeometry(4.62, 1.52, 0.04), glassMat);
    glassFrontL1.position.set(-0.1, 2.28, 1.68);
    this.homeRoot.add(glassFrontL1);

    // Level 1 Furniture: Sofa, Coffee Table, Dining Set, Pendant Light & Kitchen
    const sofaL = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.34, 0.58), sofaMat);
    sofaL.position.set(-1.55, 1.70, 0.55);
    this.homeRoot.add(sofaL);

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.42, 0.14), sofaMat);
    sofaBack.position.set(-1.55, 1.88, 0.80);
    this.homeRoot.add(sofaBack);

    const coffeeTbl = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.44), timberSlatMat);
    coffeeTbl.position.set(-1.55, 1.64, -0.08);
    this.homeRoot.add(coffeeTbl);

    const diningTbl = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.52), timberSlatMat);
    diningTbl.position.set(-0.62, 1.98, -0.45);
    this.homeRoot.add(diningTbl);

    const pendantMat = new THREE.MeshBasicMaterial({ color: '#fde68a' });
    const pendant = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), pendantMat);
    pendant.position.set(-0.62, 2.75, -0.45);
    this.homeRoot.add(pendant);
    this.lampGlowMats.push(pendantMat);

    // Kitchen Counter + Upper Cabinets + Fridge (Center-Right Level 1)
    const kitchenBase = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.56, 0.52), furnitureWhiteMat);
    kitchenBase.position.set(1.12, 1.80, -1.45);
    this.homeRoot.add(kitchenBase);

    const kitchenTopWall = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.48, 0.36), furnitureWhiteMat);
    kitchenTopWall.position.set(1.05, 2.66, -1.52);
    this.homeRoot.add(kitchenTopWall);

    const fridge = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.32, 0.48), concreteMat);
    fridge.position.set(2.02, 2.18, -1.42);
    this.homeRoot.add(fridge);

    // CENTRAL GLOWING HYBRID INVERTER HUB (Signature square centerpiece at (0, 2.68, 1.72))
    const hubBacking = new THREE.Mesh(new THREE.BoxGeometry(1.06, 1.06, 0.14), darkMetalMat);
    hubBacking.position.set(0.0, 2.68, 1.68);
    hubBacking.castShadow = true;
    this.homeRoot.add(hubBacking);

    const hubFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.98, 0.98),
      new THREE.MeshBasicMaterial({ map: inverterCoreTex })
    );
    hubFace.position.set(0.0, 2.68, 1.76);
    this.homeRoot.add(hubFace);

    this.hubPointLight = new THREE.PointLight('#fbbf24', 1.6, 5.2);
    this.hubPointLight.position.set(0.0, 2.68, 2.18);
    this.homeRoot.add(this.hubPointLight);

    // -------------------------------------------------------------------------
    // 5. INTEGRATED RIGHT CARPORT GARAGE + WHITE EV COUPE + ROOF TERRACE
    // -------------------------------------------------------------------------
    const garageFloor = new THREE.Mesh(new THREE.BoxGeometry(3.05, 1.44, 3.66), darkSlateMat);
    garageFloor.position.set(3.88, 0.78, -0.05);
    garageFloor.receiveShadow = true;
    this.homeRoot.add(garageFloor);

    const garageBackWall = new THREE.Mesh(new THREE.BoxGeometry(3.05, 1.62, 0.14), timberSlatMat);
    garageBackWall.position.set(3.88, 2.28, -1.78);
    this.homeRoot.add(garageBackWall);

    const garageRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.62, 3.66), plasterMat);
    garageRightWall.position.set(5.32, 2.28, -0.05);
    this.homeRoot.add(garageRightWall);

    // Wall-mounted NEO Bornes Wallbox Charger in Garage
    const wallbox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.24), darkMetalMat);
    wallbox.position.set(5.20, 2.24, 0.35);
    this.homeRoot.add(wallbox);
    this.wallboxLedMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const wallboxStrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.10), this.wallboxLedMat);
    wallboxStrip.position.set(5.12, 2.24, 0.35);
    this.homeRoot.add(wallboxStrip);

    // Realistic Sculpted White EV Coupe inside Garage
    const evCoupe = createRealisticEvCoupe();
    evCoupe.position.set(3.68, 1.50, 0.35);
    this.homeRoot.add(evCoupe);

    this.evRingMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const evRing = new THREE.Mesh(new THREE.RingGeometry(1.18, 1.30, 32), this.evRingMat);
    evRing.rotation.x = -Math.PI / 2;
    evRing.position.set(3.68, 1.52, 0.35);
    this.homeRoot.add(evRing);

    // Over-Garage Upper Terrace Slab (y = 3.06..3.16) & Glass Railings
    const terraceDeck = new THREE.Mesh(new THREE.BoxGeometry(3.16, 0.12, 3.74), plasterMat);
    terraceDeck.position.set(3.88, 3.10, -0.05);
    terraceDeck.castShadow = true;
    terraceDeck.receiveShadow = true;
    this.homeRoot.add(terraceDeck);

    const tRailFront = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.52, 0.04), glassMat);
    tRailFront.position.set(3.85, 3.42, 1.76);
    this.homeRoot.add(tRailFront);
    const tRailRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 3.60), glassMat);
    tRailRight.position.set(5.36, 3.42, -0.02);
    this.homeRoot.add(tRailRight);

    // Illuminated Terrace Shrub
    const tPlanter = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.34, 0.68), concreteMat);
    tPlanter.position.set(4.65, 3.33, 0.25);
    this.homeRoot.add(tPlanter);
    const tBush = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), bushMat);
    tBush.position.set(4.65, 3.66, 0.25);
    this.homeRoot.add(tBush);

    // -------------------------------------------------------------------------
    // 6. LEVEL 2: UPPER BEDROOM SUITE (y = 3.10..4.42) — TERMINATES CLEANLY UNDER ROOF
    // -------------------------------------------------------------------------
    const level2Slab = new THREE.Mesh(new THREE.BoxGeometry(4.94, 0.12, 3.66), plasterMat);
    level2Slab.position.set(-0.1, 3.10, -0.05);
    level2Slab.castShadow = true;
    level2Slab.receiveShadow = true;
    this.homeRoot.add(level2Slab);

    const woodFloorL2 = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.03, 3.4), warmWoodFloorMat);
    woodFloorL2.position.set(-0.1, 3.17, -0.05);
    this.homeRoot.add(woodFloorL2);

    // STRICTLY CONSTRAINED HEIGHT: floor 3.16 -> eaves beam 4.34 (height = 1.16, center y = 3.74)
    // ZERO pillars or walls touch or protrude through the sloped roof (roof underside starts at y=4.37)!
    const wallBackL2 = new THREE.Mesh(new THREE.BoxGeometry(4.84, 1.16, 0.14), plasterMat);
    wallBackL2.position.set(-0.1, 3.74, -1.78);
    this.homeRoot.add(wallBackL2);

    const wallLeftL2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.16, 3.55), plasterMat);
    wallLeftL2.position.set(-2.45, 3.74, -0.05);
    this.homeRoot.add(wallLeftL2);

    const wallRightL2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.16, 3.55), plasterMat);
    wallRightL2.position.set(2.26, 3.74, -0.05);
    this.homeRoot.add(wallRightL2);

    // Interior Suite Divider & Hallway Door
    const suiteDivider = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.16, 2.4), plasterMat);
    suiteDivider.position.set(-0.15, 3.74, -0.58);
    this.homeRoot.add(suiteDivider);

    const hallDoor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.02, 0.06), timberSlatMat);
    hallDoor.position.set(0.45, 3.67, -1.68);
    this.homeRoot.add(hallDoor);

    // Level 2 Front Columns & Eaves Header Beam flush at y = 4.32 (well below roof slope)
    [-2.42, 0.0, 2.26].forEach((px) => {
      const colL2 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.16, 0.11), darkMetalMat);
      colL2.position.set(px, 3.74, 1.68);
      this.homeRoot.add(colL2);
    });
    const eavesBeamFront = new THREE.Mesh(new THREE.BoxGeometry(4.92, 0.08, 0.14), darkMetalMat);
    eavesBeamFront.position.set(-0.1, 4.30, 1.68);
    this.homeRoot.add(eavesBeamFront);

    // Master Bed, Bedside Lamps, NEO Clim® Split AC & Glass Bath Partition on Level 2
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.28, 1.48), furnitureWhiteMat);
    bedFrame.position.set(-1.35, 3.31, -0.62);
    this.homeRoot.add(bedFrame);
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.55, 0.08), timberSlatMat);
    headboard.position.set(-1.35, 3.54, -1.36);
    this.homeRoot.add(headboard);

    const bathGlass = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.08, 1.35), glassMat);
    bathGlass.position.set(1.05, 3.72, -0.95);
    this.homeRoot.add(bathGlass);

    const splitAcUpper = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.20, 0.16), furnitureWhiteMat);
    splitAcUpper.position.set(1.55, 4.10, -1.60);
    this.homeRoot.add(splitAcUpper);

    // Warm Interior Room Lights
    const lightFloor1 = new THREE.PointLight('#ffdca8', 1.4, 6.2);
    lightFloor1.position.set(-0.85, 2.65, 0.1);
    const lightKitchen = new THREE.PointLight('#ffe4b5', 1.2, 5.2);
    lightKitchen.position.set(1.15, 2.65, -0.65);
    const lightFloor2 = new THREE.PointLight('#ffdca8', 1.3, 6.0);
    lightFloor2.position.set(-0.85, 4.15, -0.2);
    const lightVault = new THREE.PointLight('#7dd3fc', 0.9, 5.2);
    lightVault.position.set(-0.1, 1.15, 0.5);
    const lightGarage = new THREE.PointLight('#bae6fd', 1.0, 5.5);
    lightGarage.position.set(3.85, 2.75, 0.3);

    this.interiorLights.push(lightFloor1, lightKitchen, lightFloor2, lightVault, lightGarage);
    this.interiorLights.forEach((l) => this.homeRoot.add(l));

    // -------------------------------------------------------------------------
    // 7. SYMMETRIC A-FRAME DUAL-PITCHED GABLE ROOF & 15-PANEL BIFACIAL SOLAR ARRAY
    // -------------------------------------------------------------------------
    // Ridge z = -0.05, y = 5.72; Eaves y = 4.42 at z = -1.80 & z = +1.70
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-1.75, 0);
    gableShape.lineTo(0, 1.30);
    gableShape.lineTo(1.75, 0);
    gableShape.closePath();

    const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 0.12, bevelEnabled: false });
    gableGeo.translate(0, 0, -0.06);
    gableGeo.rotateY(Math.PI / 2);

    // Gable end pediments at Left (-2.44), Center Divider (-0.15) and Right (+2.24), starting cleanly at y = 4.34
    [-2.44, -0.15, 2.24].forEach((gx) => {
      const gable = new THREE.Mesh(gableGeo, plasterMat);
      gable.position.set(gx, 4.34, -0.05);
      gable.castShadow = true;
      this.homeRoot.add(gable);
    });

    const slopeAngle = Math.atan2(1.30, 1.75); // ~36.6 deg
    const roofHalfRun = 2.02;
    const slopeLen = Math.hypot(roofHalfRun, roofHalfRun * (1.30 / 1.75));
    const slopeMidY = 5.74 - (roofHalfRun * 0.5 * 1.30) / 1.75;

    // Front South-Facing Roof Pitch + 15-Panel Framed Solar Array
    const frontRoofGroup = new THREE.Group();
    frontRoofGroup.position.set(-0.1, slopeMidY, -0.05 + roofHalfRun * 0.5);
    frontRoofGroup.rotation.x = slopeAngle;

    const frontRoofDeck = new THREE.Mesh(new THREE.BoxGeometry(5.32, 0.12, slopeLen), roofTileMat);
    frontRoofDeck.castShadow = true;
    frontRoofGroup.add(frontRoofDeck);

    // 3 rows x 5 columns = 15 bifacial framed solar panels
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const px = -1.78 + col * 0.89;
        const pz = -0.68 + row * 0.68;

        const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.04, 0.63), darkMetalMat);
        panelFrame.position.set(px, 0.08, pz);
        frontRoofGroup.add(panelFrame);

        const pvCell = new THREE.Mesh(new THREE.BoxGeometry(0.79, 0.05, 0.58), solarMat);
        pvCell.position.set(px, 0.085, pz);
        frontRoofGroup.add(pvCell);
      }
    }
    this.homeRoot.add(frontRoofGroup);

    // Rear Roof Pitch
    const rearRoofDeck = new THREE.Mesh(new THREE.BoxGeometry(5.32, 0.12, slopeLen), roofTileMat);
    rearRoofDeck.position.set(-0.1, slopeMidY, -0.05 - roofHalfRun * 0.5);
    rearRoofDeck.rotation.x = -slopeAngle;
    rearRoofDeck.castShadow = true;
    this.homeRoot.add(rearRoofDeck);

    // Clean Horizontal Ridge Cap Beam uniting both slopes
    const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(5.36, 0.11, 0.16), darkMetalMat);
    ridgeCap.position.set(-0.1, 5.75, -0.05);
    this.homeRoot.add(ridgeCap);

    this.scene.add(this.homeRoot);
  }

  buildEnergyCircuits() {
    this.circuitsGroup = new THREE.Group();

    const makeCircuit = (key, rawPoints, colorHex, count, radius = 0.036, secondOffset = 0) => {
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

      // Optional twin parallel glowing neon trace for dramatic energy spine look
      let twinMat = null;
      if (secondOffset !== 0) {
        const twinCurve = new THREE.CatmullRomCurve3(
          rawPoints.map(([x, y, z]) => new THREE.Vector3(x + secondOffset, y, z)),
          false,
          'catmullrom',
          0.12
        );
        twinMat = tubeMat;
        const twinTube = new THREE.Mesh(new THREE.TubeGeometry(twinCurve, 48, radius * 0.65, 6, false), twinMat);
        this.circuitsGroup.add(twinTube);
      }

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

    // 1. Rooftop Solar Panels -> Central Hybrid Inverter Hub (twin golden solar feed)
    makeCircuit(
      'solarToInverter',
      [
        [-0.45, 4.78, 1.38],
        [-0.45, 4.25, 1.72],
        [-0.08, 3.65, 1.74],
        [0.0, 3.16, 1.74]
      ],
      '#facc15',
      6,
      0.038,
      0.11
    );

    // 2. Central Inverter Hub <-> 20 kWh Basement Battery Bank (Reversible!)
    makeCircuit(
      'inverterToBattery',
      [
        [-0.08, 2.18, 1.74],
        [-0.08, 1.15, 1.74],
        [-0.42, 0.72, 1.15],
        [-0.74, 0.72, 0.85]
      ],
      '#10b981',
      6,
      0.038,
      -0.09
    );

    // 3. Central Inverter Hub -> Lower NEO Clim® Heat Pump
    makeCircuit(
      'inverterToHeatPump',
      [
        [0.14, 2.18, 1.74],
        [0.14, 0.78, 1.74],
        [0.45, 0.64, 1.10],
        [0.64, 0.64, 0.78]
      ],
      '#38bdf8',
      5,
      0.032
    );

    // 4. Central Inverter Hub -> Living/Dining & Upper Master Suite
    makeCircuit(
      'inverterToLiving',
      [
        [-0.48, 2.68, 1.72],
        [-1.35, 2.15, 0.65],
        [-1.35, 3.35, 0.65],
        [1.45, 4.05, -1.45]
      ],
      '#fde047',
      7,
      0.032
    );

    // 5. Central Inverter Hub -> Right Carport Garage Wallbox -> White EV Coupe
    makeCircuit(
      'inverterToEv',
      [
        [0.48, 2.55, 1.72],
        [2.25, 2.15, 0.95],
        [5.12, 2.24, 0.35],
        [4.88, 1.56, 0.35],
        [3.68, 1.56, 0.35]
      ],
      '#38bdf8',
      8,
      0.036
    );

    // 6. External Utility Grid Pillar <-> Smart Grid Meter Board <-> Central Inverter Hub
    makeCircuit(
      'gridToMeter',
      [
        [5.12, 1.22, -1.25],
        [5.12, 0.25, -1.25],
        [2.48, 0.25, -0.45],
        [2.42, 0.78, -0.45],
        [0.36, 2.45, 1.68]
      ],
      '#f59e0b',
      7,
      0.038
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
      this.controls.autoRotate = this.state.autoRotate;
      this.controls.autoRotateSpeed = 1.45;
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
    this.controls.autoRotate = false;
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

    this.syncLanguage();
    this.syncStateToUI();
    this.focusCameraPreset('overview');

    requestAnimationFrame(() => {
      this.resize();
      this.startLoop();
    });
  }

  close() {
    if (!this.modalEl) return;
    this.isOpen = false;
    this.modalEl.classList.remove('is-open');
    this.modalEl.hidden = true;
    document.body.classList.remove('ac-studio-open');
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
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

    // 2. Spin the lower-vault Heat Pump fan continuously
    if (this.heatPumpFan) {
      this.heatPumpFan.rotation.z -= dt * 7.5;
    }

    // 3. X-Ray Cutaway Wall Opacity
    const targetWallOpacity = xray ? 0.24 : 0.96;
    this.xrayTargets.forEach((m) => {
      m.opacity += (targetWallOpacity - m.opacity) * Math.min(1, dt * 8);
    });

    // 4. Day vs Evening Lighting & Warm Room Illumination
    const isDay = mode === 'day';
    this.sunOrb.visible = isDay;
    this.moonOrb.visible = !isDay;

    this.sunLight.intensity += ((isDay ? 2.4 : 0.85) - this.sunLight.intensity) * Math.min(1, dt * 6);
    this.hemiLight.intensity += ((isDay ? 1.5 : 0.98) - this.hemiLight.intensity) * Math.min(1, dt * 6);
    this.rimLight.color.set(isDay ? '#38bdf8' : mode === 'battery' ? '#34d399' : '#f59e0b');
    this.sunLight.color.set(isDay ? '#fff8eb' : '#93c5fd');

    const targetInterior = isDay ? 0.85 : 2.35;
    this.interiorLights.forEach((l) => {
      l.intensity += (targetInterior - l.intensity) * Math.min(1, dt * 6);
    });
    this.hubPointLight.intensity = 1.4 + 0.45 * Math.sin(elapsed * 4.5);
    this.hubPointLight.color.set(mode === 'battery' ? '#34d399' : mode === 'grid' ? '#f59e0b' : '#fbbf24');

    // 5. Configure 6 Dual-Color Circuits by Mode
    const cSolar = this.circuits.solarToInverter;
    const cBat = this.circuits.inverterToBattery;
    const cHp = this.circuits.inverterToHeatPump;
    const cLiv = this.circuits.inverterToLiving;
    const cEv = this.circuits.inverterToEv;
    const cGrid = this.circuits.gridToMeter;

    if (mode === 'day') {
      cSolar.active = true; cSolar.dir = 1; cSolar.speed = 0.50;
      cSolar.tubeMat.color.set('#facc15'); cSolar.beadMat.color.set('#fde047');

      cBat.active = true; cBat.dir = 1; cBat.speed = 0.36;
      cBat.tubeMat.color.set('#f59e0b'); cBat.beadMat.color.set('#fde047');

      cHp.tubeMat.color.set('#38bdf8'); cHp.beadMat.color.set('#7dd3fc');
      cLiv.tubeMat.color.set('#fbbf24'); cLiv.beadMat.color.set('#fde047');
      cEv.tubeMat.color.set('#38bdf8'); cEv.beadMat.color.set('#6ee7b7');

      cGrid.active = true; cGrid.dir = -1; cGrid.speed = 0.25; // Surplus export to Grid
      cGrid.tubeMat.color.set('#38bdf8'); cGrid.beadMat.color.set('#7dd3fc');

      this.meterLedMat.color.set('#38bdf8');
      this.gridBeaconMat.color.set('#38bdf8');
      this.evRingMat.color.set('#38bdf8');
    } else if (mode === 'battery') {
      cSolar.active = false;

      // Discharging Battery -> Central Hybrid Inverter Hub
      cBat.active = true; cBat.dir = -1; cBat.speed = 0.54;
      cBat.tubeMat.color.set('#10b981'); cBat.beadMat.color.set('#6ee7b7');

      cHp.tubeMat.color.set('#34d399'); cHp.beadMat.color.set('#6ee7b7');
      cLiv.tubeMat.color.set('#34d399'); cLiv.beadMat.color.set('#6ee7b7');
      cEv.tubeMat.color.set('#34d399'); cEv.beadMat.color.set('#6ee7b7');

      // Zero utility grid usage!
      cGrid.active = false;

      this.meterLedMat.color.set('#334155');
      this.gridBeaconMat.color.set('#334155');
      this.evRingMat.color.set('#10b981');
    } else {
      cSolar.active = false;

      // Utility Grid actively powering Inverter -> House + Trickle reserve
      cBat.active = true; cBat.dir = 1; cBat.speed = 0.22;
      cBat.tubeMat.color.set('#60a5fa'); cBat.beadMat.color.set('#93c5fd');

      cHp.tubeMat.color.set('#fb923c'); cHp.beadMat.color.set('#fdba74');
      cLiv.tubeMat.color.set('#fb923c'); cLiv.beadMat.color.set('#fdba74');
      cEv.tubeMat.color.set('#f59e0b'); cEv.beadMat.color.set('#fde047');

      cGrid.active = true; cGrid.dir = 1; cGrid.speed = 0.52;
      cGrid.tubeMat.color.set('#f59e0b'); cGrid.beadMat.color.set('#fbbf24');

      this.meterLedMat.color.set('#f59e0b');
      this.gridBeaconMat.color.set('#f59e0b');
      this.evRingMat.color.set('#f59e0b');
    }

    Object.values(this.circuits).forEach((c) => {
      c.tubeMat.opacity = c.active ? 0.44 : 0.06;
      c.beads.forEach((b) => {
        b.mesh.visible = c.active;
        if (!c.active) return;
        const raw = (b.offset + elapsed * c.speed * c.dir) % 1;
        const u = raw < 0 ? raw + 1 : raw;
        c.curve.getPointAt(u, b.mesh.position);
      });
    });

    // Battery LED stack SoC indicator
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

    // 6. Project 3D Hotspots
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
        const x = (proj.x * 0.5 + 0.5) * cw;
        const y = (-proj.y * 0.5 + 0.5) * ch;
        hp.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        hp.el.style.opacity = '1';
        hp.el.style.pointerEvents = 'auto';
      });
    }
  }
}
