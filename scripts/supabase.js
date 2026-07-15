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
    window.location.href = '/auth/login.html';
    return false;
  }
  return true;
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
  if (!profile.is_verified) {
    alert("Your Student ID has not been verified yet. You can perform this action once your ID has been verified by the admin.");
    if (profile.verification_status === 'pending') {
      window.location.href = '/auth/pending_verification.html';
    } else {
      window.location.href = '/auth/id_verification.html';
    }
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

  if (profile.is_verified || profile.role === 'admin') {
    if (actionCallback) actionCallback();
    return true;
  }

  alert("Your Student ID has not been verified yet. You can perform this action once your ID has been verified by the admin.");
  
  if (profile.verification_status === 'pending') {
    window.location.href = '/auth/pending_verification.html';
  } else {
    window.location.href = '/auth/id_verification.html';
  }
  return false;
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


// Helper: Get All Products for Marketplace
async function getAllProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*, profiles!seller_id(full_name)')
    .eq('status', 'Available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return products || [];
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
        <h4 class="font-body-sm text-body-sm text-on-background font-semibold truncate">${product.title}</h4>
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
  const { data: products, error } = await supabase
    .from('products')
    .select('*, profiles!seller_id(full_name)')
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching user products:", error);
    return [];
  }
  return products || [];
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

  // If accepted, we do NOT automatically mark the product as Sold anymore.
  // The buyer must now go to the item page and pay the 10% deposit to Reserve it.

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
async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
  window.location.href = '/auth/login.html';
}

// Helper: Get Pending Verifications (for Admins)
async function getPendingVerifications() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true });
  if (error) {
    console.error("Error fetching pending verifications:", error);
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
      verification_feedback: feedback
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

// Helper: Create Roommate Listing
async function createRoommateListing(listing) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const { error } = await supabase
    .from('roommate_listings')
    .insert({
      ...listing,
      user_id: session.user.id
    });
  if (error) {
    console.error("Error creating roommate listing:", error);
    throw error;
  }
}

// Helper: Get Roommate Listings
async function getRoommateListings() {
  const { data, error } = await supabase
    .from('roommate_listings')
    .select('*, profiles!user_id(full_name, avatar_url, college, year_of_study)')
    .order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching roommate listings:", error);
    return [];
  }
  return data || [];
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
      if (profile && profile.avatar_url) {
        headerAvatars.forEach(img => {
          img.src = profile.avatar_url;
        });
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
    return;
  }
  sessionStorage.setItem('last_notification_check', now);

  try {
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




// ==========================================
// RESERVATION & IN-PLATFORM MESSAGING SYSTEM
// ==========================================

// Helper: Create a Reservation (10% Deposit)
async function createReservation(productId, sellerId, productPrice, location, meetTime) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const depositAmount = (productPrice * 0.1).toFixed(2);
  const remainingAmount = (productPrice * 0.9).toFixed(2);

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
