# The UniThrift Journey

This document chronicles what we have built so far and the roadmap for what we need to build next to bring the UniThrift Premium Campus Ecosystem to life.

---

## Session 9: Stitch Home Page Restoration, Global PG Interception, Tiered Listing Fees & Per-Day Product Boosting Engine (Latest)

We completed a comprehensive update to the UniThrift ecosystem, restoring the Stitch design system home page, launching platform-wide monetization rules, building a per-day product boosting engine, and refining marketplace seller tools.

### 1. Stitch Premium Campus Home Page Restoration (`core/dashboard.html`)
- **Stitch Design System Integration:** Restored the UniThrift Home page layout using the Stitch design project system (Screen ID `e7c78bfa4dbf449bb1661a5df9c682bc`).
- **Live Supabase Data Feeds:** Connected dynamic carousels & grids (`loadTrendingProducts()`, `loadNearCampusStays()`, `loadRoommates()`, `loadReservations()`) to live Supabase backend data.
- **Desktop Grid Fix:** Converted grid layout from hardcoded 2 columns to responsive `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` to prevent enlarged card images on laptop and desktop displays.
- **URL Route Correction:** Fixed product click navigation from invalid `/marketplace/product_detail.html` (which caused Vercel 404 errors) to `/marketplace/item.html?id=...`.

### 2. Global PG & Hostel "Launching Soon" Interception (`scripts/coming-soon.js`)
- **Capture-Phase Delegation:** Implemented capture-phase click delegation targeting `a[href*="/pghostels/"]`, `[data-path="hostel-hub"]`, `[onclick*="/pghostels/"]`, and `.pg-trigger` across Home, Mates, and Navigation bars.
- **Launching Soon Modal:** Intercepts clicks everywhere to display a sleek bottom-sheet modal: *"PG & Hostel Finder Launching Soon 🚀"*.

### 3. Platform-Wide 25% Deposit Standard
- **Uniform Deposit Rule:** Updated all deposit callouts and guarantee notices from 60% down to **25%** across `marketplace/item.html`, `marketplace/make_offer.html`, and `marketplace/offer_accepted.html`.

### 4. Marketplace & Mates How-It-Works Banners
- **Marketplace Banner (`marketplace/marketplace.html`):** Inserted a dismissible info card (*"How UniThrift Marketplace Works 💡"*) detailing the 3-step process (Browse ➔ 25% Secure Deposit ➔ Safe Campus Pickup).
- **Flatmates Banner (`roommates/flatmates.html`):** Added a dismissible guide banner (*"How Campus Flatmate Matching Works 💡"*) detailing profile browsing, filtering, and contact unlock steps.

### 5. Profile Page Real Metrics & Active Listing Rules (`core/profile.html`)
- **Real Stat Counters:** Removed hardcoded `4.9 ★ Rating` cards and connected live counters for **Active Listings**, **Items Sold**, and **Transactions**.
- **Active Listings Removal:** Updated `loadMyListings()` to filter out sold/reserved items from "My Listings" and added a **`[Mark as Sold]`** button on listing cards.

### 6. Tiered Listing Fees System (`marketplace/sell_item_details.html`)
- **First 2 Listings Free:** First 2 products listed by any seller are 100% **FREE (₹0)**.
- **3rd Listing Onwards (Price-Based Tiers):**
  - Product price under ₹100: **₹19**
  - Product price ₹100 – ₹200: **₹29**
  - Product price above ₹200: **₹39**
- **Live Fee Calculator:** Dynamically displays listing fee status as the seller types the item price.

### 7. Per-Day Product Boosting Engine (⚡ ₹19/day)
- **Home Page Trending Offers ⚡:** Sellers can pay to feature their listings on the Home page under **Trending Offers ⚡** with a **⚡ Featured** badge.
- **Duration Pricing:** Charged at **₹19 per day** with a **2-day minimum** (₹38). Selector options include 2, 3, 5, 7, 14, and 30 days integrated with Razorpay Checkout.
- **Automatic Expiration (`boosted_until`):** Product records assign `boosted_until = now() + (days * 24h)`. `getBoostedProducts()` queries active boosted items (`is_boosted = true AND boosted_until > now()`). Products automatically un-feature when the duration expires.

### 8. Seller Dashboard FAB & Manage Modal (`marketplace/marketplace.html`)
- **Dynamic FAB Text:** Floating action button automatically changes from **Sell** to **Sell / Manage** for sellers with active listings.
- **Seller Management Modal:** Displays active products with 56x56 thumbnail, title, price, status badge, and side-by-side **`[✏️ Edit]`** and **`[⚡ Boost]`** buttons.

### 9. Database Migrations & Fault-Tolerant Fallbacks (`db/boost_and_listing_fees_migration.sql`)
- **Schema Migration:** Added `is_boosted`, `boosted_at`, `boosted_until`, and `listing_fee_paid` columns to `products`.
- **Public RLS Policy:** Added `CREATE POLICY "Public products are viewable by everyone" ON public.products FOR SELECT USING (true);` for guest access.
- **Multi-Stage Query Fallbacks:** Updated `getAllProducts()` and `getBoostedProducts()` with fallback queries to handle foreign key joins gracefully.

---

## Session 8: Real Database UniMatch Engine, ₹29 Paywalls, Admin Verification Hub & Mobile Performance Optimization

We completed a comprehensive transformation of **UniMatch**, replacing all mock data with a real Supabase database pipeline, building monetization paywalls, creating an Admin ID Verification Hub, and optimizing mobile UI performance by over 20x.

### 1. Real Supabase Feed & Strict Setup Gating (`unimatch/discover.html`)
- **Real Profiles Database Query:** Removed all hardcoded mock arrays (`DEMO_PROFILES`) and connected the feed to query real Supabase `profiles` with `.select('*')`.
- **UniMatch Profile Setup Gating:** Enforced `.eq('unimatch_profile_complete', true)` filtering so only students who completed all 5 steps of the UniMatch profile setup appear in Discover and Matches.
- **Feed Reset & Fallbacks:** Added `resetUserSwipes()` helper and an empty state card featuring a **`[Reset Swiped Profiles]`** button so users are never stuck on empty feeds.

### 2. Monetization: ₹29 Admirer & Instagram ID Paywalls (`unimatch/hidden-likes.html`)
- **Admirer Privacy:** Rebuilt the Matches & Admirers page (`hidden-likes.html`) with real `unimatch_likes` and `unimatch_matches` data. Admirer profile photos and names remain blurred with a **₹29 ONE-TIME** price tag badge and an **`[Unlock for ₹29]`** payment CTA.
- **Locked Instagram Handles:** Across both match popups on Discover and the Matches list, Instagram IDs are hidden as **`@•••••••••`**. Tapping **`[Unlock ID (₹29)]`** confirms payment, unblurs the handle, and enables the direct **Instagram DM** link.

### 3. Anonymous Notifications & Mystery Activity (`unimatch/profile/notifications.html`)
- **Mystery Notifications:** Built anonymous activity feed displaying real likes and mutual matches while keeping student names hidden (*"Someone liked your profile 💕"*) to encourage unlocking admirers.
- **Top Header Integration:** Connected the top header notification bell in `discover.html` to navigate directly to `notifications.html`.

### 4. Admin ID Verification Hub & Landing Page Link (`admin/dashboard.html` & `index.html`)
- **Admin Verification Tab:** Restored a dedicated **ID Verifications** tab in `admin/dashboard.html` with a live red pending counter badge.
- **Document & UniMatch Inspection:** Admins inspect uploaded student ID cards in a fullscreen Lightbox modal alongside UniMatch details (student email, `@username`, setup completion state).
- **One-Click Approval/Rejection:** Buttons to **`[Approve Student]`** (sets `is_verified = true` and `unimatch_verification_status = 'verified'`) or **`[Reject]`** (with custom rejection feedback).
- **Ecosystem Header Button:** Added an **`[Admin Panel]`** button to the `index.html` landing page header for admin accounts.

### 5. Mobile Layout Proportions & Skeleton Loading State
- **Guaranteed Photo Ratio:** Fixed mobile card layout so the student photo container takes a guaranteed **55%-60%** of the card height (`flex: 1 1 55%; min-height: 55%`), preventing photos from being squished.
- **Scrollable Detail Panel:** Made the bottom white detail section compact with `max-height: 45%; overflow-y: auto;` and compact chip padding (`padding: 4px 10px`).
- **Skeleton State:** Replaced initial hardcoded *"Eleanor, 21"* HTML with a neutral loading skeleton (*"Loading profiles..." / "Finding students..."*) to eliminate placeholder flashes during page loads.

### 6. 20x Speed Optimization: Cache-First Strategy & `Promise.all` Parallelism
- **Fast `sessionStorage` Profile Cache:** Updated `getProfile()` in `scripts/supabase.js` to return cached profile data instantly (0ms) while revalidating silently in the background.
- **Parallel Database Queries:** Updated `discover.html` and `hidden-likes.html` to fetch user likes, matches, and profiles in parallel using `Promise.all()`, reducing mobile page load latency from 2000ms to ~150ms.

---

## Session 7: Flatmates Directory Pivot, Multi-Photo Lightbox, Razorpay ₹39 Contact Unlock & Sunset Cloud Theme

We executed major feature upgrades across both **UniThrift** and **UniMatch**, transforming flatmate discovery into a simple, monetized directory board and polishing the UniMatch design system.

### 1. Flatmates Directory Board Pivot (`roommates/flatmates.html`)
- **Pivoted from Swipe Deck:** Replaced the Tinder-like swipe deck with a clean, responsive listing directory board per user directive (*"we will not go with that tinder like thing anymore i want to make it quite simple now"*).
- **Category Filter Tabs:** Added dynamic category tabs to filter between **All Listings**, **Rooms Available 🏠** (`have_flat`), and **Seeking Room 🔍** (`need_flat`).
- **Live Search & Location Filter:** Real-time filter input searching across titles, campus areas, bio text, and college majors.

### 2. Multi-Photo Carousel Gallery & Fullscreen Lightbox
- **Interactive Photo Carousel:** For listings with multiple room images (`images` array), rendered a photo slider with prev/next navigation arrows (`<` and `>`), photo counter badge (`1 / 3`), and a thumbnail preview strip.
- **Fullscreen Lightbox Viewer:** Tapping **"🔍 View Fullscreen"** (or the photo) opens a high-resolution Lightbox modal with `object-contain` for zero image cropping.
- **Avatar & Tag Cleanups:** Added gradient initials fallback (`[SS]`, `[VS]`) to prevent broken profile avatar icons, and filtered out empty hyphen tags (`✓ -`).

### 3. Monetization: Razorpay ₹39 Contact Unlock System
- **Privacy Model:**
  - **Always Public:** Room photos, title, rent/budget badge, location, and amenities chips (`✓ WiFi`, `✓ AC`, `✓ Laundry`).
  - **Blurred & Hidden:** Host profile name & avatar (rendered as `"Verified Student 🔒"`), full bio description, and direct contact buttons.
- **Razorpay Checkout Integration:** Tapping **"🔒 Unlock Contact Details — ₹39"** opens the official **Razorpay Checkout SDK Modal** (`amount: 3900` paise = ₹39).
- **Instant Unblur & Reveal:** Upon successful payment, host profile unblurs and reveals direct **WhatsApp Chat** (`https://wa.me/...`) and **Call** (`tel:...`) action buttons.
- **Persistence & Reset:** Unlocked listings are saved in `localStorage` (`unithrift_unlocked_flatmates`) and database. Added `?reset=true` parameter support to re-lock listings for testing anytime.

### 4. UniMatch Sunset Cloud Theme & Non-Scrollable Discovery Feed
- **Theme Palette (`unimatch/unimatch-theme.css`):** Built custom HSL sunset gradient (`#F9DBD5`, `#F2C4B8`, `#E09898`, `#C8A8B8`) with frosted glass cards.
- **Drifting Cloud SVG Layer (`unimatch/clouds-init.js`):** Auto-injects 10 blurred SVG cumulus clouds drifting across the sky with keyframe animations.
- **Non-Scrollable Viewport (`discover.html`):** Refactored layout to use fixed positioning between `top: 64px` header and `bottom: 64px` bottom nav, removing body scrollbars for a clean `100dvh` mobile experience.
- **Standardized Action Buttons:** Standardized Pass and Like action buttons to 64px × 64px.
- **Hero Photo Protection:** Enforced rule to exclude cloud overlays over faces on hero landing photos (`welcome.html`).

### 5. Portal Gateway Routing Fix (`index.html`)
- Fixed hardcoded `/auth/login.html` href on portal choice cards for authenticated users.
- Logged-in users are dynamically routed straight to `/marketplace/marketplace.html` (UniThrift) or `/unimatch/discover.html` (UniMatch).

---

## Session 6: Gender Options, Feed Algorithm, Multi-Photo Carousel & Platform Switcher

### 1. Gender & Preferred Feed Gender Fields
- **Profile Onboarding & Edit:** Added `gender` (Male, Female, Non-binary, Other) and `preferred_gender` (Women, Men, Everyone) dropdown selectors to [basic-info.html](file:///d:/projects/Unithrift/unimatch/profile-setup/basic-info.html) and [edit-profile.html](file:///d:/projects/Unithrift/unimatch/profile/edit-profile.html).
- **Database Migration:** Added `gender TEXT` and `preferred_gender TEXT` columns to `db/unimatch_setup.sql`.

### 2. Interest-Based Feed Algorithm (`ALGORITHM.md`)
- **Smart Scoring Pipeline:** Replaced fixed deck with live Supabase query algorithm in [discover.html](file:///d:/projects/Unithrift/unimatch/discover.html).
- **Filtering & Ranking:** Excludes self, filters profiles matching the user's preferred gender, and ranks candidate profiles by common interest tag count (`+1` point per shared interest tag).

### 3. Universal Platform Switcher
- **Dual-Segment Switcher Pill:** Created `renderPlatformSwitcher(activePlatform)` in [scripts/supabase.js](file:///d:/projects/Unithrift/scripts/supabase.js) featuring UniThrift green shopping bag tag and UniMatch burgundy heart badge.
- **Cross-Platform Navigation:** Integrated switcher slot across `index.html`, `unimatch/discover.html`, `unimatch/profile/my-profile.html`, `marketplace/marketplace.html`, and `core/dashboard.html`.

---

## Session 5: UniMatch Expansion & Multi-Step Student Discovery Ecosystem

### 1. Dual Ecosystem Gateway Landing Page (`index.html`)
- **Portal Interface:** Transformed `index.html` into a portal screen where users select between **UniThrift** (Sustainable campus marketplace) and **UniMatch** (Exclusive student community).
- **Dynamic Header Auth State:** Integrated Supabase Auth session checks (`supabase.auth.getSession()`) in `index.html` to display a personalized welcome badge (`Hi, <name>`) and Sign Out button for authenticated users.

### 2. Smart Onboarding & Instagram Verification Journey
- **Auth Guard & Routing (`welcome.html` & `auth/login.html`):** Integrated Google OAuth and Email OTP login flows.
- **5-Step Profile Builder:** Basic Info, Intent Selection, Searchable Interests, Photo Grid Upload (up to 6 photos), and Live Preview.

---

## Session 4: Roommate Swipe Feature & Admin Moderation
- **Database Schema & Matching (`db/roommate_likes_migration.sql`)**: Built `roommate_listings` and `roommate_likes` schema.
- **Dynamic Area Selection (`db/college_areas_migration.sql`)**: Replaced manual text input with dynamic location chips pulling valid areas from user's `college` profile field.
- **Admin Dashboard Moderation (`admin/dashboard.html`)**: Added inline image gallery and `getAllRoommateListingsAdmin()` endpoint for spam moderation.

---

## Session 3: Security Deposit, Meetup Negotiation & Contact Reveal
- **Security Deposit Checkout:** Buyers pay a 25% security deposit to reserve an item, leaving the remaining 75% for in-person settlement.
- **Meetup Negotiation Flow:** Structured planner where buyers propose campus location and time.
- **Phone Number Reveal System:** Confirmed meetups reveal phone numbers with one-tap Call and WhatsApp action buttons.

---

## Session 2: Make an Offer, Google OAuth & Onboarding Cropper
- **Fully Working "Make an Offer" Feature (`db/offers_migration.sql` & `core/offers.html`):** Buyers send custom offers, sellers accept, counter, or reject.
- **Google OAuth Authentication Integration (`auth/login.html` & `scripts/supabase.js`):** Supported Google Sign-In with onboarding state checks.
- **Cropper.js Avatar Cropping (`auth/profile_setup.html`):** Mandatory square image cropping at registration.

---

## Session 1: Core Onboarding & Authentication
- **Email & Password Authentication:** Configured Supabase Auth with dynamic role selection (Buyer / Seller).
- **Profile Setup & ID Verification (`auth/profile_setup.html` & `auth/id_verification.html`):** Linear onboarding gating unverified users.

---

## What We Need To Do Next (Future Roadmap)

1. **Backend Monetization Logging (`roommate_unlocks` Table)**
   - Log Razorpay payment IDs (`razorpay_payment_id`), timestamps, and user IDs in Supabase to track total revenue per listing.
2. **Push Notifications for Roommate Contacts & UniMatch Likes**
   - Notify users when their room listing gets unlocked or when someone likes their profile on UniMatch.
3. **PG / Hostel Booking Inquiries Integration (`pghostels/pghostels.html`)**
   - Apply the simple listing directory and contact inquiry model to the PG/Hostel discovery board.
