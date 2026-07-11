# UniThrift — Codebase & Features Guide

Welcome to the **UniThrift Campus Hub** codebase. This document outlines the architecture, file structure, design system, and all interactive features implemented in the project.

---

## 📂 Project Architecture

The application is built entirely on the native web stack (HTML5, CSS3, and Vanilla JavaScript) for maximum performance, zero build-step overhead, and complete control over layout and style.

```
d:\projects\Unithrift\
├── index.html        # Main app entry structure containing all templates & layout grids
├── styles.css        # The complete Neo-Thrift Pulse dark design system & animation library
└── app.js            # Main application state, mock data, and DOM rendering logic
```

---

## 🎨 Design System: Neo-Thrift Pulse

The visual language is designed to reflect a high-contrast, premium, street-wear aesthetic tailored for Gen Z college students.

### 1. Color Palette
- **Background (`#0b1326`):** A deep, void-like slate color driving the dark mode aesthetic.
- **Primary Accent (`#6bfb9a` - Neon Mint):** Used for CTA highlights, interactive tags, and hot items.
- **Secondary Accent (`#adc6ff` - Electric Blue):** Used for housing items, maps, and alternative categories.
- **Tertiary Accent (`#ffd5e6` - Cyber Pink):** Accent points for premium alerts and active categories.

### 2. Typography
- **Headlines & Labels:** `Space Grotesk` — a futuristic, geometric typeface.
- **Body Copy:** `Inter` — for maximum readability across dense tables and listing descriptions.

### 3. Key Aesthetics
- **Glassmorphism:** Navigation panels, dropdowns, and modal controls use semi-transparent backgrounds with a `20px` backdrop blur (`backdrop-filter`).
- **Signature Corners:** Container elements, main listing cards, and housing grids employ an organic `24px` (`var(--radius-xl)`) border radius.

---

## ⚡ Feature Catalog

### 1. Unified Navigation
* **Desktop Navbar:** A frosted glass header that dynamically updates its opacity on scroll. Includes quick links and action triggers for sign-up/login.
* **Mobile Bottom Nav:** Standard fixed-bottom app navigation with frosted glass backing, responsive icons, and active section anchors.

### 2. Interactive Feed Segment Control
* A custom-styled sliding segmented control allowing users to switch between three sub-feeds:
  * **Thrift:** B.Tech academic marketplace drops.
  * **PGs & Flats:** Nearby student accommodation.
  * **Flatmates:** Peer finding networks.
* Driven by a sliding background pill indicator that transitions dynamically based on button indexes.

### 3. Stories Row & Quick Action Panel
* A horizontally scrolling row of circular "stories" serving as visual highlights for categories (Books, Calculators, Drafters, Lab Gear, Electronics).
* Includes a "+" item allowing quick creation of new listings.

### 4. Category Pills Filter
* A fast horizontal scroll pill menu for filtering items in the featured Bento feed. Selecting a category filters the bento items immediately without page reloads.

### 5. Bento Grid Feed
* A modern layout grouping:
  * **Featured Drop:** A large, high-visibility card highlight with a prominent action call.
  * **2-Column Grid:** Secondary product listings displaying title, branch, and user details in an ultra-compact card format.

### 6. Interactive Housing Directory (PGs & Flats)
* A comprehensive listing directory for student accommodation. Cards display rent price, room sharing options (e.g., Double Sharing), gender specs (Boys/Girls/Co-ed), and an amenities list.
* Clicking any listing slides open a detail modal showing verified status, spots left, detailed amenities, and direct message actions.

### 7. Branch Directory
* Visual cards representing B.Tech engineering branches (CSE, ECE, ME, CE, EE, CH, BT, IT) with custom colored indicators. Clicking filters the main marketplace listings accordingly.

### 8. Campus Finder
* An interactive college directory listing 500+ institutes.
* Features search bar filtering with real-time text matching, tab filtering by type (IITs, NITs, IIITs, State, Private, Deemed), and deep-dive college statistics modals.
