# UniThrift Codebase Architecture

This document serves as a guide to the structure of the UniThrift codebase, outlining how files connect, where data is managed, and how different features interact across the platform.

---

## Directory Structure Overview

- **`/` (Root)**: Core gateway portal (`index.html`) and splash screen (`splash.html`).
- **`/auth`**: UniThrift onboarding, authentication, profile setup, and ID verification views.
- **`/marketplace`**: Buying and selling flows, offer review pages, item detail view, and security deposit reservation.
- **`/roommates`**: Simplified flatmate discovery directory board (`flatmates.html`) and requirement creation/editing (`roommate_need_flat.html`).
- **`/pghostels`**: PG and Hostel discovery features.
- **`/unimatch`**: Campus social and dating sub-application with sunset cloud theme, non-scrollable discovery feed, and mutual Instagram exchange flow.
  - **`/unimatch/auth`**: UniMatch auth, verification, and Instagram handle setup.
  - **`/unimatch/profile-setup`**: 5-step UniMatch profile builder (Basic Info, Intents, Interests, Photos, Review).
  - **`/unimatch/profile`**: User profile view and edit screens (`my-profile.html`, `edit-profile.html`).
- **`/core`**: Offers dashboard, activity notifications, meetup status/chat, and general user settings.
- **`/scripts`**: Central JavaScript logic and API helper files (`supabase.js`).
- **`/docs`**: Comprehensive project documentation (`CONTEXT.md`, `JOURNEY.md`, `CODEBASE.md`, `ALGORITHM.md`).
- **`/db`**: Database configuration, schema scripts, and SQL migrations.

---

## Authentication & Backend Connectivity

- **`/scripts/supabase.js`**: The central controller for connecting the frontend UI to our Supabase database.
  - Initializes the Supabase client.
  - Core Auth Helpers: `checkAuth()`, `getProfile()`, `updateProfile()`, `signInWithGoogle()`, `logout()`.
  - Marketplace Offers API: `submitOffer()`, `getReceivedOffers()`, `getSentOffers()`, `updateOfferStatus()`.
  - Roommate Listings API: `getCollegeAreas()`, `createRoommateListing()`, `getUserRoommateListing()`, `getRoommateListings()`, `likeRoommateListing()`, `getAllRoommateListingsAdmin()`.
  - Platform Switcher Helper: `renderPlatformSwitcher(activePlatform)` generating the green shopping bag / burgundy heart dual-segment pill.
  - Global Header Avatar Sync: Auto-syncs `#header-avatar` across all pages with user avatar URL.

---

## Database Schemas & Migrations (`/db`)

- **`/db/supabase_setup.sql`**: Master SQL script defining core `profiles` and `products` tables with RLS policies.
- **`/db/offers_migration.sql`**: Schema definitions and RLS policies for the `offers` table.
- **`/db/reservation_chat_setup.sql`**: Tables for `reservations` and `meetups` handling deposit status and meetup negotiation states.
- **`/db/roommate_images_migration.sql`**: Configures `images` (array) and `amenities` (array) columns on `roommate_listings`, plus the `roommate_images` storage bucket.
- **`/db/roommate_two_sided_migration.sql`**: Adds `listing_type` (`have_flat` vs `need_flat`) and `rent` columns to `roommate_listings`.
- **`/db/roommate_likes_migration.sql`**: Schema for `roommate_likes` swiping engine and `roommate_matches` tables.
- **`/db/unimatch_setup.sql`**: Schema extending `profiles` with `gender`, `preferred_gender`, `instagram_username`, `bio`, `looking_for` (JSON), `interests` (JSON), `profile_photos` (JSON), and `unimatch_profile_complete`.

---

## The Onboarding & Gateway Journey

### 1. Gateway Portal (`/index.html`)
- Serves as the primary entry point choice screen between **UniThrift** and **UniMatch**.
- **Session-Aware Navigation:** For authenticated users, card clicks dynamically route directly to `/marketplace/marketplace.html` or `/unimatch/discover.html` (preventing bounce loops back to login). Displays greeting (`Hi, <name>`) and Sign Out button.

### 2. UniThrift Onboarding (`/auth/`)
- **`/auth/login.html`**: Dual-mode (Sign In / Sign Up) interface supporting Email/Password and Google OAuth.
- **`/auth/profile_setup.html`**: Collects `full_name`, `phone_number`, `year_of_study`, `college`, and requires mandatory avatar cropping via **Cropper.js**.
- **`/auth/id_verification.html`**: Student ID upload gate marking `is_verified = true`.

### 3. UniMatch Onboarding (`/unimatch/auth/` & `/unimatch/profile-setup/`)
- Linear onboarding flow: ID Verification (`verify.html`) -> Instagram Handle (`instagram.html`) -> 5-Step Profile Builder (`basic-info.html`, `looking-for.html`, `interests.html`, `photos.html`, `review.html`).

---

## Core Feature Modules

### 1. Simplified Flatmates Directory & Razorpay ₹39 Contact Unlock (`/roommates/flatmates.html`)
- **Category Tabs:** Filter between `All Listings`, `Rooms Available 🏠`, and `Seeking Room 🔍`.
- **Live Search & Location Filter:** Client-side search filtering titles, preferred areas, bio text, and college majors.
- **Multi-Photo Carousel & Lightbox:** Interactive photo slider with prev/next arrows, thumbnail strip, and fullscreen Lightbox modal (`object-contain`).
- **Razorpay ₹39 Contact Unlock:** Public view displays photos, price, location, and amenities chips. Host profile name/avatar, description, and contact buttons are blurred until user unlocks for ₹39 via **Razorpay Checkout SDK** (`https://checkout.razorpay.com/v1/checkout.js`). Unlocked IDs are stored in `localStorage` (`unithrift_unlocked_flatmates`). Supports `?reset=true` parameter for re-testing.

### 2. UniMatch Discovery Feed & Theme System (`/unimatch/`)
- **Theme Palette (`unimatch/unimatch-theme.css`):** Soft HSL sunset gradient (`#F9DBD5`, `#F2C4B8`, `#E09898`, `#C8A8B8`) with frosted glass UI tokens.
- **Drifting Cloud SVG Animation (`unimatch/clouds-init.js`):** Auto-injecting drifting cloud layer across UniMatch views (excluding hero photos).
- **Non-Scrollable Viewport (`unimatch/discover.html`):** Fixed positioning between `top: 64px` header and `bottom: 64px` bottom nav (`100dvh`, `overflow: hidden`).
- **Feed Algorithm (`ALGORITHM.md`):** Ranks candidate student profiles based on shared interest tag counts while filtering out self and non-preferred genders.
- **Mutual Instagram Exchange (`insta-exchange-request.html`, `connection-success.html`):** Mutual consent protocol for sharing Instagram handles with direct deep-linking (`instagram://user?...`).

### 3. Marketplace & Offers Engine (`/marketplace/`)
- **`/marketplace/marketplace.html`**: Primary product browsing feed with category chips and search.
- **`/marketplace/item.html`**: Product details page with 25% Security Deposit reservation modal calling Razorpay Edge Function (`/functions/v1/create-razorpay-order`).
- **`/core/offers.html` & `/marketplace/offer_received.html`**: Offers review dashboard with Accept, Counter, and Reject actions.
- **`/core/chat.html`**: Meetup Negotiation dashboard for location/time proposals and confirmed phone number reveals.

---

## Technical Guidelines & UI Rules
- **Typography:** Geist font family across UniThrift; Dancing Script + DM Sans across UniMatch.
- **Iconography:** Material Symbols Outlined (`font-variation-settings: 'FILL' 1` for active state icons).
- **Viewport Layouts:** Maintain explicit `position: fixed` and `z-index: 50` on headers/navbars without applying `position: relative` globally to `body > *`.
- **Photo Modals:** Use uncropped lightbox containers (`object-contain`) to prevent cutting off student heads or room ceilings.
