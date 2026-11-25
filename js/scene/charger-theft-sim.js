import * as THREE from 'three';

function buildHoodedThief() {
  const root = new THREE.Group();
  const hoodieMat = new THREE.MeshStandardMaterial({ color: '#141923', roughness: 0.78, metalness: 0.08 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: '#0f131b', roughness: 0.85 });
  const bootMat = new THREE.MeshStandardMaterial({ color: '#07090d', roughness: 0.6 });
  const maskMat = new THREE.MeshStandardMaterial({ color: '#1e2430', roughness: 0.65 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#c89b7b', roughness: 0.65 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: '#0b0e14', roughness: 0.5 });

  const hips = new THREE.Group();
  hips.position.y = 0.88;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.24), hoodieMat);
  torso.position.y = 0.28;
  torso.castShadow = true;
  hips.add(torso);

  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.06), pantsMat);
  pouch.position.set(0, 0.12, 0.13);
  hips.add(pouch);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.62, 0.02);
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.21, 0.19), skinMat);
  face.position.set(0, 0.08, 0.02);
  headGroup.add(face);
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.20), maskMat);
  mask.position.set(0, 0.02, 0.025);
  headGroup.add(mask);
  const hoodOuter = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.27, 0.28), hoodieMat);
  hoodOuter.position.set(0, 0.10, -0.02);
  hoodOuter.castShadow = true;
  headGroup.add(hoodOuter);
  const hoodRim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.12), hoodieMat);
  hoodRim.position.set(0, 0.21, 0.09);
  headGroup.add(hoodRim);
  hips.add(headGroup);

  function makeLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.12, 0.0, 0);
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.44, 0.16), pantsMat);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.44;
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.40, 0.14), pantsMat);
    shin.position.y = -0.20;
    shin.castShadow = true;
    knee.add(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.24), bootMat);
    boot.position.set(0, -0.40, 0.05);
    boot.castShadow = true;
    knee.add(boot);
    hip.add(knee);
    hips.add(hip);
    return { hip, knee };
  }

  function makeArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.27, 0.50, 0);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.34, 0.13), hoodieMat);
    upper.position.y = -0.17;
    upper.castShadow = true;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.30, 0.11), hoodieMat);
    forearm.position.y = -0.15;
    forearm.castShadow = true;
    elbow.add(forearm);
    const glove = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.11), gloveMat);
    glove.position.y = -0.31;
    elbow.add(glove);
    shoulder.add(elbow);
    hips.add(shoulder);
    return { shoulder, elbow, glove };
  }

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  const grinderAnchor = new THREE.Group();
  grinderAnchor.position.set(0, -0.34, 0.10);
  rightArm.elbow.add(grinderAnchor);

  return { root, hips, torso, headGroup, leftLeg, rightLeg, leftArm, rightArm, grinderAnchor };
}

function buildAngleGrinder() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4, metalness: 0.3 });
  const headMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.28, metalness: 0.85 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6 });
  const discMat = new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    emissive: new THREE.Color('#fb923c'),
    emissiveIntensity: 0.15,
    roughness: 0.2,
    metalness: 0.9
  });

  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.045, 0.28, 12), bodyMat);
  grip.rotation.x = Math.PI / 2;
  group.add(grip);

  const battery = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.12), darkMat);
  battery.position.set(0, -0.02, -0.15);
  group.add(battery);

  const gearHead = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.09, 0.11), headMat);
  gearHead.position.set(0, 0.01, 0.17);
  group.add(gearHead);

  const guard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.145, 0.04, 16, 1, false, 0, Math.PI * 1.15),
    darkMat
  );
  guard.position.set(0.05, 0, 0.22);
  guard.rotation.z = Math.PI / 2;
  group.add(guard);

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.012, 24), discMat);
  disc.position.set(0.06, 0, 0.22);
  disc.rotation.z = Math.PI / 2;
  group.add(disc);

  group.castShadow = true;
  return { group, disc, discMat };
}

const CAM_KEYFRAMES = [
  { t: 0.0, pos: new THREE.Vector3(-4.1, 2.35, 7.5), tgt: new THREE.Vector3(-0.9, 1.0, 1.1) },
  { t: 4.8, pos: new THREE.Vector3(-1.9, 1.85, 5.5), tgt: new THREE.Vector3(0.8, 0.78, 0.6) },
  { t: 8.6, pos: new THREE.Vector3(-2.4, 2.15, 6.3), tgt: new THREE.Vector3(0.45, 1.25, 0.4) },
  { t: 13.5, pos: new THREE.Vector3(-3.8, 2.55, 7.2), tgt: new THREE.Vector3(0.1, 1.35, 0.2) },
  { t: 18.8, pos: new THREE.Vector3(-4.4, 2.75, 7.8), tgt: new THREE.Vector3(0.3, 1.4, 0.1) }
];

/**
 * Interactive 3D anti-theft simulation rig: hooded intruder, angle grinder with
 * spark physics, 115 dB siren + soundwave rings, red strobe, and Web Audio SFX.
 */
export function createTheftSimController(scene) {
  const DURATION = 18.8;
  const thief = buildHoodedThief();
  thief.root.visible = false;
  scene.add(thief.root);

  const grinder = buildAngleGrinder();
  thief.grinderAnchor.add(grinder.group);
  let grinderDetached = false;
  const grinderVel = new THREE.Vector3();

  // 95-particle metallic spark fountain
  const SPARK_COUNT = 95;
  const sparkOrigin = new THREE.Vector3(1.12, 0.42, 0.72);
  const sparkGroup = new THREE.Group();
  sparkGroup.visible = false;
  const sparks = [];
  const sparkGeo = new THREE.BoxGeometry(0.022, 0.022, 0.11);
  for (let i = 0; i < SPARK_COUNT; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? '#fde047' : '#f97316',
      transparent: true,
      opacity: 0
    });
    const mesh = new THREE.Mesh(sparkGeo, mat);
    mesh.visible = false;
    sparkGroup.add(mesh);
    sparks.push({
      mesh,
      mat,
      pos: sparkOrigin.clone(),
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 0.5
    });
  }
  scene.add(sparkGroup);

  const sparkLight = new THREE.PointLight('#fb923c', 0, 6.5);
  sparkLight.position.copy(sparkOrigin).add(new THREE.Vector3(0, 0.15, 0));
  scene.add(sparkLight);

  // Expanding concentric 3D siren soundwave rings
  const soundwaveGroup = new THREE.Group();
  soundwaveGroup.position.set(0, 2.62, 0.08);
  soundwaveGroup.visible = false;
  const soundwaves = [];
  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? '#ff2a4b' : '#fca5a5',
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.028, 10, 48), mat);
    ring.rotation.x = Math.PI / 2;
    ring.visible = false;
    soundwaveGroup.add(ring);
    soundwaves.push({ mesh: ring, mat, offset: i / 5 });
  }
  scene.add(soundwaveGroup);

  const redStrobeLight = new THREE.PointLight('#ff1a3c', 0, 22);
  redStrobeLight.position.set(0, 2.75, 0.35);
  scene.add(redStrobeLight);

  const worldPos = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  const sparkLookTarget = new THREE.Vector3();

  let audioCtx = null;

  function stopAudio() {
    if (!audioCtx) return;
    const ctx = audioCtx;
    audioCtx = null;
    ctx.close().catch(() => {});
  }

  function startAudio() {
    stopAudio();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const masterGain = audioCtx.createGain();
      const t0 = audioCtx.currentTime + 0.05;
      masterGain.gain.setValueAtTime(0.28, t0);
      masterGain.connect(audioCtx.destination);

      // Angle Grinder Bandpass Noise & Motor Whine (5.2s -> 8.3s)
      const grindLen = 3.1;
      const noiseBuf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * grindLen), audioCtx.sampleRate);
      const nData = noiseBuf.getChannelData(0);
      for (let i = 0; i < nData.length; i++) {
        nData[i] = (Math.random() * 2 - 1) * 0.7;
      }
      const nSrc = audioCtx.createBufferSource();
      nSrc.buffer = noiseBuf;
      const bp = audioCtx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2800, t0 + 5.2);
      bp.Q.setValueAtTime(2.5, t0 + 5.2);
      const grindG = audioCtx.createGain();
      grindG.gain.setValueAtTime(0.001, t0 + 5.2);
      grindG.gain.linearRampToValueAtTime(0.22, t0 + 5.45);
      grindG.gain.setValueAtTime(0.2, t0 + 8.0);
      grindG.gain.exponentialRampToValueAtTime(0.001, t0 + 8.3);
      nSrc.connect(bp).connect(grindG).connect(masterGain);
      nSrc.start(t0 + 5.2);
      nSrc.stop(t0 + 8.32);

      const whine = audioCtx.createOscillator();
      const wg = audioCtx.createGain();
      whine.type = 'sawtooth';
      whine.frequency.setValueAtTime(310, t0 + 5.2);
      whine.frequency.linearRampToValueAtTime(440, t0 + 5.6);
      whine.frequency.linearRampToValueAtTime(380, t0 + 8.2);
      wg.gain.setValueAtTime(0.001, t0 + 5.2);
      wg.gain.linearRampToValueAtTime(0.1, t0 + 5.45);
      wg.gain.exponentialRampToValueAtTime(0.001, t0 + 8.3);
      whine.connect(wg).connect(masterGain);
      whine.start(t0 + 5.2);
      whine.stop(t0 + 8.32);

      // Blasting 115 dB Acoustic Siren (6.2s -> 18.6s)
      const siren1 = audioCtx.createOscillator();
      const siren2 = audioCtx.createOscillator();
      const sirenGain = audioCtx.createGain();
      const sirenFilter = audioCtx.createBiquadFilter();
      siren1.type = 'sawtooth';
      siren2.type = 'square';
      sirenFilter.type = 'lowpass';
      sirenFilter.frequency.setValueAtTime(2400, t0 + 6.2);

      for (let c = 0; c < 18; c++) {
        const ct = t0 + 6.2 + c * 0.68;
        if (ct >= t0 + 18.5) break;
        siren1.frequency.setValueAtTime(760, ct);
        siren1.frequency.linearRampToValueAtTime(1380, ct + 0.34);
        siren1.frequency.linearRampToValueAtTime(760, ct + 0.68);
        siren2.frequency.setValueAtTime(768, ct);
        siren2.frequency.linearRampToValueAtTime(1392, ct + 0.34);
        siren2.frequency.linearRampToValueAtTime(768, ct + 0.68);
      }

      sirenGain.gain.setValueAtTime(0.001, t0 + 6.2);
      sirenGain.gain.linearRampToValueAtTime(0.18, t0 + 6.32);
      sirenGain.gain.setValueAtTime(0.16, t0 + 16.5);
      sirenGain.gain.exponentialRampToValueAtTime(0.001, t0 + 18.6);

      siren1.connect(sirenFilter).connect(sirenGain).connect(masterGain);
      siren2.connect(sirenFilter);
      siren1.start(t0 + 6.2);
      siren2.start(t0 + 6.2);
      siren1.stop(t0 + 18.65);
      siren2.stop(t0 + 18.65);

      // Smartphone Notification Chime (7.45s)
      [0, 0.16, 0.32].forEach((off, idx) => {
        const nt = t0 + 7.45 + off;
        const nOsc = audioCtx.createOscillator();
        const ng = audioCtx.createGain();
        nOsc.type = 'triangle';
        nOsc.frequency.setValueAtTime(idx === 1 ? 1567.98 : 1174.66, nt);
        ng.gain.setValueAtTime(0.001, nt);
        ng.gain.linearRampToValueAtTime(0.24, nt + 0.015);
        ng.gain.exponentialRampToValueAtTime(0.001, nt + 0.14);
        nOsc.connect(ng).connect(masterGain);
        nOsc.start(nt);
        nOsc.stop(nt + 0.15);
      });

      // Dropped Metallic Tool Clatter (8.7s)
      [0, 0.14].forEach((off, idx) => {
        const dtImp = t0 + 8.7 + off;
        const clank = audioCtx.createOscillator();
        const cg = audioCtx.createGain();
        clank.type = 'triangle';
        clank.frequency.setValueAtTime(240 - idx * 45, dtImp);
        clank.frequency.exponentialRampToValueAtTime(65, dtImp + 0.12);
        cg.gain.setValueAtTime(0.25 - idx * 0.1, dtImp);
        cg.gain.exponentialRampToValueAtTime(0.001, dtImp + 0.14);
        clank.connect(cg).connect(masterGain);
        clank.start(dtImp);
        clank.stop(dtImp + 0.16);
      });
    } catch {
      // Audio playback blocked by browser policy
    }
  }

  function resetSpark(s) {
    s.pos.copy(sparkOrigin);
    const angle = (Math.random() - 0.35) * Math.PI * 1.4;
    const speed = 2.4 + Math.random() * 4.8;
    s.vel.set(Math.cos(angle) * speed, 0.6 + Math.random() * 3.4, Math.sin(angle) * speed * 0.85);
    s.life = 0.001;
    s.maxLife = 0.28 + Math.random() * 0.42;
    s.mesh.visible = true;
  }

  function updateSparks(dt, active) {
    sparkLight.intensity = active ? 2.5 + Math.random() * 4.5 : 0;
    sparks.forEach((s) => {
      if (s.life <= 0) {
        if (active && Math.random() < 0.48) {
          resetSpark(s);
        } else {
          s.mesh.visible = false;
          return;
        }
      }
      s.life += dt;
      if (s.life >= s.maxLife) {
        s.life = 0;
        if (active) resetSpark(s);
        else s.mesh.visible = false;
        return;
      }
      s.vel.y -= 11.5 * dt;
      s.pos.addScaledVector(s.vel, dt);
      if (s.pos.y < 0.13) {
        s.pos.y = 0.13;
        s.vel.y *= -0.45;
        s.vel.x *= 0.72;
        s.vel.z *= 0.72;
      }
      s.mesh.position.copy(s.pos);
      sparkLookTarget.copy(s.pos).add(s.vel);
      s.mesh.lookAt(sparkLookTarget);
      s.mat.opacity = 1 - s.life / s.maxLife;
    });
  }

  function updateSoundwaves(simTime, active) {
    soundwaves.forEach((sw) => {
      sw.mesh.visible = active;
      if (!active) return;
      const p = (sw.offset + simTime * 1.15) % 1;
      const sc = 0.45 + p * 6.4;
      sw.mesh.scale.set(sc, sc, 1);
      sw.mesh.position.y = Math.sin(p * Math.PI) * 0.12 - p * 0.45;
      sw.mat.opacity = Math.pow(1 - p, 1.4) * 0.88;
    });
  }

  function reset() {
    stopAudio();
    thief.root.visible = false;
    grinder.group.visible = false;
    sparkGroup.visible = false;
    soundwaveGroup.visible = false;
    sparkLight.intensity = 0;
    redStrobeLight.intensity = 0;

    sparks.forEach((s) => {
      s.life = 0;
      s.mesh.visible = false;
    });
    soundwaves.forEach((sw) => {
      sw.mesh.visible = false;
    });

    if (grinderDetached || grinder.group.parent !== thief.grinderAnchor) {
      grinder.group.parent?.remove(grinder.group);
      thief.grinderAnchor.add(grinder.group);
    }
    grinder.group.position.set(0, 0, 0);
    grinder.group.rotation.set(0, 0, 0);
    grinder.group.quaternion.identity();
    grinderVel.set(0, 0, 0);
    grinderDetached = false;

    thief.root.position.set(-4.8, 0.12, 2.8);
    thief.root.rotation.set(0, Math.atan2(5.52, -1.48), 0);
    thief.hips.position.set(0, 0.88, 0);
    thief.torso.rotation.set(0, 0, 0);
    thief.headGroup.rotation.set(0, 0, 0);
    thief.leftLeg.hip.rotation.set(0, 0, 0);
    thief.leftLeg.knee.rotation.set(0, 0, 0);
    thief.rightLeg.hip.rotation.set(0, 0, 0);
    thief.rightLeg.knee.rotation.set(0, 0, 0);
    thief.leftArm.shoulder.rotation.set(0, 0, 0);
    thief.leftArm.elbow.rotation.set(0, 0, 0);
    thief.rightArm.shoulder.rotation.set(0, 0, 0);
    thief.rightArm.elbow.rotation.set(0, 0, 0);
  }

  function start() {
    reset();
    thief.root.visible = true;
    grinder.group.visible = true;
    sparkGroup.visible = true;
    soundwaveGroup.visible = true;
    startAudio();
  }

  function sampleCamera(simTime, outPos, outTgt) {
    let i = 0;
    while (i < CAM_KEYFRAMES.length - 2 && simTime > CAM_KEYFRAMES[i + 1].t) i++;
    const k0 = CAM_KEYFRAMES[i];
    const k1 = CAM_KEYFRAMES[i + 1];
    const u = Math.min(1, Math.max(0, (simTime - k0.t) / (k1.t - k0.t)));
    const s = u * u * (3 - 2 * u);
    outPos.lerpVectors(k0.pos, k1.pos, s);
    outTgt.lerpVectors(k0.tgt, k1.tgt, s);
  }

  function update(dt, simTime) {
    const isGrinding = simTime >= 5.2 && simTime < 8.3;
    const isAlarm = simTime >= 6.2 && simTime < DURATION;

    if (simTime < 4.8) {
      const p = simTime / 4.8;
      const sm = p * p * (3 - 2 * p);
      thief.root.position.set(-4.8 + sm * 5.52, 0.12, 2.8 - sm * 1.48);
      thief.root.rotation.y = Math.atan2(5.52, -1.48);
      thief.hips.position.y = 0.88 + Math.abs(Math.sin(simTime * 5.5)) * 0.04;
      const swing = Math.sin(simTime * 5.5) * 0.45;
      thief.leftLeg.hip.rotation.x = swing;
      thief.rightLeg.hip.rotation.x = -swing;
      thief.leftLeg.knee.rotation.x = Math.max(0, -swing) * 0.5;
      thief.rightLeg.knee.rotation.x = Math.max(0, swing) * 0.5;
      thief.leftArm.shoulder.rotation.x = -swing * 0.5;
      thief.rightArm.shoulder.rotation.x = -0.35;
      thief.rightArm.elbow.rotation.x = -0.55;
    } else if (simTime < 8.2) {
      thief.root.position.set(0.72, 0.12, 1.32);
      thief.root.rotation.y = Math.atan2(1.12 - 0.72, 0.72 - 1.32);
      const crouch = Math.min(1, (simTime - 4.8) / 0.45);
      thief.hips.position.y = 0.88 - crouch * 0.24;
      thief.torso.rotation.x = crouch * 0.45;
      thief.leftLeg.hip.rotation.x = -crouch * 0.65;
      thief.leftLeg.knee.rotation.x = crouch * 1.05;
      thief.rightLeg.hip.rotation.x = -crouch * 0.55;
      thief.rightLeg.knee.rotation.x = crouch * 0.95;
      const jitter = isGrinding ? Math.sin(simTime * 45) * 0.025 : 0;
      thief.rightArm.shoulder.rotation.x = -1.05 + jitter;
      thief.rightArm.elbow.rotation.x = -0.45 + jitter;
      thief.leftArm.shoulder.rotation.x = -0.95;
      thief.leftArm.elbow.rotation.x = -0.5;
    } else if (simTime < 9.4) {
      const fl = Math.min(1, (simTime - 8.2) / 0.35);
      thief.hips.position.y = 0.64 + fl * 0.26;
      thief.torso.rotation.x = 0.45 - fl * 0.65;
      thief.headGroup.rotation.y = Math.sin(simTime * 22) * 0.25;
      thief.leftLeg.hip.rotation.x = -0.65 + fl * 0.6;
      thief.leftLeg.knee.rotation.x = 1.05 - fl * 0.9;
      thief.rightLeg.hip.rotation.x = -0.55 + fl * 0.5;
      thief.rightLeg.knee.rotation.x = 0.95 - fl * 0.8;
      thief.leftArm.shoulder.rotation.x = -2.2 * fl;
      thief.leftArm.elbow.rotation.x = -1.4 * fl;
      thief.rightArm.shoulder.rotation.x = -2.1 * fl;
      thief.rightArm.elbow.rotation.x = -1.2 * fl;
    } else {
      const runT = Math.min(1, (simTime - 9.4) / 6.2);
      thief.root.position.set(0.72 - runT * 11.5, 0.12, 1.32 + runT * 4.0);
      thief.root.rotation.y = Math.atan2(-11.5, 4.0);
      thief.hips.position.y = 0.86 + Math.abs(Math.sin(simTime * 14.5)) * 0.09;
      thief.torso.rotation.x = 0.28;
      thief.headGroup.rotation.y = 0;
      const rSwing = Math.sin(simTime * 14.5) * 0.95;
      thief.leftLeg.hip.rotation.x = rSwing;
      thief.rightLeg.hip.rotation.x = -rSwing;
      thief.leftLeg.knee.rotation.x = Math.max(0, -rSwing) * 1.1;
      thief.rightLeg.knee.rotation.x = Math.max(0, rSwing) * 1.1;
      thief.leftArm.shoulder.rotation.x = -rSwing * 0.85;
      thief.rightArm.shoulder.rotation.x = rSwing * 0.85;
      thief.leftArm.elbow.rotation.x = -0.95;
      thief.rightArm.elbow.rotation.x = -0.95;
    }

    if (isGrinding || simTime < 8.4) {
      grinder.disc.rotation.x += (isGrinding ? 42.0 : 8.0) * dt;
      grinder.discMat.emissiveIntensity = isGrinding ? 1.4 : 0.1;
    } else {
      grinder.disc.rotation.x += Math.max(0, 8.0 - (simTime - 8.4) * 5.0) * dt;
      grinder.discMat.emissiveIntensity = 0.05;
    }

    if (simTime >= 8.35 && !grinderDetached) {
      grinderDetached = true;
      grinder.group.getWorldPosition(worldPos);
      grinder.group.getWorldQuaternion(worldQuat);
      thief.grinderAnchor.remove(grinder.group);
      scene.add(grinder.group);
      grinder.group.position.copy(worldPos);
      grinder.group.quaternion.copy(worldQuat);
      grinderVel.set(-0.45, 0.4, 0.55);
    }
    if (grinderDetached && (grinder.group.position.y > 0.15 || grinderVel.y > 0)) {
      grinderVel.y -= 11.0 * dt;
      grinder.group.position.addScaledVector(grinderVel, dt);
      grinder.group.rotation.z += 4.5 * dt;
      if (grinder.group.position.y <= 0.15) {
        grinder.group.position.y = 0.15;
        if (Math.abs(grinderVel.y) > 0.6) {
          grinderVel.y *= -0.35;
          grinderVel.x *= 0.55;
          grinderVel.z *= 0.55;
        } else {
          grinderVel.set(0, 0, 0);
        }
      }
    }

    redStrobeLight.intensity = isAlarm ? (Math.sin(simTime * 22) > 0 ? 1 : 0.08) * 16.0 : 0;
    updateSparks(dt, isGrinding);
    updateSoundwaves(simTime, isAlarm);

    const phase =
      simTime < 4.8 ? 'approach' : simTime < 6.2 ? 'grind' : simTime < 9.4 ? 'alarm' : 'flee';

    return {
      isGrinding,
      isAlarm,
      showPhone: simTime >= 7.2 && simTime < 16.9,
      phoneBuzz: simTime >= 7.45 && simTime < 9.2,
      thiefRetreating: simTime >= 8.4,
      phase,
      finished: simTime >= DURATION
    };
  }

  return {
    DURATION,
    start,
    reset,
    sampleCamera,
    update
  };
}
