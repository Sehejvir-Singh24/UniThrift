/**
 * coming-soon.js
 * Injects a "Coming Soon" bottom-sheet modal on any page and intercepts
 * navigation to /roommates/ and /pghostels/ sections.
 */
(function () {
  // ─── Inject modal HTML ───────────────────────────────────────────────
  const modalHTML = `
  <div id="coming-soon-modal" class="fixed inset-0 z-[200] flex items-end justify-center hidden" aria-modal="true" role="dialog">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="hideComingSoon()"></div>
    <div id="coming-soon-sheet" class="relative w-full max-w-lg rounded-t-[28px] p-8 flex flex-col items-center gap-5 shadow-[0_-8px_40px_rgba(0,0,0,0.15)] translate-y-full transition-transform duration-300 ease-out" style="background:#ffffff">
      <div class="w-10 h-1 rounded-full mx-auto -mt-2" style="background:rgba(0,0,0,0.15)"></div>
      <div class="w-20 h-20 rounded-full flex items-center justify-center" style="background:rgba(0,110,47,0.1)">
        <span class="material-symbols-outlined text-[40px]" style="color:#006e2f;font-variation-settings:'FILL' 1">rocket_launch</span>
      </div>
      <div class="text-center flex flex-col gap-2">
        <h2 id="coming-soon-title" style="font-size:22px;font-weight:600;color:#0b1c30">Coming Soon! 🚀</h2>
        <p id="coming-soon-desc" style="font-size:14px;color:#3d4a3d;line-height:1.5">We're working hard to bring this feature to UniThrift. Stay tuned — it'll be worth the wait!</p>
      </div>
      <div class="flex items-center gap-2 px-4 py-2 rounded-full" style="background:rgba(0,110,47,0.1)">
        <span class="material-symbols-outlined" style="color:#006e2f;font-size:16px">schedule</span>
        <span style="font-size:12px;font-weight:600;color:#006e2f;letter-spacing:0.05em">Launching Soon</span>
      </div>
      <button onclick="hideComingSoon()" style="width:100%;padding:12px;border-radius:16px;background:#e5eeff;color:#3d4a3d;font-size:16px;font-weight:600;border:none;cursor:pointer;margin-top:8px">Got it!</button>
    </div>
  </div>`;

  document.addEventListener('DOMContentLoaded', function () {
    // Only inject if not already present (index.html has its own)
    if (!document.getElementById('coming-soon-modal')) {
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Intercept all links pointing to pghostels
    document.querySelectorAll('a[href*="/pghostels/"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const href = link.getAttribute('href') || '';
        const title = 'PG & Hostel Finder';
        const desc = "Browse verified PGs and hostels near your campus. We're putting the finishing touches on this!";
        showComingSoon(title, desc);
      });
    });
  });

  // ─── Global show/hide functions ──────────────────────────────────────
  window.showComingSoon = function (title, desc) {
    const modal = document.getElementById('coming-soon-modal');
    const sheet = document.getElementById('coming-soon-sheet');
    if (!modal) return;
    document.getElementById('coming-soon-title').textContent = (title || 'Coming Soon') + ' 🚀';
    document.getElementById('coming-soon-desc').textContent = desc || "We're working hard to bring this feature to UniThrift. Stay tuned!";
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sheet.classList.remove('translate-y-full');
        sheet.classList.add('translate-y-0');
      });
    });
    document.body.style.overflow = 'hidden';
  };

  window.hideComingSoon = function () {
    const modal = document.getElementById('coming-soon-modal');
    const sheet = document.getElementById('coming-soon-sheet');
    if (!modal) return;
    sheet.classList.remove('translate-y-0');
    sheet.classList.add('translate-y-full');
    setTimeout(() => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  };
})();
