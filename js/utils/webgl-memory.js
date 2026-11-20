/**
 * Shared WebGL memory management & device performance tiering helpers.
 * Ensures only one 3D WebGL context/scene occupies GPU/VRAM at a time and
 * releases all geometries, materials, textures, and shadow maps on modal close.
 */

export function getDevicePerfTier() {
  const w = window.innerWidth || 1280;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isMobile = w <= 680 || /Mobi|Android|iPhone|iPod/i.test(ua);
  const isTablet = !isMobile && (w <= 1024 || /iPad|Tablet/i.test(ua));
  const dpr = window.devicePixelRatio || 1;

  return {
    isMobile,
    isTablet,
    maxPixelRatio: isMobile ? Math.min(dpr, 1.35) : isTablet ? Math.min(dpr, 1.6) : Math.min(dpr, 2.0),
    shadowMapSize: isMobile ? 1024 : 2048
  };
}

function disposeMaterial(mat) {
  if (!mat) return;
  const mats = Array.isArray(mat) ? mat : [mat];
  mats.forEach((m) => {
    if (!m) return;
    ['map', 'emissiveMap', 'alphaMap', 'roughnessMap', 'metalnessMap', 'normalMap'].forEach((prop) => {
      if (m[prop] && typeof m[prop].dispose === 'function') {
        m[prop].dispose();
      }
    });
    if (typeof m.dispose === 'function') {
      m.dispose();
    }
  });
}

export function disposeSceneGraph(root) {
  if (!root) return;
  root.traverse((obj) => {
    if (obj.geometry && typeof obj.geometry.dispose === 'function') {
      obj.geometry.dispose();
    }
    if (obj.material) {
      disposeMaterial(obj.material);
    }
    if (obj.shadow && obj.shadow.map && typeof obj.shadow.map.dispose === 'function') {
      obj.shadow.map.dispose();
      obj.shadow.map = null;
    }
  });
}

export function destroyStudioRenderer(studio) {
  if (!studio) return;

  if (studio.controls && typeof studio.controls.dispose === 'function') {
    studio.controls.dispose();
    studio.controls = null;
  }

  if (studio.scene) {
    disposeSceneGraph(studio.scene);
    studio.scene.clear();
    studio.scene = null;
  }

  if (studio.renderer) {
    studio.renderer.renderLists?.dispose();
    studio.renderer.dispose();
    // Explicitly lose context & swap canvas so browser releases GPU memory immediately
    const gl = studio.renderer.getContext?.();
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    studio.renderer = null;
  }

  if (studio.canvas && studio.canvas.parentNode) {
    const freshCanvas = studio.canvas.cloneNode(false);
    freshCanvas.removeAttribute('style');
    freshCanvas.removeAttribute('width');
    freshCanvas.removeAttribute('height');
    studio.canvas.parentNode.replaceChild(freshCanvas, studio.canvas);
    studio.canvas = freshCanvas;
  } else {
    studio.canvas = null;
  }

  studio.camera = null;
  studio.xrayTargets = [];
  studio.batteryBarMats = [];
  studio.interiorLights = [];
  studio.circuits = {};
  studio.hotspotPins = [];
}
