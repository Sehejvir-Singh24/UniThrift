/**
 * UniMatch Cloud Layer
 * Renders fluffy SVG cumulus clouds that drift across the screen from right → left.
 * Self-contained: just include this script once per page.
 */
(function () {
  if (document.getElementById('um-cloud-layer')) return; // prevent double-inject

  // ─── Config ────────────────────────────────────────────────────────────────
  const CLOUDS = [
    // { top %, widthPx, opacity, durationSec, delaySec }
    { top:  4, w: 420, op: 0.22, dur: 55, delay:  -8 },
    { top: 22, w: 520, op: 0.18, dur: 75, delay: -40 },
    { top: 10, w: 300, op: 0.25, dur: 44, delay: -20 },
    { top: 44, w: 460, op: 0.20, dur: 68, delay: -55 },
    { top: 62, w: 350, op: 0.16, dur: 52, delay: -15 },
    { top: 15, w: 600, op: 0.15, dur: 85, delay: -65 },
    { top: 75, w: 380, op: 0.22, dur: 60, delay: -30 },
    { top: 50, w: 260, op: 0.18, dur: 46, delay:  -5 },
  ];

  // Different cloud SVG shapes for variety
  const CLOUD_PATHS = [
    // Classic cumulus
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160">
      <ellipse cx="200" cy="130" rx="195" ry="30" fill="currentColor"/>
      <ellipse cx="100" cy="110" rx="70" ry="55" fill="currentColor"/>
      <ellipse cx="175" cy="90"  rx="85" ry="70" fill="currentColor"/>
      <ellipse cx="265" cy="100" rx="80" ry="62" fill="currentColor"/>
      <ellipse cx="330" cy="115" rx="65" ry="48" fill="currentColor"/>
      <ellipse cx="220" cy="72"  rx="60" ry="55" fill="currentColor"/>
    </svg>`,
    // Wide flat cloud
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 120">
      <ellipse cx="250" cy="95" rx="245" ry="25" fill="currentColor"/>
      <ellipse cx="120" cy="80" rx="85"  ry="50" fill="currentColor"/>
      <ellipse cx="220" cy="65" rx="100" ry="60" fill="currentColor"/>
      <ellipse cx="340" cy="75" rx="90"  ry="52" fill="currentColor"/>
      <ellipse cx="420" cy="85" rx="70"  ry="40" fill="currentColor"/>
      <ellipse cx="275" cy="50" rx="65"  ry="48" fill="currentColor"/>
      <ellipse cx="170" cy="55" rx="55"  ry="42" fill="currentColor"/>
    </svg>`,
    // Puffy tall cloud
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180">
      <ellipse cx="180" cy="150" rx="175" ry="30" fill="currentColor"/>
      <ellipse cx="90"  cy="125" rx="75"  ry="60" fill="currentColor"/>
      <ellipse cx="180" cy="100" rx="90"  ry="80" fill="currentColor"/>
      <ellipse cx="275" cy="120" rx="78"  ry="65" fill="currentColor"/>
      <ellipse cx="185" cy="65"  rx="65"  ry="60" fill="currentColor"/>
      <ellipse cx="130" cy="80"  rx="50"  ry="50" fill="currentColor"/>
      <ellipse cx="240" cy="78"  rx="55"  ry="52" fill="currentColor"/>
    </svg>`,
  ];

  // Palette of soft peach / blush / lavender tones
  const COLORS = [
    'rgba(255, 248, 250, 0.92)',
    'rgba(255, 234, 241, 0.88)',
    'rgba(250, 225, 235, 0.85)',
    'rgba(252, 242, 252, 0.87)',
    'rgba(255, 255, 255, 0.95)',
  ];

  // ─── Inject keyframes + layer styles ──────────────────────────────────────
  const style = document.createElement('style');
  style.id = 'um-cloud-styles';
  style.textContent = `
    #um-cloud-layer {
      position: fixed;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      overflow: hidden;
    }
    .um-cloud {
      position: absolute;
      will-change: transform;
      animation: umCloudDrift linear infinite;
    }
    .um-cloud svg {
      display: block;
      width: 100%;
      height: auto;
      animation: umCloudBob ease-in-out infinite alternate;
      filter: blur(2px);
    }
    @keyframes umCloudDrift {
      from { transform: translateX(115vw); }
      to   { transform: translateX(-120%); }
    }
    @keyframes umCloudBob {
      from { transform: translateY(0px); }
      to   { transform: translateY(-14px); }
    }
    /* ── Elevate z-index for fixed elements ── */
    .um-header, header { z-index: 50 !important; }
    .um-bottom-nav, nav.um-bottom-nav { z-index: 100 !important; }
    #match-modal { z-index: 1000 !important; }
  `;
  document.head.appendChild(style);

  // ─── Build cloud layer ─────────────────────────────────────────────────────
  const layer = document.createElement('div');
  layer.id = 'um-cloud-layer';
  layer.setAttribute('aria-hidden', 'true');

  CLOUDS.forEach((cfg, i) => {
    const el = document.createElement('div');
    el.className = 'um-cloud';
    el.style.cssText = [
      `top:${cfg.top}%`,
      `width:${cfg.w}px`,
      `opacity:${cfg.op}`,
      `animation-duration:${cfg.dur}s`,
      `animation-delay:${cfg.delay}s`,
      `color:${COLORS[i % COLORS.length]}`,
    ].join(';');

    // Pick a cloud shape variant
    el.innerHTML = CLOUD_PATHS[i % CLOUD_PATHS.length];

    // Set individual bob speed per cloud
    const bobDur = 3 + (i % 4) * 1.5;
    const bobDelay = (i * 0.55).toFixed(2);
    const svg = el.querySelector('svg');
    if (svg) {
      svg.style.animationDuration = `${bobDur}s`;
      svg.style.animationDelay = `${bobDelay}s`;
    }

    layer.appendChild(el);
  });

  // Insert before all other body children
  if (document.body.firstChild) {
    document.body.insertBefore(layer, document.body.firstChild);
  } else {
    document.body.appendChild(layer);
  }
})();
