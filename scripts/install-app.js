// Adds an install shortcut on supported Android browsers and clear Home Screen
// instructions for iPhone/iPad Safari. It is intentionally silent after install.
(function () {
  'use strict';

  let deferredInstallPrompt = null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isUniMatch = location.pathname === '/unimatch' || location.pathname.startsWith('/unimatch/');
  const productName = isUniMatch ? 'UniMatch' : 'UniThrift';

  function removePrompt() {
    document.getElementById('unithrift-install-prompt')?.remove();
  }

  function showIOSInstructions() {
    const card = document.querySelector('#unithrift-install-prompt .ut-install-card');
    if (!card) return;
    card.innerHTML = `
      <button class="ut-install-close" aria-label="Close install instructions">×</button>
      <span class="ut-install-icon">⇧</span>
      <strong>Add ${productName} to your Home Screen</strong>
      <p>Tap <b>Share</b> in Safari, then choose <b>Add to Home Screen</b>. This shortcut will open ${productName}.</p>
    `;
    card.querySelector('.ut-install-close').addEventListener('click', removePrompt);
  }

  async function installApp() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    removePrompt();
  }

  function showInstallPrompt() {
    if (isStandalone || document.getElementById('unithrift-install-prompt')) return;
    const host = document.createElement('aside');
    host.id = 'unithrift-install-prompt';
    host.setAttribute('aria-label', `Install ${productName}`);
    host.innerHTML = `
      <style>
        #unithrift-install-prompt{position:fixed;right:16px;bottom:max(16px,env(safe-area-inset-bottom));z-index:2147483000;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
        #unithrift-install-prompt .ut-install-card{position:relative;width:min(330px,calc(100vw - 32px));padding:16px 42px 16px 16px;display:grid;grid-template-columns:38px 1fr;column-gap:11px;align-items:center;border:1px solid rgba(255,255,255,.8);border-radius:20px;background:rgba(255,255,255,.96);box-shadow:0 12px 34px rgba(11,28,48,.2);color:#0b1c30;backdrop-filter:blur(16px)}
        #unithrift-install-prompt .ut-install-icon{grid-row:span 2;width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:#006e2f;color:#fff;font-size:22px;font-weight:800}
        #unithrift-install-prompt strong{font-size:13px;line-height:1.2}#unithrift-install-prompt p{grid-column:2;margin:3px 0 0;color:#50617a;font-size:12px;line-height:1.4}
        #unithrift-install-prompt button{font:inherit;cursor:pointer}#unithrift-install-prompt .ut-install-action{grid-column:2;margin-top:10px;padding:8px 11px;border:0;border-radius:10px;background:#006e2f;color:#fff;font-size:12px;font-weight:750;text-align:left}
        #unithrift-install-prompt .ut-install-close{position:absolute;top:7px;right:9px;width:26px;height:26px;padding:0;border:0;border-radius:50%;background:transparent;color:#50617a;font-size:22px;line-height:1}
      </style>
      <div class="ut-install-card">
        <button class="ut-install-close" aria-label="Dismiss install prompt">×</button>
        <span class="ut-install-icon">U</span>
        <strong>Add ${productName} to your phone</strong>
        <p>Open ${productName} like an app from your Home Screen.</p>
        <button class="ut-install-action">Add shortcut</button>
      </div>
    `;
    document.body.appendChild(host);
    host.querySelector('.ut-install-close').addEventListener('click', removePrompt);
    host.querySelector('.ut-install-action').addEventListener('click', isIOS ? showIOSInstructions : installApp);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallPrompt();
  });
  window.addEventListener('appinstalled', removePrompt);

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
  if (isIOS && !isStandalone) {
    window.addEventListener('load', () => setTimeout(showInstallPrompt, 900));
  }
})();
