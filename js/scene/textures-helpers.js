import * as THREE from 'three';

/**
 * Creates a crisp procedural photovoltaic solar panel texture with grid cells & silver busbars.
 */
export function createSolarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#0a2558');
  grad.addColorStop(0.5, '#15448f');
  grad.addColorStop(1, '#0b214a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(148, 220, 255, 0.5)';
  ctx.lineWidth = 2;
  const cols = 4;
  const rows = 6;
  const cw = 256 / cols;
  const ch = 256 / rows;

  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cw, 0);
    ctx.lineTo(c * cw, 256);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * ch);
    ctx.lineTo(256, r * ch);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(215, 240, 255, 0.22)';
  ctx.lineWidth = 1;
  for (let c = 0; c < cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cw + cw * 0.5, 0);
    ctx.lineTo(c * cw + cw * 0.5, 256);
    ctx.stroke();
  }

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 248);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const DIORAMA_FACADE_PALETTES = {
  'midnight-tower': {
    wall: '#1b263b',
    band: '#24344d',
    mullion: '#0f172a',
    paneDark: '#263850',
    paneMid: '#334e6e',
    litColors: ['#ffd166', '#f4a261', '#fef3c7', '#7dd3fc'],
    cols: 4,
    rows: 10,
    litThreshold: 0.22,
    lintels: false
  },
  'terracotta-brick': {
    wall: '#6e2f3c',
    band: '#853c4a',
    mullion: '#3a1a22',
    paneDark: '#3f2a36',
    paneMid: '#523442',
    litColors: ['#ffb703', '#fde68a', '#fb923c', '#ffedd5'],
    cols: 4,
    rows: 8,
    litThreshold: 0.16,
    lintels: true
  },
  'purple-modern': {
    wall: '#3f3759',
    band: '#4f466e',
    mullion: '#221d33',
    paneDark: '#2d2845',
    paneMid: '#3e385e',
    litColors: ['#fde047', '#38bdf8', '#fb7185', '#fef08a'],
    cols: 4,
    rows: 10,
    litThreshold: 0.18,
    lintels: false
  },
  'lavender-bistro': {
    wall: '#524b6b',
    band: '#655d82',
    mullion: '#2c273d',
    paneDark: '#332f47',
    paneMid: '#443e5e',
    litColors: ['#fde68a', '#facc15', '#5eead4', '#fb7185'],
    cols: 4,
    rows: 7,
    litThreshold: 0.14,
    lintels: true
  },
  'emerald-eco': {
    wall: '#1f3a42',
    band: '#294c57',
    mullion: '#102227',
    paneDark: '#24454f',
    paneMid: '#2e5763',
    litColors: ['#ffd166', '#6ee7b7', '#93c5fd', '#fef3c7'],
    cols: 4,
    rows: 9,
    litThreshold: 0.2,
    lintels: false
  }
};

/**
 * Generates crisp multi-palette voxel/diorama facade color & emissive window maps.
 */
export function createDioramaWindowTextures(paletteKey = 'midnight-tower') {
  const cfg = DIORAMA_FACADE_PALETTES[paletteKey] || DIORAMA_FACADE_PALETTES['midnight-tower'];
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = 256;
  colorCanvas.height = 512;
  const cCtx = colorCanvas.getContext('2d');

  const emitCanvas = document.createElement('canvas');
  emitCanvas.width = 256;
  emitCanvas.height = 512;
  const eCtx = emitCanvas.getContext('2d');

  cCtx.fillStyle = cfg.wall;
  cCtx.fillRect(0, 0, 256, 512);
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, 256, 512);

  const cols = cfg.cols;
  const rows = cfg.rows;
  const padX = 14;
  const padY = 14;
  const w = (256 - padX * (cols + 1)) / cols;
  const h = (512 - padY * (rows + 1)) / rows;

  // Subtle architectural spandrel bands between floors
  for (let r = 0; r < rows; r++) {
    const bandY = padY + r * (h + padY) - padY * 0.45;
    cCtx.fillStyle = cfg.band;
    cCtx.fillRect(0, Math.max(0, bandY), 256, 4);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * (w + padX);
      const y = padY + r * (h + padY);
      const litSeed = Math.sin(r * 17.7 + c * 9.3 + cols * 2.1) * 0.5 + 0.5;
      const colorIdx = Math.abs(r * 3 + c * 5) % cfg.litColors.length;

      // Window frame & optional lintel
      cCtx.fillStyle = cfg.mullion;
      cCtx.fillRect(x - 3, y - 3, w + 6, h + 6);
      if (cfg.lintels) {
        cCtx.fillStyle = cfg.band;
        cCtx.fillRect(x - 4, y - 5, w + 8, 3);
      }

      // Daytime reflective dark glass pane
      cCtx.fillStyle = litSeed > 0.35 ? cfg.paneMid : cfg.paneDark;
      cCtx.fillRect(x, y, w, h);

      // Highlight reflection slash for crisp day look
      cCtx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      cCtx.fillRect(x + 2, y + 2, Math.max(3, w * 0.25), h - 4);

      if (litSeed > cfg.litThreshold) {
        eCtx.fillStyle = cfg.litColors[colorIdx];
        eCtx.fillRect(x + 1, y + 1, w - 2, h - 2);
      }
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const emissiveMap = new THREE.CanvasTexture(emitCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.anisotropy = 4;

  return { map, emissiveMap };
}

/**
 * Returns default diorama window maps plus a full map of all 5 architectural palettes.
 */
export function createMaquetteWindowTextures() {
  const palettes = {};
  Object.keys(DIORAMA_FACADE_PALETTES).forEach((key) => {
    palettes[key] = createDioramaWindowTextures(key);
  });
  return {
    ...palettes['midnight-tower'],
    palettes
  };
}

/**
 * Creates a crisp blue [C] charging/hub badge texture.
 */
export function createBadgeTexture(letter = 'C', bg = '#2563eb') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 112, 112);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 78px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 64, 67);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates the illuminated fascia sign texture for the Solar EV Charging Station ("Neo Bornes de recharge").
 */
export function createStationSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');

  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 220);
  bgGrad.addColorStop(0, '#06182c');
  bgGrad.addColorStop(0.5, '#0c2d48');
  bgGrad.addColorStop(1, '#06182c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 220);

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 1008, 204);

  // Circular EV charging badge on left
  const cx = 112;
  const cy = 110;
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(cx, cy, 64, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#06182c';
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fill();

  // White lightning bolt polygon
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy - 30);
  ctx.lineTo(cx - 18, cy + 4);
  ctx.lineTo(cx - 2, cy + 4);
  ctx.lineTo(cx - 8, cy + 30);
  ctx.lineTo(cx + 18, cy - 4);
  ctx.lineTo(cx + 2, cy - 4);
  ctx.closePath();
  ctx.fill();

  // Main headline: Neo Bornes de recharge
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 60px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Neo Bornes de recharge', 575, 76);

  // Highlighted emerald subtitle pill
  ctx.fillStyle = '#10b981';
  ctx.fillRect(250, 128, 650, 56);
  ctx.fillStyle = '#031810';
  ctx.font = '800 30px Inter, Arial, sans-serif';
  ctx.fillText('SMART-CITY-LED.COM · SOLAR EV HUB', 575, 157);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Helper to draw the NEO Clim snowflake-pin logo onto any Canvas 2D context.
 */
function drawNeoClimPinLogo(ctx, cx, cy, r) {
  // Navy outer circle pin
  ctx.fillStyle = '#0e2847';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // White inner circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2);
  ctx.fill();

  // Snowflake spokes
  ctx.strokeStyle = '#0e2847';
  ctx.lineWidth = Math.max(2, r * 0.085);
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const x1 = cx + Math.cos(a) * r * 0.5;
    const y1 = cy + Math.sin(a) * r * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  // Curved cyan arrow arc around bottom-right
  ctx.strokeStyle = '#0ea5e9';
  ctx.lineWidth = Math.max(3, r * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.94, 0.18 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Orange dot at bottom tip
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.98, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Creates the illuminated billboard texture for the Smart-City-Led.com · NEO CLIM® Flagship Store.
 */
export function createStoreSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 256);
  bgGrad.addColorStop(0, '#07152b');
  bgGrad.addColorStop(0.5, '#0d264c');
  bgGrad.addColorStop(1, '#07152b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 1004, 236);

  // Draw NEO Clim snowflake pin badge on left
  drawNeoClimPinLogo(ctx, 132, 128, 68);

  // Top headline: SMART-CITY-LED.COM
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 64px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SMART-CITY-LED.COM', 585, 86);

  // Highlighted pill: NEO CLIM® · LOCATION & SOLAIRE A+++
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(265, 146, 650, 68);
  ctx.fillStyle = '#041426';
  ctx.font = '800 35px Inter, Arial, sans-serif';
  ctx.fillText('NEO CLIM® · SOLAR & MOBILE AC', 590, 181);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Creates the showroom window poster matching the user's NEO Clim Location graphic.
 */
export function createNeoClimPosterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  // Clean frosty-white background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, 768);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(0.75, '#f0f7fc');
  bg.addColorStop(1, '#dfeff9');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 768);

  // Soft cyan border
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 752);

  // Top snowflake pin logo
  drawNeoClimPinLogo(ctx, 256, 86, 52);

  // Brand title: NEO / Clim Location
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0e2847';
  ctx.font = '900 44px Inter, Arial, sans-serif';
  ctx.fillText('NEO', 256, 168);

  ctx.font = '800 26px Inter, Arial, sans-serif';
  ctx.fillStyle = '#0ea5e9';
  ctx.fillText('Clim', 188, 202);
  ctx.fillStyle = '#0e2847';
  ctx.fillText('Location', 284, 202);

  // ICI point location climatisation Premium mobile
  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 46px Inter, Arial, sans-serif';
  ctx.fillText('ICI', 256, 256);

  ctx.fillStyle = '#0e2847';
  ctx.font = '800 32px Inter, Arial, sans-serif';
  ctx.fillText('point location', 256, 302);
  ctx.fillText('climatisation', 256, 342);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 34px Inter, Arial, sans-serif';
  ctx.fillText('Premium mobile', 256, 386);

  // Cool blue side airflow waves behind AC unit
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  [-1, 1].forEach((dir) => {
    for (let w = 0; w < 2; w++) {
      ctx.beginPath();
      ctx.moveTo(256 + dir * 70, 520 + w * 44);
      ctx.quadraticCurveTo(256 + dir * 150, 490 + w * 44, 256 + dir * 215, 530 + w * 44);
      ctx.stroke();
    }
  });

  // Portable White Vertical AC Illustration
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(178, 434, 156, 232);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(182, 438, 148, 224);
  // Top black digital vent panel
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(186, 442, 140, 26);
  // Subtle front emblem
  ctx.fillStyle = '#334155';
  ctx.fillRect(250, 496, 12, 8);
  // 4 black caster wheels
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(194, 666, 16, 12);
  ctx.fillRect(302, 666, 16, 12);

  // Cozy cat silhouette on right (faithful nod to uploaded graphic)
  ctx.fillStyle = '#d6c7b2';
  ctx.beginPath();
  ctx.ellipse(412, 650, 38, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(388, 624, 16, 0, Math.PI * 2);
  ctx.fill();

  // Bottom bar: Demander à la réception
  ctx.fillStyle = 'rgba(186, 230, 253, 0.8)';
  ctx.fillRect(46, 696, 420, 44);
  ctx.fillStyle = '#0e2847';
  ctx.font = '700 22px Inter, Arial, sans-serif';
  ctx.fillText('Demander à la réception', 256, 719);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Helper to create a tilted solar panel assembly.
 */
export function createSolarPanelMesh(width, depth, tiltRad, solarMat, frameMat) {
  const group = new THREE.Group();
  const panelGroup = new THREE.Group();
  panelGroup.rotation.x = tiltRad;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.1, 0.08, depth + 0.1),
    frameMat
  );
  frame.castShadow = true;
  panelGroup.add(frame);

  const surface = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.09, depth),
    solarMat
  );
  surface.position.y = 0.015;
  panelGroup.add(surface);

  group.add(panelGroup);
  return { group, panelGroup };
}

/**
 * Creates a circular architectural rooftop HVAC fan unit.
 */
export function createRooftopFanUnit(whiteMat, rimMat, radius = 0.52) {
  const fan = new THREE.Group();
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 2.2, 0.28, radius * 2.2),
    whiteMat
  );
  housing.position.y = 0.14;
  housing.castShadow = true;
  fan.add(housing);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.72, 0.07, 8, 20),
    rimMat
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.3;
  fan.add(ring);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.24, radius * 0.24, 0.12, 12),
    rimMat
  );
  hub.position.y = 0.28;
  fan.add(hub);

  return fan;
}

/**
 * Creates a sleek vertical white portable NEO Clim® mobile air conditioner
 * matching the uploaded poster (4 caster wheels, black top vent/panel, icy-blue air waves).
 */
export function createMobileAcUnitMesh(scale = 1) {
  const unit = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.28, metalness: 0.12 });
  const trimMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.35 });
  const darkPanelMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.3, metalness: 0.4 });
  const ledMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });

  // Vertical rounded-profile white cabinet
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.72, 0.86), bodyMat);
  body.position.y = 0.98;
  body.castShadow = true;
  unit.add(body);

  // Side bevel shadow reveal
  const sideRecess = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.45, 0.7), trimMat);
  sideRecess.position.y = 0.96;
  unit.add(sideRecess);

  // Black recessed top digital display + air louver vent
  const topPanel = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.14, 0.74), darkPanelMat);
  topPanel.position.set(0, 1.82, 0.02);
  unit.add(topPanel);

  // Glowing cyan digital indicator dots on top panel
  const ledDot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.08), ledMat);
  ledDot.position.set(0, 1.88, 0.25);
  unit.add(ledDot);

  // 7 subtle upper-front horizontal accent ribs matching TCL MZ silhouette
  for (let r = 0; r < 7; r++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.018, 0.03), trimMat);
    rib.position.set(0, 1.56 + r * 0.032, 0.432);
    unit.add(rib);
  }

  // Dark square IR sensor window on front center
  const logoBadge = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.085, 0.04), darkPanelMat);
  logoBadge.position.set(0, 1.38, 0.44);
  unit.add(logoBadge);

  // 4 Black Caster Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.09, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  [
    [-0.4, 0.085, 0.3],
    [0.4, 0.085, 0.3],
    [-0.4, 0.085, -0.3],
    [0.4, 0.085, -0.3]
  ].forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, darkPanelMat);
    wheel.position.set(wx, wy, wz);
    unit.add(wheel);
  });

  // Animated icy-blue cool airflow ribbons streaming to both sides
  const waves = [];
  [-1, 1].forEach((dir) => {
    [0.95, 1.32].forEach((wy) => {
      const waveCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(dir * 0.56, wy, 0.1),
        new THREE.Vector3(dir * 1.15, wy + 0.14, 0.15),
        new THREE.Vector3(dir * 1.75, wy - 0.08, 0.1)
      ]);
      const waveMat = new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.65
      });
      const waveMesh = new THREE.Mesh(new THREE.TubeGeometry(waveCurve, 18, 0.045, 6, false), waveMat);
      unit.add(waveMesh);
      waves.push({ mesh: waveMesh, mat: waveMat, phase: wy + dir });
    });
  });

  unit.scale.setScalar(scale);
  return { unit, waves };
}

/**
 * Helper to create an animated energy conduit (glowing tube + moving pulse beads).
 */
export function createEnergyStream(points, colorHex, beadCount = 6, tubeRadius = 0.055) {
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeo = new THREE.TubeGeometry(curve, 36, tubeRadius, 8, false);
  const tubeMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.28
  });
  const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);

  const group = new THREE.Group();
  group.add(tubeMesh);

  const beadGeo = new THREE.SphereGeometry(tubeRadius * 2.15, 10, 10);
  const beadMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.95
  });

  const beads = [];
  for (let i = 0; i < beadCount; i++) {
    const bead = new THREE.Mesh(beadGeo, beadMat);
    group.add(bead);
    beads.push({
      mesh: bead,
      offset: i / beadCount
    });
  }

  return { group, curve, tubeMat, beadMat, beads };
}

/**
 * Creates a stepped 3D voxel cloud cluster from overlapping blocks.
 */
export function createVoxelCloudCluster(cloudMat, scale = 1) {
  const cloud = new THREE.Group();
  const blocks = [
    [0, 0.25, 0, 2.2, 0.9, 1.4],
    [-1.1, 0.05, 0.15, 1.3, 0.65, 1.1],
    [1.15, 0.1, -0.1, 1.4, 0.72, 1.15],
    [-0.35, 0.75, 0.05, 1.25, 0.68, 1.0],
    [0.45, 0.65, -0.05, 1.0, 0.58, 0.9],
    [0.05, -0.1, 0.45, 1.6, 0.5, 0.8]
  ];
  blocks.forEach(([bx, by, bz, bw, bh, bd]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), cloudMat);
    mesh.position.set(bx, by, bz);
    cloud.add(mesh);
  });
  cloud.scale.setScalar(scale);
  return cloud;
}

/**
 * Creates a stylized blocky 3D voxel crescent moon matching the isometric diorama aesthetic.
 */
export function createVoxelCrescentMoon() {
  const moon = new THREE.Group();
  const moonMat = new THREE.MeshBasicMaterial({ color: '#e2ecff' });
  const glowMat = new THREE.MeshBasicMaterial({ color: '#93c5fd', transparent: true, opacity: 0.45 });

  // Pixel-grid crescent coordinates [gridX, gridY, size]
  const voxels = [
    [0.4, 1.6], [1.2, 1.6],
    [-0.4, 0.8], [0.4, 0.8],
    [-0.8, 0.0], [0.0, 0.0],
    [-0.4, -0.8], [0.4, -0.8],
    [0.4, -1.6], [1.2, -1.6]
  ];
  const cubeGeo = new THREE.BoxGeometry(0.86, 0.86, 0.86);
  voxels.forEach(([vx, vy]) => {
    const cube = new THREE.Mesh(cubeGeo, moonMat);
    cube.position.set(vx, vy, 0);
    moon.add(cube);
  });

  const halo = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.8, 0.35), glowMat);
  halo.position.set(0.15, 0, -0.3);
  moon.add(halo);

  return moon;
}

/**
 * Builds a stepped voxel tree with stone planter, timber trunk, and layered green cubic canopy.
 */
export function createVoxelTree(scale = 1, variant = 0) {
  const tree = new THREE.Group();
  const planterMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#6b4423', roughness: 0.85 });
  const greens = ['#15803d', '#16a34a', '#22c55e', '#4ade80'];
  const leafDark = new THREE.MeshStandardMaterial({ color: greens[variant % 2], roughness: 0.78 });
  const leafBright = new THREE.MeshStandardMaterial({ color: greens[(variant % 2) + 2], roughness: 0.72 });

  const planter = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.9), planterMat);
  planter.position.y = 0.11;
  tree.add(planter);

  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.32), trunkMat);
  trunk.position.y = 0.68;
  trunk.castShadow = true;
  tree.add(trunk);

  if (variant % 2 === 0) {
    // Stepped broadleaf voxel crown
    const tier1 = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.65, 1.45), leafDark);
    tier1.position.y = 1.35;
    tier1.castShadow = true;
    tree.add(tier1);

    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.62, 1.15), leafBright);
    tier2.position.set(0.06, 1.85, -0.04);
    tier2.castShadow = true;
    tree.add(tier2);

    const tier3 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.7), leafBright);
    tier3.position.set(-0.08, 2.3, 0.06);
    tree.add(tier3);
  } else {
    // Stepped conifer / cypress voxel tiers
    const tier1 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.55, 1.3), leafDark);
    tier1.position.y = 1.25;
    tier1.castShadow = true;
    tree.add(tier1);

    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 1.0), leafBright);
    tier2.position.y = 1.75;
    tier2.castShadow = true;
    tree.add(tier2);

    const tier3 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.52, 0.7), leafDark);
    tier3.position.y = 2.22;
    tree.add(tier3);

    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.4, 0.38), leafBright);
    tip.position.y = 2.62;
    tree.add(tip);
  }

  tree.scale.setScalar(scale);
  return tree;
}

/**
 * Builds a stylized diorama vehicle ('car', 'taxi', 'bus', or 'truck'; local front is +Z).
 */
export function createStylizedVehicle(bodyColor, typeOrIsBus = false, lightMats = null) {
  const type = typeof typeOrIsBus === 'string' ? typeOrIsBus : typeOrIsBus ? 'bus' : 'car';
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.28,
    metalness: 0.35
  });
  const roofWhiteMat = new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.32,
    metalness: 0.2
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.12,
    metalness: 0.85
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.85 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.75, roughness: 0.25 });

  const headMat = new THREE.MeshStandardMaterial({
    color: '#fffbeb',
    emissive: new THREE.Color('#fde68a'),
    emissiveIntensity: 0.35
  });
  headMat.userData = { dayIntensity: 0.2, nightIntensity: 2.6 };

  const tailMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    emissive: new THREE.Color('#ef4444'),
    emissiveIntensity: 0.4
  });
  tailMat.userData = { dayIntensity: 0.25, nightIntensity: 2.2 };

  if (lightMats) {
    lightMats.push(headMat, tailMat);
  }

  let w = 1.44;
  let len = 3.05;
  let wheelOffX = 0.68;

  if (type === 'bus') {
    w = 1.62;
    len = 4.45;
    wheelOffX = 0.76;

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(w, 0.88, len), bodyMat);
    lowerBody.position.y = 0.66;
    lowerBody.castShadow = true;
    group.add(lowerBody);

    const upperRoof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.34, len * 0.94), roofWhiteMat);
    upperRoof.position.y = 1.62;
    upperRoof.castShadow = true;
    group.add(upperRoof);

    // Rooftop HVAC & battery pod
    const roofPod = new THREE.Mesh(new THREE.BoxGeometry(w * 0.62, 0.16, len * 0.42), roofWhiteMat);
    roofPod.position.set(0, 1.85, -0.2);
    group.add(roofPod);

    // Warm glowing passenger window band
    const winEmitMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      emissive: new THREE.Color('#ffd166'),
      emissiveIntensity: 0.2,
      roughness: 0.18,
      metalness: 0.45
    });
    winEmitMat.userData = { dayIntensity: 0.08, nightIntensity: 1.75 };
    if (lightMats) lightMats.push(winEmitMat);

    const windowBand = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, 0.52, len * 0.86), winEmitMat);
    windowBand.position.set(0, 1.24, 0.04);
    group.add(windowBand);

    // Front route brow display
    const routeSign = new THREE.Mesh(new THREE.BoxGeometry(w * 0.65, 0.16, 0.08), headMat);
    routeSign.position.set(0, 1.56, len * 0.48);
    group.add(routeSign);
  } else if (type === 'truck') {
    w = 1.58;
    len = 4.15;
    wheelOffX = 0.74;

    // Chassis rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.24, len * 0.94), tireMat);
    rail.position.y = 0.34;
    group.add(rail);

    // Forward cab (crimson red or passed color)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 1.15, 1.35), bodyMat);
    cab.position.set(0, 0.98, len * 0.3);
    cab.castShadow = true;
    group.add(cab);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(w * 0.84, 0.48, 0.1), glassMat);
    windshield.position.set(0, 1.18, len * 0.3 + 0.66);
    group.add(windshield);

    // Crisp white insulated cargo container
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 1.48, len * 0.6), roofWhiteMat);
    cargo.position.set(0, 1.16, -len * 0.19);
    cargo.castShadow = true;
    group.add(cargo);

    const cargoStripe = new THREE.Mesh(new THREE.BoxGeometry(w * 1.04, 0.14, len * 0.58), bodyMat);
    cargoStripe.position.set(0, 0.62, -len * 0.19);
    group.add(cargoStripe);
  } else {
    // 'car' or 'taxi'
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(w, 0.46, len), bodyMat);
    chassis.position.y = 0.44;
    chassis.castShadow = true;
    group.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.84, 0.42, len * 0.54), glassMat);
    cabin.position.set(0, 0.84, -0.1);
    cabin.castShadow = true;
    group.add(cabin);

    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.08, len * 0.44), bodyMat);
    roofCap.position.set(0, 1.06, -0.12);
    group.add(roofCap);

    if (type === 'taxi') {
      const taxiMat = new THREE.MeshStandardMaterial({
        color: '#fef08a',
        emissive: new THREE.Color('#facc15'),
        emissiveIntensity: 0.6
      });
      taxiMat.userData = { dayIntensity: 0.35, nightIntensity: 2.2 };
      if (lightMats) lightMats.push(taxiMat);

      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.24), taxiMat);
      taxiSign.position.set(0, 1.18, -0.05);
      group.add(taxiSign);
    }
  }

  // Dual Front Headlights (+Z) & Rear Taillights (-Z)
  [-w * 0.34, w * 0.34].forEach((lx) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.08), headMat);
    hl.position.set(lx, 0.46, len * 0.5);
    group.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.13, 0.08), tailMat);
    tl.position.set(lx, 0.48, -len * 0.5);
    group.add(tl);
  });

  // Wheels with silver rims
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.2, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.22, 8);
  rimGeo.rotateZ(Math.PI / 2);
  const zOff = len * 0.31;
  [
    [-wheelOffX, 0.24, zOff],
    [wheelOffX, 0.24, zOff],
    [-wheelOffX, 0.24, -zOff],
    [wheelOffX, 0.24, -zOff]
  ].forEach(([wx, wy, wz]) => {
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.position.set(wx, wy, wz);
    group.add(tire);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(wx, wy, wz);
    group.add(rim);
  });

  return group;
}

/**
 * Builds a miniature colorful pedestrian for lively maquette sidewalks.
 */
export function createPedestrian(shirtColor) {
  const ped = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65 });
  const headMat = new THREE.MeshStandardMaterial({ color: '#f3d2b3', roughness: 0.7 });
  const legsMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 });

  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.36, 8), legsMat);
  legs.position.y = 0.18;
  ped.add(legs);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.36, 8), bodyMat);
  torso.position.y = 0.52;
  torso.castShadow = true;
  ped.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), headMat);
  head.position.y = 0.81;
  ped.add(head);

  return ped;
}
