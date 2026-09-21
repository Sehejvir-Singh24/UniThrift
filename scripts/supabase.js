// Supabase Configuration
// Requires the Supabase JS UMD SDK to be loaded in HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>

const SUPABASE_URL = 'https://bwhvbynmqubjwgonsywd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rDDTMnU-KaDG941KB0gaYA_5dHnXX1G';

// Initialize Supabase Client
// The UMD bundle exposes the library as window.supabase
const supabaseLib = window.supabase || window.Supabase;
if (!supabaseLib) { console.error('Supabase SDK not loaded! Check the CDN script tag.'); }
window.supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

window.escapeHTML = function(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
};

// Helper: Get Current User Profile (Cache-First for ultra-fast mobile navigation)
let _cachedProfile = null;

async function checkAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.warn('[AUTH] Unable to restore Supabase session:', error);
    return false;
  }
}

async function getProfile(forceRefresh = false) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    _cachedProfile = null;
    try { sessionStorage.removeItem('unimatch_cached_profile'); } catch (e) {}
    return null;
  }

  if (!forceRefresh) {
    if (_cachedProfile?.id === session.user.id) return _cachedProfile;
    try {
      const stored = sessionStorage.getItem('unimatch_cached_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id === session.user.id) {
          _cachedProfile = parsed;
          refreshProfileInBackground();
          return _cachedProfile;
        }
      }
    } catch (e) {}
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    console.warn("Profile row missing or fetch error, returning fallback profile for user:", session.user.id);
    const fallbackProfile = {
      id: session.user.id,
      full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Campus Student',
      email: session.user.email,
      avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
      enrollment_number: null,
      college: null,
      role: 'student'
    };
    _cachedProfile = fallbackProfile;
    try { sessionStorage.setItem('unimatch_cached_profile', JSON.stringify(fallbackProfile)); } catch (e) {}
    return fallbackProfile;
  }

  _cachedProfile = profile;
  try { sessionStorage.setItem('unimatch_cached_profile', JSON.stringify(profile)); } catch (e) {}
  return profile;
}

async function refreshProfileInBackground() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      _cachedProfile = profile;
      sessionStorage.setItem('unimatch_cached_profile', JSON.stringify(profile));
    }
  } catch (e) {}
}

// Helper: Require Authentication
function rememberAuthDestination() {
  const destination = `${window.location.pathname}${window.location.search}`;
  if (!destination.includes('/auth/')) {
    try { sessionStorage.setItem('unithrift_auth_return_to', destination); } catch (e) {}
  }
}

function consumeAuthDestination(fallback) {
  let destination = '';
  try {
    destination = sessionStorage.getItem('unithrift_auth_return_to') || '';
    sessionStorage.removeItem('unithrift_auth_return_to');
  } catch (e) {}
  if (!destination.startsWith('/') || destination.startsWith('//') || destination.includes('/auth/')) return fallback;
  return destination;
}

function clearLegacyAuthState() {
  try {
    localStorage.removeItem('unithrift_auth_token');
    localStorage.removeItem('unithrift_user');
  } catch (e) {}
}

async function signInWithEmailPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
  if (!data.session) throw new Error('Sign in did not create a session. Please try again.');
  clearLegacyAuthState();
  clearProfileCache();
  return data.session;
}

// Redirects to the correct platform login and remembers the interrupted page.
async function requireAuth() {
  const isAuthed = await checkAuth();
  if (!isAuthed) {
    rememberAuthDestination();
    const loginPath = window.location.pathname.startsWith('/unimatch/') ? '/unimatch/auth/login.html' : '/auth/login.html';
    window.location.replace(loginPath);
    return false;
  }
  return true;
}

// Helper: Require UniMatch Authentication & Completed Setup
// Validates session, instagram handle, profile setup, and student ID verification (evaluated last).
async function requireUniMatchAuth() {
  const isAuthed = await checkAuth();
  if (!isAuthed) {
    rememberAuthDestination();
    window.location.replace('/unimatch/auth/login.html');
    return null;
  }
  const profile = await getProfile();
  if (!profile) {
    window.location.href = '/unimatch/auth/login.html';
    return null;
  }
  if (!profile.instagram_username) {
    window.location.href = '/unimatch/auth/instagram.html';
    return null;
  }
  if (!profile.unimatch_profile_complete) {
    window.location.href = '/unimatch/profile-setup/basic-info.html';
    return null;
  }
  if (!profile.is_verified && profile.role !== 'admin') {
    if (profile.verification_status === 'pending' || profile.unimatch_verification_status === 'pending') {
      window.location.href = '/unimatch/auth/pending.html';
      return null;
    }
    window.location.href = '/unimatch/auth/verify.html';
    return null;
  }
  return profile;
}

// UniMatch Pass Cooldown: 24 hours (1 day) in milliseconds
const UNIMATCH_PASS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function getLocalPasses(userId) {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(`um_passes_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function recordLocalPass(userId, targetUserId) {
  if (!userId || !targetUserId) return;
  try {
    const passes = getLocalPasses(userId);
    passes[targetUserId] = Date.now();
    // Prune entries older than 48 hours to keep local storage compact
    const now = Date.now();
    for (const id in passes) {
      if (now - passes[id] > 48 * 60 * 60 * 1000) {
        delete passes[id];
      }
    }
    localStorage.setItem(`um_passes_${userId}`, JSON.stringify(passes));
  } catch (e) {
    console.warn("Could not write local pass:", e);
  }
}

function clearLocalPasses(userId) {
  if (!userId) return;
  try {
    localStorage.removeItem(`um_passes_${userId}`);
  } catch (e) {}
}

// Helper: Record UniMatch Like or Pass & Check Mutual Match
// Returns { isMatch: boolean, matchedProfile?: object }
async function recordUniMatchAction(targetUserId, action) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { isMatch: false };

  const likerId = session.user.id;
  if (!targetUserId || targetUserId === likerId) return { isMatch: false };

  const nowIso = new Date().toISOString();

  // If action is pass, save locally immediately to suppress for at least 1 day (24 hours)
  if (action === 'pass') {
    recordLocalPass(likerId, targetUserId);
  }

  // 1. Record the action in unimatch_likes (upsert with updated timestamp)
  try {
    const { error: upsertErr } = await supabase
      .from('unimatch_likes')
      .upsert({
        liker_id: likerId,
        liked_user_id: targetUserId,
        action: action,
        created_at: nowIso
      }, { onConflict: 'liker_id,liked_user_id' });
    if (upsertErr) {
      console.warn("Could not save action to unimatch_likes:", upsertErr);
    }
  } catch (err) {
    console.warn("Could not save action to unimatch_likes:", err);
  }

  // If action is pass, no match is possible
  if (action !== 'like') {
    return { isMatch: false };
  }

  // 2. Check if the target user has ALREADY liked current user
  try {
    const { data: otherLike } = await supabase
      .from('unimatch_likes')
      .select('*')
      .eq('liker_id', targetUserId)
      .eq('liked_user_id', likerId)
      .eq('action', 'like')
      .maybeSingle();

    if (otherLike) {
      // MUTUAL MATCH! Calculate 10-minute delayed reveal time
      const user1 = likerId < targetUserId ? likerId : targetUserId;
      const user2 = likerId < targetUserId ? targetUserId : likerId;

      const revealAvailableAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Fetch profiles in parallel to extract common interests & generate fun icebreaker
      const [{ data: p1 }, { data: p2 }] = await Promise.all([
        supabase.from('profiles').select('email, full_name, interests, major').eq('id', user1).maybeSingle(),
        supabase.from('profiles').select('email, full_name, interests, major').eq('id', user2).maybeSingle()
      ]);

      const icebreakerData = generateFunIcebreaker(p1?.interests, p2?.interests);

      await supabase
        .from('unimatch_matches')
        .upsert({
          user1_id: user1,
          user2_id: user2,
          reveal_available_at: revealAvailableAt,
          user1_unlocked: true,
          user2_unlocked: true,
          icebreaker_prompt: icebreakerData.prompt,
          common_interests: JSON.stringify(icebreakerData.common)
        }, { onConflict: 'user1_id,user2_id' });

      // Notify both users of mutual match in public.notifications
      await Promise.all([
        supabase.from('notifications').insert({
          user_id: targetUserId,
          title: "It's a Match! 🎉💕",
          message: 'You and another student both connected! Open UniMatch to break the ice.',
          type: 'unimatch_match'
        }),
        supabase.from('notifications').insert({
          user_id: likerId,
          title: "It's a Match! 🎉💕",
          message: 'You and another student both connected! Open UniMatch to break the ice.',
          type: 'unimatch_match'
        })
      ]).catch(() => {});

      // Dispatch real-time email alert to target user so their phone lock-screen rings
      const targetUserEmail = (targetUserId === user1 ? p1?.email : p2?.email);
      if (targetUserEmail && window.AuthClient && typeof window.AuthClient.sendEmailNotification === 'function') {
        window.AuthClient.sendEmailNotification({
          to: targetUserEmail,
          title: "It's a Match! 🎉💕",
          message: "You have a new mutual match on UniMatch! Open UniMatch now to break the ice and exchange Instagram handles.",
          platform: 'unimatch',
          actionUrl: 'https://unithrift.co.in/unimatch/hidden-likes.html',
          actionText: 'View Your Match'
        }).catch(() => {});
      }

      // Fetch target profile info for return
      const { data: matchedProfile } = await supabase
        .from('profiles')
        .select('full_name, instagram_username, avatar_url')
        .eq('id', targetUserId)
        .maybeSingle();

      return {
        isMatch: true,
        delayed: true,
        revealAvailableAt,
        matchedProfile: matchedProfile || null
      };
    } else {
      // Single Like: Send discreet notification + email alert to target user
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        title: 'Someone liked your profile! 💕',
        message: 'A student from your campus just liked you on UniMatch! Open UniMatch to see who it is.',
        type: 'unimatch_like'
      }).catch(() => {});

      // Email alert for lock-screen notification (especially effective on iOS iPhones)
      supabase.from('profiles').select('email, full_name').eq('id', targetUserId).maybeSingle().then(({ data: tp }) => {
        if (tp && tp.email && window.AuthClient && typeof window.AuthClient.sendEmailNotification === 'function') {
          window.AuthClient.sendEmailNotification({
            to: tp.email,
            title: 'Someone liked your profile! 💕',
            message: 'A verified student on campus just liked your profile on UniMatch! Open UniMatch now to see who liked you.',
            platform: 'unimatch',
            actionUrl: 'https://unithrift.co.in/unimatch/hidden-likes.html',
            actionText: 'See Who Liked You'
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("Error checking mutual match:", err);
  }

  return { isMatch: false };
}

// Helper: Generate Icebreaker Question based on Common Interests
function generateFunIcebreaker(rawInterests1, rawInterests2) {
  let parseInterests = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
    if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const arr1 = parseInterests(rawInterests1);
  const arr2 = parseInterests(rawInterests2);
  
  const set2 = new Set(arr2.map(i => i.toLowerCase()));
  const common = arr1.filter(i => set2.has(i.toLowerCase()));

  const templates = {
    coffee: "☕ What's your go-to coffee order to survive exam week?",
    tea: "☕ Are you a chai lover or a coffee loyalist on campus?",
    coding: "💻 Tabs or spaces? And what's your late-night coding snack?",
    tech: "🚀 What's a tech gadget or app you can't live without for a single day?",
    anime: "⛩️ Which anime series could you rewatch 100 times without getting bored?",
    manga: "📖 What's the #1 manga/comic series you recommend reading right now?",
    music: "🎧 If you could get VIP tickets to any concert this weekend, who are we seeing?",
    gaming: "🎮 Late-night Valorant / FIFA session or cozy casual gaming?",
    fitness: "🏋️ What's your absolute favorite workout track when hitting PRs?",
    gym: "💪 Morning gym person or late-night workout enthusiast?",
    travel: "✈️ What's the #1 dream destination on your bucket list right now?",
    food: "🍕 Best food spot near campus: street food stalls or cozy cafes?",
    foodie: "🍔 If you had to eat only one dish for the rest of college, what is it?",
    photography: "📸 Film aesthetic or high-def digital photography?",
    movies: "🍿 What's a movie you think everyone must watch at least once?",
    books: "📚 Fiction or Non-fiction? What book changed your perspective recently?",
    art: "🎨 What's your favorite creative outlet when you need to de-stress?"
  };

  if (common.length > 0) {
    const firstCommon = common[0].toLowerCase();
    for (const [key, prompt] of Object.entries(templates)) {
      if (firstCommon.includes(key)) {
        return { common, prompt: `You both love ${common[0]}! ${prompt}` };
      }
    }
    return {
      common,
      prompt: `You both share a passion for ${common.join(', ')}! What got you into it?`
    };
  }

  return {
    common: [],
    prompt: "Fun Campus Icebreaker: If we were skipping lectures today, where on campus would we hide out?"
  };
}

// Helper: Check and dispatch 10-minute delayed UniMatch notifications (optimized parallel batch)
async function checkUniMatchNotifications(userId) {
  if (!userId) return;
  try {
    const nowIso = new Date().toISOString();
    
    // Find matches involving userId where reveal_available_at <= now()
    const { data: matches } = await supabase
      .from('unimatch_matches')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .lte('reveal_available_at', nowIso);

    if (!matches || matches.length === 0) return;

    const unnotified = matches.filter(m => {
      const isUser1 = m.user1_id === userId;
      return isUser1 ? !m.notified_user1 : !m.notified_user2;
    });

    if (unnotified.length === 0) return;

    // Process notification dispatches in parallel
    await Promise.all(unnotified.map(async (m) => {
      const isUser1 = m.user1_id === userId;
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '🎉 You Have a New UniMatch!',
        message: 'A student on campus matched with you! Open UniMatch to see their profile, Instagram & fun icebreaker question.',
        type: 'unimatch_match'
      });

      const updatePayload = isUser1 ? { notified_user1: true } : { notified_user2: true };
      await supabase.from('unimatch_matches').update(updatePayload).eq('id', m.id);
    }));
  } catch (err) {
    console.warn("Error checking match notifications:", err);
  }
}

// Helper: 24-Hour Daily Free Likes Manager
const DAILY_FREE_LIKES = 10;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours

function getDailyLikesInfo(userId) {
  const uid = userId || 'guest';
  const key = `unimatch_likes_${uid}`;
  const now = Date.now();

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.limit !== DAILY_FREE_LIKES || now - data.last_reset >= RESET_INTERVAL_MS) {
        const resetData = { remaining: DAILY_FREE_LIKES, last_reset: now, limit: DAILY_FREE_LIKES };
        localStorage.setItem(key, JSON.stringify(resetData));
        return resetData;
      }
      return data;
    }
  } catch (e) {}

  const initData = { remaining: DAILY_FREE_LIKES, last_reset: now, limit: DAILY_FREE_LIKES };
  try {
    localStorage.setItem(key, JSON.stringify(initData));
  } catch (e) {}
  return initData;
}

function consumeDailyLike(userId) {
  const info = getDailyLikesInfo(userId);
  if (info.remaining <= 0) {
    return { success: false, remaining: 0 };
  }
  info.remaining -= 1;
  const uid = userId || 'guest';
  const key = `unimatch_likes_${uid}`;
  try {
    localStorage.setItem(key, JSON.stringify(info));
  } catch (e) {}
  return { success: true, remaining: info.remaining };
}

function addExtraLikes(userId, count = 5) {
  const info = getDailyLikesInfo(userId);
  info.remaining += count;
  const uid = userId || 'guest';
  const key = `unimatch_likes_${uid}`;
  try {
    localStorage.setItem(key, JSON.stringify(info));
  } catch (e) {}
  return info.remaining;
}

// Helper: Reset all swipes for current user (allows re-swiping during testing)
async function resetUserSwipes(userId) {
  if (!userId) return;
  try {
    await supabase
      .from('unimatch_likes')
      .delete()
      .eq('liker_id', userId);
  } catch (e) {
    console.error("Error resetting swipes:", e);
  }
  clearLocalPasses(userId);
}

// Helper: Require Verified Seller
// Redirects to pending_verification or id_verification if user is not verified.
async function requireVerifiedSeller() {
  const isAuth = await requireAuth();
  if (!isAuth) return false;

  const profile = await getProfile();
  if (!profile) {
    window.location.href = '/auth/login.html';
    return false;
  }

  // Admins can always sell
  if (profile.role === 'admin') {
    return true;
  }

  // Non-verified users cannot sell
  if (!profile.full_name || !profile.phone_number || !profile.father_name) {
    alert("Please complete your profile before continuing.");
    window.location.href = '/auth/profile_setup.html';
    return false;
  }
  return true;
}

// Helper: Verify Action
// Intercepts user action if not verified, shows alert, and redirects.
async function verifyAction(actionCallback) {
  const profile = await getProfile();
  if (!profile) {
    window.location.href = '/auth/login.html';
    return false;
  }

  if (profile.role === 'admin' || (profile.full_name && profile.phone_number && profile.father_name)) {
    if (actionCallback) actionCallback();
    return true;
  }

  alert("Please complete your profile before continuing.");
  window.location.href = '/auth/profile_setup.html';
  return false;
}

// Helper: Clear Profile Cache
function clearProfileCache() {
  _cachedProfile = null;
  try { sessionStorage.removeItem('unimatch_cached_profile'); } catch (e) {}
}

// Helper: Update Profile
async function updateProfile(updates) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const payload = {
    id: session.user.id,
    email: session.user.email,
    ...updates
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    console.warn("Upsert profile warning, falling back to update:", error.message);
    const { error: updateErr } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);
    if (updateErr) throw updateErr;
  }

  // Clear cache & force fresh fetch on next call
  clearProfileCache();
}

// Helper: Get Latest Products for Dashboard Feed
async function getLatestProducts(limit = 6) {
  const { data: products, error } = await supabase
    .from('products')
    .select('*, profiles!seller_id(full_name)')
    .eq('status', 'Available')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return products || [];
}

// Helper: Get Product by ID
async function getProductById(id) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*, profiles!seller_id(full_name, is_verified)')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }
  return product;
}


// Helper: Get All Available Products for Marketplace
async function getAllProducts() {
  // Primary query: join with profiles for seller name
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, profiles!seller_id(full_name)')
      .neq('status', 'Reserved')
      .neq('status', 'Sold')
      .order('created_at', { ascending: false });

    if (!error && products) {
      return products.filter(p => !p.status || p.status.toLowerCase() === 'available');
    }
    console.warn('[getAllProducts] join query error, falling back:', error?.message);
  } catch(e) {
    console.warn('[getAllProducts] join query threw, falling back:', e);
  }

  // Fallback: simple query without join
  try {
    const { data: simpleProducts, error: simpleError } = await supabase
      .from('products')
      .select('*')
      .neq('status', 'Reserved')
      .neq('status', 'Sold')
      .order('created_at', { ascending: false });

    if (!simpleError && simpleProducts) {
      return simpleProducts.filter(p => !p.status || p.status.toLowerCase() === 'available');
    }
    console.error('[getAllProducts] fallback error:', simpleError?.message);
  } catch(e) {
    console.error('[getAllProducts] fallback threw:', e);
  }

  return [];
}
// Helper: Get Active Boosted Products (for Home Page Trending Offers ⚡)
// STRICT RULE: Only returns products where is_boosted=true AND boosted_until > now()
// Never falls back to showing all products — returns [] if no paid active boosts exist.
async function getBoostedProducts() {
  const nowStr = new Date().toISOString();

  // Primary: join with profiles for full seller name
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles!seller_id(full_name)')
      .eq('is_boosted', true)
      .gt('boosted_until', nowStr)
      .or('status.is.null,status.eq.Available')
      .order('boosted_until', { ascending: false });

    if (!error) {
      // Return as-is — empty array means no active boosts (correct behaviour)
      return data || [];
    }
    console.warn('[getBoostedProducts] join query error, trying simple query:', error.message);
  } catch(e) {
    console.warn('[getBoostedProducts] join query threw:', e);
  }

  // Fallback: same strict filter but without the profile join
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_boosted', true)
      .gt('boosted_until', nowStr)
      .or('status.is.null,status.eq.Available')
      .order('boosted_until', { ascending: false });

    if (!error) {
      return data || [];
    }
    console.error('[getBoostedProducts] fallback error:', error.message);
  } catch(e) {
    console.error('[getBoostedProducts] fallback threw:', e);
  }

  // Never show un-boosted products in Trending Offers
  return [];
}

// Helper: Boost Product Listing (⚡ ₹19/day, min 2 days)
async function boostProductListing(productId, days = 2) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in to boost a listing.");

  const boostDays = Math.max(2, parseInt(days) || 2);
  const now = new Date();
  const until = new Date(now.getTime() + (boostDays * 24 * 60 * 60 * 1000));

  const { error } = await supabase
    .from('products')
    .update({
      is_boosted: true,
      boosted_at: now.toISOString(),
      boosted_until: until.toISOString()
    })
    .eq('id', productId)
    .eq('seller_id', session.user.id);

  if (error) {
    console.error("Error boosting product:", error);
    throw error;
  }
}

function calculateBoostCost(days) {
  const boostDays = Math.max(2, parseInt(days) || 2);
  return boostDays * 19;
}

// Helper: Calculate Listing Fee for New Products
// First 2 listings are FREE
// 3rd listing onwards:
// Under ₹100: ₹19
// ₹100 – ₹200: ₹29
// > ₹200: ₹39
async function calculateListingFeeForUser(userId, price) {
  const userProducts = await getUserProducts(userId);
  if (userProducts.length < 2) {
    return { fee: 0, isFree: true, count: userProducts.length };
  }
  const numericPrice = parseFloat(price) || 0;
  let fee = 39;
  if (numericPrice < 100) {
    fee = 19;
  } else if (numericPrice <= 200) {
    fee = 29;
  }
  return { fee, isFree: false, count: userProducts.length };
}

// Helper: Buy Product Directly
async function buyProductDirectly(productId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { error } = await supabase
    .from('products')
    .update({
      status: 'Sold',
      buyer_id: session.user.id
    })
    .eq('id', productId);

  if (error) {
    console.error("Error buying product directly:", error);
    throw error;
  }
}

function renderProductCard(product) {
  const price = product.price ? '₹' + product.price : 'Price N/A';
  const originalPrice = product.original_price ? '<span class="font-label-caps text-[10px] text-on-surface-variant line-through">₹' + product.original_price + '</span>' : '';
  const condition = product.condition || 'Good';
  const imageStyle = product.image_url
    ? `background-image: url('${product.image_url}')`
    : `background-color: var(--color-surface-container)`;
  const imagePlaceholder = !product.image_url
    ? `<span class="material-symbols-outlined text-[48px] text-on-surface-variant/40">image_not_supported</span>`
    : '';

  return `
    <div onclick="window.location.href='/marketplace/item.html?id=${product.id}'" class="cursor-pointer bg-surface-container-lowest rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300">
      <div class="relative w-full aspect-square bg-surface-container-low flex items-center justify-center">
        <div class="bg-cover bg-center w-full h-full flex items-center justify-center" style="${imageStyle}">${imagePlaceholder}</div>
        <div class="absolute top-2 left-2 bg-surface-container-lowest/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <span class="material-symbols-outlined text-[12px] text-primary-container" style="font-variation-settings: 'FILL' 1;">verified</span>
          <span class="font-label-caps text-[10px] text-on-surface">Verified</span>
        </div>
        <button class="absolute top-2 right-2 w-8 h-8 bg-surface-container-lowest/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-on-surface-variant hover:text-error transition-colors">
          <span class="material-symbols-outlined text-[18px]">favorite</span>
        </button>
      </div>
      <div class="p-4 flex flex-col gap-1">
        <h4 class="font-body-sm text-body-sm text-on-background font-semibold truncate">${escapeHTML(product.title)}</h4>
        <p class="font-label-caps text-label-caps text-on-surface-variant">${condition}</p>
        <div class="flex items-center justify-between mt-1">
          <span class="font-title-md text-[18px] text-primary-container">${price}</span>
          ${originalPrice}
        </div>
      </div>
    </div>
  `;
}

// Helper: Get Products by Seller ID
async function getUserProducts(userId) {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, profiles!seller_id(full_name)')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (!error && products) {
      return products;
    }
  } catch(e) {}

  try {
    const { data: simpleProducts, error: simpleError } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (!simpleError && simpleProducts) {
      return simpleProducts;
    }
  } catch(e) {}

  return [];
}

// Helper: Update Product
async function updateProduct(productId, updates) {
  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId);

  if (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

// Helper: Delete Product
async function deleteProduct(productId) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

// Helper: Upload Avatar
async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop();
  const filePath = `${userId}/avatar_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// Helper: Get Saved Items
async function getSavedItems(userId) {
  const { data: saves, error } = await supabase
    .from('saved_items')
    .select('product_id, products(*, profiles(full_name))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching saved items:", error);
    return [];
  }
  return saves.map(s => s.products).filter(p => p != null);
}

// Helper: Get Purchase History
async function getPurchaseHistory(userId) {
  const { data: purchases, error } = await supabase
    .from('products')
    .select('*, profiles!seller_id(full_name)')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching purchases:", error);
    return [];
  }
  return purchases || [];
}

// Helper: Get Selling History (Sold items)
async function getSellingHistory(userId) {
  const { data: sold, error } = await supabase
    .from('products')
    .select('*, profiles!seller_id(full_name)')
    .eq('seller_id', userId)
    .eq('status', 'Sold')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching selling history:", error);
    return [];
  }
  return sold || [];
}

// Helper: Submit an Offer
async function submitOffer(productId, sellerId, amount, message = '') {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { error } = await supabase
    .from('offers')
    .insert({
      product_id: productId,
      buyer_id: session.user.id,
      seller_id: sellerId,
      offer_amount: amount,
      message: message || null,
      status: 'Pending'
    });

  if (error) {
    console.error("Error submitting offer:", error);
    throw error;
  }

  // Notify seller via email alert (fires lock-screen notification on iPhone/Android)
  try {
    const [{ data: sellerProfile }, { data: product }] = await Promise.all([
      supabase.from('profiles').select('email, full_name').eq('id', sellerId).maybeSingle(),
      supabase.from('products').select('title').eq('id', productId).maybeSingle()
    ]);
    if (sellerProfile && sellerProfile.email && window.AuthClient && typeof window.AuthClient.sendEmailNotification === 'function') {
      const buyerName = session.user.user_metadata?.full_name || 'A student';
      window.AuthClient.sendEmailNotification({
        to: sellerProfile.email,
        title: `New Offer: ₹${amount} on "${product?.title || 'your listing'}"! 🏷️`,
        message: `${buyerName} just made an offer of ₹${amount} on "${product?.title || 'your listing'}". Check your Activity Hub to accept or counter.`,
        platform: 'unithrift',
        actionUrl: 'https://unithrift.co.in/core/activity.html',
        actionText: 'View Offer'
      }).catch(() => {});
    }
  } catch (e) {}
}

// Helper: Get Received Offers (for Sellers)
async function getReceivedOffers() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data: offers, error } = await supabase
    .from('offers')
    .select('*, products(*), profiles!buyer_id(full_name, email)')
    .eq('seller_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching received offers:", error);
    return [];
  }
  return offers || [];
}

// Helper: Get Sent Offers (for Buyers)
async function getSentOffers() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data: offers, error } = await supabase
    .from('offers')
    .select('*, products(*), profiles!seller_id(full_name)')
    .eq('buyer_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching sent offers:", error);
    return [];
  }
  return offers || [];
}

// Helper: Get Offer Details by ID
async function getOfferById(offerId) {
  const { data: offer, error } = await supabase
    .from('offers')
    .select('*, products(*), profiles!buyer_id(full_name, email)')
    .eq('id', offerId)
    .single();

  if (error) {
    console.error("Error fetching offer by ID:", error);
    return null;
  }
  return offer;
}

// Helper: Update Offer Status (and mark product sold if accepted)
async function updateOfferStatus(offerId, status, counterAmount = null) {
  const updates = { status };
  if (status === 'Countered' && counterAmount) {
    updates.offer_amount = counterAmount;
  }

  // Update offer
  const { data: offer, error: updateError } = await supabase
    .from('offers')
    .update(updates)
    .eq('id', offerId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating offer status:", updateError);
    throw updateError;
  }

  // Notify buyer via email alert (fires lock-screen notification on iPhone/Android)
  try {
    const [{ data: buyerProfile }, { data: product }] = await Promise.all([
      supabase.from('profiles').select('email').eq('id', offer.buyer_id).maybeSingle(),
      supabase.from('products').select('title').eq('id', offer.product_id).maybeSingle()
    ]);
    if (buyerProfile && buyerProfile.email && window.AuthClient && typeof window.AuthClient.sendEmailNotification === 'function') {
      const prodTitle = product?.title || 'your item';
      let title = `Offer ${status}: "${prodTitle}"`;
      let msg = `Your offer for "${prodTitle}" is now marked as ${status}.`;
      let actionUrl = 'https://unithrift.co.in/core/activity.html';
      let actionText = 'Check Status';

      if (status === 'Accepted') {
        title = `🎉 Offer Accepted for "${prodTitle}"!`;
        msg = `Great news! The seller accepted your offer of ₹${offer.offer_amount}. Go to the listing to pay the deposit and lock in your reservation!`;
        actionUrl = `https://unithrift.co.in/marketplace/item.html?id=${offer.product_id}`;
        actionText = 'Reserve Now';
      } else if (status === 'Countered') {
        title = `Counter-Offer Received on "${prodTitle}"`;
        msg = `The seller has countered with ₹${offer.offer_amount}. Tap to view and respond.`;
      }

      window.AuthClient.sendEmailNotification({
        to: buyerProfile.email,
        title,
        message: msg,
        platform: 'unithrift',
        actionUrl,
        actionText
      }).catch(() => {});
    }
  } catch (e) {}

  return offer;
}

// Helper: Sign In with Google OAuth
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/auth/profile_setup.html'
    }
  });

  if (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

// Helper: Sign Out
async function logout(redirectPath = '') {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
  clearLegacyAuthState();
  clearProfileCache();
  try { sessionStorage.removeItem('unithrift_auth_return_to'); } catch (e) {}
  const loginPath = redirectPath || (window.location.pathname.startsWith('/unimatch/')
    ? '/unimatch/auth/login.html'
    : '/auth/login.html');
  window.location.replace(loginPath);
}

// Helper: Get Pending Verifications (for Admins)
async function getPendingVerifications() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.filter(p => 
      p.unimatch_verification_status === 'pending' || 
      p.verification_status === 'pending' || 
      (p.id_url && p.id_url.trim().length > 0 && !p.is_verified && p.unimatch_verification_status !== 'verified')
    );
  } catch (e) {
    console.error("Error in getPendingVerifications:", e);
    return [];
  }
}

// Helper: Get All Roommate Listings (for Admin Dashboard)
async function getAllRoommateListingsAdmin() {
  const { data, error } = await supabase
    .from('roommate_listings')
    .select('*, profiles!user_id(full_name, avatar_url, college, year_of_study)')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching all roommate listings admin:", error);
    return [];
  }
  return data || [];
}

// Helper: Get All Users (for Admins)
async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
  return data || [];
}

// Helper: Approve Verification (for Admins)
async function approveVerification(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_verified: true,
      verification_status: 'verified',
      unimatch_verification_status: 'verified',
      verification_feedback: null
    })
    .eq('id', userId);
  if (error) {
    console.error("Error approving verification:", error);
    throw error;
  }
}

// Helper: Reject Verification (for Admins)
async function rejectVerification(userId, feedback) {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_verified: false,
      verification_status: 'rejected',
      unimatch_verification_status: 'rejected',
      verification_feedback: feedback || 'ID Card not legible or invalid college email.'
    })
    .eq('id', userId);
  if (error) {
    console.error("Error rejecting verification:", error);
    throw error;
  }
}

// Helper: Get All Products (for Admin Moderation)
async function getAdminProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, profiles!seller_id(full_name)')
    .order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching admin products:", error);
    return [];
  }
  return data || [];
}

// Helper: Delete Product as Admin
async function deleteProductAdmin(productId) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);
  if (error) {
    console.error("Error deleting product as admin:", error);
    throw error;
  }
}

// Helper: Boost or unboost a product as an admin.
// Passing null for days removes the boost; otherwise the boost starts now.
async function setProductBoostAdmin(productId, days = null) {
  const normalizedDays = days === null ? null : Number.parseInt(days, 10);

  if (normalizedDays !== null && (!Number.isInteger(normalizedDays) || normalizedDays < 1 || normalizedDays > 365)) {
    throw new Error("Boost duration must be between 1 and 365 days.");
  }

  const { data, error } = await supabase.rpc('admin_set_product_boost', {
    p_product_id: productId,
    p_days: normalizedDays
  });

  if (error) {
    console.error("Error changing product boost as admin:", error);
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
}

// Helper: Create Roommate Listing
async function createRoommateListing(listing) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  // Deactivate any existing listing first (one active post per user)
  await supabase
    .from('roommate_listings')
    .update({ is_active: false })
    .eq('user_id', session.user.id);

  const { error } = await supabase
    .from('roommate_listings')
    .insert({
      ...listing,
      user_id: session.user.id,
      is_active: true
    });
  if (error) {
    console.error("Error creating roommate listing:", error);
    throw error;
  }
}

// Helper: Get Roommate Listings (for swipe deck)
// Excludes the current user's own listing and listings they've already liked/swiped.
async function getRoommateListings() {
  const { data: { session } } = await supabase.auth.getSession();

  // Build the base query — only active listings
  let query = supabase
    .from('roommate_listings')
    .select('*, profiles!user_id(full_name, avatar_url, college, year_of_study)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // If logged in, filter out own listing and already-liked listings
  if (session) {
    query = query.neq('user_id', session.user.id);

    // Fetch already-liked listing IDs
    const { data: likedRows } = await supabase
      .from('roommate_likes')
      .select('listing_id')
      .eq('liker_id', session.user.id);

    const likedIds = (likedRows || []).map(r => r.listing_id);
    if (likedIds.length > 0) {
      query = query.not('id', 'in', `(${likedIds.join(',')})`);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching roommate listings:", error);
    return [];
  }
  return data || [];
}

// Helper: Get the current user's own active roommate listing
async function getUserRoommateListing() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('roommate_listings')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching user roommate listing:", error);
  }
  return data || null;
}

// Helper: Soft-delete (deactivate) user's own roommate listing
async function deleteRoommateListing(id) {
  const { error } = await supabase
    .from('roommate_listings')
    .update({ is_active: false })
    .eq('id', id);
  if (error) {
    console.error("Error deactivating roommate listing:", error);
    throw error;
  }
}

// Helper: Like / Swipe-right on a roommate listing
async function likeRoommateListing(listingId, likedUserId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { error } = await supabase
    .from('roommate_likes')
    .upsert({
      liker_id: session.user.id,
      liked_user_id: likedUserId,
      listing_id: listingId
    }, { onConflict: 'liker_id,listing_id' });

  if (error) {
    console.error("Error liking roommate listing:", error);
    throw error;
  }
}

// Helper: Get mutual matches (both users liked each other)
async function getMyRoommateMatches() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  // Fetch people I liked
  const { data: myLikes, error: likesError } = await supabase
    .from('roommate_likes')
    .select('liked_user_id, listing_id')
    .eq('liker_id', session.user.id);

  if (likesError || !myLikes || myLikes.length === 0) return [];

  const likedUserIds = myLikes.map(l => l.liked_user_id);

  // Find who among them also liked me back
  const { data: theirLikes, error: theirError } = await supabase
    .from('roommate_likes')
    .select('liker_id, listing_id, profiles!liker_id(full_name, avatar_url, college, year_of_study, phone_number)')
    .in('liker_id', likedUserIds)
    .eq('liked_user_id', session.user.id);

  if (theirError) {
    console.error("Error fetching mutual matches:", theirError);
    return [];
  }
  return theirLikes || [];
}

// Helper: Delete Roommate Listing as Admin
async function deleteRoommateListingAdmin(id) {
  const { error } = await supabase
    .from('roommate_listings')
    .delete()
    .eq('id', id);
  if (error) {
    console.error("Error deleting roommate listing as admin:", error);
    throw error;
  }
}

// Helper: Get local areas for a specific college
async function getCollegeAreas(collegeName) {
  if (!collegeName) return [];
  const { data, error } = await supabase
    .from('college_areas')
    .select('areas')
    .eq('college_name', collegeName)
    .single();
    
  if (error) {
    console.warn("Could not fetch college areas for", collegeName, error);
    return [];
  }
  return data?.areas || [];
}

// Helper: Create PG Listing
async function createPGListing(pgData) {
  const { error } = await supabase
    .from('pg_listings')
    .insert(pgData);
  if (error) {
    console.error("Error creating PG listing:", error);
    throw error;
  }
}

// Helper: Get PG Listings
async function getPGListings() {
  const { data, error } = await supabase
    .from('pg_listings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching PG listings:", error);
    return [];
  }
  return data || [];
}

// Helper: Delete PG Listing as Admin
async function deletePGListingAdmin(id) {
  const { error } = await supabase
    .from('pg_listings')
    .delete()
    .eq('id', id);
  if (error) {
    console.error("Error deleting PG listing as admin:", error);
    throw error;
  }
}

// Helper: Require Admin Role
async function requireAdmin() {
  const isAuth = await requireAuth();
  if (!isAuth) return false;
  
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') {
    window.location.href = '/pghostels/pghostels.html';
    return false;
  }
  return true;
}

// Auto-sync header profile photo across all pages and check notifications
document.addEventListener('DOMContentLoaded', async () => {
  const headerAvatars = document.querySelectorAll('#header-avatar');
  if (headerAvatars.length > 0) {
    try {
      const profile = await getProfile();
      if (profile) {
        let avatarSrc = null;
        if (profile.profile_photos) {
          try {
            const photos = typeof profile.profile_photos === 'string' ? JSON.parse(profile.profile_photos) : profile.profile_photos;
            if (photos && photos.length > 0) avatarSrc = photos[0];
          } catch (e) {}
        }
        if (!avatarSrc && profile.avatar_url) {
          avatarSrc = profile.avatar_url;
        }
        if (avatarSrc) {
          headerAvatars.forEach(img => {
            img.src = avatarSrc;
          });
        }
      }
    } catch (e) {
      console.warn("Auto-sync profile picture skipped:", e);
    }
  }

  // Trigger notification check shortly after load
  setTimeout(checkForNotifications, 1000);
});

// Helper: Get Unseen Offers for Seller
async function getUnseenOffersForSeller() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('offers')
    .select('*, products(title), profiles!buyer_id(full_name)')
    .eq('seller_id', session.user.id)
    .eq('status', 'Pending')
    .eq('seller_notified', false);

  if (error) {
    console.error("Error fetching unseen offers for seller:", error);
    return [];
  }
  return data || [];
}

// Helper: Get Unseen Offers for Buyer
async function getUnseenOffersForBuyer() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('offers')
    .select('*, products(title)')
    .eq('buyer_id', session.user.id)
    .in('status', ['Accepted', 'Rejected'])
    .eq('buyer_notified', false);

  if (error) {
    console.error("Error fetching unseen offers for buyer:", error);
    return [];
  }
  return data || [];
}

// Helper: Mark Offer Seller Notified
async function markOfferSellerNotified(offerId) {
  const { error } = await supabase
    .from('offers')
    .update({ seller_notified: true })
    .eq('id', offerId);
  if (error) {
    console.error("Error marking offer seller notified:", error);
    throw error;
  }
}

// Helper: Mark Offer Buyer Notified
async function markOfferBuyerNotified(offerId) {
  const { error } = await supabase
    .from('offers')
    .update({ buyer_notified: true })
    .eq('id', offerId);
  if (error) {
    console.error("Error marking offer buyer notified:", error);
    throw error;
  }
}

// Helper: Show Premium Glassmorphic Notification
function showPremiumNotification(title, message, iconName, redirectUrl, onAcknowledge) {
  let container = document.getElementById('notification-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-toast-container';
    container.className = 'fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-[calc(100vw-3rem)] pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto border border-outline-variant/30 rounded-2xl p-4 shadow-xl flex gap-3 transform translate-y-12 opacity-0 transition-all duration-500 hover:shadow-2xl';
  toast.style.background = 'rgba(255, 255, 255, 0.9)';
  toast.style.backdropFilter = 'blur(12px)';
  toast.style.webkitBackdropFilter = 'blur(12px)';

  let iconColor = 'text-primary bg-primary/10';
  if (iconName === 'check_circle') iconColor = 'text-primary bg-primary/10';
  if (iconName === 'cancel') iconColor = 'text-error bg-error-container/20';

  toast.innerHTML = `
    <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconColor}">
      <span class="material-symbols-outlined text-[20px]">${iconName}</span>
    </div>
    <div class="flex-grow flex flex-col gap-0.5 cursor-pointer">
      <h4 class="font-title-md text-[14px] text-on-surface font-semibold">${title}</h4>
      <p class="font-body-sm text-[12px] text-secondary leading-relaxed">${message}</p>
    </div>
    <button class="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container transition-colors select-none">
      <span class="material-symbols-outlined text-[18px]">close</span>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-12', 'opacity-0');
  }, 50);

  let acknowledged = false;
  async function ack() {
    if (acknowledged) return;
    acknowledged = true;
    try {
      await onAcknowledge();
    } catch(e) {
      console.error(e);
    }
  }

  toast.querySelector('.cursor-pointer').addEventListener('click', async () => {
    await ack();
    window.location.href = redirectUrl;
  });

  toast.querySelector('button').addEventListener('click', async (e) => {
    e.stopPropagation();
    await ack();
    dismissToast();
  });

  const autoDismissTimeout = setTimeout(async () => {
    await ack();
    dismissToast();
  }, 10000);

  function dismissToast() {
    clearTimeout(autoDismissTimeout);
    toast.classList.add('translate-y-12', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 500);
  }
}

// Helper: Check for Offer Notifications
async function checkForNotifications() {
  if (window.location.pathname.includes('/auth/')) {
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const now = Date.now();
  const lastCheck = sessionStorage.getItem('last_notification_check');
  if (lastCheck && now - parseInt(lastCheck) < 15000) {
    // If we checked recently, we still want to render the badge if it was stored
    renderNotificationBadge(parseInt(sessionStorage.getItem('last_unread_count') || '0'));
    return;
  }
  sessionStorage.setItem('last_notification_check', now);

  try {
    const unreadCount = await getUnreadNotificationCount();
    sessionStorage.setItem('last_unread_count', unreadCount);
    renderNotificationBadge(unreadCount);

    // Keep the old toast notification logic for offers so users still get the toast popup
    const unseenReceived = await getUnseenOffersForSeller();
    unseenReceived.forEach(offer => {
      showPremiumNotification(
        "New Offer Received",
        `You got an offer of ₹${offer.offer_amount} for "${offer.products?.title || 'your product'}" from ${offer.profiles?.full_name || 'a student'}.`,
        "local_offer",
        "/core/offers.html",
        () => markOfferSellerNotified(offer.id)
      );
    });

    const unseenSent = await getUnseenOffersForBuyer();
    unseenSent.forEach(offer => {
      const isAccepted = offer.status === 'Accepted';
      showPremiumNotification(
        isAccepted ? "Offer Accepted!" : "Offer Rejected",
        `Your offer of ₹${offer.offer_amount} for "${offer.products?.title || 'the product'}" was ${offer.status.toLowerCase()} by the seller.`,
        isAccepted ? "check_circle" : "cancel",
        "/core/offers.html",
        () => markOfferBuyerNotified(offer.id)
      );
    });
  } catch(e) {
    console.error("Error in notification checker:", e);
  }
}

function renderNotificationBadge(count) {
  // Find the Activity nav items
  const activityNavs = document.querySelectorAll('a[href="/core/activity.html"]');
  activityNavs.forEach(nav => {
    // Remove existing badge if any
    const existingBadge = nav.querySelector('.nav-badge');
    if (existingBadge) existingBadge.remove();

    if (count > 0) {
      // Add relatively positioned wrapper if icon doesn't have it
      const iconSpan = nav.querySelector('.material-symbols-outlined');
      if (iconSpan) {
        iconSpan.style.position = 'relative';
        const badge = document.createElement('div');
        badge.className = 'nav-badge absolute top-0 right-0 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-lowest animate-pulse';
        iconSpan.appendChild(badge);
      }
    }
  });
}




// ==========================================
// RESERVATION & IN-PLATFORM MESSAGING SYSTEM
// ==========================================

// Helper: Create a Reservation (25% Deposit)
async function createReservation(productId, sellerId, productPrice, location, meetTime) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const depositAmount = (productPrice * 0.25).toFixed(2);
  const remainingAmount = (productPrice * 0.75).toFixed(2);

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .insert({
      product_id: productId,
      buyer_id: session.user.id,
      seller_id: sellerId,
      deposit_amount: depositAmount,
      remaining_amount: remainingAmount,
      status: 'Reserved'
    })
    .select()
    .single();

  if (resError) {
    console.error("Error creating reservation:", resError);
    throw resError;
  }

  // Automatically propose the meetup
  if (location && meetTime) {
    const { error: meetupError } = await supabase
      .from('meetups')
      .insert({
        reservation_id: reservation.id,
        location: location,
        meet_time: meetTime,
        status: 'Proposed',
        proposed_by: session.user.id
      });
      
    if (meetupError) {
      console.error("Error creating initial meetup:", meetupError);
    }
  }

  // Update product status to 'Reserved' and link buyer
  const { error: prodError } = await supabase
    .from('products')
    .update({
      status: 'Reserved',
      buyer_id: session.user.id
    })
    .eq('id', productId);

  if (prodError) {
    console.error("Error updating product to Reserved:", prodError);
    throw prodError;
  }

  return reservation;
}

// Helper: Get Reservations as Buyer
async function getReservationsAsBuyer() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('reservations')
    .select('*, products(*), profiles!seller_id(full_name, avatar_url)')
    .eq('buyer_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching buyer reservations:", error);
    return [];
  }
  return data || [];
}

// Helper: Get Reservations as Seller
async function getReservationsAsSeller() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('reservations')
    .select('*, products(*), profiles!buyer_id(full_name, avatar_url)')
    .eq('seller_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching seller reservations:", error);
    return [];
  }
  return data || [];
}

// Helper: Get Reservation by ID
async function getReservationById(id) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, products(*), buyer:profiles!buyer_id(full_name, avatar_url, phone_number), seller:profiles!seller_id(full_name, avatar_url, phone_number)')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching reservation:", error);
    return null;
  }
  return data;
}

// Helper: Send Chat Message
async function sendMessage(reservationId, text, imageUrl = null) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { error } = await supabase
    .from('messages')
    .insert({
      reservation_id: reservationId,
      sender_id: session.user.id,
      text: text,
      image_url: imageUrl
    });

  if (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

// Helper: Get Chat Messages
async function getChatMessages(reservationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles!sender_id(full_name, avatar_url)')
    .eq('reservation_id', reservationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data || [];
}

// Helper: Propose Meetup
async function proposeMeetup(reservationId, location, meetTime) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  // Check if meetup exists
  const { data: existing, error: checkError } = await supabase
    .from('meetups')
    .select('id')
    .eq('reservation_id', reservationId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('meetups')
      .update({
        location: location,
        meet_time: meetTime,
        status: 'Proposed',
        proposed_by: session.user.id
      })
      .eq('reservation_id', reservationId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('meetups')
      .insert({
        reservation_id: reservationId,
        location: location,
        meet_time: meetTime,
        status: 'Proposed',
        proposed_by: session.user.id
      });
    if (error) throw error;
  }
}

// Helper: Get Meetup for Reservation
async function getMeetupForReservation(reservationId) {
  const { data, error } = await supabase
    .from('meetups')
    .select('*, profiles!proposed_by(full_name)')
    .eq('reservation_id', reservationId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error("Error fetching meetup:", error);
    return null;
  }
  return data || null;
}

// Helper: Confirm Meetup
async function confirmMeetup(reservationId) {
  const { error } = await supabase
    .from('meetups')
    .update({ status: 'Confirmed' })
    .eq('reservation_id', reservationId);

  if (error) {
    console.error("Error confirming meetup:", error);
    throw error;
  }
}

// Helper: Confirm Transaction Completion
async function confirmTransaction(reservationId, role) {
  const updates = {};
  if (role === 'buyer') updates.buyer_confirmed = true;
  else if (role === 'seller') updates.seller_confirmed = true;

  const { data: reservation, error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', reservationId)
    .select()
    .single();

  if (error) {
    console.error("Error confirming transaction:", error);
    throw error;
  }

  // If both confirmed, mark reservation as Completed and Product as Sold
  if (reservation.buyer_confirmed && reservation.seller_confirmed) {
    await supabase
      .from('reservations')
      .update({ status: 'Completed' })
      .eq('id', reservationId);
      
    await supabase
      .from('products')
      .update({ status: 'Sold' })
      .eq('id', reservation.product_id);
  }
}

// Helper: Submit Review
async function submitReview(reservationId, revieweeId, rating, comment) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { error } = await supabase
    .from('reviews')
    .insert({
      reservation_id: reservationId,
      reviewer_id: session.user.id,
      reviewee_id: revieweeId,
      rating: rating,
      comment: comment
    });

  if (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
}

// ==========================================
// NOTIFICATIONS SYSTEM
// ==========================================

async function getUnreadNotificationCount() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('is_read', false);

  if (error) {
    console.error("Error fetching notification count:", error);
    return 0;
  }
  return count || 0;
}

async function markNotificationsAsRead() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', session.user.id)
    .eq('is_read', false);

  if (error) {
    console.error("Error marking notifications read:", error);
  }
  
  // Clear the badge immediately on the frontend
  sessionStorage.setItem('last_unread_count', '0');
  if (typeof renderNotificationBadge === 'function') {
    renderNotificationBadge(0);
  }
}

// ==========================================
// PLATFORM SWITCHER SYSTEM (UniThrift <-> UniMatch)
// ==========================================
window.renderPlatformSwitcher = function(activePlatform = 'unithrift') {
  const isThrift = activePlatform === 'unithrift';
  const isMatch = activePlatform === 'unimatch';

  return `
    <div class="platform-switcher flex items-center bg-surface-container-high/80 dark:bg-black/30 p-1 rounded-full border border-outline-variant/30 shadow-inner backdrop-blur-md">
      <a href="/marketplace/marketplace.html" title="Switch to UniThrift Marketplace" class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${isThrift ? 'bg-[#006e2f] text-white shadow-md scale-105' : 'text-on-surface-variant hover:text-on-surface opacity-70 hover:opacity-100'}">
        <span class="material-symbols-outlined text-[15px]">shopping_bag</span>
        <span>UniThrift</span>
      </a>
      <a href="/unimatch/discover.html" title="Switch to UniMatch Social Feed" class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${isMatch ? 'bg-[#7A1F3D] text-white shadow-md scale-105' : 'text-on-surface-variant hover:text-on-surface opacity-70 hover:opacity-100'}">
        <span class="material-symbols-outlined text-[15px]" style="font-variation-settings: 'FILL' 1;">favorite</span>
        <span>UniMatch</span>
      </a>
    </div>
  `;
};

document.addEventListener('DOMContentLoaded', () => {
  const slot = document.getElementById('platform-switcher-slot');
  if (slot) {
    const isMatchPage = window.location.pathname.includes('/unimatch/');
    slot.innerHTML = window.renderPlatformSwitcher(isMatchPage ? 'unimatch' : 'unithrift');
  }
});

// ==========================================
// STORAGE SYSTEM
// ==========================================

// Helper: Compress Image File
function compressImageFile(file, maxWidth = 1024, maxHeight = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
}

// Helper: Upload Image to Supabase Storage
async function uploadImage(file, bucketName, compress = true) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  let fileToUpload = file;
  if (compress && file.type.startsWith('image/')) {
    try {
      fileToUpload = await compressImageFile(file, 1024, 1024, 0.7);
    } catch(e) {
      console.warn("Image compression failed, uploading original:", e);
    }
  }

  // Create a unique file name
  const fileExt = fileToUpload.name.split('.').pop();
  const fileName = `${session.user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error(`Error uploading image to ${bucketName}:`, error);
    throw error;
  }

  // Get public URL
  const { data: publicUrlData } = supabase
    .storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
