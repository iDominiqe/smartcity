import * as THREE from 'three';
import {
  createSolarTexture,
  createMaquetteWindowTextures,
  createBadgeTexture,
  createStoreSignTexture,
  createSolarPanelMesh,
  createRooftopFanUnit,
  createAcUnitMesh,
  createEnergyStream,
  createStylizedVehicle,
  createPedestrian
} from './scene/textures-helpers.js';

/**
 * Builds the Modular V3 Architectural White Maquette Smart-City-Led.com 3D world
 * including Zone 4: Smart-City-Led.com · NEO CLIM® Flagship Store.
 */
export function buildSmartCityWorld(scene) {
  const world = {
    solarTex: createSolarTexture(),
    windowTex: createMaquetteWindowTextures(),
    badgeTex: createBadgeTexture('C', '#2563eb'),
    storeSignTex: createStoreSignTexture(),
    trackingPanels: [],
    streetLamps: [],
    buildingMaterials: [],
    signalLampMats: [],
    cityFlows: [],
    stationFlows: [],
    homeFlows: [],
    storeFlows: [],
    storeFans: [],
    storeWindowMat: null,
    storeSignMat: null,
    storeBayRingMat: null,
    storeInteriorLight: null,
    acPickupBox: null,
    trafficVehicles: [],
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
    dirLight: null,
    hemiLight: null,
    ambientLight: null
  };

  // Shared Maquette Materials
  const solarMat = new THREE.MeshStandardMaterial({
    map: world.solarTex,
    roughness: 0.22,
    metalness: 0.65,
    emissive: new THREE.Color('#0a2957'),
    emissiveIntensity: 0.28
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.35,
    metalness: 0.6
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.42,
    metalness: 0.6
  });

  const whiteMaquetteMat = new THREE.MeshStandardMaterial({
    color: '#f5f7fa',
    roughness: 0.72,
    metalness: 0.05
  });

  const lightStoneMat = new THREE.MeshStandardMaterial({
    color: '#e6ebf2',
    roughness: 0.78,
    metalness: 0.04
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: '#f2f5f9',
    roughness: 0.82,
    metalness: 0.02
  });

  const roadMat = new THREE.MeshStandardMaterial({
    color: '#cfd7e3',
    roughness: 0.8,
    metalness: 0.06
  });

  const crosswalkMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

  const laneLineMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.75
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: '#b6dfc9',
    roughness: 0.88,
    metalness: 0.02
  });

  // ---------------------------------------------------------------------------
  // 1. BRIGHT SUNLIGHT, MOON, & STARFIELD
  // ---------------------------------------------------------------------------
  world.ambientLight = new THREE.AmbientLight('#ffffff', 0.55);
  scene.add(world.ambientLight);

  world.hemiLight = new THREE.HemisphereLight('#ffffff', '#dde4ee', 1.35);
  scene.add(world.hemiLight);

  world.dirLight = new THREE.DirectionalLight('#fff8eb', 2.4);
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
    new THREE.SphereGeometry(2.8, 24, 24),
    new THREE.MeshBasicMaterial({ color: '#ffe599' })
  );
  scene.add(world.sunMesh);

  world.moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.9, 24, 24),
    new THREE.MeshBasicMaterial({ color: '#e2ecff' })
  );
  scene.add(world.moonMesh);

  const starCount = 900;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.85 + 0.12);
    const r = 125 + Math.random() * 20;
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

  // ---------------------------------------------------------------------------
  // 2. ARCHITECTURAL MAQUETTE ISLAND, SIDEWALKS, CROSSWALKS & PARKS
  // ---------------------------------------------------------------------------
  const islandGroup = new THREE.Group();

  const baseSlab = new THREE.Mesh(
    new THREE.BoxGeometry(86, 1.8, 58),
    new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.65, metalness: 0.15 })
  );
  baseSlab.position.y = -0.92;
  baseSlab.receiveShadow = true;
  islandGroup.add(baseSlab);

  const trimRing = new THREE.Mesh(
    new THREE.BoxGeometry(86.3, 0.14, 58.3),
    new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.6 })
  );
  trimRing.position.y = -0.15;
  islandGroup.add(trimRing);

  const groundDeck = new THREE.Mesh(new THREE.BoxGeometry(84, 0.1, 56), lightStoneMat);
  groundDeck.position.y = -0.02;
  groundDeck.receiveShadow = true;
  islandGroup.add(groundDeck);

  // Raised sidewalks
  const sidewalkBlocks = [
    { x: -27.5, z: -13.0, w: 16.5, d: 20.5 },
    { x: -5.5, z: -13.0, w: 18.5, d: 20.5 },
    { x: -27.5, z: 13.0, w: 16.5, d: 20.5 },
    { x: -5.5, z: 13.0, w: 18.5, d: 20.5 },
    { x: 19.0, z: 13.8, w: 22.0, d: 19.5 },
    { x: 33.5, z: 13.8, w: 7.5, d: 19.5 }
  ];
  sidewalkBlocks.forEach((b) => {
    const block = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.12, b.d), sidewalkMat);
    block.position.set(b.x, 0.04, b.z);
    block.receiveShadow = true;
    islandGroup.add(block);
  });

  // Soft Mint-Green Park Lawns
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
    new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.12, metalness: 0.55 })
  );
  pond.position.set(-26.5, 0.09, 13.5);
  islandGroup.add(pond);

  // Main East-West Smart Boulevard (z = 0)
  const mainRoad = new THREE.Mesh(new THREE.BoxGeometry(78, 0.05, 5.2), roadMat);
  mainRoad.position.set(0, 0.02, 0);
  mainRoad.receiveShadow = true;
  islandGroup.add(mainRoad);

  // Urban Cross Avenue (x = -17)
  const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.05, 48), roadMat);
  crossRoad.position.set(-17, 0.02, 0);
  crossRoad.receiveShadow = true;
  islandGroup.add(crossRoad);

  // Dashed white centerlines
  for (let x = -36; x <= 36; x += 3.2) {
    if (Math.abs(x - -17) < 3.6) continue;
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.12), laneLineMat);
    dash.position.set(x, 0.055, 0);
    islandGroup.add(dash);
  }
  for (let z = -22; z <= 22; z += 3.2) {
    if (Math.abs(z) < 3.6) continue;
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 1.4), laneLineMat);
    dash.position.set(-17, 0.055, z);
    islandGroup.add(dash);
  }

  // Crisp 4-Way Zebra Crosswalks at (-17, 0)
  for (let s = -1.6; s <= 1.6; s += 0.64) {
    const stripN = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 1.4), crosswalkMat);
    stripN.position.set(-17 + s, 0.055, -3.5);
    islandGroup.add(stripN);

    const stripS = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 1.4), crosswalkMat);
    stripS.position.set(-17 + s, 0.055, 3.5);
    islandGroup.add(stripS);

    const stripW = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.36), crosswalkMat);
    stripW.position.set(-20.4, 0.055, s);
    islandGroup.add(stripW);

    const stripE = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.36), crosswalkMat);
    stripE.position.set(-13.6, 0.055, s);
    islandGroup.add(stripE);
  }

  // Overhead White Signal Gantries at the 4-way intersection
  [
    { x: -19.8, z: 3.1, rotY: 0 },
    { x: -14.2, z: -3.1, rotY: Math.PI }
  ].forEach((g) => {
    const gantry = new THREE.Group();
    gantry.position.set(g.x, 0.1, g.z);
    gantry.rotation.y = g.rotY;

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.3, 8), whiteMaquetteMat);
    post.position.y = 1.65;
    gantry.add(post);

    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.1), whiteMaquetteMat);
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

  // Sculpted White & Mint Architectural Maquette Trees
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.7 });
  const maquetteTreeMat = new THREE.MeshStandardMaterial({ color: '#e6edf4', roughness: 0.8 });
  const mintTreeMat = new THREE.MeshStandardMaterial({ color: '#9ed9be', roughness: 0.78 });

  function addMaquetteTree(x, z, scale = 1, mint = false) {
    const tGroup = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.85, 8), trunkMat);
    trunk.position.y = 0.42;
    trunk.castShadow = true;
    tGroup.add(trunk);

    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(0.78, 14, 12),
      mint ? mintTreeMat : maquetteTreeMat
    );
    crown.position.y = 1.45;
    crown.castShadow = true;
    tGroup.add(crown);

    tGroup.position.set(x, 0.08, z);
    tGroup.scale.setScalar(scale);
    islandGroup.add(tGroup);
  }

  const treeCoords = [
    [-31.5, 8.5, 1.0, true], [-31.5, 16.5, 0.9, false], [-21.5, 8.8, 1.1, true],
    [-13.0, -8.5, 0.95, false], [-8.5, -16.2, 1.05, true], [10.0, 7.0, 0.95, true],
    [11.5, 16.5, 1.05, false], [26.8, 15.2, 1.0, true], [23.0, -15.5, 1.05, true],
    [35.2, -14.8, 1.1, false], [35.2, -5.2, 0.95, true], [28.0, 9.2, 1.0, true],
    [34.5, 12.2, 1.05, false], [16.5, -8.8, 0.9, false]
  ];
  treeCoords.forEach(([tx, tz, sc, mint]) => addMaquetteTree(tx, tz, sc, mint));

  scene.add(islandGroup);

  // ---------------------------------------------------------------------------
  // 3. ZONE 1: WHITE MAQUETTE CITY, COMMERCIAL PAVILIONS & SOLAR FARM
  // ---------------------------------------------------------------------------
  const cityGroup = new THREE.Group();

  const solarFarmPad = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.14, 11.4), whiteMaquetteMat);
  solarFarmPad.position.set(-27.2, 0.09, -12.6);
  solarFarmPad.receiveShadow = true;
  cityGroup.add(solarFarmPad);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const px = -31.1 + col * 2.6;
      const pz = -16.0 + row * 3.4;

      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.75, 8), frameMat);
      pedestal.position.set(px, 0.48, pz);
      cityGroup.add(pedestal);

      const { group, panelGroup } = createSolarPanelMesh(2.1, 1.45, 0.48, solarMat, frameMat);
      group.position.set(px, 0.88, pz);
      cityGroup.add(group);
      world.trackingPanels.push({ panelGroup, baseTilt: 0.48, phase: row * 0.5 + col * 0.3 });
    }
  }

  // Central Smart Grid Battery Hub (-9.5, -12.5)
  const hubGroup = new THREE.Group();
  hubGroup.position.set(-9.5, 0.1, -12.5);

  const hubBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.8, 0.55, 18), whiteMaquetteMat);
  hubBase.position.y = 0.28;
  hubGroup.add(hubBase);

  const hubCore = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 3.2, 18),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3, metalness: 0.4 })
  );
  hubCore.position.y = 1.95;
  hubCore.castShadow = true;
  hubGroup.add(hubCore);

  for (let i = 0; i < 3; i++) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: i === 1 ? '#10b981' : '#0ea5e9',
      transparent: true,
      opacity: 0.92
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.08, 12, 32), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.15 + i * 0.85;
    hubGroup.add(ring);
    world.hubRings.push({ ring, baseY: ring.position.y, phase: i * 1.4 });
  }

  const hubRoofSolar = createSolarPanelMesh(2.6, 2.6, 0.2, solarMat, frameMat);
  hubRoofSolar.group.position.y = 3.7;
  hubGroup.add(hubRoofSolar.group);
  cityGroup.add(hubGroup);

  const buildingSpecs = [
    { x: -23.0, z: -5.4, w: 4.0, d: 3.6, h: 4.4, awning: '#f59e0b', badge: true, hvac: true, pitched: false },
    { x: -11.4, z: -5.4, w: 3.8, d: 3.6, h: 4.0, awning: '#ec4899', badge: false, hvac: true, pitched: false },
    { x: -11.4, z: 5.4, w: 3.8, d: 3.4, h: 4.2, awning: '#10b981', badge: false, hvac: true, pitched: false },
    { x: -22.6, z: 5.8, w: 3.6, d: 3.8, h: 5.4, awning: null, badge: false, hvac: false, pitched: true },
    { x: -29.2, z: 5.4, w: 3.4, d: 3.8, h: 4.8, awning: null, badge: false, hvac: false, pitched: true },
    { x: -29.8, z: -5.2, w: 3.6, d: 3.6, h: 8.6, awning: null, badge: false, hvac: true, pitched: false },
    { x: -19.5, z: -13.5, w: 3.8, d: 3.8, h: 11.2, awning: null, badge: false, hvac: true, pitched: false },
    { x: -4.8, z: -5.6, w: 4.0, d: 3.8, h: 9.2, awning: null, badge: false, hvac: true, pitched: false },
    { x: -5.5, z: 6.4, w: 4.4, d: 4.0, h: 9.8, awning: null, badge: false, hvac: true, pitched: false },
    { x: -11.8, z: 12.2, w: 4.0, d: 3.8, h: 7.4, awning: null, badge: false, hvac: true, pitched: false }
  ];

  buildingSpecs.forEach((b, idx) => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#f6f8fb',
      map: world.windowTex.map,
      emissiveMap: world.windowTex.emissiveMap,
      emissive: new THREE.Color('#ffdca8'),
      emissiveIntensity: 0.0,
      roughness: 0.6,
      metalness: 0.08
    });
    world.buildingMaterials.push(mat);

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
    mesh.position.set(b.x, b.h / 2 + 0.1, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cityGroup.add(mesh);

    if (b.pitched) {
      const gable = new THREE.Mesh(new THREE.ConeGeometry(b.w * 0.74, 1.9, 4), whiteMaquetteMat);
      gable.position.set(b.x, b.h + 1.05, b.z);
      gable.rotation.y = Math.PI / 4;
      gable.castShadow = true;
      cityGroup.add(gable);

      const roofSolar = createSolarPanelMesh(b.w * 0.44, b.d * 0.34, 0.72, solarMat, frameMat);
      roofSolar.group.position.set(b.x, b.h + 0.92, b.z + 0.96);
      cityGroup.add(roofSolar.group);
    } else {
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.24, 0.26, b.d + 0.24), whiteMaquetteMat);
      parapet.position.set(b.x, b.h + 0.22, b.z);
      cityGroup.add(parapet);

      const roofSolar = createSolarPanelMesh(b.w * 0.64, b.d * 0.42, 0.34, solarMat, frameMat);
      roofSolar.group.position.set(b.x - (b.hvac ? 0.35 : 0), b.h + 0.58, b.z - 0.35);
      cityGroup.add(roofSolar.group);
      world.trackingPanels.push({ panelGroup: roofSolar.panelGroup, baseTilt: 0.34, phase: idx * 0.6 });

      if (b.hvac) {
        const fan = createRooftopFanUnit(whiteMaquetteMat, frameMat, 0.42);
        fan.position.set(b.x + b.w * 0.22, b.h + 0.34, b.z + b.d * 0.2);
        cityGroup.add(fan);
      }
    }

    if (b.awning) {
      const awningMesh = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.86, 0.22, 0.95),
        new THREE.MeshStandardMaterial({ color: b.awning, roughness: 0.45 })
      );
      const faceDir = b.z < 0 ? 1 : -1;
      awningMesh.position.set(b.x, 1.85, b.z + faceDir * (b.d / 2 + 0.4));
      awningMesh.rotation.x = faceDir * 0.22;
      awningMesh.castShadow = true;
      cityGroup.add(awningMesh);
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
  // 4. SMART-CITY-LED STREETLAMPS
  // ---------------------------------------------------------------------------
  const lampGroup = new THREE.Group();
  const coneGeo = new THREE.ConeGeometry(1.75, 4.3, 16, 1, true);
  coneGeo.translate(0, -2.15, 0);

  function addStreetLamp(x, z, armDirZ) {
    const poleUnit = new THREE.Group();
    poleUnit.position.set(x, 0.08, z);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 4.3, 8), whiteMaquetteMat);
    mast.position.y = 2.15;
    mast.castShadow = true;
    poleUnit.add(mast);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.15), whiteMaquetteMat);
    arm.position.set(0, 4.25, armDirZ * 0.55);
    poleUnit.add(arm);

    const microSolar = createSolarPanelMesh(0.65, 0.45, 0.25, solarMat, frameMat);
    microSolar.group.position.set(0, 4.42, 0);
    poleUnit.add(microSolar.group);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: new THREE.Color('#ffdf9e'),
      emissiveIntensity: 0.0
    });
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.52), bulbMat);
    bulb.position.set(0, 4.18, armDirZ * 0.98);
    poleUnit.add(bulb);

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

  const lampXPositions = [-30, -22, -12.5, -5, 3, 12, 24, 34];
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
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.4, 0.45), whiteMaquetteMat);
    pillar.position.set(px, 2.2, -1.5);
    pillar.castShadow = true;
    stationGroup.add(pillar);
  });

  const canopyRoof = new THREE.Group();
  canopyRoof.position.set(0, 4.45, 0.2);
  canopyRoof.rotation.x = 0.2;

  const canopyDeck = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.24, 5.8), whiteMaquetteMat);
  canopyDeck.castShadow = true;
  canopyRoof.add(canopyDeck);

  const canopyLed = new THREE.Mesh(
    new THREE.BoxGeometry(12.25, 0.08, 5.85),
    new THREE.MeshBasicMaterial({ color: '#38bdf8' })
  );
  canopyLed.position.y = -0.14;
  canopyRoof.add(canopyLed);

  const canopySolarL = createSolarPanelMesh(5.4, 4.8, 0.0, solarMat, frameMat);
  canopySolarL.group.position.set(-2.9, 0.16, 0);
  canopyRoof.add(canopySolarL.group);

  const canopySolarR = createSolarPanelMesh(5.4, 4.8, 0.0, solarMat, frameMat);
  canopySolarR.group.position.set(2.9, 0.16, 0);
  canopyRoof.add(canopySolarR.group);

  const stationBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.95, 0.16),
    new THREE.MeshStandardMaterial({ map: world.badgeTex, roughness: 0.3 })
  );
  stationBadge.position.set(4.9, 0.3, 2.9);
  canopyRoof.add(stationBadge);

  stationGroup.add(canopyRoof);

  [-3.8, 0.0, 3.8].forEach((cx) => {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.85, 0.48), whiteMaquetteMat);
    ped.position.set(cx, 0.92, -1.2);
    ped.castShadow = true;
    stationGroup.add(ped);

    const statusMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    world.stationStatusMats.push(statusMat);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.52), statusMat);
    screen.position.set(cx, 1.32, -1.2);
    stationGroup.add(screen);
  });

  const parkedCarL = createStylizedVehicle('#334155', false);
  parkedCarL.position.set(-3.8, 0.03, 0.85);
  stationGroup.add(parkedCarL);

  const parkedCarR = createStylizedVehicle('#f8fafc', false);
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

  const driveway = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.06, 9.6), roadMat);
  driveway.position.set(0, 0.02, 5.8);
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

  const homeSolarL = createSolarPanelMesh(2.6, 3.6, 0.2, solarMat, frameMat);
  homeSolarL.group.position.set(-2.1, 5.6, -0.5);
  homeGroup.add(homeSolarL.group);

  const homeSolarR = createSolarPanelMesh(2.6, 3.6, 0.2, solarMat, frameMat);
  homeSolarR.group.position.set(0.9, 5.6, -0.5);
  homeGroup.add(homeSolarR.group);

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
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.65, 8), whiteMaquetteMat);
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
      world.streetLamps.push({ bulbMat: capMat, coneMat: null });
    });
  });

  world.homeInteriorLight = new THREE.PointLight('#ffba52', 0.0, 22);
  world.homeInteriorLight.position.set(0, 2.8, 3.8);
  homeGroup.add(world.homeInteriorLight);

  scene.add(homeGroup);

  // ---------------------------------------------------------------------------
  // 7. ZONE 4: FLAGSHIP "SMART-CITY-LED.COM · NEO CLIM®" STORE (x=19, z=12.2)
  // ---------------------------------------------------------------------------
  const storeGroup = new THREE.Group();
  storeGroup.position.set(19.0, 0.05, 12.2);

  // Customer pickup plaza connecting z=0 boulevard down to showroom front
  const storeApron = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.07, 10.0), roadMat);
  storeApron.position.set(0, 0.02, -6.2);
  storeApron.receiveShadow = true;
  storeGroup.add(storeApron);

  // Glowing Icy-Cyan Pickup Bay at world (19.0, 0.05, 5.2) -> local (0, 0.06, -7.0)
  world.storeBayRingMat = new THREE.MeshBasicMaterial({
    color: '#00e5ff',
    transparent: true,
    opacity: 0.35
  });
  const storeBayPad = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.03, 5.0), world.storeBayRingMat);
  storeBayPad.position.set(0, 0.06, -7.0);
  storeGroup.add(storeBayPad);

  // Store 2-Story Architectural White Building Body
  const storeMain = new THREE.Mesh(new THREE.BoxGeometry(11.4, 4.8, 5.8), whiteMaquetteMat);
  storeMain.position.set(0, 2.45, 0);
  storeMain.castShadow = true;
  storeMain.receiveShadow = true;
  storeGroup.add(storeMain);

  // Store Rooftop Solar Array powering showroom & AC systems
  const storeSolarL = createSolarPanelMesh(4.6, 3.8, 0.25, solarMat, frameMat);
  storeSolarL.group.position.set(-2.7, 5.15, 0.5);
  storeGroup.add(storeSolarL.group);

  const storeSolarR = createSolarPanelMesh(4.6, 3.8, 0.25, solarMat, frameMat);
  storeSolarR.group.position.set(2.7, 5.15, 0.5);
  storeGroup.add(storeSolarR.group);

  // Cantilevered Showroom Canopy over entrance + glowing icy-cyan trim
  const storeCanopy = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.25, 3.0), darkMetalMat);
  storeCanopy.position.set(0, 3.45, -3.6);
  storeCanopy.castShadow = true;
  storeGroup.add(storeCanopy);

  const storeCanopyTrim = new THREE.Mesh(
    new THREE.BoxGeometry(10.9, 0.09, 3.08),
    new THREE.MeshBasicMaterial({ color: '#00e5ff' })
  );
  storeCanopyTrim.position.set(0, 3.31, -3.6);
  storeGroup.add(storeCanopyTrim);

  // Glowing Panoramic Showroom Glass Windows facing boulevard (-Z)
  world.storeWindowMat = new THREE.MeshStandardMaterial({
    color: '#9ee8ff',
    emissive: new THREE.Color('#38bdf8'),
    emissiveIntensity: 0.45,
    roughness: 0.12,
    metalness: 0.35
  });
  const storeGlass = new THREE.Mesh(new THREE.BoxGeometry(8.8, 2.6, 0.14), world.storeWindowMat);
  storeGlass.position.set(0, 1.55, -2.92);
  storeGroup.add(storeGlass);

  // Illuminated Roof Billboard: "SMART-CITY-LED.COM / NEO CLIM® SOLAR AC A+++"
  world.storeSignMat = new THREE.MeshStandardMaterial({
    map: world.storeSignTex,
    emissiveMap: world.storeSignTex,
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: 0.55,
    roughness: 0.25
  });
  const signHousing = new THREE.Mesh(new THREE.BoxGeometry(9.6, 2.35, 0.35), darkMetalMat);
  signHousing.position.set(0, 6.2, -2.5);
  signHousing.castShadow = true;
  storeGroup.add(signHousing);

  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 2.1), world.storeSignMat);
  signFace.position.set(0, 6.2, -2.69);
  signFace.rotation.y = Math.PI; // Faces -Z toward boulevard & camera
  storeGroup.add(signFace);

  // Outdoor Display Podium with oversized 3D NEO Clim® A+++ Unit & Spinning Fans
  const podium = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.65, 1.8), whiteMaquetteMat);
  podium.position.set(-4.3, 0.35, -4.8);
  podium.castShadow = true;
  storeGroup.add(podium);

  const acDisplay = createAcUnitMesh(1.05);
  acDisplay.unit.position.set(-4.3, 0.68, -4.8);
  acDisplay.unit.rotation.y = Math.PI;
  storeGroup.add(acDisplay.unit);
  world.storeFans.push(...acDisplay.fans);

  // Animated NEO Clim® Pickup Package Box (glides from showroom to EV when docked)
  const acPickup = createAcUnitMesh(0.58);
  acPickup.unit.position.set(0, 0.85, -3.5);
  acPickup.unit.rotation.y = Math.PI;
  storeGroup.add(acPickup.unit);
  world.acPickupBox = acPickup.unit;
  world.storeFans.push(...acPickup.fans);

  // Storefront LED Lighting
  world.storeInteriorLight = new THREE.PointLight('#00e5ff', 1.2, 22);
  world.storeInteriorLight.position.set(0, 3.0, -5.2);
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
  const cabinGlassMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.1,
    metalness: 0.85
  });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.52, 3.9), carBodyMat);
  chassis.position.y = 0.52;
  chassis.castShadow = true;
  evCar.add(chassis);

  const accentStrip = new THREE.Mesh(
    new THREE.BoxGeometry(1.79, 0.08, 3.2),
    new THREE.MeshBasicMaterial({ color: '#0ea5e9' })
  );
  accentStrip.position.y = 0.44;
  evCar.add(accentStrip);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.48, 2.1), cabinGlassMat);
  cabin.position.set(0, 0.96, -0.18);
  cabin.castShadow = true;
  evCar.add(cabin);

  world.evChargeRingMat = new THREE.MeshBasicMaterial({
    color: '#10b981',
    transparent: true,
    opacity: 0.0
  });
  const chargeRing = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.045, 8, 24), world.evChargeRingMat);
  chargeRing.rotation.x = Math.PI / 2;
  chargeRing.position.set(0, 1.24, -0.18);
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
    emissiveIntensity: 0.2
  });
  const headlightBar = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 0.08), world.evHeadlightMat);
  headlightBar.position.set(0, 0.58, 1.94);
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
    beam.position.set(hx, 0.56, 1.98);
    evCar.add(beam);
    world.evHeadlightCones.push(beamMat);
  });

  world.evHeadlightSpot = new THREE.PointLight('#bae6fd', 0.0, 14);
  world.evHeadlightSpot.position.set(0, 0.8, 3.2);
  evCar.add(world.evHeadlightSpot);

  world.evTaillightMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    emissive: new THREE.Color('#ff2a2a'),
    emissiveIntensity: 0.3
  });
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.11, 0.08), world.evTaillightMat);
  tailBar.position.set(0, 0.62, -1.94);
  evCar.add(tailBar);

  evCar.position.set(-26, 0.05, 1.15);
  evCar.rotation.y = Math.PI / 2;
  scene.add(evCar);
  world.evCar = evCar;

  // ---------------------------------------------------------------------------
  // 9. AMBIENT CITY TRAFFIC & PEDESTRIANS
  // ---------------------------------------------------------------------------
  const trafficSpecs = [
    { color: '#f4607a', isBus: true, axis: 'z', lane: -18.1, dir: 1, min: -22, max: 22, pos: -12, speed: 3.6 },
    { color: '#facc15', isBus: false, axis: 'z', lane: -15.9, dir: -1, min: -22, max: 22, pos: 14, speed: 4.5 },
    { color: '#38bdf8', isBus: false, axis: 'z', lane: -18.1, dir: 1, min: -22, max: 22, pos: 6, speed: 4.1 },
    { color: '#ef4444', isBus: false, axis: 'z', lane: -15.9, dir: -1, min: -22, max: 22, pos: -5, speed: 4.3 },
    { color: '#38bdf8', isBus: false, axis: 'x', lane: -1.15, dir: -1, min: -36, max: 35, pos: 14, speed: 4.6 },
    { color: '#facc15', isBus: false, axis: 'x', lane: -1.15, dir: -1, min: -36, max: 35, pos: -8, speed: 4.6 }
  ];

  trafficSpecs.forEach((spec) => {
    const mesh = createStylizedVehicle(spec.color, spec.isBus);
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
    { x0: 13.5, z0: 8.2, x1: 23.5, z1: 8.2, speed: 0.14 },
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
    [new THREE.Vector3(-27.2, 1.3, -12.6), new THREE.Vector3(-18.5, 2.5, -12.8), new THREE.Vector3(-9.5, 2.1, -12.5)],
    [new THREE.Vector3(-9.5, 2.1, -12.5), new THREE.Vector3(-16.0, 3.2, -9.0), new THREE.Vector3(-23.0, 4.6, -5.4)],
    [new THREE.Vector3(-9.5, 2.1, -12.5), new THREE.Vector3(-10.5, 3.0, -9.0), new THREE.Vector3(-11.4, 4.2, -5.4)],
    [new THREE.Vector3(-9.5, 2.1, -12.5), new THREE.Vector3(-10.5, 3.4, -2.0), new THREE.Vector3(-11.4, 4.4, 5.4)],
    [new THREE.Vector3(-9.5, 2.1, -12.5), new THREE.Vector3(-17.0, 2.9, -2.5), new THREE.Vector3(-22.6, 5.2, 5.8)],
    [new THREE.Vector3(-9.5, 2.1, -12.5), new THREE.Vector3(-7.5, 3.4, -3.0), new THREE.Vector3(-5.5, 5.2, 6.4)]
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

  // Stage 3: Smart Home Evening Flows
  [
    [new THREE.Vector3(29.8, 5.6, -10.8), new THREE.Vector3(32.5, 4.0, -9.2), new THREE.Vector3(31.8, 1.6, -8.0)],
    [new THREE.Vector3(31.8, 1.5, -8.0), new THREE.Vector3(30.2, 1.8, -8.2), new THREE.Vector3(28.5, 2.2, -9.5)],
    [new THREE.Vector3(29.0, 0.7, -5.4), new THREE.Vector3(30.8, 1.1, -6.5), new THREE.Vector3(31.8, 1.4, -8.0)]
  ].forEach((pts) => {
    const stream = createEnergyStream(pts, '#fbbf24', 8, 0.065);
    energyGroup.add(stream.group);
    world.homeFlows.push(stream);
  });

  // Stage 4: Flagship Smart-City-Led.com · NEO CLIM® Store Solar Cooling Streams
  [
    // Store solar roof -> AC Display Podium
    [new THREE.Vector3(16.3, 5.2, 12.7), new THREE.Vector3(14.7, 3.6, 9.6), new THREE.Vector3(14.7, 1.6, 7.4)],
    // Store solar roof -> Showroom & Pickup Bay
    [new THREE.Vector3(21.7, 5.2, 12.7), new THREE.Vector3(19.5, 3.8, 9.6), new THREE.Vector3(19.0, 1.8, 8.2), new THREE.Vector3(19.0, 1.1, 5.2)]
  ].forEach((pts) => {
    const stream = createEnergyStream(pts, '#00e5ff', 9, 0.07);
    energyGroup.add(stream.group);
    world.storeFlows.push(stream);
  });

  scene.add(energyGroup);

  return world;
}
