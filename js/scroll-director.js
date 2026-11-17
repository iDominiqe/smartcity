import * as THREE from 'three';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function wrap01(v) {
  const m = v % 1;
  return m < 0 ? m + 1 : m;
}

/**
 * Sample a keyframe array of { p, pos: [x,y,z], target: [x,y,z] } using Catmull-Rom
 * smooth interpolation per segment keyed by normalized progress p.
 */
function sampleCameraKeyframes(keyframes, p, outPos, outTarget) {
  if (p <= keyframes[0].p) {
    outPos.set(...keyframes[0].pos);
    outTarget.set(...keyframes[0].target);
    return;
  }
  const last = keyframes[keyframes.length - 1];
  if (p >= last.p) {
    outPos.set(...last.pos);
    outTarget.set(...last.target);
    return;
  }

  let idx = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (p >= keyframes[i].p && p <= keyframes[i + 1].p) {
      idx = i;
      break;
    }
  }

  const k0 = keyframes[Math.max(0, idx - 1)];
  const k1 = keyframes[idx];
  const k2 = keyframes[idx + 1];
  const k3 = keyframes[Math.min(keyframes.length - 1, idx + 2)];

  const span = Math.max(0.0001, k2.p - k1.p);
  const t = (p - k1.p) / span;
  const st = t * t * (3 - 2 * t);

  const cr = (v0, v1, v2, v3, u) => {
    const u2 = u * u;
    const u3 = u2 * u;
    return (
      0.5 *
      (2 * v1 +
        (-v0 + v2) * u +
        (2 * v0 - 5 * v1 + 4 * v2 - v3) * u2 +
        (-v0 + 3 * v1 - 3 * v2 + v3) * u3)
    );
  };

  outPos.set(
    cr(k0.pos[0], k1.pos[0], k2.pos[0], k3.pos[0], st),
    cr(k0.pos[1], k1.pos[1], k2.pos[1], k3.pos[1], st),
    cr(k0.pos[2], k1.pos[2], k2.pos[2], k3.pos[2], st)
  );
  outTarget.set(
    cr(k0.target[0], k1.target[0], k2.target[0], k3.target[0], st),
    cr(k0.target[1], k1.target[1], k2.target[1], k3.target[1], st),
    cr(k0.target[2], k1.target[2], k2.target[2], k3.target[2], st)
  );
}

// Tuned for FOV=30 telephoto-isometric miniature maquette perspective
const CAMERA_KEYFRAMES = [
  { p: 0.0, pos: [-32, 27, 38], target: [-18, 2.2, -1.5] },
  { p: 0.14, pos: [-22, 19.5, 29], target: [-15.5, 2.0, -1.0] },
  { p: 0.24, pos: [-8, 10.5, 19], target: [-3.0, 1.2, -1.5] },
  { p: 0.34, pos: [0.5, 7.6, 10.6], target: [3.6, 1.6, -5.2] },
  { p: 0.50, pos: [14.2, 8.0, 8.2], target: [3.8, 1.6, -5.2] },
  { p: 0.59, pos: [19.5, 10.2, 17.5], target: [17.0, 1.4, -1.2] },
  { p: 0.66, pos: [21.5, 8.8, 12.6], target: [28.4, 2.0, -7.2] },
  { p: 0.80, pos: [36.2, 7.6, 9.8], target: [28.8, 2.2, -8.2] },
  { p: 0.90, pos: [24, 25, 42], target: [3, 1.5, -2] },
  { p: 1.0, pos: [10, 34, 52], target: [0, 1.5, -2] }
];

// 5-Stop Atmospheric Lighting Curve: Night (0.0) -> Blue Hour (0.22) -> Sunset (0.45) -> Afternoon (0.72) -> Bright Sunny Day (1.0)
const ATMOSPHERE_STOPS = [
  {
    d: 0.0,
    sky: new THREE.Color('#0c1733'),
    sun: new THREE.Color('#8bb4f8'),
    hemiSky: new THREE.Color('#4c689e'),
    hemiGround: new THREE.Color('#182238'),
    dirInt: 0.65,
    hemiInt: 0.55,
    ambInt: 0.32,
    fogDensity: 0.0046
  },
  {
    d: 0.22,
    sky: new THREE.Color('#2c4478'),
    sun: new THREE.Color('#9ec0fa'),
    hemiSky: new THREE.Color('#6f8cc4'),
    hemiGround: new THREE.Color('#2b3654'),
    dirInt: 0.88,
    hemiInt: 0.72,
    ambInt: 0.36,
    fogDensity: 0.0044
  },
  {
    d: 0.45,
    sky: new THREE.Color('#f4a27b'),
    sun: new THREE.Color('#ff9252'),
    hemiSky: new THREE.Color('#ffc49b'),
    hemiGround: new THREE.Color('#5a506e'),
    dirInt: 1.55,
    hemiInt: 0.88,
    ambInt: 0.42,
    fogDensity: 0.0042
  },
  {
    d: 0.72,
    sky: new THREE.Color('#f0e4d4'),
    sun: new THREE.Color('#ffe8bf'),
    hemiSky: new THREE.Color('#fff5e6'),
    hemiGround: new THREE.Color('#c8ced8'),
    dirInt: 2.1,
    hemiInt: 1.12,
    ambInt: 0.48,
    fogDensity: 0.0038
  },
  {
    d: 1.0,
    sky: new THREE.Color('#e3edf8'),
    sun: new THREE.Color('#fff9ec'),
    hemiSky: new THREE.Color('#ffffff'),
    hemiGround: new THREE.Color('#dce3ed'),
    dirInt: 2.45,
    hemiInt: 1.38,
    ambInt: 0.56,
    fogDensity: 0.0035
  }
];

export class ScrollDirector {
  constructor(scene, camera, world, i18n) {
    this.scene = scene;
    this.camera = camera;
    this.world = world;
    this.i18n = i18n;

    this.targetProgress = 0;
    this.smoothProgress = 0;
    this.freeOrbitMode = false;
    this.flowBoost = false;
    this.previewMode = 'auto'; // 'auto' | 'night' | 'day' | 'sunset'

    this.flowClock = 0;
    this.wheelSpin = 0;
    this.prevEvPos = new THREE.Vector3(-26, 0.05, 1.15);

    this._camPos = new THREE.Vector3();
    this._camTarget = new THREE.Vector3();
    this._evPos = new THREE.Vector3();
    this._evNext = new THREE.Vector3();

    this._skyCurrent = new THREE.Color('#e3edf8');
    this._sunColorCur = new THREE.Color('#fff9ec');
    this._hemiSkyCur = new THREE.Color('#ffffff');
    this._hemiGroundCur = new THREE.Color('#dce3ed');

    // Driving Curve 1: City Core Eastbound Lane (z = +1.15) -> Center Charging Station Bay (4, -5.2)
    this.driveToStationCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-26.0, 0.05, 1.15),
      new THREE.Vector3(-17.0, 0.05, 1.15),
      new THREE.Vector3(-8.5, 0.05, 1.15),
      new THREE.Vector3(-2.5, 0.05, 0.6),
      new THREE.Vector3(0.4, 0.05, -2.4),
      new THREE.Vector3(1.8, 0.05, -4.8),
      new THREE.Vector3(4.0, 0.05, -5.2)
    ]);

    // Driving Curve 2: Charging Station Bay -> Eastbound Lane (z = +1.15) -> Evening Smart Home Driveway
    this.driveToHomeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(4.0, 0.05, -5.2),
      new THREE.Vector3(6.8, 0.05, -4.6),
      new THREE.Vector3(9.4, 0.05, -1.2),
      new THREE.Vector3(13.5, 0.05, 1.15),
      new THREE.Vector3(21.5, 0.05, 1.15),
      new THREE.Vector3(26.6, 0.05, 0.1),
      new THREE.Vector3(28.6, 0.05, -2.6),
      new THREE.Vector3(29.0, 0.05, -5.4)
    ]);

    this.hudTime = document.getElementById('hud-time');
    this.hudSolar = document.getElementById('hud-solar');
    this.hudEv = document.getElementById('hud-ev');
    this.hudGrid = document.getElementById('hud-grid');
    this.progressFill = document.getElementById('scroll-progress-fill');
  }

  setScrollProgress(p) {
    this.targetProgress = clamp(p, 0, 1);
  }

  setFreeOrbitMode(enabled) {
    this.freeOrbitMode = enabled;
  }

  setFlowBoost(enabled) {
    this.flowBoost = enabled;
  }

  toggleDayNightPreview() {
    const order = ['auto', 'night', 'sunset', 'day'];
    const nextIdx = (order.indexOf(this.previewMode) + 1) % order.length;
    this.previewMode = order[nextIdx];
    return this.previewMode !== 'auto';
  }

  sampleAtmosphere(daylight) {
    const d = clamp(daylight, 0, 1);
    let s0 = ATMOSPHERE_STOPS[0];
    let s1 = ATMOSPHERE_STOPS[ATMOSPHERE_STOPS.length - 1];

    for (let i = 0; i < ATMOSPHERE_STOPS.length - 1; i++) {
      if (d >= ATMOSPHERE_STOPS[i].d && d <= ATMOSPHERE_STOPS[i + 1].d) {
        s0 = ATMOSPHERE_STOPS[i];
        s1 = ATMOSPHERE_STOPS[i + 1];
        break;
      }
    }

    const span = Math.max(0.0001, s1.d - s0.d);
    const t = smoothstep(0, 1, (d - s0.d) / span);

    this._skyCurrent.copy(s0.sky).lerp(s1.sky, t);
    this._sunColorCur.copy(s0.sun).lerp(s1.sun, t);
    this._hemiSkyCur.copy(s0.hemiSky).lerp(s1.hemiSky, t);
    this._hemiGroundCur.copy(s0.hemiGround).lerp(s1.hemiGround, t);

    return {
      dirInt: lerp(s0.dirInt, s1.dirInt, t),
      hemiInt: lerp(s0.hemiInt, s1.hemiInt, t),
      ambInt: lerp(s0.ambInt, s1.ambInt, t),
      fogDensity: lerp(s0.fogDensity, s1.fogDensity, t)
    };
  }

  update(dt, elapsed) {
    const safeDt = Math.max(0, dt);
    const damp = 1 - Math.exp(-5.5 * safeDt);
    this.smoothProgress += (this.targetProgress - this.smoothProgress) * damp;
    const p = this.smoothProgress;

    if (this.progressFill) {
      this.progressFill.style.width = `${(p * 100).toFixed(1)}%`;
    }

    // -------------------------------------------------------------------------
    // 1. CAMERA CHOREOGRAPHY
    // -------------------------------------------------------------------------
    if (!this.freeOrbitMode) {
      sampleCameraKeyframes(CAMERA_KEYFRAMES, p, this._camPos, this._camTarget);
      this.camera.position.copy(this._camPos);
      this.camera.lookAt(this._camTarget);
    }

    // -------------------------------------------------------------------------
    // 2. HERO ELECTRIC VEHICLE JOURNEY
    // -------------------------------------------------------------------------
    let evChargingFactor = 0;
    let evHomeV2hFactor = 0;
    let evBatteryPct = 42;

    if (p < 0.34) {
      const t = clamp(p / 0.34, 0, 1);
      const easedT = t < 0.85 ? t : lerp(0.85, 1.0, smoothstep(0.85, 1.0, t));
      this.driveToStationCurve.getPointAt(easedT, this._evPos);
      this.world.evCar.position.copy(this._evPos);

      if (easedT < 0.98) {
        this.driveToStationCurve.getPointAt(Math.min(1, easedT + 0.012), this._evNext);
        const angle = Math.atan2(
          this._evNext.x - this._evPos.x,
          this._evNext.z - this._evPos.z
        );
        this.world.evCar.rotation.y = angle;
      } else {
        this.world.evCar.rotation.y = Math.PI / 2;
      }
      evBatteryPct = Math.round(lerp(42, 22, t));
    } else if (p <= 0.52) {
      this._evPos.set(4.0, 0.05, -5.2);
      this.world.evCar.position.copy(this._evPos);
      this.world.evCar.rotation.y = Math.PI / 2;

      const chargeT = clamp((p - 0.34) / 0.18, 0, 1);
      evChargingFactor = Math.max(0.68, Math.sin(chargeT * Math.PI));
      evBatteryPct = Math.round(lerp(22, 100, chargeT));
    } else if (p <= 0.65) {
      const t = clamp((p - 0.52) / 0.13, 0, 1);
      this.driveToHomeCurve.getPointAt(t, this._evPos);
      this.world.evCar.position.copy(this._evPos);

      if (t < 0.96) {
        this.driveToHomeCurve.getPointAt(Math.min(1, t + 0.012), this._evNext);
        const angle = Math.atan2(
          this._evNext.x - this._evPos.x,
          this._evNext.z - this._evPos.z
        );
        this.world.evCar.rotation.y = angle;
      } else {
        this.world.evCar.rotation.y = Math.PI;
      }
      evBatteryPct = Math.round(lerp(100, 91, t));
    } else {
      this._evPos.set(29.0, 0.05, -5.4);
      this.world.evCar.position.copy(this._evPos);
      this.world.evCar.rotation.y = Math.PI;

      evHomeV2hFactor = smoothstep(0.65, 0.70, p);
      evBatteryPct = Math.round(lerp(91, 84, clamp((p - 0.65) / 0.35, 0, 1)));
    }

    const movedDist = this._evPos.distanceTo(this.prevEvPos);
    if (movedDist > 0.0005 && movedDist < 10) {
      const sign = this.targetProgress >= this.smoothProgress - 0.0001 ? 1 : -1;
      this.wheelSpin += (movedDist / 0.32) * sign;
      this.world.evWheels.forEach((w) => {
        w.rotation.x = this.wheelSpin;
      });
    }
    this.prevEvPos.copy(this._evPos);

    // -------------------------------------------------------------------------
    // 3. AMBIENT CITY TRAFFIC & PEDESTRIANS (Yields smoothly to Hero EV)
    // -------------------------------------------------------------------------
    if (this.world.trafficVehicles) {
      this.world.trafficVehicles.forEach((v) => {
        const vx = v.axis === 'x' ? v.pos : v.lane;
        const vz = v.axis === 'z' ? v.pos : v.lane;
        const distToHero = Math.hypot(vx - this._evPos.x, vz - this._evPos.z);

        // Yield at intersection or nearby hero EV to prevent clipping
        const nearCrossroad = v.axis === 'z' && Math.abs(vz) < 6.0 && Math.abs(this._evPos.x - -17) < 7.0;
        if (distToHero > 4.6 && !nearCrossroad) {
          v.pos += v.dir * v.speed * safeDt;
          if (v.pos > v.max) v.pos = v.min;
          if (v.pos < v.min) v.pos = v.max;
        }

        if (v.axis === 'z') {
          v.mesh.position.set(v.lane, 0.04, v.pos);
        } else {
          v.mesh.position.set(v.pos, 0.04, v.lane);
        }
      });
    }

    if (this.world.pedestrians) {
      this.world.pedestrians.forEach((ped) => {
        const cycle = (elapsed * ped.speed + ped.phase) % 2;
        const u = cycle <= 1 ? cycle : 2 - cycle;
        const px = lerp(ped.x0, ped.x1, u);
        const pz = lerp(ped.z0, ped.z1, u);
        const bob = Math.abs(Math.sin(elapsed * 8.5 + ped.phase * 4)) * 0.045;
        ped.mesh.position.set(px, 0.1 + bob, pz);
      });
    }

    // -------------------------------------------------------------------------
    // 4. NATURAL 5-STOP DAY -> SUNSET -> TWILIGHT -> NIGHT LIGHTING
    // -------------------------------------------------------------------------
    let daylight = 1.0 - smoothstep(0.46, 0.67, p);
    if (this.previewMode === 'night') daylight = 0.0;
    else if (this.previewMode === 'sunset') daylight = 0.44;
    else if (this.previewMode === 'day') daylight = 1.0;

    const nightness = 1.0 - daylight;
    const atmo = this.sampleAtmosphere(daylight);

    this.scene.background = this._skyCurrent;
    if (this.scene.fog) {
      this.scene.fog.color.copy(this._skyCurrent);
      this.scene.fog.density = atmo.fogDensity;
    }

    const sunElevAngle = lerp(-0.14, 1.12, daylight);
    const sunRadius = 78;
    const sunX = lerp(-46, -20, daylight);
    const sunY = Math.sin(sunElevAngle) * sunRadius;
    const sunZ = -Math.cos(sunElevAngle) * 34;

    this.world.sunMesh.position.set(sunX, sunY, sunZ);
    this.world.sunMesh.visible = sunY > -6;
    this.world.dirLight.position.set(
      sunX * 0.52,
      Math.max(8, sunY * 0.68),
      Math.max(12, sunZ + 40)
    );
    this.world.dirLight.color.copy(this._sunColorCur);
    this.world.dirLight.intensity = atmo.dirInt;

    this.world.hemiLight.color.copy(this._hemiSkyCur);
    this.world.hemiLight.groundColor.copy(this._hemiGroundCur);
    this.world.hemiLight.intensity = atmo.hemiInt;
    this.world.ambientLight.intensity = atmo.ambInt;

    const moonY = lerp(-15, 38, nightness);
    this.world.moonMesh.position.set(36, moonY, -36);
    this.world.moonMesh.visible = moonY > -2;
    this.world.starsMat.opacity = clamp((nightness - 0.35) / 0.55, 0, 0.9);

    // -------------------------------------------------------------------------
    // 5. SMART-CITY-LED LIGHTS, WINDOWS, EV HEADLIGHTS & VILLA
    // -------------------------------------------------------------------------
    const ledGlow = smoothstep(0.32, 0.78, nightness);

    this.world.streetLamps.forEach(({ bulbMat, coneMat }) => {
      bulbMat.emissiveIntensity = lerp(0.0, 2.5, ledGlow);
      if (coneMat) {
        coneMat.opacity = lerp(0.0, 0.25, ledGlow);
      }
    });

    this.world.buildingMaterials.forEach((mat) => {
      mat.emissiveIntensity = lerp(0.0, 1.25, ledGlow);
    });

    if (this.world.signalLampMats) {
      const greenPhase = Math.sin(elapsed * 1.1) > -0.2;
      this.world.signalLampMats.forEach((sm, idx) => {
        sm.color.setHex((idx % 2 === 0 ? greenPhase : !greenPhase) ? 0x10b981 : 0xf59e0b);
      });
    }

    this.world.evHeadlightMat.emissiveIntensity = lerp(0.2, 3.0, ledGlow);
    this.world.evTaillightMat.emissiveIntensity = lerp(0.3, 2.2, ledGlow);
    this.world.evHeadlightCones.forEach((bm) => {
      bm.opacity = lerp(0.0, 0.24, ledGlow);
    });
    this.world.evHeadlightSpot.intensity = lerp(0.0, 2.8, ledGlow);

    this.world.evChargeRingMat.opacity =
      evChargingFactor * (0.65 + 0.35 * Math.sin(elapsed * 6));

    this.world.stationBayRingMat.opacity = 0.28 + evChargingFactor * 0.65;
    this.world.stationLight.intensity = 0.35 + evChargingFactor * 2.2 + ledGlow * 1.4;
    this.world.stationStatusMats.forEach((sm, idx) => {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 5 + idx);
      sm.color.setHex(
        evChargingFactor > 0.2 ? (pulse > 0.4 ? 0x10b981 : 0x38bdf8) : 0x10b981
      );
    });

    const homeGlow = Math.max(ledGlow, evHomeV2hFactor * 0.85);
    this.world.homeWindowMat.emissiveIntensity = lerp(0.0, 1.85, homeGlow);
    this.world.homeInteriorLight.intensity = lerp(0.0, 3.6, homeGlow);

    this.world.homeWallBatteryBars.forEach(({ barMat, index }) => {
      const wave = Math.sin(elapsed * 4 - index * 0.7) * 0.5 + 0.5;
      barMat.color.setHex(
        homeGlow > 0.35 ? (wave > 0.3 ? 0x34d399 : 0x38bdf8) : 0x10b981
      );
    });

    // -------------------------------------------------------------------------
    // 6. SOLAR TRACKING, HUB RINGS & ENERGY FLOW PARTICLES
    // -------------------------------------------------------------------------
    this.world.trackingPanels.forEach(({ panelGroup, baseTilt, phase }) => {
      panelGroup.rotation.x = baseTilt + Math.sin(elapsed * 0.6 + phase) * 0.04;
    });

    this.world.hubRings.forEach(({ ring, baseY, phase }) => {
      ring.position.y = baseY + Math.sin(elapsed * 2.2 + phase) * 0.08;
    });

    const speedMult = this.flowBoost ? 2.2 : 1.0;
    this.flowClock += safeDt * speedMult;

    const cityStrength = lerp(0.45, 1.0, daylight) * (this.flowBoost ? 1.25 : 1.0);
    this.world.cityFlows.forEach((stream, sIdx) => {
      stream.tubeMat.opacity = 0.2 + cityStrength * 0.25;
      stream.beadMat.opacity = clamp(0.45 + cityStrength * 0.55, 0, 1);
      stream.beads.forEach((b) => {
        const u = wrap01(this.flowClock * 0.28 + b.offset + sIdx * 0.13);
        stream.curve.getPointAt(u, b.mesh.position);
        b.mesh.scale.setScalar(0.8 + cityStrength * 0.45);
      });
    });

    const stationStrength = 0.25 + evChargingFactor * 0.95;
    this.world.stationFlows.forEach((stream, sIdx) => {
      stream.tubeMat.opacity = 0.14 + evChargingFactor * 0.48;
      stream.beadMat.opacity = 0.3 + evChargingFactor * 0.7;
      stream.beads.forEach((b) => {
        const rate = 0.35 + evChargingFactor * 0.55;
        const u = wrap01(this.flowClock * rate + b.offset + sIdx * 0.17);
        stream.curve.getPointAt(u, b.mesh.position);
        b.mesh.scale.setScalar(0.65 + stationStrength * 0.65);
      });
    });

    const homeStrength = Math.max(ledGlow * 0.75, evHomeV2hFactor);
    this.world.homeFlows.forEach((stream, sIdx) => {
      stream.tubeMat.opacity = 0.14 + homeStrength * 0.48;
      stream.beadMat.opacity = 0.25 + homeStrength * 0.75;
      stream.beads.forEach((b) => {
        const rate = 0.25 + homeStrength * 0.55;
        const u = wrap01(this.flowClock * rate + b.offset + sIdx * 0.21);
        stream.curve.getPointAt(u, b.mesh.position);
        b.mesh.scale.setScalar(0.6 + homeStrength * 0.7);
      });
    });

    // -------------------------------------------------------------------------
    // 7. UPDATE LIVE TELEMETRY HUD
    // -------------------------------------------------------------------------
    this.updateHUD(p, daylight, evBatteryPct, evChargingFactor);
  }

  updateHUD(p, daylight, evBatteryPct, evChargingFactor) {
    let totalMinutes;
    if (this.previewMode === 'night') {
      totalMinutes = 21 * 60 + 30;
    } else if (this.previewMode === 'sunset') {
      totalMinutes = 18 * 60 + 40;
    } else if (this.previewMode === 'day') {
      totalMinutes = 12 * 60 + 30;
    } else if (p < 0.45) {
      totalMinutes = lerp(12 * 60 + 30, 16 * 60 + 0, p / 0.45);
    } else {
      totalMinutes = lerp(16 * 60 + 0, 22 * 60 + 15, (p - 0.45) / 0.55);
    }
    const hrs = Math.floor(totalMinutes / 60) % 24;
    const mins = Math.floor(totalMinutes % 60);
    if (this.hudTime) {
      this.hudTime.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    const baseKw = Math.round(lerp(18, 485, Math.pow(daylight, 1.15)));
    const boostAdd = this.flowBoost ? Math.round(baseKw * 0.2) : 0;
    if (this.hudSolar) {
      this.hudSolar.textContent = `${baseKw + boostAdd} kW`;
    }

    if (this.hudEv) {
      const bolt = evChargingFactor > 0.25 ? ' ⚡' : '';
      this.hudEv.textContent = `${evBatteryPct}%${bolt}`;
    }

    if (this.hudGrid) {
      let key = 'gridDayCity';
      if (this.previewMode === 'night') {
        key = 'gridNightEco';
      } else if (this.previewMode === 'sunset') {
        key = 'gridEveningDrive';
      } else if (this.previewMode === 'day') {
        key = 'gridDayCity';
      } else if (p >= 0.33 && p <= 0.52) {
        key = 'gridCharging';
      } else if (p > 0.52 && p < 0.65) {
        key = 'gridEveningDrive';
      } else if (p >= 0.65 && p < 0.85) {
        key = 'gridEveningHome';
      } else if (p >= 0.85) {
        key = 'gridNightEco';
      }
      this.hudGrid.textContent = this.i18n.get(key);
    }
  }
}
