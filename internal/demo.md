# Local UI Demo & Testing — Agent Runbook

How to spin up the web preview and visually test the app without waiting for a TestFlight build.

---

## Start the dev server

```bash
cd /Users/gouthamswaminathan/Documents/carnatic-app/mobile
npx expo start --web --port 8081
```

Run in the **background** — Metro will compile and serve at `http://localhost:8081`.

✅ Verify: terminal shows `Waiting on http://localhost:8081`

---

## Key URLs to test

| Screen | URL |
|--------|-----|
| Home (recommendations, mood chips) | http://localhost:8081 |
| Search | http://localhost:8081/search |
| Browse (artists / ragas) | http://localhost:8081/browse |
| Library / Profile | http://localhost:8081/profile |
| Watch History | http://localhost:8081/history |
| Liked Videos | http://localhost:8081/liked |
| Player (replace ID) | http://localhost:8081/player/dQw4w9WgXcQ |
| Privacy Policy | http://localhost:8081/privacy |

---

## How to take screenshots (agent use)

```
browser_navigate  → http://localhost:8081/<route>
browser_snapshot  → get accessibility tree (for clicking elements)
browser_take_screenshot → see the rendered UI as an image
browser_click     → tap buttons / tabs using ref from snapshot
browser_type      → type into search inputs
```

### Example flow — verify a new screen renders:
1. `browser_navigate` to the route
2. `browser_take_screenshot` to see the visual output
3. `browser_snapshot` to find interactive elements by ref
4. `browser_click` to navigate or trigger actions
5. `browser_take_screenshot` again to see the result

---

## Notes

- The web preview is **not pixel-perfect** vs native iOS — fonts, shadows, and animations differ slightly. Good enough for layout, navigation, and empty/error state checks.
- **Google Sign-In does not work** on web preview (OAuth redirect is configured for iOS). Test authenticated screens by checking that the signed-out state renders correctly.
- The `YoutubePlayer` component may not render on web — the player screen will show the metadata/actions but not the actual video embed. That's expected.
- Stop the dev server when done: `Ctrl+C` in the terminal running Metro.
