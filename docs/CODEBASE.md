# UniThrift Codebase Architecture

This document serves as a guide to the current structure of the UniThrift codebase, outlining how the different files connect and where data is managed. The codebase has been organized into logical folders for a clearer development workflow and easier deployment on Netlify.

## Directory Structure Overview

- **`/` (Root)**: Core dashboard entry points (`index.html`, `splash.html`).
- **`/auth`**: All authentication, onboarding, and verification views.
- **`/marketplace`**: Core buying and selling flows, offers, and item listings.
- **`/roommates`**: Flatmate finding features.
- **`/pghostels`**: PG and Hostel discovery features.
- **`/core`**: General user pages like pricing and user profiles.
- **`/scripts`**: JavaScript logic files.
- **`/docs`**: Documentation and specs (including this file).
- **`/db`**: Database configuration and setup scripts.

## Authentication & Backend Connectivity
- **`/scripts/supabase.js`**: The central brain for connecting the frontend UI to our Supabase database. 
  - Initializes the Supabase client.
  - Contains helper functions like `requireAuth()`, `requireVerifiedSeller()`, `getProfile()`, and `updateProfile()`.
  - Included on every secure page to ensure session persistence.

- **`/db/supabase_setup.sql`**: The master SQL script containing all table definitions (e.g., the `profiles` schema) and Row Level Security (RLS) policies.

## The Onboarding Journey (Routing Flow)

The app employs a strict, linear onboarding flow to ensure data integrity:

### 1. `/auth/login.html` (Authentication)
- Handles both **Sign In** and **Sign Up**.
- **Data Stored:** Email and Password (securely hashed in Supabase's hidden `auth.users` table).
- **Routing Logic:** On successful login, `onAuthStateChange` checks the user's `profiles` table.
  - If `full_name` is missing -> Redirects to `/auth/profile_setup.html`
  - If `is_verified` is false -> Redirects to `/auth/id_verification.html`
  - Otherwise -> Redirects to `/index.html`

### 2. `/auth/profile_setup.html` (Data Collection)
- The second step in onboarding.
- **Data Stored:** Saves `full_name`, `phone_number`, `year_of_study`, and `enrollment_number` to the user's row in the `profiles` table.
- **Logic:** Dynamically requires a 11-digit enrollment number for 2nd/3rd/4th year students, but makes it optional for 1st-year students.
- **Routing Logic:** On submit, successfully calls `updateProfile()` and redirects to `/auth/id_verification.html`.

### 3. `/auth/id_verification.html` (Security Check)
- The final onboarding hurdle.
- **Data Stored:** (Future implementation) Will upload the ID image to a Supabase Storage Bucket. Currently simulates the upload. Updates `is_verified = true` in the `profiles` table.
- **Routing Logic:** On success, redirects to the main `/index.html` dashboard.

## Main Application
- **`/index.html`**: The primary marketplace dashboard where users arrive after successfully authenticating and verifying their accounts. This is the next major focus for development (Marketplace Feed & Product Listings).

## Deprecated/Legacy Files
- **`/auth/otp_verification.html`**: Originally used for Magic Link login, but deprecated due to Supabase sandbox rate limits on emails. Replaced entirely by the email/password flow in `/auth/login.html`.
- **`/auth/pending_verification.html`**: A holding page for sellers awaiting manual approval. Currently bypassed by the automated `/auth/id_verification.html` flow, but kept for future manual admin review features.
