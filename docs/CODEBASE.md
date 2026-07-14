# UniThrift Codebase Architecture

This document serves as a guide to the current structure of the UniThrift codebase, outlining how the different files connect and where data is managed. The codebase has been organized into logical folders for a clearer development workflow and easier deployment on Netlify.

## Directory Structure Overview

- **`/` (Root)**: Core dashboard entry points (`index.html`, `splash.html`).
- **`/auth`**: All authentication, onboarding, and verification views.
- **`/marketplace`**: Core buying and selling flows, offer review pages, and item listings.
- **`/roommates`**: Flatmate finding features.
- **`/pghostels`**: PG and Hostel discovery features.
- **`/core`**: General user pages like pricing, offers dashboard, and user profiles.
- **`/scripts`**: JavaScript logic files.
- **`/docs`**: Documentation and specs (including this file).
- **`/db`**: Database configuration, schema scripts, and SQL migrations.

## Authentication & Backend Connectivity
- **`/scripts/supabase.js`**: The central brain for connecting the frontend UI to our Supabase database. 
  - Initializes the Supabase client.
  - Contains helper functions like `requireAuth()`, `requireVerifiedSeller()`, `getProfile()`, `updateProfile()`, `signInWithGoogle()`, and `logout()`.
  - Integrates the "Make an Offer" system API calls: `submitOffer()`, `getReceivedOffers()`, `getSentOffers()`, and `updateOfferStatus()`.
  - Runs a global DOMContentLoaded listener to automatically fetch the active profile and sync the user's avatar image to all header navigation icons (via element `#header-avatar`) across all pages.
  - Included on every secure page to ensure session persistence.

- **`/db/supabase_setup.sql`**: The master SQL script containing all core table definitions (e.g., the `profiles`, `products` schemas) and Row Level Security (RLS) policies.
- **`/db/offers_migration.sql`**: Schema configuration and RLS security policies for the `offers` table.

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

## Deprecated/Legacy Files
- **`/auth/otp_verification.html`**: Originally used for Magic Link login, but deprecated due to Supabase sandbox rate limits on emails. Replaced entirely by the email/password and Google OAuth flows.
