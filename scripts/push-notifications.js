/**
 * Universal Push & In-App Notification Manager for UniThrift & UniMatch
 * Handles Web Push, iOS Home Screen PWA instructions, In-App Audio Chimes & Floating Toasts
 */
(function(window) {
  'use strict';

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isPushSupported = 'serviceWorker' in navigator && 'Notification' in window;

  // ── Web Audio Synthesizer Notification Chime ────────────────────────
  function playNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      // 2-tone gentle chime: D5 (587Hz) -> A5 (880Hz)
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      // AudioContext may be blocked before first user interaction
    }
  }

  // ── In-App Floating Toast Notification (iOS Style) ──────────────────
  function showInAppToast({ title, message, url, icon = 'favorite', duration = 5000 }) {
    // Play chime
    playNotificationChime();

    // Trigger haptic vibration if supported
    if (navigator.vibrate) {
      try { navigator.vibrate([100, 50, 100]); } catch (e) {}
    }

    let container = document.getElementById('ut-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ut-toast-container';
      container.style.cssText = 'position:fixed;top:max(16px,env(safe-area-inset-top));left:16px;right:16px;z-index:999999;display:flex;flex-direction:column;align-items:center;pointer-events:none;gap:10px;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'ut-floating-notif-toast';
    toast.style.cssText = `
      width: 100%;
      max-width: 420px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 20px;
      box-shadow: 0 12px 36px rgba(92, 4, 39, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: auto;
      cursor: pointer;
      animation: utToastSlideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transition: all 0.25s ease;
    `;

    const iconBg = location.pathname.includes('/unimatch') ? 'background:linear-gradient(135deg,#c0304a,#5c0427);' : 'background:linear-gradient(135deg,#006e2f,#004e20);';

    toast.innerHTML = `
      <style>
        @keyframes utToastSlideIn {
          from { opacity: 0; transform: translateY(-30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes utToastSlideOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-25px) scale(0.95); }
        }
      </style>
      <div style="width:40px;height:40px;border-radius:50%;${iconBg}display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0;box-shadow:0 3px 8px rgba(0,0,0,0.15);">
        <span class="material-symbols-outlined" style="font-size:22px;font-variation-settings:'FILL' 1;">${icon}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:700;color:#1a1c1b;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(title)}</div>
        <div style="font-size:12px;color:#554245;line-height:1.3;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHTML(message)}</div>
      </div>
      <span class="material-symbols-outlined" style="font-size:18px;color:#887275;flex-shrink:0;">chevron_right</span>
    `;

    toast.onclick = () => {
      if (url) window.location.href = url;
      toast.remove();
    };

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'utToastSlideOut 0.28s ease forwards';
      setTimeout(() => toast.remove(), 280);
    }, duration);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  // ── iOS Add-to-Home-Screen Instructions Bottom Sheet ─────────────────
  // ── iOS Add-to-Home-Screen Instructions Bottom Sheet ─────────────────
  function showIOSGuideModal() {
    const existing = document.getElementById('ios-push-guide-modal');
    if (existing) existing.remove();

    // Play feedback chime immediately
    playNotificationChime();

    const isUniMatch = location.pathname.includes('/unimatch');
    const appName = isUniMatch ? 'UniMatch' : 'UniThrift';
    const primaryColor = isUniMatch ? '#5c0427' : '#006e2f';

    const modal = document.createElement('div');
    modal.id = 'ios-push-guide-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;z-index:99999999;background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:0;animation:utFadeIn 0.25s ease forwards;touch-action:manipulation;';

    modal.innerHTML = `
      <style>
        @keyframes utFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes utSheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      </style>
      <div style="background:#FFFFFF;border-top-left-radius:28px;border-top-right-radius:28px;width:100%;max-width:440px;padding:24px 20px;padding-bottom:max(28px,env(safe-area-inset-bottom,28px));box-shadow:0 -10px 40px rgba(0,0,0,0.3);display:flex;flex-direction:column;gap:16px;animation:utSheetSlideUp 0.32s cubic-bezier(0.16,1,0.3,1) forwards;">
        <div style="width:40px;height:4px;border-radius:2px;background:#e0dcdb;margin:0 auto -4px;"></div>
        
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:42px;height:42px;border-radius:12px;background:${primaryColor};display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
              <span class="material-symbols-outlined" style="font-size:24px;font-variation-settings:'FILL' 1;">notifications_active</span>
            </div>
            <div>
              <h3 style="font-size:17px;font-weight:700;color:#1a1c1b;margin:0;">Lock-Screen Alerts on iPhone 🔔</h3>
              <p style="font-size:12px;color:#7a6d70;margin:1px 0 0;">Never miss a like, match, or chat</p>
            </div>
          </div>
          <button id="close-ios-modal-btn" type="button" style="background:#f4f3f1;border:none;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#554245;-webkit-tap-highlight-color:transparent;">
            <span class="material-symbols-outlined" style="font-size:18px;">close</span>
          </button>
        </div>

        <div style="background:#faf8f7;border-radius:18px;padding:16px;border:1px solid #ebd9dc;display:flex;flex-direction:column;gap:14px;">
          <p style="font-size:13px;color:#443336;margin:0;line-height:1.45;">
            Apple Safari requires adding <b>${appName}</b> to your <b>Home Screen</b> to allow system lock-screen push alerts:
          </p>

          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:30px;height:30px;border-radius:50%;background:#ffffff;border:1.5px solid ${primaryColor};color:${primaryColor};font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div>
            <div style="font-size:13px;color:#1a1c1b;line-height:1.35;">
              Tap Safari's <b>Share</b> button <span style="display:inline-block;padding:2px 7px;background:#e8e5e5;border-radius:6px;font-weight:bold;font-size:12px;">📤</span> (bottom bar).
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:30px;height:30px;border-radius:50%;background:#ffffff;border:1.5px solid ${primaryColor};color:${primaryColor};font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div>
            <div style="font-size:13px;color:#1a1c1b;line-height:1.35;">
              Scroll down and tap <b>Add to Home Screen</b> <span style="display:inline-block;padding:2px 7px;background:#e8e5e5;border-radius:6px;font-weight:bold;font-size:12px;">➕</span>.
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:30px;height:30px;border-radius:50%;background:#ffffff;border:1.5px solid ${primaryColor};color:${primaryColor};font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div>
            <div style="font-size:13px;color:#1a1c1b;line-height:1.35;">
              Open <b>${appName}</b> from your Home Screen & enjoy instant alerts!
            </div>
          </div>
        </div>

        <button id="got-it-ios-modal-btn" type="button" style="width:100%;padding:14px;border-radius:999px;background:${primaryColor};color:white;border:none;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.18);-webkit-tap-highlight-color:transparent;">
          Got it! 👍
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
    };

    const closeBtn = modal.querySelector('#close-ios-modal-btn');
    const gotItBtn = modal.querySelector('#got-it-ios-modal-btn');

    if (closeBtn) {
      closeBtn.onclick = closeModal;
      closeBtn.ontouchend = (e) => { e.preventDefault(); closeModal(); };
    }
    if (gotItBtn) {
      gotItBtn.onclick = closeModal;
      gotItBtn.ontouchend = (e) => { e.preventDefault(); closeModal(); };
    }
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  }

  // ── Request System Notification Permission ──────────────────────────
  async function requestPushPermission() {
    // 1. If on iOS in standard Safari browser (not standalone PWA)
    if (isIOS && !isStandalone) {
      localStorage.setItem('um_notifications_enabled', 'true');
      document.getElementById('notif-smart-prompt')?.remove();
      
      showInAppToast({
        title: 'Alerts Activated! 💕',
        message: 'Tap Share (📤) then "Add to Home Screen" to receive alerts while your screen is locked.',
        icon: 'notifications_active',
        duration: 5500
      });

      showIOSGuideModal();
      return { success: true, mode: 'ios_guide' };
    }

    // 2. If Notification API is not available
    if (!('Notification' in window)) {
      localStorage.setItem('um_notifications_enabled', 'true');
      document.getElementById('notif-smart-prompt')?.remove();
      showInAppToast({
        title: 'In-App Alerts Active! 🔔',
        message: 'You will receive audio chimes & alerts while using UniThrift.',
        icon: 'notifications'
      });
      return { success: true, mode: 'in_app_only' };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('um_notifications_enabled', 'true');

        // Show instant native confirmation
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: 'Notifications Active! 🎉',
            options: {
              body: "You'll now receive instant alerts when someone likes you, matches with you, or sends an offer.",
              icon: '/assets/unithrift-app-icon.svg',
              badge: '/assets/unithrift-app-icon.svg'
            }
          });
        }

        showInAppToast({
          title: 'Notifications Enabled! 🔔',
          message: "You'll be alerted whenever someone likes you or matches on campus.",
          icon: 'check_circle'
        });

        // Hide floating prompt if active
        document.getElementById('notif-smart-prompt')?.remove();

        // Save push registration in Supabase if user is signed in
        savePushSubscriptionToServer();

        return { success: true };
      } else {
        localStorage.setItem('um_notifications_enabled', 'false');
        return { success: false, reason: 'denied' };
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
      return { success: false, error: err };
    }
  }

  // ── Save Device Push Subscription to Supabase ───────────────────────
  async function savePushSubscriptionToServer() {
    if (!('serviceWorker' in navigator) || !window.supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return;

      const reg = await navigator.serviceWorker.ready;
      if (!reg || !reg.pushManager) return;

      let sub = await reg.pushManager.getSubscription();
      // If we have VAPID application key configured in window, we can subscribe
      if (!sub && window.VAPID_PUBLIC_KEY) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: window.VAPID_PUBLIC_KEY
        });
      }

      if (sub) {
        const subJson = sub.toJSON();
        await supabase.from('push_subscriptions').upsert({
          user_id: session.user.id,
          endpoint: sub.endpoint,
          p256dh: subJson.keys?.p256dh || '',
          auth: subJson.keys?.auth || '',
          user_agent: navigator.userAgent,
          platform: isIOS ? 'ios' : (/Android/.test(navigator.userAgent) ? 'android' : 'desktop')
        }, { onConflict: 'user_id,endpoint' });
      }
    } catch (e) {
      console.warn('Could not save push subscription to Supabase:', e);
    }
  }

  // ── Smart Floating Prompt (Nudge User to Turn on Alerts) ─────────────
  function checkAndShowSmartPrompt() {
    // Only show if user has not enabled notifications yet
    const enabled = localStorage.getItem('um_notifications_enabled') === 'true';
    if (enabled) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      localStorage.setItem('um_notifications_enabled', 'true');
      return;
    }

    // Rate-limit prompt: don't show if dismissed within last 3 days
    const lastDismissed = parseInt(localStorage.getItem('um_notif_prompt_dismissed') || '0', 10);
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - lastDismissed < THREE_DAYS) return;

    // Only show on discover, home, or activity pages
    const path = location.pathname;
    const isTargetPage = path === '/' || path.includes('/unimatch/discover') || path.includes('/core/dashboard') || path.includes('/roommates/flatmates');
    if (!isTargetPage) return;

    // Delay prompt slightly so user isn't immediately overwhelmed
    setTimeout(() => {
      if (document.getElementById('notif-smart-prompt')) return;

      const promptEl = document.createElement('div');
      promptEl.id = 'notif-smart-prompt';
      promptEl.style.cssText = `
        position: fixed;
        top: max(68px, calc(env(safe-area-inset-top, 0px) + 58px));
        left: 12px;
        right: 12px;
        max-width: 440px;
        margin: 0 auto;
        z-index: 9999999;
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.9);
        border-radius: 20px;
        padding: 12px 14px;
        box-shadow: 0 10px 30px rgba(92, 4, 39, 0.18), 0 2px 8px rgba(0, 0, 0, 0.06);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        animation: utToastSlideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        cursor: pointer;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      `;

      const isUniMatch = location.pathname.includes('/unimatch');
      const accentBg = isUniMatch ? '#5c0427' : '#006e2f';

      promptEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
          <div style="width:36px;height:36px;border-radius:50%;background:${accentBg};color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 3px 8px rgba(0,0,0,0.15);">
            <span class="material-symbols-outlined" style="font-size:20px;font-variation-settings:'FILL' 1;">notifications_active</span>
          </div>
          <div style="min-width:0;flex:1;">
            <div style="font-size:13px;font-weight:700;color:#1a1c1b;line-height:1.2;">Turn on Alerts 🔔</div>
            <div style="font-size:11.5px;color:#7a6d70;line-height:1.2;margin-top:2px;">Get instant match & like alerts</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          <button id="enable-notifs-quick-btn" type="button" style="background:${accentBg};color:white;border:none;border-radius:999px;padding:7px 15px;font-size:12px;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;">
            Enable
          </button>
          <button id="dismiss-notifs-prompt-btn" type="button" style="background:transparent;border:none;color:#887275;padding:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;">
            <span class="material-symbols-outlined" style="font-size:18px;">close</span>
          </button>
        </div>
      `;

      document.body.appendChild(promptEl);

      const activatePrompt = (e) => {
        if (e && e.target && e.target.closest('#dismiss-notifs-prompt-btn')) return;
        if (e && e.cancelable) e.preventDefault();
        requestPushPermission();
      };

      promptEl.addEventListener('click', activatePrompt);
      promptEl.addEventListener('touchend', activatePrompt);

      const dismissBtn = promptEl.querySelector('#dismiss-notifs-prompt-btn');
      if (dismissBtn) {
        const dismissPrompt = (e) => {
          if (e && e.cancelable) e.preventDefault();
          e.stopPropagation();
          localStorage.setItem('um_notif_prompt_dismissed', Date.now().toString());
          promptEl.remove();
        };
        dismissBtn.addEventListener('click', dismissPrompt);
        dismissBtn.addEventListener('touchend', dismissPrompt);
      }
    }, 1800);
  }

  // ── Realtime Listener & Notification Poller ──────────────────────────
  let lastCheckedTimestamp = new Date().toISOString();
  let realtimeChannel = null;

  function initRealtimeSubscription(userId) {
    if (!window.supabase || realtimeChannel) return;
    try {
      realtimeChannel = supabase
        .channel('realtime:user_notifs_' + userId)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const n = payload.new;
            if (!n) return;
            showInAppToast({
              title: n.title || 'UniMatch Alert 💕',
              message: n.message || 'You have a new update!',
              url: n.type?.includes('match') || n.type?.includes('like') ? '/unimatch/hidden-likes.html' : '/unimatch/profile/notifications.html',
              icon: n.type?.includes('match') || n.type?.includes('like') ? 'favorite' : 'notifications'
            });

            // Native notification if tab is in background or device locked
            if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
              try {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title: n.title || 'UniMatch Alert 💕',
                    options: {
                      body: n.message,
                      icon: '/assets/unithrift-app-icon.svg',
                      badge: '/assets/unithrift-app-icon.svg',
                      data: { url: n.type?.includes('match') || n.type?.includes('like') ? '/unimatch/hidden-likes.html' : '/unimatch/profile/notifications.html' }
                    }
                  });
                } else {
                  new Notification(n.title || 'UniMatch Alert 💕', {
                    body: n.message,
                    icon: '/assets/unithrift-app-icon.svg'
                  });
                }
              } catch (e) {}
            }

            // Update badge dots in UI
            document.querySelectorAll('.ut-notif-dot, #notif-badge, .um-notif-dot').forEach(el => {
              el.style.display = 'block';
            });
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime notifications setup error:', e);
    }
  }

  async function pollUnreadNotifications() {
    if (!window.supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return;
      const userId = session.user.id;

      // Hook up realtime listener if not yet active
      initRealtimeSubscription(userId);

      // Query any unread notifications created since last check
      const { data: unread } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .gt('created_at', lastCheckedTimestamp)
        .order('created_at', { ascending: false })
        .limit(3);

      if (unread && unread.length > 0) {
        lastCheckedTimestamp = unread[0].created_at;

        // Trigger in-app toast for the newest notification
        unread.forEach(n => {
          showInAppToast({
            title: n.title,
            message: n.message,
            url: n.type?.includes('match') ? '/unimatch/hidden-likes.html' : '/unimatch/profile/notifications.html',
            icon: n.type?.includes('match') || n.type?.includes('like') ? 'favorite' : 'notifications'
          });
        });

        // Update any notification badges in the UI
        document.querySelectorAll('.ut-notif-dot, #notif-badge, .um-notif-dot').forEach(el => {
          el.style.display = 'block';
        });
      }
    } catch (e) {
      console.warn('Poll notifications error:', e);
    }
  }

  // ── Send instant test notification (for user verification) ──────────
  function sendTestNotification() {
    playNotificationChime();
    showInAppToast({
      title: 'Someone liked your profile! 💕',
      message: 'A student from your campus just liked you on UniMatch!',
      icon: 'favorite',
      url: '/unimatch/hidden-likes.html'
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: 'Someone liked your profile! 💕',
            options: {
              body: 'A verified student on campus just liked you on UniMatch. Open UniMatch to see who it is!',
              icon: '/assets/unithrift-app-icon.svg',
              badge: '/assets/unithrift-app-icon.svg',
              data: { url: '/unimatch/hidden-likes.html' }
            }
          });
        } else {
          new Notification('Someone liked your profile! 💕', {
            body: 'A verified student on campus just liked you on UniMatch.',
            icon: '/assets/unithrift-app-icon.svg'
          });
        }
      } catch (e) {}
    }
  }

  // ── Initialization on Page Load ─────────────────────────────────────
  window.addEventListener('load', () => {
    // Register service worker if available
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Check smart prompt
    checkAndShowSmartPrompt();

    // Start background poller every 30 seconds
    setInterval(pollUnreadNotifications, 30000);
    // Initial check after 3 seconds
    setTimeout(pollUnreadNotifications, 3000);
  });

  // Export globally
  window.PushNotifications = {
    isIOS,
    isStandalone,
    isPushSupported,
    requestPermission: requestPushPermission,
    showIOSGuide: showIOSGuideModal,
    showInAppToast,
    playChime: playNotificationChime,
    sendTestNotification
  };

})(window);
