# Seed / Refresh Videos from YouTube — Agent Runbook

Use this whenever you want to pull new videos from YouTube into the database.

---

## Background: Why Batching Is Required

The `fetch-videos` Edge Function loops through all 66 artists and makes YouTube API calls.
Supabase free-tier Edge Functions have a **150-second execution timeout**.
Running all 66 artists at once (~6,600 API units) takes longer than 150s and returns a `500 Internal Server Error`.

**Solution:** the function supports `?offset=N&limit=M` to process a slice of artists per call.
Run 3–4 batches of ~15–20 artists each, waiting for one to finish before firing the next.

---

## Daily refresh (3-day lookback — used by cron)

Only fetches videos published in the last 3 days. Very fast — won't timeout.
```bash
curl -s \
  "https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" -d '{}'
```
This is already scheduled by the pg_cron job `daily-fetch-videos` (runs at 6 AM UTC).
You only need to trigger this manually if the cron missed a day.

---

## Full seed (all-time — run when quota resets or new artists added)

Run these **sequentially** (wait for each to finish before the next):

```bash
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dmJpaW9nZGFvZWF3YWtveGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTAwMDMsImV4cCI6MjA4NzM4NjAwM30.tBBG-L49gDEz67c9kfzoANogbKr3Bb8hXfwq3iH-iq8"
URL="https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos"

# Batch 1: artists 0–19
curl -s --max-time 140 "$URL?seed=true&offset=0&limit=20" \
  -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{}'

# Batch 2: artists 20–34
curl -s --max-time 140 "$URL?seed=true&offset=20&limit=15" \
  -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{}'

# Batch 3: artists 35–49
curl -s --max-time 140 "$URL?seed=true&offset=35&limit=15" \
  -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{}'

# Batch 4: artists 50–end
curl -s --max-time 140 "$URL?seed=true&offset=50" \
  -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{}'
```

Each response looks like:
```json
{"success":true,"artists":{"total":66,"processed":20,"offset":0},"totalFound":553,"totalAdded":553,"quotaUsed":"4949 / 10000 daily units"}
```

**Daily quota budget:** each full seed costs ~6,600–9,000 units. The free tier is 10,000/day.
Don't run a full seed and a daily refresh on the same day — you'll likely exceed quota.

---

## Debug a single artist

```bash
curl -s --max-time 60 \
  "https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos?artist=Sanjay" \
  -H "Authorization: Bearer $ANON"
```

---

## Check current video count

```bash
curl -s -I "https://lyvbiiogdaoeawakoxgf.supabase.co/rest/v1/videos?select=count" \
  -H "Authorization: Bearer $ANON" \
  -H "apikey: $ANON" \
  -H "Prefer: count=exact" | grep content-range
# e.g. content-range: 0-0/997
```

## Check per-artist video counts

```bash
curl -s "https://lyvbiiogdaoeawakoxgf.supabase.co/rest/v1/videos?select=artist_name&limit=2000" \
  -H "Authorization: Bearer $ANON" \
  -H "apikey: $ANON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
counts = {}
for row in data:
    name = row.get('artist_name') or 'Unknown'
    counts[name] = counts.get(name, 0) + 1
for name, count in sorted(counts.items(), key=lambda x: -x[1]):
    print(f'{count:4d}  {name}')
print(f'---')
print(f'{sum(counts.values()):4d}  TOTAL')
"
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `500 Internal Server Error` | Too many artists in one call — exceeded 150s timeout | Use `?offset=N&limit=15` batching |
| `totalAdded: 0, totalFound: 0` | No new videos in the lookback window, OR these artists are Tier 2/3 and videos already exist (upsert skips duplicates) | Normal for Tier 2/3 artists after first seed |
| `quotaExceeded` in results | YouTube API daily quota hit (10,000 units) | Wait until midnight Pacific time for quota reset, then retry |
| Empty JSON response / curl timeout | curl's `--max-time` hit before Supabase responded | Increase `--max-time` or reduce `--limit` |

---

## Key values

| Item | Value |
|------|-------|
| Function URL | `https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos` |
| Anon key | In `.env` as `SUPABASE_ANON_KEY` |
| YouTube quota | 10,000 units/day — resets midnight Pacific |
| Max per batch (safe) | 20 artists (~2,000 units, ~60s) |
| Artists in DB | 66 total |
| Videos in DB (after Feb 2026 seed) | 997 |
