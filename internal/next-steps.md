# Carnatic App — Next Steps & Roadmap

> **Status key:** `[ ]` To-Do &nbsp;|&nbsp; `[~]` In-Progress &nbsp;|&nbsp; `[x]` Done
>
> **For AI agents:** Check this file first to know what to work on.
> Update status inline as you complete tasks. Commit after every update.
> Last updated: Feb 25, 2026

---

## 🔴 Phase 1 — App Store Launch (Blocking)

### iOS App Store
- `[~]` Build #7 submitted to TestFlight (EAS auto-submit in progress)
- `[ ]` Install Build #7 on iPhone via TestFlight → verify home screen loads when logged in
- `[ ]` Take App Store screenshots on iPhone (4 screens minimum):
  - Home screen (recommendations loaded)
  - Search results (e.g. search "TM Krishna")
  - Browse tab (artists or ragas)
  - Video player (video playing)
  - Required sizes: **6.9" = 1320×2868** and **6.5" = 1284×2778**
  - Upload at: App Store Connect → Carnatic App → 1.0 → Prepare for Submission
- `[ ]` Fill App Review Information in App Store Connect:
  - Note: "No login required. Google login is optional for personalised recommendations."
  - Sign-in required: No
- `[ ]` Submit for Apple review (1–3 day turnaround)

### Android Google Play
- `[ ]` Sign up for Google Play Console at play.google.com/console ($25 one-time)
- `[ ]` Run Android EAS build: `cd mobile && npx eas-cli build --platform android --profile production`
- `[ ]` Test on physical Android device or emulator
- `[ ]` Take Play Store screenshots
- `[ ]` Fill Play Store listing
- `[ ]` Submit for Google Play review (3–7 day turnaround)

---

## 🔴 Phase 1 — YouTube API Quota Increase (Blocking)

- `[~]` Quota increase form submitted to Google (Feb 2026)
- `[~]` Google replied requesting demo video — email drafted (see below)
- `[ ]` **Record screen recording on iPhone (1–3 min):**
  - Open app → home screen loads
  - Search "TM Krishna" → results appear
  - Tap a video → YouTube player opens, video plays
  - Brief browse of ragas/artists tab
- `[ ]` Reply to `api-services-team@google.com` with the video attached (see email template in this file)
- `[ ]` Wait for Google approval (usually 1–2 weeks)

### Reply Email Template
```
Subject: Re: YouTube API Services Review — Carnatic App

Hi YouTube API Services Team,

Thank you for reviewing our quota increase request. Please find attached a screen recording demonstrating the user experience of the Carnatic app on iOS.

The recording shows:
- Home screen with curated Carnatic music recommendations
- Natural language search (e.g. searching by artist name, raga, or mood)
- Video playback using the embedded YouTube player (with YouTube ads playing normally, fully ToS compliant)
- Google Sign-In flow via the Profile tab

Our iOS app is currently live in TestFlight and is being prepared for App Store submission. The Android version is in development and will follow shortly after iOS launches.

The app is a Carnatic classical music discovery platform for students and enthusiasts. It uses the YouTube Data API v3 to fetch and cache video metadata for 66 curated Carnatic artists, enabling searches by artist, raga, tala, mood, and composer — queries YouTube itself handles poorly for this niche.

Our GitHub repo (public for your review): https://github.com/GoldenHorde42/carnatic-app

Please let me know if you need any additional information.

Best regards,
Goutham Swaminathan
support@carnaticapp.org
```

---

## 🟡 Phase 2 — Video Library Completeness

### 30 Artists With 0 Videos (fetch returned nothing)
These artists are in the DB but have no videos. Needs investigation after quota increase.

**Deceased / archival (global_search) — 9 artists:**
| Artist | Issue |
|--------|-------|
| M.S. Subbulakshmi | Global search may be getting blocked by strict title filter |
| Lalgudi Jayaraman | Same |
| G N Balasubramaniam | Same |
| D K Pattammal | Same |
| M D Ramanathan | Same |
| Semmangudi Srinivasa Iyer | Same |
| Madurai Mani Iyer | Same |
| Palghat K V Narayanaswamy | Same |
| Alathur Brothers | Same |

**Living artists (sabha_search) — 20 artists:**
May need their own YouTube channel IDs added, or sabha channels don't have their content.
Notable ones: M Balamuralikrishna, T N Seshagopalan, T V Sankaranarayanan, M.L. Vasantakumari

**Channel strategy — 1 artist:**
| Artist | Issue |
|--------|-------|
| Mysore Manjunath | Has `strategy=channel` but 0 videos — likely wrong channel ID |

- `[ ]` After quota reset: debug each 0-video artist with `?artist=<name>&seed=true`
- `[ ]` For deceased artists: loosen title filter or add more search aliases
- `[ ]` For living sabha artists: find their YouTube channel IDs and upgrade to Tier 1
- `[ ]` Fix Mysore Manjunath channel ID

### Current Fetch Caps
- Each artist is capped at **50 videos** per seed run (MAX_RESULTS)
- Artists like MS Subbulakshmi, Lalgudi Jayaraman likely have hundreds of recordings
- `[ ]` After quota increase: raise MAX_RESULTS to 200 for deceased legends

### Raga Metadata
- Only ~33 / 997 videos have `raga` tagged
- `[ ]` After quota increase approved: run LLM enrichment pass (Groq) on all videos where `raga IS NULL`
- `[ ]` This will significantly improve mood search and raga-based browsing

---

## 🟡 Phase 2 — Core Feature Gaps

### Watch History, Likes, Playlists
- `[ ]` Watch history screen (currently shows "Coming Soon")
- `[ ]` Liked videos screen (currently shows "Coming Soon")
- `[ ]` Playlists (create, add video, view)
- `[ ]` These are already partially wired in backend (tables exist); just need UI

### Mini Player
- `[ ]` Floating mini-player when navigating away from video
- Note: Background audio from YouTube embeds requires YouTube Premium per ToS.
  Mini-player within the app (video still visible, just smaller) is fine.

### Raga Detail Pages
- `[ ]` Tap a raga → full page with:
  - Raga family (melakarta / janya)
  - Mood / time of day
  - Famous compositions
  - Related ragas
  - All performances in DB
- Data mostly available — need UI

---

## 🟢 Phase 3 — Differentiation Features

### Teacher Tools (highest value, revenue potential)
- `[ ]` Teacher creates a "class" with students
- `[ ]` Assigns videos with notes ("listen for gamaka at 2:30")
- `[ ]` Student sees "Assigned this week" on home screen
- `[ ]` Proof of concept: push your aunt's lessons to top of Learning tab

### Composition Database
- `[ ]` Each kriti linked to: composer, raga, tala, meaning/translation
- `[ ]` "3 performances of Entharo Mahanubhavulu" — compare artists side by side
- `[ ]` Tagging videos to compositions

### Learning Resources Tab
- `[ ]` Separate tab for tutorial/lesson videos vs. concert performances
- `[ ]` Curated beginner → advanced learning paths
- `[ ]` Your aunt's lessons pinned at top

### Era-Based Browsing
- `[ ]` Tag artists by generation (Trinity era / early 20th century / contemporary)
- `[ ]` "Performances from the golden age" filter

---

## 📋 Completed

- `[x]` Database schema (8 tables) deployed to Supabase
- `[x]` 66 artists seeded
- `[x]` 997 videos ingested from YouTube
- `[x]` `search` Edge Function — LLM + deterministic pre-parser
- `[x]` `recommend` Edge Function — personalised + anonymous fallback
- `[x]` `fetch-videos` Edge Function — 3-tier strategy + batching
- `[x]` Daily cron job (6 AM UTC via pg_cron)
- `[x]` Mobile app: Home, Search, Browse, Profile, Player screens
- `[x]` Google Sign-In via OAuth (iOS working)
- `[x]` App icon + splash screen
- `[x]` Privacy Policy (hosted at carnaticapp.org/privacy.html)
- `[x]` EAS build pipeline (iOS production builds)
- `[x]` Fix: search failing when logged in (build 4)
- `[x]` Fix: home screen blank when logged in (build 7)
- `[x]` Fix: fetch-videos 500 timeout — added offset/limit batching
- `[x]` App Store Connect listing filled (description, keywords, pricing, privacy URL)
- `[x]` TestFlight external beta testers setup
- `[x]` internal/CONTEXT.md, internal/SETUP.md, internal/seed-videos.md, internal/push-backend-changes.md, internal/push-mobile-changes.md runbooks created
