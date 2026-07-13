# UniThrift — Codebase & Features Guide

Welcome to the **UniThrift Campus Hub** codebase. This document outlines the updated architecture, file structure, design system, and all interactive features implemented in the project, which now perfectly mirrors the premium Stitch design.

---

## 📂 Project Architecture

The application has been restructured from a Single Page Application (SPA) into a Multi-Page Application (MPA) to preserve the exact HTML rendering, inline scripts, and dynamic interactivity provided by the Stitch AI. It leverages Tailwind CSS via CDN.

```
d:\projects\Unithrift\
├── splash.html       # The entry point. Features a logo and loading animation, automatically redirects to index.html.
├── index.html        # The Home / Dashboard screen.
├── marketplace.html  # The full marketplace listing feed.
├── flatmates.html    # The Tinder-like swipe UI for finding roommates.
├── pghostels.html    # Map view and listing directory for student accommodation.
├── item.html         # Full-screen detailed product view (linked from Market).
└── profile.html      # User profile, trust & verification, and activity.
```
*(Note: `styles.css` and `app.js` were intentionally removed to adhere strictly to the exact Stitch output.)*

---

## 🎨 Design System: Stitch Premium Campus Ecosystem

The visual language is designed to reflect a high-contrast, premium aesthetic tailored for college students, utilizing the strict constraints of the Stitch Tailwind configuration.

### 1. Color Palette
- **Background (`#f8f9ff`):** A clean, ultra-light slate driving the light mode aesthetic.
- **Primary Accent (`#006e2f` / `#22c55e`):** Vibrant emerald greens used for CTA highlights, verification badges, and the primary UniThrift brand identity.
- **Surface Containers (`#eff4ff` / `#ffffff`):** Layered whites and light blues to create depth and card hierarchies.

### 2. Typography
- **Primary Typeface:** `Geist` — a modern, geometric sans-serif used exclusively across the entire UI for headlines, body copy, and labels.
- **Icons:** `Material Symbols Outlined` with precise weight and fill variations for dynamic interactions.

### 3. Key Aesthetics
- **Glassmorphism:** Navigation panels and sticky headers use semi-transparent backgrounds with backdrop blur (`backdrop-blur-md`, `.glass`).
- **Signature Corners:** Container elements and main listing cards employ an organic `20px` border radius (`rounded-[20px]`).
- **Shadow Depth:** Soft, diffused shadows (`shadow-[0_4px_20px_rgba(0,0,0,0.04)]`) provide elevation without harsh contrast.

---

## ⚡ Feature Catalog

### 1. Unified Navigation
* **Desktop/Mobile Headers:** Frosted glass headers that dynamically update opacity. Include quick actions like Search and User Profile.
* **Mobile Bottom Nav:** Standard fixed-bottom app navigation (`nav.fixed.bottom-0`) linking all primary HTML files (`index.html`, `marketplace.html`, `flatmates.html`, `pghostels.html`, `profile.html`).

### 2. Dynamic Splash Screen (`splash.html`)
* A pure visual intro screen featuring the green UniThrift logo and animated pulsing loading dots.
* Automatically routes users to the Dashboard (`index.html`) after 3 seconds or upon any screen tap.

### 3. Home Dashboard (`index.html`)
* **Greeting & Search:** Personalized "Good morning" block and a floating search bar.
* **Categories Row:** Horizontal scrolling action panel for Books, Lab Coats, Gadgets, Cycles, and PGs.
* **Trending Offers:** A 2-column Bento grid of featured marketplace items.
* **Near Campus Stays:** Horizontal scrolling cards for sponsored hostels.
* **Looking for Roomies:** Quick view of potential flatmates.

### 4. Marketplace (`marketplace.html`)
* A comprehensive listing directory for campus essentials.
* **Filter Pills:** Horizontal scrolling pill menu (All Items, Under $50, Textbooks, Electronics).
* **Grid Layout:** Detailed product cards showing condition (e.g., "Like New"), original vs discounted pricing, and verified status badges.

### 5. Swipeable Flatmates UI (`flatmates.html`)
* An interactive Tinder-style swipe interface for finding roommates.
* Features a fully functional Javascript drag-and-drop listener (`touchmove`, `touchend`) that applies dynamic rotation and opacity overlays (`LIKE` / `NOPE`).
* Displays detailed roommate preferences (Budget, Preferred Area, Lifestyle tags like Night Owl/Non-Smoker).

### 6. PGs & Hostels (`pghostels.html`)
* A specialized directory for housing featuring large hero images of properties.
* Displays walk-times to campus, star ratings, and rent per month.

### 7. Item Details (`item.html`)
* Deep-dive view of a specific product (e.g., a Leather Jacket).
* Massive hero image taking up the top half of the screen.
* Fixed bottom action bar offering "Make Offer" and "Buy Now" CTAs.

### 8. User Profile (`profile.html`)
* Trust & Verification center showing Student ID and Enrollment No. validation.
* Statistical overview: Rating, Items Sold, and Transacts.
* Account Activity links (Saved Items, Purchase History, Selling History).
