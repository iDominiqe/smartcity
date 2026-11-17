import * as THREE from 'three';

/**
 * Creates a crisp procedural photovoltaic solar panel texture with grid cells & silver busbars.
 */
function createSolarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Deep photovoltaic blue gradient
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#0a2351');
  grad.addColorStop(0.5, '#123a7a');
  grad.addColorStop(1, '#091d42');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Cell grid
  ctx.strokeStyle = 'rgba(130, 210, 255, 0.45)';
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

  // Subtle metallic busbars
  ctx.strokeStyle = 'rgba(200, 235, 255, 0.18)';
  ctx.lineWidth = 1;
  for (let c = 0; c < cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cw + cw * 0.5, 0);
    ctx.lineTo(c * cw + cw * 0.5, 256);
    ctx.stroke();
  }

  // Aluminum outer frame
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 248);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Creates a procedural skyscraper window grid texture for both base color and night emissive glow.
 */
function createBuildingWindowTextures() {
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = 256;
  colorCanvas.height = 512;
  const cCtx = colorCanvas.getContext('2d');

  const emitCanvas = document.createElement('canvas');
  emitCanvas.width = 256;
  emitCanvas.height = 512;
  const eCtx = emitCanvas.getContext('2d');

  cCtx.fillStyle = '#1d2b3a';
  cCtx.fillRect(0, 0, 256, 512);
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, 256, 512);

  const cols = 6;
  const rows = 14;
  const padX = 8;
  const padY = 8;
  const w = (256 - padX * (cols + 1)) / cols;
  const h = (512 - padY * (rows + 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * (w + padX);
      const y = padY + r * (h + padY);
      const litSeed = Math.sin(r * 19.3 + c * 7.7) * 0.5 + 0.5;
      const isWarm = (r + c) % 3 === 0;

      cCtx.fillStyle = litSeed > 0.25 ? '#355473' : '#24374a';
      cCtx.fillRect(x, y, w, h);

      if (litSeed > 0.22) {
        eCtx.fillStyle = isWarm ? '#ffd27d' : '#7ae8ff';
        eCtx.fillRect(x, y, w, h);
      }
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const emissiveMap = new THREE.CanvasTexture(emitCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  return { map, emissiveMap };
}

/**
 * Helper to create a tilted solar panel assembly.
 */
function createSolarPanelMesh(width, depth, tiltRad, solarMat, frameMat) {
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
  surface.position.y = 0.01;
  panelGroup.add(surface);

  group.add(panelGroup);
  return { group, panelGroup };
}

/**
 * Helper to create an animated energy conduit (glowing tube + moving energy pulse beads).
 */
function createEnergyStream(points, colorHex, beadCount = 6, tubeRadius = 0.055) {
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeo = new THREE.TubeGeometry(curve, 36, tubeRadius, 8, false);
  const tubeMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.24
  });
  const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);

  const group = new THREE.Group();
  group.add(tubeMesh);

  const beadGeo = new THREE.SphereGeometry(tubeRadius * 2.1, 10, 10);
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

  return {
    group,
    curve,
    tubeMat,
    beadMat,
    beads
  };
}

/**
 * Builds the entire 3D Smart-City-Led.com world and returns references for animation.
 */
export function buildSmartCityWorld(scene) {
  const world = {
    solarTex: createSolarTexture(),
    windowTex: createBuildingWindowTextures(),
    trackingPanels: [],
    streetLamps: [],
    buildingMaterials: [],
    cityFlows: [],
    stationFlows: [],
    homeFlows: [],
    stationBayRingMat: null,
    stationStatusMats: [],
    homeWindowMat: null,
    homeWallBatteryBars: [],
    homeInteriorLight: null,
    stationLight: null,
    hubRings: [],
    evCar: null,
    evWheels: [],
    evHeadlightMat: null,
    evTaillightMat: null,
    evHeadlightCones: [],
    evHeadlightSpot: null,
    evChargeRingMat: null,
    sunMesh: null,
    moonMesh: null,
    starsPoints: null,
    starsMat: null,
    dirLight: null,
    hemiLight: null,
    ambientLight: null
  };

  // Shared Materials
  const solarMat = new THREE.MeshStandardMaterial({
    map: world.solarTex,
    roughness: 0.22,
    metalness: 0.65,
    emissive: new THREE.Color('#072347'),
    emissiveIntensity: 0.35
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    roughness: 0.35,
    metalness: 0.75
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.45,
    metalness: 0.7
  });

  const asphaltMat = new THREE.MeshStandardMaterial({
    color: '#1f2430',
    roughness: 0.85,
    metalness: 0.1
  });

  const laneLineMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    transparent: true,
    opacity: 0.7
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: '#1f6142',
    roughness: 0.9,
    metalness: 0.05
  });

  // ---------------------------------------------------------------------------
  // 1. LIGHTING, SUN, MOON & STARFIELD
  // ---------------------------------------------------------------------------
  world.ambientLight = new THREE.AmbientLight('#b8d4ff', 0.45);
  scene.add(world.ambientLight);

  world.hemiLight = new THREE.HemisphereLight('#d6ecff', '#1b2b28', 0.8);
  scene.add(world.hemiLight);

  world.dirLight = new THREE.DirectionalLight('#fff5e4', 1.85);
  world.dirLight.position.set(-18, 34, 18);
  world.dirLight.castShadow = true;
  world.dirLight.shadow.mapSize.width = 2048;
  world.dirLight.shadow.mapSize.height = 2048;
  world.dirLight.shadow.camera.near = 5;
  world.dirLight.shadow.camera.far = 110;
  const d = 44;
  world.dirLight.shadow.camera.left = -d;
  world.dirLight.shadow.camera.right = d;
  world.dirLight.shadow.camera.top = d;
  world.dirLight.shadow.camera.bottom = -d;
  world.dirLight.shadow.bias = -0.0005;
  scene.add(world.dirLight);

  // Visible Sun & Moon Orbs
  world.sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 24, 24),
    new THREE.MeshBasicMaterial({ color: '#ffd97d' })
  );
  scene.add(world.sunMesh);

  world.moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 24, 24),
    new THREE.MeshBasicMaterial({ color: '#dbeafe' })
  );
  scene.add(world.moonMesh);

  // Starfield dome
  const starCount = 900;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.85 + 0.12);
    const r = 115 + Math.random() * 20;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  world.starsMat = new THREE.PointsMaterial({
    color: '#e2e8f0',
    size: 0.65,
    transparent: true,
    opacity: 0.0,
    depthWrite: false
  });
  world.starsPoints = new THREE.Points(starGeo, world.starsMat);
  scene.add(world.starsPoints);

  // ---------------------------------------------------------------------------
  // 2. MINI-CITY ISLAND BASE, PARKS, WATER & ROADS
  // ---------------------------------------------------------------------------
  const islandGroup = new THREE.Group();

  // Island foundation slab
  const baseSlab = new THREE.Mesh(
    new THREE.BoxGeometry(84, 1.8, 56),
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.7, metalness: 0.35 })
  );
  baseSlab.position.y = -0.92;
  baseSlab.receiveShadow = true;
  islandGroup.add(baseSlab);

  // Glowing perimeter LED trim around the mini-city diorama
  const trimRing = new THREE.Mesh(
    new THREE.BoxGeometry(84.3, 0.14, 56.3),
    new THREE.MeshBasicMaterial({ color: '#0ea5e9', transparent: true, opacity: 0.55 })
  );
  trimRing.position.y = -0.15;
  islandGroup.add(trimRing);

  // Urban ground deck
  const groundDeck = new THREE.Mesh(
    new THREE.BoxGeometry(82, 0.1, 54),
    new THREE.MeshStandardMaterial({ color: '#273142', roughness: 0.88, metalness: 0.1 })
  );
  groundDeck.position.y = -0.02;
  groundDeck.receiveShadow = true;
  islandGroup.add(groundDeck);

  // Green Park Zones
  const parks = [
    { x: -24, z: 10, w: 12, d: 13 },
    { x: -11, z: -11, w: 9, d: 11 },
    { x: 14, z: 10, w: 14, d: 14 },
    { x: 28, z: -10, w: 18, d: 17 },
    { x: 29, z: 10, w: 16, d: 13 }
  ];
  parks.forEach((p) => {
    const patch = new THREE.Mesh(new THREE.BoxGeometry(p.w, 0.08, p.d), grassMat);
    patch.position.set(p.x, 0.02, p.z);
    patch.receiveShadow = true;
    islandGroup.add(patch);
  });

  // Eco Water Pond near city park
  const pond = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 0.06, 6.2),
    new THREE.MeshStandardMaterial({
      color: '#0284c7',
      roughness: 0.12,
      metalness: 0.75
    })
  );
  pond.position.set(-24, 0.045, 11);
  islandGroup.add(pond);

  // Main East-West Smart Boulevard (z = 0)
  const mainRoad = new THREE.Mesh(new THREE.BoxGeometry(76, 0.06, 4.8), asphaltMat);
  mainRoad.position.set(0, 0.03, 0);
  mainRoad.receiveShadow = true;
  islandGroup.add(mainRoad);

  // Urban Cross Avenue (x = -17)
  const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.06, 44), asphaltMat);
  crossRoad.position.set(-17, 0.03, 0);
  crossRoad.receiveShadow = true;
  islandGroup.add(crossRoad);

  // Glowing smart lane centerlines along main boulevard
  for (let x = -35; x <= 35; x += 3.2) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 0.12), laneLineMat);
    dash.position.set(x, 0.065, 0);
    islandGroup.add(dash);
  }

  // Stylized Trees helper
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c4033', roughness: 0.9 });
  const leafMatA = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.75 });
  const leafMatB = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 });

  function addTree(x, z, scale = 1) {
    const tGroup = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.9, 6), trunkMat);
    trunk.position.y = 0.45;
    trunk.castShadow = true;
    tGroup.add(trunk);

    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.85, 2.0, 7),
      Math.random() > 0.5 ? leafMatA : leafMatB
    );
    crown.position.y = 1.65;
    crown.castShadow = true;
    tGroup.add(crown);

    tGroup.position.set(x, 0.05, z);
    tGroup.scale.setScalar(scale);
    islandGroup.add(tGroup);
  }

  const treeCoords = [
    [-28, 7], [-28, 14], [-21, 7], [-14, -7], [-9, -15],
    [10, 6], [13, 14], [19, 8], [23, -15], [35, -14],
    [35, -5], [24, 13], [32, 9], [16, -9]
  ];
  treeCoords.forEach(([tx, tz], idx) => addTree(tx, tz, 0.85 + (idx % 3) * 0.22));

  scene.add(islandGroup);

  // ---------------------------------------------------------------------------
  // 3. ZONE 1: MINI-CITY TOWERS, SOLAR FARM & GRID BATTERY HUB
  // ---------------------------------------------------------------------------
  const cityGroup = new THREE.Group();

  // Ground Solar Farm (-31..-22, -16..-7)
  const solarFarmPad = new THREE.Mesh(
    new THREE.BoxGeometry(11.5, 0.1, 11.5),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 })
  );
  solarFarmPad.position.set(-26.5, 0.04, -11.5);
  solarFarmPad.receiveShadow = true;
  cityGroup.add(solarFarmPad);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const px = -30.4 + col * 2.6;
      const pz = -15.0 + row * 3.4;

      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.14, 0.75, 8),
        darkMetalMat
      );
      pedestal.position.set(px, 0.42, pz);
      cityGroup.add(pedestal);

      const { group, panelGroup } = createSolarPanelMesh(2.1, 1.45, 0.48, solarMat, frameMat);
      group.position.set(px, 0.82, pz);
      cityGroup.add(group);
      world.trackingPanels.push({ panelGroup, baseTilt: 0.48, phase: row * 0.5 + col * 0.3 });
    }
  }

  // Central Smart Grid Battery Hub (-11, -11)
  const hubGroup = new THREE.Group();
  hubGroup.position.set(-10.5, 0.06, -10.5);

  const hubBase = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.8, 0.5, 16),
    darkMetalMat
  );
  hubBase.position.y = 0.25;
  hubGroup.add(hubBase);

  const hubCore = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 3.2, 16),
    new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.25,
      metalness: 0.8
    })
  );
  hubCore.position.y = 1.9;
  hubCore.castShadow = true;
  hubGroup.add(hubCore);

  for (let i = 0; i < 3; i++) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: i === 1 ? '#10b981' : '#38bdf8',
      transparent: true,
      opacity: 0.9
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.08, 12, 32), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.1 + i * 0.85;
    hubGroup.add(ring);
    world.hubRings.push({ ring, baseY: ring.position.y, phase: i * 1.4 });
  }

  // Solar Roof Crown on Hub
  const hubRoofSolar = createSolarPanelMesh(2.6, 2.6, 0.2, solarMat, frameMat);
  hubRoofSolar.group.position.y = 3.65;
  hubGroup.add(hubRoofSolar.group);
  cityGroup.add(hubGroup);

  // City Towers with Rooftop Solar Arrays
  const towerSpecs = [
    { x: -25.5, z: -4.2, w: 3.4, d: 3.4, h: 7.2, color: '#334155' },
    { x: -21.2, z: -4.6, w: 3.0, d: 3.2, h: 10.5, color: '#1e293b' },
    { x: -12.0, z: -4.5, w: 3.6, d: 3.2, h: 9.2, color: '#283548' },
    { x: -12.2, z: 5.5, w: 3.4, d: 3.4, h: 11.8, color: '#1e293b' },
    { x: -12.0, z: 11.2, w: 3.8, d: 3.6, h: 7.5, color: '#334155' },
    { x: -22.2, z: 5.2, w: 3.4, d: 3.2, h: 8.6, color: '#2c3a4f' },
    { x: -29.5, z: 4.5, w: 3.2, d: 3.6, h: 6.2, color: '#334155' },
    { x: -6.5, z: 6.5, w: 4.2, d: 3.8, h: 8.0, color: '#243247' },
    { x: -5.8, z: -4.8, w: 3.6, d: 3.4, h: 6.4, color: '#334155' }
  ];

  towerSpecs.forEach((b, idx) => {
    const mat = new THREE.MeshStandardMaterial({
      color: b.color,
      map: world.windowTex.map,
      emissiveMap: world.windowTex.emissiveMap,
      emissive: new THREE.Color('#ffdca8'),
      emissiveIntensity: 0.05,
      roughness: 0.35,
      metalness: 0.4
    });
    world.buildingMaterials.push(mat);

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
    mesh.position.set(b.x, b.h / 2 + 0.05, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cityGroup.add(mesh);

    // Rooftop cap
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(b.w + 0.25, 0.25, b.d + 0.25),
      darkMetalMat
    );
    cap.position.set(b.x, b.h + 0.18, b.z);
    cityGroup.add(cap);

    // Dual rooftop solar arrays
    const roofSolar = createSolarPanelMesh(b.w * 0.78, b.d * 0.68, 0.36, solarMat, frameMat);
    roofSolar.group.position.set(b.x, b.h + 0.6, b.z);
    cityGroup.add(roofSolar.group);
    world.trackingPanels.push({ panelGroup: roofSolar.panelGroup, baseTilt: 0.36, phase: idx * 0.7 });
  });

  scene.add(cityGroup);

  // ---------------------------------------------------------------------------
  // 4. SMART-CITY-LED STREETLAMPS ALONG BOULEVARD & AVENUES
  // ---------------------------------------------------------------------------
  const lampGroup = new THREE.Group();
  const coneGeo = new THREE.ConeGeometry(1.75, 4.3, 16, 1, true);
  coneGeo.translate(0, -2.15, 0);

  function addStreetLamp(x, z, armDirZ) {
    const poleUnit = new THREE.Group();
    poleUnit.position.set(x, 0.05, z);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.1, 4.3, 8),
      darkMetalMat
    );
    mast.position.y = 2.15;
    mast.castShadow = true;
    poleUnit.add(mast);

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 1.15),
      darkMetalMat
    );
    arm.position.set(0, 4.25, armDirZ * 0.55);
    poleUnit.add(arm);

    // Mini solar panel on top of each Smart LED pole
    const microSolar = createSolarPanelMesh(0.65, 0.45, 0.25, solarMat, frameMat);
    microSolar.group.position.set(0, 4.42, 0);
    poleUnit.add(microSolar.group);

    // Smart LED Bulb housing
    const bulbMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      emissive: new THREE.Color('#ffdf9e'),
      emissiveIntensity: 0.0
    });
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.52), bulbMat);
    bulb.position.set(0, 4.18, armDirZ * 0.98);
    poleUnit.add(bulb);

    // Volumetric soft glow cone for night mode
    const coneMat = new THREE.MeshBasicMaterial({
      color: '#ffd98e',
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 4.15, armDirZ * 0.98);
    poleUnit.add(cone);

    lampGroup.add(poleUnit);
    world.streetLamps.push({ bulbMat, coneMat });
  }

  const lampXPositions = [-30, -22, -13, -5, 3, 12, 20, 28, 34];
  lampXPositions.forEach((lx, i) => {
    addStreetLamp(lx, 2.7, -1);
    if (i % 2 === 0 && lx !== 3 && lx !== 28) {
      addStreetLamp(lx, -2.7, 1);
    }
  });
  scene.add(lampGroup);

  // ---------------------------------------------------------------------------
  // 5. ZONE 2: SOLAR EV CHARGING STATION (x = 4, z = -6.2)
  // ---------------------------------------------------------------------------
  const stationGroup = new THREE.Group();
  stationGroup.position.set(4, 0.04, -6.0);

  // Asphalt pull-in apron connecting z = 0 boulevard to charging bay
  const stationApron = new THREE.Mesh(
    new THREE.BoxGeometry(12.5, 0.06, 8.2),
    asphaltMat
  );
  stationApron.position.set(0, 0.0, 2.0);
  stationApron.receiveShadow = true;
  stationGroup.add(stationApron);

  // Glowing parking bay pad around EV stop position (4, -5.2) -> local (0, +0.8)
  world.stationBayRingMat = new THREE.MeshBasicMaterial({
    color: '#10b981',
    transparent: true,
    opacity: 0.35
  });
  const bayOutline = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.03, 2.8),
    world.stationBayRingMat
  );
  bayOutline.position.set(0, 0.045, 0.8);
  stationGroup.add(bayOutline);

  // Cantilevered Canopy Y-Pillars
  [-3.8, 3.8].forEach((px) => {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 4.4, 0.45),
      darkMetalMat
    );
    pillar.position.set(px, 2.2, -1.5);
    pillar.castShadow = true;
    stationGroup.add(pillar);
  });

  // Angled Solar Canopy Roof
  const canopyRoof = new THREE.Group();
  canopyRoof.position.set(0, 4.45, 0.2);
  canopyRoof.rotation.x = 0.22;

  const canopyDeck = new THREE.Mesh(
    new THREE.BoxGeometry(11.2, 0.24, 5.8),
    darkMetalMat
  );
  canopyDeck.castShadow = true;
  canopyRoof.add(canopyDeck);

  // Glowing cyan underside trim on canopy
  const canopyLed = new THREE.Mesh(
    new THREE.BoxGeometry(11.3, 0.08, 5.9),
    new THREE.MeshBasicMaterial({ color: '#38bdf8' })
  );
  canopyLed.position.y = -0.14;
  canopyRoof.add(canopyLed);

  // Twin giant photovoltaic arrays on top of canopy
  const canopySolarL = createSolarPanelMesh(5.0, 4.8, 0.0, solarMat, frameMat);
  canopySolarL.group.position.set(-2.65, 0.16, 0);
  canopyRoof.add(canopySolarL.group);

  const canopySolarR = createSolarPanelMesh(5.0, 4.8, 0.0, solarMat, frameMat);
  canopySolarR.group.position.set(2.65, 0.16, 0);
  canopyRoof.add(canopySolarR.group);

  stationGroup.add(canopyRoof);

  // 3 Fast-Charging Pedestals
  [-3.0, 0.0, 3.0].forEach((cx) => {
    const ped = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 1.85, 0.48),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3, metalness: 0.3 })
    );
    ped.position.set(cx, 0.92, -1.2);
    ped.castShadow = true;
    stationGroup.add(ped);

    const statusMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    world.stationStatusMats.push(statusMat);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.52), statusMat);
    screen.position.set(cx, 1.32, -1.2);
    stationGroup.add(screen);
  });

  // Charging cable curving from middle pedestal toward EV dock point
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.25, 1.2, -1.0),
    new THREE.Vector3(0.7, 0.7, -0.3),
    new THREE.Vector3(0.5, 0.65, 0.45)
  ]);
  const cableMesh = new THREE.Mesh(
    new THREE.TubeGeometry(cableCurve, 16, 0.045, 8, false),
    darkMetalMat
  );
  stationGroup.add(cableMesh);

  // Dedicated Canopy Light
  world.stationLight = new THREE.PointLight('#38bdf8', 0.8, 16);
  world.stationLight.position.set(0, 3.8, 0.6);
  stationGroup.add(world.stationLight);

  scene.add(stationGroup);

  // ---------------------------------------------------------------------------
  // 6. ZONE 3: SUBURBAN SMART HOME / VILLA (x = 29, z = -10.5)
  // ---------------------------------------------------------------------------
  const homeGroup = new THREE.Group();
  homeGroup.position.set(29.0, 0.05, -10.5);

  // Driveway connecting z = 0 boulevard to home parking spot (x = 29, z = -5.4 -> local (0, +5.1))
  const driveway = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.06, 9.6),
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 })
  );
  driveway.position.set(0, 0.01, 5.8);
  driveway.receiveShadow = true;
  homeGroup.add(driveway);

  // Home parking bay glow pad
  const homePad = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.03, 4.8),
    new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.25 })
  );
  homePad.position.set(0, 0.045, 5.1);
  homeGroup.add(homePad);

  // Villa Main Lower & Upper Architectural Volumes
  const plasterMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.65 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#9a5b32', roughness: 0.75 });

  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(8.4, 2.8, 5.6), plasterMat);
  lowerBody.position.set(0, 1.4, -0.5);
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  homeGroup.add(lowerBody);

  const upperBody = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.4, 5.0), woodMat);
  upperBody.position.set(-0.6, 3.9, -0.6);
  upperBody.castShadow = true;
  homeGroup.add(upperBody);

  // Sloped Roof + Rooftop Solar Panels
  const roof = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.28, 5.6), darkMetalMat);
  roof.position.set(-0.6, 5.25, -0.6);
  roof.rotation.x = 0.2;
  roof.castShadow = true;
  homeGroup.add(roof);

  const homeSolarL = createSolarPanelMesh(2.6, 3.6, 0.2, solarMat, frameMat);
  homeSolarL.group.position.set(-2.1, 5.55, -0.5);
  homeGroup.add(homeSolarL.group);

  const homeSolarR = createSolarPanelMesh(2.6, 3.6, 0.2, solarMat, frameMat);
  homeSolarR.group.position.set(0.9, 5.55, -0.5);
  homeGroup.add(homeSolarR.group);

  // Warm Emissive Home Windows (light up smoothly in Stage 3 Evening)
  world.homeWindowMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    emissive: new THREE.Color('#ffbe55'),
    emissiveIntensity: 0.08,
    roughness: 0.15,
    metalness: 0.2
  });

  const windowSpecs = [
    { x: -2.2, y: 1.45, z: 2.33, w: 2.4, h: 1.7, d: 0.1 },
    { x: 1.8, y: 1.45, z: 2.33, w: 2.0, h: 1.7, d: 0.1 },
    { x: -1.4, y: 3.9, z: 1.93, w: 3.4, h: 1.35, d: 0.1 },
    { x: 4.23, y: 1.5, z: -0.5, w: 0.1, h: 1.6, d: 2.2 }
  ];
  windowSpecs.forEach((ws) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(ws.w, ws.h, ws.d), world.homeWindowMat);
    win.position.set(ws.x, ws.y, ws.z);
    homeGroup.add(win);
  });

  // Home Wall Battery Storage Unit (visibly mounted on driveway side wall)
  const wallBattery = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.6, 0.35),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3, metalness: 0.4 })
  );
  wallBattery.position.set(2.8, 1.35, 2.45);
  wallBattery.castShadow = true;
  homeGroup.add(wallBattery);

  for (let b = 0; b < 4; b++) {
    const barMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.14, 0.38), barMat);
    bar.position.set(2.8, 0.9 + b * 0.28, 2.45);
    homeGroup.add(bar);
    world.homeWallBatteryBars.push({ barMat, index: b });
  }

  // Garden Pathway Smart LED Bollards
  [-2.5, 2.5].forEach((gx) => {
    [3.0, 5.2, 7.4].forEach((gz) => {
      const bollard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.65, 8),
        darkMetalMat
      );
      bollard.position.set(gx, 0.32, gz);
      homeGroup.add(bollard);

      const capMat = new THREE.MeshStandardMaterial({
        color: '#fde68a',
        emissive: new THREE.Color('#fbbf24'),
        emissiveIntensity: 0.0
      });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 8), capMat);
      cap.position.set(gx, 0.68, gz);
      homeGroup.add(cap);
      world.streetLamps.push({ bulbMat: capMat, coneMat: null });
    });
  });

  // Warm Evening Light at the Smart Home
  world.homeInteriorLight = new THREE.PointLight('#ffba52', 0.0, 22);
  world.homeInteriorLight.position.set(0, 2.8, 3.8);
  homeGroup.add(world.homeInteriorLight);

  scene.add(homeGroup);

  // ---------------------------------------------------------------------------
  // 7. ANIMATED ELECTRIC VEHICLE (EV) — Local Front is +Z
  // ---------------------------------------------------------------------------
  const evCar = new THREE.Group();

  const carBodyMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.22,
    metalness: 0.72
  });
  const cabinGlassMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.1,
    metalness: 0.9
  });

  // Lower chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.52, 3.9), carBodyMat);
  chassis.position.y = 0.52;
  chassis.castShadow = true;
  evCar.add(chassis);

  // Sleek cyan side eco-strip
  const accentStrip = new THREE.Mesh(
    new THREE.BoxGeometry(1.79, 0.08, 3.2),
    new THREE.MeshBasicMaterial({ color: '#38bdf8' })
  );
  accentStrip.position.y = 0.44;
  evCar.add(accentStrip);

  // Aerodynamic Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.48, 2.1), cabinGlassMat);
  cabin.position.set(0, 0.96, -0.18);
  cabin.castShadow = true;
  evCar.add(cabin);

  // Charging indicator ring on EV roof
  world.evChargeRingMat = new THREE.MeshBasicMaterial({
    color: '#10b981',
    transparent: true,
    opacity: 0.0
  });
  const chargeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.045, 8, 24),
    world.evChargeRingMat
  );
  chargeRing.rotation.x = Math.PI / 2;
  chargeRing.position.set(0, 1.24, -0.18);
  evCar.add(chargeRing);

  // 4 Rotating Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.85 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.8, roughness: 0.25 });

  [
    [-0.86, 0.32, 1.18],
    [0.86, 0.32, 1.18],
    [-0.86, 0.32, -1.18],
    [0.86, 0.32, -1.18]
  ].forEach(([wx, wy, wz]) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx, wy, wz);
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.26, 10), rimMat);
    rim.rotation.z = Math.PI / 2;
    wGroup.add(tire, rim);
    evCar.add(wGroup);
    world.evWheels.push(wGroup);
  });

  // Front LED Headlights (+Z front)
  world.evHeadlightMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: new THREE.Color('#e0f2fe'),
    emissiveIntensity: 0.35
  });
  const headlightBar = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 0.08), world.evHeadlightMat);
  headlightBar.position.set(0, 0.58, 1.94);
  evCar.add(headlightBar);

  // Translucent Headlight Cones projecting forward (+Z)
  const beamGeo = new THREE.ConeGeometry(1.15, 5.2, 16, 1, true);
  beamGeo.translate(0, -2.6, 0);
  beamGeo.rotateX(-Math.PI / 2);

  [-0.52, 0.52].forEach((hx) => {
    const beamMat = new THREE.MeshBasicMaterial({
      color: '#e0f2fe',
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(hx, 0.56, 1.98);
    evCar.add(beam);
    world.evHeadlightCones.push(beamMat);
  });

  // Actual headlight PointLight moving with EV
  world.evHeadlightSpot = new THREE.PointLight('#bae6fd', 0.0, 14);
  world.evHeadlightSpot.position.set(0, 0.8, 3.2);
  evCar.add(world.evHeadlightSpot);

  // Rear Red Tailbar (-Z rear)
  world.evTaillightMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    emissive: new THREE.Color('#ff2a2a'),
    emissiveIntensity: 0.4
  });
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.11, 0.08), world.evTaillightMat);
  tailBar.position.set(0, 0.62, -1.94);
  evCar.add(tailBar);

  evCar.position.set(-25, 0.06, 0);
  evCar.rotation.y = Math.PI / 2;
  scene.add(evCar);
  world.evCar = evCar;

  // ---------------------------------------------------------------------------
  // 8. ANIMATED 3D ENERGY CONDUITS & PARTICLE STREAMS
  // ---------------------------------------------------------------------------
  const energyGroup = new THREE.Group();

  // Stage 1: City Flows (Solar Farm -> Grid Hub -> City Towers)
  const cityPaths = [
    [
      new THREE.Vector3(-26.5, 1.2, -11.5),
      new THREE.Vector3(-19.0, 2.2, -11.2),
      new THREE.Vector3(-10.5, 2.0, -10.5)
    ],
    [
      new THREE.Vector3(-10.5, 2.0, -10.5),
      new THREE.Vector3(-16.0, 3.0, -7.2),
      new THREE.Vector3(-21.2, 5.5, -4.6)
    ],
    [
      new THREE.Vector3(-10.5, 2.0, -10.5),
      new THREE.Vector3(-11.5, 3.2, -7.5),
      new THREE.Vector3(-12.0, 5.2, -4.5)
    ],
    [
      new THREE.Vector3(-10.5, 2.0, -10.5),
      new THREE.Vector3(-11.2, 3.5, 0.5),
      new THREE.Vector3(-12.2, 6.0, 5.5)
    ],
    [
      new THREE.Vector3(-10.5, 2.0, -10.5),
      new THREE.Vector3(-17.0, 2.6, 0.0),
      new THREE.Vector3(-22.2, 4.8, 5.2)
    ],
    [
      new THREE.Vector3(-10.5, 2.0, -10.5),
      new THREE.Vector3(-8.2, 3.0, -2.5),
      new THREE.Vector3(-6.5, 4.5, 6.5)
    ]
  ];

  cityPaths.forEach((pts) => {
    const stream = createEnergyStream(pts, '#38bdf8', 7, 0.06);
    energyGroup.add(stream.group);
    world.cityFlows.push(stream);
  });

  // Stage 2: Solar EV Station Flows (Canopy Solar Roof -> Charging Pedestal -> Docked EV)
  const stationPaths = [
    [
      new THREE.Vector3(1.5, 4.7, -5.8),
      new THREE.Vector3(3.2, 3.6, -7.0),
      new THREE.Vector3(4.0, 1.8, -7.2),
      new THREE.Vector3(4.0, 0.8, -5.2)
    ],
    [
      new THREE.Vector3(6.5, 4.7, -5.8),
      new THREE.Vector3(4.8, 3.6, -7.0),
      new THREE.Vector3(4.0, 1.8, -7.2),
      new THREE.Vector3(4.0, 0.8, -5.2)
    ]
  ];
  stationPaths.forEach((pts) => {
    const stream = createEnergyStream(pts, '#10b981', 9, 0.075);
    energyGroup.add(stream.group);
    world.stationFlows.push(stream);
  });

  // Stage 3: Smart Home Evening Flows (Rooftop Solar -> Wall Battery -> Villa Interior & EV V2H)
  const homePaths = [
    // Rooftop solar to Wall Battery
    [
      new THREE.Vector3(29.8, 5.6, -10.8),
      new THREE.Vector3(32.5, 4.0, -9.2),
      new THREE.Vector3(31.8, 1.6, -8.0)
    ],
    // Wall Battery to Villa Interior
    [
      new THREE.Vector3(31.8, 1.5, -8.0),
      new THREE.Vector3(30.2, 1.8, -8.2),
      new THREE.Vector3(28.5, 2.2, -9.5)
    ],
    // Parked EV (29, -5.4) V2H connection to Wall Battery (31.8, 1.5, -8.0)
    [
      new THREE.Vector3(29.0, 0.7, -5.4),
      new THREE.Vector3(30.8, 1.1, -6.5),
      new THREE.Vector3(31.8, 1.4, -8.0)
    ]
  ];
  homePaths.forEach((pts) => {
    const stream = createEnergyStream(pts, '#fbbf24', 8, 0.065);
    energyGroup.add(stream.group);
    world.homeFlows.push(stream);
  });

  scene.add(energyGroup);

  return world;
}
