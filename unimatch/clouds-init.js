/**
 * UniMatch Cloud Layer — Performance Edition
 * Reduced to 4 clouds, no GPU-heavy blur filter, animation pauses when tab hidden.
 */
(function () {
  if (document.getElementById('um-cloud-layer')) return;

  // Skip on very slow/low-RAM devices (connection API available in Chrome)
  const conn = navigator.connection;
  if (conn && (conn.saveData || conn.effectiveType === '2g')) return;

  const CLOUDS = [
    { top:  5, w: 420, op: 0.20, dur: 55, delay:  -8 },
    { top: 22, w: 520, op: 0.16, dur: 75, delay: -40 },
    { top: 60, w: 380, op: 0.18, dur: 60, delay: -30 },
    { top: 44, w: 300, op: 0.15, dur: 68, delay: -55 },
  ];

  const CLOUD_PATHS = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160">
      <ellipse cx="200" cy="130" rx="195" ry="30" fill="currentColor"/>
      <ellipse cx="100" cy="110" rx="70"  ry="55" fill="currentColor"/>
      <ellipse cx="175" cy="90"  rx="85"  ry="70" fill="currentColor"/>
      <ellipse cx="265" cy="100" rx="80"  ry="62" fill="currentColor"/>
      <ellipse cx="330" cy="115" rx="65"  ry="48" fill="currentColor"/>
    </svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 120">
      <ellipse cx="250" cy="95"  rx="245" ry="25" fill="currentColor"/>
      <ellipse cx="120" cy="80"  rx="85"  ry="50" fill="currentColor"/>
      <ellipse cx="220" cy="65"  rx="100" ry="60" fill="currentColor"/>
      <ellipse cx="340" cy="75"  rx="90"  ry="52" fill="currentColor"/>
      <ellipse cx="420" cy="85"  rx="70"  ry="40" fill="currentColor"/>
    </svg>`,
  ];

  const COLORS = [
    'rgba(255,248,250,0.9)',
    'rgba(255,234,241,0.85)',
    'rgba(252,242,252,0.87)',
    'rgba(255,255,255,0.92)',
  ];

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
    .um-cloud svg { display: block; width: 100%; height: auto; }
    @keyframes umCloudDrift {
      from { transform: translateX(115vw); }
      to   { transform: translateX(-120%); }
    }
    .um-header, header { z-index: 50 !important; }
    .um-bottom-nav, nav.um-bottom-nav { z-index: 100 !important; }
    #match-modal { z-index: 1000 !important; }
  `;
  document.head.appendChild(style);

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
    el.innerHTML = CLOUD_PATHS[i % CLOUD_PATHS.length];
    layer.appendChild(el);
  });

  if (document.body.firstChild) {
    document.body.insertBefore(layer, document.body.firstChild);
  } else {
    document.body.appendChild(layer);
  }

  // Pause animations when tab is hidden — saves CPU/battery
  document.addEventListener('visibilitychange', () => {
    layer.style.animationPlayState = document.hidden ? 'paused' : 'running';
    layer.querySelectorAll('.um-cloud').forEach(c => {
      c.style.animationPlayState = document.hidden ? 'paused' : 'running';
    });
  });
})();

