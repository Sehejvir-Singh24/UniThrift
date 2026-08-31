# UniThrift - Project Context

## What is UniThrift?
UniThrift is an exclusive, premium student marketplace and social ecosystem designed for safe and frictionless on-campus trading, room sharing, and student networking. Unlike traditional open marketplaces, it enforces student verification (enrollment ID and ID card checks) to ensure a secure, closed-loop environment where verified students can trust each other.

The platform is designed mobile-first with a high-end, dynamic UI featuring glassmorphism, vibrant colors, curated theme palettes, drifting cloud micro-animations, and responsive layouts built on top of a robust backend architecture (Supabase).

---

## Core Concepts & Mechanics

### 1. The Security Deposit & Meetup Model (Marketplace)
The platform does NOT handle full payments, selling of products directly, or shipping. Instead, it facilitates safe physical meetups on campus through a Security Deposit model.
- **Reserving an Item:** Buyers pay a 25% Security Deposit to reserve an item.
- **Meetup Negotiation:** Upon reservation, the buyer proposes a time and on-campus location (e.g., Canteen, Library, Nescafe, Ground, Stage). The seller can either accept or counter-offer.
- **Phone Number Reveal:** Once both parties agree on the meetup details, the system officially marks it as "Confirmed". At this moment, it securely reveals their phone numbers via large Call and WhatsApp buttons so they can coordinate the physical exchange.
- **Final Settlement:** The remaining 75% of the item price is paid directly to the seller in-person during the meetup.
- **Completion & Reviews:** After the meetup is successfully completed and the balance settled, the transaction is marked as completed in the app, and both parties can leave a 5-star review for each other.

### 2. Trust and Safety (Student Only Verification)
- Registration requires a valid student enrollment number and a mandatory ID card upload.
- Strict Role-Based Access Control: Unverified users are restricted (they can browse, but cannot make offers, buy/reserve, list items, or view unlocked contact details).
- All transactions are tracked, and users build reputation through post-meetup reviews.

### 3. Offers System
- Buyers can send custom price offers on listings before reserving.
- Sellers have a dedicated dashboard (`core/offers.html`) to review received offers and can accept, counter, or reject them.

### 4. Simplified Flatmates Directory & PayU ₹39 Contact Unlock
- **Directory Pivot (`roommates/flatmates.html`):** Moved away from Tinder-style swiping deck for finding flatmates in favor of a clean, responsive listing directory board.
- **Category Filter Tabs:** Toggle between `All Listings`, `Rooms Available 🏠` (`have_flat`), and `Seeking Room 🔍` (`need_flat`).
- **Privacy & Public Info:** Room photos gallery, title, location, price/rent badge, and amenities/preferences chips (`✓ WiFi`, `✓ AC`, `✓ Laundry`) are **always visible** publicly.
- **Blurred Contact Details:** Host/seeker name, profile avatar (rendered as `"Verified Student 🔒"`), full bio description, and contact links are **blurred and locked** by default.
- **PayU ₹39 Instant Unlock:** Users tap **"🔒 Unlock Contact Details — ₹39"** and complete PayU Hosted Checkout. PayU's server-validated response returns them to the app, where contact details are revealed.
- **Multi-Photo Carousel & Fullscreen Lightbox:** Includes an interactive photo slider with thumbnail strip and fullscreen image viewer (`object-contain`) with zero cropping.

### 5. UniMatch Social & Dating Ecosystem
- **Exclusive Campus Networking:** Tailored sub-app allowing verified students to connect based on shared intents (Study Partner, Friends, Coffee Buddy, Event Companion, Dating).
- **Sunset Cloud Theme (`unimatch/unimatch-theme.css` & `unimatch/clouds-init.js`):** Warm sunset gradient background (`#F9DBD5`, `#F2C4B8`, `#E09898`, `#C8A8B8`) with 10 soft SVG cumulus clouds drifting across the screen.
- **Non-Scrollable Discovery Feed:** `discover.html` features a fixed non-scrollable viewport (`top: 64px`, `bottom: 64px`, `100dvh`, `overflow: hidden`) fitting cards perfectly between the header and bottom nav with standardized 64px action buttons.
- **Interest-Based Ranking Algorithm:** Ranks student profiles based on shared interest tag counts (`+1` point per common tag) while excluding self and non-preferred genders.
- **Privacy-First Sharing:** Instagram handles are shown only to verified students after a mutual match.
- **Free for Verified Students:** UniMatch does not charge for likes, admirer profiles, mutual matches, icebreakers, or Instagram sharing.

---

## Tech Stack
- **Frontend:** Vanilla HTML/JS, Tailwind CSS (via CDN), Geist Font, Material Symbols, Cropper.js, PayU Hosted Checkout.
- **Backend / Database:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Payments:** PayU Hosted Checkout via signed Supabase Edge Functions.
- **Design Aesthetic:** Premium glassmorphic interfaces, sunset cloud gradients, uncropped photo lightboxes, micro-animations, and responsive viewports.
