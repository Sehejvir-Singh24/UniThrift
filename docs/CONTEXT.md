# UniThrift - Project Context

## What is UniThrift?
UniThrift is an exclusive, premium student marketplace designed for safe and frictionless on-campus trading. Unlike traditional open marketplaces, it enforces student verification (enrollment ID and ID card checks) to ensure a secure, closed-loop environment where buyers and sellers can trust each other.

The platform is designed to be mobile-first with a high-end, dynamic UI (featuring glassmorphism, vibrant colors, and micro-animations) built on top of a robust backend architecture (Supabase).

## Core Concepts & Mechanics

### 1. The Security Deposit & Meetup Model
The platform does NOT handle full payments, selling of products directly, or shipping. Instead, it facilitates safe physical meetups on campus through a Security Deposit model.
- **Reserving an Item:** Instead of paying full price online, buyers pay a 25% Security Deposit to reserve an item.
- **Meetup Negotiation:** Upon reservation, the buyer proposes a time and on-campus location (e.g., Canteen, Library, Nescafe, Ground, Stage). The seller can either accept or counter-offer.
- **Phone Number Reveal:** Once both parties agree on the meetup details, the system officially marks it as "Confirmed". At this moment, it securely reveals their phone numbers via large Call and WhatsApp buttons so they can coordinate the physical exchange.
- **Final Settlement:** The remaining 75% of the item price is paid directly to the seller in-person during the meetup.
- **Completion & Reviews:** After the meetup is successfully completed and the balance settled, the transaction is marked as completed in the app, and both parties can leave a 5-star review for each other.

### 2. Trust and Safety (Student Only)
- Registration requires a valid student enrollment number and a mandatory ID card upload.
- The platform uses strict Role-Based Access Control: Unverified users are restricted (they can browse, but cannot make offers, buy/reserve, or list items).
- All transactions are tracked, and users build reputation through post-meetup reviews.

### 3. Offers System
- Buyers can send custom price offers on listings before reserving.
- Sellers have a dedicated dashboard (`core/offers.html`) to review received offers and can effortlessly Accept, Counter, or Reject them.

### 4. UniMatch Social Ecosystem
- **Exclusive Campus Networking:** Tailored sub-app allowing verified students to connect based on shared intents (Study Partner, Friends, Coffee Buddy, Event Companion, Dating).
- **Deep Maroon Theme:** Distinct visual identity using maroon accents (`#5c0427`, `#7a1f3d`).
- **Privacy-First Instagram Consent:** Instagram handles remain hidden until both users swipe right, complete an icebreaker, and mutually grant consent.

## Tech Stack
- **Frontend:** Vanilla HTML/JS, Tailwind CSS (via CDN).
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage).
- **Design Aesthetic:** Premium, modern, glassmorphism interfaces, smooth state transitions, and tailored typography (Geist font, Material Symbols).

