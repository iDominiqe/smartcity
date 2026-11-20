import * as THREE from 'three';
import {
  createSolarTexture,
  createMaquetteWindowTextures,
  createBadgeTexture,
  createStationSignTexture,
  createStoreSignTexture,
  createNeoClimPosterTexture,
  createSolarPanelMesh,
  createRooftopFanUnit,
  createMobileAcUnitMesh,
  createEnergyStream,
  createVoxelCloudCluster,
  createVoxelCrescentMoon,
  createVoxelTree,
  createStylizedVehicle,
  createPedestrian
} from './scene/textures-helpers.js';

/**
 * Builds the V2 Isometric Voxel/Diorama Smart-City-Led.com 3D world
 * supporting smooth 4-phase lighting (Morning, Day, Sunset, Night),
 * multi-palette buildings, storefronts, voxel trees/clouds/moon, and all 4 zones.
 */
export function buildSmartCityWorld(scene) {
  const world = {
    solarTex: createSolarTexture(),
    windowTex: createMaquetteWindowTextures(),
    badgeTex: createBadgeTexture('C', '#2563eb'),
    stationSignTex: createStationSignTexture(),
    storeSignTex: createStoreSignTexture(),
    storePosterTex: createNeoClimPosterTexture(),
    trackingPanels: [],
    streetLamps: [],
    buildingMaterials: [],
    storefrontMats: [],
    signalLampMats: [],
    cityFlows: [],
    stationFlows: [],
    homeFlows: [],
    storeFlows: [],
    storeAcWaves: [],
    storeShopper: null,
    storeWindowMat: null,
    stationSignMat: null,
    storeSignMat: null,
    storeBayRingMat: null,
    storeInteriorLight: null,
    trafficVehicles: [],
    vehicleLightMats: [],
    pedestrians: [],
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
    voxelStarsGroup: null,
    voxelStarMats: [],
    voxelClouds: [],
    cloudMat: null,
    dirLight: null,
    hemiLight: null,
    ambientLight: null
  };

  // Shared Diorama Materials
  const solarMat = new THREE.MeshStandardMaterial({
    map: world.solarTex,
    roughness: 0.22,
    metalness: 0.65,
    emissive: new THREE.Color('#0a2957'),
    emissiveIntensity: 0.28
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    roughness: 0.35,
    metalness: 0.55
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.42,
    metalness: 0.6
  });

  const slateTrimMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.48,
    metalness: 0.45
  });

  const stoneConcreteMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.68,
    metalness: 0.08
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: '#b8c2d6',
    roughness: 0.8,
    metalness: 0.05
  });

  const roadMat = new THREE.MeshStandardMaterial({
    color: '#141a26',
    roughness: 0.78,
    metalness: 0.1
  });

  const plazaFloorMat = new THREE.MeshStandardMaterial({
    color: '#283347',
    roughness: 0.72,
    metalness: 0.15
  });

  const crosswalkMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });

  const yellowLineMat = new THREE.MeshBasicMaterial({
    color: '#fbbf24',
    transparent: true,
    opacity: 0.9
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: '#166534',
    roughness: 0.88,
    metalness: 0.02
  });

  const hedgeDarkMat = new THREE.MeshStandardMaterial({
    color: '#15803d',
    roughness: 0.82
  });

  const hedgeBrightMat = new THREE.MeshStandardMaterial({
    color: '#22c55e',
    roughness: 0.78
  });

  // ---------------------------------------------------------------------------
  // 1. SUN, VOXEL CRESCENT MOON, CLOUDS & DIAMOND STARFIELD
  // ---------------------------------------------------------------------------
  world.ambientLight = new THREE.AmbientLight('#ffffff', 0.48);
  scene.add(world.ambientLight);

  world.hemiLight = new THREE.HemisphereLight('#ffffff', '#334155', 1.15);
  scene.add(world.hemiLight);

  world.dirLight = new THREE.DirectionalLight('#fff8eb', 2.2);
  world.dirLight.position.set(-22, 38, 22);
  world.dirLight.castShadow = true;
  world.dirLight.shadow.mapSize.width = 2048;
  world.dirLight.shadow.mapSize.height = 2048;
  world.dirLight.shadow.camera.near = 5;
  world.dirLight.shadow.camera.far = 130;
  const d = 48;
  world.dirLight.shadow.camera.left = -d;
  world.dirLight.shadow.camera.right = d;
  world.dirLight.shadow.camera.top = d;
  world.dirLight.shadow.camera.bottom = -d;
  world.dirLight.shadow.bias = -0.0004;
  scene.add(world.dirLight);

  world.sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 24, 24),
    new THREE.MeshBasicMaterial({ color: '#ffe599' })
  );
  const sunHalo = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 24, 24),
    new THREE.MeshBasicMaterial({
      color: '#fde68a',
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    })
  );
  world.sunMesh.add(sunHalo);
  scene.add(world.sunMesh);

  world.moonMesh = createVoxelCrescentMoon();
  scene.add(world.moonMesh);

  // Floating 3D Voxel Clouds across visible upper diorama skyline (North & South backdrops)
  world.cloudMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: new THREE.Color('#64748b'),
    emissiveIntensity: 0.14,
    roughness: 0.88,
    metalness: 0.02
  });
  const cloudSpecs = [
    [-28, 13.6, -21, 1.3, 0.35],
    [-16, 16.4, -24, 1.5, 0.25],
    [-3, 14.5, -23, 1.25, 0.42],
    [10, 17.0, -22, 1.4, 0.3],
    [23, 14.2, -20, 1.25, 0.38],
    [-22, 17.5, -18, 1.05, 0.28],
    [28, 15.8, -14, 1.1, 0.32],
    [12, 14.2, 24, 1.25, 0.4],
    [24, 16.2, 22, 1.15, 0.28]
  ];
  cloudSpecs.forEach(([cx, cy, cz, sc, sp], i) => {
    const cloud = createVoxelCloudCluster(world.cloudMat, sc);
    cloud.position.set(cx, cy, cz);
    scene.add(cloud);
    world.voxelClouds.push({ mesh: cloud, baseX: cx, baseY: cy, baseZ: cz, speed: sp, phase: i * 1.1 });
  });

  // Pixel Points Starfield + Crisp 3D Voxel Diamond Stars in upper skyline
  const starCount = 750;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.85 + 0.12);
    const r = 120 + Math.random() * 22;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  world.starsMat = new THREE.PointsMaterial({
    color: '#e2e8f0',
    size: 0.72,
    transparent: true,
    opacity: 0.0,
    depthWrite: false
  });
  world.starsPoints = new THREE.Points(starGeo, world.starsMat);
  scene.add(world.starsPoints);

  world.voxelStarsGroup = new THREE.Group();
  const diamondGeo = new THREE.OctahedronGeometry(0.42, 0);
  const voxelStarCoords = [
    [-34, 15.0, -25], [-26, 19.5, -27], [-18, 16.2, -28], [-10, 21.0, -26],
    [-2, 17.5, -29], [6, 20.5, -26], [14, 15.8, -28], [22, 19.2, -26],
    [30, 14.8, -24], [34, 18.6, -22], [-30, 22.0, -23], [-14, 14.0, -27],
    [2, 22.4, -24], [18, 13.8, -27], [10, 16.5, 26], [18, 19.0, 27],
    [24, 15.2, 25], [29, 18.0, 26]
  ];
  voxelStarCoords.forEach(([sx, sy, sz], i) => {
    const sMat = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? '#bae6fd' : '#f8fafc',
      transparent: true,
      opacity: 0.0
    });
    const star = new THREE.Mesh(diamondGeo, sMat);
    star.position.set(sx, sy, sz);
    star.scale.setScalar(0.65 + (i % 4) * 0.22);
    world.voxelStarsGroup.add(star);
    world.voxelStarMats.push({ mat: sMat, mesh: star, phase: i * 0.9 });
  });
  scene.add(world.voxelStarsGroup);

  // ---------------------------------------------------------------------------
  // 2. ISOMETRIC DIORAMA PLINTH, DARK ASPHALT ROADS, CROSSWALKS & PARKS
  // ---------------------------------------------------------------------------
  const islandGroup = new THREE.Group();

  const baseSlab = new THREE.Mesh(
    new THREE.BoxGeometry(86, 2.0, 58),
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.7, metalness: 0.2 })
  );
  baseSlab.position.y = -1.02;
  baseSlab.receiveShadow = true;
  islandGroup.add(baseSlab);

  const plinthBevel = new THREE.Mesh(
    new THREE.BoxGeometry(86.6, 0.35, 58.6),
    slateTrimMat
  );
  plinthBevel.position.y = -0.18;
  islandGroup.add(plinthBevel);

  const trimRing = new THREE.Mesh(
    new THREE.BoxGeometry(86.9, 0.1, 58.9),
    new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.48 })
  );
  trimRing.position.y = -0.34;
  islandGroup.add(trimRing);

  const groundDeck = new THREE.Mesh(new THREE.BoxGeometry(84, 0.1, 56), plazaFloorMat);
  groundDeck.position.y = -0.02;
  groundDeck.receiveShadow = true;
  islandGroup.add(groundDeck);

  // Raised Stone Sidewalk Blocks (strict setbacks around crossRoad x=-17 & mainRoad z=0)
  const sidewalkBlocks = [
    { x: -27.7, z: -13.0, w: 16.6, d: 20.6 },
    { x: -8.6, z: -13.0, w: 11.8, d: 20.6 },
    { x: 4.0, z: -16.8, w: 13.2, d: 13.0 },
    { x: -27.7, z: 13.0, w: 16.6, d: 20.6 },
    { x: -8.0, z: 13.0, w: 13.0, d: 20.6 },
    { x: 19.0, z: 13.8, w: 22.0, d: 19.5 },
    { x: 33.5, z: 13.8, w: 7.5, d: 19.5 }
  ];
  sidewalkBlocks.forEach((b) => {
    const block = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.14, b.d), sidewalkMat);
    block.position.set(b.x, 0.04, b.z);
    block.receiveShadow = true;
    islandGroup.add(block);
  });

  // Rich Emerald Voxel Park Lawns
  const parks = [
    { x: -26.5, z: 13.2, w: 12.5, d: 13.0 },
    { x: 29.0, z: -10.8, w: 18.5, d: 16.5 },
    { x: 31.5, z: 12.0, w: 10.5, d: 13.0 }
  ];
  parks.forEach((p) => {
    const patch = new THREE.Mesh(new THREE.BoxGeometry(p.w, 0.09, p.d), grassMat);
    patch.position.set(p.x, 0.07, p.z);
    patch.receiveShadow = true;
    islandGroup.add(patch);
  });

  // Eco Water Pond
  const pond = new THREE.Mesh(
    new THREE.BoxGeometry(7.0, 0.06, 5.8),
    new THREE.MeshStandardMaterial({ color: '#0ea5e9', roughness: 0.12, metalness: 0.6 })
  );
  pond.position.set(-26.5, 0.09, 13.5);
  islandGroup.add(pond);

  // Dark Asphalt Main East-West Smart Boulevard (z = 0)
  const mainRoad = new THREE.Mesh(new THREE.BoxGeometry(78, 0.05, 5.2), roadMat);
  mainRoad.position.set(0, 0.02, 0);
  mainRoad.receiveShadow = true;
  islandGroup.add(mainRoad);

  // Dark Asphalt Urban Cross Avenue (x = -17)
  const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.05, 48), roadMat);
  crossRoad.position.set(-17, 0.02, 0);
  crossRoad.receiveShadow = true;
  islandGroup.add(crossRoad);

  // Golden-Yellow Dashed Road Centerlines (Matching Reference Diorama Images)
  for (let x = -36; x <= 36; x += 3.2) {
    if (Math.abs(x - -17) < 3.6) continue;
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.02, 0.14), yellowLineMat);
    dash.position.set(x, 0.055, 0);
    islandGroup.add(dash);
  }
  for (let z = -22; z <= 22; z += 3.2) {
    if (Math.abs(z) < 3.6) continue;
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 1.45), yellowLineMat);
    dash.position.set(-17, 0.055, z);
    islandGroup.add(dash);
  }

  // High-Contrast Crisp White 4-Way Zebra Crosswalks at (-17, 0)
  for (let s = -1.6; s <= 1.6; s += 0.64) {
    const stripN = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 1.5), crosswalkMat);
    stripN.position.set(-17 + s, 0.055, -3.5);
    islandGroup.add(stripN);

    const stripS = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 1.5), crosswalkMat);
    stripS.position.set(-17 + s, 0.055, 3.5);
    islandGroup.add(stripS);

    const stripW = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 0.36), crosswalkMat);
    stripW.position.set(-20.4, 0.055, s);
    islandGroup.add(stripW);

    const stripE = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 0.36), crosswalkMat);
    stripE.position.set(-13.6, 0.055, s);
    islandGroup.add(stripE);
  }

  // Anthracite Signal Gantries at the 4-way intersection
  [
    { x: -19.8, z: 3.1, rotY: 0 },
    { x: -14.2, z: -3.1, rotY: Math.PI }
  ].forEach((g) => {
    const gantry = new THREE.Group();
    gantry.position.set(g.x, 0.1, g.z);
    gantry.rotation.y = g.rotY;

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.3, 8), darkMetalMat);
    post.position.y = 1.65;
    gantry.add(post);

    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.1), darkMetalMat);
    bar.position.set(1.2, 3.25, 0);
    gantry.add(bar);

    const sigMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    world.signalLampMats.push(sigMat);
    const sigBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.16), darkMetalMat);
    sigBox.position.set(1.9, 3.15, 0);
    gantry.add(sigBox);

    const sigDot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), sigMat);
    sigDot.position.set(1.9, 3.15, 0.09);
    gantry.add(sigDot);

    islandGroup.add(gantry);
  });

  // Stepped Voxel Trees & Curbside Cubic Hedgerows
  const treeCoords = [
    [-31.5, 9.2, 1.0, 0], [-31.5, 16.5, 0.9, 1], [-21.5, 9.2, 1.1, 0],
    [-13.2, -9.2, 0.95, 1], [-13.4, -15.5, 1.05, 0], [10.0, 11.2, 0.95, 1],
    [11.5, 16.5, 1.05, 0], [26.8, 15.2, 1.0, 1], [23.0, -15.5, 1.05, 0],
    [35.2, -14.8, 1.1, 1], [35.2, -5.2, 0.95, 0], [28.0, 9.2, 1.0, 1],
    [34.5, 12.2, 1.05, 0], [16.5, -8.8, 0.9, 1], [-20.8, -3.2, 0.85, 1],
    [-25.5, 3.4, 0.88, 0], [-14.0, 16.0, 0.95, 1], [-1.2, 11.5, 0.9, 0]
  ];
  treeCoords.forEach(([tx, tz, sc, variant]) => {
    const vTree = createVoxelTree(sc, variant);
    vTree.position.set(tx, 0.1, tz);
    islandGroup.add(vTree);
  });

  // Low Curbside Cubic Voxel Hedges along Smart Boulevard
  [
    [-27.5, -2.9, 2.2, 0.55], [-21.0, 2.9, 2.0, 0.55], [-7.5, -2.9, 2.4, 0.55],
    [12.5, 2.9, 2.2, 0.55], [22.0, -2.9, 2.6, 0.55], [32.5, 2.9, 2.4, 0.55]
  ].forEach(([hx, hz, hw, hd], i) => {
    const hedge = new THREE.Mesh(
      new THREE.BoxGeometry(hw, 0.42, hd),
      i % 2 === 0 ? hedgeDarkMat : hedgeBrightMat
    );
    hedge.position.set(hx, 0.31, hz);
    hedge.castShadow = true;
    islandGroup.add(hedge);
  });

  scene.add(islandGroup);

  // ---------------------------------------------------------------------------
  // 3. ZONE 1: DIORAMA SKYLINE TOWERS, STOREFRONTS, BISTRO & SOLAR FARM
  // ---------------------------------------------------------------------------
  const cityGroup = new THREE.Group();

  const solarFarmPad = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.16, 9.6), slateTrimMat);
  solarFarmPad.position.set(-29.8, 0.09, -14.6);
  solarFarmPad.receiveShadow = true;
  cityGroup.add(solarFarmPad);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const px = -32.75 + col * 1.95;
      const pz = -17.3 + row * 2.7;

      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.75, 8), frameMat);
      pedestal.position.set(px, 0.48, pz);
      cityGroup.add(pedestal);

      const { group, panelGroup } = createSolarPanelMesh(1.65, 1.35, 0.48, solarMat, frameMat);
      group.position.set(px, 0.78, pz);
      cityGroup.add(group);
      world.trackingPanels.push({ panelGroup, baseTilt: 0.48, phase: row * 0.5 + col * 0.3 });
    }
  }

  // Central Smart Grid Battery Hub (-9.5, -12.5)
  const hubGroup = new THREE.Group();
  hubGroup.position.set(-9.5, 0.1, -12.5);

  const hubBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.8, 0.55, 18), slateTrimMat);
  hubBase.position.y = 0.28;
  hubGroup.add(hubBase);

  const hubCore = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 3.2, 18),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.5 })
  );
  hubCore.position.y = 1.95;
  hubCore.castShadow = true;
  hubGroup.add(hubCore);

  for (let i = 0; i < 3; i++) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: i === 1 ? '#10b981' : '#38bdf8',
      transparent: true,
      opacity: 0.92
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.08, 12, 32), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.15 + i * 0.85;
    hubGroup.add(ring);
    world.hubRings.push({ ring, baseY: ring.position.y, phase: i * 1.4 });
  }

  const hubRoofSolar = createSolarPanelMesh(2.4, 2.4, 0.2, solarMat, frameMat);
  hubRoofSolar.group.position.y = 3.56;
  hubGroup.add(hubRoofSolar.group);
  cityGroup.add(hubGroup);

  const storefrontColorHex = {
    '#e11d48': '#ffecd1',
    '#f97316': '#fde68a',
    '#10b981': '#a7f3d0',
    '#38bdf8': '#bae6fd'
  };

  function createBuildingTrimAndStorefront(b) {
    // Stone base plinth
    const basePlinth = new THREE.Mesh(
      new THREE.BoxGeometry(b.w + 0.22, 0.42, b.d + 0.22),
      slateTrimMat
    );
    basePlinth.position.set(b.x, 0.31, b.z);
    basePlinth.receiveShadow = true;
    cityGroup.add(basePlinth);

    // Street-level glowing glass storefront when storefrontAccent is set
    if (b.storefront) {
      const faceDir = b.z < 0 ? 1 : -1;
      const sfColor = storefrontColorHex[b.storefront] || '#fde68a';
      const sfMat = new THREE.MeshStandardMaterial({
        color: '#2d3748',
        emissive: new THREE.Color(sfColor),
        emissiveIntensity: 0.15,
        roughness: 0.2,
        metalness: 0.3
      });
      world.storefrontMats.push(sfMat);

      const glassBand = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.84, 1.15, 0.14), sfMat);
      glassBand.position.set(b.x, 0.98, b.z + faceDir * (b.d / 2 + 0.02));
      cityGroup.add(glassBand);

      if (b.sideStorefront) {
        const sideDir = b.x > -17 ? -1 : 1;
        const sideBand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.15, b.d * 0.78), sfMat);
        sideBand.position.set(b.x + sideDir * (b.w / 2 + 0.02), 0.98, b.z);
        cityGroup.add(sideBand);
      }
    }

    // Hanging voxel greenery balconies on tall eco towers
    if (b.greenBalcony) {
      [0.42, 0.7].forEach((frac, bi) => {
        const gx = b.x + (bi === 0 ? 1 : -1) * (b.w * 0.5 + 0.14);
        const gz = b.z + (bi === 0 ? 0.4 : -0.4);
        const planter = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 1.25), hedgeBrightMat);
        planter.position.set(gx, 0.1 + b.h * frac, gz);
        planter.castShadow = true;
        cityGroup.add(planter);

        const vine = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.75, 0.55), hedgeDarkMat);
        vine.position.set(gx, 0.1 + b.h * frac - 0.38, gz + 0.25);
        cityGroup.add(vine);
      });
    }
  }

  // 13 Stepped Amphitheater Diorama Buildings (Low Foreground, Mid Center, Tall Skyline Back)
  const buildingSpecs = [
    // Front / South Row (low-rise h=3.4..3.8 so camera sees clearly over into intersection & sky)
    { x: -29.6, z: 6.2, w: 3.4, d: 3.4, h: 3.4, palette: 'lavender-bistro', hvac: true },
    { x: -23.6, z: 6.2, w: 3.6, d: 3.4, h: 3.5, palette: 'terracotta-brick', storefront: '#f97316', awning: '#f97316', hvac: true },
    { x: -10.8, z: 6.2, w: 3.8, d: 3.4, h: 3.6, palette: 'lavender-bistro', awning: '#f97316', storefront: '#f97316', sideStorefront: true, bistro: true, hvac: true },
    { x: -5.2, z: 6.4, w: 3.8, d: 3.4, h: 3.8, palette: 'emerald-eco', storefront: '#10b981', awning: '#10b981', hvac: true },
    // Middle Row & South-Back Mid-Rises (h=4.6..6.2)
    { x: -30.0, z: -6.0, w: 3.6, d: 3.6, h: 5.6, palette: 'midnight-tower', hvac: true, crown: true },
    { x: -23.8, z: -6.0, w: 3.8, d: 3.6, h: 4.6, palette: 'emerald-eco', awning: '#38bdf8', storefront: '#38bdf8', badge: true, hvac: true },
    { x: -10.8, z: -6.0, w: 3.8, d: 3.6, h: 4.8, palette: 'terracotta-brick', awning: '#e11d48', storefront: '#e11d48', sideStorefront: true, hvac: true },
    { x: -5.2, z: -6.0, w: 3.6, d: 3.6, h: 5.4, palette: 'purple-modern', storefront: '#e11d48', hvac: true, crown: true },
    { x: -10.8, z: 13.5, w: 3.8, d: 3.6, h: 5.8, palette: 'emerald-eco', hvac: true, crown: true },
    { x: -5.0, z: 13.5, w: 3.8, d: 3.6, h: 6.2, palette: 'terracotta-brick', hvac: true, crown: true },
    // Back / North Skyline Towers (h=9.4..11.6 framing the sky, clouds, sun & moon)
    { x: -22.2, z: -15.2, w: 3.6, d: 3.6, h: 10.4, palette: 'midnight-tower', hvac: true, greenBalcony: true, crown: true },
    { x: -9.5, z: -18.2, w: 4.0, d: 3.6, h: 11.6, palette: 'midnight-tower', hvac: true, greenBalcony: true, crown: true },
    { x: -4.6, z: -15.2, w: 3.8, d: 3.6, h: 9.4, palette: 'purple-modern', hvac: true, greenBalcony: true, crown: true }
  ];

  buildingSpecs.forEach((b, idx) => {
    const texSet = world.windowTex.palettes[b.palette] || world.windowTex;
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: texSet.map,
      emissiveMap: texSet.emissiveMap,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.0,
      roughness: 0.56,
      metalness: 0.14
    });
    world.buildingMaterials.push(mat);

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
    mesh.position.set(b.x, b.h / 2 + 0.1, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cityGroup.add(mesh);

    createBuildingTrimAndStorefront(b);

    const parapet = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.28, 0.3, b.d + 0.28), stoneConcreteMat);
    parapet.position.set(b.x, b.h + 0.24, b.z);
    cityGroup.add(parapet);

    if (b.crown) {
      const penthouse = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.68, 0.75, b.d * 0.68),
        darkMetalMat
      );
      penthouse.position.set(b.x, b.h + 0.68, b.z);
      penthouse.castShadow = true;
      cityGroup.add(penthouse);
    }

    const roofTopY = b.crown ? b.h + 1.06 : b.h + 0.4;
    const solarW = b.crown ? b.w * 0.5 : b.w * 0.58;
    const solarD = b.crown ? b.d * 0.34 : b.d * 0.38;
    const roofSolar = createSolarPanelMesh(solarW, solarD, 0.34, solarMat, frameMat);
    roofSolar.group.position.set(b.x - (b.hvac ? 0.24 : 0), roofTopY, b.z - 0.18);
    cityGroup.add(roofSolar.group);
    world.trackingPanels.push({ panelGroup: roofSolar.panelGroup, baseTilt: 0.34, phase: idx * 0.6 });

    if (b.hvac) {
      const fan = createRooftopFanUnit(stoneConcreteMat, frameMat, b.crown ? 0.3 : 0.38);
      fan.position.set(b.x + b.w * (b.crown ? 0.18 : 0.22), roofTopY - 0.01, b.z + b.d * (b.crown ? 0.16 : 0.2));
      cityGroup.add(fan);
    }

    if (b.awning) {
      const awningMesh = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.88, 0.24, 1.0),
        new THREE.MeshStandardMaterial({ color: b.awning, roughness: 0.42 })
      );
      const faceDir = b.z < 0 ? 1 : -1;
      awningMesh.position.set(b.x, 1.75, b.z + faceDir * (b.d / 2 + 0.45));
      awningMesh.rotation.x = faceDir * 0.24;
      awningMesh.castShadow = true;
      cityGroup.add(awningMesh);
    }

    if (b.bistro) {
      // Glowing turquoise vertical corner blade sign (matching Image 2 corner bistro)
      const bladeMat = new THREE.MeshStandardMaterial({
        color: '#2dd4bf',
        emissive: new THREE.Color('#14b8a6'),
        emissiveIntensity: 0.45,
        roughness: 0.25
      });
      world.storefrontMats.push(bladeMat);
      const bladeSign = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.3, 0.68), bladeMat);
      bladeSign.position.set(b.x - b.w * 0.46, 2.35, b.z - b.d * 0.5 - 0.35);
      cityGroup.add(bladeSign);

      // Outdoor sidewalk cafe terrace seated cleanly on stone sidewalk (z = 3.65, north of mainRoad)
      [-11.6, -10.0].forEach((tx) => {
        const table = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 10), stoneConcreteMat);
        table.position.set(tx, 0.55, 3.65);
        cityGroup.add(table);

        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 6), darkMetalMat);
        leg.position.set(tx, 0.32, 3.65);
        cityGroup.add(leg);

        const lanternMat = new THREE.MeshStandardMaterial({
          color: '#fef08a',
          emissive: new THREE.Color('#f59e0b'),
          emissiveIntensity: 0.35
        });
        world.storefrontMats.push(lanternMat);
        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.14), lanternMat);
        lantern.position.set(tx, 0.67, 3.65);
        cityGroup.add(lantern);
      });
    }

    if (b.badge) {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.9, 0.14),
        new THREE.MeshStandardMaterial({ map: world.badgeTex, roughness: 0.35 })
      );
      sign.position.set(b.x + b.w * 0.32, b.h - 0.9, b.z + b.d / 2 + 0.08);
      cityGroup.add(sign);
    }
  });

  scene.add(cityGroup);

  // ---------------------------------------------------------------------------
  // 4. SMART-CITY-LED STREETLAMPS WITH WARM AMBER POOLS
  // ---------------------------------------------------------------------------
  const lampGroup = new THREE.Group();
  const coneGeo = new THREE.ConeGeometry(1.75, 4.3, 16, 1, true);
  coneGeo.translate(0, -2.15, 0);
  const poolGeo = new THREE.CircleGeometry(2.1, 20);
  poolGeo.rotateX(-Math.PI / 2);

  function addStreetLamp(x, z, armDirZ) {
    const poleUnit = new THREE.Group();
    poleUnit.position.set(x, 0.08, z);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 4.3, 8), darkMetalMat);
    mast.position.y = 2.15;
    mast.castShadow = true;
    poleUnit.add(mast);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.15), darkMetalMat);
    arm.position.set(0, 4.25, armDirZ * 0.55);
    poleUnit.add(arm);

    const microSolar = createSolarPanelMesh(0.65, 0.45, 0.25, solarMat, frameMat);
    microSolar.group.position.set(0, 4.42, 0);
    poleUnit.add(microSolar.group);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: '#fff3c4',
      emissive: new THREE.Color('#ffb703'),
      emissiveIntensity: 0.0
    });
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.52), bulbMat);
    bulb.position.set(0, 4.18, armDirZ * 0.98);
    poleUnit.add(bulb);

    const coneMat = new THREE.MeshBasicMaterial({
      color: '#ffd166',
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 4.15, armDirZ * 0.98);
    poleUnit.add(cone);

    const poolMat = new THREE.MeshBasicMaterial({
      color: '#ffb703',
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.set(0, 0.065, armDirZ * 0.95);
    poleUnit.add(pool);

    lampGroup.add(poleUnit);
    world.streetLamps.push({ bulbMat, coneMat, poolMat });
  }

  const lampXPositions = [-30, -22, -12.5, -5, 28, 34];
  lampXPositions.forEach((lx, i) => {
    if (lx !== 24) addStreetLamp(lx, 2.8, -1);
    if (i % 2 === 0 && lx !== 3 && lx !== 28) {
      addStreetLamp(lx, -2.8, 1);
    }
  });
  scene.add(lampGroup);

  // ---------------------------------------------------------------------------
  // 5. ZONE 2: SOLAR EV CHARGING HUB (x = 4, z = -6.0)
  // ---------------------------------------------------------------------------
  const stationGroup = new THREE.Group();
  stationGroup.position.set(4, 0.04, -6.0);

  const stationApron = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.06, 8.4), roadMat);
  stationApron.position.set(0, 0.0, 2.0);
  stationApron.receiveShadow = true;
  stationGroup.add(stationApron);

  world.stationBayRingMat = new THREE.MeshBasicMaterial({
    color: '#10b981',
    transparent: true,
    opacity: 0.35
  });
  const bayOutline = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.03, 2.7), world.stationBayRingMat);
  bayOutline.position.set(0, 0.045, 0.8);
  stationGroup.add(bayOutline);

  [-4.2, 4.2].forEach((px) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.4, 0.45), slateTrimMat);
    pillar.position.set(px, 2.2, -1.5);
    pillar.castShadow = true;
    stationGroup.add(pillar);
  });

  const canopyRoof = new THREE.Group();
  canopyRoof.position.set(0, 4.45, 0.2);
  canopyRoof.rotation.x = 0.2;

  const canopyDeck = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.24, 5.8), stoneConcreteMat);
  canopyDeck.castShadow = true;
  canopyRoof.add(canopyDeck);

  const canopyLed = new THREE.Mesh(
    new THREE.BoxGeometry(12.25, 0.08, 5.85),
    new THREE.MeshBasicMaterial({ color: '#38bdf8' })
  );
  canopyLed.position.y = -0.14;
  canopyRoof.add(canopyLed);

  const canopySolarL = createSolarPanelMesh(5.4, 4.8, 0.0, solarMat, frameMat);
  canopySolarL.group.position.set(-2.9, 0.14, 0);
  canopyRoof.add(canopySolarL.group);

  const canopySolarR = createSolarPanelMesh(5.4, 4.8, 0.0, solarMat, frameMat);
  canopySolarR.group.position.set(2.9, 0.14, 0);
  canopyRoof.add(canopySolarR.group);

  stationGroup.add(canopyRoof);

  // Illuminated Fascia Sign: "Neo Bornes de recharge"
  world.stationSignMat = new THREE.MeshStandardMaterial({
    map: world.stationSignTex,
    emissiveMap: world.stationSignTex,
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: 0.55,
    roughness: 0.25
  });
  const stationSignHousing = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 1.18, 0.24),
    darkMetalMat
  );
  stationSignHousing.position.set(0, 4.22, 3.12);
  stationSignHousing.castShadow = true;
  stationGroup.add(stationSignHousing);

  const stationSignFront = new THREE.Mesh(
    new THREE.PlaneGeometry(6.95, 0.98),
    world.stationSignMat
  );
  stationSignFront.position.set(0, 4.22, 3.25);
  stationGroup.add(stationSignFront);

  const stationSignBack = new THREE.Mesh(
    new THREE.PlaneGeometry(6.95, 0.98),
    world.stationSignMat
  );
  stationSignBack.position.set(0, 4.22, 2.99);
  stationSignBack.rotation.y = Math.PI;
  stationGroup.add(stationSignBack);

  [-3.8, 0.0, 3.8].forEach((cx) => {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.85, 0.48), stoneConcreteMat);
    ped.position.set(cx, 0.92, -1.2);
    ped.castShadow = true;
    stationGroup.add(ped);

    const statusMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    world.stationStatusMats.push(statusMat);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.52), statusMat);
    screen.position.set(cx, 1.32, -1.2);
    stationGroup.add(screen);
  });

  const parkedCarL = createStylizedVehicle('#38bdf8', 'car', world.vehicleLightMats);
  parkedCarL.position.set(-3.8, 0.03, 0.85);
  stationGroup.add(parkedCarL);

  const parkedCarR = createStylizedVehicle('#f8fafc', 'car', world.vehicleLightMats);
  parkedCarR.position.set(3.8, 0.03, 0.85);
  stationGroup.add(parkedCarR);

  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.25, 1.2, -1.0),
    new THREE.Vector3(0.7, 0.7, -0.3),
    new THREE.Vector3(0.5, 0.65, 0.45)
  ]);
  const cableMesh = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 16, 0.045, 8, false), darkMetalMat);
  stationGroup.add(cableMesh);

  world.stationLight = new THREE.PointLight('#7dd3fc', 0.5, 16);
  world.stationLight.position.set(0, 3.8, 0.6);
  stationGroup.add(world.stationLight);

  scene.add(stationGroup);

  // ---------------------------------------------------------------------------
  // 6. ZONE 3: SUBURBAN SMART HOME / VILLA (x = 29, z = -10.5)
  // ---------------------------------------------------------------------------
  const homeGroup = new THREE.Group();
  homeGroup.position.set(29.0, 0.05, -10.5);

  const driveway = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.06, 5.6), roadMat);
  driveway.position.set(0, 0.02, 5.1);
  driveway.receiveShadow = true;
  homeGroup.add(driveway);

  const homePad = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.03, 4.8),
    new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.28 })
  );
  homePad.position.set(0, 0.055, 5.1);
  homeGroup.add(homePad);

  const plasterMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.65 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#c48352', roughness: 0.72 });

  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(8.4, 2.8, 5.6), plasterMat);
  lowerBody.position.set(0, 1.45, -0.5);
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  homeGroup.add(lowerBody);

  const upperBody = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.4, 5.0), woodMat);
  upperBody.position.set(-0.6, 3.95, -0.6);
  upperBody.castShadow = true;
  homeGroup.add(upperBody);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.28, 5.6), darkMetalMat);
  roof.position.set(-0.6, 5.3, -0.6);
  roof.rotation.x = 0.2;
  roof.castShadow = true;
  homeGroup.add(roof);

  const homeSolarL = createSolarPanelMesh(2.6, 3.6, 0.0, solarMat, frameMat);
  homeSolarL.group.position.set(-1.5, 0.14, 0.0);
  const homeSolarR = createSolarPanelMesh(2.6, 3.6, 0.0, solarMat, frameMat);
  homeSolarR.group.position.set(1.5, 0.14, 0.0);
  roof.add(homeSolarL.group, homeSolarR.group);

  world.homeWindowMat = new THREE.MeshStandardMaterial({
    color: '#9db4c8',
    emissive: new THREE.Color('#ffbe55'),
    emissiveIntensity: 0.0,
    roughness: 0.15,
    metalness: 0.25
  });

  [
    { x: -2.2, y: 1.5, z: 2.33, w: 2.4, h: 1.7, d: 0.1 },
    { x: 1.8, y: 1.5, z: 2.33, w: 2.0, h: 1.7, d: 0.1 },
    { x: -1.4, y: 3.95, z: 1.93, w: 3.4, h: 1.35, d: 0.1 },
    { x: 4.23, y: 1.55, z: -0.5, w: 0.1, h: 1.6, d: 2.2 }
  ].forEach((ws) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(ws.w, ws.h, ws.d), world.homeWindowMat);
    win.position.set(ws.x, ws.y, ws.z);
    homeGroup.add(win);
  });

  const wallBattery = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.6, 0.35),
    new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.3, metalness: 0.3 })
  );
  wallBattery.position.set(2.8, 1.4, 2.45);
  wallBattery.castShadow = true;
  homeGroup.add(wallBattery);

  for (let b = 0; b < 4; b++) {
    const barMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.14, 0.38), barMat);
    bar.position.set(2.8, 0.95 + b * 0.28, 2.45);
    homeGroup.add(bar);
    world.homeWallBatteryBars.push({ barMat, index: b });
  }

  [-2.5, 2.5].forEach((gx) => {
    [3.0, 5.2, 7.4].forEach((gz) => {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.65, 8), darkMetalMat);
      bollard.position.set(gx, 0.35, gz);
      homeGroup.add(bollard);

      const capMat = new THREE.MeshStandardMaterial({
        color: '#fde68a',
        emissive: new THREE.Color('#fbbf24'),
        emissiveIntensity: 0.0
      });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 8), capMat);
      cap.position.set(gx, 0.71, gz);
      homeGroup.add(cap);
      world.streetLamps.push({ bulbMat: capMat, coneMat: null, poolMat: null });
    });
  });

  world.homeInteriorLight = new THREE.PointLight('#ffba52', 0.0, 22);
  world.homeInteriorLight.position.set(0, 2.8, 3.8);
  homeGroup.add(world.homeInteriorLight);

  scene.add(homeGroup);

  // ---------------------------------------------------------------------------
  // 7. ZONE 4: FLAGSHIP "SMART-CITY-LED.COM · NEO CLIM®" BOUTIQUE VITRINE
  // ---------------------------------------------------------------------------
  const storeGroup = new THREE.Group();
  storeGroup.position.set(19.5, 0.05, 12.2);

  // Customer driveway & plaza connecting z=0 boulevard to left parking & showroom sidewalk
  const storeApron = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.07, 10.2), roadMat);
  storeApron.position.set(-1.5, 0.02, -6.2);
  storeApron.receiveShadow = true;
  storeGroup.add(storeApron);

  // Raised crisp storefront sidewalk apron in front of the glass vitrine
  const storeSidewalk = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.12, 3.2), sidewalkMat);
  storeSidewalk.position.set(0, 0.06, -4.4);
  storeSidewalk.receiveShadow = true;
  storeGroup.add(storeSidewalk);

  // Glowing Icy-Cyan Customer Parking Bay on left side at world (14.2, 0.05, 5.4) -> local (-5.3, 0.06, -6.8)
  world.storeBayRingMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    transparent: true,
    opacity: 0.35
  });
  const storeBayPad = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, 4.8), world.storeBayRingMat);
  storeBayPad.position.set(-5.3, 0.06, -6.8);
  storeGroup.add(storeBayPad);

  // Recessed Illuminated Showroom Interior Shell (Back Wall + Left/Right Walls + Roof)
  const interiorMat = new THREE.MeshStandardMaterial({
    color: '#f8fbff',
    emissive: new THREE.Color('#ccecff'),
    emissiveIntensity: 0.35,
    roughness: 0.5
  });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(11.6, 4.9, 0.5), slateTrimMat);
  backWall.position.set(0, 2.5, 2.75);
  backWall.castShadow = true;
  storeGroup.add(backWall);

  const innerBackdrop = new THREE.Mesh(new THREE.BoxGeometry(10.6, 4.0, 0.15), interiorMat);
  innerBackdrop.position.set(0, 2.15, 2.38);
  storeGroup.add(innerBackdrop);

  const innerFloor = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.14, 5.4), interiorMat);
  innerFloor.position.set(0, 0.12, 0.0);
  storeGroup.add(innerFloor);

  [-5.6, 5.6].forEach((sx) => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.9, 5.8), slateTrimMat);
    sideWall.position.set(sx, 2.5, 0.0);
    sideWall.castShadow = true;
    storeGroup.add(sideWall);
  });

  // Architectural roof slab
  const storeRoof = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.65, 6.0), slateTrimMat);
  storeRoof.position.set(0, 4.75, 0.0);
  storeRoof.castShadow = true;
  storeGroup.add(storeRoof);

  // Store Rooftop Solar Array powering showroom & AC display
  const storeSolarL = createSolarPanelMesh(4.6, 3.4, 0.25, solarMat, frameMat);
  storeSolarL.group.position.set(-2.7, 5.08, 0.8);
  storeGroup.add(storeSolarL.group);

  const storeSolarR = createSolarPanelMesh(4.6, 3.4, 0.25, solarMat, frameMat);
  storeSolarR.group.position.set(2.7, 5.08, 0.8);
  storeGroup.add(storeSolarR.group);

  // Slim architectural cornice canopy above vitrine (keeps entire glass display 100% open)
  const storeCanopy = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.22, 1.15), stoneConcreteMat);
  storeCanopy.position.set(0, 4.38, -3.35);
  storeCanopy.castShadow = true;
  storeGroup.add(storeCanopy);

  const storeCanopyTrim = new THREE.Mesh(
    new THREE.BoxGeometry(11.86, 0.08, 1.2),
    new THREE.MeshBasicMaterial({ color: '#38bdf8' })
  );
  storeCanopyTrim.position.set(0, 4.25, -3.35);
  storeGroup.add(storeCanopyTrim);

  // Architectural window mullions framing the tall glass vitrine
  [-5.2, 0.0, 5.2].forEach((mx) => {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.15, 0.16), darkMetalMat);
    mullion.position.set(mx, 2.2, -2.8);
    storeGroup.add(mullion);
  });

  // Crystal-Clear See-Through Glass Vitrine Pane
  world.storeWindowMat = new THREE.MeshStandardMaterial({
    color: '#e0f4ff',
    emissive: new THREE.Color('#38bdf8'),
    emissiveIntensity: 0.08,
    transparent: true,
    opacity: 0.14,
    roughness: 0.05,
    metalness: 0.25,
    depthWrite: false
  });
  const storeGlass = new THREE.Mesh(new THREE.BoxGeometry(10.5, 4.1, 0.06), world.storeWindowMat);
  storeGlass.position.set(0, 2.2, -2.82);
  storeGroup.add(storeGlass);

  // INSIDE VITRINE (Left-Center): Display Plinth + 3D Vertical White Portable NEO Clim® AC
  const acPlinth = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 1.8), stoneConcreteMat);
  acPlinth.position.set(-2.2, 0.3, -0.75);
  storeGroup.add(acPlinth);

  const mobileAc = createMobileAcUnitMesh(1.52);
  mobileAc.unit.position.set(-2.2, 0.45, -0.75);
  mobileAc.unit.rotation.y = Math.PI - 0.24; // Angled slightly toward shopper & camera
  storeGroup.add(mobileAc.unit);
  world.storeAcWaves.push(...mobileAc.waves);

  // INSIDE VITRINE (Right-Center): Full-Height Illuminated NEO Clim Location Poster
  const posterFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.65, 0.14), darkMetalMat);
  posterFrame.position.set(2.2, 2.02, -0.55);
  storeGroup.add(posterFrame);

  const posterMat = new THREE.MeshStandardMaterial({
    map: world.storePosterTex,
    emissiveMap: world.storePosterTex,
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: 0.72,
    roughness: 0.2
  });
  const posterFace = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.45), posterMat);
  posterFace.position.set(2.2, 2.02, -0.63);
  posterFace.rotation.y = Math.PI; // Faces -Z directly out the vitrine!
  storeGroup.add(posterFace);

  // OUTSIDE VITRINE ON SIDEWALK: 3D Shopper Character admiring the vitrine & NEO Clim AC!
  const shopper = createPedestrian('#0ea5e9');
  shopper.scale.setScalar(1.62);
  shopper.position.set(-0.6, 0.12, -4.45);
  shopper.rotation.y = 0; // Local +Z faces toward store (+Z in storeGroup)!
  storeGroup.add(shopper);
  world.storeShopper = shopper;

  // Illuminated Roof Billboard: "SMART-CITY-LED.COM / NEO CLIM® · SOLAR & MOBILE AC"
  world.storeSignMat = new THREE.MeshStandardMaterial({
    map: world.storeSignTex,
    emissiveMap: world.storeSignTex,
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: 0.6,
    roughness: 0.25
  });
  const signHousing = new THREE.Mesh(new THREE.BoxGeometry(10.4, 2.45, 0.35), darkMetalMat);
  signHousing.position.set(0, 6.45, -2.55);
  signHousing.castShadow = true;
  storeGroup.add(signHousing);

  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(10.0, 2.2), world.storeSignMat);
  signFace.position.set(0, 6.45, -2.74);
  signFace.rotation.y = Math.PI;
  storeGroup.add(signFace);

  // Bright Interior Showroom Spot Light illuminating AC unit, poster & glass
  world.storeInteriorLight = new THREE.PointLight('#f0faff', 3.2, 26);
  world.storeInteriorLight.position.set(-1.2, 3.6, -1.6);
  storeGroup.add(world.storeInteriorLight);

  scene.add(storeGroup);

  // ---------------------------------------------------------------------------
  // 8. ANIMATED HERO ELECTRIC VEHICLE (EV) — Local Front is +Z
  // ---------------------------------------------------------------------------
  const evCar = new THREE.Group();

  const carBodyMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.2,
    metalness: 0.5
  });
  const carRoofMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.25,
    metalness: 0.45
  });
  const cabinGlassMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.1,
    metalness: 0.85
  });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.48, 3.95), carBodyMat);
  chassis.position.y = 0.5;
  chassis.castShadow = true;
  evCar.add(chassis);

  // Dark aero lower splitter & side skirts
  const lowerSplitter = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.14, 4.02), darkMetalMat);
  lowerSplitter.position.y = 0.24;
  evCar.add(lowerSplitter);

  const accentStrip = new THREE.Mesh(
    new THREE.BoxGeometry(1.83, 0.08, 3.35),
    new THREE.MeshBasicMaterial({ color: '#38bdf8' })
  );
  accentStrip.position.y = 0.42;
  evCar.add(accentStrip);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.44, 2.15), cabinGlassMat);
  cabin.position.set(0, 0.94, -0.15);
  cabin.castShadow = true;
  evCar.add(cabin);

  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.09, 1.75), carRoofMat);
  roofCap.position.set(0, 1.18, -0.18);
  evCar.add(roofCap);

  // Compact aerodynamic side mirrors
  [-0.96, 0.96].forEach((mx) => {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.18), darkMetalMat);
    mirror.position.set(mx, 0.78, 0.55);
    evCar.add(mirror);
  });

  world.evChargeRingMat = new THREE.MeshBasicMaterial({
    color: '#10b981',
    transparent: true,
    opacity: 0.0
  });
  const chargeRing = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.045, 8, 24), world.evChargeRingMat);
  chargeRing.rotation.x = Math.PI / 2;
  chargeRing.position.set(0, 1.25, -0.18);
  evCar.add(chargeRing);

  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.85 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.8, roughness: 0.25 });

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

  world.evHeadlightMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: new THREE.Color('#e0f2fe'),
    emissiveIntensity: 0.25
  });
  const headlightBar = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.12, 0.08), world.evHeadlightMat);
  headlightBar.position.set(0, 0.56, 1.98);
  evCar.add(headlightBar);

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
    beam.position.set(hx, 0.56, 2.02);
    evCar.add(beam);
    world.evHeadlightCones.push(beamMat);
  });

  world.evHeadlightSpot = new THREE.PointLight('#bae6fd', 0.0, 14);
  world.evHeadlightSpot.position.set(0, 0.8, 3.2);
  evCar.add(world.evHeadlightSpot);

  world.evTaillightMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    emissive: new THREE.Color('#ff2a2a'),
    emissiveIntensity: 0.35
  });
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.11, 0.08), world.evTaillightMat);
  tailBar.position.set(0, 0.6, -1.98);
  evCar.add(tailBar);

  evCar.position.set(-26, 0.05, 1.15);
  evCar.rotation.y = Math.PI / 2;
  scene.add(evCar);
  world.evCar = evCar;

  // ---------------------------------------------------------------------------
  // 9. AMBIENT CITY TRAFFIC (BUSES, DELIVERY TRUCK, TAXIS & EVs) & PEDESTRIANS
  // ---------------------------------------------------------------------------
  const trafficSpecs = [
    { color: '#f59e0b', type: 'bus', len: 4.6, axis: 'z', lane: -18.15, dir: 1, min: -22, max: 22, pos: -16, speed: 3.8 },
    { color: '#38bdf8', type: 'car', len: 3.2, axis: 'z', lane: -18.15, dir: 1, min: -22, max: 22, pos: 8, speed: 3.8 },
    { color: '#facc15', type: 'taxi', len: 3.2, axis: 'z', lane: -15.85, dir: -1, min: -22, max: 22, pos: 15, speed: 4.0 },
    { color: '#ef4444', type: 'truck', len: 4.3, axis: 'z', lane: -15.85, dir: -1, min: -22, max: 22, pos: -9, speed: 4.0 },
    { color: '#fb923c', type: 'bus', len: 4.6, axis: 'x', lane: -1.35, dir: -1, min: -36, max: 35, pos: 24, speed: 4.2 },
    { color: '#facc15', type: 'taxi', len: 3.2, axis: 'x', lane: -1.35, dir: -1, min: -36, max: 35, pos: 0, speed: 4.2 },
    { color: '#f43f5e', type: 'car', len: 3.2, axis: 'x', lane: -1.35, dir: -1, min: -36, max: 35, pos: -22, speed: 4.2 }
  ];

  trafficSpecs.forEach((spec) => {
    const mesh = createStylizedVehicle(spec.color, spec.type, world.vehicleLightMats);
    mesh.position.y = 0.04;
    if (spec.axis === 'z') {
      mesh.position.set(spec.lane, 0.04, spec.pos);
      mesh.rotation.y = spec.dir > 0 ? 0 : Math.PI;
    } else {
      mesh.position.set(spec.pos, 0.04, spec.lane);
      mesh.rotation.y = spec.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    scene.add(mesh);
    world.trafficVehicles.push({ mesh, ...spec });
  });

  const pedColors = ['#f97316', '#0ea5e9', '#10b981', '#eab308', '#ec4899', '#6366f1'];
  const pedRoutes = [
    { x0: -26, z0: 3.3, x1: -19.8, z1: 3.3, speed: 0.18 },
    { x0: -14.2, z0: 3.3, x1: -6, z1: 3.3, speed: 0.16 },
    { x0: -26, z0: -3.3, x1: -19.8, z1: -3.3, speed: 0.15 },
    { x0: -14.2, z0: -3.3, x1: -6, z1: -3.3, speed: 0.19 },
    { x0: -19.8, z0: -14, x1: -19.8, z1: -4.2, speed: 0.14 },
    { x0: -14.2, z0: 4.2, x1: -14.2, z1: 14, speed: 0.15 },
    { x0: 27.5, z0: 8.5, x1: 35.0, z1: 8.5, speed: 0.14 },
    { x0: -19.8, z0: 4.2, x1: -19.8, z1: 13, speed: 0.16 },
    { x0: -14.2, z0: -13, x1: -14.2, z1: -4.2, speed: 0.14 },
    { x0: -3.5, z0: 3.3, x1: 4.0, z1: 3.3, speed: 0.15 }
  ];

  pedRoutes.forEach((route, i) => {
    const mesh = createPedestrian(pedColors[i % pedColors.length]);
    mesh.position.set(route.x0, 0.1, route.z0);
    scene.add(mesh);
    world.pedestrians.push({ mesh, ...route, phase: i * 0.43 });
  });

  // ---------------------------------------------------------------------------
  // 10. ANIMATED 3D ENERGY CONDUITS & PARTICLE STREAMS
  // ---------------------------------------------------------------------------
  const energyGroup = new THREE.Group();

  // Stage 1: City Flows
  [
    [new THREE.Vector3(-29.8, 1.3, -14.6), new THREE.Vector3(-18.5, 2.5, -13.5), new THREE.Vector3(-9.5, 2.1, -12.5)],
    [new THREE.Vector3(-9.5, 2.1, -12.5), new THREE.Vector3(-16.0, 3.2, -9.2), new THREE.Vector3(-23.8, 4.8, -6.0)],
    [new THREE.Vector3(-9.5, 2.1, -12.5), new THREE.Vector3(-10.2, 3.0, -9.2), new THREE.Vector3(-10.8, 4.9, -6.0)],
    [new THREE.Vector3(-9.5, 2.1, -12.5), new THREE.Vector3(-10.2, 3.4, -2.0), new THREE.Vector3(-10.8, 4.0, 6.2)],
    [new THREE.Vector3(-9.5, 2.1, -12.5), new THREE.Vector3(-17.0, 2.9, -2.5), new THREE.Vector3(-23.6, 3.8, 6.2)],
    [new THREE.Vector3(-9.5, 2.1, -12.5), new THREE.Vector3(-7.4, 3.4, -3.0), new THREE.Vector3(-5.2, 4.0, 6.4)]
  ].forEach((pts) => {
    const stream = createEnergyStream(pts, '#0ea5e9', 7, 0.06);
    energyGroup.add(stream.group);
    world.cityFlows.push(stream);
  });

  // Stage 2: Solar EV Station Flows
  [
    [new THREE.Vector3(1.5, 4.7, -5.8), new THREE.Vector3(3.2, 3.6, -7.0), new THREE.Vector3(4.0, 1.8, -7.2), new THREE.Vector3(4.0, 0.8, -5.2)],
    [new THREE.Vector3(6.5, 4.7, -5.8), new THREE.Vector3(4.8, 3.6, -7.0), new THREE.Vector3(4.0, 1.8, -7.2), new THREE.Vector3(4.0, 0.8, -5.2)]
  ].forEach((pts) => {
    const stream = createEnergyStream(pts, '#10b981', 9, 0.075);
    energyGroup.add(stream.group);
    world.stationFlows.push(stream);
  });

  // Stage 3: Smart Home Evening Flows (Solar Roof -> Wall Battery -> Home & Charges EV!)
  [
    [new THREE.Vector3(29.8, 5.6, -10.8), new THREE.Vector3(32.5, 4.0, -9.2), new THREE.Vector3(31.8, 1.6, -8.0)],
    [new THREE.Vector3(31.8, 1.5, -8.0), new THREE.Vector3(30.2, 1.8, -8.2), new THREE.Vector3(28.5, 2.2, -9.5)],
    // Wall Battery & Solar Storage -> Charges Parked EV in Driveway!
    [new THREE.Vector3(31.8, 1.4, -8.0), new THREE.Vector3(30.8, 1.1, -6.5), new THREE.Vector3(29.0, 0.7, -5.4)]
  ].forEach((pts) => {
    const stream = createEnergyStream(pts, '#fbbf24', 8, 0.065);
    energyGroup.add(stream.group);
    world.homeFlows.push(stream);
  });

  // Stage 4: Flagship Smart-City-Led.com · NEO CLIM® Store Solar Cooling Streams
  [
    // Store solar roof -> Vertical Portable NEO Clim AC inside Vitrine
    [new THREE.Vector3(16.8, 5.4, 13.0), new THREE.Vector3(17.1, 3.6, 11.8), new THREE.Vector3(17.3, 1.9, 11.3)],
    // Store solar roof -> Showroom Poster & Left Customer Parking Bay
    [new THREE.Vector3(22.2, 5.4, 13.0), new THREE.Vector3(21.8, 3.6, 11.8), new THREE.Vector3(18.5, 2.2, 9.6), new THREE.Vector3(14.2, 1.1, 5.4)]
  ].forEach((pts) => {
    const stream = createEnergyStream(pts, '#00e5ff', 9, 0.07);
    energyGroup.add(stream.group);
    world.storeFlows.push(stream);
  });

  scene.add(energyGroup);

  return world;
}
