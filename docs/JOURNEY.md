# The UniThrift Journey

This document chronicles what we have built so far and the roadmap for what we need to build next to bring the UniThrift Premium Campus Ecosystem to life.

## Session 4: Roommate Swipe Feature & Admin Moderation (Today)
We successfully built out the entire Flatmate finding ecosystem, including a robust admin panel to monitor and moderate activity!

### 1. Roommate Swiping Ecosystem
- **Database Schema & Matching (`db/roommate_likes_migration.sql`)**: Built the architecture for `roommate_listings` and `roommate_likes`, implementing a robust algorithm that generates a "match" only when two users mutually swipe right on each other.
- **Dynamic Area Selection (`db/college_areas_migration.sql`)**: Replaced manual text input with dynamic location chips, pulling valid areas directly from the user's `college` profile field to ensure clean data formatting.
- **Swipe Card UI**: Converted the simple swipe cards into immersive full-screen profiles. Flat providers now feature massive background photos of their rooms along with dynamically rendered amenities tags.

### 2. Room Photos & Amenities Integration
- **Image Compression & Uploads**: Fixed image compression pipelines allowing seekers to upload high-quality room photos directly from mobile devices without timeout errors.
- **Post Edit Functionality**: Built a seamless "Edit Post" flow that detects an active listing and intelligently pre-fills the form with budget, gender, bio, and area data, bypassing the destructive "delete and start over" flow.

### 3. Admin Dashboard Capabilities
- **Unfiltered Monitoring**: Created a dedicated `getAllRoommateListingsAdmin()` function to allow admins to see ALL postings regardless of their own swipe activity or college filtering.
- **Visual Moderation Tool**: Added a horizontally scrollable gallery directly inside the admin review cards, allowing moderators to instantly spot and delete spam room photos without leaving the dashboard.
- **Dynamic Formatting**: Fixed data-rendering bugs ensuring that "Budget" vs "Rent" and auto-generated titles accurately reflect seeker vs provider intents.

---

## Session 2: Make an Offer, Google OAuth & Onboarding Cropper (Yesterday)
We made massive progress, expanding the app's features from simple static mockups into a fully connected, secure, and responsive campus marketplace! Here is a recap of everything that was accomplished and integrated:

### 1. Mobile UI Responsiveness & Layout Fixes
- Removed global `min-height` calculations which were causing layout shifting and "bouncing" scroll bugs on mobile devices.
- Standardized vertical space offsets (`pb-[140px]`) across all 25+ layout templates to prevent floating navbar layouts from overlapping form inputs (like the Phone Number field during profile setup) and keyboard overlays.

### 2. PostgREST Join Disambiguation Bugfix
- Fixed a database join bug in `scripts/supabase.js` that occurred when introducing the `buyer_id` foreign key. Disambiguated all queries joining with the `profiles` table by explicitly using `profiles!seller_id(full_name)` instead of the ambiguous `profiles(full_name)`. This restored marketplace visibility for all posted items.

### 3. Fully Working "Make an Offer" Feature
- **Database Schema (`db/offers_migration.sql`):** Created the SQL schema defining the `offers` table and set up secure Row Level Security (RLS) policies allowing buyers to submit and sellers to review and manage offers.
- **Offer Submission (`marketplace/item.html`):** Configured the make-an-offer modal to collect custom prices and messaging, executing an API call to save it to Supabase. Configured owner protection to prevent users from making offers on their own listings.
- **Offers Dashboard (`core/offers.html`):** Designed and coded a central hub with tabbed sections for **Offers Received** and **Offers Sent**.
- **Interactive Review Flow (`marketplace/offer_received.html`):** Made this screen dynamic, letting sellers Accept, Reject, or Counter offers. Accepting an offer updates the product's status to `Sold` and records the `buyer_id` in the products table.

### 4. Google OAuth Authentication Integration
- **Google Sign-In Button (`auth/login.html`):** Added a beautiful, branded Google login button with smooth transitions and redirect loaders.
- **Supabase Integration (`scripts/supabase.js`):** Programmed the `signInWithGoogle()` callback to route through Supabase's secure OAuth flow.
- **Smart redirectional onboarding:** Configured `auth/profile_setup.html` so that returning users who log in via Google/Email instantly bypass the details forms and route straight to their current onboarding step (Home, ID Upload, or Pending Verification).

### 5. Onboarding Cropper.js Integration & Global Avatar Sync
- **Mandatory Registration Cropping (`auth/profile_setup.html`):** Integrated **Cropper.js** to allow users to select, crop, and preview their avatar right at registration. Enforced that an avatar must be cropped before registering.
- **Global Header Avatar Sync:** Wrote a python script to inject `id="header-avatar"` onto all profile navigation elements across 20 files. Configured a central listener in `supabase.js` to automatically fetch and update the header icon's image source with the user's real avatar URL upon page load.

### 6. Functional Logout
- Implemented `logout()` helper in `supabase.js` to clear session cookies/cache and bounce the user back to the login page. Bound it to the Log Out button on the profile page.

---

## Session 3: Security Deposit, Meetup Negotiation & Contact Reveal (Latest)
- **Security Deposit Checkout:** Implemented a new checkout model where buyers only pay a 25% security deposit to reserve an item, leaving the remaining 75% for in-person settlement.
- **Meetup Negotiation Flow:** Instead of free-form chat, introduced a structured meetup planner. Buyers propose a campus location and time, and sellers can accept or send a counter-offer.
- **Phone Number Reveal System:** Replaced the planned in-app messaging system with a more secure and efficient Phone Number Reveal. Once a meetup is confirmed, both parties' phone numbers are revealed with one-tap Call and WhatsApp action buttons.
- **Database Schema Updates:** Added `reservations` and `meetups` tables to handle the deposit status and negotiation states securely.

---

## Session 1: Core Onboarding & Authentication
We built out the core onboarding and user authentication flow:

### 1. Authentication Strategy Pivot
- Moved away from Magic Links and implemented **Email & Password Authentication** to bypass Supabase sandbox email rate limits.
- Configured Supabase to handle the new login flow flawlessly.

### 2. Dynamic Login & Sign Up Flow
- Integrated the new premium Stitch design for the login page.
- Branded the login page back to **UniThrift**.
- Built a dynamic toggle between "Sign In" and "Create Account".
- Successfully integrated the **Role Selector (Buy / Sell)** that only appears when a user is creating a brand new account.

### 3. Advanced Profile Setup
- Added a brand new step to the onboarding flow (`profile_setup.html`).
- Updated the Supabase `profiles` schema to track:
  - `full_name`
  - `phone_number`
  - `enrollment_number`
  - `year_of_study`
- Wrote dynamic Javascript validation (e.g., making the Enrollment Number optional *only* for 1st Year students).

### 4. ID Verification Redesign
- Completely replaced the old verification page with the new Stitch **ID Verification - Dynamic Upload** design (`id_verification.html`).
- Fixed desktop overflow bugs and perfectly positioned the image remove button.
- Tied the "Upload & Continue" button to Supabase so it officially marks the user's `is_verified` status as `true` in the database.

### 5. Seamless Routing Architecture
- Built smart, secure routing across the app.
- If a user tries to access `index.html` without finishing their profile, they are bounced back to `profile_setup.html`.
- If they finish their profile but haven't verified their ID, they are bounced to `id_verification.html`.

---

## Session 5: UniMatch Expansion & Multi-Step Student Discovery Ecosystem (Latest)
We expanded the platform from a marketplace into a full-scale dual ecosystem by creating **UniMatch**—an exclusive social and dating environment tailored for verified campus students.

### 1. Dual Ecosystem Gateway Landing Page (`index.html`)
- **Portal Interface:** Transformed `index.html` into a portal screen where users select between **UniThrift** (Sustainable campus marketplace) and **UniMatch** (Exclusive student community).
- **Dynamic Header Auth State:** Integrated Supabase Auth session checks (`supabase.auth.getSession()`) in `index.html` to display a personalized welcome badge (`Hi, <name>`) and Sign Out button for authenticated users, or a direct Sign In button for guests.

### 2. Deep Maroon Visual System & 18+ Interface Templates
- Established the UniMatch visual system using curated HSL color tokens (`#5c0427` maroon, `#7a1f3d` container, `#faf9f7` surface).
- Built out full page flows across `/unimatch/`, `/unimatch/auth/`, `/unimatch/profile-setup/`, and `/unimatch/profile/`.

### 3. Smart Onboarding & Instagram Verification Journey
- **Auth Guard & Routing (`welcome.html` & `auth/login.html`):** Integrated Google OAuth and Email OTP login flows. Implemented linear onboarding routing checks:
  1. Verification Check (`/unimatch/auth/verify.html`)
  2. Instagram Setup (`/unimatch/auth/instagram.html`)
  3. Multi-Step Profile Setup (`/unimatch/profile-setup/basic-info.html`)
  4. Active Discovery (`/unimatch/discover.html`)
- **5-Step Profile Builder:**
  - **Basic Info (`basic-info.html`):** Major, Year of Study, and live character counter (150 max) for Bio.
  - **Intent Selection (`looking-for.html`):** Choice cards for Friends, Coffee Buddy, Study Partner, Event Buddy, and Dating.
  - **Searchable Interests (`interests.html`):** Categorized chip selectors for Academic, Lifestyle, Hobbies, and Tech & Culture.
  - **Photo Grid Upload (`photos.html`):** Supports uploading up to 6 profile pictures directly to Supabase Public Storage (`profile_photos` bucket).
  - **Live Preview (`review.html`):** Interactive card preview with edit shortcuts before setting `unimatch_profile_complete = true`.

### 4. Interactive Social Dynamics & Mutual Consent Protocol
- **Full-Screen Swiping Deck (`discover.html`):** Implemented card stack rendering with verified student badges, interest chips, remaining daily likes counter, and "12 Admirers" hidden likes indicator.
- **Icebreaker Challenge (`icebreaker.html`):** Created a Bento Grid selector for mini Q&A prompts (Coffee Match, Music Vibes, Food Debate, Watchlist, Campus Lore).
- **Privacy-First Instagram Exchange (`insta-exchange-request.html`, `insta-exchange-success.html`, `connection-success.html`):** Built a mutual agreement protocol so Instagram handles remain private until both users agree to share, featuring one-tap deep links (`instagram://user?...`).

### 5. Supabase Connectivity Analysis & Current Gap Audit
- **Connected & Functional:**
  - Supabase Auth session management and Google/OTP sign-in.
  - User profile attributes in `profiles` table: `full_name`, `major`, `year_of_study`, `bio`, `instagram_username`, `looking_for` (JSON), `interests` (JSON), `profile_photos` (JSON), and `unimatch_profile_complete`.
- **Not Yet Connected (Pending Integration):**
  - `discover.html` profile deck currently relies on local mock array `DISCOVERY_PROFILES`.
  - Daily likes counter (`remainingLikes = 5`) is stored in frontend JavaScript memory.
  - Swiping actions (`handleConnect()`, `handlePass()`) do not yet write to a backend `unimatch_likes` table.
  - Icebreaker responses and Instagram exchange confirmations do not yet persist in a backend `unimatch_matches` table.

---

## What We Need To Do Next (Future Roadmap)

Now that the UniMatch UI flows, multi-step profile builder, and frontend interaction screens are fully built, here is what we need to tackle next:

### 1. Execute UniMatch Supabase Database Migration (`db/unimatch_setup.sql`)
- **Goal:** Link all UniMatch frontend screens directly to live Supabase PostgreSQL tables.
- **Tasks:**
  - Create migration script extending `profiles` schema with `instagram_username`, `major`, `bio`, `looking_for`, `interests`, `profile_photos`, and `unimatch_profile_complete`.
  - Create `unimatch_likes` table (`liker_id`, `liked_id`, `action`, `created_at`).
  - Create `unimatch_matches` table (`user1_id`, `user2_id`, `icebreaker_completed`, `insta_shared_user1`, `insta_shared_user2`).
  - Configure Row Level Security (RLS) policies for secure swiping and match visibility.

### 2. Wire `discover.html` & Interaction Screens to Live Database Queries
- Replace static `DISCOVERY_PROFILES` with a dynamic query fetching unswiped student profiles from Supabase.
- Store likes in `unimatch_likes` on swipe right, calculate real-time mutual matches, and trigger match popups dynamically.
- Fetch real admirer profiles for `hidden-likes.html` and persist icebreaker completion states in `unimatch_matches`.

### 3. In-App Notifications
- **Goal:** Notify buyers/sellers when their offers are accepted, rejected, or countered, and notify UniMatch users of new mutual matches.
- **Tasks:**
  - Create a `notifications` table in Supabase.
  - Set up a dashboard notification bell in the header that queries this table.
  - Trigger notification records when offers are sent, countered, or responded to.

### 4. College Verification Enhancements (ID Verification Upload)
- **Goal:** Set up secure, private image file storage for ID verification.
- **Tasks:**
  - Create an `id-cards` private storage bucket in Supabase.
  - Implement image upload and OCR/Admin review panel to verify student cards.

### 5. Redesign Chat UI for Mobile (Stitch)
- **Goal:** Improve the layout of the mobile meetup view with the Stitch design system.

