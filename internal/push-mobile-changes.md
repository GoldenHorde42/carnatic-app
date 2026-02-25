# Push Mobile Changes — Agent Runbook

Run these steps in order every time the React Native app code changes.
After each step, verify success before proceeding.

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

## Step 2 — Trigger EAS iOS build

```bash
cd /Users/gouthamswaminathan/Documents/carnatic-app/mobile
npx eas-cli build --platform ios --profile production --non-interactive
```

⏳ This takes ~15 minutes. The build runs in the cloud.

**If it fails with "Not logged in":**
> 🛑 STOP — ask the user to run:
> ```bash
> npx eas-cli login
> ```
> Then continue from Step 2.

✅ Verify: output shows `Status: finished` and a build ID.

---

## Step 3 — Check build status (if running in background)

```bash
cd /Users/gouthamswaminathan/Documents/carnatic-app/mobile
npx eas-cli build:list --platform ios --limit 3 --non-interactive
```

✅ Verify: most recent build shows `Status: finished`.

---

## Step 4 — Submit build to TestFlight

```bash
cd /Users/gouthamswaminathan/Documents/carnatic-app/mobile
npx eas-cli submit --platform ios --profile production --non-interactive --latest
```

**If it asks to select a build interactively:**
> 🛑 STOP — ask the user to run without `--non-interactive`:
> ```bash
> npx eas-cli submit --platform ios --profile production
> ```
> User selects the latest build. Then continue.

⏳ Takes 5–10 minutes for Apple to process the upload.

✅ Verify: output shows `Submitted to Apple App Store Connect!`

---

## Step 5 — Update internal/CHANGELOG.md

Add an entry at the top of `internal/CHANGELOG.md`:
```
## [Date] — <session title>

### Fixed / Added / Changed
- <file changed> — <what and why>
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
- ✅ Build submitted to TestFlight
- ⏳ Apple usually takes 10–15 min to process the build
- 📱 Open TestFlight on iPhone → Update the app → Test the changes
- If this build is for App Store submission: go to App Store Connect → select the new build → Submit for Review

---

## Notes

- **iOS and Android are separate builds.** Run this for iOS. For Android, run `internal/push-mobile-changes.md` with `--platform android`.
- **Do NOT submit to App Store Review automatically** — always confirm with the user first.
- **Build number** auto-increments in EAS — no manual change needed.
- If the same code was already built (EAS deduplication), the build will be instant and reuse the previous artifact.
