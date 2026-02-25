# 🎵 Carnatic App — Game Plan

> Reference document for development context. Last updated: Feb 2026.

---

## 🧭 What We're Building

A **Carnatic music discovery and learning platform** for students and teachers of Carnatic music.
Primary users: Students of a Carnatic music teacher (teenagers, kids, adults).

### Two Products
1. **Mobile App** (main focus) — iOS + Android, React Native + Expo
2. **Chrome Extension** (secondary) — filters YouTube.com search to Carnatic only

---

## 🎯 Core Problem

YouTube has a massive library of Carnatic music but zero curation. Students waste time finding content, accidentally discover non-Carnatic content, and teachers have no way to assign or recommend videos to their students. Saregama Classical (last updated 5 years ago) and Carnatic Music Vault (Android only, abandoned ~6 months ago) attempted this but failed to maintain or grow.

---

## 🏆 Competitive Landscape

| App | Status | Gap We Fill |
|-----|--------|------------|
| Carnatic Music Vault | Abandoned, Android only | iOS, active maintenance, teacher tools |
| Saregama Classical | 5 years stale, licensed audio | YouTube-scale content, always fresh |
| YouTube | No curation | Carnatic-only filter, raga/artist tags |
| Riyaz | Practice tool, not discovery | Video discovery, not just practice |

**Verdict: No real competitor. Market validated but underserved.**

---

## 👤 User Types

| Type | Needs |
|------|-------|
| **Student (kid/teen)** | Simple browse, search by artist/raga, watch concerts |
| **Student (adult)** | Same + personal watch history, playlists |
| **Teacher** | Create curated playlists for students, assign videos, track progress |
| **Browser user** | Chrome extension — filtered YouTube experience |

---

## ✨ Features

### Phase 1 — MVP (Launch)
- [ ] Home feed: featured concerts, recently added, trending in community
- [ ] Search: filtered to Carnatic only, by artist / raga / type
- [ ] Video player: YouTube IFrame embed (ads still play — ToS compliant)
- [ ] Browse by Artist, Raga, Type (concert / lecture / kutcheri / bhajan / fusion)
- [ ] Anonymous use (no login required for browsing)
- [ ] Google login (optional)
- [ ] "Powered by YouTube" branding (required by YouTube API ToS)

### Phase 2 — Logged-In Features
- [ ] Watch history (saved per user in Supabase)
- [ ] Personal playlists / saved videos
- [ ] Recommendations:
  - "More from artists you watch" (built by us — simple)
  - YouTube Related Videos API filtered to Carnatic (free, no build needed)
  - "Others who watched X also watched Y" (collaborative filtering — later)
- [ ] Follow artists / channels

### Phase 3 — Teacher Tools (Monetization unlock)
- [ ] Teacher account type
- [ ] Create & share class playlists (assign to students)
- [ ] Students follow a teacher, get teacher's feed
- [ ] Timestamp annotations on videos ("listen to the gamakas at 2:34")
- [ ] Class activity feed ("your teacher assigned 3 new videos")

### Phase 4 — Premium / Monetization
- [ ] Free tier: full app with Google AdMob ads
- [ ] Student Premium ($1–2/month): ad-free + offline playlists
- [ ] Teacher account ($5/month): classroom tools
- [ ] Sponsored channels: Carnatic academies pay to feature their channel
- [ ] Affiliate links: instruments, books on Amazon

---

## 🛠️ Tech Stack

### Mobile App
| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React Native + Expo | iOS + Android, one codebase, JS ecosystem |
| Language | TypeScript | Type safety, easier to maintain |
| Styling | NativeWind (Tailwind for RN) | Fast, consistent UI |
| Navigation | Expo Router | File-based routing, clean |
| Video Player | react-native-youtube-iframe | Official YouTube IFrame wrapper for RN |
| Auth | Supabase Auth + Google OAuth | Built-in, free, no custom auth server |
| State | Zustand | Lightweight, simple |
| Data fetching | React Query (TanStack) | Caching, background refresh |
| Ads | Google AdMob (via Expo) | Free tier monetization |

### Backend
| Layer | Choice | Why |
|-------|--------|-----|
| Database | Supabase (PostgreSQL) | Free tier, auth built-in, realtime |
| Auth | Supabase Auth | Google OAuth out of the box |
| Cron jobs | Supabase pg_cron | Periodic YouTube API fetch, no extra service |
| API | Supabase auto-generated REST + Edge Functions | No separate server needed |
| Hosting | Supabase (managed) | Free tier sufficient for launch |

### Chrome Extension
| Layer | Choice | Why |
|-------|--------|-----|
| Language | Vanilla JS | No build step, simple |
| Manifest | V3 | Required by Chrome Web Store |
| API calls | YouTube Data API v3 | Same as app |

### External APIs
| API | Purpose | Cost |
|-----|---------|------|
| YouTube Data API v3 | Search, video metadata, channel info | Free (10k units/day) |
| YouTube IFrame API | Video playback | Free |
| YouTube Related Videos | Recommendations | Free (part of Data API) |
| Google OAuth | Login | Free |
| Google AdMob | Ads on free tier | Revenue share |

---

## 🗄️ Database Schema (Supabase / PostgreSQL)

```sql
-- Curated seed list of Carnatic artists/channels
artists (
  id, name, youtube_channel_id, channel_name,
  type (vocalist/instrumentalist/ensemble),
  tags[], verified, created_at
)

-- Cached videos from YouTube API fetches
videos (
  id, youtube_video_id, title, description,
  channel_id, channel_name, thumbnail_url,
  published_at, duration, view_count,
  raga, composer, artist_name, video_type,
  language, tags[], fetched_at
)

-- User profiles (extends Supabase auth.users)
profiles (
  id (= auth.users.id), display_name, avatar_url,
  account_type (student/teacher), created_at
)

-- Watch history (logged-in users only)
watch_history (
  id, user_id, video_id, watched_at, watch_duration_seconds
)

-- User playlists
playlists (
  id, user_id, name, description, is_public,
  is_class_playlist (for teachers), created_at
)

playlist_videos (
  id, playlist_id, video_id, added_at, note (teacher annotation)
)

-- Teacher → Student relationships
teacher_students (
  id, teacher_id, student_id, joined_at
)
```

---

## 🔄 Data Pipeline (How Videos Stay Fresh)

```
Seed List (artists table)
    ↓
Supabase pg_cron job (runs every 24 hours)
    ↓
Calls YouTube Data API v3:
  - Search: "{artist_name} carnatic" restricted to their channel_id
  - Fetches: new videos uploaded in last 24hrs
    ↓
Inserts/updates videos table
    ↓
App queries videos table (NOT raw YouTube API)
    → Saves quota
    → Guaranteed Carnatic results
    → Fast (own DB, not external API)
```

**YouTube API Quota math:**
- 10,000 units/day free
- 1 search = 100 units
- 100 artists × 1 search/day = 10,000 units (right at the limit)
- Solution: Batch smartly, only search top 80 channels daily, rotate the rest
- Or: Request quota increase from Google (free, just fill a form)

---

## 🌱 Curated Seed Artists (Starter List)

### Vocalists
- MS Subbulakshmi
- Sanjay Subrahmanyan
- T.M. Krishna
- Aruna Sairam
- Sudha Raghunathan
- Bombay Jayashri
- Nithyashree Mahadevan
- O.S. Arun
- Unnikrishnan
- Sowmya
- Ranjani & Gayatri
- Vijay Siva
- Maharajapuram Santhanam

### Instrumentalists
- L. Subramaniam (violin)
- Lalgudi Jayaraman (violin)
- M.S. Gopalakrishnan (violin)
- Mandolin U. Srinivas
- Kadri Gopalnath (saxophone)
- T.V. Gopalakrishnan (mridangam/vocal)
- Trichy Sankaran (mridangam)
- Umayalpuram Sivaraman (mridangam)
- Chitravina N. Ravikiran

### Key YouTube Channels
- Carnatica (channel)
- Music Academy Chennai
- Brahma Gana Sabha
- Kartik Fine Arts
- Narada Gana Sabha
- Shanmukhananda Fine Arts
- Sri Krishna Gana Sabha

---

## 📁 Project Structure

```
carnatic-app/
├── game-plan.md                  ← This file
├── mobile/                       ← React Native + Expo app
│   ├── app/                      ← Expo Router screens
│   │   ├── (tabs)/
│   │   │   ├── index.tsx         ← Home feed
│   │   │   ├── search.tsx        ← Search
│   │   │   ├── browse.tsx        ← Browse by raga/artist
│   │   │   └── profile.tsx       ← User profile
│   │   ├── video/[id].tsx        ← Video player screen
│   │   └── _layout.tsx
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase.ts           ← Supabase client
│   │   └── youtube.ts            ← YouTube API helpers
│   ├── data/
│   │   └── seed-artists.ts       ← Curated artist list
│   └── package.json
├── backend/                      ← Supabase config + cron scripts
│   ├── supabase/
│   │   ├── migrations/           ← DB schema migrations
│   │   └── functions/            ← Edge functions
│   └── scripts/
│       └── fetch-videos.ts       ← Manual trigger for cron job
├── extension/                    ← Chrome Extension
│   ├── manifest.json
│   ├── content.js                ← Intercepts YouTube search
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   └── data/
│       └── carnatic-channels.js  ← Channel ID list for extension
└── .gitignore
```

---

## 🚀 Build Order

### Step 1: Setup (Day 1)
- [x] Create project directory + game-plan.md
- [x] Create private GitHub repo, push initial commit
- [ ] Create Supabase project
- [ ] Get YouTube Data API v3 key
- [ ] Set up .env files (never commit these)

### Step 2: Backend (Day 1–2)
- [ ] Write Supabase DB schema migrations
- [ ] Seed the artists table with starter list
- [ ] Write YouTube API fetch script
- [ ] Set up pg_cron job (daily fetch)
- [ ] Test: verify videos are being fetched and stored

### Step 3: Mobile App — Core (Day 3–7)
- [ ] Init Expo project with TypeScript
- [ ] Set up Supabase client + React Query
- [ ] Home screen (featured videos from DB)
- [ ] Search screen (query videos table)
- [ ] Video player screen (YouTube IFrame)
- [ ] Browse screen (by artist, raga, type)

### Step 4: Mobile App — Auth (Day 7–8)
- [ ] Google login via Supabase Auth
- [ ] User profile screen
- [ ] Watch history (save on video open)
- [ ] Basic recommendations (same artist/raga as watched)

### Step 5: Chrome Extension (Day 9–10)
- [ ] manifest.json (MV3)
- [ ] Content script: intercept YouTube search
- [ ] Replace results with Carnatic-filtered results (call our backend)
- [ ] Popup: on/off toggle

### Step 6: Teacher Tools (Week 3+)
- [ ] Teacher account type in profiles
- [ ] Create class playlist UI
- [ ] Student follows teacher flow
- [ ] Assigned videos appear in student's home feed

### Step 7: Polish + Launch
- [ ] App icon + splash screen
- [ ] App Store / Play Store screenshots
- [ ] Submit to Google Play ($25)
- [ ] Submit to Apple App Store ($99/year)
- [ ] Request YouTube API quota increase

---

## 🔐 Secrets & Environment Variables

**Never commit these — use .env files**

```
YOUTUBE_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  (backend only, never in mobile app)
GOOGLE_CLIENT_ID=...           (for OAuth)
```

---

## ⚖️ Legal Checklist

- [x] Using official YouTube Data API v3 (not scraping)
- [x] Using YouTube IFrame API for playback (not extracting streams)
- [x] Not circumventing ads
- [ ] Show "Powered by YouTube" branding in app
- [ ] Link videos back to YouTube
- [ ] Include YouTube ToS compliance in app's own ToS
- [ ] Privacy policy (required for App Store + Google login)
- [ ] COPPA compliance (app targets minors — kids/teens, keep data collection minimal)

---

## 💰 Monetization Roadmap

| Phase | Feature | Revenue |
|-------|---------|---------|
| Launch | Google AdMob (free users) | ~$20–50/mo passive |
| Month 2+ | Student Premium $1.99/mo | Ad-free + offline playlists |
| Month 3+ | Teacher accounts $4.99/mo | Classroom tools |
| Year 2 | Sponsored channels | Academy partnerships |
| Year 2 | Affiliate (instruments/books) | Amazon affiliate |

---

## 📝 Decisions Log

- **Feb 2026:** React Native + Expo over Flutter (JS consistency with extension, faster to start)
- **Feb 2026:** No custom web app — mobile first, Chrome extension as browser secondary
- **Feb 2026:** Backend is Supabase, not Firebase (better SQL, built-in cron, generous free tier)
- **Feb 2026:** Content sourced from YouTube (not licensed) — keeps costs at $0, always fresh
- **Feb 2026:** Curated list approach (not open search) — quality over quantity, no non-Carnatic leakage
- **Feb 2026:** Teacher account model identified as primary monetization path
- **Feb 2026:** Competitors assessed — Carnatic Music Vault (abandoned, Android only) and Saregama Classical (5 years stale) are not real threats. Market gap confirmed.
