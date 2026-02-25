# Carnatic App — Complete Handoff Document

> **For the AI agent reading this:**
> This file is the single source of truth for the project.
> - **Read this file first** before doing anything.
> - **Update this file** at the end of every session with what you changed, what is now done, and anything the next agent needs to know.
> - Keep the "Current Status" table and "What Was Done Last Session" section current.
> - Never let this file fall out of date.
>
> **Last updated:** Feb 25, 2026 (recommend fix; video ingestion batching; Build #7 submitted to TestFlight)

---

## What This Project Is

A **Carnatic music discovery app** for music students (kids, teens, adults) and their teachers.
It wraps YouTube's Carnatic music library with curated search, raga/artist browsing, mood-based
recommendations, and (coming soon) teacher tools for playlist assignment.

**Two products:**
1. **Mobile app** — iOS + Android, built with React Native + Expo **(PRIMARY — active development)**
2. **Chrome extension** — filters YouTube.com to Carnatic results only **(SECONDARY — not started yet)**

**Stack:**
- Frontend: React Native + Expo + Expo Router
- Backend: Supabase Edge Functions (Deno/TypeScript)
- Database: PostgreSQL on Supabase
- Video source: YouTube Data API v3
- LLM (search intent): Groq `llama-3.3-70b-versatile`
- Build & deploy: EAS (Expo Application Services)

**GitHub repo:** Private — `git@github.com:GoldenHorde42/carnatic-app.git`  
**Branch:** `main`

---

---

## ⚠️ Current Release Status (IMPORTANT — read before doing anything)

| Platform | Status | Detail |
|----------|--------|--------|
| **iOS** | 🟡 **TestFlight only — NOT live in App Store** | Build 7 submitted to TestFlight. Screenshots, App Review Info, and App Store submit still pending. |
| **Android** | 🔴 **Not started** | Google Play Console sign-up pending ($25). Also need a physical Android phone to test + take screenshots. |
| **YouTube API quota** | 🟡 **10,000 units/day (free tier)** | Quota increase form submitted. Google also requested a demo video (see "Pending Work" below). |
| **App Store** | 🔴 **Not submitted** | All listing content is filled in App Store Connect, but no submission yet. |

---

## 🗺️ Where Is Everything Configured? (Master Map)

This is a single reference for every external service and exactly where each thing was set up.
If you're a new agent, check here first before searching consoles blindly.

### Cloudflare — [dash.cloudflare.com](https://dash.cloudflare.com)
**Account:** Goutham's personal Cloudflare account
| What | Where in Cloudflare | Detail |
|------|---------------------|--------|
| Domain registration | Registrar → `carnaticapp.org` | Purchased here. Auto-renews. |
| DNS → Netlify | DNS → Records → CNAME `@` → `apex-loadbalancer.netlify.com` | Points the root domain to Netlify for privacy policy hosting |
| DNS → Netlify www | DNS → Records → CNAME `www` → `sparkly-raindrop-0e77bb.netlify.app` | www redirect |
| Email forwarding | Email → Email Routing → Rule: `support@carnaticapp.org` → `goutham.swaminathan@rutgers.edu` | Forwards support emails to personal inbox. Had to enable Email Routing manually (was disabled by default). |

### Netlify — [app.netlify.com](https://app.netlify.com)
**Account:** Goutham's personal Netlify account (free tier)
| What | Where in Netlify | Detail |
|------|-----------------|--------|
| Site | Sites → `sparkly-raindrop-0e77bb` (Site ID: `31c07e19-1225-42eb-b297-565ae45a9787`) | Hosts `docs/` folder from this repo |
| Custom domain | Site → Domain settings → `carnaticapp.org` | DNS managed on Cloudflare (see above) |
| Privacy policy URL | Auto-served | `https://carnaticapp.org/privacy.html` — the `docs/privacy.html` file |
| Deploy command | CLI: `npx netlify-cli deploy --prod --dir=docs --site=31c07e19-1225-42eb-b297-565ae45a9787` | Run from repo root after changing `docs/privacy.html` |

### Google Cloud Console — [console.cloud.google.com](https://console.cloud.google.com)
**Project:** `carnatic-app` (Project number: `298276742704`)
| What | Where in Google Cloud | Detail |
|------|----------------------|--------|
| YouTube Data API v3 | APIs & Services → Enabled APIs → YouTube Data API v3 | Key stored in Supabase Edge Function secrets and `.env` |
| YouTube API key | APIs & Services → Credentials → API Keys | Key name: "YouTube Data API Key" |
| OAuth consent screen | APIs & Services → OAuth consent screen | App name: Carnatic App; Privacy URL: `https://carnaticapp.org/privacy.html` |
| Android OAuth client | APIs & Services → Credentials → OAuth 2.0 Client IDs | `298276742704-mue9um64sv808up3ehfudct13ma8bbdi.apps.googleusercontent.com` |
| iOS OAuth client | APIs & Services → Credentials → OAuth 2.0 Client IDs | `298276742704-o8c0k7i2l5fefjdvphdntsvrl8c43pjg.apps.googleusercontent.com` |
| Quota increase | APIs & Services → YouTube Data API v3 → Quotas → Edit | Form submitted. Google also sent an email requesting a demo video — see "Pending Work". |

### Supabase — [supabase.com/dashboard/project/lyvbiiogdaoeawakoxgf](https://supabase.com/dashboard/project/lyvbiiogdaoeawakoxgf)
| What | Where in Supabase | Detail |
|------|------------------|--------|
| Database tables + RLS | Table Editor / SQL Editor | All 8 tables, migrations 001–007 |
| Edge Functions deployed | Edge Functions tab | `search`, `fetch-videos`, `recommend` |
| Edge Function secrets (API keys) | Project Settings → Edge Functions → Secrets | `YOUTUBE_API_KEY`, `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Google OAuth provider | Authentication → Providers → Google | Web client ID + secret pasted here. Redirect URL: `carnatic://auth/callback` |
| Site URL | Authentication → URL Configuration → Site URL | `http://localhost:3000` (dev) |
| Redirect URLs | Authentication → URL Configuration → Redirect URLs | `carnatic://auth/callback` |
| Anon key / Service role key | Project Settings → API | Keys used by mobile app and Edge Functions |
| Daily cron job | SQL Editor → run `007_daily_cron.sql` | Calls `fetch-videos?days=2` at 6 AM UTC daily via pg_cron + pg_net |

### Expo / EAS — [expo.dev/accounts/gouthamswa](https://expo.dev/accounts/gouthamswa)
| What | Where in EAS | Detail |
|------|-------------|--------|
| Project | Projects → `carnatic-app` | EAS Project ID: `b9d3fc2f-75a2-417c-ac06-0008b32a3baa` |
| Env vars (injected into builds) | `mobile/eas.json` → `env` blocks | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, OAuth client IDs |
| iOS distribution cert | Credentials → iOS → Distribution Certificate | Serial `D9258157D7DE75F72E1E617AADD50D4`, expires Feb 2027 |
| iOS provisioning profile | Credentials → iOS → Provisioning Profile | ID `2Y3623H4BU`, expires Feb 2027 |
| Android keystore | Credentials → Android → `Build Credentials qxxqgNzviO` | SHA-1: `29:BA:9E:47:47:B7:C8:CC:22:01:F8:D4:E0:2A:DE:E1:CC:C7:8E:0E` |
| Builds | Builds tab | Build 3 = search fix. Build 4 in progress = auth anon key fix. |

### Apple App Store Connect — [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
**Apple ID:** `goutham.swaminathan@rutgers.edu` | **Team ID:** `BUGP3Q42UY`
| What | Where | Detail |
|------|-------|--------|
| App | My Apps → Carnatic App (App ID: `6759589334`) | Created, all listing fields filled |
| Bundle ID | Certificates, Identifiers & Profiles → Identifiers | `com.carnaticapp.music` |
| TestFlight | TestFlight tab → Builds | Build 3 installed via TestFlight link |
| Pricing | App Store → Pricing and Availability | $0.99 |
| Privacy policy | App Information → Privacy Policy URL | `https://carnaticapp.org/privacy.html` |
| ⚠️ Screenshots | App Store → 1.0 Prepare for Submission | **PENDING** — must be taken from TestFlight on real iPhone |
| ⚠️ App Review Info | App Store → 1.0 → App Review Information | **PENDING** |
| ⚠️ Submission | — | **NOT SUBMITTED** — waiting for screenshots + review info |

### Groq — [console.groq.com](https://console.groq.com)
| What | Where | Detail |
|------|-------|--------|
| API key | API Keys section | Stored in Supabase Edge Function secrets as `GROQ_API_KEY` |
| Plan | Billing | Dev tier (upgraded from free) |
| Model in use | Hardcoded in `search/index.ts` | `llama-3.3-70b-versatile` |

### GitHub — [github.com/GoldenHorde42/carnatic-app](https://github.com/GoldenHorde42/carnatic-app)
| What | Detail |
|------|--------|
| Visibility | **Public** — made public so YouTube API team can review code for quota increase |
| Branch | `main` — always push here |
| Secrets in repo? | No — all keys are in `.env` (gitignored) and Supabase secrets. `SETUP.md` only has placeholder descriptions, not real key values. |

---

## What Was Done Last Session (Feb 2026 — Publishing Setup)

The following was implemented to prepare the app for App Store / Google Play submission:

1. **`mobile/app.json`** — Updated with:
   - Bundle ID changed to `com.carnaticapp.music` (both iOS `bundleIdentifier` and Android `package`)
   - `buildNumber: "1"` and `versionCode: 1` set for first release
   - iOS `infoPlist` added with required privacy usage descriptions
   - iOS `privacyManifests` added (required for App Store since iOS 17.2)
   - `description`, `keywords` for store metadata
   - `extra.eas.projectId` placeholder added (must be filled in after `npx eas-cli init`)

2. **`mobile/eas.json`** — Created from scratch with:
   - `development`, `preview`, `production` build profiles
   - `env` blocks in all profiles with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `submit` block with placeholders for Apple and Google Play submission config

3. **`mobile/lib/supabase.ts`** — Updated to read from `EXPO_PUBLIC_` env vars with hardcoded fallbacks (so Expo Go still works without a .env file)

4. **`mobile/hooks/useAuth.ts`** — Updated OAuth redirect URL to `com.carnaticapp.music://auth/callback` (matches the new bundle ID); added `prompt: 'select_account'` to Google OAuth options

5. **`mobile/app/auth/callback.tsx`** — New file. Handles the deep-link after Google OAuth redirect. Waits 500ms for Supabase to pick up the session, then navigates to home (or profile on failure)

6. **`mobile/app/_layout.tsx`** — Registered `auth/callback` and `privacy` routes with modal presentation

7. **`mobile/app/privacy.tsx`** — New file. Full Privacy Policy screen covering:
   - What data is collected (account info, watch history, analytics)
   - YouTube API data usage disclosure
   - COPPA compliance note (students under 13)
   - Data retention (12 months watch history, 24 months analytics)
   - User rights and deletion procedure
   - Contact email: `support@carnaticapp.music`

8. **`mobile/app/(tabs)/profile.tsx`** — Added Privacy Policy link in both signed-in and signed-out states

9. **`mobile/assets/icon.svg`** + **`mobile/assets/splash.svg`** — SVG source files for the app icon (dark purple + red play button + "CARNATIC" wordmark). Must be exported to PNG before store submission.

10. **`mobile/scripts/generate-icons.js`** — Node script that writes the SVG source files. Run with `node scripts/generate-icons.js`.

All changes committed and pushed to `main` with commit `62c0bc8`.

---

## Current Status (as of Feb 2026)

### ✅ Done and working
| Thing | Detail |
|-------|--------|
| Database schema | 8 tables deployed to Supabase (artists, videos, profiles, watch_history, playlists, playlist_videos, teacher_students, fetch_log) |
| Artist seed data | 66 curated Carnatic artists in `artists` table |
| Raga catalog | 120 ragas (72 melakartas + 48 janya ragas) in `ragas` table |
| Video library | ~641 videos fetched and stored from YouTube |
| `fetch-videos` Edge Function | 3-tier YouTube ingestion strategy, deployed to Supabase |
| `search` Edge Function | LLM-powered search with deterministic pre-parser, deployed |
| `recommend` Edge Function | Personalised recommendations (watch history), deployed |
| Mobile app screens | Home, Search, Browse, Profile, Video Player — all built |
| YouTube player | Embeds via `react-native-youtube-iframe`; YouTube ads play normally (ToS compliant) |
| Dark mode UI | YouTube-style dark mode, "Powered by YouTube" attribution everywhere |
| Search quality | 11/11 test cases passing (artist, raga, mood, composer, instrument queries) |
| Expo Go testing | App runs on physical phone via Expo Go (scan QR; VPN must be OFF) |
| EAS config | `eas.json` created, `app.json` updated with bundle IDs, build numbers |
| Privacy Policy | In-app privacy policy screen at `/privacy` |
| Auth callback | Deep-link handler at `/auth/callback` for Google OAuth redirect |
| Bundle IDs | `com.carnaticapp.music` (iOS + Android) |
| Env vars | `EXPO_PUBLIC_` vars wired in `eas.json` for all build profiles |

### ⚠️ Partially done
| Thing | Status | What's left |
|-------|--------|-------------|
| Google OAuth — Android | ✅ Android client created and wired in | iOS client still needed (requires Apple Team ID — get after Apple Developer enrollment) |
| iOS OAuth client | Blocked | Create after Apple Developer enrollment; add Team ID + bundle ID `com.carnaticapp.music`; paste iOS client ID into `useAuth.ts → IOS_CLIENT_ID` and `eas.json → EXPO_PUBLIC_IOS_CLIENT_ID` |
| Supabase Google Auth | Needs Android client ID pasted in | Go to Supabase → Auth → Providers → Google → paste `298276742704-mue9um64sv808up3ehfudct13ma8bbdi.apps.googleusercontent.com` |
| Recommendations | Logic deployed | Works for logged-in users; anonymous users see popular videos by view_count |
| Raga tagging | ~33/641 videos tagged | Need LLM enrichment pass after YouTube quota increase is approved |
| Daily video refresh | SQL migration created (`007_daily_cron.sql`) | Run `007_daily_cron.sql` in Supabase SQL Editor (enable pg_cron + pg_net extensions first) |
| GitHub Pages (Privacy Policy) | `docs/privacy.html` committed | Enable in repo Settings → Pages → branch: main, folder: /docs |

### ✅ Done in last session (Feb 2026)
| Thing | Detail |
|-------|--------|
| App icons | All 4 PNGs generated (icon, adaptive-icon, splash-icon, favicon) via `scripts/build-icons.js` |
| Privacy Policy HTML | `docs/privacy.html` — ready to publish via GitHub Pages |
| Privacy Policy URL | Hardcoded as `https://goldenhorde42.github.io/carnatic-app/privacy` in `app.json` and `privacy.tsx` |
| Cron job SQL | `backend/supabase/migrations/007_daily_cron.sql` — paste into Supabase SQL Editor |
| Store listing content | `store-listing.md` — all App Store + Play Store copy, keywords, screenshot guide |
| EAS `eas.json` | Created with dev/preview/production profiles + env vars |
| Auth callback route | `app/auth/callback.tsx` handles Google OAuth deep-link |
| In-app Privacy Policy | `app/privacy.tsx` — full policy screen, linked from Profile tab |

### ❌ Not started (user must do these — require payment/enrollment)
- **Step 5:** Apple Developer Account ($99/year) → [developer.apple.com/programs](https://developer.apple.com/programs) — **start today, takes 48h**
- **Step 6:** Google Play Console Account ($25 one-time) → [play.google.com/console](https://play.google.com/console)
- EAS Build (blocked by Steps 5/6)
- App Store Connect listing + screenshots
- AdMob integration (monetization Phase 2)
- Premium tier / RevenueCat (monetization Phase 3)
- Chrome extension
- Teacher tools (Phase 3)

---

## Project Directory Layout

```
carnatic-app/
├── SETUP.md                              ← This file — update after every session
├── game-plan.md                          ← Full product design + roadmap
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json                     ← lib: ["dom","es2021"] — required for fetch/console
│   └── supabase/
│       ├── config.toml                   ← db.major_version = 17 (must match Supabase project)
│       ├── migrations/
│       │   ├── 001_initial_schema.sql    ← Core tables, RLS, triggers
│       │   ├── 002_seed_artists.sql      ← 66 Carnatic artists
│       │   ├── 003_book_artists_ragas.sql← 72 melakartas + 48 janya ragas
│       │   ├── 004_fix_channel_ids.sql   ← Corrected YouTube channel IDs
│       │   ├── 005_watch_history.sql     ← Enriched watch_history table
│       │   └── 006_artist_search_meta.sql← fetch_strategy, search_aliases, is_deceased
│       └── functions/
│           ├── search/index.ts           ← LLM search (Groq 70B) + deterministic pre-parser
│           ├── fetch-videos/index.ts     ← YouTube video ingestion (3-tier strategy)
│           └── recommend/index.ts        ← Recommendation engine
│
└── mobile/
    ├── app.json                          ← Expo config (bundle ID = com.carnaticapp.music)
    ├── eas.json                          ← EAS Build profiles (development/preview/production)
    ├── package.json
    ├── app/
    │   ├── _layout.tsx                   ← Root layout; registers all routes
    │   ├── (tabs)/
    │   │   ├── _layout.tsx               ← Tab bar (Home/Search/Browse/Profile)
    │   │   ├── index.tsx                 ← Home screen (mood chips + recommendations)
    │   │   ├── search.tsx                ← Search screen (NL input + quick filters)
    │   │   ├── browse.tsx                ← Browse by artist / raga
    │   │   └── profile.tsx               ← Google sign-in/out + Privacy Policy link
    │   ├── auth/
    │   │   └── callback.tsx              ← OAuth deep-link handler (NEW)
    │   ├── player/
    │   │   └── [videoId].tsx             ← YouTube video player
    │   └── privacy.tsx                   ← Privacy Policy screen (NEW)
    ├── assets/
    │   ├── icon.png                      ← PLACEHOLDER — replace with 1024×1024 PNG
    │   ├── adaptive-icon.png             ← PLACEHOLDER — replace with 1024×1024 PNG
    │   ├── splash-icon.png               ← PLACEHOLDER — replace with 200×200 PNG
    │   ├── favicon.png                   ← PLACEHOLDER — replace with 64×64 PNG
    │   ├── icon.svg                      ← Source design for app icon (NEW)
    │   └── splash.svg                    ← Source design for splash screen (NEW)
    ├── components/
    │   └── VideoCard.tsx                 ← Full-width 16:9 thumbnail card
    ├── hooks/
    │   └── useAuth.ts                    ← Google OAuth + Supabase session
    ├── lib/
    │   ├── supabase.ts                   ← Supabase client (reads EXPO_PUBLIC_ env vars)
    │   ├── api.ts                        ← All API calls (search, recommend, browse)
    │   └── theme.ts                      ← YouTube dark-mode colour palette (YT.*)
    └── scripts/
        └── generate-icons.js             ← Writes icon.svg + splash.svg to assets/
```

---

## All External Services & Credentials

### 1. Supabase (Database + Auth + Edge Functions)
- **Project ID:** `lyvbiiogdaoeawakoxgf`
- **Project URL:** `https://lyvbiiogdaoeawakoxgf.supabase.co`
- **Dashboard:** [supabase.com/dashboard/project/lyvbiiogdaoeawakoxgf](https://supabase.com/dashboard/project/lyvbiiogdaoeawakoxgf)
- **Keys** (in Settings → API):
  - `SUPABASE_URL` = `https://lyvbiiogdaoeawakoxgf.supabase.co`
  - `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (safe to embed in app)
  - `SUPABASE_SERVICE_ROLE_KEY` = **SECRET — never commit; only used in Edge Functions**
- **CLI auth:** Personal Access Token from [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) (format: `sbp_...`)
- **Plan:** Free tier (500 MB DB, 500K edge function calls/month)
- **PostgreSQL version:** 17 (important — `config.toml` must say `db.major_version = 17`)

### 2. YouTube Data API v3
- **Console:** [console.cloud.google.com](https://console.cloud.google.com) → Project: carnatic-app
- **Key:** stored as `YOUTUBE_API_KEY` in `.env` and in Supabase secrets
- **Daily quota:** 10,000 units (free). Quota increase request submitted — awaiting Google approval.
- **Quota cost per operation:**
  - `search.list` = 100 units per call
  - `videos.list` = 1 unit per call
  - `playlistItems.list` = 1 unit per page

### 3. Groq (LLM for search intent parsing)
- **Console:** [console.groq.com](https://console.groq.com)
- **Key:** stored as `GROQ_API_KEY` in `.env` and Supabase secrets
- **Current plan:** Dev tier (upgraded from free) — higher rate limits
- **Model:** `llama-3.3-70b-versatile` (upgraded from llama-3.1-8b for better quality)
- **Used in:** `backend/supabase/functions/search/index.ts`
- **API base:** `https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible)

### 4. Google Cloud — OAuth (for user login)
- **Console:** [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
- **Current state:** OAuth consent screen configured; OAuth client exists for web
- **⚠️ STILL NEEDED before login works on real devices:**
  - Create iOS OAuth client (bundle ID: `com.carnaticapp.music`)
  - Create Android OAuth client (package: `com.carnaticapp.music` + SHA-1 from `npx eas-cli credentials`)
  - Add **Authorized redirect URIs** to both clients:
    - `com.carnaticapp.music://auth/callback`
    - `https://lyvbiiogdaoeawakoxgf.supabase.co/auth/v1/callback`
  - In Supabase: Auth → Providers → Google → enable + paste client IDs
  - Add **Privacy Policy URL** to OAuth consent screen (required for Google to approve it)

### 5. GitHub (version control)
- **Repo:** Private — `git@github.com:GoldenHorde42/carnatic-app.git`
- **Branch:** `main`
- Always push after a session: `git push origin main`

### 6. Expo / EAS (build + distribution)
- **Account:** `gouthamswa` at [expo.dev](https://expo.dev)
- **EAS Project ID:** `b9d3fc2f-75a2-417c-ac06-0008b32a3baa`
- **Project URL:** [expo.dev/accounts/gouthamswa/projects/carnatic-app](https://expo.dev/accounts/gouthamswa/projects/carnatic-app)
- **Cost:** Free tier (30 builds/month)
- **First iOS build:** `0ccf170e-64ad-4731-a817-2d68c1201431` (queued Feb 2026)

### 7. Apple Developer Program
- **Apple ID:** `goutham.swaminathan@rutgers.edu`
- **Team ID:** `BUGP3Q42UY`
- **Provider ID:** `128586132`
- **Bundle ID:** `com.carnaticapp.music` (registered ✅)
- **Distribution Certificate:** Serial `D9258157D7DE75F72E1E617AADD50D4` — expires Feb 2027
- **Provisioning Profile:** ID `2Y3623H4BU` — expires Feb 2027
- **Cost:** $99/year

### 8. Google Play Console
- **Account:** `gouthamswa@gmail.com`
- **Package:** `com.carnaticapp.music`
- **Android Keystore:** `Build Credentials qxxqgNzviO` (stored in EAS cloud)
- **SHA-1:** `29:BA:9E:47:47:B7:C8:CC:22:01:F8:D4:E0:2A:DE:E1:CC:C7:8E:0E`
- **Cost:** $25 one-time

---

## Environment Variables

### Backend `.env` (never commit — in `.gitignore`)
```
SUPABASE_URL=https://lyvbiiogdaoeawakoxgf.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  ← SECRET
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

# Verify:
supabase secrets list --project-ref lyvbiiogdaoeawakoxgf
```

### Mobile env vars
The mobile app reads from `EXPO_PUBLIC_` environment variables, with hardcoded fallbacks in `lib/supabase.ts` so Expo Go development still works.
In production, these are injected via the `env` blocks in `eas.json` — no manual `.env` file needed for EAS builds.

---

## Key Commands

### Supabase CLI
```bash
# Authenticate (Personal Access Token, format: sbp_...)
supabase login

# Link local repo to live project (run from backend/)
cd backend && supabase link --project-ref lyvbiiogdaoeawakoxgf

# Deploy an Edge Function
supabase functions deploy search --project-ref lyvbiiogdaoeawakoxgf
supabase functions deploy fetch-videos --project-ref lyvbiiogdaoeawakoxgf
supabase functions deploy recommend --project-ref lyvbiiogdaoeawakoxgf

# Push a new DB migration
supabase db push

# Mark old migrations as already applied (only if they were applied manually via dashboard)
supabase migration repair --status applied 001
supabase migration repair --status applied 002
supabase migration repair --status applied 003
```

### Video seeding
```bash
# Full seed — fetches up to 50 videos per artist (~6,600 quota units total)
curl -X POST "https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos?seed=true" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"

# Incremental — only videos from last N days (use for daily cron)
curl -X POST "https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos?days=3" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"

# Single artist (for debugging)
curl -X POST "https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos?artist=T.M.+Krishna" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"
```

### Test search
```bash
curl -X POST "https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/search" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"query": "Bombay Jayashri", "limit": 5}'
```

### Mobile app (development)
```bash
cd mobile
npm install
npx expo start           # Start dev server — scan QR with Expo Go app
                         # ⚠️ MUST DISABLE VPN before scanning QR
npx expo start --clear   # Clear Metro cache (use after installing new native packages)
```

### EAS Build (once accounts are set up)
```bash
cd mobile
npx eas-cli login                   # log into Expo account
npx eas-cli init                    # creates EAS project ID — paste it into app.json

# Production builds (run in cloud, no Xcode/Android Studio needed)
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production

# Submit to stores
npx eas-cli submit --platform ios
npx eas-cli submit --platform android
```

---

## Database Tables

| Table | Rows (approx) | Purpose |
|-------|---------------|---------|
| `artists` | 66 | Curated Carnatic artists with YouTube channel IDs |
| `ragas` | 120 | Carnatic ragas (72 melakartas + 48 janya) |
| `videos` | ~641 | YouTube videos fetched and cached |
| `profiles` | 0 | User profiles — populated on first Google login |
| `watch_history` | 0 | Per-user watch history — populated on video play |
| `playlists` | 0 | User playlists |
| `playlist_videos` | 0 | Videos in playlists |
| `teacher_students` | 0 | Teacher–student relationships |
| `fetch_log` | 0 | Log of fetch-videos runs |

### Key columns
```sql
-- artists table
youtube_channel_id  -- YouTube channel ID (used in Tier 1 fetch)
fetch_strategy      -- 'channel' | 'sabha_search' | 'global_search'
search_aliases      -- text[] — alternate names (e.g. deceased artists with stage names)
is_deceased         -- bool — triggers Tier 3 archival search

-- videos table
youtube_video_id    -- e.g. "dQw4w9WgXcQ"
artist_name         -- denormalized from artists
raga                -- null for most; ~33 tagged currently
tala                -- null for most
composer            -- e.g. "Tyagaraja", "Muthuswami Dikshitar"
is_visible          -- bool — false hides from app
view_count          -- cached from YouTube; used for result ranking
fetch_strategy      -- which tier fetched this video
```

---

## How the App Works (Architecture)

```
User opens app
    ↓
Home screen → calls /recommend Edge Function
    → if logged in: looks at watch_history → finds top artists/ragas → returns similar videos
    → if anonymous: returns top 20 videos ordered by view_count DESC

User types a search query
    ↓
search/index.ts Edge Function
    ↓
Step 1 — Deterministic pre-parser (zero latency, no LLM)
  Handles: ~30 known artist names, 16 mood keywords, common instruments
  e.g. "ranjani gayatri" → { artist: "Ranjani Gayatri" }   (bypasses Groq)
  e.g. "melancholic"     → { ragas: ["Bhairavi","Sahana"] } (bypasses Groq)

Step 2 — If no pre-parser match: Groq llama-3.3-70b-versatile
  2× retry with 5s timeout
  Returns structured intent JSON: { artist, raga, ragas[], mood, tala, composer, instrument }

Step 3 — DB query on videos table using intent
  - artist_name ilike filter (NOTE: use .ilike(), NOT .or() — dots in names break .or())
  - raga filter
  - composer filter
  - Results ordered by view_count DESC

Step 4 — If 0 results: broad fallback
  Searches title + artist_name with OR across all extracted terms (keywords, composer, raga name)
    ↓
Returns JSON array of videos to mobile app

User taps a video
    ↓
Player screen → react-native-youtube-iframe embeds YouTube
    → YouTube ads play normally (required by ToS — do NOT block ads)
    → Logs to watch_history table (if logged in)
```

---

## Search Function: Critical Gotchas

1. **PostgREST `.or()` silently fails with dots in strings.**
   `query.or("artist_name.ilike.%T.M. Krishna%")` — the dots in `T.M.` are treated as field separators.
   **Fix:** Always use `query.ilike("artist_name", "%T.M. Krishna%")` directly.

2. **Groq is non-deterministic for short artist names.**
   "TM Krishna" sometimes returns keywords array instead of artist field.
   **Fix:** Pre-parser handles all 30 known artists before hitting Groq.

3. **`video_type` column is mostly null — DO NOT filter on it.**
   Most videos have `video_type = 'other'` (default insert). The LLM may suggest this filter but it must be ignored.

4. **Mood search quality is limited by raga tagging.**
   Only ~33/641 videos have `raga` set. Mood fallback also searches raga names in video titles as a workaround.

5. **Search results are ordered by `view_count DESC`.**
   This surfaces the most popular videos. Do not change to `published_at` — it shows obscure recent videos first.

---

## fetch-videos: 3-Tier Strategy

```
For each artist in artists table:

Tier 1 — artist has youtube_channel_id (fetch_strategy = 'channel'):
  → YouTube playlistItems.list on their uploads playlist
  → Gets all videos the artist uploaded themselves
  → Most reliable; costs 1 unit per page of results

Tier 2 — artist without own channel (fetch_strategy = 'sabha_search'):
  → YouTube search.list restricted to these trusted sabha channel IDs:
      Music Academy Madras, Brahma Gana Sabha, Narada Gana Sabha,
      Kartik Fine Arts, Carnatica, Manorama Music
  → Searches for artist name within those channels only
  → Costs 100 units per search

Tier 3 — deceased/archival artist (is_deceased = true OR fetch_strategy = 'global_search'):
  → Global YouTube search using search_aliases
  → Strict title filtering to exclude non-Carnatic results
  → Costs 100 units per search
```

**Fetch modes:**
- `?seed=true` — up to 50 videos per artist, no date filter (use for initial load)
- `?days=N` — only videos from last N days (use for daily cron; much lower quota)
- `?artist=name` — single artist only (use for debugging)

---

## Pending Work

### 🔴 BLOCKING — Must do before App Store goes live

#### A. YouTube API Quota Increase (URGENT)
The free quota is 10,000 units/day. This limits how many new videos we can fetch.
A quota increase form was submitted to Google (Feb 2026).

**Google also sent a follow-up email requesting a demo video:**
> "Please send us a video demonstrating the user experience for searching content and playing videos on both iOS and Android."

**What to do:**
1. Record a short screen recording (1–3 min) on iPhone (via TestFlight) showing:
   - Open the app → Home screen
   - Search for an artist (e.g., "T.M. Krishna") → results appear
   - Tap a video → YouTube player loads, video plays
2. Do the same on Android once you have a device (or use an emulator)
3. Reply to the email from `api-services-team@google.com` with the video attached
4. **Do NOT submit the app to App Store before doing this** — Google may revoke quota if they can't verify the use case

#### B. Android Setup (Need physical device or emulator)
- Sign up for Google Play Console at [play.google.com/console](https://play.google.com/console) ($25 one-time)
- Need a physical Android phone (or Android emulator) to:
  - Test the app before publishing
  - Take Play Store screenshots
  - Verify Google Sign-In works on Android
- Once enrolled: `npx eas-cli build --platform android --profile production`

#### C. App Store Screenshots
- Install the latest TestFlight build on your iPhone
- Take screenshots of: Home screen, Search results, Browse (artists/ragas), Video player
- Required sizes: iPhone 6.9" (1320×2868) and iPhone 6.5" (1284×2778)
- Upload in App Store Connect → App Store → 1.0 → Prepare for Submission

#### D. App Review Information
- Fill in App Store Connect → App Review Information section
- Add a note: "App uses YouTube embedded player. No login required to browse. Google login is optional for recommendations."
- Then submit for Apple review

---

## Pending Work: Before App Store Submission (Old section — superseded above)

### MUST-DO (blocking)

**1. Create Expo account + EAS Project ID**
```bash
# Sign up at expo.dev, then:
cd mobile
npx eas-cli login
npx eas-cli init
# Paste the generated projectId into mobile/app.json → extra.eas.projectId
```

**2. Create app icon PNGs**
- Open `mobile/assets/icon.svg` in a browser
- Export / screenshot at 1024×1024 → save as `mobile/assets/icon.png`
- Copy the same file to `mobile/assets/adaptive-icon.png`
- Create a simpler 200×200 version → save as `mobile/assets/splash-icon.png`
- Or use Figma (free) for a proper design

**3. Host Privacy Policy at a public URL**
Easiest option — GitHub Pages:
1. In the GitHub repo, create `docs/privacy.html` (copy the text from `mobile/app/privacy.tsx`)
2. Go to repo Settings → Pages → Source: `main` branch, `/docs` folder → Save
3. URL will be: `https://goldenhorde42.github.io/carnatic-app/privacy`
4. Paste this URL into:
   - `mobile/app.json` → add `"privacyPolicyUrl": "https://..."`
   - Google Cloud Console → OAuth consent screen → Privacy Policy URL
   - App Store Connect → App Information → Privacy Policy URL
   - Google Play Console → Store listing → Privacy Policy

**4. Configure Google OAuth for mobile**
```
Google Cloud Console → APIs & Services → Credentials → "+ Create Credentials" → OAuth client ID

Create #1 — iOS:
  Application type: iOS
  Bundle ID: com.carnaticapp.music
  → Copy the client ID

Create #2 — Android:
  Application type: Android
  Package name: com.carnaticapp.music
  SHA-1 certificate fingerprint: get this by running:
    cd mobile && npx eas-cli credentials
  → Copy the client ID

Then in Supabase Dashboard → Auth → Providers → Google:
  → Enable Google provider
  → Paste iOS client ID
  → Paste Android client ID
  → Add redirect URL: com.carnaticapp.music://auth/callback

Also add to both OAuth clients' "Authorized redirect URIs":
  → com.carnaticapp.music://auth/callback
  → https://lyvbiiogdaoeawakoxgf.supabase.co/auth/v1/callback
```

**5. Apple Developer Account ($99/year)**
- Enroll at [developer.apple.com/programs](https://developer.apple.com/programs) → Individual
- Takes 24–48 hours for identity verification
- After approval: App Store Connect → new app → Bundle ID: `com.carnaticapp.music`

**6. Google Play Developer Account ($25 one-time)**
- Sign up at [play.google.com/console](https://play.google.com/console)
- Takes a few hours to activate

### SHOULD-DO (before launch, not blocking)

**7. Set up daily video refresh cron job**
Run this SQL in Supabase Dashboard → SQL Editor:
```sql
SELECT cron.schedule(
  'daily-fetch-videos',
  '0 6 * * *',   -- 6 AM UTC = midnight Pacific
  $$
  SELECT net.http_post(
    url := 'https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos?days=2',
    headers := '{"Authorization": "Bearer <SUPABASE_ANON_KEY>"}'::jsonb
  );
  $$
);
```

**8. Prepare App Store listing assets**
- Screenshots: iPhone 6.9" (1320×2868) and iPhone 6.5" (1284×2778) — minimum 2 required
- Short description (30 chars for iOS): "Carnatic music for students"
- Subtitle (30 chars): "Ragas · Artists · Mood search"
- Full description (~4000 chars)
- Keywords (100 chars max): "carnatic,classical,music,raga,veena,violin,flute,mridangam,india"
- Category: Music
- Age rating: 4+ (no mature content)

**9. LLM enrichment pass on videos**
Only ~33 of 641 videos have `raga` tagged. After the YouTube quota increase is approved:
```bash
# Query all videos where raga IS NULL and title contains raga-like words
# Run through Groq to extract raga, tala, composer from title
# This will significantly improve mood search and recommendations
```

---

## Current App Store Connect Status (Feb 24, 2026)

| Item | Status |
|------|--------|
| App created in App Store Connect | ✅ Done — App ID `6759589334` |
| Bundle ID | ✅ `com.carnaticapp.music` |
| Age rating | ✅ 4+ |
| Privacy policy URL | ✅ `https://carnaticapp.org/privacy.html` |
| Support URL | ✅ `https://carnaticapp.org/privacy.html` |
| Description + Keywords | ✅ Filled (see `store-listing.md`) |
| Copyright | ✅ `2026 Goutham Swaminathan` |
| Pricing | ✅ $0.99 |
| Build attached | ⏳ Waiting for new build (build 3 in progress) |
| Screenshots | ⏳ Pending — install via TestFlight, take on device |
| App Review Information | ⏳ Pending |
| Submit for review | ⏳ Pending |

## Infrastructure & Credentials

| Service | Details |
|---------|---------|
| **Domain** | `carnaticapp.org` — bought on Cloudflare Registrar |
| **Privacy policy** | `https://carnaticapp.org/privacy.html` — hosted on Netlify (site ID: `31c07e19-1225-42eb-b297-565ae45a9787`) |
| **Support email** | `support@carnaticapp.org` → forwarded via Cloudflare Email Routing |
| **Netlify deploy** | `npx netlify-cli deploy --prod --dir=docs --site=31c07e19-1225-42eb-b297-565ae45a9787` |
| **EAS Project ID** | `b9d3fc2f-75a2-417c-ac06-0008b32a3baa` |
| **App Store App ID** | `6759589334` |
| **Apple Team ID** | `BUGP3Q42UY` |
| **Android OAuth Client** | `298276742704-mue9um64sv808up3ehfudct13ma8bbdi.apps.googleusercontent.com` |
| **iOS OAuth Client** | `298276742704-o8c0k7i2l5fefjdvphdntsvrl8c43pjg.apps.googleusercontent.com` |
| **Supabase Redirect URL** | `carnatic://auth/callback` (added to Supabase Auth URL Configuration) |

## Known Issues & Tech Debt

| Issue | Severity | Status |
|-------|----------|--------|
| **iOS app NOT in App Store** | 🔴 High | TestFlight only. Screenshots + App Review Info needed before submitting. |
| **Android NOT set up** | 🔴 High | Google Play Console ($25) + physical Android device still needed. |
| **YouTube demo video not sent to Google** | 🔴 High | Google emailed asking for screen recording of search + video playback on iOS+Android. Reply to `api-services-team@google.com`. |
| YouTube quota is 10,000/day (free tier) | 🟡 Medium | Quota increase form submitted. Waiting for Google approval. |
| Only ~33/641 videos have raga metadata | Medium | Pending LLM enrichment pass — do after quota increase approved. |
| Search failing when logged in | ✅ Fixed (build 4) | Root cause: Supabase client sent user JWT to search function. Fix: always use anon key in `api.ts`. |
| Home screen blank when logged in | ✅ Fixed (build 7) | Root cause: same JWT gateway 401 issue, plus queryBase mutation bug in recommend. Fix: anon key + ?userId= param. See `CONTEXT.md`. |
| Watch History / Playlists / Liked Videos crashing | ✅ Fixed (build 4) | Now show "Coming Soon" toast instead of silently failing. |
| Google OAuth not working in TestFlight | ✅ Fixed (build 3) | Root cause: wrong redirect URL scheme. Fixed in `useAuth.ts`. |
| `fetch_log` table always empty | Low | Edge function logs time out before insert; needs async fix. |
| Bombay Jayashri channel has some non-Carnatic content | Low | Add manual `is_visible = false` for irrelevant videos. |

---

## Quick Decisions Reference

| Decision | What we chose | Why |
|----------|--------------|-----|
| Mobile framework | React Native + Expo | One codebase for iOS + Android; EAS cloud builds |
| Backend | Supabase | PostgreSQL + auth + edge functions + generous free tier |
| Video source | YouTube Data API v3 | Always fresh, $0 content cost, massive library |
| LLM | Groq llama-3.3-70b-versatile | Fast inference, generous free tier, OpenAI-compatible |
| Content strategy | Curated artist list (66 artists) | Quality control — no non-Carnatic leakage |
| Auth | Google OAuth via Supabase | Target users already have Google accounts |
| App scheme | `com.carnaticapp.music` | Clean, available bundle ID |
| Monetization (planned) | AdMob free tier → RevenueCat premium | Low barrier for students; teacher tier pays |
| Ads in player | YouTube native ads, not AdMob | ToS compliance — YouTube player ads are required |

---

## App Store Submission Timeline (Estimated)

| Step | Time needed | Who does it |
|------|-------------|-------------|
| Create Apple + Play accounts | 1 hour (+ 24–48h Apple verification) | You |
| Create icons + screenshots | 2–4 hours | You (Figma/Canva) |
| Host privacy policy | 30 min | You + agent |
| Configure Google OAuth for mobile | 30 min | You + agent |
| EAS init + first iOS build | 20 min setup + 15 min build | Agent + EAS cloud |
| EAS first Android build | 20 min setup + 10 min build | Agent + EAS cloud |
| App Store Connect listing | 1–2 hours | You + agent |
| Google Play listing | 1–2 hours | You + agent |
| Apple review | 1–3 days | Apple |
| Google Play review | 3–7 days | Google |
| **Total elapsed time** | ~1 week | |
