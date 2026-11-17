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
  // Smooth blend with subtle cubic feel
  const st = t * t * (3 - 2 * t);

  // Catmull-Rom helper for 1D channel
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

const CAMERA_KEYFRAMES = [
  { p: 0.0, pos: [-26, 20, 26], target: [-18, 2.5, -2] },
  { p: 0.14, pos: [-16, 13.5, 20], target: [-14, 2.2, -1] },
  { p: 0.24, pos: [-5, 7.2, 13], target: [-2.5, 1.2, -1.5] },
  { p: 0.34, pos: [1.8, 5.0, 5.2], target: [3.6, 1.5, -5.2] },
  { p: 0.50, pos: [10.8, 5.4, 3.6], target: [3.8, 1.5, -5.2] },
  { p: 0.59, pos: [15.5, 7.0, 11.2], target: [17.0, 1.4, -1.5] },
  { p: 0.66, pos: [23.2, 6.0, 6.0], target: [28.4, 1.9, -7.2] },
  { p: 0.80, pos: [33.8, 5.3, 3.8], target: [28.8, 2.2, -8.2] },
  { p: 0.90, pos: [18, 17, 28], target: [4, 1.5, -2] },
  { p: 1.0, pos: [6, 23, 35], target: [0, 1.5, -2] }
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
    this.forceNightPreview = false;

    this.flowClock = 0;
    this.wheelSpin = 0;
    this.prevEvPos = new THREE.Vector3(-25, 0.06, 0);

    // Pre-allocated vectors & colors
    this._camPos = new THREE.Vector3();
    this._camTarget = new THREE.Vector3();
    this._evPos = new THREE.Vector3();
    this._evNext = new THREE.Vector3();

    this._skyDay = new THREE.Color('#7dd3fc');
    this._skySunset = new THREE.Color('#fb923c');
    this._skyNight = new THREE.Color('#070d1f');
    this._skyCurrent = new THREE.Color();

    this._sunColorDay = new THREE.Color('#fff5e4');
    this._sunColorSunset = new THREE.Color('#ff8c42');
    this._sunColorNight = new THREE.Color('#3b82f6');
    this._sunColorCur = new THREE.Color();

    // Driving Curve 1: City Core -> Charging Station Bay (p: 0.0 -> 0.44)
    this.driveToStationCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-26.0, 0.06, 0.0),
      new THREE.Vector3(-18.0, 0.06, 0.0),
      new THREE.Vector3(-9.0, 0.06, 0.0),
      new THREE.Vector3(-2.5, 0.06, -0.2),
      new THREE.Vector3(0.4, 0.06, -2.6),
      new THREE.Vector3(1.8, 0.06, -4.8),
      new THREE.Vector3(4.0, 0.06, -5.2)
    ]);

    // Driving Curve 2: Charging Station Bay -> Evening Smart Home Driveway (p: 0.62 -> 0.76)
    this.driveToHomeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(4.0, 0.06, -5.2),
      new THREE.Vector3(6.8, 0.06, -4.6),
      new THREE.Vector3(9.4, 0.06, -1.8),
      new THREE.Vector3(13.5, 0.06, 0.0),
      new THREE.Vector3(21.5, 0.06, 0.0),
      new THREE.Vector3(26.6, 0.06, -0.6),
      new THREE.Vector3(28.6, 0.06, -2.6),
      new THREE.Vector3(29.0, 0.06, -5.4)
    ]);

    // DOM HUD elements
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
    this.forceNightPreview = !this.forceNightPreview;
    return this.forceNightPreview;
  }

  update(dt, elapsed) {
    const safeDt = Math.max(0, dt);
    // Smooth damping toward scroll target
    const damp = 1 - Math.exp(-5.5 * safeDt);
    this.smoothProgress += (this.targetProgress - this.smoothProgress) * damp;
    const p = this.smoothProgress;

    if (this.progressFill) {
      this.progressFill.style.width = `${(p * 100).toFixed(1)}%`;
    }

    // -------------------------------------------------------------------------
    // 1. CAMERA CHOREOGRAPHY (skipped if user is dragging in Free 3D Orbit)
    // -------------------------------------------------------------------------
    if (!this.freeOrbitMode) {
      sampleCameraKeyframes(CAMERA_KEYFRAMES, p, this._camPos, this._camTarget);
      this.camera.position.copy(this._camPos);
      this.camera.lookAt(this._camTarget);
    }

    // -------------------------------------------------------------------------
    // 2. ELECTRIC VEHICLE MOVEMENT & STATE
    // -------------------------------------------------------------------------
    let evChargingFactor = 0;
    let evHomeV2hFactor = 0;
    let evBatteryPct = 42;

    if (p < 0.34) {
      // Stage 1 -> Stage 2 Arrival: drive along Curve 1
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
      // Stage 2: Parked & Solar Charging at Station
      this._evPos.set(4.0, 0.06, -5.2);
      this.world.evCar.position.copy(this._evPos);
      this.world.evCar.rotation.y = Math.PI / 2;

      const chargeT = clamp((p - 0.34) / 0.18, 0, 1);
      evChargingFactor = Math.max(0.68, Math.sin(chargeT * Math.PI));
      evBatteryPct = Math.round(lerp(22, 100, chargeT));
    } else if (p <= 0.65) {
      // Stage 3 Transition: Evening drive from Station to Home Driveway
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
        // Align cleanly facing the house (-Z -> PI)
        this.world.evCar.rotation.y = Math.PI;
      }

      evBatteryPct = Math.round(lerp(100, 91, t));
    } else {
      // Stage 3 & 4: Parked at Smart Home Driveway powering evening V2H
      this._evPos.set(29.0, 0.06, -5.4);
      this.world.evCar.position.copy(this._evPos);
      this.world.evCar.rotation.y = Math.PI;

      evHomeV2hFactor = smoothstep(0.65, 0.70, p);
      evBatteryPct = Math.round(lerp(91, 84, clamp((p - 0.65) / 0.35, 0, 1)));
    }

    // Spin EV wheels based on actual world distance moved
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
    // 3. DAY -> SUNSET -> EVENING / NIGHT ATMOSPHERE
    // -------------------------------------------------------------------------
    // daylight = 1.0 (midday) -> 0.45 (sunset around p=0.58) -> 0.05 (evening/night p>=0.66)
    let daylight = 1.0 - smoothstep(0.49, 0.66, p);
    if (this.forceNightPreview) {
      daylight = 0.05;
    }
    const nightness = 1.0 - daylight;

    // Sky & Fog Color Blend: Day -> Sunset -> Night
    if (daylight > 0.45) {
      const k = (daylight - 0.45) / 0.55;
      this._skyCurrent.copy(this._skySunset).lerp(this._skyDay, k);
      this._sunColorCur.copy(this._sunColorSunset).lerp(this._sunColorDay, k);
    } else {
      const k = daylight / 0.45;
      this._skyCurrent.copy(this._skyNight).lerp(this._skySunset, k);
      this._sunColorCur.copy(this._sunColorNight).lerp(this._sunColorSunset, k);
    }

    this.scene.background = this._skyCurrent;
    if (this.scene.fog) {
      this.scene.fog.color.copy(this._skyCurrent);
    }

    // Sun & Moon Arcs
    const sunElevAngle = lerp(-0.18, 1.08, daylight);
    const sunRadius = 72;
    const sunX = lerp(-42, -16, daylight);
    const sunY = Math.sin(sunElevAngle) * sunRadius;
    const sunZ = -Math.cos(sunElevAngle) * 35;

    this.world.sunMesh.position.set(sunX, sunY, sunZ);
    this.world.sunMesh.visible = sunY > -6;
    this.world.dirLight.position.set(sunX * 0.5, Math.max(4, sunY * 0.65), Math.max(8, sunZ + 38));
    this.world.dirLight.color.copy(this._sunColorCur);
    this.world.dirLight.intensity = lerp(0.32, 1.85, daylight);

    this.world.hemiLight.intensity = lerp(0.32, 0.85, daylight);
    this.world.ambientLight.intensity = lerp(0.24, 0.48, daylight);

    // Moon rises opposite when nightness increases
    const moonY = lerp(-15, 36, nightness);
    this.world.moonMesh.position.set(34, moonY, -34);
    this.world.moonMesh.visible = moonY > -2;

    // Stars appear at dusk/night
    this.world.starsMat.opacity = clamp((nightness - 0.25) / 0.6, 0, 0.92);

    // -------------------------------------------------------------------------
    // 4. SMART-CITY-LED LIGHTS, BUILDING WINDOWS, EV HEADLIGHTS & VILLA
    // -------------------------------------------------------------------------
    const ledGlow = smoothstep(0.25, 0.72, nightness);

    this.world.streetLamps.forEach(({ bulbMat, coneMat }) => {
      bulbMat.emissiveIntensity = lerp(0.05, 2.4, ledGlow);
      if (coneMat) {
        coneMat.opacity = lerp(0.0, 0.26, ledGlow);
      }
    });

    this.world.buildingMaterials.forEach((mat) => {
      mat.emissiveIntensity = lerp(0.06, 1.15, ledGlow);
    });

    // EV Headlights & Tailbar turn on strongly in evening
    this.world.evHeadlightMat.emissiveIntensity = lerp(0.35, 3.0, ledGlow);
    this.world.evTaillightMat.emissiveIntensity = lerp(0.4, 2.2, ledGlow);
    this.world.evHeadlightCones.forEach((bm) => {
      bm.opacity = lerp(0.0, 0.24, ledGlow);
    });
    this.world.evHeadlightSpot.intensity = lerp(0.0, 2.8, ledGlow);

    // EV Roof Charging Ring
    this.world.evChargeRingMat.opacity = evChargingFactor * (0.65 + 0.35 * Math.sin(elapsed * 6));

    // Charging Station Glow
    this.world.stationBayRingMat.opacity = 0.28 + evChargingFactor * 0.65;
    this.world.stationLight.intensity = 0.5 + evChargingFactor * 2.2 + ledGlow * 1.4;
    this.world.stationStatusMats.forEach((sm, idx) => {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 5 + idx);
      sm.color.setHex(evChargingFactor > 0.2 ? (pulse > 0.4 ? 0x10b981 : 0x38bdf8) : 0x10b981);
    });

    // Smart Home Evening Interior & Wall Battery Glow
    const homeGlow = Math.max(ledGlow, evHomeV2hFactor);
    this.world.homeWindowMat.emissiveIntensity = lerp(0.08, 1.85, homeGlow);
    this.world.homeInteriorLight.intensity = lerp(0.0, 3.6, homeGlow);

    this.world.homeWallBatteryBars.forEach(({ barMat, index }) => {
      const wave = Math.sin(elapsed * 4 - index * 0.7) * 0.5 + 0.5;
      barMat.color.setHex(homeGlow > 0.35 ? (wave > 0.3 ? 0x34d399 : 0x38bdf8) : 0x10b981);
    });

    // -------------------------------------------------------------------------
    // 5. ANIMATED SOLAR TRACKING, HUB RINGS & ENERGY FLOW PARTICLES
    // -------------------------------------------------------------------------
    this.world.trackingPanels.forEach(({ panelGroup, baseTilt, phase }) => {
      panelGroup.rotation.x = baseTilt + Math.sin(elapsed * 0.6 + phase) * 0.04;
    });

    this.world.hubRings.forEach(({ ring, baseY, phase }) => {
      ring.position.y = baseY + Math.sin(elapsed * 2.2 + phase) * 0.08;
    });

    const speedMult = this.flowBoost ? 2.2 : 1.0;
    this.flowClock += safeDt * speedMult;

    // City Flows: brightest during daylight & active all day/night
    const cityStrength = lerp(0.45, 1.0, daylight) * (this.flowBoost ? 1.25 : 1.0);
    this.world.cityFlows.forEach((stream, sIdx) => {
      stream.tubeMat.opacity = 0.18 + cityStrength * 0.25;
      stream.beadMat.opacity = clamp(0.45 + cityStrength * 0.55, 0, 1);
      stream.beads.forEach((b) => {
        const u = wrap01(this.flowClock * 0.28 + b.offset + sIdx * 0.13);
        stream.curve.getPointAt(u, b.mesh.position);
        const s = 0.8 + cityStrength * 0.45;
        b.mesh.scale.setScalar(s);
      });
    });

    // Station Charging Flows: surges dramatically when EV is docked (Stage 2)
    const stationStrength = 0.25 + evChargingFactor * 0.95;
    this.world.stationFlows.forEach((stream, sIdx) => {
      stream.tubeMat.opacity = 0.12 + evChargingFactor * 0.48;
      stream.beadMat.opacity = 0.3 + evChargingFactor * 0.7;
      stream.beads.forEach((b) => {
        const rate = 0.35 + evChargingFactor * 0.55;
        const u = wrap01(this.flowClock * rate + b.offset + sIdx * 0.17);
        stream.curve.getPointAt(u, b.mesh.position);
        b.mesh.scale.setScalar(0.65 + stationStrength * 0.65);
      });
    });

    // Home Evening Flows: surges when dusk/evening arrives & EV parks at home (Stage 3)
    const homeStrength = Math.max(ledGlow * 0.75, evHomeV2hFactor);
    this.world.homeFlows.forEach((stream, sIdx) => {
      stream.tubeMat.opacity = 0.12 + homeStrength * 0.48;
      stream.beadMat.opacity = 0.25 + homeStrength * 0.75;
      stream.beads.forEach((b) => {
        const rate = 0.25 + homeStrength * 0.55;
        const u = wrap01(this.flowClock * rate + b.offset + sIdx * 0.21);
        stream.curve.getPointAt(u, b.mesh.position);
        b.mesh.scale.setScalar(0.6 + homeStrength * 0.7);
      });
    });

    // -------------------------------------------------------------------------
    // 6. UPDATE LIVE TELEMETRY HUD
    // -------------------------------------------------------------------------
    this.updateHUD(p, daylight, evBatteryPct, evChargingFactor, evHomeV2hFactor);
  }

  updateHUD(p, daylight, evBatteryPct, evChargingFactor, evHomeV2hFactor) {
    // Simulated Time from 12:30 (p=0) -> 16:00 (p=0.45) -> 18:45 sunset (p=0.58) -> 21:45 night (p=0.80+)
    let totalMinutes;
    if (this.forceNightPreview) {
      totalMinutes = 21 * 60 + 30;
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

    // Solar output kW
    const baseKw = Math.round(lerp(18, 485, Math.pow(daylight, 1.15)));
    const boostAdd = this.flowBoost ? Math.round(baseKw * 0.2) : 0;
    if (this.hudSolar) {
      this.hudSolar.textContent = `${baseKw + boostAdd} kW`;
    }

    // EV Battery
    if (this.hudEv) {
      const bolt = evChargingFactor > 0.25 ? ' ⚡' : '';
      this.hudEv.textContent = `${evBatteryPct}%${bolt}`;
    }

    // Grid Mode label (localized)
    if (this.hudGrid) {
      let key = 'gridDayCity';
      if (this.forceNightPreview) {
        key = 'gridNightEco';
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
