// Supabase Configuration
// Requires the Supabase JS UMD SDK to be loaded in HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>

const SUPABASE_URL = 'https://bwhvbynmqubjwgonsywd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rDDTMnU-KaDG941KB0gaYA_5dHnXX1G';

// Initialize Supabase Client
// The UMD bundle exposes the library as window.supabase
const supabaseLib = window.supabase || window.Supabase;
if (!supabaseLib) { console.error('Supabase SDK not loaded! Check the CDN script tag.'); }
window.supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: Get Current User Profile
async function getProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return profile;
}

// Helper: Require Authentication
// Redirects to login if no session is active.
async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Helper: Require Verified Seller
// Redirects to pending-verification if seller is not verified.
async function requireVerifiedSeller() {
  const isAuth = await requireAuth();
  if (!isAuth) return false;

  const profile = await getProfile();
  if (!profile) {
    window.location.href = 'login.html';
    return false;
  }

  if (profile.role === 'seller' && !profile.is_verified) {
    window.location.href = 'pending_verification.html';
    return false;
  }
  return true;
}

// Helper: Update Profile
async function updateProfile(updates) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', session.user.id);

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}
