# UniMatch — Feed Algorithm Documentation

> **Last Updated:** July 2026
> **File:** `unimatch/discover.html` → script section (`buildFeedProfiles`, `scoreProfile` functions)

---

## 🧠 Current Algorithm (v1) — Interest-Based Scoring

### How It Works

When a user opens the Discover page, this pipeline runs against all profiles in Supabase:

```
All profiles with unimatch_profile_complete = true
                │
                ▼
    ① Remove yourself from feed
                │
                ▼
    ② Filter by preferred gender
       ("Show Me In Feed" setting from Basic Info)
       - "Women" → only show Female profiles
       - "Men"   → only show Male profiles
       - "Everyone" → no gender filter applied
       (If filter leaves 0 results, fallback to show everyone)
                │
                ▼
    ③ Score each user by shared interests
       +1 point for every matching interest tag
                │
                ▼
    ④ Sort descending by score
       (highest shared interests = shown first in feed)
                │
                ▼
    ⑤ Map Supabase rows → card-friendly format
       (parse JSON arrays: interests, looking_for, profile_photos)
                │
                ▼
    ⑥ If 0 real users found → show DEMO_PROFILES fallback
```

### Scoring Function

```js
// In discover.html
function scoreProfile(candidate, myInterests) {
  const mySet = new Set(myInterests.map(i => i.toLowerCase().trim()));
  let score = 0;
  candidate.interests.forEach(interest => {
    if (mySet.has(interest.toLowerCase().trim())) score++;
  });
  return score;
}
```

### Interest Tags (from `unimatch/profile-setup/interests.html`)
Users choose from a predefined set of interest chips during onboarding. These are stored as a JSON array string in `profiles.interests`.

---

## 🗂️ Supabase Fields Used by Algorithm

| Field | Type | Used For |
|---|---|---|
| `interests` | `TEXT` (JSON array) | Interest scoring & matching |
| `preferred_gender` | `TEXT` | Gender filter (Women / Men / Everyone) |
| `gender` | `TEXT` | Filtered against other user's preferred_gender |
| `unimatch_profile_complete` | `BOOLEAN` | Only show users who finished onboarding |
| `profile_photos` | `TEXT` (JSON array) | Photos displayed on card |
| `looking_for` | `TEXT` (JSON array) | Goal badge on card (Study Partner etc.) |
| `id` | `UUID` | Exclude self from feed |

---

## 🔮 Planned Algorithm Upgrades (v2+)

> **To implement these, remind the AI:** *"Add v2 algorithm upgrades from ALGORITHM.md"*

### Priority 1 — Same University Boost
```
+2 points if candidate.university === myProfile.university
```
Rationale: UniMatch is campus-first. Same-university people are more relevant.

### Priority 2 — Same Goal / Intent Match
```
+1 point if candidate.looking_for[] overlaps with myProfile.looking_for[]
```
e.g. Both want "Study Partner" → more compatible → shown higher.

### Priority 3 — Already-Liked Exclusion & 24h Pass Cooldown
```
Filter out profiles where:
  - Liked: EXISTS in unimatch_likes WHERE liker_id = me AND liked_user_id = candidate.id AND action = 'like' (Permanently excluded)
  - Passed (<24h): EXISTS in unimatch_likes WHERE liker_id = me AND liked_user_id = candidate.id AND action = 'pass' AND (now - created_at) < 24 hours (Suppressed for 1 day)
```
- When you like someone, they never reappear in Discover.
- When you pass (cross) someone, they enter a 24-hour (1 day) cooldown and will not reappear for at least 24 hours. Once 24 hours have elapsed, they can reappear as a recycled fallback candidate at the end of the feed.

### Priority 4 — Mutual Like Boost (Hidden Admirers)
```
+3 points if candidate has already liked you (mutual boost)
```
Surfaces people who are already interested in you higher in your feed.

### Priority 5 — Recency Boost
```
+1 point if candidate profile was updated within the last 7 days
```
Prioritize active/new users to keep the feed fresh.

### Priority 6 — Weighted Interest Matching
Instead of flat +1 per interest, weight rarer interests higher:
```
score += 1 / (frequency of that interest across all users)
```
So matching on "Quantum Computing" is worth more than matching on "Coffee".

---

## 🏗️ Algorithm Code Location

- **File:** `unimatch/discover.html`
- **Functions:**
  - `scoreProfile(candidate, myInterests)` — returns numeric compatibility score
  - `buildFeedProfiles(candidates, myProfile)` — runs full pipeline, returns sorted array
  - IIFE init block — fetches from Supabase and calls `buildFeedProfiles`

---

## 📊 Algorithm Summary Table

| Version | Filter | Scoring | Status |
|---|---|---|---|
| v1 (current) | Self + Gender preference | Shared interests count | ✅ Live |
| v2 | + Already-liked exclusion | + University boost | 🔲 Planned |
| v3 | + Mutual like filter | + Goal match + Recency | 🔲 Planned |
| v4 | + Weighted interests | Full weighted scoring | 🔲 Planned |

---

## 🗒️ Notes

- **Demo fallback:** If fewer than 2 real users exist, `DEMO_PROFILES` (hardcoded fake profiles) are shown so the app always looks functional during testing.
- **Gender filter graceful degradation:** If gender filtering would result in 0 profiles, the filter is skipped and everyone is shown.
- **Case-insensitive matching:** Interest comparison is `.toLowerCase().trim()` so "Coffee" and "coffee" match correctly.
