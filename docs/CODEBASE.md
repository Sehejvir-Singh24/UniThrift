# UniThrift Codebase Architecture

This document serves as the authoritative guide to the structure of the UniThrift codebase, outlining how files connect, where data is managed, how authentication & onboarding routing function, and how every module operates across the platform.

---

## Directory Structure & File Map

- **`/` (Root)**
  - `index.html`: Dual-ecosystem gateway portal. Sessions checks route logged-in users directly to `/marketplace/marketplace.html` or `/unimatch/discover.html`.
  - `splash.html`: Animated brand entry screen.

- **`/auth` (UniThrift Authentication & Onboarding)**
  - `login.html`: Dual-mode (Sign In / Sign Up) authentication supporting Email/Password and Google OAuth (`signInWithGoogle`). Features Role Selector (Buyer / Seller) for new account sign-ups.
  - `profile_setup.html`: Step 2 onboarding collecting `full_name`, `phone_number`, `year_of_study`, `college`, and `enrollment_number` (optional for 1st-year students). Integrates **Cropper.js** for mandatory square avatar cropping before registration.
  - `id_verification.html`: Step 3 onboarding for uploading student ID cards. Updates `is_verified = true` in Supabase.
  - `pending_verification.html`: Waiting room screen while ID verification is processed.

- **`/marketplace` (UniThrift Marketplace & Transactions)**
  - `marketplace.html`: Primary product browsing grid with category filter chips, search, dismissible *"How UniThrift Marketplace Works 💡"* banner, dynamic **Sell / Manage FAB button**, and Seller Dashboard modal for boosting/editing active listings.
  - `item.html`: Product details page with a **25% Security Deposit** reservation flow through PayU Hosted Checkout.
  - `sell_item_details.html`: Form for posting items with live **Tiered Listing Fee Calculator** (First 2 free, 3rd+ listing fees ₹19/₹29/₹39) and **Per-Day Product Boosting Selector** (₹19/day, min 2 days).
  - `offer_received.html`: Dedicated seller processing screen for a received offer, enabling Accept, Reject, or Counter-offer.

- **`/roommates` (Campus Flatmates Directory)**
  - `flatmates.html`: Simplified flatmate directory board with category tabs (`All`, `Rooms Available 🏠`, `Seeking Room 🔍`), live location search, dismissible *"How Campus Flatmate Matching Works 💡"* banner, multi-photo carousel with fullscreen Lightbox viewer (`object-contain`), avatar initials fallbacks, and **PayU ₹39 Contact Unlock System**.
  - `roommate_need_flat.html`: Listing creation and editing form with intelligent edit-mode pre-filling and dynamic area chips from user's `college` profile field.
  - `matches.html`: Flatmate matches and unlocks overview.

- **`/pghostels` (PG & Hostel Discovery)**
  - `pghostels.html`: PG and Hostel directory search and filter board (Intercepted globally by `coming-soon.js` to present the *"PG & Hostel Finder Launching Soon 🚀"* bottom sheet modal).
  - `pg_detail.html`: Detailed view for PG & Hostel accommodations with room amenities and booking inquiry forms.

- **`/unimatch` (Campus Social & Dating Ecosystem)**
  - `index.html`: Unified landing screen with interactive hero showcase, trust badges, features & FAQs, and automated auth-routing script.
  - `discover.html`: Primary full-screen discovery feed querying real database profiles (`unimatch_profile_complete = true`) with parallel `Promise.all` queries, free mutual-match Instagram sharing, mobile-proportioned cards (guaranteed 55% photo height), and neutral skeleton loading state.
  - `icebreaker.html`: Bento grid selector featuring mini Q&A prompts (Coffee Match, Music Vibes, Food Debate, Watchlist, Campus Lore) required before Instagram handle exchanges.
  - `insta-exchange-request.html` & `insta-exchange-success.html`: Privacy-first mutual agreement protocol for sharing Instagram handles.
  - `connection-success.html`: Celebratory match notification view with direct Instagram deep-linking (`instagram://user?...`).
  - `hidden-likes.html`: Free Admirers & Mutual Matches directory for verified students. Instagram handles are shared only after a mutual match.
  - `out-of-likes.html`: Daily swipe limit screen with return countdown timer.
  - `unimatch-theme.css`: UniMatch CSS token system (`--um-bg-gradient`, `--um-primary`, `--um-card`, HSL sunset palette `#F9DBD5`, `#F2C4B8`, `#E09898`, `#C8A8B8`).
  - `clouds-init.js`: Auto-injecting drifting SVG cumulus cloud animation layer.

- **`/unimatch/auth` (UniMatch Onboarding Subfolder)**
  - `login.html`: UniMatch auth gate supporting Google OAuth and Email OTP.
  - `verify.html`: Student ID Verification gate enforcement for UniMatch with Base64 DataURL fallback for RLS policies.
  - `instagram.html`: Step 2 onboarding requiring Instagram handle input (`@username`).
  - `verified.html` & `pending.html`: Verification status confirmation views.

- **`/unimatch/profile-setup` (5-Step UniMatch Profile Builder)**
  - `basic-info.html`: Step 1 - Full Name, Gender, Preferred Feed Gender, Major, Year of Study, and 150-char Bio.
  - `looking-for.html`: Step 2 - Intent cards (Friends, Coffee Buddy, Study Partner, Event Buddy, Dating).
  - `interests.html`: Step 3 - Searchable interest chips (Academic, Lifestyle, Hobbies, Tech & Culture).
  - `photos.html`: Step 4 - Photo grid supporting 1 to 6 photos uploaded to `profile_photos` bucket.
  - `review.html`: Step 5 - Interactive profile card preview before setting `unimatch_profile_complete = true`.

- **`/unimatch/profile` (Profile Views & Management)**
  - `my-profile.html`: User's own social profile dashboard.
  - `edit-profile.html`: Profile editing interface for bio, gender preferences, interests, and photos.
  - `notifications.html`: Anonymous activity feed displaying real student likes and mutual matches.

- **`/core` (General User Features & Negotiations)**
  - `dashboard.html`: Stitch Premium Campus Ecosystem home screen featuring dynamic carousels, live Supabase feeds (`loadTrendingProducts()`, `loadNearCampusStays()`, `loadRoommates()`, `loadReservations()`), and desktop-responsive grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4`).
  - `offers.html`: Central Offers Dashboard with tabbed panels for **Offers Received** and **Offers Sent**.
  - `chat.html`: Meetup Status & Negotiation dashboard for proposing campus meetup location/time and revealing confirmed phone numbers.
  - `activity.html`: Notifications feed for accepted offers, meetup updates, and match alerts.
  - `profile.html`: General user profile management displaying live counters (Active, Items Sold, Transacts), active listing removal on sale, and **⚡ Boost Listing (₹19/day)** action buttons.

- **`/admin` (Moderation Hub)**
  - `dashboard.html`: Admin moderation panel featuring **ID Verifications Tab** (live pending counter badge, fullscreen ID card lightbox inspection, UniMatch details, one-click Approve/Reject handlers), Marketplace listings, Flatmate postings, PG/Hostels, and Registered Users.

- **`/scripts` (JavaScript API Brain)**
  - `coming-soon.js`: Global capture-phase click delegation script intercepting all PG/Hostel clicks across pages to present the *"PG & Hostel Finder Launching Soon 🚀"* bottom sheet modal.
  - `supabase.js`: Central controller initializing Supabase client and exposing helper functions:
    - Auth: `checkAuth()`, `getProfile()` (fast cache-first `sessionStorage` profile retrieval with background revalidation), `updateProfile()`, `signInWithGoogle()`, `logout()`.
    - Products & Boosting: `getAllProducts()` (with fallback to `select('*')`), `getBoostedProducts()` (queries `is_boosted = true AND boosted_until > now()`), `boostProductListing(id, days)` (calculates `boosted_until` timestamp), `calculateListingFeeForUser(userId, price)`.
    - Verification Admin: `getPendingVerifications()`, `approveVerification()`, `rejectVerification()`.
    - Offers: `submitOffer()`, `getReceivedOffers()`, `getSentOffers()`, `updateOfferStatus()`.
    - Roommates: `getCollegeAreas()`, `createRoommateListing()`, `getUserRoommateListing()`, `getRoommateListings()`, `likeRoommateListing()`, `getAllRoommateListingsAdmin()`.
    - Platform Switcher: `renderPlatformSwitcher(activePlatform)` generating the green shopping bag / burgundy heart dual-segment pill.
    - Global Avatar Sync: Listens on DOM load to sync `#header-avatar` across all pages.

- **`/db` (Database Schema Scripts & Migrations)**
  - `supabase_setup.sql`: Master definitions for `profiles` and `products` tables with RLS policies.
  - `boost_and_listing_fees_migration.sql`: Schema migration adding `is_boosted`, `boosted_at`, `boosted_until`, and `listing_fee_paid` columns to `products`, index `idx_products_boosted`, and public SELECT RLS policy.
  - `admin_product_boost_migration.sql`: Adds the admin-only RPC used by the dashboard to boost or unboost marketplace products for a chosen duration.
  - `offers_migration.sql`: Schema and RLS policies for `offers` table.
  - `reservation_chat_setup.sql`: Tables for `reservations` and `meetups` tracking deposit checkout and meetup negotiation state machine.
  - `roommate_images_migration.sql`: Adds `images` (array) and `amenities` (array) to `roommate_listings` and sets up `roommate_images` storage bucket.
  - `roommate_two_sided_migration.sql`: Adds `listing_type` (`have_flat` vs `need_flat`) and `rent` columns to `roommate_listings`.
  - `roommate_likes_migration.sql`: Schema for `roommate_likes` swiping engine and `roommate_matches` interaction state.
  - `unimatch_setup.sql`: Extends `profiles` schema with `gender`, `preferred_gender`, `instagram_username`, `bio`, `looking_for` (JSON), `interests` (JSON), `profile_photos` (JSON), and `unimatch_profile_complete`.

---

## Technical Standards & Behavioral Guidelines

1. **Mobile Layout Integrity:** Never apply global `min-height` calculations or global `position: relative` to `body > *` as it breaks `position: fixed` headers and navigation bars.
2. **PostgREST Joins:** Always disambiguate foreign key joins on `profiles` (e.g., `profiles!seller_id(full_name)` or `profiles!user_id(...)`) to prevent API errors.
3. **Photo Viewers:** Always use uncropped Lightbox containers (`object-contain`) for photo viewing so student heads or room ceilings are never clipped.
4. **Monetization Privacy:** On `flatmates.html`, public details (photos, rent, location, amenities chips) are always visible; contact details (name, avatar, description, call/chat buttons) are blurred until a verified **PayU Hosted Checkout** payment completes.
