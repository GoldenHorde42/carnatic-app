# Push Backend Changes — Agent Runbook

Run these steps when Supabase Edge Functions or database schema changes.
**No new app build is needed** — backend changes go live immediately.

---

## Determine what changed

| Change type | Steps needed |
|---|---|
| Edge Function changed (`search`, `fetch-videos`, `recommend`) | Steps 1 → 2 → 4 |
| Database migration (new table, column, index) | Steps 1 → 3 → 4 |
| Both | Steps 1 → 2 → 3 → 4 |

---

## Step 1 — Commit and push to GitHub

```bash
cd /Users/gouthamswaminathan/Documents/carnatic-app
git add -A
git commit -m "<describe what changed>"
git push origin main
```

✅ Verify: terminal shows `main -> main` with no errors.

---

## Step 2 — Deploy Edge Function(s)

Run only for the function(s) that changed:

```bash
cd /Users/gouthamswaminathan/Documents/carnatic-app/backend
supabase functions deploy search        --project-ref lyvbiiogdaoeawakoxgf
supabase functions deploy fetch-videos  --project-ref lyvbiiogdaoeawakoxgf
supabase functions deploy recommend     --project-ref lyvbiiogdaoeawakoxgf
```

**If it fails with "Access token not provided" or "Not logged in":**
> 🛑 STOP — ask the user to run:
> ```bash
> supabase login
> ```
> User pastes their Personal Access Token (format: `sbp_...`)
> Found at: https://supabase.com/dashboard/account/tokens
> Then continue from Step 2.

✅ Verify: output shows `Deployed Function <name> version <N>`

---

## Step 3 — Apply database migration

Only if a new `.sql` file was added to `backend/supabase/migrations/`:

```bash
cd /Users/gouthamswaminathan/Documents/carnatic-app/backend
supabase db push --project-ref lyvbiiogdaoeawakoxgf
```

**If it fails with "already exists" errors for old migrations:**
> Run repair commands for the migrations that already exist:
> ```bash
> supabase migration repair --status applied <migration_number> --project-ref lyvbiiogdaoeawakoxgf
> ```
> Then retry `supabase db push`.

✅ Verify: output shows `Applied migration <name>` with no errors.

---

## Step 4 — Smoke test the function

Test `search` is working:
```bash
curl -X POST \
  "https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/search" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dmJpaW9nZGFvZWF3YWtveGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTAwMDMsImV4cCI6MjA4NzM4NjAwM30.tBBG-L49gDEz67c9kfzoANogbKr3Bb8hXfwq3iH-iq8" \
  -H "Content-Type: application/json" \
  -d '{"query": "TM Krishna"}' | head -c 500
```

✅ Verify: response contains `videos` array with results, not an error.

Test `fetch-videos` is reachable (single artist — avoids 150s timeout):
```bash
curl -s --max-time 60 \
  "https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos?artist=Sanjay" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dmJpaW9nZGFvZWF3YWtveGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTAwMDMsImV4cCI6MjA4NzM4NjAwM30.tBBG-L49gDEz67c9kfzoANogbKr3Bb8hXfwq3iH-iq8"
```

⚠️ **DO NOT** use `?seed=true` without `&limit=N` — it tries to process all 66 artists at once
and **will timeout with a 500 error**. For a full seed, see `internal/seed-videos.md`.

✅ Verify: response contains `totalFound` or `totalAdded`, not an error.

---

## Step 5 — Update internal/CHANGELOG.md

Add an entry at the top of `internal/CHANGELOG.md`:
```
## [Date] — <session title>

### Fixed / Added / Changed
- `backend/supabase/functions/<name>/index.ts` — <what and why>
- `backend/supabase/migrations/<file>.sql` — <what and why>
```

Then commit:
```bash
cd /Users/gouthamswaminathan/Documents/carnatic-app
git add internal/CHANGELOG.md
git commit -m "docs: update changelog"
git push origin main
```

---

## Step 6 — Notify user

Tell the user:
- ✅ Edge Functions deployed and live immediately
- ✅ Database migration applied (if any)
- 🔍 Smoke test result
- No app rebuild needed — changes are live for all users instantly

---

## Key References

| Item | Value |
|---|---|
| Supabase project ref | `lyvbiiogdaoeawakoxgf` |
| Supabase dashboard | https://supabase.com/dashboard/project/lyvbiiogdaoeawakoxgf |
| Edge Functions directory | `backend/supabase/functions/` |
| Migrations directory | `backend/supabase/migrations/` |
| Supabase PAT location | https://supabase.com/dashboard/account/tokens |
