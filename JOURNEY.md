# The UniThrift Journey

This document chronicles what we have built so far and the roadmap for what we need to build next to bring the UniThrift Premium Campus Ecosystem to life.

## What We Did Today
We made massive leaps forward today in building out the core onboarding and user authentication flow! Here is a recap of everything that was accomplished and integrated:

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
Now that the core onboarding and authentication flows are robust and fully integrated, here is what we need to tackle next:

### 1. Storage Bucket Implementation
- **Goal:** Actually save the uploaded ID verification images instead of just running a UI simulation.
- **Tasks:**
  - Create a private `id-verifications` storage bucket in the Supabase Dashboard.
  - Implement the Supabase Javascript SDK upload logic in `id_verification.html` to convert the uploaded file and push it to the bucket.
  - Secure the bucket so only authenticated admins can view the IDs.

### 2. Marketplace Dashboard (`index.html`)
- **Goal:** Build the main feed where users browse items.
- **Tasks:**
  - Import the Stitch UI designs for the marketplace dashboard.
  - Create an `items` table in Supabase to store product listings (title, description, price, seller_id, image_url, etc.).
  - Write Javascript to fetch these items from Supabase and render them into the feed dynamically.
  - Implement filtering or search functionality (e.g., search by category or price).

### 3. "Post an Item" Flow (Sellers Only)
- **Goal:** Allow users who registered as "Sellers" to list new items.
- **Tasks:**
  - Create a new `post_item.html` screen using Stitch UI designs.
  - Set up a `product-images` storage bucket in Supabase for item photos.
  - Write Javascript to handle image uploads and insert a new row into the `items` database table.

### 4. Role-Based Access Control
- **Goal:** Ensure buyers and sellers have distinct experiences.
- **Tasks:**
  - Add logic to the dashboard to show a "Post Item" floating action button *only* to verified sellers.
  - Create a "My Listings" page for sellers to view and delete items they've posted.

### 5. Messaging / Contact Seller
- **Goal:** Allow buyers to express interest in an item.
- **Tasks:**
  - Build a chat interface or a simple "Email Seller" button on the item detail page.
  - (Optional) Create a `messages` table in Supabase to handle in-app communication.
