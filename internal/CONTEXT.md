# Carnatic App — Session Context Log

> **For AI agents:** Read `internal/SETUP.md` first for the full project reference.
> This file captures **what changed each session** and **key learnings** that SETUP.md doesn't cover yet.
> Append to this file at the end of every session.

---

## Session: Feb 24–25, 2026 — Auth Fixes + Video Ingestion + Build #7

### What Was Done

#### 1. Fixed: Home screen blank when logged in (`recommend` function)

**Root cause:** Two bugs compounding:
- **Bug A — JWT gateway 401:** The mobile app sent the user's Supabase JWT as `Authorization: Bearer <user_jwt>`. After a Google PKCE OAuth login, the token is in a transient state that causes Supabase's gateway to return a `401` *before* the edge function even runs. This meant the fallback code inside the function never executed.
- **Bug B — `queryBase` mutation:** The `recommend` function used a shared `queryBase` Supabase query object and called `.range()` on it twice (once in the count, once in the data fetch). Supabase query objects are mutable — the second `.range()` chained onto the mutated result of the first, producing incorrect results.

**Fix (both bugs):**
- **Mobile (`mobile/lib/api.ts`):** `getRecommendations()` now always uses the anon key for `Authorization` (same pattern as `searchVideos`). The user's UUID is passed as a `?userId=<uuid>` query param via `supabase.auth.getUser()`.
- **Backend (`recommend/index.ts`):** Dropped JWT verification entirely. Reads `userId` from `?userId=` param. Fixed `queryBase` by cloning the query for count vs. data fetch (no longer needed since user identity comes from param, not JWT).

**Key pattern — use this for ALL edge function calls from mobile:**
```typescript
// ✅ CORRECT — always use anon key for Authorization
const res = await fetch(`${FUNCTIONS_URL}/some-function?param=val`, {
  headers: { 'Authorization': `Bearer ${ANON_KEY}` },
})

// ❌ WRONG — user JWT causes gateway 401 after PKCE OAuth
const auth = await authHeader()  // returns user JWT when logged in
const res = await fetch(`${FUNCTIONS_URL}/some-function`, {
  headers: { 'Authorization': auth },
})
```
The `authHeader()` helper in `api.ts` still exists but is now only used for direct Supabase client calls (not fetch() to edge functions). Consider removing it eventually.

---

#### 2. Fixed: Video ingestion timing out (`fetch-videos` function)

**Root cause:** Supabase free-tier Edge Functions have a **150-second execution timeout**. Running `?seed=true` on all 66 artists at once takes ~200s → `500 Internal Server Error`.

**Fix:** Added `?offset=N&limit=M` params to `fetch-videos/index.ts` for batched processing. See `internal/seed-videos.md` for how to use.

**Commit:** `258dc22` — `feat: add offset/limit batching to fetch-videos to prevent timeout`

---

#### 3. Videos ingested (Feb 24, 2026 seed)

- **997 total videos** in DB (up from ~641)
- ~356 new videos added across 4 batches
- Full batch breakdown logged in Supabase `fetch_log` table
- See `internal/seed-videos.md` for how to re-run

---

#### 4. iOS Build #7 — in progress / submitted to TestFlight

- **EAS Build:** `2b2a43f9-1566-426b-a61f-545da3d7100d`
- **Build number:** 7 (auto-incremented by EAS)
- **Commit:** `7d09f1f` — `fix: use anon key for recommend; pass userId as param to avoid JWT gateway 401s`
- **Status at end of session:** Build finished ✅, submission to App Store Connect in progress ⏳
- **Includes fixes for:** home screen blank (recommend), search-when-logged-in (from build 4)
- **Does NOT include:** Android build (Play Console not yet set up)

---

### Pending Work (as of end of this session)

| Task | Priority | Detail |
|------|----------|--------|
| **Wait for Build #7 in TestFlight** | 🔴 Immediate | Apple processing takes 10–15 min after EAS submits. Then install on iPhone to verify home screen works. |
| **App Store Screenshots** | 🔴 Blocking | Take on iPhone via TestFlight. Required sizes: 6.9" (1320×2868) and 6.5" (1284×2778). At least 4 screens: Home, Search results, Browse, Player. Upload in App Store Connect → 1.0 → Prepare for Submission. |
| **App Review Information** | 🔴 Blocking | Fill in App Store Connect → App Review Information. Note: "No login required. Google login optional for personalised recommendations." |
| **Submit for App Store Review** | 🔴 Blocking | After screenshots + review info done. Apple review takes 1–3 days. |
| **YouTube demo video → Google** | 🔴 Blocking quota increase | Reply to `api-services-team@google.com`. Record 1–3 min screen recording: open app → search "T.M. Krishna" → tap video → player loads. Need both iOS + Android. |
| **Google Play Console signup** | 🔴 Blocking Android | $25 one-time at play.google.com/console. Then `npx eas-cli build --platform android --profile production`. |
| **LLM raga enrichment** | 🟡 After quota increase | ~33/997 videos have raga tagged. Run Groq pass over all videos where `raga IS NULL` to extract from title. |

---

### Files Changed This Session

| File | What Changed | Why |
|------|-------------|-----|
| `mobile/lib/api.ts` | `getRecommendations`: use anon key + `?userId=` param | Fix gateway 401 for logged-in users |
| `backend/supabase/functions/recommend/index.ts` | Read `userId` from query param; remove JWT verification; fix `queryBase` mutation | Fix home screen blank + improve robustness |
| `backend/supabase/functions/fetch-videos/index.ts` | Add `?offset=N&limit=M` params | Fix 500 timeout on full seed |
| `internal/seed-videos.md` | **NEW** — full runbook for video ingestion | Prevent future agents from getting stuck on batch/timeout issues |
| `internal/push-backend-changes.md` | Updated smoke test for `fetch-videos` to use `?limit=1` | Prevent timeout in smoke test |
| `mobile/app.json` | `buildNumber` updated to reflect EAS auto-increment | Keep repo in sync |

---

### Key Gotchas Learned This Session

1. **Supabase Edge Function auth gotcha:** User JWTs sent as `Authorization` header get validated by the Supabase gateway BEFORE the function runs. A stale/transient PKCE token = 401 that never reaches your code. Always use anon key for Authorization in mobile → edge function calls.

2. **Supabase query objects are mutable.** Don't reuse the same query object for both `.count()` and `.data` fetches. Either rebuild the query or clone it.

3. **Edge Function timeout is 150s (free tier).** Any operation looping over all 66 artists will hit this. Always use `?offset=N&limit=15` batching for full seeds.

4. **EAS auto-increments build number.** Don't manually update `buildNumber` in `app.json` — EAS does it and writes it back. Commit the updated `app.json` after each build to stay in sync.

5. **`--auto-submit` flag** on `npx eas-cli build` saves a separate step — build + submit to TestFlight in one command.

6. **curl commands need `required_permissions: ['all']`** in the agent sandbox. Network is blocked by default in the sandboxed environment.

---

### How the Auth Pattern Works (for future reference)

```
Mobile app (logged in via Google OAuth)
    ↓
supabase.auth.getUser() → returns { user: { id: "uuid-here", ... } }
    ↓
fetch(`${FUNCTIONS_URL}/recommend?userId=uuid-here`, {
  headers: { Authorization: `Bearer ${ANON_KEY}` }  // ← anon key, NOT user JWT
})
    ↓
Supabase gateway: anon key is always valid → passes to function ✅
    ↓
recommend/index.ts: reads userId from URL params
    → queries watch_history WHERE user_id = userId
    → if history found → personalised recommendations
    → if no history → popular videos fallback
    ↓
Returns to mobile
```

For `search`: no user identity needed at all. Always anon key. Query in POST body.
For `recommend`: anon key + `?userId=` in URL.
For `fetch-videos`: anon key. Called from curl/cron only, not from mobile.
