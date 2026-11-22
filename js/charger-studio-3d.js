import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { getDevicePerfTier, destroyStudioRenderer } from './utils/webgl-memory.js';
import {
  createSolarTexture,
  createEnergyStream
} from './scene/textures-helpers.js';
import {
  CHARGER_STUDIO_TEXT,
  CHARGER_LEFT_SPECS,
  CHARGER_RIGHT_SPECS,
  CHARGER_CAMERA_PRESETS,
  CHARGER_HOTSPOTS
} from './data/charger-studio-data.js';

function roundRect(ctx, x, y, w, h, r) {
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

function createControlPanelTexture() {
  const canvas = document.createElement('canvas');
  // Match 0.38 x 2.22 (1 : 5.842) panel aspect ratio so square buttons stay 1:1 on the 3D mesh
  canvas.width = 260;
  canvas.height = 1520;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#070c16';
  ctx.fillRect(0, 0, 260, 1520);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 252, 1512);

  // Top Status Bar
  ctx.fillStyle = '#38bdf8';
  roundRect(ctx, 74, 86, 112, 12, 6);
  ctx.fill();

  // Glowing White Square QR Code Block
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 58, 150, 144, 144, 12);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  const qr = [
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
  const cell = 11;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (qr[r][c] === '1') {
        ctx.fillRect(75 + c * cell, 167 + r * cell, cell - 1, cell - 1);
      }
    }
  }

  ctx.fillStyle = '#7dd3fc';
  ctx.font = '800 17px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN QR · PIN 2026', 130, 330);

  // Compact Backlit Capacitive Numeric PIN Keypad (3x4 Grid of 46x46 px Square Buttons)
  ctx.fillStyle = '#0d1728';
  roundRect(ctx, 34, 370, 192, 256, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '✓']
  ];
  const btnSize = 46;
  const gapX = 12;
  const gapY = 12;
  const startX = 49;
  const startY = 390;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 22px Inter, Arial, sans-serif';
  keys.forEach((row, rIdx) => {
    row.forEach((k, cIdx) => {
      const bx = startX + cIdx * (btnSize + gapX);
      const by = startY + rIdx * (btnSize + gapY);
      ctx.fillStyle = k === '✓' ? '#064e3b' : k === '*' ? '#1e293b' : '#16243a';
      roundRect(ctx, bx, by, btnSize, btnSize, 10);
      ctx.fill();
      ctx.strokeStyle = k === '✓' ? '#10b981' : '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = k === '✓' ? '#34d399' : '#f8fafc';
      ctx.fillText(k, bx + btnSize * 0.5, by + btnSize * 0.52);
    });
  });

  // Compact Square-Proportioned NFC Contactless Reader Card
  ctx.fillStyle = '#0f1b2d';
  roundRect(ctx, 76, 668, 108, 76, 12);
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 24px Inter, Arial, sans-serif';
  ctx.fillText('((•))', 130, 706);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 14px Inter, Arial, sans-serif';
  ctx.fillText('NFC · RFID · OCPP', 130, 774);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createGridSubstationTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#071a3e';
  ctx.fillRect(0, 0, 512, 220);
  ctx.strokeStyle = '#ff5800';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 208);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6d1a';
  ctx.font = '900 38px Inter, Arial, sans-serif';
  ctx.fillText('EDF ENERGY · RÉSEAU', 256, 72);

  ctx.fillStyle = '#93c5fd';
  ctx.font = '800 25px Inter, Arial, sans-serif';
  ctx.fillText('POSTE 230/380V -> STATION', 256, 128);

  ctx.fillStyle = '#34d399';
  ctx.font = '700 20px Inter, Arial, sans-serif';
  ctx.fillText('CHARGE BORNE NA-ION 100 KWH', 256, 178);

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
  ctx.font = '900 50px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Na-ion 100 kWh', 256, 88);

  ctx.fillStyle = '#bae6fd';
  ctx.font = '700 28px Inter, Arial, sans-serif';
  ctx.fillText('500V SiC · 60 kW (120A)', 256, 146);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 21px Inter, Arial, sans-serif';
  ctx.fillText('ZERO-LITHIUM · -20°C TO +55°C', 256, 198);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWheelStopTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#111827';
    ctx.fillRect(i * 32, 0, 32, 32);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRoundedMonolithGeo(w, d, h, r) {
  const hw = w / 2;
  const hd = d / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw + r, -hd);
  s.lineTo(hw - r, -hd);
  s.quadraticCurveTo(hw, -hd, hw, -hd + r);
  s.lineTo(hw, hd - r);
  s.quadraticCurveTo(hw, hd, hw - r, hd);
  s.lineTo(-hw + r, hd);
  s.quadraticCurveTo(-hw, hd, -hw, hd - r);
  s.lineTo(-hw, -hd + r);
  s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: h,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 3
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function createParkedEvCoupe(headLightMats, tailLightMats) {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: '#0ea5e9',
    roughness: 0.16,
    metalness: 0.38,
    clearcoat: 0.9
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    roughness: 0.06,
    metalness: 0.72,
    clearcoat: 0.92
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

  // Illuminated EV Charge Port on driver-side front-left fender
  const portRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.085, 0.022, 8, 16),
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
    this.timeOfDay = 13.5; // 00:00 .. 24:00
    this.gridBackup = false;
    this.doorOpen = false;
    this.doorAnim = 0;
    this.connectedToEv = false;
    this.partialMode = false;
    this.gunAlarm = false;
    this.qrCodeIssued = false;
    this.xray = false;
    this.autoSpin = false;
    this.autoTime = false;
    this._lastUiStep = -1;
    this.tamperTimer = 0;
    this.qrScanFlash = 0;
    this.naionSoc = 84.0;
    this.activeCam = 'overview';
    this.rafId = null;
    this.lastTime = null;
    this.elapsed = 0;

    this.camTargetGoal = new THREE.Vector3(...CHARGER_CAMERA_PRESETS.overview.target);
    this.camPosGoal = new THREE.Vector3(...CHARGER_CAMERA_PRESETS.overview.pos);
    this.isLerpingCam = false;

    this.hotspotPins = [];
    this.circuits = {};
    this.outerShellMats = [];
    this.naionBarMats = [];
    this.coolingFans = [];
    this.carHeadMats = [];
    this.carTailMats = [];
    this.lampBulbMats = [];
    this.streetLights = [];
    this.cableNodes = [];
    this.cableSegs = [];
    this.doorGroup = null;
    this.deadboltPin = null;
    this.coiledCableGroup = null;
    this.dockedGunGroup = null;
    this.connectedGun = null;
    this.topLedMat = null;
    this.doorLedMat = null;
    this.holsterLight = null;
    this.vawtRotor = null;
    this.starsMat = null;
    this.sunOrb = null;
    this.moonOrb = null;
    this.plinthBorderMat = null;
    this.gridBeaconMat = null;
    this.composer = null;
    this.bloomPass = null;
    this.envRT = null;

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

  isDayTime() {
    return this.timeOfDay >= 6.0 && this.timeOfDay <= 19.0;
  }

  playAlarmChirp() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(920, now + i * 0.22);
        osc.frequency.linearRampToValueAtTime(620, now + i * 0.22 + 0.16);
        g.gain.setValueAtTime(0.08, now + i * 0.22);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.22 + 0.18);
        osc.connect(g).connect(ctx.destination);
        osc.start(now + i * 0.22);
        osc.stop(now + i * 0.22 + 0.19);
      }
      setTimeout(() => ctx.close().catch(() => {}), 900);
    } catch {
      // Audio blocked by browser policy
    }
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
            <button type="button" id="charger-btn-share" class="ac-cam-btn"></button>
            <button type="button" id="charger-btn-quote" class="ac-btn-primary"></button>
            <button type="button" id="charger-btn-close" class="ac-btn-close"></button>
          </div>
        </header>

        <div class="ac-studio-grid">
          <aside class="ac-specs-col left" id="charger-specs-left"></aside>

          <section class="ac-stage-center">
            <div class="home-telemetry-bar charger-sankey-bar">
              <div class="home-tele-pill solar">
                <span class="home-tele-lbl" id="charger-lbl-solar"></span>
                <strong id="charger-val-solar">68.5 kW</strong>
              </div>
              <div class="home-tele-pill battery">
                <span class="home-tele-lbl" id="charger-lbl-naion"></span>
                <strong id="charger-val-naion">84% · +8.5 kW</strong>
              </div>
              <div class="home-tele-pill grid">
                <span class="home-tele-lbl" id="charger-lbl-ev"></span>
                <strong id="charger-val-ev">0 kW (Locked)</strong>
              </div>
              <div class="home-tele-pill">
                <span class="home-tele-lbl" id="charger-lbl-door"></span>
                <strong id="charger-val-door">LOCKED (ARMORED)</strong>
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
              <button type="button" class="ac-cam-btn" data-ccam="renew" id="ccam-renew"></button>
              <button type="button" class="ac-cam-btn" id="charger-btn-spin"></button>
            </div>
          </section>

          <aside class="ac-specs-col right" id="charger-specs-right"></aside>
        </div>

        <footer class="ac-control-dock charger-dock-wrap">
          <div class="ac-dock-group charger-time-group">
            <label class="charger-time-lbl" for="charger-time-slider">
              <span id="charger-lbl-time"></span>:
              <strong id="charger-val-time">13:30</strong>
            </label>
            <input type="range" id="charger-time-slider" min="0" max="24" step="0.05" value="13.5" />
            <button type="button" class="ac-cam-btn" id="charger-btn-autotime"></button>
            <button type="button" class="ac-cam-btn" id="charger-btn-grid"></button>
          </div>
          <div class="ac-dock-group charger-security-group">
            <input type="text" id="charger-pin-input" class="charger-pin-input" maxlength="4" value="2026" aria-label="PIN Code" />
            <button type="button" class="ac-cam-btn" id="charger-btn-unlock"></button>
            <button type="button" class="ac-cam-btn" id="charger-btn-qr"></button>
            <button type="button" class="ac-cam-btn" id="charger-btn-connect"></button>
            <button type="button" class="ac-cam-btn" id="charger-btn-partial"></button>
            <button type="button" class="ac-cam-btn" id="charger-btn-xray"></button>
            <button type="button" class="ac-cam-btn charger-tamper-btn" id="charger-btn-tamper"></button>
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
    this.renderer.toneMappingExposure = 1.08;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#4a8fd4');
    this.scene.fog = new THREE.FogExp2('#4a8fd4', 0.015);

    // PMREM RoomEnvironment HDRI Reflections for Brushed Aluminum & Glass
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.15, 140);
    this.camera.position.set(...CHARGER_CAMERA_PRESETS.overview.pos);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 20.0;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.target.set(...CHARGER_CAMERA_PRESETS.overview.target);
    this.controls.addEventListener('start', () => {
      this.isLerpingCam = false;
    });

    this.ambientLight = new THREE.AmbientLight('#dbeafe', 0.45);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight('#e0f2fe', '#1e293b', 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#fff8eb', 2.4);
    this.sunLight.position.set(-7, 13, 9);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(perf.shadowMapSize, perf.shadowMapSize);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 42;
    const sd = 9.5;
    this.sunLight.shadow.camera.left = -sd;
    this.sunLight.shadow.camera.right = sd;
    this.sunLight.shadow.camera.top = sd;
    this.sunLight.shadow.camera.bottom = -sd;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 20, 20),
      new THREE.MeshBasicMaterial({ color: '#fef08a' })
    );
    this.scene.add(this.sunOrb);

    this.moonOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 18, 18),
      new THREE.MeshBasicMaterial({ color: '#e2e8f0' })
    );
    this.scene.add(this.moonOrb);

    // Night Starfield
    const starCount = 240;
    const sPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 0.75 + 0.2);
      const r = 38 + Math.random() * 12;
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

    // Bloom Post-Processing Composer
    const w = this.canvas.clientWidth || 640;
    const h = this.canvas.clientHeight || 420;
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.3, 0.45, 0.88);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  buildChargerDiorama() {
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    const brushedAluMat = new THREE.MeshPhysicalMaterial({
      color: '#dbe4ee',
      roughness: 0.22,
      metalness: 0.86,
      clearcoat: 0.45,
      transparent: true,
      opacity: 1.0
    });
    this.outerShellMats.push(brushedAluMat);

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.38,
      metalness: 0.72
    });
    const charcoalMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.58,
      metalness: 0.35
    });
    const smokedGlassMat = new THREE.MeshPhysicalMaterial({
      color: '#111827',
      transparent: true,
      opacity: 0.36,
      roughness: 0.04,
      metalness: 0.32,
      clearcoat: 1.0,
      reflectivity: 1.0,
      depthWrite: false
    });
    const concreteMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.8 });
    const asphaltMat = new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.88 });
    const meadowMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.88 });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
    const wheelStopMat = new THREE.MeshStandardMaterial({ map: createWheelStopTexture(), roughness: 0.55 });

    // -------------------------------------------------------------------------
    // 1. PARKING BAY, WHEEL STOPS & GARDEN BACKDROP
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

    const chargerPad = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 1.55), concreteMat);
    chargerPad.position.set(0, 0.12, 0);
    chargerPad.receiveShadow = true;
    this.rootGroup.add(chargerPad);

    [1.4, 4.5].forEach((lx) => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 4.4), whiteLineMat);
      stripe.position.set(lx, 0.095, 1.1);
      this.rootGroup.add(stripe);
    });
    const wheelStop = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.1, 0.18), wheelStopMat);
    wheelStop.position.set(2.95, 0.13, -1.05);
    wheelStop.castShadow = true;
    this.rootGroup.add(wheelStop);

    // -------------------------------------------------------------------------
    // 2. NEO® SAFECHAGE X1 MONOLITH + X-RAY INTERNAL ARCHITECTURE
    // -------------------------------------------------------------------------
    const towerGroup = new THREE.Group();
    towerGroup.position.set(0, 0.18, 0);

    // Matte Black Heavy-Duty Plinth Base
    const plinth = new THREE.Mesh(createRoundedMonolithGeo(1.26, 0.94, 0.22, 0.16), charcoalMat);
    plinth.castShadow = true;
    towerGroup.add(plinth);

    // Brushed Anodized Aluminum Outer Shell (transparent in X-Ray mode)
    const leftShell = new THREE.Mesh(createRoundedMonolithGeo(0.22, 0.92, 2.38, 0.09), brushedAluMat);
    leftShell.position.set(-0.52, 0.22, 0);
    leftShell.castShadow = true;
    towerGroup.add(leftShell);

    const rightShell = new THREE.Mesh(createRoundedMonolithGeo(0.22, 0.92, 2.38, 0.09), brushedAluMat);
    rightShell.position.set(0.52, 0.22, 0);
    rightShell.castShadow = true;
    towerGroup.add(rightShell);

    const rearShell = new THREE.Mesh(new THREE.BoxGeometry(0.88, 2.38, 0.08), brushedAluMat);
    rearShell.position.set(0, 1.41, -0.41);
    towerGroup.add(rearShell);

    // Side Cooling Louver Vents
    [-0.635, 0.635].forEach((lx) => {
      for (let i = 0; i < 6; i++) {
        const louver = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.032, 0.22), charcoalMat);
        louver.position.set(lx, 1.96 + i * 0.075, -0.06);
        towerGroup.add(louver);
      }
    });

    // Top Crown & Wrap-Around Recessed LED Status Beacon
    const topCap = new THREE.Mesh(createRoundedMonolithGeo(1.22, 0.9, 0.12, 0.15), brushedAluMat);
    topCap.position.y = 2.66;
    topCap.castShadow = true;
    towerGroup.add(topCap);

    this.topLedMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    const topLed = new THREE.Mesh(createRoundedMonolithGeo(1.25, 0.93, 0.065, 0.15), this.topLedMat);
    topLed.position.y = 2.58;
    towerGroup.add(topLed);

    // INTERNAL ARCHITECTURE (Visible when X-Ray mode is active!)
    // 2A. Bottom/Rear Rack: 100 kWh Sodium-Ion (Na-ion) Pack + Busbars + BMS LEDs + 2 Cooling Fans
    const naionTex = createNaionBadgeTexture();
    const naionHeader = new THREE.Mesh(
      new THREE.PlaneGeometry(0.76, 0.36),
      new THREE.MeshStandardMaterial({
        map: naionTex,
        emissiveMap: naionTex,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.6
      })
    );
    naionHeader.position.set(0, 1.24, -0.34);
    naionHeader.rotation.y = Math.PI;
    towerGroup.add(naionHeader);

    for (let m = 0; m < 3; m++) {
      const modBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.24, 0.34),
        new THREE.MeshStandardMaterial({ color: '#0f293a', roughness: 0.35, metalness: 0.55 })
      );
      modBox.position.set(0, 0.4 + m * 0.28, -0.15);
      towerGroup.add(modBox);

      const barMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
      this.naionBarMats.push(barMat);
      const bmsLed = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.055, 0.03), barMat);
      bmsLed.position.set(0, 0.4 + m * 0.28, -0.33);
      towerGroup.add(bmsLed);
    }

    // Copper & Silver Busbars
    const copperMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.22, metalness: 0.88 });
    [-0.28, 0.28].forEach((bx) => {
      const busbar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.28, 0.04), copperMat);
      busbar.position.set(bx, 1.0, -0.02);
      towerGroup.add(busbar);
    });

    // Dual Active Cooling Fans
    [-0.22, 0.22].forEach((fx) => {
      const fanHub = new THREE.Group();
      fanHub.position.set(fx, 0.96, 0.05);
      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.015), darkMetalMat);
        blade.rotation.z = (b * Math.PI) / 4;
        fanHub.add(blade);
      }
      towerGroup.add(fanHub);
      this.coolingFans.push(fanHub);
    });

    // 2B. Middle Section: 500V 60kW SiC Bidirectional Inverter + MPPT Controllers + Electromagnetic Deadbolt
    const sicBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.52, 0.32),
      new THREE.MeshStandardMaterial({ color: '#0e7490', roughness: 0.3, metalness: 0.65 })
    );
    sicBox.position.set(0, 1.72, -0.15);
    towerGroup.add(sicBox);

    const mpptBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.32, 0.28),
      new THREE.MeshStandardMaterial({ color: '#047857', roughness: 0.35, metalness: 0.55 })
    );
    mpptBox.position.set(0, 2.22, -0.15);
    towerGroup.add(mpptBox);

    // Motorized Electromagnetic Deadbolt Latch Pin (retracts when door unlocks!)
    const latchHousing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.14), darkMetalMat);
    latchHousing.position.set(0.36, 1.48, 0.36);
    towerGroup.add(latchHousing);
    this.deadboltPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.18, 10),
      new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.85, roughness: 0.2 })
    );
    this.deadboltPin.rotation.z = Math.PI / 2;
    this.deadboltPin.position.set(0.45, 1.48, 0.38);
    towerGroup.add(this.deadboltPin);

    // Recessed Front Cable Chamber + Illuminated Holster + Coiled Cable
    const chamberFloor = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.34), charcoalMat);
    chamberFloor.position.set(0, 0.24, 0.25);
    towerGroup.add(chamberFloor);

    const chamberBack = new THREE.Mesh(new THREE.BoxGeometry(0.86, 2.26, 0.05), charcoalMat);
    chamberBack.position.set(0, 1.38, 0.06);
    towerGroup.add(chamberBack);

    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.16), darkMetalMat);
    holster.position.set(0.2, 1.72, 0.16);
    towerGroup.add(holster);

    this.holsterLight = new THREE.PointLight('#10b981', 0.8, 2.2);
    this.holsterLight.position.set(0.2, 1.72, 0.34);
    towerGroup.add(this.holsterLight);

    // Docked CCS2 Liquid-Cooled Charging Gun
    this.dockedGunGroup = new THREE.Group();
    this.dockedGunGroup.position.set(0.2, 1.62, 0.24);
    const gunHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.34, 0.12),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.28 })
    );
    gunHandle.rotation.x = 0.22;
    this.dockedGunGroup.add(gunHandle);
    const gunNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 10), charcoalMat);
    gunNozzle.rotation.x = Math.PI / 2;
    gunNozzle.position.set(0, 0.12, -0.06);
    this.dockedGunGroup.add(gunNozzle);
    towerGroup.add(this.dockedGunGroup);

    // Coiled Copper Cable inside Chamber
    this.coiledCableGroup = new THREE.Group();
    const blackCableMat = new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.52 });
    for (let loop = 0; loop < 3; loop++) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.23 + loop * 0.025, 0.028, 10, 26), blackCableMat);
      coil.scale.set(0.75, 1.85, 1.0);
      coil.position.set(0.18, 1.04 - loop * 0.02, 0.21 + loop * 0.02);
      this.coiledCableGroup.add(coil);
    }
    towerGroup.add(this.coiledCableGroup);

    // 2C. Fixed Left Smart Access Panel (QR + PIN 0-9 + NFC) + Front Linear Tracks + Motorized Right Glass Hatch
    const ctrlTex = createControlPanelTexture();
    const ctrlPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 2.22, 0.03),
      new THREE.MeshStandardMaterial({
        map: ctrlTex,
        emissiveMap: ctrlTex,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.46,
        roughness: 0.16
      })
    );
    ctrlPanel.position.set(-0.25, 1.38, 0.442);
    towerGroup.add(ctrlPanel);

    this.doorLedMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    const doorLed = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.04), this.doorLedMat);
    doorLed.position.set(-0.25, 2.32, 0.45);
    towerGroup.add(doorLed);

    // Top & Bottom Precision Brushed-Metal Linear Slide Tracks (keeps hatch outside cabinet)
    const trackTop = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.032, 0.055), darkMetalMat);
    trackTop.position.set(0.0, 2.525, 0.458);
    towerGroup.add(trackTop);
    const trackBot = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.032, 0.055), darkMetalMat);
    trackBot.position.set(0.0, 0.235, 0.458);
    towerGroup.add(trackBot);

    // Motorized Right Armored Smoked-Glass Hatch (steps forward +Z, then glides left -X in front of ctrlPanel)
    this.doorGroup = new THREE.Group();
    this.doorGroup.position.set(0.20, 1.38, 0.455);

    const dFrameTop = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.05, 0.045), darkMetalMat);
    dFrameTop.position.set(0, 1.13, 0);
    this.doorGroup.add(dFrameTop);
    const dFrameBot = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.05, 0.045), darkMetalMat);
    dFrameBot.position.set(0, -1.13, 0);
    this.doorGroup.add(dFrameBot);
    const dFrameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.30, 0.045), darkMetalMat);
    dFrameLeft.position.set(-0.25, 0, 0);
    this.doorGroup.add(dFrameLeft);
    const dFrameRight = new THREE.Mesh(new THREE.BoxGeometry(0.045, 2.30, 0.045), darkMetalMat);
    dFrameRight.position.set(0.25, 0, 0);
    this.doorGroup.add(dFrameRight);
    const grabHandle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.38, 0.065), darkMetalMat);
    grabHandle.position.set(0.22, -0.05, 0.035);
    this.doorGroup.add(grabHandle);

    const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.46, 2.20, 0.028), smokedGlassMat);
    doorGlass.position.set(0, 0, 0.005);
    doorGlass.renderOrder = 2;
    this.doorGroup.add(doorGlass);

    towerGroup.add(this.doorGroup);
    this.rootGroup.add(towerGroup);

    // -------------------------------------------------------------------------
    // 3. VERLET PHYSICS ROPE CABLE & CONNECTED CCS2 GUN
    // -------------------------------------------------------------------------
    const nodeCount = 14;
    const pStart = new THREE.Vector3(0.22, 1.48, 0.35);
    const pEnd = new THREE.Vector3(2.16, 0.72, 0.65);
    for (let i = 0; i < nodeCount; i++) {
      const p = new THREE.Vector3().lerpVectors(pStart, pEnd, i / (nodeCount - 1));
      p.y -= Math.sin((i / (nodeCount - 1)) * Math.PI) * 0.75;
      this.cableNodes.push({ pos: p.clone(), oldPos: p.clone() });
    }
    const segGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8);
    const verletCableMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      emissive: new THREE.Color('#0284c7'),
      emissiveIntensity: 0.35,
      roughness: 0.35
    });
    for (let i = 0; i < nodeCount - 1; i++) {
      const seg = new THREE.Mesh(segGeo, verletCableMat);
      seg.visible = false;
      this.rootGroup.add(seg);
      this.cableSegs.push(seg);
    }

    this.connectedGun = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.12, 0.14),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25 })
    );
    this.connectedGun.position.copy(pEnd);
    this.connectedGun.visible = false;
    this.rootGroup.add(this.connectedGun);

    // -------------------------------------------------------------------------
    // 4. PARKED EV COUPE + SOLAR PV + VERTICAL-AXIS WIND TURBINE (VAWT) + GRID
    // -------------------------------------------------------------------------
    const evCar = createParkedEvCoupe(this.carHeadMats, this.carTailMats);
    evCar.position.set(2.95, 0.09, 0.55);
    this.rootGroup.add(evCar);

    const solarTex = createSolarTexture();
    const solarMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.2,
      metalness: 0.68,
      emissive: new THREE.Color('#0a2957'),
      emissiveIntensity: 0.24
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.35, metalness: 0.6 });
    const trussSteelMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.38, metalness: 0.78 });
    const padConcreteMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.85, metalness: 0.12 });

    // Rigid Engineered Steel Solar Truss & Anchored Base Pads (Zero Sagging/Floating)
    const solarRackGroup = new THREE.Group();
    const trussXs = [-5.25, -3.86, -2.38, -0.98];
    trussXs.forEach((tx) => {
      // Front & rear base anchor pads seated solidly on ground platform (y = 0.08)
      [-2.46, -3.24].forEach((pz) => {
        const anchorPad = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.28), padConcreteMat);
        anchorPad.position.set(tx, 0.14, pz);
        anchorPad.castShadow = true;
        anchorPad.receiveShadow = true;
        solarRackGroup.add(anchorPad);
      });

      // Straight vertical front steel I-column (y: 0.14 .. 0.80)
      const frontCol = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.66, 0.08), trussSteelMat);
      frontCol.position.set(tx, 0.47, -2.46);
      frontCol.castShadow = true;
      solarRackGroup.add(frontCol);

      // Straight vertical rear steel I-column (y: 0.14 .. 1.20)
      const rearCol = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.06, 0.08), trussSteelMat);
      rearCol.position.set(tx, 0.67, -3.24);
      rearCol.castShadow = true;
      solarRackGroup.add(rearCol);

      // Straight inclined steel rafter beam spanning front column top to rear column top
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 1.02), brushedAluMat);
      rafter.position.set(tx, 0.99, -2.85);
      rafter.rotation.x = 0.45;
      rafter.castShadow = true;
      solarRackGroup.add(rafter);

      // Rigid diagonal cross-brace strut
      const diagBrace = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.88), trussSteelMat);
      diagBrace.position.set(tx, 0.64, -2.85);
      diagBrace.rotation.x = 0.58;
      diagBrace.castShadow = true;
      solarRackGroup.add(diagBrace);
    });

    // Continuous Straight Horizontal Front & Rear Longitudinal Steel Purlin Beams
    const frontPurlin = new THREE.Mesh(new THREE.BoxGeometry(4.46, 0.075, 0.075), trussSteelMat);
    frontPurlin.position.set(-3.12, 0.78, -2.48);
    frontPurlin.castShadow = true;
    solarRackGroup.add(frontPurlin);

    const rearPurlin = new THREE.Mesh(new THREE.BoxGeometry(4.46, 0.075, 0.075), trussSteelMat);
    rearPurlin.position.set(-3.12, 1.15, -3.22);
    rearPurlin.castShadow = true;
    solarRackGroup.add(rearPurlin);

    // 3 Photovoltaic Panels seated flush directly onto the rigid tilted rafters
    [-4.6, -3.12, -1.64].forEach((sx) => {
      const panelHolder = new THREE.Group();
      panelHolder.position.set(sx, 1.03, -2.85);
      panelHolder.rotation.x = 0.45;

      const pvFrame = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 1.06), frameMat);
      pvFrame.castShadow = true;
      pvFrame.receiveShadow = true;
      panelHolder.add(pvFrame);

      const pvSurface = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.07, 0.98), solarMat);
      pvSurface.position.y = 0.012;
      panelHolder.add(pvSurface);

      solarRackGroup.add(panelHolder);
    });
    this.rootGroup.add(solarRackGroup);

    // Sleek Vertical-Axis Wind Turbine (VAWT Helical Darrieus Rotor)
    const vawtGroup = new THREE.Group();
    vawtGroup.position.set(-5.4, 0.12, -4.0);
    const vawtMast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 4.3, 14), brushedAluMat);
    vawtMast.position.y = 2.15;
    vawtMast.castShadow = true;
    vawtGroup.add(vawtMast);

    this.vawtRotor = new THREE.Group();
    this.vawtRotor.position.y = 3.25;
    const vawtBladeMat = new THREE.MeshPhysicalMaterial({
      color: '#f8fafc',
      roughness: 0.22,
      metalness: 0.35,
      clearcoat: 0.6
    });
    for (let b = 0; b < 3; b++) {
      const arm = new THREE.Group();
      arm.rotation.y = (b * Math.PI * 2) / 3;
      const foil = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.75, 0.22), vawtBladeMat);
      foil.position.set(0.68, 0, 0);
      foil.rotation.z = 0.22;
      foil.castShadow = true;
      arm.add(foil);

      [-0.65, 0.65].forEach((sy) => {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.04, 0.06), darkMetalMat);
        strut.position.set(0.34, sy, 0);
        arm.add(strut);
      });
      this.vawtRotor.add(arm);
    }
    vawtGroup.add(this.vawtRotor);
    this.rootGroup.add(vawtGroup);

    // Roadside EDF Energy Power Pole / Mini Transmission Pylon + EDF Box + Streetlight
    const edfPoleGroup = new THREE.Group();
    edfPoleGroup.position.set(4.6, 0.12, -4.9);
    const edfPoleBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.46), padConcreteMat);
    edfPoleBase.position.y = 0.08;
    edfPoleGroup.add(edfPoleBase);
    const edfPoleShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 4.3, 12), trussSteelMat);
    edfPoleShaft.position.y = 2.15;
    edfPoleShaft.castShadow = true;
    edfPoleGroup.add(edfPoleShaft);

    // Cross-arms & Cyan Ceramic Insulators
    [3.75, 4.18].forEach((cy) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, 0.07), brushedAluMat);
      arm.position.y = cy;
      edfPoleGroup.add(arm);
      [-0.44, 0.0, 0.44].forEach((ix) => {
        const ins = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.045, 0.14, 8),
          new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.25 })
        );
        ins.position.set(ix, cy + 0.09, 0);
        edfPoleGroup.add(ins);
      });
    });
    const edfPoleBadge = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.28, 0.06),
      new THREE.MeshBasicMaterial({ color: '#ff5800' })
    );
    edfPoleBadge.position.set(0, 2.3, 0.12);
    edfPoleGroup.add(edfPoleBadge);
    this.rootGroup.add(edfPoleGroup);

    // EDF Energy Transformer Box (Repositioned behind charger, separate from EV bay)
    const gridCab = new THREE.Group();
    gridCab.position.set(2.1, 0.12, -3.6);
    const gPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.14, 1.04), padConcreteMat);
    gPlinth.position.y = 0.07;
    gPlinth.receiveShadow = true;
    gridCab.add(gPlinth);

    const gBody = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.48, 0.86), darkMetalMat);
    gBody.position.y = 0.88;
    gBody.castShadow = true;
    gridCab.add(gBody);

    // Side Transformer Cooling Fins
    [-0.61, 0.61].forEach((fx) => {
      for (let f = 0; f < 5; f++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 0.06), brushedAluMat);
        fin.position.set(fx, 0.78, -0.24 + f * 0.12);
        gridCab.add(fin);
      }
    });

    // Glowing "EDF ENERGY · RÉSEAU / POSTE 230/380V -> STATION" Front Signage Header
    const gridTex = createGridSubstationTexture();
    const gridSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.06, 0.46),
      new THREE.MeshStandardMaterial({
        map: gridTex,
        emissiveMap: gridTex,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.72,
        roughness: 0.2
      })
    );
    gridSign.position.set(0, 1.24, 0.44);
    gridCab.add(gridSign);

    const gStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.08, 0.04),
      new THREE.MeshBasicMaterial({ color: '#ff5800' })
    );
    gStripe.position.set(0, 0.88, 0.44);
    gridCab.add(gStripe);

    this.gridBeaconMat = new THREE.MeshBasicMaterial({ color: '#ff5800' });
    const gBeacon = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.07, 0.82), this.gridBeaconMat);
    gBeacon.position.y = 1.66;
    gridCab.add(gBeacon);

    this.rootGroup.add(gridCab);

    // Physical Armored Trench + Rear AC Input Receiver Port on Back of SafeCharge X1 Station
    const trenchMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.55, metalness: 0.6 });
    const trenchAcross = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 0.18), trenchMat);
    trenchAcross.position.set(1.05, 0.14, -3.6);
    this.rootGroup.add(trenchAcross);
    const trenchToCharger = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 3.2), trenchMat);
    trenchToCharger.position.set(0.0, 0.14, -2.02);
    this.rootGroup.add(trenchToCharger);
    const rearAcPort = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.12), darkMetalMat);
    rearAcPort.position.set(0.0, 0.55, -0.44);
    this.rootGroup.add(rearAcPort);

    const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 8), darkMetalMat);
    lampPole.position.set(-1.55, 1.9, -1.65);
    lampPole.castShadow = true;
    this.rootGroup.add(lampPole);
    const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.85), darkMetalMat);
    lampArm.position.set(-1.55, 3.65, -1.25);
    this.rootGroup.add(lampArm);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: '#fef08a',
      emissive: new THREE.Color('#fbbf24'),
      emissiveIntensity: 0.1
    });
    this.lampBulbMats.push(bulbMat);
    const bulbHead = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.2), bulbMat);
    bulbHead.position.set(-1.55, 3.58, -0.9);
    this.rootGroup.add(bulbHead);

    const streetLight = new THREE.PointLight('#fde68a', 0, 14);
    streetLight.position.set(-1.55, 3.4, -0.9);
    this.rootGroup.add(streetLight);
    this.streetLights.push(streetLight);

    // Garden Shrubs
    const bushMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.82 });
    [-2.4, -0.8, 0.8, 2.3, 5.9, -6.2].forEach((bx, idx) => {
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + (idx % 2) * 0.14, 1), bushMat);
      bush.scale.set(1.2, 0.85, 1.0);
      bush.position.set(bx, 0.45, -4.4);
      bush.castShadow = true;
      this.rootGroup.add(bush);
    });

    // -------------------------------------------------------------------------
    // 5. ANIMATED 3D ENERGY CONDUITS (Rigid Ground Trench Paths + Charger Rise)
    // -------------------------------------------------------------------------
    this.circuits.solarToMppt = createEnergyStream(
      [
        new THREE.Vector3(-1.64, 0.78, -2.48),
        new THREE.Vector3(-1.64, 0.14, -2.48),
        new THREE.Vector3(-0.2, 0.14, -0.36),
        new THREE.Vector3(-0.2, 2.1, -0.2)
      ],
      '#facc15',
      6,
      0.048
    );
    this.rootGroup.add(this.circuits.solarToMppt.group);

    this.circuits.windToMppt = createEnergyStream(
      [
        new THREE.Vector3(-5.4, 3.2, -4.0),
        new THREE.Vector3(-5.4, 0.14, -4.0),
        new THREE.Vector3(-0.35, 0.14, -0.38),
        new THREE.Vector3(-0.2, 2.1, -0.2)
      ],
      '#10b981',
      7,
      0.048
    );
    this.rootGroup.add(this.circuits.windToMppt.group);

    this.circuits.naionToSic = createEnergyStream(
      [
        new THREE.Vector3(0.0, 0.72, -0.15),
        new THREE.Vector3(0.0, 1.32, -0.15),
        new THREE.Vector3(0.0, 1.78, -0.15)
      ],
      '#34d399',
      5,
      0.044
    );
    this.rootGroup.add(this.circuits.naionToSic.group);

    this.circuits.poleToEdfBox = createEnergyStream(
      [
        new THREE.Vector3(4.6, 3.9, -4.9),
        new THREE.Vector3(4.6, 1.4, -4.9),
        new THREE.Vector3(2.65, 1.15, -3.6)
      ],
      '#fb923c',
      6,
      0.044
    );
    this.rootGroup.add(this.circuits.poleToEdfBox.group);

    this.circuits.gridToSic = createEnergyStream(
      [
        new THREE.Vector3(1.55, 0.65, -3.6),
        new THREE.Vector3(0.0, 0.22, -3.6),
        new THREE.Vector3(0.0, 0.22, -0.46),
        new THREE.Vector3(0.0, 1.45, -0.25)
      ],
      '#f59e0b',
      8,
      0.052
    );
    this.rootGroup.add(this.circuits.gridToSic.group);

    this.circuits.chargerToEv = createEnergyStream(
      [
        new THREE.Vector3(0.22, 1.48, 0.35),
        new THREE.Vector3(0.75, 0.72, 0.65),
        new THREE.Vector3(1.45, 0.32, 0.78),
        new THREE.Vector3(2.16, 0.72, 0.65)
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
    this.modal.querySelector('#charger-btn-share')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const shareUrl = `${window.location.origin}${window.location.pathname}#charger-studio`;
      navigator.clipboard?.writeText(shareUrl).catch(() => {});
      btn.textContent = this.t('shareCopied');
      btn.classList.add('active');
      setTimeout(() => {
        btn.textContent = this.t('shareBtn');
        btn.classList.remove('active');
      }, 2000);
    });
    this.modal.querySelector('#charger-btn-quote')?.addEventListener('click', () => {
      this.close();
      if (this.onRequestQuote) this.onRequestQuote();
    });

    this.modal.querySelectorAll('[data-ccam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.focusCamera(btn.getAttribute('data-ccam'));
      });
    });

    const slider = this.modal.querySelector('#charger-time-slider');
    slider?.addEventListener('input', (e) => {
      this.timeOfDay = parseFloat(e.target.value);
      this.syncTelemetryAndUI();
    });

    this.modal.querySelector('#charger-btn-autotime')?.addEventListener('click', () => {
      this.autoTime = !this.autoTime;
      this.syncTelemetryAndUI();
    });

    this.modal.querySelector('#charger-btn-grid')?.addEventListener('click', () => {
      this.gridBackup = !this.gridBackup;
      this.syncTelemetryAndUI();
    });

    this.modal.querySelector('#charger-btn-partial')?.addEventListener('click', () => {
      this.partialMode = !this.partialMode;
      this.naionSoc = this.partialMode ? 48.0 : 84.0;
      this.syncTelemetryAndUI();
    });

    this.modal.querySelector('#charger-btn-unlock')?.addEventListener('click', () => {
      const pinVal = this.modal.querySelector('#charger-pin-input')?.value?.trim();
      if (this.doorOpen) {
        if (this.connectedToEv) {
          // Alarm if user tries to close protective hatch without returning charging gun!
          this.gunAlarm = true;
          this.tamperTimer = 3.2;
          this.playAlarmChirp();
          this.syncTelemetryAndUI();
        } else {
          this.lockDoor();
        }
      } else if (pinVal === '2026') {
        this.unlockDoor(false);
      } else {
        this.triggerTamper();
      }
    });

    this.modal.querySelector('#charger-btn-qr')?.addEventListener('click', () => {
      this.qrScanFlash = 1.4;
      const pinInput = this.modal.querySelector('#charger-pin-input');
      if (pinInput) pinInput.value = '2026';
      this.unlockDoor(true);
    });

    this.modal.querySelector('#charger-btn-connect')?.addEventListener('click', () => {
      if (this.connectedToEv) {
        // Return gun to holster & auto-close protective door
        this.returnGunAndClose();
      } else {
        if (!this.doorOpen) {
          this.unlockDoor(false);
        }
        this.setEvConnected(true);
      }
    });

    this.modal.querySelector('#charger-btn-tamper')?.addEventListener('click', () => {
      this.triggerTamper();
    });

    this.modal.querySelector('#charger-btn-xray')?.addEventListener('click', () => {
      this.xray = !this.xray;
      this.syncTelemetryAndUI();
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

  unlockDoor(fromQr = false) {
    this.doorOpen = true;
    this.tamperTimer = 0;
    this.gunAlarm = false;
    this.qrCodeIssued = fromQr;
    if (fromQr) this.qrScanFlash = 1.4;
    this.syncTelemetryAndUI();
  }

  lockDoor() {
    this.setEvConnected(false);
    this.doorOpen = false;
    this.gunAlarm = false;
    this.qrCodeIssued = false;
    this.syncTelemetryAndUI();
  }

  returnGunAndClose() {
    this.setEvConnected(false);
    this.doorOpen = false;
    this.gunAlarm = false;
    this.tamperTimer = 0;
    this.qrCodeIssued = false;
    this.syncTelemetryAndUI();
  }

  setEvConnected(state) {
    this.connectedToEv = state;
    if (!state) this.gunAlarm = false;
    if (this.coiledCableGroup) this.coiledCableGroup.visible = !state;
    if (this.dockedGunGroup) this.dockedGunGroup.visible = !state;
    if (this.connectedGun) this.connectedGun.visible = state;
    this.cableSegs.forEach((s) => {
      s.visible = state;
    });
    this.syncTelemetryAndUI();
  }

  triggerTamper() {
    if (this.doorOpen && !this.connectedToEv) this.lockDoor();
    this.gunAlarm = false;
    this.tamperTimer = 3.2;
    this.playAlarmChirp();
    this.syncTelemetryAndUI();
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
      this.syncTelemetryAndUI();
    }
  }

  syncTelemetryAndUI() {
    const isDay = this.isDayTime();
    const isAlert = this.tamperTimer > 0;
    const isCharging = this.connectedToEv;

    const clampedTod = Math.max(0, Math.min(24, this.timeOfDay));
    const totalMins = Math.round(clampedTod * 60);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const timeStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    const setText = (id, val) => {
      const el = this.modal.querySelector(`#${id}`);
      if (el) el.textContent = val;
    };
    setText('charger-val-time', timeStr);

    const solarCurve = isDay ? Math.sin(((this.timeOfDay - 6.0) / 13.0) * Math.PI) : 0;
    const solarKw = isDay ? Math.max(0, solarCurve * 54.0) : 0.0;
    const windKw = isDay ? 14.5 : 0.0;
    const totalRenew = solarKw + windKw;
    const evKw = isCharging ? 60.0 : 0.0;
    const edfKw = !isDay ? (this.gridBackup ? 60.0 : isCharging ? 45.0 : 24.0) : 0.0;

    setText(
      'charger-val-solar',
      isDay ? `☀️ ${totalRenew.toFixed(1)} kW (Solar+Wind)` : `🌙 EDF: ${edfKw.toFixed(0)} kW -> Station`
    );
    const socFlow = isDay
      ? `+${Math.max(4.5, totalRenew - evKw).toFixed(1)} kW (Solar)`
      : isCharging && !this.gridBackup
        ? '-15 kW -> EV'
        : '+24 kW (EDF)';
    setText('charger-val-naion', `${Math.round(this.naionSoc)}% · ${socFlow}`);
    setText('charger-val-ev', isCharging ? '60 kW · 500 Vdc' : '0 kW (Standby)');
    setText(
      'charger-val-door',
      this.t(
        isAlert
          ? 'doorAlarmTxt'
          : isCharging
            ? 'doorChargingTxt'
            : this.doorOpen
              ? 'doorUnlockedTxt'
              : this.partialMode
                ? 'doorPartialTxt'
                : 'doorLockedTxt'
      )
    );

    const autoBtn = this.modal.querySelector('#charger-btn-autotime');
    if (autoBtn) {
      autoBtn.textContent = this.t(this.autoTime ? 'autoTimePauseBtn' : 'autoTimePlayBtn');
      autoBtn.classList.toggle('active', this.autoTime);
    }

    const unlockBtn = this.modal.querySelector('#charger-btn-unlock');
    if (unlockBtn) {
      unlockBtn.textContent = this.t(this.doorOpen ? 'lockBtn' : 'pinUnlockBtn');
      unlockBtn.classList.toggle('active', this.doorOpen);
    }
    const connectBtn = this.modal.querySelector('#charger-btn-connect');
    if (connectBtn) {
      connectBtn.textContent = this.t(this.connectedToEv ? 'disconnectEvBtn' : 'connectEvBtn');
      connectBtn.classList.toggle('active', this.connectedToEv);
    }
    this.modal.querySelector('#charger-btn-grid')?.classList.toggle('active', this.gridBackup);
    this.modal.querySelector('#charger-btn-partial')?.classList.toggle('active', this.partialMode);
    this.modal.querySelector('#charger-btn-xray')?.classList.toggle('active', this.xray);

    const statusKey = isAlert
      ? this.gunAlarm
        ? 'gunNotReturnedTxt'
        : 'tamperAlertTxt'
      : this.qrCodeIssued && this.doorOpen && !isCharging
        ? 'qrCodeIssuedTxt'
        : this.partialMode
          ? 'partialModeTxt'
          : isDay
            ? 'modeStatusDay'
            : this.gridBackup
              ? 'modeStatusNightGrid'
              : 'modeStatusNightBat';
    setText('charger-live-status', this.t(statusKey));

    const banner = this.modal.querySelector('#charger-live-banner');
    if (banner) {
      banner.classList.remove('heat', 'battery', 'grid');
      if (isAlert) banner.classList.add('heat');
      else if (!isDay && !this.gridBackup) banner.classList.add('battery');
      else if (!isDay && this.gridBackup) banner.classList.add('grid');
    }

    this.modal.setAttribute(
      'data-thermal-mode',
      isDay ? 'day' : this.gridBackup ? 'night-grid' : 'night-bat'
    );
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
    setText('charger-btn-share', 'shareBtn');
    setText('charger-btn-quote', 'requestQuote');
    setText('charger-btn-close', 'closeBtn');
    setText('charger-lbl-solar', 'telemetrySolarWind');
    setText('charger-lbl-naion', 'telemetryNaion');
    setText('charger-lbl-ev', 'telemetryEv');
    setText('charger-lbl-door', 'telemetryDoor');
    setText('charger-lbl-time', 'timeLabel');
    setText('charger-leg-renew', 'legendRenew');
    setText('charger-leg-naion', 'legendNaion');
    setText('charger-leg-ev', 'legendEv');
    setText('charger-leg-grid', 'legendGrid');
    setText('ccam-overview', 'camOverview');
    setText('ccam-door', 'camDoor');
    setText('ccam-naion', 'camNaion');
    setText('ccam-renew', 'camRenew');
    setText('charger-btn-spin', 'autoSpin');
    setText('charger-btn-xray', 'xrayBtn');
    setText('charger-btn-qr', 'qrScanBtn');
    setText('charger-btn-partial', 'partialBtn');
    setText('charger-btn-tamper', 'tamperBtn');
    setText('charger-btn-grid', 'gridBackupBtn');

    const pinInput = this.modal.querySelector('#charger-pin-input');
    if (pinInput) pinInput.placeholder = this.t('pinPlaceholder');

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
    this.syncTelemetryAndUI();

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
    this.composer?.setSize(w, h);
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.modal.hidden = false;
    document.body.classList.add('ac-studio-open');
    document.body.style.overflow = 'hidden';

    this.initScene();
    this.syncLanguage();
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
      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer?.render(this.scene, this.camera);
      }
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
    this.outerShellMats = [];
    this.naionBarMats = [];
    this.coolingFans = [];
    this.carHeadMats = [];
    this.carTailMats = [];
    this.lampBulbMats = [];
    this.streetLights = [];
    this.cableNodes = [];
    this.cableSegs = [];
    this.doorGroup = null;
    this.deadboltPin = null;
    this.coiledCableGroup = null;
    this.dockedGunGroup = null;
    this.connectedGun = null;
    this.topLedMat = null;
    this.doorLedMat = null;
    this.holsterLight = null;
    this.vawtRotor = null;
    this.gridBeaconMat = null;
    this.envRT?.dispose();
    this.envRT = null;
    this.composer?.dispose();
    this.composer = null;
    this.bloomPass = null;

    destroyStudioRenderer(this);
    this.onClose?.();
  }

  updateCableVerlet(dt, elapsed) {
    if (!this.connectedToEv || !this.cableNodes.length) return;
    const n = this.cableNodes.length;
    const restLen = 0.215;

    for (let i = 1; i < n - 1; i++) {
      const node = this.cableNodes[i];
      const vx = (node.pos.x - node.oldPos.x) * 0.96;
      const vy = (node.pos.y - node.oldPos.y) * 0.96;
      const vz = (node.pos.z - node.oldPos.z) * 0.96;
      node.oldPos.copy(node.pos);
      node.pos.x += vx + Math.sin(elapsed * 2.1 + i * 0.4) * 0.0005;
      node.pos.y += vy - 12.0 * dt * dt;
      node.pos.z += vz;
      if (node.pos.y < 0.16) node.pos.y = 0.16;
    }

    this.cableNodes[0].pos.set(0.22, 1.48, 0.35);
    this.cableNodes[n - 1].pos.set(2.16, 0.72, 0.65);

    for (let iter = 0; iter < 6; iter++) {
      for (let i = 0; i < n - 1; i++) {
        const a = this.cableNodes[i].pos;
        const b = this.cableNodes[i + 1].pos;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
        const diff = (dist - restLen) / dist;
        if (i > 0) {
          a.x += dx * 0.5 * diff;
          a.y += dy * 0.5 * diff;
          a.z += dz * 0.5 * diff;
        }
        if (i + 1 < n - 1) {
          b.x -= dx * 0.5 * diff;
          b.y -= dy * 0.5 * diff;
          b.z -= dz * 0.5 * diff;
        }
      }
    }

    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    for (let i = 0; i < n - 1; i++) {
      const a = this.cableNodes[i].pos;
      const b = this.cableNodes[i + 1].pos;
      const seg = this.cableSegs[i];
      if (!seg) continue;
      seg.position.addVectors(a, b).multiplyScalar(0.5);
      dir.subVectors(b, a);
      const len = dir.length();
      seg.scale.set(1, Math.max(0.01, len), 1);
      seg.quaternion.setFromUnitVectors(up, dir.normalize());
    }
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

    // 1. 24-Hour Time-of-Day Auto/Manual Cycle (00:00 -> 24:00), Sky, Sun/Moon Arc & Streetlight Physics
    if (this.autoTime) {
      this.timeOfDay += dt * 1.5;
      if (this.timeOfDay > 24) this.timeOfDay -= 24;
      const sliderEl = this.modal?.querySelector('#charger-time-slider');
      if (sliderEl) sliderEl.value = this.timeOfDay.toFixed(2);
      const step5m = Math.floor(this.timeOfDay * 12);
      if (step5m !== this._lastUiStep) {
        this._lastUiStep = step5m;
        this.syncTelemetryAndUI();
      }
    }
    const isDay = this.isDayTime();
    const sunProg = isDay ? (this.timeOfDay - 6.0) / 13.0 : 0.5;
    const sunAngle = sunProg * Math.PI;
    const sunX = -Math.cos(sunAngle) * 14;
    const sunY = Math.max(2.5, Math.sin(sunAngle) * 13);

    const nightHours = this.timeOfDay >= 19.0 ? this.timeOfDay - 19.0 : this.timeOfDay + 5.0;
    const nightProg = Math.min(1, Math.max(0, nightHours / 11.0));
    const moonAngle = nightProg * Math.PI;
    const moonX = -Math.cos(moonAngle) * 13;
    const moonY = Math.max(2.8, Math.sin(moonAngle) * 11.5);

    const targetSky = !isDay
      ? this.gridBackup
        ? '#0f1322'
        : '#061526'
      : this.timeOfDay < 8.5 || this.timeOfDay > 16.5
        ? '#5b4b75'
        : '#4a8fd4';
    this.scene.background.lerp(new THREE.Color(targetSky), 1 - Math.exp(-4 * dt));
    if (this.scene.fog) this.scene.fog.color.copy(this.scene.background);

    if (this.sunLight) {
      this.sunLight.position.set(isDay ? sunX : moonX, isDay ? sunY : moonY, isDay ? 8 : -6);
      this.sunLight.intensity = isDay ? 2.4 : 0.48;
      this.sunLight.color.set(
        !isDay ? '#93c5fd' : this.timeOfDay < 8.5 || this.timeOfDay > 16.5 ? '#ffae70' : '#fff8eb'
      );
    }
    if (this.sunOrb) {
      this.sunOrb.visible = isDay;
      this.sunOrb.position.set(sunX, sunY, -14);
    }
    if (this.moonOrb) {
      this.moonOrb.visible = !isDay;
      this.moonOrb.position.set(moonX, moonY, -14);
    }
    if (this.starsMat) this.starsMat.opacity = isDay ? 0.0 : 0.88;
    this.hemiLight.intensity = isDay ? 0.95 : 0.42;
    this.ambientLight.intensity = isDay ? 0.45 : 0.3;

    const nightGlow = isDay ? 0.08 : 1.0;
    this.lampBulbMats.forEach((m) => (m.emissiveIntensity = nightGlow * 2.5));
    this.streetLights.forEach((l) => (l.intensity = isDay ? 0 : 2.8));
    this.carHeadMats.forEach((m) => (m.emissiveIntensity = 0.15 + nightGlow * 2.2));
    this.carTailMats.forEach((m) => (m.emissiveIntensity = 0.2 + nightGlow * 1.9));

    // 2. Tamper / Gun-Return Alarm Countdown, 2-Stage Front-Rail Hatch & Deadbolt
    if (this.tamperTimer > 0) {
      this.tamperTimer = Math.max(0, this.tamperTimer - dt);
      if (this.tamperTimer === 0) {
        this.gunAlarm = false;
        this.syncTelemetryAndUI();
      }
    }
    if (this.qrScanFlash > 0) {
      this.qrScanFlash = Math.max(0, this.qrScanFlash - dt);
    }

    const targetDoorAnim = this.doorOpen ? 1.0 : 0.0;
    this.doorAnim += (targetDoorAnim - this.doorAnim) * Math.min(1, dt * 6.5);
    if (this.doorGroup) {
      const camOut = Math.min(1, this.doorAnim / 0.28);
      const slideRaw = Math.max(0, (this.doorAnim - 0.28) / 0.72);
      const slide = slideRaw * slideRaw * (3 - 2 * slideRaw);
      const shake = this.tamperTimer > 2.4 ? Math.sin(elapsed * 55) * 0.022 : 0;
      this.doorGroup.position.x = 0.20 - slide * 0.45 + shake;
      this.doorGroup.position.z = 0.455 + camOut * 0.06;
    }
    if (this.deadboltPin) {
      const targetPinX = this.doorOpen ? 0.34 : 0.45;
      this.deadboltPin.position.x += (targetPinX - this.deadboltPin.position.x) * Math.min(1, dt * 10.0);
    }

    // 3. Top Status Lamp (Green = Available, Orange = Partial >=40 kWh, Red = Unavailable/Alarm)
    if (this.topLedMat) {
      if (this.tamperTimer > 0 || this.gunAlarm) {
        this.topLedMat.color.setHex(Math.sin(elapsed * 18) > 0 ? 0xff2a4b : 0x450a0a);
      } else if (this.partialMode) {
        this.topLedMat.color.set('#f59e0b');
      } else if (this.qrScanFlash > 0) {
        this.topLedMat.color.set('#38bdf8');
      } else if (this.connectedToEv) {
        const pulse = 0.55 + 0.45 * Math.sin(elapsed * 5.0);
        this.topLedMat.color.setRGB(0.06 + pulse * 0.08, 0.72 + pulse * 0.28, 0.55 + pulse * 0.35);
      } else {
        this.topLedMat.color.set('#10b981');
      }
    }
    if (this.doorLedMat) {
      this.doorLedMat.color.set(
        this.tamperTimer > 0 || this.gunAlarm
          ? '#ef4444'
          : this.partialMode
            ? '#f59e0b'
            : this.doorOpen
              ? '#38bdf8'
              : '#10b981'
      );
    }

    // 4. X-Ray Outer Shell Transparency + Active Cooling Fans + VAWT Wind Turbine
    const targetShellOp = this.xray ? 0.16 : 1.0;
    this.outerShellMats.forEach((m) => {
      m.opacity += (targetShellOp - m.opacity) * Math.min(1, dt * 6.5);
    });
    this.coolingFans.forEach((f, idx) => {
      f.rotation.z -= (this.connectedToEv ? 9.5 : 3.2) * dt * (idx === 0 ? 1 : -1);
    });
    if (this.vawtRotor) {
      this.vawtRotor.rotation.y += (isDay ? 2.8 : 1.2) * dt;
    }
    this.naionBarMats.forEach((bm, idx) => {
      const pulse = 0.65 + 0.35 * Math.sin(elapsed * 4 - idx * 0.6);
      bm.color.set(!isDay && idx === 2 && pulse > 0.72 ? '#38bdf8' : '#10b981');
    });

    // 5. Verlet Cable Physics & Animated Energy Streams
    this.updateCableVerlet(dt, elapsed);

    const animStream = (stream, active, speed) => {
      if (!stream) return;
      stream.tubeMat.opacity = active ? 0.52 : 0.04;
      stream.beads.forEach((b) => {
        b.mesh.visible = active;
        if (!active) return;
        const u = (b.offset + elapsed * speed) % 1;
        stream.curve.getPointAt(u, b.mesh.position);
      });
    };

    animStream(this.circuits.solarToMppt, isDay, 0.45);
    animStream(this.circuits.windToMppt, isDay, 0.42);
    animStream(this.circuits.naionToSic, true, isDay ? 0.32 : 0.48);
    animStream(this.circuits.poleToEdfBox, !isDay, this.gridBackup ? 0.58 : 0.42);
    animStream(this.circuits.gridToSic, !isDay, this.gridBackup ? 0.58 : 0.42);
    animStream(this.circuits.chargerToEv, this.connectedToEv, 0.58);

    if (this.gridBeaconMat) {
      if (!isDay) {
        const pulse = 0.65 + 0.35 * Math.sin(elapsed * 4.5);
        this.gridBeaconMat.color.setRGB(0.95 * pulse, 0.62 * pulse, 0.08 * pulse);
      } else {
        this.gridBeaconMat.color.set('#334155');
      }
    }

    // 6. Floating 3D Callouts (Translucent by default via CSS, glow on :hover)
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
        hp.el.style.opacity = '';
        hp.el.style.pointerEvents = 'auto';
      });
    }
  }
}
