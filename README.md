# Carnatic — Classical Music Discovery App

A mobile app for discovering and learning Carnatic classical music. Built for students, enthusiasts, and teachers.

---

## What It Does

- **Smart Search** — search by artist, raga, tala, mood, or composer in natural language
- **Curated Library** — 66 hand-picked Carnatic artists, 1,000+ concert recordings
- **Raga & Artist Browsing** — explore the full catalog by raga or performer
- **Personalised Recommendations** — home feed adapts to your watch history
- **YouTube Player** — videos play via the embedded YouTube player, fully ToS compliant

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo (iOS + Android) |
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Database | PostgreSQL (Supabase) |
| Video source | YouTube Data API v3 |
| Search AI | Groq — LLaMA 3.3 70B |
| Build & deploy | EAS (Expo Application Services) |

---

## YouTube API Usage

This app uses the **YouTube Data API v3** to:
- Fetch video metadata (title, thumbnail, duration, view count) for curated Carnatic artists
- Display videos using the **official YouTube IFrame Player** (embedded)
- All YouTube ads play normally — we do not skip or block ads
- No YouTube content is downloaded, stored as media, or served outside of the YouTube player

The app complies fully with the [YouTube API Services Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service) and the [YouTube Terms of Service](https://www.youtube.com/t/terms).

---

## Privacy

Privacy policy: [https://carnaticapp.org/privacy.html](https://carnaticapp.org/privacy.html)

---

## Contact

support@carnaticapp.org
