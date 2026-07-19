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

## What We Need To Do Next (Future Roadmap)
Now that onboarding, authentication, profile sync, and offer submissions are fully dynamic and functional, here is what we need to tackle next:

### 1. In-App Notifications
- **Goal:** Notify buyers/sellers when their offers are accepted, rejected, or countered.
- **Tasks:**
  - Create a `notifications` table in Supabase.
  - Set up a dashboard notification bell in the header that queries this table.
  - Trigger notification records when offers are sent, countered, or responded to.

### 2. College Verification Enhancements (ID Verification Upload)
- **Goal:** Set up secure, private image file storage for ID verification.
- **Tasks:**
  - Create an `id-cards` private storage bucket in Supabase.
  - Implement image upload and OCR/Admin review panel to verify student cards.

### 3. Redesign Chat UI for Mobile (Stitch)
- **Goal:** Improve the layout of the mobile meetup view with the Stitch design system.
