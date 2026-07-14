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

// Helper: Get Latest Products for Dashboard Feed
async function getLatestProducts(limit = 6) {
  const { data: products, error } = await supabase
    .from('products')
    .select('*, profiles!seller_id(full_name)')
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return products || [];
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
