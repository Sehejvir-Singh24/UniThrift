# The UniThrift Journey

This document chronicles what we have built so far and the roadmap for what we need to build next to bring the UniThrift Premium Campus Ecosystem to life.

## What We Did Today
We made massive progress today, expanding the app's features from simple static mockups into a fully connected, secure, and responsive campus marketplace! Here is a recap of everything that was accomplished and integrated:

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

## What We Need To Do Next (Future Roadmap)
Now that onboarding, authentication, profile sync, and offer submissions are fully dynamic and functional, here is what we need to tackle next:

### 1. In-App Notifications
- **Goal:** Notify buyers/sellers when their offers are accepted, rejected, or countered.
- **Tasks:**
  - Create a `notifications` table in Supabase.
  - Set up a dashboard notification bell in the header that queries this table.
  - Trigger notification records when offers are sent, countered, or responded to.

### 2. In-App Chat Integration
- **Goal:** Enable direct negotiation and pickup coordination inside the app.
- **Tasks:**
  - Create a `messages` and `conversations` table in Supabase.
  - Design a real-time messaging interface where buyers and sellers can talk after an offer is submitted.

### 3. College Verification Enhancements (ID Verification Upload)
- **Goal:** Set up secure, private image file storage for ID verification.
- **Tasks:**
  - Create an `id-cards` private storage bucket in Supabase.
  - Implement image upload and OCR/Admin review panel to verify student cards.
