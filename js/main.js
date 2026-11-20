import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { I18nManager } from './i18n.js';
import { buildSmartCityWorld } from './scene-builder.js';
import { ScrollDirector } from './scroll-director.js';
import { PagesRouter } from './pages-router.js';
import { getDevicePerfTier } from './utils/webgl-memory.js';

function initApp() {
  const i18n = new I18nManager('en');
  i18n.applyToDOM();

  const canvas = document.getElementById('city-canvas');
  const storyTrack = document.getElementById('story-track');
  const perfTier = getDevicePerfTier();

  // ---------------------------------------------------------------------------
  // 1. THREE.JS RENDERER, SCENE, CAMERA & ORBIT CONTROLS
  // ---------------------------------------------------------------------------
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !perfTier.isMobile,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.error('WebGL initialization failed:', err);
    return;
  }

  renderer.setPixelRatio(perfTier.maxPixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e3edf8');
  scene.fog = new THREE.FogExp2('#e3edf8', 0.0035);

  const camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    0.5,
    350
  );
  camera.position.set(-32, 27, 38);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 12;
  controls.maxDistance = 120;
  controls.enabled = false;
  controls.target.set(-16, 2, -1.5);

  // Build procedural 3D world
  const world = buildSmartCityWorld(scene);
  if (world.dirLight?.shadow && perfTier.shadowMapSize !== 2048) {
    world.dirLight.shadow.mapSize.set(perfTier.shadowMapSize, perfTier.shadowMapSize);
  }
  const director = new ScrollDirector(scene, camera, world, i18n);

  // ---------------------------------------------------------------------------
  // 2. SCROLL CALCULATION MAPPED TO STORY TRACK
  // ---------------------------------------------------------------------------
  function computeStoryProgress() {
    if (!storyTrack) return 0;
    const rect = storyTrack.getBoundingClientRect();
    const totalScrollable = Math.max(1, storyTrack.offsetHeight - window.innerHeight);
    const scrolled = -rect.top;
    return Math.max(0, Math.min(1, scrolled / totalScrollable));
  }

  function updateActiveChapterHighlight(p) {
    const cards = document.querySelectorAll('.story-card');
    cards.forEach((card) => {
      const start = parseFloat(card.dataset.start || '0');
      const end = parseFloat(card.dataset.end || '1');
      const active = p >= start && p <= end;
      card.classList.toggle('is-active', active);
    });

    const dots = document.querySelectorAll('.stage-dot');
    dots.forEach((dot) => {
      const start = parseFloat(dot.dataset.start || '0');
      const end = parseFloat(dot.dataset.end || '1');
      dot.classList.toggle('active', p >= start && p <= end);
    });
  }

  function handleScroll() {
    const p = computeStoryProgress();
    director.setScrollProgress(p);
    updateActiveChapterHighlight(p);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ---------------------------------------------------------------------------
  // 3. RESIZE HANDLER
  // ---------------------------------------------------------------------------
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(getDevicePerfTier().maxPixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    handleScroll();
  });

  // ---------------------------------------------------------------------------
  // 4. LANGUAGE SWITCHER & DYNAMIC CONTROL BAR
  // ---------------------------------------------------------------------------
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      i18n.setLanguage(lang);
      updateControlLabels();
      updateCalculator();
    });
  });

  const btnStoryMode = document.getElementById('btn-mode-story');
  const btnOrbitMode = document.getElementById('btn-mode-orbit');
  const btnFlowBoost = document.getElementById('btn-flow-boost');
  const btnDayNight = document.getElementById('btn-day-night');
  const orbitHint = document.getElementById('orbit-hint');
  const btnEnter3dCta = document.getElementById('btn-enter-3d');
  const btnBackTopCta = document.getElementById('btn-back-top');

  function setOrbitMode(enabled) {
    director.setFreeOrbitMode(enabled);
    controls.enabled = enabled;
    document.body.classList.toggle('orbit-active', enabled);

    if (enabled) {
      // Sync orbit target cleanly to current view focus
      controls.target.copy(director._camTarget);
      controls.update();
    }

    btnStoryMode?.classList.toggle('active', !enabled);
    btnOrbitMode?.classList.toggle('active', enabled);
    if (orbitHint) {
      orbitHint.hidden = !enabled;
    }
  }

  btnStoryMode?.addEventListener('click', () => setOrbitMode(false));
  btnOrbitMode?.addEventListener('click', () => setOrbitMode(true));
  btnEnter3dCta?.addEventListener('click', () => setOrbitMode(true));
  btnBackTopCta?.addEventListener('click', () => {
    setOrbitMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  let flowBoostEnabled = false;
  function updateControlLabels() {
    if (btnFlowBoost) {
      btnFlowBoost.textContent = i18n.get(
        flowBoostEnabled ? 'btnFlowBoostActive' : 'btnFlowBoost'
      );
      btnFlowBoost.classList.toggle('active', flowBoostEnabled);
    }
  }

  btnFlowBoost?.addEventListener('click', () => {
    flowBoostEnabled = !flowBoostEnabled;
    director.setFlowBoost(flowBoostEnabled);
    updateControlLabels();
  });

  btnDayNight?.addEventListener('click', () => {
    const isNight = director.toggleDayNightPreview();
    btnDayNight.classList.toggle('active', isNight);
  });

  function getStageScrollY(stageId) {
    if (stageId === 'stage-1') return 0;
    const stageEl = document.getElementById(stageId);
    if (!stageEl) return 0;
    const card = stageEl.querySelector('.story-card');
    if (card) {
      const cardRect = card.getBoundingClientRect();
      const cardDocCenter = window.scrollY + cardRect.top + cardRect.height / 2;
      const openViewportCenter = (window.innerHeight + 110) / 2;
      return Math.max(0, cardDocCenter - openViewportCenter);
    }
    return Math.max(0, stageEl.offsetTop - 110);
  }

  // Smooth Jump Links for Chapters & Navbar
  function scrollToStage(stageId) {
    setOrbitMode(false);
    window.scrollTo({ top: getStageScrollY(stageId), behavior: 'smooth' });
  }

  let driveAnimId = null;
  function cancelDriveAnim() {
    if (driveAnimId !== null) {
      cancelAnimationFrame(driveAnimId);
      driveAnimId = null;
    }
  }
  window.addEventListener('wheel', cancelDriveAnim, { passive: true });
  window.addEventListener('touchstart', cancelDriveAnim, { passive: true });

  function playDriveHomeToStore() {
    cancelDriveAnim();
    setOrbitMode(false);
    const yStage3 = getStageScrollY('stage-3');
    const yStage4 = getStageScrollY('stage-4');
    const startFromHome = computeStoryProgress() < 0.54;
    const startY = startFromHome ? yStage3 : window.scrollY;

    if (startFromHome) {
      window.scrollTo({ top: yStage3, behavior: 'auto' });
      director.smoothProgress = 0.64;
      director.setScrollProgress(0.64);
    }

    const duration = 2200;
    const delay = startFromHome ? 320 : 0;
    const startTime = performance.now() + delay;

    function step(now) {
      if (now < startTime) {
        driveAnimId = requestAnimationFrame(step);
        return;
      }
      const t = Math.min(1, (now - startTime) / duration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      window.scrollTo({ top: startY + (yStage4 - startY) * ease, behavior: 'auto' });
      if (t < 1) {
        driveAnimId = requestAnimationFrame(step);
      } else {
        driveAnimId = null;
      }
    }

    driveAnimId = requestAnimationFrame(step);
  }

  document.querySelectorAll('[data-jump-stage]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      pagesRouter.closeSubpage();
      const stageId = el.getAttribute('data-jump-stage');
      if (stageId) {
        scrollToStage(stageId);
      }
    });
  });

  document.querySelectorAll('a[href^="#"]:not([data-jump-stage])').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#' || id.startsWith('#page/')) return;
      const targetEl = document.querySelector(id);
      if (targetEl) {
        e.preventDefault();
        pagesRouter.closeSubpage();
        setOrbitMode(false);
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  let acStudio = null;
  let homeStudio = null;
  let cityRafId = null;
  let isCityHibernated = false;

  function hibernateCityRenderer() {
    isCityHibernated = true;
    if (cityRafId !== null) {
      cancelAnimationFrame(cityRafId);
      cityRafId = null;
    }
    if (world.dirLight?.shadow?.map) {
      world.dirLight.shadow.map.dispose();
      world.dirLight.shadow.map = null;
    }
    renderer.renderLists?.dispose();
  }

  function resumeCityRenderer() {
    if (acStudio?.isOpen || homeStudio?.isOpen || pagesRouter?.activeSlug || document.hidden) {
      return;
    }
    isCityHibernated = false;
    lastTime = null;
    if (cityRafId === null) {
      cityRafId = requestAnimationFrame(animate);
    }
  }

  async function openAcStudio() {
    homeStudio?.close();
    hibernateCityRenderer();
    if (!acStudio) {
      const { AcStudio3D } = await import('./ac-studio-3d.js');
      acStudio = new AcStudio3D({
        i18n,
        onRequestQuote: () => pagesRouter.openPage('neo-clim-location'),
        onClose: () => resumeCityRenderer()
      });
    }
    acStudio.open();
  }

  async function openHomeStudio() {
    acStudio?.close();
    hibernateCityRenderer();
    if (!homeStudio) {
      const { HomeStudio3D } = await import('./home-studio-3d.js');
      homeStudio = new HomeStudio3D({
        i18n,
        onRequestQuote: () => pagesRouter.openPage('neo-home'),
        onClose: () => resumeCityRenderer()
      });
    }
    homeStudio.open();
  }

  const pagesRouter = new PagesRouter({
    i18n,
    onNavigateHome: (type, target) => {
      if (type === 'clim-drive') {
        playDriveHomeToStore();
      } else if (type === 'stage') {
        scrollToStage(target);
      } else if (type === 'anchor') {
        setOrbitMode(false);
        const el = document.querySelector(target);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    onCategoryTrigger: (catId) => {
      if (catId === 'climatisation') {
        playDriveHomeToStore();
      }
    },
    onOpenAcStudio: () => openAcStudio(),
    onOpenHomeStudio: () => openHomeStudio(),
    onSubpageToggle: (isOpen) => {
      if (isOpen) {
        renderer.render(scene, camera);
        hibernateCityRenderer();
      } else {
        resumeCityRenderer();
      }
    }
  });

  document.getElementById('btn-open-ac-studio')?.addEventListener('click', () => {
    openAcStudio();
  });

  document.getElementById('btn-open-home-studio')?.addEventListener('click', () => {
    openHomeStudio();
  });

  if (window.location.hash === '#ac-studio') {
    openAcStudio();
  } else if (window.location.hash === '#home-studio') {
    openHomeStudio();
  }
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#ac-studio') {
      openAcStudio();
    } else if (window.location.hash === '#home-studio') {
      openHomeStudio();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hibernateCityRenderer();
    } else {
      resumeCityRenderer();
    }
  });

  document.getElementById('btn-open-neoclim')?.addEventListener('click', () => {
    pagesRouter.openPage('neo-clim-solaire');
  });
  document.getElementById('btn-open-zephyr')?.addEventListener('click', () => {
    pagesRouter.openPage('zephyr-cooler');
  });

  i18n.onChange(() => {
    pagesRouter.renderMenus();
    if (pagesRouter.activeSlug) {
      pagesRouter.renderSubpage(pagesRouter.activeSlug);
    }
    acStudio?.syncLanguage();
    homeStudio?.syncLanguage();
  });

  // ---------------------------------------------------------------------------
  // 5. INTERACTIVE SOLAR & SMART LED ROI CALCULATOR
  // ---------------------------------------------------------------------------
  const inputRoof = document.getElementById('calc-roof');
  const inputPoles = document.getElementById('calc-poles');
  const inputEv = document.getElementById('calc-ev');
  const inputSun = document.getElementById('calc-sun');

  const valRoof = document.getElementById('calc-roof-val');
  const valPoles = document.getElementById('calc-poles-val');
  const valEv = document.getElementById('calc-ev-val');

  const outSolar = document.getElementById('calc-res-solar');
  const outSavings = document.getElementById('calc-res-savings');
  const outCo2 = document.getElementById('calc-res-co2');
  const outEvKm = document.getElementById('calc-res-evkm');

  function updateCalculator() {
    if (!inputRoof || !inputPoles || !inputEv || !inputSun) return;

    const roofArea = Number(inputRoof.value);
    const ledPoles = Number(inputPoles.value);
    const evDailyKm = Number(inputEv.value);
    const yieldPerKwp = Number(inputSun.value);

    if (valRoof) valRoof.textContent = `${roofArea} m²`;
    if (valPoles) valPoles.textContent = `${ledPoles}`;
    if (valEv) valEv.textContent = `${evDailyKm} km`;

    // ~0.21 kWp per m² modern bifacial panel
    const installedKwp = roofArea * 0.21;
    const annualSolarKwh = Math.round(installedKwp * yieldPerKwp);

    // Smart adaptive LED poles save ~310 kWh/pole/year vs legacy sodium lamps
    const ledSavedKwh = ledPoles * 310;
    const totalCleanKwh = annualSolarKwh + ledSavedKwh;

    // Average €0.24/kWh blended European tariff
    const annualEurSavings = Math.round(totalCleanKwh * 0.24);
    // ~0.38 kg CO2 avoided per kWh
    const co2Tonnes = ((totalCleanKwh * 0.38) / 1000).toFixed(1);

    // EV consumes ~0.16 kWh/km; 25% of solar output allocated or capped at annual commute * 1.4
    const maxAnnualSolarEvKm = Math.round((annualSolarKwh * 0.35) / 0.16);
    const annualCommuteKm = evDailyKm * 365;
    const freeSolarKm = Math.min(maxAnnualSolarEvKm, annualCommuteKm);

    if (outSolar) outSolar.textContent = `${annualSolarKwh.toLocaleString()} kWh`;
    if (outSavings) outSavings.textContent = `€${annualEurSavings.toLocaleString()}`;
    if (outCo2) outCo2.textContent = `${co2Tonnes} t`;
    if (outEvKm) outEvKm.textContent = `${freeSolarKm.toLocaleString()} km`;
  }

  [inputRoof, inputPoles, inputEv, inputSun].forEach((ctrl) => {
    ctrl?.addEventListener('input', updateCalculator);
    ctrl?.addEventListener('change', updateCalculator);
  });
  updateCalculator();
  updateControlLabels();

  // ---------------------------------------------------------------------------
  // 6. MAIN ANIMATION LOOP (WITH HIBERNATION SUPPORT)
  // ---------------------------------------------------------------------------
  let lastTime = null;
  function animate(now) {
    if (isCityHibernated) {
      cityRafId = null;
      return;
    }
    cityRafId = requestAnimationFrame(animate);
    if (lastTime === null) lastTime = now;
    const dt = Math.max(0, Math.min(0.05, (now - lastTime) / 1000));
    lastTime = now;
    const elapsed = now / 1000;

    director.update(dt, elapsed);
    if (controls.enabled) {
      controls.update();
    }
    renderer.render(scene, camera);
  }

  if (!isCityHibernated) {
    cityRafId = requestAnimationFrame(animate);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
