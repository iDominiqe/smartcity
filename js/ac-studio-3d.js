import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getDevicePerfTier, destroyStudioRenderer } from './utils/webgl-memory.js';
import {
  AC_STUDIO_TEXT,
  AC_LEFT_SPECS,
  AC_RIGHT_SPECS,
  AC_CAMERA_PRESETS,
  AC_HOTSPOTS,
  AC_PHOTO_GALLERY
} from './data/ac-studio-data.js';

function createSoftParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.72)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawRoundedPanel(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export class AcStudio3D {
  constructor({ i18n, onRequestQuote, onClose }) {
    this.i18n = i18n;
    this.onRequestQuote = onRequestQuote;
    this.onClose = onClose;

    this.state = {
      mode: 'cool', // 'cool' | 'heat' | 'dry' | 'fan' | 'off'
      temp: 18,
      fanSpeed: 'high', // 'low' | 'med' | 'high' | 'auto'
      autoRotate: false,
      activePreset: 'front',
      activeSpecId: 'capacity',
      galleryOpen: false
    };

    this.isOpen = false;
    this.rafId = null;
    this.lastTime = null;
    this.elapsed = 0;

    // Camera transition state
    this.camTransition = null;
    this.desiredCamPos = new THREE.Vector3(...AC_CAMERA_PRESETS.front.pos);
    this.desiredTarget = new THREE.Vector3(...AC_CAMERA_PRESETS.front.target);

    this.modalEl = document.getElementById('ac-studio-modal');
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
    return AC_STUDIO_TEXT[lang] || AC_STUDIO_TEXT.en;
  }

  renderShellDOM() {
    const u = this.ui();
    this.modalEl.innerHTML = `
      <div class="ac-studio-backdrop" id="ac-studio-backdrop"></div>
      <div class="ac-studio-shell" role="dialog" aria-modal="true" aria-labelledby="ac-studio-title">
        <header class="ac-studio-header">
          <div class="ac-studio-title-wrap">
            <span class="ac-studio-badge" id="ac-studio-badge">${u.badge}</span>
            <h2 id="ac-studio-title">${u.title}</h2>
            <p id="ac-studio-subtitle">${u.subtitle}</p>
          </div>
          <div class="ac-studio-header-actions">
            <button type="button" class="ac-btn-secondary" id="ac-btn-remote-toggle">${u.remoteBtn}</button>
            <button type="button" class="ac-btn-primary" id="ac-btn-quote">${u.requestQuote}</button>
            <button type="button" class="ac-btn-close" id="ac-btn-close">${u.closeBtn}</button>
          </div>
        </header>

        <div class="ac-studio-grid">
          <aside class="ac-specs-col left" id="ac-specs-left"></aside>

          <section class="ac-stage-center">
            <div class="ac-live-banner cool" id="ac-live-banner">
              <span class="ac-live-dot"></span>
              <span id="ac-live-status-text">${u.modeStatus.cool}</span>
              <strong class="ac-live-temp-pill" id="ac-live-temp-pill">18°C</strong>
            </div>

            <div class="ac-canvas-wrap">
              <canvas id="ac-studio-canvas" aria-label="Interactive 3D Air Conditioner"></canvas>
              <div class="ac-hotspot-layer" id="ac-hotspot-layer"></div>
            </div>

            <div class="ac-drag-hint" id="ac-drag-hint">${u.dragHint}</div>

            <div class="ac-cam-pills" id="ac-cam-pills">
              <button type="button" class="ac-cam-btn active" data-cam="front">${u.camFront}</button>
              <button type="button" class="ac-cam-btn" data-cam="top">${u.camTop}</button>
              <button type="button" class="ac-cam-btn" data-cam="louver">${u.camLouver}</button>
              <button type="button" class="ac-cam-btn" data-cam="rear">${u.camRear}</button>
              <button type="button" class="ac-cam-btn" data-cam="side">${u.camSide}</button>
              <button type="button" class="ac-cam-btn" id="ac-btn-autospin">${u.autoSpin}</button>
            </div>
          </section>

          <aside class="ac-specs-col right" id="ac-specs-right"></aside>
        </div>

        <footer class="ac-control-dock">
          <div class="ac-dock-group ac-mode-group">
            <button type="button" class="ac-mode-btn active" data-mode="cool">${u.cool}</button>
            <button type="button" class="ac-mode-btn" data-mode="heat">${u.heat}</button>
            <button type="button" class="ac-mode-btn" data-mode="dry">${u.dry}</button>
            <button type="button" class="ac-mode-btn" data-mode="fan">${u.fan}</button>
            <button type="button" class="ac-mode-btn off" data-mode="off">${u.off}</button>
          </div>

          <div class="ac-dock-group ac-temp-group">
            <span class="ac-dock-label" id="ac-label-temp">${u.tempLabel}</span>
            <button type="button" class="ac-step-btn" id="ac-temp-down">−</button>
            <span class="ac-temp-readout" id="ac-temp-readout">18°C</span>
            <button type="button" class="ac-step-btn" id="ac-temp-up">+</button>
          </div>

          <div class="ac-dock-group ac-fan-group">
            <span class="ac-dock-label" id="ac-label-fan">${u.fanLabel}</span>
            <button type="button" class="ac-fan-btn" data-fan="low">${u.fanLow}</button>
            <button type="button" class="ac-fan-btn" data-fan="med">${u.fanMed}</button>
            <button type="button" class="ac-fan-btn active" data-fan="high">${u.fanHigh}</button>
            <button type="button" class="ac-fan-btn" data-fan="auto">${u.fanAuto}</button>
          </div>
        </footer>

        <div class="ac-gallery-drawer" id="ac-gallery-drawer" hidden>
          <div class="ac-gallery-head">
            <div>
              <h3 id="ac-gallery-title">${u.remoteTitle}</h3>
              <p id="ac-gallery-hint">${u.remoteHint}</p>
            </div>
            <button type="button" class="ac-btn-close small" id="ac-btn-close-gallery">✕</button>
          </div>
          <div class="ac-gallery-body">
            <div class="ac-remote-interactive">
              <img src="assets/ac-mz/mz-remote.jpg" alt="TCL MZ Remote Control" />
              <div class="ac-remote-pad">
                <button type="button" class="ac-mode-btn" data-mode="cool">${u.cool}</button>
                <button type="button" class="ac-mode-btn" data-mode="heat">${u.heat}</button>
                <button type="button" class="ac-mode-btn" data-mode="dry">${u.dry}</button>
                <button type="button" class="ac-step-btn wide" id="ac-remote-temp-up">▲ +1°C</button>
                <button type="button" class="ac-step-btn wide" id="ac-remote-temp-down">▼ −1°C</button>
                <button type="button" class="ac-mode-btn off" data-mode="off">${u.off}</button>
              </div>
            </div>
            <div class="ac-photos-grid" id="ac-photos-grid"></div>
          </div>
        </div>
      </div>
    `;

    this.renderSpecCards();
    this.renderHotspotsDOM();
    this.renderGalleryDOM();
  }

  renderSpecCards() {
    const leftContainer = document.getElementById('ac-specs-left');
    const rightContainer = document.getElementById('ac-specs-right');
    const buildCard = (sp, idx) => `
      <button type="button" class="ac-spec-card ${this.state.activeSpecId === sp.id ? 'active' : ''}"
              data-spec-id="${sp.id}" data-cam="${sp.camPreset}" style="--stagger:${idx * 65}ms">
        <div class="ac-spec-head">
          <span class="ac-spec-icon">${sp.icon}</span>
          <span class="ac-spec-label">${this.t(sp.label)}</span>
        </div>
        <strong class="ac-spec-val">${sp.value}</strong>
        <p class="ac-spec-detail">${this.t(sp.detail)}</p>
      </button>
    `;

    if (leftContainer) {
      leftContainer.innerHTML = AC_LEFT_SPECS.map((sp, i) => buildCard(sp, i)).join('');
    }
    if (rightContainer) {
      rightContainer.innerHTML = AC_RIGHT_SPECS.map((sp, i) => buildCard(sp, i)).join('');
    }

    this.modalEl.querySelectorAll('.ac-spec-card').forEach((card) => {
      card.addEventListener('click', () => {
        const specId = card.dataset.specId;
        const cam = card.dataset.cam || 'front';
        this.state.activeSpecId = specId;
        this.focusCameraPreset(cam);
        this.syncStateToUI();
      });
    });
  }

  renderHotspotsDOM() {
    const layer = document.getElementById('ac-hotspot-layer');
    if (!layer) return;
    layer.innerHTML = AC_HOTSPOTS.map(
      (h) => `
      <button type="button" class="ac-hotspot-pin" data-hotspot-id="${h.id}" data-cam="${h.camPreset}">
        <span class="ac-hotspot-dot"></span>
        <span class="ac-hotspot-label">${this.t(h.label)}</span>
      </button>
    `
    ).join('');

    this.hotspotPins = AC_HOTSPOTS.map((h) => ({
      ...h,
      vec: new THREE.Vector3(...h.pos),
      el: layer.querySelector(`[data-hotspot-id="${h.id}"]`)
    }));

    this.hotspotPins.forEach((hp) => {
      hp.el?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.focusCameraPreset(hp.camPreset);
      });
    });
  }

  renderGalleryDOM() {
    const grid = document.getElementById('ac-photos-grid');
    if (!grid) return;
    grid.innerHTML = AC_PHOTO_GALLERY.map(
      (img) => `
      <figure class="ac-photo-item">
        <img src="${img.src}" alt="${this.t(img.caption)}" loading="lazy" />
        <figcaption>${this.t(img.caption)}</figcaption>
      </figure>
    `
    ).join('');
  }

  initScene() {
    const canvas = document.getElementById('ac-studio-canvas');
    if (!canvas) return;

    const perf = getDevicePerfTier();
    this.pedestalRingMats = [];
    this.ribbons = [];
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
    this.renderer.toneMappingExposure = 1.08;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.1, 60);
    this.camera.position.set(...AC_CAMERA_PRESETS.front.pos);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 8.2;
    this.controls.maxPolarAngle = Math.PI * 0.56;
    this.controls.minPolarAngle = 0.14;
    this.controls.target.set(...AC_CAMERA_PRESETS.front.target);
    this.controls.addEventListener('start', () => {
      this.camTransition = null;
    });

    // Studio Lighting Setup
    this.hemiLight = new THREE.HemisphereLight('#f0f9ff', '#0f172a', 1.45);
    this.scene.add(this.hemiLight);

    const keyLight = new THREE.DirectionalLight('#ffffff', 2.2);
    keyLight.position.set(4.5, 6.8, 5.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#7dd3fc', 1.1);
    rimLight.position.set(-4.5, 3.6, -4.0);
    this.scene.add(rimLight);
    this.rimLight = rimLight;

    const fillLight = new THREE.DirectionalLight('#e2e8f0', 0.85);
    fillLight.position.set(0, 2.0, -5.0);
    this.scene.add(fillLight);

    this.cavityLight = new THREE.PointLight('#38bdf8', 2.2, 4.5);
    this.cavityLight.position.set(0, 2.85, 0.35);
    this.scene.add(this.cavityLight);

    // Studio Display Pedestal + Floor Shadow Catcher
    const stageGroup = new THREE.Group();
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.78, 1.92, 0.12, 48),
      new THREE.MeshStandardMaterial({
        color: '#0f172a',
        roughness: 0.38,
        metalness: 0.5
      })
    );
    pedestal.position.y = -0.06;
    pedestal.receiveShadow = true;
    stageGroup.add(pedestal);

    this.pedestalRingMats = [];
    [1.62, 1.84, 2.12].forEach((r, idx) => {
      const mat = new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.45 - idx * 0.12
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.035, 64), mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.005;
      stageGroup.add(ring);
      this.pedestalRingMats.push(mat);
    });
    this.scene.add(stageGroup);

    this.buildTclMzModel();
    this.buildThermalAirflow();
    this.updatePanelTexture();
  }

  buildTclMzModel() {
    this.acGroup = new THREE.Group();

    const bodyWhiteMat = new THREE.MeshPhysicalMaterial({
      color: '#f8fafc',
      roughness: 0.22,
      metalness: 0.04,
      clearcoat: 0.55,
      clearcoatRoughness: 0.18
    });
    const ribWhiteMat = new THREE.MeshStandardMaterial({
      color: '#e8eef5',
      roughness: 0.35,
      metalness: 0.05
    });
    const darkDeckMat = new THREE.MeshStandardMaterial({
      color: '#111827',
      roughness: 0.32,
      metalness: 0.45
    });
    const deepVoidMat = new THREE.MeshStandardMaterial({
      color: '#05080f',
      roughness: 0.9,
      metalness: 0.1
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      roughness: 0.2,
      metalness: 0.85
    });
    const blueFilterMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 0.72
    });
    const casterMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.5,
      metalness: 0.2
    });

    // 1. Main Sculpted Rounded Monobloc Shell (width=1.44, depth=1.56, height=2.56)
    const hw = 0.71;
    const hd = 0.76;
    const rad = 0.22;
    const shape = new THREE.Shape();
    shape.moveTo(-hw + rad, -hd);
    shape.lineTo(hw - rad, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + rad);
    shape.lineTo(hw, hd - rad);
    shape.quadraticCurveTo(hw, hd, hw - rad, hd);
    shape.lineTo(-hw + rad, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - rad);
    shape.lineTo(-hw, -hd + rad);
    shape.quadraticCurveTo(-hw, -hd, -hw + rad, -hd);

    const chassisGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 2.52,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.035,
      bevelSegments: 4,
      curveSegments: 14
    });
    chassisGeo.rotateX(-Math.PI / 2);
    const chassis = new THREE.Mesh(chassisGeo, bodyWhiteMat);
    chassis.position.y = 0.14;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.acGroup.add(chassis);

    // 2. 7 Signature Upper-Front Horizontal Rib Strips (matching Photo 4 & Photo 5)
    for (let i = 0; i < 7; i++) {
      const ry = 2.22 + i * 0.048;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.022, 0.04), ribWhiteMat);
      rib.position.set(0, ry, 0.79);
      this.acGroup.add(rib);

      // Wrap subtle corner ribs around left & right shoulder
      [-1, 1].forEach((side) => {
        const sRib = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.45), ribWhiteMat);
        sRib.position.set(side * 0.745, ry, 0.45);
        this.acGroup.add(sRib);
      });
    }

    // 3. Front Dark Glossy Square IR Sensor & NEO / TCL Emblem
    const irSquare = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.03), darkDeckMat);
    irSquare.position.set(0, 1.84, 0.805);
    this.acGroup.add(irSquare);

    const logoPlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.055, 0.025), chromeMat);
    logoPlate.position.set(0, 1.98, 0.802);
    this.acGroup.add(logoPlate);

    // 4. Recessed Left/Right Side Carry Handles + Lower Side Intake Louvers
    [-1, 1].forEach((side) => {
      const handleRecess = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.34), deepVoidMat);
      handleRecess.position.set(side * 0.735, 1.66, 0.02);
      this.acGroup.add(handleRecess);

      const handleTrim = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.42), ribWhiteMat);
      handleTrim.position.set(side * 0.74, 1.66, 0.02);
      this.acGroup.add(handleTrim);

      for (let s = 0; s < 14; s++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.38), deepVoidMat);
        slot.position.set(side * 0.742, 0.36 + s * 0.06, -0.34);
        this.acGroup.add(slot);
      }
    });

    // 5. Top Beveled Anthracite/Black Control Deck + Touch Panel CanvasTexture
    const topTray = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.09, 1.32), darkDeckMat);
    topTray.position.set(0, 2.71, 0.0);
    topTray.castShadow = true;
    this.acGroup.add(topTray);

    const topRimL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 1.38), bodyWhiteMat);
    topRimL.position.set(-0.67, 2.72, 0.0);
    this.acGroup.add(topRimL);

    const topRimR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 1.38), bodyWhiteMat);
    topRimR.position.set(0.67, 2.72, 0.0);
    this.acGroup.add(topRimR);

    const topRimBack = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.11, 0.12), bodyWhiteMat);
    topRimBack.position.set(0, 2.72, -0.71);
    this.acGroup.add(topRimBack);

    // Live Dynamic LED Touch Panel Texture on Top Rear Half (matching Photo 2)
    this.panelCanvas = document.createElement('canvas');
    this.panelCanvas.width = 1024;
    this.panelCanvas.height = 384;
    this.panelTex = new THREE.CanvasTexture(this.panelCanvas);
    this.panelTex.colorSpace = THREE.SRGBColorSpace;
    this.panelTex.anisotropy = 4;

    const touchPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.08, 0.42),
      new THREE.MeshBasicMaterial({ map: this.panelTex })
    );
    touchPanel.rotation.x = -Math.PI / 2;
    touchPanel.position.set(0, 2.762, -0.29);
    this.acGroup.add(touchPanel);

    // 6. Deep Top Blower Cavity + 12 Vertical Deflector Vanes + Motorized Dual-Blade Louver
    const blowerPit = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.16, 0.56), deepVoidMat);
    blowerPit.position.set(0, 2.68, 0.29);
    this.acGroup.add(blowerPit);

    for (let v = 0; v < 11; v++) {
      const vane = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.12, 0.48), darkDeckMat);
      vane.position.set(-0.45 + v * 0.09, 2.71, 0.29);
      this.acGroup.add(vane);
    }

    this.louverPivot = new THREE.Group();
    this.louverPivot.position.set(0, 2.755, 0.06);

    const mainBlade = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.025, 0.26), darkDeckMat);
    mainBlade.position.set(0, 0, 0.15);
    this.louverPivot.add(mainBlade);

    const frontBlade = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.022, 0.22), darkDeckMat);
    frontBlade.position.set(0, -0.01, 0.41);
    frontBlade.rotation.x = -0.08;
    this.louverPivot.add(frontBlade);

    this.acGroup.add(this.louverPivot);

    // 7. Detailed Rear Assembly (matching Photo 1: Upper Filter Louvers, Exhaust Housing, Drain Cap, Lower Condenser Grille)
    const rearUpperBacking = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.88, 0.03), deepVoidMat);
    rearUpperBacking.position.set(0, 2.02, -0.785);
    this.acGroup.add(rearUpperBacking);

    const blueFilterUpper = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.82), blueFilterMat);
    blueFilterUpper.position.set(0, 2.02, -0.802);
    blueFilterUpper.rotation.y = Math.PI;
    this.acGroup.add(blueFilterUpper);

    for (let r = 0; r < 14; r++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.022, 0.035), bodyWhiteMat);
      slat.position.set(0, 1.62 + r * 0.06, -0.805);
      this.acGroup.add(slat);
    }
    // Vertical dividers in upper rear grille (4 columns)
    [-0.22, 0, 0.22].forEach((dx) => {
      const div = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.88, 0.038), bodyWhiteMat);
      div.position.set(dx, 2.02, -0.805);
      this.acGroup.add(div);
    });

    // Protruding Square Rear Exhaust Duct Adapter (mid-left in rear Photo 1)
    const exhaustBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.14), bodyWhiteMat);
    exhaustBox.position.set(-0.34, 1.06, -0.84);
    exhaustBox.castShadow = true;
    this.acGroup.add(exhaustBox);

    const exhaustVoid = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.06), deepVoidMat);
    exhaustVoid.position.set(-0.34, 1.06, -0.89);
    this.acGroup.add(exhaustVoid);

    for (let eg = -3; eg <= 3; eg++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.34, 0.04), darkDeckMat);
      fin.position.set(-0.34 + eg * 0.048, 1.06, -0.905);
      this.acGroup.add(fin);
    }

    // Continuous Drain Plug & Tether Cap (middle-center above lower grille)
    const drainCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.075, 0.05, 16),
      bodyWhiteMat
    );
    drainCollar.rotation.x = Math.PI / 2;
    drainCollar.position.set(0.14, 1.32, -0.81);
    this.acGroup.add(drainCollar);

    // Lower Right Condenser Intake Grille
    const lowerGrilleVoid = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.82, 0.03), deepVoidMat);
    lowerGrilleVoid.position.set(0.28, 0.76, -0.785);
    this.acGroup.add(lowerGrilleVoid);

    for (let lr = 0; lr < 14; lr++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.02, 0.035), bodyWhiteMat);
      slat.position.set(0.28, 0.39 + lr * 0.055, -0.802);
      this.acGroup.add(slat);
    }
    const lowerDiv = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.82, 0.038), bodyWhiteMat);
    lowerDiv.position.set(0.28, 0.76, -0.802);
    this.acGroup.add(lowerDiv);

    // Bottom Power Cord Stub & Lower Drain Bung
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 10), bodyWhiteMat);
    cord.position.set(-0.24, 0.16, -0.81);
    cord.rotation.x = 0.25;
    this.acGroup.add(cord);

    const lowDrain = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.04, 12), darkDeckMat);
    lowDrain.rotation.x = Math.PI / 2;
    lowDrain.position.set(0.0, 0.18, -0.805);
    this.acGroup.add(lowDrain);

    // 8. 4 Compact Swivel Twin-Wheel Casters Underneath
    const casterGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.095, 16);
    casterGeo.rotateZ(Math.PI / 2);
    [
      [-0.48, 0.075, 0.52],
      [0.48, 0.075, 0.52],
      [-0.48, 0.075, -0.52],
      [0.48, 0.075, -0.52]
    ].forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(casterGeo, casterMat);
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      this.acGroup.add(wheel);

      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.08), darkDeckMat);
      bracket.position.set(wx, wy + 0.055, wz);
      this.acGroup.add(bracket);
    });

    this.scene.add(this.acGroup);
  }

  buildThermalAirflow() {
    this.flowGroup = new THREE.Group();
    const softTex = createSoftParticleTexture();

    // A. Curved 3D Airflow Stream Ribbons Emerging Out of Top Louver
    this.ribbons = [];
    const offsetsX = [-0.38, -0.22, -0.07, 0.07, 0.22, 0.38];
    offsetsX.forEach((ox, idx) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(ox * 0.85, 2.74, 0.26),
        new THREE.Vector3(ox * 1.05, 3.28, 0.65),
        new THREE.Vector3(ox * 1.32, 3.85, 1.32),
        new THREE.Vector3(ox * 1.55, 4.18, 2.15)
      ]);
      const mat = new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.024, 6, false), mat);
      this.flowGroup.add(mesh);
      this.ribbons.push({ mesh, mat, baseX: ox, phase: idx * 0.8 });
    });

    // B. 220 Volumetric Swirling Air Jet Particles from Top Outlet
    this.topParticleCount = 220;
    const topPos = new Float32Array(this.topParticleCount * 3);
    this.topSeeds = [];
    for (let i = 0; i < this.topParticleCount; i++) {
      this.topSeeds.push({
        t: Math.random(),
        lane: (Math.random() - 0.5) * 0.92,
        swirl: Math.random() * Math.PI * 2,
        spread: 0.7 + Math.random() * 0.6,
        speed: 0.45 + Math.random() * 0.35
      });
    }
    const topGeo = new THREE.BufferGeometry();
    topGeo.setAttribute('position', new THREE.BufferAttribute(topPos, 3));
    this.topParticleMat = new THREE.PointsMaterial({
      map: softTex,
      color: '#7dd3fc',
      size: 0.24,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.topPoints = new THREE.Points(topGeo, this.topParticleMat);
    this.flowGroup.add(this.topPoints);

    // C. 60 Secondary Rear Exhaust Duct Particles (Heat Rejection in Cool Mode / Cold Vent in Heat Mode)
    this.rearParticleCount = 60;
    const rearPos = new Float32Array(this.rearParticleCount * 3);
    this.rearSeeds = [];
    for (let i = 0; i < this.rearParticleCount; i++) {
      this.rearSeeds.push({
        t: Math.random(),
        ox: (Math.random() - 0.5) * 0.24,
        oy: (Math.random() - 0.5) * 0.24,
        speed: 0.55 + Math.random() * 0.35
      });
    }
    const rearGeo = new THREE.BufferGeometry();
    rearGeo.setAttribute('position', new THREE.BufferAttribute(rearPos, 3));
    this.rearParticleMat = new THREE.PointsMaterial({
      map: softTex,
      color: '#fb923c',
      size: 0.19,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.rearPoints = new THREE.Points(rearGeo, this.rearParticleMat);
    this.flowGroup.add(this.rearPoints);

    this.scene.add(this.flowGroup);
  }

  updatePanelTexture() {
    if (!this.panelCanvas || !this.panelTex) return;
    const ctx = this.panelCanvas.getContext('2d');
    const W = 1024;
    const H = 384;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0e131b';
    ctx.fillRect(0, 0, W, H);

    // Brushed anthracite inner deck matching Photo 2
    const deckGrad = ctx.createLinearGradient(40, 28, W - 40, H - 28);
    deckGrad.addColorStop(0, '#1e2532');
    deckGrad.addColorStop(0.5, '#2b3446');
    deckGrad.addColorStop(1, '#1e2532');
    ctx.fillStyle = deckGrad;
    drawRoundedPanel(ctx, 36, 26, W - 72, H - 52, 24);
    ctx.fill();

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 3;
    ctx.stroke();

    const { mode, temp, fanSpeed } = this.state;
    const isOff = mode === 'off';
    const modeColor =
      mode === 'heat'
        ? '#fb923c'
        : mode === 'dry'
        ? '#34d399'
        : mode === 'fan'
        ? '#e2e8f0'
        : '#38bdf8';

    // Left Status LEDs
    const leftItems = [
      { label: 'Timer', on: !isOff },
      { label: 'WiFi', on: !isOff },
      { label: 'High', on: !isOff && fanSpeed === 'high' },
      { label: 'Med', on: !isOff && fanSpeed === 'med' },
      { label: 'Low', on: !isOff && fanSpeed === 'low' },
      { label: 'Auto', on: !isOff && fanSpeed === 'auto' }
    ];
    ctx.font = '700 20px Inter, Arial, sans-serif';
    ctx.textBaseline = 'middle';
    leftItems.forEach((it, idx) => {
      const col = idx < 2 ? 0 : 1;
      const row = idx < 2 ? idx : idx - 2;
      const x = 105 + col * 140;
      const y = 78 + row * 36;
      ctx.textAlign = 'right';
      ctx.fillStyle = it.on ? '#ffffff' : 'rgba(203,213,225,0.48)';
      ctx.fillText(it.label, x + 68, y);

      ctx.fillStyle = it.on ? modeColor : '#334155';
      ctx.fillRect(x + 82, y - 6, 16, 12);
    });

    // Center Digital 7-Segment Temperature Readout
    ctx.fillStyle = '#090d14';
    drawRoundedPanel(ctx, 435, 58, 154, 118, 14);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = '900 78px Inter, Arial, sans-serif';
    ctx.fillStyle = isOff ? '#475569' : modeColor;
    ctx.shadowColor = isOff ? 'transparent' : modeColor;
    ctx.shadowBlur = isOff ? 0 : 18;
    const readout = isOff ? '--' : mode === 'fan' ? 'FA' : `${temp}°`;
    ctx.fillText(readout, 512, 118);
    ctx.shadowBlur = 0;

    // Right Status LEDs (Modes)
    const rightModes = [
      { label: 'Cool', active: mode === 'cool' },
      { label: 'Fan', active: mode === 'fan' },
      { label: 'Dry', active: mode === 'dry' },
      { label: 'Heat', active: mode === 'heat' },
      { label: 'Sleep', active: false }
    ];
    ctx.font = '700 20px Inter, Arial, sans-serif';
    rightModes.forEach((rm, idx) => {
      const col = idx === 4 ? 1 : 0;
      const row = idx === 4 ? 0 : idx;
      const x = 635 + col * 135;
      const y = 78 + row * 36;
      ctx.fillStyle = rm.active ? modeColor : '#334155';
      ctx.fillRect(x, y - 6, 16, 12);

      ctx.textAlign = 'left';
      ctx.fillStyle = rm.active ? '#ffffff' : 'rgba(203,213,225,0.52)';
      ctx.fillText(rm.label, x + 28, y);
    });

    // Horizontal divider & bottom 6 capacitive touch icons (matching Photo 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(88, 224);
    ctx.lineTo(W - 88, 224);
    ctx.stroke();

    const icons = ['⏱ TIMER', '🌀 FAN', '▽ DOWN', '△ UP', '❄ MODE', '⏻ POWER'];
    ctx.font = '700 22px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    icons.forEach((lbl, i) => {
      const bx = 160 + i * 140;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(lbl, bx, 286);
      if (i < icons.length - 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.beginPath();
        ctx.moveTo(bx + 70, 260);
        ctx.lineTo(bx + 70, 312);
        ctx.stroke();
      }
    });

    this.panelTex.needsUpdate = true;
  }

  bindUIEvents() {
    document.getElementById('ac-btn-close')?.addEventListener('click', () => this.close());
    document.getElementById('ac-studio-backdrop')?.addEventListener('click', () => this.close());

    document.getElementById('ac-btn-quote')?.addEventListener('click', () => {
      this.close();
      if (this.onRequestQuote) this.onRequestQuote();
    });

    document.getElementById('ac-btn-remote-toggle')?.addEventListener('click', () => {
      this.state.galleryOpen = !this.state.galleryOpen;
      this.syncStateToUI();
    });
    document.getElementById('ac-btn-close-gallery')?.addEventListener('click', () => {
      this.state.galleryOpen = false;
      this.syncStateToUI();
    });

    this.modalEl.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.state.mode = mode;
        if (mode === 'cool' && this.state.temp > 23) this.state.temp = 18;
        if (mode === 'heat' && this.state.temp < 24) this.state.temp = 28;
        this.syncStateToUI();
        this.updatePanelTexture();
      });
    });

    const changeTemp = (delta) => {
      if (this.state.mode === 'off') this.state.mode = 'cool';
      this.state.temp = Math.max(16, Math.min(31, this.state.temp + delta));
      this.syncStateToUI();
      this.updatePanelTexture();
    };
    document.getElementById('ac-temp-down')?.addEventListener('click', () => changeTemp(-1));
    document.getElementById('ac-temp-up')?.addEventListener('click', () => changeTemp(1));
    document.getElementById('ac-remote-temp-down')?.addEventListener('click', () => changeTemp(-1));
    document.getElementById('ac-remote-temp-up')?.addEventListener('click', () => changeTemp(1));

    this.modalEl.querySelectorAll('[data-fan]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.fanSpeed = btn.dataset.fan;
        this.syncStateToUI();
        this.updatePanelTexture();
      });
    });

    this.modalEl.querySelectorAll('[data-cam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.focusCameraPreset(btn.dataset.cam);
      });
    });

    document.getElementById('ac-btn-autospin')?.addEventListener('click', () => {
      this.state.autoRotate = !this.state.autoRotate;
      if (this.controls) {
        this.controls.autoRotate = this.state.autoRotate;
        this.controls.autoRotateSpeed = 1.85;
      }
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
    const preset = AC_CAMERA_PRESETS[presetName] || AC_CAMERA_PRESETS.front;
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
    setText('ac-studio-badge', u.badge);
    setText('ac-studio-title', u.title);
    setText('ac-studio-subtitle', u.subtitle);
    setText('ac-drag-hint', u.dragHint);
    setText('ac-btn-remote-toggle', u.remoteBtn);
    setText('ac-btn-quote', u.requestQuote);
    setText('ac-btn-close', u.closeBtn);
    setText('ac-label-temp', u.tempLabel);
    setText('ac-label-fan', u.fanLabel);
    setText('ac-btn-autospin', u.autoSpin);
    setText('ac-gallery-title', u.remoteTitle);
    setText('ac-gallery-hint', u.remoteHint);

    const camMap = {
      front: u.camFront,
      top: u.camTop,
      louver: u.camLouver,
      rear: u.camRear,
      side: u.camSide
    };
    this.modalEl.querySelectorAll('[data-cam]').forEach((b) => {
      if (camMap[b.dataset.cam]) b.textContent = camMap[b.dataset.cam];
    });
    this.modalEl.querySelectorAll('[data-mode]').forEach((b) => {
      if (u[b.dataset.mode]) b.textContent = u[b.dataset.mode];
    });
    const fanMap = { low: u.fanLow, med: u.fanMed, high: u.fanHigh, auto: u.fanAuto };
    this.modalEl.querySelectorAll('[data-fan]').forEach((b) => {
      if (fanMap[b.dataset.fan]) b.textContent = fanMap[b.dataset.fan];
    });

    this.renderSpecCards();
    this.renderHotspotsDOM();
    this.renderGalleryDOM();
    this.syncStateToUI();
  }

  syncStateToUI() {
    const { mode, temp, fanSpeed, activePreset, activeSpecId, autoRotate, galleryOpen } = this.state;
    const u = this.ui();

    this.modalEl.dataset.thermalMode = mode;

    const banner = document.getElementById('ac-live-banner');
    if (banner) {
      banner.className = `ac-live-banner ${mode}`;
    }
    const statusTxt = document.getElementById('ac-live-status-text');
    if (statusTxt) statusTxt.textContent = u.modeStatus[mode] || u.modeStatus.cool;

    const tempStr = mode === 'off' ? '--' : mode === 'fan' ? 'FAN' : `${temp}°C`;
    const pill = document.getElementById('ac-live-temp-pill');
    if (pill) pill.textContent = tempStr;
    const readout = document.getElementById('ac-temp-readout');
    if (readout) readout.textContent = tempStr;

    this.modalEl.querySelectorAll('[data-mode]').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    this.modalEl.querySelectorAll('[data-fan]').forEach((b) => {
      b.classList.toggle('active', b.dataset.fan === fanSpeed);
    });
    this.modalEl.querySelectorAll('[data-cam]').forEach((b) => {
      b.classList.toggle('active', b.dataset.cam === activePreset && !autoRotate);
    });
    document.getElementById('ac-btn-autospin')?.classList.toggle('active', autoRotate);

    this.modalEl.querySelectorAll('.ac-spec-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.specId === activeSpecId);
    });

    const drawer = document.getElementById('ac-gallery-drawer');
    if (drawer) drawer.hidden = !galleryOpen;
    document.getElementById('ac-btn-remote-toggle')?.classList.toggle('active', galleryOpen);
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
    if (initialMode) {
      this.state.mode = initialMode;
      this.state.temp = initialMode === 'heat' ? 28 : 18;
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
    this.updatePanelTexture();
    this.focusCameraPreset('front');

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
    this.panelCanvas = null;
    this.panelTex = null;
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
    const { mode, fanSpeed } = this.state;
    const isActive = mode !== 'off';
    const fanMult =
      fanSpeed === 'low' ? 0.65 : fanSpeed === 'med' ? 0.95 : fanSpeed === 'high' ? 1.38 : 1.1;

    // 1. Camera preset glide
    if (this.camTransition?.active) {
      const k = 1 - Math.exp(-6.5 * dt);
      this.camera.position.lerp(this.desiredCamPos, k);
      this.controls.target.lerp(this.desiredTarget, k);
      if (this.camera.position.distanceTo(this.desiredCamPos) < 0.025) {
        this.camTransition = null;
      }
    }
    this.controls.update();

    // 2. Motorized Dual-Blade Top Louver Angle (closed when Off, sweeping when active)
    const targetLouverAngle = isActive
      ? -0.78 + Math.sin(elapsed * 1.15 * fanMult) * 0.24
      : 0.02;
    this.louverPivot.rotation.x += (targetLouverAngle - this.louverPivot.rotation.x) * Math.min(1, dt * 5.0);

    // 3. Mode Colors (Cool cyan vs Heat fiery amber-orange vs Dry emerald vs Fan silver)
    let frontColor = '#38bdf8';
    let rearColor = '#fb923c';
    let ringColor = '#38bdf8';

    if (mode === 'heat') {
      frontColor = '#fb923c';
      rearColor = '#7dd3fc';
      ringColor = '#f97316';
    } else if (mode === 'dry') {
      frontColor = '#34d399';
      rearColor = '#94a3b8';
      ringColor = '#10b981';
    } else if (mode === 'fan') {
      frontColor = '#e2e8f0';
      rearColor = '#94a3b8';
      ringColor = '#cbd5e1';
    } else if (mode === 'off') {
      ringColor = '#334155';
    }

    this.cavityLight.color.set(frontColor);
    this.cavityLight.intensity = isActive ? 1.8 + 0.6 * Math.sin(elapsed * 4.0 * fanMult) : 0.08;
    this.rimLight.color.set(frontColor);

    this.pedestalRingMats.forEach((mat, idx) => {
      mat.color.set(ringColor);
      mat.opacity = isActive
        ? (0.48 - idx * 0.12) * (0.72 + 0.28 * Math.sin(elapsed * 2.8 - idx * 0.8))
        : 0.14;
    });

    // 4. Animate Top Thermal Plume & Ribbons
    this.flowGroup.visible = isActive;
    if (isActive) {
      this.ribbons.forEach((rb, idx) => {
        rb.mat.color.set(frontColor);
        rb.mat.opacity = 0.14 + 0.26 * (0.5 + 0.5 * Math.sin(elapsed * 4.5 * fanMult - rb.phase));
        rb.mesh.position.x = Math.sin(elapsed * 2.2 + idx) * 0.04;
      });

      this.topParticleMat.color.set(frontColor);
      this.topParticleMat.opacity = mode === 'fan' ? 0.42 : 0.82;
      const topAttr = this.topPoints.geometry.getAttribute('position');
      for (let i = 0; i < this.topParticleCount; i++) {
        const s = this.topSeeds[i];
        s.t = (s.t + dt * s.speed * fanMult * 0.72) % 1;
        const t = s.t;
        const arcSwing = Math.sin(elapsed * 1.15 * fanMult) * 0.25 * t;

        const px = s.lane * (0.95 + t * 0.85 * s.spread) + Math.sin(t * 7 + s.swirl) * 0.09 * t;
        const py = 2.75 + Math.sin(t * Math.PI * 0.62) * 1.65 + (mode === 'heat' ? t * 0.35 : -t * t * 0.22);
        const pz = 0.24 + t * (1.85 * s.spread) + arcSwing;

        topAttr.setXYZ(i, px, py, pz);
      }
      topAttr.needsUpdate = true;

      // Rear Exhaust Plume (cool/heat rejection out rear duct at (-0.34, 1.06, -0.92))
      const showRear = mode === 'cool' || mode === 'heat' || mode === 'dry';
      this.rearPoints.visible = showRear;
      if (showRear) {
        this.rearParticleMat.color.set(rearColor);
        const rearAttr = this.rearPoints.geometry.getAttribute('position');
        for (let i = 0; i < this.rearParticleCount; i++) {
          const rs = this.rearSeeds[i];
          rs.t = (rs.t + dt * rs.speed * fanMult) % 1;
          const rt = rs.t;
          rearAttr.setXYZ(
            i,
            -0.34 + rs.ox * (1 + rt * 1.3),
            1.06 + rs.oy * (1 + rt * 1.2) + rt * 0.25,
            -0.92 - rt * 1.25
          );
        }
        rearAttr.needsUpdate = true;
      }
    }

    // 5. Project 3D Hotspots to 2D Canvas Viewport Coordinates
    if (this.hotspotPins && this.canvas) {
      const cw = this.canvas.clientWidth;
      const ch = this.canvas.clientHeight;
      const centerToCam = new THREE.Vector3()
        .subVectors(this.camera.position, new THREE.Vector3(0, 1.4, 0))
        .normalize();

      this.hotspotPins.forEach((hp) => {
        if (!hp.el) return;
        const projected = hp.vec.clone().project(this.camera);
        if (projected.z > 1) {
          hp.el.style.opacity = '0';
          hp.el.style.pointerEvents = 'none';
          return;
        }
        const x = (projected.x * 0.5 + 0.5) * cw;
        const y = (-projected.y * 0.5 + 0.5) * ch;

        // Check if hotspot is on the far side of the AC unit
        const anchorDir = new THREE.Vector3(hp.vec.x, Math.max(0, hp.vec.y - 1.5), hp.vec.z).normalize();
        const facing = anchorDir.dot(centerToCam);

        hp.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        hp.el.style.opacity = facing < -0.22 ? '0.28' : '1';
        hp.el.style.pointerEvents = 'auto';
      });
    }
  }
}
