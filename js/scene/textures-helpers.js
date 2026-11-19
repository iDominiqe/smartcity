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
 * Creates the illuminated billboard texture for the Smart-City-Led.com · NEO CLIM® Flagship Store.
 */
export function createStoreSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 256);
  bgGrad.addColorStop(0, '#07152b');
  bgGrad.addColorStop(0.5, '#0c2347');
  bgGrad.addColorStop(1, '#07152b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 256);

  // Neon cyan border
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 1004, 236);

  // Top headline: SMART-CITY-LED.COM
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 72px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SMART-CITY-LED.COM', 512, 88);

  // Highlighted pill for NEO CLIM® SOLAR A+++
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(180, 146, 664, 72);
  ctx.fillStyle = '#041426';
  ctx.font = '800 42px Inter, Arial, sans-serif';
  ctx.fillText('NEO CLIM®  ·  SOLAR AC A+++', 512, 184);

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
 * Creates a sculptural 3D NEO Clim® A+++ Air Conditioner display unit with spinning fans.
 */
export function createAcUnitMesh(scale = 1) {
  const unit = new THREE.Group();
  const caseMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.32, metalness: 0.25 });
  const grilleMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: '#00e5ff', emissive: '#0284c7', emissiveIntensity: 0.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 0.82), caseMat);
  body.position.y = 0.68;
  body.castShadow = true;
  unit.add(body);

  // Cyan NEO CLIM eco trim stripe
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.14, 0.12, 0.85),
    new THREE.MeshBasicMaterial({ color: '#00e5ff' })
  );
  stripe.position.y = 1.24;
  unit.add(stripe);

  const fans = [];
  [-0.5, 0.5].forEach((fx) => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 18), grilleMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(fx, 0.66, 0.41);
    unit.add(ring);

    const fanRotor = new THREE.Group();
    fanRotor.position.set(fx, 0.66, 0.46);
    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.62, 0.03), bladeMat);
      blade.rotation.z = (b * Math.PI) / 3;
      fanRotor.add(blade);
    }
    unit.add(fanRotor);
    fans.push(fanRotor);
  });

  unit.scale.setScalar(scale);
  return { unit, fans };
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
