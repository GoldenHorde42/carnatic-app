# Carnatic App — Complete Handoff Document

> **Purpose:** Drop this file into any new chat or agent session. It contains everything  
> needed to continue development without losing context.  
> **Last updated:** Feb 2026

---

## What This Project Is

A **Carnatic music discovery app** for music students (kids, teens, adults) and their teachers.
It wraps YouTube's Carnatic music library with curated search, raga/artist browsing, mood-based
recommendations, and (coming soon) teacher tools for playlist assignment.

**Two products:**
1. **Mobile app** — iOS + Android, built with React Native + Expo (PRIMARY)
2. **Chrome extension** — filters YouTube.com search results to Carnatic only (SECONDARY, not built yet)

**Stack summary:** React Native (Expo) → Supabase Edge Functions → PostgreSQL (Supabase) ↔ YouTube Data API v3  
**LLM for search:** Groq (llama-3.3-70b-versatile)  
**GitHub repo:** Private — `git@github.com:<gouthamswaminathan>/carnatic-app.git`

---

## Current Status (as of Feb 2026)

### ✅ Done and working
| Thing | Detail |
|-------|--------|
| Database schema | 8 tables deployed to Supabase (see §Database) |
| Artist seed data | 66 curated Carnatic artists in `artists` table |
| Raga catalog | 120 ragas (72 melakartas + 48 janya ragas) in `ragas` table |
| Video library | **641 videos** fetched and stored from YouTube |
| `fetch-videos` Edge Function | 3-tier YouTube ingestion strategy, deployed |
| `search` Edge Function | LLM-powered search with deterministic pre-parser, deployed |
| `recommend` Edge Function | Personalised recommendations (watch history), deployed |
| Mobile app | All 5 screens built and running: Home, Search, Browse, Profile, Player |
| YouTube player | Embeds YouTube video in-app via react-native-youtube-iframe |
| Dark mode UI | YouTube-style dark mode, "Powered by YouTube" attribution |
| Search quality | 11/11 test cases passing (artist, raga, mood, composer, instrument) |
| Expo Go testing | App runs on physical phone via Expo Go |

### ⚠️ Partially done
| Thing | Status | Notes |
|-------|--------|-------|
| Google OAuth login | UI built, hook written | `GOOGLE_CLIENT_ID` needs to be added to Supabase secrets + configured for mobile |
| Recommendations | Logic deployed | Works for logged-in users; anonymous users see popular videos by view count |
| Raga tagging | 33/641 videos tagged | Most videos get raga from title parsing; need LLM enrichment pass |
| Daily video refresh | Edge function ready | Needs cron job set up (see §Cron) |

### ❌ Not started
- Chrome extension
- App Store / Google Play submission (next major milestone)
- AdMob integration
- Premium tier (RevenueCat)
- Teacher tools (Phase 3)

---

## Project Directory Layout

```
carnatic-app/
├── SETUP.md                              ← This file
├── game-plan.md                          ← Full product design + roadmap
├── .env.example                          ← Template for all secrets
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── supabase/
│   │   ├── config.toml                   ← db.major_version = 17 (important!)
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql    ← Core tables, RLS, triggers
│   │   │   ├── 002_seed_artists.sql      ← 66 Carnatic artists
│   │   │   ├── 003_book_artists_ragas.sql← 72 melakartas + 48 janya ragas
│   │   │   ├── 004_fix_channel_ids.sql   ← Corrected YouTube channel IDs
│   │   │   ├── 005_watch_history.sql     ← Enriched watch_history table
│   │   │   └── 006_artist_search_meta.sql← fetch_strategy, search_aliases, is_deceased
│   │   └── functions/
│   │       ├── search/index.ts           ← LLM search (Groq 70B)
│   │       ├── fetch-videos/index.ts     ← YouTube video ingestion
│   │       └── recommend/index.ts        ← Recommendation engine
│   └── scripts/
│       ├── fetch-videos.ts               ← Local version (not used in prod)
│       └── fix-channel-ids.ts            ← One-time channel ID fixer (done)
│
└── mobile/
    ├── app.json                          ← Expo config (bundle ID, plugins)
    ├── package.json
    ├── app/                              ← Expo Router screens
    │   ├── _layout.tsx                   ← Root layout + auth guard
    │   ├── (tabs)/
    │   │   ├── _layout.tsx               ← Tab bar (Home/Search/Browse/Profile)
    │   │   ├── index.tsx                 ← Home screen (mood chips + recommendations)
    │   │   ├── search.tsx                ← Search screen (NL search + quick filters)
    │   │   ├── browse.tsx                ← Browse by artist / raga
    │   │   └── profile.tsx               ← Google sign-in / sign-out
    │   └── player/[videoId].tsx          ← YouTube video player screen
    ├── components/
    │   └── VideoCard.tsx                 ← Reusable video thumbnail card (16:9)
    ├── hooks/
    │   └── useAuth.ts                    ← Google OAuth + Supabase session hook
    └── lib/
        ├── supabase.ts                   ← Supabase JS client init
        ├── api.ts                        ← All API calls (Edge Functions + DB queries)
        └── theme.ts                      ← YouTube dark-mode colour palette
```

---

## All External Services & Credentials

### 1. Supabase (Database + Auth + Edge Functions)
- **Project ID:** `lyvbiiogdaoeawakoxgf`
- **Project URL:** `https://lyvbiiogdaoeawakoxgf.supabase.co`
- **Dashboard:** [supabase.com/dashboard/project/lyvbiiogdaoeawakoxgf](https://supabase.com/dashboard/project/lyvbiiogdaoeawakoxgf)
- **Keys:** Settings → API in the dashboard
  - `SUPABASE_URL` = `https://lyvbiiogdaoeawakoxgf.supabase.co`
  - `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (in `.env`)
  - `SUPABASE_SERVICE_ROLE_KEY` = secret, in `.env`, **never commit**
- **CLI auth:** Needs a Personal Access Token from [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) (format: `sbp_...`)
- **Plan:** Free tier (500 MB DB, 500K edge function calls/month)
- **PostgreSQL version:** 17

### 2. YouTube Data API v3
- **Console:** [console.cloud.google.com](https://console.cloud.google.com) → Project: "carnatic-app" (or similar)
- **Key:** stored as `YOUTUBE_API_KEY` in `.env` and in Supabase secrets
- **Daily quota:** 10,000 units (free). Quota increase request submitted — awaiting approval.
- **Quota cost:** search.list = 100 units per call; videos.list = 1 unit per call
- **Key API endpoints used:**
  - `search.list` — find videos by channel or keyword
  - `videos.list` — fetch video details (duration, view count)
  - `playlistItems.list` — list uploads from a channel's uploads playlist

### 3. Groq (LLM for search intent parsing)
- **Console:** [console.groq.com](https://console.groq.com)
- **Key:** stored as `GROQ_API_KEY` in `.env` and Supabase secrets
- **Current plan:** Dev (upgraded from free) — higher rate limits
- **Model in use:** `llama-3.3-70b-versatile` (70B, better quality than 8B)
- **Used in:** `backend/supabase/functions/search/index.ts`
- **API:** OpenAI-compatible at `https://api.groq.com/openai/v1/chat/completions`

### 4. Google OAuth (for user login)
- **Console:** [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
- **Current state:** OAuth client created for web; mobile client (`GOOGLE_CLIENT_ID`) needs to be added to Supabase Auth settings
- **Needed for mobile:**
  - iOS: OAuth client for iOS app (needs bundle ID from `app.json`)
  - Android: OAuth client for Android (needs SHA-1 fingerprint from keystore)
  - Add both client IDs to Supabase: Auth → Providers → Google

### 5. GitHub (version control)
- **Repo:** Private, owned by gouthamswaminathan
- **Branch:** `main`
- **Remote:** `git@github.com:gouthamswaminathan/carnatic-app.git`

---

## Environment Variables

### `.env` (backend — never commit)
```
SUPABASE_URL=https://lyvbiiogdaoeawakoxgf.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
YOUTUBE_API_KEY=AIza...
GROQ_API_KEY=gsk_...
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
```

### Supabase Edge Function Secrets (set once via CLI)
```bash
cd backend
supabase secrets set \
  YOUTUBE_API_KEY="AIza..." \
  GROQ_API_KEY="gsk_..." \
  SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
  --project-ref lyvbiiogdaoeawakoxgf
```

### Mobile `.env` (uses `EXPO_PUBLIC_` prefix for client-safe vars)
```
EXPO_PUBLIC_SUPABASE_URL=https://lyvbiiogdaoeawakoxgf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Key Commands

### Supabase CLI
```bash
# Authenticate (token from supabase.com/dashboard/account/tokens → format: sbp_...)
supabase login

# Link local repo to live project
cd backend && supabase link --project-ref lyvbiiogdaoeawakoxgf

# Deploy an Edge Function
supabase functions deploy search --project-ref lyvbiiogdaoeawakoxgf
supabase functions deploy fetch-videos --project-ref lyvbiiogdaoeawakoxgf
supabase functions deploy recommend --project-ref lyvbiiogdaoeawakoxgf

# Push a new DB migration
supabase db push

# Mark old migrations as already applied (only needed if migration was run manually in dashboard)
supabase migration repair --status applied 001
supabase migration repair --status applied 002
supabase migration repair --status applied 003
```

### Video seeding (run when YouTube quota resets at midnight Pacific)
```bash
# Full seed — fetches up to 50 videos per artist (uses ~6,600 quota units)
curl -X POST "https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos?seed=true" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"

# Incremental — fetches videos from last N days (for daily cron)
curl -X POST "https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos?days=3" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"
```

### Mobile app
```bash
cd mobile
npm install
npx expo start          # Start dev server — scan QR with Expo Go (disable VPN first!)
npx expo start --clear  # Clear Metro cache (use after installing new native packages)
```

### Test the search function directly
```bash
curl -X POST "https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/search" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"query": "Bombay Jayashri", "limit": 5}'
```

---

## Database Tables (current state)

| Table | Rows | Purpose |
|-------|------|---------|
| `artists` | 66 | Curated Carnatic artists with YouTube channel IDs |
| `ragas` | 120 | Carnatic ragas with aliases and melakarta info |
| `videos` | 641 | YouTube videos (fetched + cached) |
| `profiles` | 0 | User profiles (populated on first Google login) |
| `watch_history` | 0 | Per-user watch history (populated on video play) |
| `playlists` | 0 | User playlists |
| `playlist_videos` | 0 | Videos in playlists |
| `teacher_students` | 0 | Teacher–student relationships |
| `fetch_log` | 0 | Log of fetch-videos runs |

### Key columns to know
```sql
-- artists
youtube_channel_id  -- YouTube channel ID (Tier 1 fetch)
fetch_strategy      -- 'channel' | 'sabha_search' | 'global_search'
search_aliases      -- text[] — alternate names for deceased artists
is_deceased         -- bool — triggers broader archival search

-- videos
youtube_video_id    -- e.g. "dQw4w9WgXcQ"
artist_name         -- denormalized from artists table
raga                -- null for most; 33 videos tagged so far
is_visible          -- bool — false hides from app
view_count          -- cached from YouTube; used for sorting
```

---

## Architecture: How the App Works

```
User opens app
    ↓
Home screen → calls /recommend Edge Function
    → if logged in:  looks at watch_history → finds top artists/ragas → returns similar videos
    → if anonymous:  returns top 20 videos by view_count

User types in Search
    ↓
/search Edge Function
    ↓
1. Pre-parser (deterministic, ~30 known artist names + 16 mood keywords)
   → if match: returns intent instantly (no LLM, no latency)
2. If no pre-parser match: Groq llama-3.3-70b-versatile (2× retry, 5s timeout)
   → returns structured intent: { artist, raga, ragas[], mood, tala, composer }
3. DB query on videos table with intent filters
4. If 0 results: broad fallback — searches longest term in title + artist_name
    ↓
Returns sorted by view_count DESC

User taps video
    ↓
Player screen → react-native-youtube-iframe embeds YouTube player
    → logs to watch_history (if logged in)
    → YouTube ads play normally (ToS compliant)
```

---

## Search Function: Critical Gotchas

1. **PostgREST `.or()` with dotted names silently fails.**  
   `query.or("artist_name.ilike.%T.M. Krishna%")` — the dots in `T.M.` are parsed as field separators.  
   **Fix:** Always use `query.ilike("artist_name", "%T.M. Krishna%")` for artist name filtering.

2. **Groq is non-deterministic for short queries** ("TM Krishna" sometimes returns keywords, not artist).  
   **Fix:** The pre-parser handles all 30 known artists deterministically before hitting Groq.

3. **`video_type` column is mostly null** — DO NOT filter on it or results will be 0.  
   Most videos fetched via YouTube have `video_type = 'other'` (default). The LLM still extracts this field from queries but we intentionally ignore it in the DB query.

4. **Mood search requires raga tagging** to work well. Currently only 33/641 videos have `raga` set.  
   The mood fallback also searches raga names in video *titles* as a workaround. Will improve as more videos get tagged.

---

## fetch-videos: 3-Tier Strategy

```
For each artist in artists table:

Tier 1 — artist has youtube_channel_id:
  → YouTube playlistItems.list on their uploads playlist
  → Gets their own uploaded content
  → Most reliable, 1 unit per page

Tier 2 — artist has no channel (or fetch_strategy = 'sabha_search'):
  → YouTube search.list restricted to trusted sabha channels:
    Music Academy Madras, Brahma Gana Sabha, Narada Gana Sabha,
    Kartik Fine Arts, Carnatica, Manorama Music
  → 100 units per search

Tier 3 — deceased/archival artist (is_deceased = true OR fetch_strategy = 'global_search'):
  → Global YouTube search with search_aliases
  → Strict title filtering to avoid non-Carnatic results
  → 100 units per search
```

**Quota mode:**
- `?seed=true` — 50 videos per artist, no date filter (initial load, ~6,600 units)
- `?days=N` — only videos from last N days (daily cron, much lower quota)
- `?artist=name` — single artist only (debugging)

---

## Pending Setup Tasks (needed before App Store)

### 1. Google OAuth for Mobile — REQUIRED for login to work on real devices
```
Google Cloud Console → APIs & Services → Credentials → Create OAuth Client
  → iOS: Application type = iOS, Bundle ID = com.gouthamswaminathan.carnaticapp
  → Android: Application type = Android, Package = com.gouthamswaminathan.carnaticapp
              SHA-1 = from `eas credentials` after configuring EAS
Then:
  Supabase Dashboard → Auth → Providers → Google
  → Add both client IDs
  → Add redirect URL: com.gouthamswaminathan.carnaticapp://auth/callback
```

### 2. Daily Cron Job — keeps video library fresh
```sql
-- Run in Supabase SQL editor (requires pg_cron extension, already available on Supabase)
SELECT cron.schedule(
  'daily-fetch-videos',
  '0 6 * * *',   -- 6 AM UTC daily (midnight Pacific)
  $$
  SELECT net.http_post(
    url := 'https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos?days=2',
    headers := '{"Authorization": "Bearer <SUPABASE_ANON_KEY>"}'::jsonb
  );
  $$
);
```

### 3. Groq API key in Supabase Secrets — verify it's set
```bash
supabase secrets list --project-ref lyvbiiogdaoeawakoxgf
# Should show GROQ_API_KEY, YOUTUBE_API_KEY, SUPABASE_SERVICE_ROLE_KEY
```

---

## Publishing Checklist (Next Major Milestone)

### One-time accounts
- [ ] Apple Developer Program — $99/year at [developer.apple.com/programs](https://developer.apple.com/programs)
- [ ] Google Play Console — $25 one-time at [play.google.com/console](https://play.google.com/console)

### Assets to create
- [ ] App icon: 1024×1024 PNG, no alpha, no rounded corners (EAS handles resizing)
- [ ] Splash screen: 1284×2778 PNG
- [ ] Screenshots: iPhone 6.5" (1284×2778), iPhone 5.5" (1242×2208) + Android 16:9
- [ ] Short description (80 chars): "Carnatic music discovery app for students and teachers"
- [ ] Full description (~4000 chars)
- [ ] Privacy Policy URL (required) — simple page, can host on GitHub Pages

### Build & Submit with EAS
```bash
npm install -g eas-cli
cd mobile
eas login          # Expo account login
eas build:configure   # creates eas.json

# Production builds (runs in cloud — no Xcode/Android Studio needed)
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit
eas submit --platform ios      # uploads to App Store Connect
eas submit --platform android  # uploads to Google Play Console
```

### Legal requirements
- [x] "Powered by YouTube" shown in app (Home screen footer + Profile screen)
- [ ] Privacy Policy hosted at a public URL
- [ ] App description mentions YouTube API usage
- [ ] Link to YouTube Terms of Service in app's own Terms
- [ ] COPPA note: app collects minimal data; under-13 users use anonymously

---

## Known Issues & Tech Debt

| Issue | Severity | Fix |
|-------|----------|-----|
| Only 33/641 videos have raga metadata | Medium | Run LLM enrichment pass on all video titles post quota increase |
| Google OAuth not wired to mobile OAuth clients | High | Set up before app store submission |
| No daily cron job yet | Medium | SQL snippet above, run in Supabase SQL editor |
| Bombay Jayashri channel has mostly film/pop content | Low | Add `is_carnatic` filter or manual curation pass |
| `fetch_log` table is empty | Low | The edge function currently doesn't insert logs (race condition with timeout) |

---

## Quick Decisions Reference

| Decision | What we chose | Why |
|----------|--------------|-----|
| Mobile framework | React Native + Expo | One codebase for iOS + Android; JS consistency |
| Backend | Supabase | PostgreSQL + auth + edge functions + generous free tier |
| Video source | YouTube Data API (not licensed audio) | Always fresh, $0 content cost, massive library |
| LLM | Groq 70B | Fast inference, generous free tier, OpenAI-compatible |
| Content strategy | Curated artist list | Quality control — no non-Carnatic content leaks |
| Auth | Google OAuth via Supabase | Target users already have Google accounts |
| Monetization | AdMob free tier → premium subscriptions | Low barrier for students, teacher tier pays |
