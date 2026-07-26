# UniThrift Codebase Architecture

This document serves as a guide to the current structure of the UniThrift codebase, outlining how the different files connect and where data is managed. The codebase has been organized into logical folders for a clearer development workflow and easier deployment on Netlify.

## Directory Structure Overview

- **`/` (Root)**: Core dashboard entry points (`index.html`, `splash.html`).
- **`/auth`**: All authentication, onboarding, and verification views.
- **`/marketplace`**: Core buying and selling flows, offer review pages, and item listings.
- **`/roommates`**: Flatmate finding features.
- **`/pghostels`**: PG and Hostel discovery features.
- **`/core`**: General user pages like pricing, offers dashboard, and user profiles. Includes `/core/chat.html` for Meetup Negotiation and Phone Number Reveal.
- **`/scripts`**: JavaScript logic files.
- **`/docs`**: Documentation and specs (including this file).
- **`/db`**: Database configuration, schema scripts, and SQL migrations.

## Authentication & Backend Connectivity
- **`/scripts/supabase.js`**: The central brain for connecting the frontend UI to our Supabase database. 
  - Initializes the Supabase client.
  - Contains helper functions like `requireAuth()`, `requireVerifiedSeller()`, `getProfile()`, `updateProfile()`, `signInWithGoogle()`, and `logout()`.
  - Integrates the "Make an Offer" system API calls: `submitOffer()`, `getReceivedOffers()`, `getSentOffers()`, and `updateOfferStatus()`.
  - Integrates the Roommate Swiping ecosystem API calls: `getCollegeAreas()`, `createRoommateListing()`, `getRoommateListings()`, `likeRoommateListing()`, and `getAllRoommateListingsAdmin()`.
  - Runs a global DOMContentLoaded listener to automatically fetch the active profile and sync the user's avatar image to all header navigation icons (via element `#header-avatar`) across all pages.
  - Included on every secure page to ensure session persistence.

- **`/db/supabase_setup.sql`**: The master SQL script containing all core table definitions (e.g., the `profiles`, `products` schemas) and Row Level Security (RLS) policies.
- **`/db/offers_migration.sql`**: Schema configuration and RLS security policies for the `offers` table.
- **`/db/reservation_chat_setup.sql`**: Schema configuration and RLS for the `reservations` and `meetups` tables handling the transaction lifecycle.
- **`/db/roommate_images_migration.sql`**: Configures the `roommate_images` storage bucket and applies secure RLS policies for image uploads.
- **`/db/college_areas_migration.sql`**: Defines the `college_areas` mapping table to power dynamic area filtering.
- **`/db/roommate_likes_migration.sql`**: Constructs the `roommate_likes` swiping engine schema and `roommate_matches` interaction state tables.

## The Onboarding Journey (Routing Flow)

The app employs a strict, linear onboarding flow to ensure data integrity:

### 1. `/auth/login.html` (Authentication)
- Handles both **Sign In** (email/password), **Sign Up**, and **Google OAuth Sign-In**.
- **Data Stored:** Email and Password (securely hashed in Supabase's hidden `auth.users` table) or third-party OAuth profile data.
- **Routing Logic:** On successful login, `onAuthStateChange` checks the user's `profiles` table.
  - If `full_name` or `phone_number` is missing -> Redirects to `/auth/profile_setup.html`
  - If `id_url` is missing -> Redirects to `/auth/id_verification.html`
  - If `is_verified` is false but ID uploaded -> Redirects to `/auth/pending_verification.html`
  - Otherwise -> Redirects to `/index.html`

### 2. `/auth/profile_setup.html` (Data Collection & Avatar Cropping)
- The second step in onboarding.
- **Avatar Upload:** Mandatory profile picture selector. Integrates **Cropper.js** to crop the chosen image to a clean square blob.
- **Data Stored:** Saves `full_name`, `phone_number`, `year_of_study`, `college`, and the cropped profile `avatar_url` (uploaded to Supabase's `avatars` bucket) into the user's row in the `profiles` table.
- **Logic:** Dynamically requires a 11-digit enrollment number for 2nd/3rd/4th year students, but makes it optional for 1st-year students. Enforces that a cropped avatar must be uploaded before continuing.
- **Routing Logic:** On submit, successfully uploads the photo, calls `updateProfile()` and redirects to `/auth/id_verification.html`.
- **Smart Redirection:** Auto-redirects existing users who accidentally arrive here directly to the appropriate onboarding step or the Home page.

### 3. `/auth/id_verification.html` (Security Check)
- The final onboarding hurdle.
- **Data Stored:** Uploads the student ID card image to the private storage bucket. Updates `is_verified = true` in the `profiles` table (simulated/automated).
- **Routing Logic:** On success, redirects to the main `/index.html` dashboard.

## Main Application
- **`/index.html`**: The primary marketplace dashboard where users arrive after successfully authenticating and verifying their accounts. Shows the marketplace product feed.
- **`/core/offers.html`**: The Central Offers Dashboard containing tabbed panels for **Offers Received** (Seller view) and **Offers Sent** (Buyer view).
- **`/marketplace/offer_received.html`**: Dedicated seller processing screen for a received offer, enabling accepting, rejecting, or countering.
- **`/core/chat.html`**: The Meetup Status dashboard where users negotiate the meetup location/time and eventually view the revealed phone number.
- **`/roommates/roommate_need_flat.html`**: Form flow for posting roommate requirements with intelligent edit-mode pre-filling and dynamic area chips.
- **`/roommates/flatmates.html`**: The full-screen immersive swipe deck for discovering flatmates with dynamic matching logic and room photo backgrounds.
- **`/admin/dashboard.html`**: The moderation hub that uses unfiltered API endpoints to monitor all marketplace and roommate listings, including an inline image gallery for quick spam review.

## Deprecated/Legacy Files
- **`/auth/otp_verification.html`**: Originally used for Magic Link login, but deprecated due to Supabase sandbox rate limits on emails. Replaced entirely by the email/password and Google OAuth flows.

## UniMatch Ecosystem Architecture (New Expansion)

UniMatch is an exclusive campus dating and social networking sub-system designed with a distinct deep maroon palette (`#5c0427`, `#7a1f3d`, `#faf9f7`). It allows verified students to find study partners, friends, coffee buddies, event companions, and dating matches.

### 1. Dual Ecosystem Portal (`/index.html`)
- **Portal Landing Page:** Redesigned index page acting as the gateway choice screen between **UniThrift** (Sustainable campus marketplace) and **UniMatch** (Exclusive student community).
- **Dynamic Header Status (`#user-status-area`):** Integrates Supabase session checking to show a user greeting (`Hi, <name>`) and Sign Out button when authenticated, or a Sign In button routing to `/unimatch/auth/login.html` when unauthenticated.

### 2. Directory Structure & Page Breakdown (`/unimatch`)
- **`/unimatch/welcome.html`**: The entry landing page featuring a full-width hero image, trust badges, and an automated auth-routing script that redirects logged-in users to their pending onboarding step (`verify.html`, `instagram.html`, `profile-setup/basic-info.html`, or `discover.html`).
- **`/unimatch/discover.html`**: The primary full-screen card swiping deck with remaining daily likes counter, hidden admirers badge ("12 Admirers"), detailed profile bio & interest tags, and an interactive match modal overlay.
- **`/unimatch/icebreaker.html`**: Bento grid selector featuring interactive icebreakers (Coffee Match, Music Vibes, Food Debate, Watchlist, Campus Lore, Surprise Me) required before exchanging Instagram handles.
- **`/unimatch/insta-exchange-request.html` & `/unimatch/insta-exchange-success.html`**: Mutual consent request and approval flow for exchanging Instagram handles.
- **`/unimatch/connection-success.html`**: Celebratory match notification view with direct Instagram deep-linking (`instagram://user?...`).
- **`/unimatch/hidden-likes.html`**: Admirers discovery view displaying blurred profile cards of students who liked the user.
- **`/unimatch/out-of-likes.html`**: Daily swipe limit state screen with return countdown and invite options.

#### Authentication & Verification Subfolder (`/unimatch/auth`)
- **`/unimatch/auth/login.html`**: Dual-mode (Sign In / Create Account) interface supporting **Google OAuth** (`signInWithOAuth`) and **Email OTP** (`signInWithOtp`, `verifyOtp`).
- **`/unimatch/auth/verify.html`**: Student ID Verification gate enforcement for UniMatch.
- **`/unimatch/auth/instagram.html`**: Step 2 of 3 onboarding requiring mandatory Instagram handle input (`@username`), emphasizing privacy controls.
- **`/unimatch/auth/verified.html` & `/unimatch/auth/pending.html`**: Verification confirmation and pending status screens.

#### Multi-Step Profile Setup Subfolder (`/unimatch/profile-setup`)
- **`/unimatch/profile-setup/basic-info.html`**: Step 1 - Full Name, Major, Year of Study (1st Year through Graduate), and Bio with a 150-character live counter.
- **`/unimatch/profile-setup/looking-for.html`**: Step 2 - Intent selection cards (Friends, Coffee Buddy, Study Partner, Event Buddy, Dating).
- **`/unimatch/profile-setup/interests.html`**: Step 3 - Searchable interest chips grouped by Academic, Lifestyle, Hobbies, and Tech & Culture.
- **`/unimatch/profile-setup/photos.html`**: Step 4 - Photo grid supporting 1 to 6 profile pictures uploaded directly to Supabase storage (`profile_photos` bucket).
- **`/unimatch/profile-setup/review.html`**: Step 5 - Full profile card preview allowing inline edits before marking `unimatch_profile_complete = true`.

#### Profile Management Subfolder (`/unimatch/profile`)
- **`/unimatch/profile/my-profile.html`**: User profile management dashboard.
- **`/unimatch/profile/edit-profile.html`**: Profile editing form.
- **`/unimatch/profile/notifications.html`**: Social notification settings & log.
- **`/unimatch/profile/privacy-security.html`**: Privacy, visibility, and account security controls.

## Backend Connectivity & Current Supabase Status for UniMatch

### Currently Linked to Supabase Backend
1. **Authentication:** All UniMatch auth pages (`welcome.html`, `login.html`, `instagram.html`, `verify.html`) use `supabase.auth` (`getSession()`, `signInWithOAuth`, `signInWithOtp`, `verifyOtp`, `logout()`).
2. **Profile Data Sync:** The profile setup flow (`basic-info.html`, `looking-for.html`, `interests.html`, `photos.html`, `review.html`, `instagram.html`) actively writes and reads user fields from the `profiles` table in Supabase:
   - `full_name`, `major`, `year_of_study`, `bio`
   - `instagram_username`
   - `looking_for` (stored as JSON string array)
   - `interests` (stored as JSON string array)
   - `profile_photos` (stored as JSON array of Supabase Public Storage URLs)
   - `unimatch_profile_complete` (boolean completion flag)

### Currently NOT Linked to Supabase (Pending Backend Integration)
1. **Discovery Profile Feed (`discover.html`):** Currently operates on a static JavaScript array (`DISCOVERY_PROFILES`). It does NOT yet query real student profiles from Supabase.
2. **Daily Like Limits (`discover.html`):** The 5 daily likes limit (`remainingLikes`) is currently tracked in local frontend JavaScript state rather than fetched from database records.
3. **Swiping Engine & Mutual Matches:** Calling `handleConnect()` or `handlePass()` triggers frontend-only modal popups and card index increments. It does NOT yet record likes into a `unimatch_likes` table or calculate mutual matches via a Supabase query.
4. **Icebreakers & Instagram Exchange:** `icebreaker.html`, `insta-exchange-request.html`, `hidden-likes.html`, and `connection-success.html` present static mockup interactions without backend persistent state.

### Required Supabase Migrations & Schema for Complete UniMatch Integration
To fully connect UniMatch to Supabase, the following database schema migrations must be applied:

```sql
-- 1. Extend profiles table with UniMatch fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instagram_username TEXT,
  ADD COLUMN IF NOT EXISTS major TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS looking_for JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS unimatch_profile_complete BOOLEAN DEFAULT FALSE;

-- 2. Create unimatch_likes table for swiping logic
CREATE TABLE IF NOT EXISTS public.unimatch_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  liked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);

-- 3. Create unimatch_matches table for confirmed connections
CREATE TABLE IF NOT EXISTS public.unimatch_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  icebreaker_completed BOOLEAN DEFAULT FALSE,
  insta_shared_user1 BOOLEAN DEFAULT FALSE,
  insta_shared_user2 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.unimatch_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unimatch_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own likes"
  ON public.unimatch_likes FOR ALL
  USING (auth.uid() = liker_id);

CREATE POLICY "Users can view their matches"
  ON public.unimatch_matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
```

