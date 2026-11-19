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

/**
 * Creates crisp architectural white-maquette window textures (soft cool slate by day, warm golden glow by night).
 */
export function createMaquetteWindowTextures() {
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = 256;
  colorCanvas.height = 512;
  const cCtx = colorCanvas.getContext('2d');

  const emitCanvas = document.createElement('canvas');
  emitCanvas.width = 256;
  emitCanvas.height = 512;
  const eCtx = emitCanvas.getContext('2d');

  cCtx.fillStyle = '#f4f6fa';
  cCtx.fillRect(0, 0, 256, 512);
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, 256, 512);

  const cols = 4;
  const rows = 10;
  const padX = 14;
  const padY = 14;
  const w = (256 - padX * (cols + 1)) / cols;
  const h = (512 - padY * (rows + 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * (w + padX);
      const y = padY + r * (h + padY);
      const litSeed = Math.sin(r * 17.7 + c * 9.3) * 0.5 + 0.5;
      const isWarm = (r + c) % 3 !== 1;

      cCtx.fillStyle = '#cbd5e1';
      cCtx.fillRect(x - 2, y - 2, w + 4, h + 4);
      cCtx.fillStyle = litSeed > 0.25 ? '#9fb3c8' : '#b4c3d4';
      cCtx.fillRect(x, y, w, h);

      if (litSeed > 0.2) {
        eCtx.fillStyle = isWarm ? '#ffd27d' : '#9ce8ff';
        eCtx.fillRect(x, y, w, h);
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

  // Small front emblem mark
  const logoBadge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), darkPanelMat);
  logoBadge.position.set(0, 1.45, 0.44);
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
 * Builds a stylized maquette car or electric bus (local front is +Z).
 */
export function createStylizedVehicle(bodyColor, isBus = false) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.28,
    metalness: 0.35
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.15,
    metalness: 0.75
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.85 });

  const w = isBus ? 1.55 : 1.38;
  const len = isBus ? 4.35 : 2.95;
  const h = isBus ? 1.48 : 0.46;

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(w, h, len), bodyMat);
  chassis.position.y = isBus ? 0.96 : 0.42;
  chassis.castShadow = true;
  group.add(chassis);

  if (isBus) {
    const windowBand = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, 0.56, len * 0.84), glassMat);
    windowBand.position.set(0, 1.18, 0.06);
    group.add(windowBand);
  } else {
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.82, 0.42, len * 0.54), glassMat);
    cabin.position.set(0, 0.82, -0.1);
    cabin.castShadow = true;
    group.add(cabin);
  }

  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.2, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const zOff = len * 0.31;
  [
    [-w * 0.48, 0.24, zOff],
    [w * 0.48, 0.24, zOff],
    [-w * 0.48, 0.24, -zOff],
    [w * 0.48, 0.24, -zOff]
  ].forEach(([wx, wy, wz]) => {
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.position.set(wx, wy, wz);
    group.add(tire);
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
