# The UniThrift Journey

This document chronicles what we have built so far and the roadmap for what we need to build next to bring the UniThrift Premium Campus Ecosystem to life.

---

## Session 7: Flatmates Directory Pivot, Multi-Photo Lightbox, Razorpay ₹39 Contact Unlock & Sunset Cloud Theme (Latest)

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
