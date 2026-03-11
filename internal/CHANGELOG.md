# Changelog

All notable changes to this project are documented here.
Format: `[Date] — What changed — Why`

---

## [Mar 10, 2026] — YouTube API ToS Compliance + Branding Fixes

### Added
- `docs/terms.html` — New Terms of Use page explicitly binding users to the YouTube Terms of Service (Policy III.A.1)
- `mobile/app/terms.tsx` — In-app Terms of Use screen with same content and clickable YouTube ToS link
- `mobile/app/_layout.tsx` — Registered `/terms` route

### Fixed
- `docs/privacy.html` (v3) — Added "How We Share Your Information" (III.A.2e), "Device Storage and Local Data" disclosing AsyncStorage usage (III.A.2g), and 30-day YouTube statistics refresh statement (III.E.4a-g). Removed YouTube-red play button from header (III.F.2a,b).
- `mobile/app/privacy.tsx` — Mirrored all privacy policy fixes in the in-app screen; added links to Terms of Use
- `mobile/app/player/[videoId].tsx` — Video title now opens `youtube.com/watch?v=...` on tap; added "Watch on YouTube" button with YouTube icon (III.I.4 + III.F.2)
- `mobile/app/(tabs)/profile.tsx` — "Powered by YouTube" footer is now a tappable link to youtube.com per branding guidelines (III.F.2). Added Terms of Use to Account section and sign-out footer links.

---

## [Feb 24, 2026] — App Store Connect Setup + Google Sign In Fix

### Added
- `carnaticapp.org` domain purchased on Cloudflare Registrar
- Privacy policy hosted on Netlify at `https://carnaticapp.org/privacy.html`
- `support@carnaticapp.org` email forwarding via Cloudflare Email Routing → Gmail
- `docs/index.html` added as GitHub Pages root (mirrors privacy.html)

### Fixed
- `mobile/hooks/useAuth.ts` — rewrote Google Sign In to use proper `expo-web-browser` OAuth flow with `skipBrowserRedirect: true`. Previous implementation opened browser but didn't properly exchange tokens on native iOS/Android.
- `mobile/hooks/useAuth.ts` — redirect URL changed from `com.carnaticapp.music://auth/callback` to `carnatic://auth/callback` to match the `scheme` registered in `app.json`
- `store-listing.md` — converted markdown formatting to plain text for App Store Copy-paste

### Changed
- `mobile/app.json` — `privacyPolicyUrl` updated to `https://carnaticapp.org/privacy.html`
- `docs/privacy.html` — support email updated from `support@carnaticapp.music` to `support@carnaticapp.org`
- `mobile/eas.json` — `ios.ascAppId` set to `6759589334` (App Store Connect App ID)
- Supabase Auth → URL Configuration: added `carnatic://auth/callback` as allowed redirect URL

### Builds
- **Build 2** (iOS production) — submitted to TestFlight, currently live. Has old OAuth bug.
- **Build 3** (iOS production) — triggered Feb 24 2026, includes OAuth fix. Use this for App Store submission.

---

## [Feb 23, 2026] — EAS Setup + Apple Developer Enrollment + First iOS Build

### Added
- `mobile/eas.json` — EAS build configuration with development/preview/production profiles
- `mobile/scripts/generate-icons.js` + `build-icons.js` — generates PNG icons from SVG
- `docs/privacy.html` — privacy policy page
- `mobile/app/auth/callback.tsx` — OAuth deep link callback screen
- `mobile/app/privacy.tsx` — in-app privacy policy screen
- `backend/supabase/migrations/007_daily_cron.sql` — daily cron job for video fetching
- `store-listing.md` — App Store + Google Play listing content

### Configured
- EAS Project ID: `b9d3fc2f-75a2-417c-ac06-0008b32a3baa`
- Apple Developer Program enrolled (Team ID: `BUGP3Q42UY`)
- Android OAuth client created: `298276742704-mue9um64sv808up3ehfudct13ma8bbdi.apps.googleusercontent.com`
- iOS OAuth client created: `298276742704-o8c0k7i2l5fefjdvphdntsvrl8c43pjg.apps.googleusercontent.com`
- App created in App Store Connect: App ID `6759589334`, Bundle ID `com.carnaticapp.music`

### Builds
- **Build 1** (iOS production) — first ever build, used to verify EAS setup

---

## [Feb 2026] — Search Fixes + UI Redesign

### Fixed
- `search` Edge Function — removed `video_type = "concert"` filter (caused zero results)
- `search` Edge Function — fallback now searches both `title` and `artist_name`
- `search` Edge Function — default sort changed to `view_count DESC`
- `search` Edge Function — added deterministic pre-parser for artist names (TM Krishna, Ranjani Gayatri) and mood keywords
- `search` Edge Function — added retry logic for Groq API calls
- `search` Edge Function — upgraded Groq model to `llama-3.3-70b-versatile`
- `search` Edge Function — added `composer` to fallback search terms

### Changed
- Full UI redesign to YouTube dark mode style (black background, red accents)
- `mobile/lib/theme.ts` — centralized YouTube color palette
- Tab bar redesigned with `@expo/vector-icons`
- `VideoCard.tsx` — full-width 16:9 thumbnail layout
- Home screen — mood chips + "Powered by YouTube" footer
- Profile screen — Google sign-in button + privacy policy link

---

## [Feb 2026] — Mobile App Scaffold

### Added
- `mobile/` directory — full Expo React Native app
- Screens: Home, Search, Browse, Profile, Video Player
- `mobile/lib/supabase.ts` — Supabase client
- `mobile/lib/api.ts` — API calls to Edge Functions
- `mobile/hooks/useAuth.ts` — Google Sign In hook
- YouTube IFrame player integration (`react-native-youtube-iframe`)

---

## [Feb 2026] — Backend + Edge Functions

### Added
- Supabase Edge Functions: `search`, `fetch-videos`, `recommend`
- Database migrations 001–006 (schema, seed artists, ragas, watch history, artist metadata)
- `backend/scripts/fetch-videos.ts` — video fetching script
- Three-tier video fetch strategy (channel → sabha search → global search)
- Groq LLM integration for natural language search

---

## How to Use This File

- **Every agent session:** Add an entry at the top when you make changes
- **Format:** `[Date] — Session title` with Added / Fixed / Changed sections
- **Be specific:** mention file names and the reason for the change
- This file + `SETUP.md` together give full context to any new agent
