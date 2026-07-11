/* ─────────────────────────────────────────
   UniThrift – App Data & Logic
───────────────────────────────────────── */

/* ═══ DATA ═══ */
const COLLEGES = [
  { name: "USICT, Dwarka", city: "Dwarka, Delhi", type: "Govt", emoji: "🏛️", listings: 245 },
  { name: "MAIT, Rohini", city: "Rohini, Delhi", type: "Affiliated", emoji: "🎓", listings: 312 },
  { name: "MSIT, Janakpuri", city: "Janakpuri, Delhi", type: "Affiliated", emoji: "💻", listings: 289 },
  { name: "BPIT, Rohini", city: "Rohini, Delhi", type: "Affiliated", emoji: "📚", listings: 178 },
  { name: "GTBIT, Rajouri Garden", city: "Rajouri Garden, Delhi", type: "Affiliated", emoji: "⚡", listings: 145 },
  { name: "ADGITM, Shastri Park", city: "Shastri Park, Delhi", type: "Affiliated", emoji: "🏫", listings: 198 },
  { name: "HMRITM, Hamidpur", city: "Hamidpur, Delhi", type: "Affiliated", emoji: "🛠️", listings: 98 },
  { name: "VIPS, Pitampura", city: "Pitampura, Delhi", type: "Affiliated", emoji: "🌟", listings: 120 }
];

const BRANCHES = [
  { short: "CSE", full: "Computer Science & Engg.", icon: "💻", color: "#6c47ff", count: 4231 },
  { short: "ECE", full: "Electronics & Comm. Engg.", icon: "📡", color: "#ff6b6b", count: 3198 },
  { short: "ME", full: "Mechanical Engineering", icon: "⚙️", color: "#ffd93d", count: 2876 },
  { short: "CE", full: "Civil Engineering", icon: "🏗️", color: "#6bcb77", count: 1987 },
  { short: "EE", full: "Electrical Engineering", icon: "⚡", color: "#64b4ff", count: 1654 },
  { short: "CH", full: "Chemical Engineering", icon: "🧪", color: "#ff96a0", count: 1243 },
  { short: "BT", full: "Biotechnology", icon: "🧬", color: "#c896ff", count: 876 },
  { short: "IT", full: "Information Technology", icon: "🖥️", color: "#ff966e", count: 2134 },
];

const ITEMS = [
  { emoji: "📐", name: "Mini Drafter Set", branch: "ME", price: 120, orig: 450, condition: "Good", college: "MAIT, Rohini", seller: "Rahul S.", year: "3rd Year" },
  { emoji: "🧮", name: "Casio FX-991ES Plus", branch: "ECE", price: 650, orig: 1200, condition: "Like New", college: "MSIT, Janakpuri", seller: "Priya M.", year: "2nd Year" },
  { emoji: "📏", name: "Drawing Sheet Bundle (A1)", branch: "CE", price: 80, orig: 200, condition: "Used", college: "BPIT, Rohini", seller: "Ankit R.", year: "3rd Year" },
  { emoji: "🥼", name: "Lab Coat (Size M)", branch: "CH", price: 200, orig: 500, condition: "Good", college: "USICT, Dwarka", seller: "Sneha K.", year: "4th Year" },
  { emoji: "📚", name: "Engineering Chemistry Book", branch: "CSE", price: 180, orig: 600, condition: "Good", college: "MAIT, Rohini", seller: "Arjun P.", year: "2nd Year" },
  { emoji: "📓", name: "Graph Paper Practical File", branch: "ME", price: 45, orig: 100, condition: "Used", college: "GTBIT, Rajouri Garden", seller: "Kavya B.", year: "3rd Year" },
  { emoji: "🔬", name: "Physics Lab Manual", branch: "ECE", price: 60, orig: 150, condition: "Good", college: "MSIT, Janakpuri", seller: "Rohit J.", year: "2nd Year" },
  { emoji: "💡", name: "Basic Electronics Kit", branch: "ECE", price: 350, orig: 900, condition: "Good", college: "USICT, Dwarka", seller: "Aisha N.", year: "3rd Year" },
  { emoji: "📐", name: "Drafting Set (Full)", branch: "CE", price: 220, orig: 700, condition: "Like New", college: "BPIT, Rohini", seller: "Manish G.", year: "4th Year" },
  { emoji: "🧪", name: "Chemistry Lab Kit", branch: "CH", price: 500, orig: 1400, condition: "Good", college: "ADGITM, Shastri Park", seller: "Divya S.", year: "3rd Year" },
  { emoji: "⚡", name: "Multimeter (Digital)", branch: "EE", price: 280, orig: 650, condition: "Good", college: "GTBIT, Rajouri Garden", seller: "Vikram R.", year: "3rd Year" },
  { emoji: "🧬", name: "Biochemistry Textbook", branch: "BT", price: 250, orig: 800, condition: "Good", college: "USICT, Dwarka", seller: "Meera T.", year: "2nd Year" },
  { emoji: "💻", name: "Data Structures Book (Cormen)", branch: "CSE", price: 400, orig: 1100, condition: "Like New", college: "VIPS, Pitampura", seller: "Siddharth A.", year: "4th Year" },
  { emoji: "📖", name: "Engg. Mathematics (R.K. Jain)", branch: "IT", price: 220, orig: 550, condition: "Good", college: "ADGITM, Shastri Park", seller: "Nisha M.", year: "3rd Year" },
  { emoji: "⚙️", name: "Thermodynamics Textbook", branch: "ME", price: 300, orig: 750, condition: "Good", college: "MAIT, Rohini", seller: "Harsh P.", year: "4th Year" },
  { emoji: "📏", name: "Vernier Calliper (Steel)", branch: "ME", price: 180, orig: 450, condition: "Good", college: "HMRITM, Hamidpur", seller: "Pooja R.", year: "3rd Year" },
  { emoji: "🔧", name: "Workshop Safety Gloves", branch: "ME", price: 60, orig: 150, condition: "New", college: "HMRITM, Hamidpur", seller: "Suresh K.", year: "2nd Year" },
  { emoji: "📡", name: "Signal Processing Textbook", branch: "ECE", price: 350, orig: 900, condition: "Good", college: "MSIT, Janakpuri", seller: "Anjali V.", year: "4th Year" },
];

/* ═══ PG LISTINGS DATA ═══ */
const PG_LISTINGS = [
  {
    name: "The Luxe Nest",
    location: "Janakpuri, Delhi",
    price: 12000,
    type: "Double Sharing",
    gender: "Boys Only",
    desc: "Recently renovated, fully furnished. 10 mins from metro. Zero brokerage. AC rooms, 24/7 power backup, 3 meals daily.",
    amenities: ["wifi","ac_unit","restaurant","local_laundry_service"],
    amenityLabels: ["High-Speed WiFi","AC Rooms","3 Meals Daily","Laundry"],
    tags: ["Urgent","North Campus"],
    verified: true, spots: 3,
    img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Campus Breeze PG",
    location: "Koramangala, Bengaluru",
    price: 9500,
    type: "Single Room",
    gender: "Girls Only",
    desc: "Peaceful PG near IIIT Bangalore. Homely food, laundry service, 24/7 security. Walking distance to tech park.",
    amenities: ["wifi","wc","restaurant","security"],
    amenityLabels: ["High-Speed WiFi","Attached Bath","Homely Food","24/7 Security"],
    tags: ["Girls Only","Koramangala"],
    verified: true, spots: 1,
    img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Scholar's Den",
    location: "Powai, Mumbai",
    price: 15000,
    type: "Private Room",
    gender: "Co-ed",
    desc: "Premium furnished studio near IIT Bombay. Gym access, high-speed fiber, rooftop terrace. Best value near campus.",
    amenities: ["wifi","fitness_center","ac_unit","local_parking"],
    amenityLabels: ["Fiber Optic","Gym Access","AC Rooms","Parking"],
    tags: ["Premium","Powai"],
    verified: true, spots: 2,
    img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "VIT Villa Residency",
    location: "Vellore, TN",
    price: 7500,
    type: "Triple Sharing",
    gender: "Boys Only",
    desc: "Budget-friendly PG right next to VIT main gate. Mess food available, study rooms, generator backup. Perfect for freshers.",
    amenities: ["wifi","restaurant","power","study"],
    amenityLabels: ["Free WiFi","Mess Food","Power Backup","Study Room"],
    tags: ["Budget Pick","Near VIT Gate"],
    verified: false, spots: 5,
    img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80"
  },
];

/* ═══ STATE ═══ */
let collegesVisible = 8;
let listingsVisible = 8;
let activeCollegeFilter = 'all';
let collegeSearchQuery = '';
let filteredColleges = [...COLLEGES];
let activeCategoryPill = 'all';

/* ═══ INIT ═══ */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initSegmentControl();
  renderColleges();
  renderBranches();
  renderListings();
  renderBentoGrid();
  renderHousingGrid();
  renderHousingTab();
});

/* ─── NAVBAR ─── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  if (loginBtn) loginBtn.addEventListener('click', () => openModal('login'));
  if (signupBtn) signupBtn.addEventListener('click', () => openModal('signup'));
}

/* ─── SEGMENT CONTROL ─── */
function initSegmentControl() {
  const container = document.getElementById('segmentControl');
  const indicator = document.getElementById('segmentIndicator');
  if (!container || !indicator) return;

  const buttons = container.querySelectorAll('.segment-btn');
  const numBtns = buttons.length;

  // Set initial indicator width
  indicator.style.width = `calc(${100 / numBtns}% - 8px)`;

  buttons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      // Update active button styles
      buttons.forEach(b => {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      // Slide indicator
      indicator.style.transform = `translateX(calc(${idx * 100}% + ${idx * 8}px))`;

      // Show/hide content panels
      const targetId = btn.dataset.section;
      document.querySelectorAll('.tab-content').forEach(panel => {
        panel.style.display = 'none';
      });
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.style.display = 'block';
    });
  });
}

/* ─── CATEGORY PILLS FILTER ─── */
function filterByCategory(category, el) {
  activeCategoryPill = category;
  document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  renderBentoGrid();
}

/* ─── BENTO GRID (Hub page mini cards) ─── */
function renderBentoGrid() {
  const grid = document.getElementById('bentoGrid');
  if (!grid) return;

  const catMap = {
    'Textbooks': ['BT','CSE','IT','ECE','ME','CE','EE','CH'],
    'Electronics': ['ECE','EE'],
    'Stationery': ['ME','CE'],
    'Lab Gear': ['CH','BT','ECE'],
    'Clothing': ['CH','BT','ME'],
  };

  let filtered = [...ITEMS];
  if (activeCategoryPill !== 'all' && catMap[activeCategoryPill]) {
    filtered = ITEMS.filter(item => catMap[activeCategoryPill].includes(item.branch));
  }

  const slice = filtered.slice(0, 6);
  const bgColors = {
    CSE: '#1a1040', ECE: '#1a0a14', ME: '#1a1800',
    CE: '#0a1a0a', EE: '#0a1020', CH: '#1a0a10', BT: '#14001a', IT: '#1a1000'
  };

  grid.innerHTML = slice.map((item, i) => {
    const discount = Math.round((1 - item.price / item.orig) * 100);
    return `
      <div class="listing-card-mini" onclick="viewListing(${ITEMS.indexOf(item)})" style="animation: fadeUp 0.4s ease-out ${i * 70}ms both">
        <div class="listing-card-mini-img" style="background:${bgColors[item.branch] || '#0f1320'}">
          <span>${item.emoji}</span>
          <div class="listing-badge-pill">₹${item.price}</div>
          <div class="discount-badge">-${discount}%</div>
        </div>
        <div class="listing-card-mini-body">
          <div class="listing-card-mini-name">${escHtml(item.name)}</div>
          <div class="listing-card-mini-meta">
            <span class="dot-primary"></span>${item.year} · ${item.branch}
          </div>
        </div>
        <div class="listing-card-mini-footer">
          <span class="listing-card-mini-price">₹${item.price}</span>
          <button class="listing-card-mini-cta" onclick="event.stopPropagation();contactSeller('${escHtml(item.seller)}','${escHtml(item.name)}')">Chat</button>
        </div>
      </div>
    `;
  }).join('');
}

/* ─── HOUSING GRID (standalone section) ─── */
function renderHousingGrid() {
  const grid = document.getElementById('housingGrid');
  if (!grid) return;
  grid.innerHTML = PG_LISTINGS.map((pg, i) => buildHousingCard(pg, i)).join('');
}

/* ─── HOUSING TAB (inside segment tab) ─── */
function renderHousingTab() {
  const grid = document.getElementById('housingListings');
  if (!grid) return;
  grid.innerHTML = PG_LISTINGS.map((pg, i) => buildHousingCard(pg, i)).join('');
}

function buildHousingCard(pg, i) {
  return `
    <div class="housing-card" onclick="openPgModal(${i})" style="animation: fadeUp 0.4s ease-out ${i * 80}ms both; margin-bottom: 20px;">
      <div class="housing-card-img">
        <img src="${escHtml(pg.img)}" alt="${escHtml(pg.name)}" loading="lazy" />
        <div class="housing-card-tags">
          <span class="housing-tag urgent">${escHtml(pg.tags[0])}</span>
          <span class="housing-tag location">
            <span class="material-symbols-outlined" style="font-size:12px;vertical-align:middle;">map</span>
            ${escHtml(pg.tags[1] || pg.location.split(',')[0])}
          </span>
        </div>
      </div>
      <div class="housing-card-body">
        <div class="housing-card-top">
          <div class="housing-card-name">${escHtml(pg.name)}</div>
          <div>
            <div class="housing-card-price">₹${pg.price.toLocaleString('en-IN')}<span class="housing-card-price-unit">/mo</span></div>
          </div>
        </div>
        <div class="housing-card-desc">${escHtml(pg.desc)}</div>
        <div class="housing-stats">
          <div class="housing-stat"><span class="material-symbols-outlined">group</span>${escHtml(pg.type)}</div>
          <div class="housing-stat"><span class="material-symbols-outlined">wc</span>${escHtml(pg.gender)}</div>
          <div class="housing-stat"><span class="material-symbols-outlined">wifi</span>WiFi</div>
          ${pg.verified ? `<div class="housing-stat" style="color:var(--primary)"><span class="material-symbols-outlined">verified</span>Verified</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

/* ─── PG DETAIL MODAL ─── */
function openPgModal(index) {
  const pg = PG_LISTINGS[index];
  if (!pg) return;
  const content = document.getElementById('pgModalContent');
  content.innerHTML = `
    <div class="pg-hero-carousel">
      <img src="${escHtml(pg.img)}" alt="${escHtml(pg.name)}" style="width:100%;height:100%;object-fit:cover;" />
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;">
      <div>
        <h2 style="font-family:var(--font-headline);font-size:1.5rem;font-weight:700;color:var(--on-surface);">${escHtml(pg.name)}</h2>
        <div style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--on-surface-variant);margin-top:4px;">
          <span class="material-symbols-outlined" style="font-size:15px;">location_on</span>${escHtml(pg.location)}
        </div>
      </div>
      ${pg.verified ? `<div style="display:flex;align-items:center;gap:4px;padding:4px 12px;border-radius:999px;background:rgba(107,251,154,0.1);border:1px solid rgba(107,251,154,0.25);font-size:0.72rem;font-family:var(--font-headline);font-weight:600;color:var(--primary);"><span class="material-symbols-outlined" style="font-size:14px;">verified</span>Verified PG</div>` : ''}
    </div>
    <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:16px;">
      <span style="font-family:var(--font-headline);font-size:2rem;font-weight:700;color:var(--primary);">₹${pg.price.toLocaleString('en-IN')}</span>
      <span style="font-size:0.875rem;color:var(--on-surface-variant);">/ month</span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
      <span style="background:var(--surface-container);padding:6px 14px;border-radius:999px;font-size:0.78rem;color:var(--on-surface);display:flex;align-items:center;gap:5px;"><span class="material-symbols-outlined" style="font-size:14px;">group</span>${escHtml(pg.type)}</span>
      <span style="background:var(--surface-container);padding:6px 14px;border-radius:999px;font-size:0.78rem;color:var(--on-surface);display:flex;align-items:center;gap:5px;"><span class="material-symbols-outlined" style="font-size:14px;">wc</span>${escHtml(pg.gender)}</span>
      <span style="background:rgba(107,251,154,0.1);color:var(--primary);padding:6px 14px;border-radius:999px;font-size:0.78rem;font-weight:600;">${pg.spots} Spot${pg.spots > 1 ? 's' : ''} Left</span>
    </div>
    <h3 style="font-family:var(--font-headline);font-size:0.95rem;font-weight:600;color:var(--on-surface);margin-bottom:10px;">Premium Amenities</h3>
    <div class="pg-amenities-grid">
      ${pg.amenities.map((icon, idx) => `
        <div class="pg-amenity">
          <span class="material-symbols-outlined">${icon}</span>
          <span>${pg.amenityLabels[idx] || icon}</span>
        </div>`).join('')}
    </div>
    <h3 style="font-family:var(--font-headline);font-size:0.95rem;font-weight:600;color:var(--on-surface);margin:16px 0 8px;">About this place</h3>
    <p style="font-size:0.875rem;color:var(--on-surface-variant);line-height:1.6;margin-bottom:24px;">${escHtml(pg.desc)}</p>
    <button class="btn btn-secondary" style="width:100%;padding:16px;font-size:0.95rem;border-radius:var(--radius-lg);" onclick="showToast('📨 Contact request sent to owner!', 'success');closePgModal()">
      <span class="material-symbols-outlined" style="font-size:18px;">chat_bubble</span>
      Contact Owner
    </button>
  `;
  document.getElementById('pgModalOverlay').classList.add('open');
}

function closePgModal() {
  document.getElementById('pgModalOverlay').classList.remove('open');
}

/* ─── BOTTOM NAV ─── */
function switchBottomNav(section, el) {
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if (section === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    scrollToSection(section);
  }
}

/* ─── SCROLL ─── */
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/* ─── RENDER COLLEGES ─── */
function renderColleges() {
  applyCollegeFilter();
  paintColleges();
}

function applyCollegeFilter() {
  filteredColleges = COLLEGES.filter(c => {
    const typeMatch = activeCollegeFilter === 'all' || c.type === activeCollegeFilter;
    const queryMatch = c.name.toLowerCase().includes(collegeSearchQuery) ||
                       c.city.toLowerCase().includes(collegeSearchQuery);
    return typeMatch && queryMatch;
  });
}

function paintColleges() {
  const grid = document.getElementById('collegeGrid');
  const btn = document.getElementById('showMoreCollegesBtn');
  const slice = filteredColleges.slice(0, collegesVisible);

  grid.innerHTML = slice.map(c => `
    <div class="college-card" onclick="showCollegeModal('${escHtml(c.name)}')">
      <div class="college-logo">${c.emoji}</div>
      <div class="college-info">
        <div class="college-name">${escHtml(c.name)}</div>
        <div class="college-meta">
          <span class="college-tag ${c.type.toLowerCase()}">${c.type}</span>
          <span class="college-tag">${escHtml(c.city)}</span>
        </div>
        <div class="college-listings">📦 ${c.listings} listings</div>
      </div>
    </div>
  `).join('');

  btn.style.display = filteredColleges.length > collegesVisible ? 'block' : 'none';
}

function filterColleges() {
  collegeSearchQuery = document.getElementById('collegeSearch').value.toLowerCase();
  collegesVisible = 8;
  applyCollegeFilter();
  paintColleges();
}

function filterByState(type, el) {
  activeCollegeFilter = type;
  collegesVisible = 8;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  applyCollegeFilter();
  paintColleges();
}

function showMoreColleges() {
  collegesVisible += 8;
  paintColleges();
}

/* ─── RENDER BRANCHES ─── */
function renderBranches() {
  const grid = document.getElementById('branchGrid');
  grid.innerHTML = BRANCHES.map(b => `
    <div class="branch-card" onclick="filterListingsByBranch('${b.short}')" style="--branch-color:${b.color}">
      <div class="branch-icon">${b.icon}</div>
      <div class="branch-name">${b.short}</div>
      <div class="branch-full">${b.full}</div>
      <span class="branch-count">${b.count.toLocaleString()} items</span>
    </div>
  `).join('');
}

function filterListingsByBranch(branch) {
  document.getElementById('branchFilter').value = branch;
  filterListings();
  scrollToSection('listings');
}

/* ─── RENDER LISTINGS ─── */
function renderListings() {
  const branch = document.getElementById('branchFilter').value;
  const priceRange = document.getElementById('priceFilter').value;

  const filtered = ITEMS.filter(item => {
    const branchOk = branch === 'all' || item.branch === branch;
    let priceOk = true;
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      priceOk = item.price >= min && item.price <= max;
    }
    return branchOk && priceOk;
  });

  const grid = document.getElementById('listingsGrid');
  const slice = filtered.slice(0, listingsVisible);

  if (slice.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:60px 0">
      <div style="font-size:3rem;margin-bottom:12px">🔍</div>
      <p>No listings found. Try different filters.</p>
    </div>`;
    return;
  }

  grid.innerHTML = slice.map((item, i) => {
    const discount = Math.round((1 - item.price / item.orig) * 100);
    const bgColors = { CSE: '#1a1040', ECE: '#1a0a14', ME: '#1a1800', CE: '#0a1a0a', EE: '#0a1020', CH: '#1a0a10', BT: '#14001a', IT: '#1a1000' };
    return `
      <div class="listing-card" style="animation-delay:${i * 60}ms" id="listing-${i}">
        <div class="listing-img" style="background:${bgColors[item.branch] || '#0f1320'}">
          ${item.emoji}
          <span class="listing-badge">-${discount}%</span>
        </div>
        <div class="listing-body">
          <div class="listing-branch">${item.branch} · ${item.college.split(' ').slice(0,3).join(' ')}</div>
          <div class="listing-title">${item.name}</div>
          <div class="listing-meta">
            <div>
              <div class="listing-price">₹${item.price}</div>
              <div class="listing-orig">₹${item.orig}</div>
            </div>
            <span style="font-size:0.72rem;color:var(--on-surface-variant);background:var(--surface-container-high);padding:4px 10px;border-radius:999px;font-family:var(--font-headline);font-weight:600;">
              ${item.condition}
            </span>
          </div>
        </div>
        <div class="listing-footer">
          <div class="listing-seller">
            <div class="seller-avatar">${item.seller[0]}</div>
            ${item.seller} · ${item.year}
          </div>
          <span title="Verified Seller" style="color:var(--primary);display:flex;align-items:center;" class="material-symbols-outlined" style="font-size:16px;">verified</span>
        </div>
        <div class="listing-actions">
          <button class="btn btn-primary btn-sm btn-contact" onclick="contactSeller('${escHtml(item.seller)}', '${escHtml(item.name)}')">
            <span class="material-symbols-outlined" style="font-size:14px;">chat_bubble</span> Contact
          </button>
          <button class="btn btn-outline btn-sm" onclick="viewListing(${i})">Details</button>
        </div>
      </div>
    `;
  }).join('');
}

function filterListings() {
  listingsVisible = 8;
  renderListings();
}

function showMoreListings() {
  listingsVisible += 8;
  renderListings();
}

/* ─── MODALS ─── */
function openModal(type) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  if (type === 'sell') {
    content.innerHTML = `
      <h2>📦 Post a Listing</h2>
      <p>List your item for sale to freshers in your college</p>
      <div class="form-row">
        <div class="form-group">
          <label>Your Name</label>
          <input type="text" id="sellerName" placeholder="Rahul Sharma" />
        </div>
        <div class="form-group">
          <label>Year of Study</label>
          <select id="sellerYear">
            <option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>College</label>
        <select id="sellerCollege">
          ${COLLEGES.map(c => `<option>${escHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Branch</label>
          <select id="sellerBranch">
            ${BRANCHES.map(b => `<option value="${b.short}">${b.short} – ${b.full}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Item Category</label>
          <select id="itemCategory">
            <option>Calculator</option><option>Drafter / Drawing Set</option>
            <option>Drawing Sheets</option><option>Lab Coat</option>
            <option>Lab Manual</option><option>Textbook</option>
            <option>Practical File</option><option>Electronics Kit</option>
            <option>Lab Equipment</option><option>Notes / Handouts</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Item Name</label>
        <input type="text" id="itemName" placeholder="e.g. Casio FX-991ES Plus" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Asking Price (₹)</label>
          <input type="number" id="itemPrice" placeholder="500" />
        </div>
        <div class="form-group">
          <label>Original Price (₹)</label>
          <input type="number" id="itemOrig" placeholder="1200" />
        </div>
      </div>
      <div class="form-group">
        <label>Condition</label>
        <select id="itemCondition">
          <option>Like New</option><option>Good</option><option>Used</option><option>Worn</option>
        </select>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="itemDesc" placeholder="Describe the item, any defects, reason for selling..."></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitListing()">Post Listing 🚀</button>
      </div>
    `;
  } else if (type === 'buy') {
    content.innerHTML = `
      <h2>🛍️ Create Buyer Profile</h2>
      <p>Get notified when seniors post items matching your needs</p>
      <div class="form-row">
        <div class="form-group">
          <label>Your Name</label>
          <input type="text" placeholder="Your Name" />
        </div>
        <div class="form-group">
          <label>Batch Year</label>
          <select>
            <option>2024 Batch</option><option>2025 Batch</option><option>2026 Batch</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>College</label>
        <select>
          ${COLLEGES.map(c => `<option>${escHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Branch</label>
        <select>
          ${BRANCHES.map(b => `<option value="${b.short}">${b.short} – ${b.full}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Items Looking For</label>
        <textarea placeholder="e.g. Mini drafter, calculator Casio FX-991, drawing sheets..."></textarea>
      </div>
      <div class="form-group">
        <label>Max Budget (₹)</label>
        <input type="number" placeholder="2000" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="showToast('✅ Buyer profile created! We\'ll notify you.', 'success');closeModal()">Save Profile 🎉</button>
      </div>
    `;
  } else if (type === 'login') {
    content.innerHTML = `
      <h2>👋 Welcome Back</h2>
      <p>Login to your UniThrift account</p>
      <div class="form-group">
        <label>College Email</label>
        <input type="email" placeholder="your@college.edu.in" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" placeholder="••••••••" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="showToast('✅ Logged in!', 'success');closeModal()">Login</button>
      </div>
      <p style="text-align:center;margin-top:16px;color:var(--text3);font-size:0.85rem">
        No account? <a href="#" style="color:var(--primary-light)" onclick="openModal('signup')">Sign Up Free</a>
      </p>
    `;
  } else if (type === 'signup') {
    content.innerHTML = `
      <h2>🎓 Join UniThrift</h2>
      <p>Create your free student account</p>
      <div class="form-row">
        <div class="form-group">
          <label>First Name</label>
          <input type="text" placeholder="Rahul" />
        </div>
        <div class="form-group">
          <label>Last Name</label>
          <input type="text" placeholder="Sharma" />
        </div>
      </div>
      <div class="form-group">
        <label>College Email</label>
        <input type="email" placeholder="rahul@iitb.ac.in" />
      </div>
      <div class="form-group">
        <label>College</label>
        <select>
          ${COLLEGES.map(c => `<option>${escHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Branch</label>
          <select>
            ${BRANCHES.map(b => `<option value="${b.short}">${b.short}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Year</label>
          <select>
            <option>1st Year (Fresher)</option><option>2nd Year</option>
            <option>3rd Year</option><option>4th Year</option><option>5th Year</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" placeholder="Min 8 characters" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="showToast('🎉 Account created! Welcome to UniThrift!', 'success');closeModal()">Sign Up Free 🚀</button>
      </div>
    `;
  }

  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function showCollegeModal(name) {
  const college = COLLEGES.find(c => c.name === name);
  if (!college) return;

  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:3rem;margin-bottom:8px">${college.emoji}</div>
      <h2>${escHtml(college.name)}</h2>
      <p>${escHtml(college.city)}</p>
      <span class="college-tag ${college.type.toLowerCase()}" style="font-size:0.8rem;padding:5px 14px">${college.type}</span>
    </div>
    <div class="detail-row"><span class="detail-label">Total Listings</span><span class="detail-value" style="color:var(--primary-light)">📦 ${college.listings}</span></div>
    <div class="detail-row"><span class="detail-label">Active Sellers</span><span class="detail-value">👤 ${Math.floor(college.listings * 0.4)}</span></div>
    <div class="detail-row"><span class="detail-label">Branches Active</span><span class="detail-value">📚 ${Math.min(8, Math.floor(college.listings / 40))}</span></div>
    <div class="detail-row"><span class="detail-label">Avg. Savings</span><span class="detail-value" style="color:var(--success)">💰 ${Math.floor(50 + Math.random()*20)}%</span></div>
    <div class="modal-actions" style="margin-top:24px">
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="closeModal();scrollToSection('listings')">View Listings →</button>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

function viewListing(index) {
  const item = ITEMS[index];
  if (!item) return;
  const discount = Math.round((1 - item.price / item.orig) * 100);
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div class="listing-detail">
      <div class="listing-detail-img">${item.emoji}</div>
      <h2>${escHtml(item.name)}</h2>
      <p style="color:var(--text3);margin-bottom:20px">Listed by <strong>${escHtml(item.seller)}</strong> · ${item.year} · ${escHtml(item.college)}</p>
      <div class="detail-row"><span class="detail-label">Branch</span><span class="detail-value">${item.branch}</span></div>
      <div class="detail-row"><span class="detail-label">Asking Price</span><span class="detail-value" style="color:var(--success);font-size:1.2rem">₹${item.price}</span></div>
      <div class="detail-row"><span class="detail-label">Original Price</span><span class="detail-value" style="text-decoration:line-through;color:var(--text3)">₹${item.orig}</span></div>
      <div class="detail-row"><span class="detail-label">Discount</span><span class="detail-value" style="color:var(--accent2)">${discount}% OFF</span></div>
      <div class="detail-row"><span class="detail-label">Condition</span><span class="detail-value">${item.condition}</span></div>
      <div class="detail-row"><span class="detail-label">College</span><span class="detail-value">${escHtml(item.college)}</span></div>
      <div class="modal-actions" style="margin-top:24px">
        <button class="btn btn-outline" onclick="closeModal()">Close</button>
        <button class="btn btn-primary" onclick="contactSeller('${escHtml(item.seller)}', '${escHtml(item.name)}');closeModal()">💬 Contact Seller</button>
      </div>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

function contactSeller(seller, item) {
  showToast(`📨 Message sent to ${seller} about "${item}"!`, 'success');
}

function submitListing() {
  const name = document.getElementById('itemName')?.value;
  const price = document.getElementById('itemPrice')?.value;
  if (!name || !price) {
    showToast('❌ Please fill item name and price.', 'error');
    return;
  }
  showToast('🎉 Listing posted successfully!', 'success');
  closeModal();
}

/* ─── TOAST ─── */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ─── HELPERS ─── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
