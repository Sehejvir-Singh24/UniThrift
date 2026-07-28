/**
 * UniThrift / UniMatch — Floating Bug Report & Help Widget
 * Inject via: <script src="/scripts/report-bug.js" defer></script>
 * Automatically injects the floating button + modal into any page.
 */
(function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  const SUPABASE_URL = 'https://bwhvbynmqubjwgonsywd.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_rDDTMnU-KaDG941KB0gaYA_5dHnXX1G';

  const TYPES = [
    { value: 'bug',             label: 'Bug 🐛',              desc: 'Something is broken' },
    { value: 'ui_bug',         label: 'UI Issue 🎨',          desc: 'Visual or layout problem' },
    { value: 'feature_request', label: 'Feature Request 💡',  desc: 'Suggest an improvement' },
    { value: 'help',           label: 'Help ❓',              desc: 'I need help with something' },
  ];

  // ── Inject Styles ──────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #rb-fab {
      position: fixed;
      bottom: 90px;
      right: 18px;
      z-index: 9990;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #B05070, #7C3AED);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(112,26,117,0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      font-size: 20px;
    }
    #rb-fab:hover { transform: scale(1.1); box-shadow: 0 8px 28px rgba(112,26,117,0.45); }
    #rb-fab:active { transform: scale(0.95); }

    #rb-backdrop {
      position: fixed; inset: 0; z-index: 9991;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(4px);
      opacity: 0; transition: opacity 0.25s ease;
      pointer-events: none;
    }
    #rb-backdrop.rb-open { opacity: 1; pointer-events: all; }

    #rb-modal {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 9992;
      background: white;
      border-radius: 24px 24px 0 0;
      padding: 20px 20px 32px;
      max-width: 520px;
      margin: 0 auto;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.32,0.72,0,1);
      max-height: 92vh;
      overflow-y: auto;
    }
    #rb-modal.rb-open { transform: translateY(0); }

    .rb-handle {
      width: 40px; height: 4px; border-radius: 2px;
      background: #E2E8F0; margin: 0 auto 20px; display: block;
    }
    .rb-title {
      font-size: 18px; font-weight: 700;
      background: linear-gradient(135deg, #B05070, #7C3AED);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      margin: 0 0 4px;
    }
    .rb-subtitle { font-size: 13px; color: #64748B; margin: 0 0 20px; }
    .rb-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .rb-type-btn {
      padding: 10px 12px; border-radius: 14px; border: 2px solid #E2E8F0;
      background: white; cursor: pointer; text-align: left;
      transition: all 0.15s ease; font-family: inherit;
    }
    .rb-type-btn:hover { border-color: #B05070; background: #FFF5F8; }
    .rb-type-btn.rb-selected { border-color: #B05070; background: linear-gradient(135deg,rgba(176,80,112,0.08),rgba(124,58,237,0.06)); }
    .rb-type-label { font-size: 13px; font-weight: 600; color: #1E293B; display: block; }
    .rb-type-desc  { font-size: 11px; color: #94A3B8; display: block; margin-top: 2px; }
    .rb-label { font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px; margin-top: 14px; text-transform: uppercase; letter-spacing: 0.05em; }
    .rb-input, .rb-textarea {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid #E2E8F0; border-radius: 12px;
      padding: 10px 14px; font-size: 14px; font-family: inherit;
      outline: none; color: #1E293B; background: #F8FAFC;
      transition: border-color 0.15s;
    }
    .rb-input:focus, .rb-textarea:focus { border-color: #B05070; background: white; }
    .rb-textarea { min-height: 80px; resize: vertical; }
    .rb-page-url {
      font-size: 11px; color: #94A3B8; background: #F1F5F9;
      padding: 6px 12px; border-radius: 8px; margin-top: 10px;
      word-break: break-all; display: block;
    }
    .rb-submit {
      width: 100%; margin-top: 20px; padding: 14px;
      border: none; border-radius: 16px; cursor: pointer;
      font-size: 15px; font-weight: 700; font-family: inherit;
      color: white; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: linear-gradient(135deg, #B05070, #7C3AED);
      box-shadow: 0 4px 16px rgba(176,80,112,0.3);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .rb-submit:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(176,80,112,0.4); }
    .rb-submit:active { transform: scale(0.97); }
    .rb-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .rb-toast {
      position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%) translateY(20px);
      z-index: 9999; background: #0F172A; color: white;
      padding: 12px 20px; border-radius: 14px; font-size: 14px; font-weight: 500;
      opacity: 0; transition: all 0.3s ease; white-space: nowrap;
      display: flex; align-items: center; gap: 8px;
    }
    .rb-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  `;
  document.head.appendChild(style);

  // ── Inject HTML ─────────────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.id = 'rb-root';
  wrap.innerHTML = `
    <button id="rb-fab" title="Report a Bug or Get Help" aria-label="Report Bug">🐛</button>
    <div id="rb-backdrop"></div>
    <div id="rb-modal" role="dialog" aria-modal="true" aria-label="Bug Report Form">
      <span class="rb-handle"></span>
      <h2 class="rb-title">Report a Bug or Get Help</h2>
      <p class="rb-subtitle">Help us make UniThrift better. Takes 30 seconds!</p>

      <div class="rb-type-grid" id="rb-type-grid">
        ${TYPES.map((t, i) => `
          <button class="rb-type-btn${i === 0 ? ' rb-selected' : ''}" data-value="${t.value}" type="button">
            <span class="rb-type-label">${t.label}</span>
            <span class="rb-type-desc">${t.desc}</span>
          </button>
        `).join('')}
      </div>

      <label class="rb-label" for="rb-title-input">Title <span style="color:#ef4444">*</span></label>
      <input class="rb-input" id="rb-title-input" placeholder="Short description of the issue..." maxlength="120"/>

      <label class="rb-label" for="rb-desc-input">Description</label>
      <textarea class="rb-textarea" id="rb-desc-input" placeholder="What happened? What did you expect? Any steps to reproduce..."></textarea>

      <label class="rb-label">Page</label>
      <span class="rb-page-url" id="rb-page-url"></span>

      <button class="rb-submit" id="rb-submit-btn" type="button">
        <span>🚀</span> Submit Report
      </button>
    </div>
    <div class="rb-toast" id="rb-toast"></div>
  `;
  document.body.appendChild(wrap);

  // ── State ──────────────────────────────────────────────────────────────────
  let selectedType = 'bug';
  let isOpen = false;

  const fab       = document.getElementById('rb-fab');
  const backdrop  = document.getElementById('rb-backdrop');
  const modal     = document.getElementById('rb-modal');
  const submitBtn = document.getElementById('rb-submit-btn');
  const toast     = document.getElementById('rb-toast');
  const pageUrlEl = document.getElementById('rb-page-url');

  pageUrlEl.textContent = window.location.href;

  // ── Type selector ──────────────────────────────────────────────────────────
  document.getElementById('rb-type-grid').addEventListener('click', e => {
    const btn = e.target.closest('.rb-type-btn');
    if (!btn) return;
    document.querySelectorAll('.rb-type-btn').forEach(b => b.classList.remove('rb-selected'));
    btn.classList.add('rb-selected');
    selectedType = btn.dataset.value;
  });

  // ── Open / Close ───────────────────────────────────────────────────────────
  function openModal() {
    isOpen = true;
    pageUrlEl.textContent = window.location.href;
    backdrop.classList.add('rb-open');
    modal.classList.add('rb-open');
  }

  function closeModal() {
    isOpen = false;
    backdrop.classList.remove('rb-open');
    modal.classList.remove('rb-open');
  }

  fab.addEventListener('click', () => isOpen ? closeModal() : openModal());
  backdrop.addEventListener('click', closeModal);

  // ── Show Toast ─────────────────────────────────────────────────────────────
  function showToast(msg, isError = false) {
    toast.textContent = '';
    toast.innerHTML = `<span>${isError ? '❌' : '✅'}</span> ${msg}`;
    toast.style.background = isError ? '#7F1D1D' : '#0F172A';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  submitBtn.addEventListener('click', async () => {
    const title = document.getElementById('rb-title-input').value.trim();
    if (!title) {
      document.getElementById('rb-title-input').focus();
      document.getElementById('rb-title-input').style.borderColor = '#ef4444';
      setTimeout(() => { document.getElementById('rb-title-input').style.borderColor = ''; }, 2000);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span style="animation:spin 1s linear infinite;display:inline-block">⟳</span> Submitting...`;

      const sbClient = window.supabase || window.Supabase;
      let reporterId = null;

      if (sbClient) {
        try {
          const { data: { session } } = await sbClient.auth.getSession();
          if (session?.user?.id) reporterId = session.user.id;
        } catch(e) {}
      }

      const body = {
        type: selectedType,
        title,
        description: document.getElementById('rb-desc-input').value.trim() || null,
        page_url: window.location.href,
        reporter_id: reporterId,
        status: 'open'
      };

      let success = false;

      // Use SDK if available (handles auth automatically)
      if (sbClient) {
        const { error } = await sbClient.from('bug_reports').insert(body);
        if (!error) success = true;
        else console.error('Supabase SDK error:', error);
      } else {
        // Fallback to REST fetch
        const res = await fetch(`${SUPABASE_URL}/rest/v1/bug_reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(body)
        });
        if (res.ok || res.status === 201) success = true;
        else console.error('REST fetch error:', await res.text());
      }

      if (success) {
        closeModal();
        document.getElementById('rb-title-input').value = '';
        document.getElementById('rb-desc-input').value = '';
        showToast('Report submitted! Thanks for helping us improve 🙏');
      } else {
        showToast('Submission failed. Please try again.', true);
      }
    } catch(e) {
      console.error('Bug report error:', e);
      showToast('Submission failed. Check your connection.', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>🚀</span> Submit Report`;
    }
  });

  // ── Keyboard close ──────────────────────────────────────────────────────────
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeModal(); });

})();
