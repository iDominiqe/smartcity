import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSolarTexture, createStylizedVehicle } from './scene/textures-helpers.js';
import {
  HOME_STUDIO_TEXT,
  HOME_MODE_TELEMETRY,
  HOME_LEFT_SPECS,
  HOME_RIGHT_SPECS,
  HOME_CAMERA_PRESETS,
  HOME_HOTSPOTS,
  HOME_GALLERY_IMAGES
} from './data/home-studio-data.js';

export class HomeStudio3D {
  constructor({ i18n, onRequestQuote }) {
    this.i18n = i18n;
    this.onRequestQuote = onRequestQuote;

    this.state = {
      mode: 'day', // 'day' | 'battery' | 'grid'
      xray: false,
      autoRotate: false,
      activePreset: 'overview',
      activeSpecId: 'solarRoof',
      galleryOpen: false
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
            <button type="button" class="ac-btn-secondary" id="home-btn-diagrams">${u.diagramsBtn}</button>
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

        <div class="ac-gallery-drawer" id="home-gallery-drawer" hidden>
          <div class="ac-gallery-head">
            <div>
              <h3 id="home-gallery-title">${u.diagramsTitle}</h3>
              <p id="home-gallery-hint">${u.diagramsHint}</p>
            </div>
            <button type="button" class="ac-btn-close small" id="home-btn-close-gallery">✕</button>
          </div>
          <div class="home-photos-grid" id="home-photos-grid"></div>
        </div>
      </div>
    `;

    this.renderSpecCards();
    this.renderHotspotsDOM();
    this.renderGalleryDOM();
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

  renderGalleryDOM() {
    const grid = document.getElementById('home-photos-grid');
    if (!grid) return;
    grid.innerHTML = HOME_GALLERY_IMAGES.map(
      (img) => `
      <figure class="ac-photo-item">
        <img src="${img.src}" alt="${this.t(img.caption)}" loading="lazy" />
        <figcaption>${this.t(img.caption)}</figcaption>
      </figure>
    `
    ).join('');
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
    this.renderer.toneMappingExposure = 1.08;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.1, 80);
    this.camera.position.set(...HOME_CAMERA_PRESETS.overview.pos);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 4.2;
    this.controls.maxDistance = 19.0;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minPolarAngle = 0.14;
    this.controls.target.set(...HOME_CAMERA_PRESETS.overview.target);
    this.controls.addEventListener('start', () => {
      this.camTransition = null;
    });

    // Studio & Atmospheric Day/Evening Lights
    this.hemiLight = new THREE.HemisphereLight('#f0f9ff', '#0f172a', 1.5);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#fff8eb', 2.4);
    this.sunLight.position.set(6, 11, 6);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight('#38bdf8', 0.9);
    this.rimLight.position.set(-7, 5, -6);
    this.scene.add(this.rimLight);

    // Sun & Moon Visual Orbs above Villa
    this.sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 24, 24),
      new THREE.MeshBasicMaterial({ color: '#fde047' })
    );
    this.sunOrb.position.set(4.5, 7.6, -2.5);
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

    const plinthMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.72, metalness: 0.15 });
    const drivewayMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.78 });
    const lawnMat = new THREE.MeshStandardMaterial({ color: '#1e463a', roughness: 0.88 });
    const wallWhiteMat = new THREE.MeshStandardMaterial({
      color: '#f1f5f9',
      roughness: 0.55,
      transparent: true,
      opacity: 0.96
    });
    const innerFloorMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.65 });
    const upperFloorMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.62 });
    const roofDarkMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.48,
      metalness: 0.3,
      transparent: true,
      opacity: 0.96
    });
    const furnitureMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 });
    const woodToneMat = new THREE.MeshStandardMaterial({ color: '#b47b52', roughness: 0.65 });
    const darkUnitMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.35, metalness: 0.45 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#bae6fd',
      transparent: true,
      opacity: 0.24,
      roughness: 0.08,
      metalness: 0.15,
      depthWrite: false
    });
    const solarMat = new THREE.MeshStandardMaterial({
      map: createSolarTexture(),
      roughness: 0.2,
      metalness: 0.65,
      emissive: new THREE.Color('#0c4a6e'),
      emissiveIntensity: 0.28
    });

    this.xrayTargets.push(wallWhiteMat, roofDarkMat);

    // 1. Architectural Base Plinth, Driveway & Garden
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.28, 7.6), plinthMat);
    plinth.position.set(0.1, -0.06, 0.0);
    plinth.receiveShadow = true;
    this.homeRoot.add(plinth);

    const plinthBorder = new THREE.Mesh(
      new THREE.BoxGeometry(10.72, 0.06, 7.72),
      new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.45 })
    );
    plinthBorder.position.set(0.1, 0.06, 0.0);
    this.homeRoot.add(plinthBorder);
    this.plinthBorderMat = plinthBorder.material;

    const driveway = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 4.8), drivewayMat);
    driveway.position.set(-3.6, 0.1, 1.0);
    driveway.receiveShadow = true;
    this.homeRoot.add(driveway);

    const lawnR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 5.8), lawnMat);
    lawnR.position.set(3.9, 0.1, 0.2);
    lawnR.receiveShadow = true;
    this.homeRoot.add(lawnR);

    // 2. Ground & Upper Cutaway Floors
    const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 4.0), innerFloorMat);
    groundFloor.position.set(0.4, 0.12, -0.2);
    groundFloor.receiveShadow = true;
    this.homeRoot.add(groundFloor);

    const upperFloor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 4.0), upperFloorMat);
    upperFloor.position.set(0.4, 2.15, -0.2);
    upperFloor.receiveShadow = true;
    upperFloor.castShadow = true;
    this.homeRoot.add(upperFloor);

    // Side Terrace / Balcony extending left at Upper Floor (matching Image 1 & 4)
    const terraceDeck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 2.8), upperFloorMat);
    terraceDeck.position.set(-2.35, 2.15, 0.35);
    this.homeRoot.add(terraceDeck);

    const railFront = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 0.05), glassMat);
    railFront.position.set(-2.35, 2.48, 1.72);
    this.homeRoot.add(railFront);
    const railSide = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 2.8), glassMat);
    railSide.position.set(-3.08, 2.48, 0.35);
    this.homeRoot.add(railSide);

    // 3. Structural Back, Left & Utility Station Walls (Open Cutaway on +Z Front!)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(4.3, 4.05, 0.16), wallWhiteMat);
    backWall.position.set(0.4, 2.18, -2.18);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.homeRoot.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.05, 4.05), wallWhiteMat);
    leftWall.position.set(-1.66, 2.18, -0.2);
    leftWall.castShadow = true;
    this.homeRoot.add(leftWall);

    // Right wall (lower portion houses Technical Power Station bay outside, upper has cutaway window)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.05, 4.05), wallWhiteMat);
    rightWall.position.set(2.45, 2.18, -0.2);
    rightWall.castShadow = true;
    this.homeRoot.add(rightWall);

    // Front Glass Panorama Strips (minimal pillars + clear glass so rooms show through clearly)
    [-1.62, 0.35, 2.42].forEach((px) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.14, 4.02, 0.14), darkUnitMat);
      col.position.set(px, 2.18, 1.76);
      this.homeRoot.add(col);
    });
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(3.96, 3.85, 0.04), glassMat);
    frontGlass.position.set(0.4, 2.18, 1.76);
    this.homeRoot.add(frontGlass);

    // 4. Furnished Ground Floor (Kitchen + Lounge + Smart Floor Ring)
    const kitchenCounter = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 0.55), furnitureMat);
    kitchenCounter.position.set(-0.4, 0.48, -1.78);
    this.homeRoot.add(kitchenCounter);

    const island = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.62, 0.62), woodToneMat);
    island.position.set(0.25, 0.46, -0.55);
    this.homeRoot.add(island);

    const fridge = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.35, 0.52), upperFloorMat);
    fridge.position.set(1.55, 0.84, -1.76);
    this.homeRoot.add(fridge);

    const washer = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.48), furnitureMat);
    washer.position.set(-1.18, 0.48, -1.1);
    this.homeRoot.add(washer);

    const sofa = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.42, 0.68), furnitureMat);
    sofa.position.set(0.1, 0.36, 1.05);
    this.homeRoot.add(sofa);

    // Glowing holographic smart-floor disc (matching Image 1)
    const floorRingMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    });
    const floorRing = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.44, 32), floorRingMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.set(0.4, 0.19, 0.45);
    this.homeRoot.add(floorRing);
    this.floorRingMat = floorRingMat;

    // 5. Furnished Upper Floor (Bed/Suite, Wall Energy Screen, NEO Clim Split AC)
    const bedBase = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.34, 1.6), furnitureMat);
    bedBase.position.set(-0.65, 2.38, -0.75);
    this.homeRoot.add(bedBase);

    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.2, 1.35), upperFloorMat);
    mattress.position.set(-0.65, 2.6, -0.68);
    this.homeRoot.add(mattress);

    // Wall Smart Energy Monitor Screen
    const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.52, 0.06), darkUnitMat);
    screenFrame.position.set(0.85, 3.12, -2.06);
    this.homeRoot.add(screenFrame);
    const screenGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 0.42),
      new THREE.MeshBasicMaterial({ color: '#0ea5e9' })
    );
    screenGlow.position.set(0.85, 3.12, -2.02);
    this.homeRoot.add(screenGlow);
    this.hudScreenMat = screenGlow.material;

    // Wall-mounted NEO Clim® Indoor Split Unit
    const splitAc = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.24, 0.2), furnitureMat);
    splitAc.position.set(1.65, 3.65, -1.98);
    this.homeRoot.add(splitAc);

    // Warm Interior Room Lights
    const groundLight = new THREE.PointLight('#ffdca8', 0.4, 6);
    groundLight.position.set(0.3, 1.75, -0.2);
    this.homeRoot.add(groundLight);

    const upperLight = new THREE.PointLight('#ffdca8', 0.4, 6);
    upperLight.position.set(0.3, 3.75, -0.2);
    this.homeRoot.add(upperLight);
    this.interiorLights.push(groundLight, upperLight);

    // 6. Pitched Solar Roof + 12-Panel Bifacial Array (y = 4.2..5.5)
    const roofGroup = new THREE.Group();
    roofGroup.position.set(0.4, 4.65, -0.2);
    roofGroup.rotation.x = 0.34;

    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.2, 4.55), roofDarkMat);
    roofSlab.castShadow = true;
    roofGroup.add(roofSlab);

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 6; col++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.06, 1.65), solarMat);
        panel.position.set(-1.82 + col * 0.73, 0.14, -0.92 + row * 1.82);
        roofGroup.add(panel);
      }
    }

    const dcCombiner = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.24), darkUnitMat);
    dcCombiner.position.set(2.05, 0.18, 0.3);
    roofGroup.add(dcCombiner);

    this.homeRoot.add(roofGroup);

    // 7. Technical Power Station Wall (Right Wall Exterior at x = 2.55: Inverter + 20 kWh Battery + Smart Meter)
    const stationPad = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 3.6), drivewayMat);
    stationPad.position.set(2.85, 0.1, 0.4);
    stationPad.receiveShadow = true;
    this.homeRoot.add(stationPad);

    // A) 20 kWh LiFePO4 Home Battery (Front-right tall monolith, matching Image 3)
    const batteryBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.28, 0.62), furnitureMat);
    batteryBody.position.set(2.68, 0.82, 1.75);
    batteryBody.castShadow = true;
    this.homeRoot.add(batteryBody);

    const batteryBezel = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.22, 0.06), darkUnitMat);
    batteryBezel.position.set(2.68, 0.82, 2.04);
    this.homeRoot.add(batteryBezel);

    for (let b = 0; b < 5; b++) {
      const bMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.34), bMat);
      bar.position.set(2.84, 0.42 + b * 0.20, 1.75);
      this.homeRoot.add(bar);
      this.batteryBarMats.push(bMat);
    }

    // B) 10 kW Hybrid MPPT Inverter
    const inverterBox = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.64, 0.52), furnitureMat);
    inverterBox.position.set(2.65, 1.68, 0.82);
    inverterBox.castShadow = true;
    this.homeRoot.add(inverterBox);

    const invScreen = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.32), darkUnitMat);
    invScreen.position.set(2.77, 1.74, 0.82);
    this.homeRoot.add(invScreen);

    this.invLedMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const invLed = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.24), this.invLedMat);
    invLed.position.set(2.78, 1.52, 0.82);
    this.homeRoot.add(invLed);

    // C) Smart Grid Bi-Directional Meter & ATS Distribution Board
    const meterBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.56, 0.44), darkUnitMat);
    meterBox.position.set(2.65, 1.65, -0.35);
    meterBox.castShadow = true;
    this.homeRoot.add(meterBox);

    this.meterLedMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const meterDial = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.24), this.meterLedMat);
    meterDial.position.set(2.77, 1.72, -0.35);
    this.homeRoot.add(meterDial);

    // D) External Utility Grid Terminal Pillar (Right edge of plinth)
    const gridPost = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.35, 0.38), darkUnitMat);
    gridPost.position.set(4.55, 0.76, -0.65);
    gridPost.castShadow = true;
    this.homeRoot.add(gridPost);

    this.gridBeaconMat = new THREE.MeshBasicMaterial({ color: '#64748b' });
    const gridCap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.42), this.gridBeaconMat);
    gridCap.position.set(4.55, 1.48, -0.65);
    this.homeRoot.add(gridCap);

    // 8. Left Driveway Carport, EV Charger Wallbox & Electric Vehicle
    const wallbox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.28), darkUnitMat);
    wallbox.position.set(-1.76, 1.25, 1.35);
    this.homeRoot.add(wallbox);

    this.wallboxLedMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const wallboxStrip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.08), this.wallboxLedMat);
    wallboxStrip.position.set(-1.82, 1.28, 1.35);
    this.homeRoot.add(wallboxStrip);

    const parkedEv = createStylizedVehicle('#f8fafc', false);
    parkedEv.scale.setScalar(0.95);
    parkedEv.position.set(-3.55, 0.12, 1.55);
    this.homeRoot.add(parkedEv);

    this.evRingMat = new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const evRing = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.28, 32), this.evRingMat);
    evRing.rotation.x = -Math.PI / 2;
    evRing.position.set(-3.55, 0.14, 1.55);
    this.homeRoot.add(evRing);

    this.scene.add(this.homeRoot);
  }

  buildEnergyCircuits() {
    this.circuitsGroup = new THREE.Group();

    const makeCircuit = (key, rawPoints, colorHex, count, radius = 0.042) => {
      const curve = new THREE.CatmullRomCurve3(
        rawPoints.map((p) => new THREE.Vector3(...p)),
        false,
        'catmullrom',
        0.1
      );
      const tubeMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.28
      });
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 44, radius, 8, false), tubeMat);
      this.circuitsGroup.add(tube);

      const beadGeo = new THREE.SphereGeometry(radius * 2.1, 10, 10);
      const beadMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
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
        speed: 0.35,
        active: true
      };
    };

    // 1. Solar Roof Combiner -> 10 kW Hybrid Inverter
    makeCircuit(
      'solarToInverter',
      [
        [2.35, 4.45, 0.15],
        [2.72, 4.15, 0.65],
        [2.72, 2.35, 0.82],
        [2.72, 1.85, 0.82]
      ],
      '#facc15',
      6,
      0.045
    );

    // 2. Hybrid Inverter <-> 20 kWh Home Battery (Reversible charge/discharge!)
    makeCircuit(
      'inverterToBattery',
      [
        [2.74, 1.48, 0.98],
        [2.78, 1.48, 1.75],
        [2.78, 1.25, 1.75]
      ],
      '#10b981',
      5,
      0.045
    );

    // 3. Utility Grid Post <-> Smart Meter <-> Hybrid Inverter
    makeCircuit(
      'gridToMeter',
      [
        [4.55, 1.25, -0.65],
        [4.55, 0.25, -0.65],
        [2.72, 0.25, -0.35],
        [2.72, 1.45, -0.35],
        [2.72, 1.65, 0.62]
      ],
      '#f59e0b',
      7,
      0.045
    );

    // 4. Inverter -> Upper Floor Suite, NEO Clim AC & Wall HUD
    makeCircuit(
      'inverterToUpper',
      [
        [2.52, 1.72, 0.82],
        [2.32, 2.95, 0.82],
        [2.32, 3.25, -1.96],
        [1.65, 3.55, -1.96],
        [0.85, 3.12, -1.96],
        [-0.55, 2.65, -0.85]
      ],
      '#38bdf8',
      8,
      0.036
    );

    // 5. Inverter -> Ground Floor Smart Hub, Kitchen Island & Washer
    makeCircuit(
      'inverterToGround',
      [
        [2.52, 1.48, 0.55],
        [2.25, 0.20, 0.55],
        [0.40, 0.20, 0.45],
        [0.25, 0.52, -0.55],
        [-1.15, 0.52, -1.15]
      ],
      '#38bdf8',
      7,
      0.036
    );

    // 6. Inverter -> Left Carport Wallbox & Parked EV
    makeCircuit(
      'inverterToEv',
      [
        [2.52, 1.45, 1.15],
        [2.25, 0.22, 1.50],
        [-1.78, 0.22, 1.50],
        [-1.84, 1.25, 1.38],
        [-2.75, 0.65, 1.55],
        [-3.55, 0.65, 1.55]
      ],
      '#34d399',
      7,
      0.04
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

    document.getElementById('home-btn-diagrams')?.addEventListener('click', () => {
      this.state.galleryOpen = !this.state.galleryOpen;
      this.syncStateToUI();
    });
    document.getElementById('home-btn-close-gallery')?.addEventListener('click', () => {
      this.state.galleryOpen = false;
      this.syncStateToUI();
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
        if (this.state.galleryOpen) {
          this.state.galleryOpen = false;
          this.syncStateToUI();
        } else {
          this.close();
        }
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
    setText('home-btn-diagrams', u.diagramsBtn);
    setText('home-btn-quote', u.requestQuote);
    setText('home-btn-close', u.closeBtn);
    setText('home-btn-xray', u.xrayBtn);
    setText('home-btn-autospin', u.autoSpin);
    setText('home-gallery-title', u.diagramsTitle);
    setText('home-gallery-hint', u.diagramsHint);
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
    this.renderGalleryDOM();
    this.syncStateToUI();
  }

  syncStateToUI() {
    const { mode, xray, activePreset, activeSpecId, autoRotate, galleryOpen } = this.state;
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

    const drawer = document.getElementById('home-gallery-drawer');
    if (drawer) drawer.hidden = !galleryOpen;
    document.getElementById('home-btn-diagrams')?.classList.toggle('active', galleryOpen);
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

    // 2. X-Ray Cutaway Wall Opacity
    const targetWallOpacity = xray ? 0.24 : 0.96;
    this.xrayTargets.forEach((m) => {
      m.opacity += (targetWallOpacity - m.opacity) * Math.min(1, dt * 8);
    });

    // 3. Day vs Evening Atmosphere & Lights
    const isDay = mode === 'day';
    this.sunOrb.visible = isDay;
    this.moonOrb.visible = !isDay;

    this.sunLight.intensity += ((isDay ? 2.4 : 0.72) - this.sunLight.intensity) * Math.min(1, dt * 6);
    this.hemiLight.intensity += ((isDay ? 1.55 : 0.95) - this.hemiLight.intensity) * Math.min(1, dt * 6);
    this.rimLight.color.set(isDay ? '#38bdf8' : mode === 'battery' ? '#34d399' : '#f59e0b');
    this.sunLight.color.set(isDay ? '#fff8eb' : '#93c5fd');

    const targetInterior = isDay ? 0.45 : 2.6;
    this.interiorLights.forEach((l) => {
      l.intensity += (targetInterior - l.intensity) * Math.min(1, dt * 6);
    });

    // 4. Configure 6 Energy Circuits by Mode
    const cSolar = this.circuits.solarToInverter;
    const cBat = this.circuits.inverterToBattery;
    const cGrid = this.circuits.gridToMeter;
    const cUpper = this.circuits.inverterToUpper;
    const cGround = this.circuits.inverterToGround;
    const cEv = this.circuits.inverterToEv;

    if (mode === 'day') {
      cSolar.active = true; cSolar.dir = 1; cSolar.speed = 0.48;
      cSolar.tubeMat.color.set('#facc15'); cSolar.beadMat.color.set('#fde047');

      cBat.active = true; cBat.dir = 1; cBat.speed = 0.36;
      cBat.tubeMat.color.set('#10b981'); cBat.beadMat.color.set('#34d399');

      cGrid.active = true; cGrid.dir = -1; cGrid.speed = 0.24; // Surplus export to grid
      cGrid.tubeMat.color.set('#38bdf8'); cGrid.beadMat.color.set('#7dd3fc');

      cUpper.tubeMat.color.set('#38bdf8'); cUpper.beadMat.color.set('#7dd3fc');
      cGround.tubeMat.color.set('#38bdf8'); cGround.beadMat.color.set('#7dd3fc');
      cEv.tubeMat.color.set('#10b981'); cEv.beadMat.color.set('#34d399');

      this.invLedMat.color.set('#38bdf8');
      this.meterLedMat.color.set('#38bdf8');
      this.gridBeaconMat.color.set('#38bdf8');
      this.evRingMat.color.set('#10b981');
    } else if (mode === 'battery') {
      cSolar.active = false;

      // Battery DISCHARGING into Inverter!
      cBat.active = true; cBat.dir = -1; cBat.speed = 0.52;
      cBat.tubeMat.color.set('#10b981'); cBat.beadMat.color.set('#6ee7b7');

      // Zero grid usage!
      cGrid.active = false;

      cUpper.tubeMat.color.set('#34d399'); cUpper.beadMat.color.set('#6ee7b7');
      cGround.tubeMat.color.set('#34d399'); cGround.beadMat.color.set('#6ee7b7');
      cEv.tubeMat.color.set('#34d399'); cEv.beadMat.color.set('#6ee7b7');

      this.invLedMat.color.set('#10b981');
      this.meterLedMat.color.set('#334155');
      this.gridBeaconMat.color.set('#334155');
      this.evRingMat.color.set('#34d399');
    } else {
      // Evening Utility Grid mode
      cSolar.active = false;

      cBat.active = true; cBat.dir = 1; cBat.speed = 0.22; // Gentle night reserve trickle
      cBat.tubeMat.color.set('#60a5fa'); cBat.beadMat.color.set('#93c5fd');

      // Utility Grid actively supplying home
      cGrid.active = true; cGrid.dir = 1; cGrid.speed = 0.48;
      cGrid.tubeMat.color.set('#f59e0b'); cGrid.beadMat.color.set('#fbbf24');

      cUpper.tubeMat.color.set('#fb923c'); cUpper.beadMat.color.set('#fdba74');
      cGround.tubeMat.color.set('#fb923c'); cGround.beadMat.color.set('#fdba74');
      cEv.tubeMat.color.set('#f59e0b'); cEv.beadMat.color.set('#fbbf24');

      this.invLedMat.color.set('#f59e0b');
      this.meterLedMat.color.set('#f59e0b');
      this.gridBeaconMat.color.set('#f59e0b');
      this.evRingMat.color.set('#f59e0b');
    }

    // Update circuit beads & tubes
    Object.values(this.circuits).forEach((c) => {
      c.tubeMat.opacity = c.active ? 0.34 : 0.06;
      c.beads.forEach((b) => {
        b.mesh.visible = c.active;
        if (!c.active) return;
        const raw = (b.offset + elapsed * c.speed * c.dir) % 1;
        const u = raw < 0 ? raw + 1 : raw;
        c.curve.getPointAt(u, b.mesh.position);
      });
    });

    // Battery LED Stack SoC indicator
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
    this.floorRingMat.color.set(accentHex);
    this.hudScreenMat.color.set(accentHex);
    this.wallboxLedMat.color.set(accentHex);

    // 5. Project Hotspots
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
