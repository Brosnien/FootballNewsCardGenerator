# FootballNewsCardGenerator

Generator for football news / transfer / result cards.

**Live app:** https://brosnien.github.io/FootballNewsCardGenerator/generator-ios.html

## How it works
The app is split into cached static files so edits only re-download what changed:

| File | What it is | Changes |
|------|------------|---------|
| `generator-ios.html` | Page structure (the entry point / bookmarked URL) | occasionally |
| `styles.css` | App styling | often |
| `app.js` | App logic | often |
| `teams.json` | Club + national-team list and colors | whenever you add teams |
| `fonts.css` | Embedded web fonts (base64) | rarely |
| `html2canvas.min.js`, `htmltoimage.min.js` | Image-export libraries | never |

Edit any file, commit, and push to `main` — GitHub Pages redeploys the live app
automatically within about a minute. The big `fonts.css` and the libraries stay
cached in the browser, so day-to-day edits to `app.js` / `styles.css` load fast.

## Adding teams
Teams live in `teams.json`, split into `clubs` and `nations`. Each entry is:

```json
"barcelona": {
  "country": "Spain",          // clubs use "country"; nations use "continent"
  "name": "Barcelona",         // shown on the card and in the picker
  "c1": "#A50044",             // background (the team's main colour)
  "c2": "#004D98",             // text / secondary colour
  "c3": "#EDBB00",             // accent / seam colour
  "plate": "none",             // "none" or a hex colour for a text plate
  "crest": ""                  // unused; leave empty
}
```

The key (`"barcelona"`) just has to be unique. `country`/`continent` groups the
team in the pickers — reuse an existing group name to slot it in, or invent a
new one. Add as many as you like; the team pickers in the app are search boxes,
so a long list stays easy to browse (type a team **or** country name).

## Team crest backdrop (prototype)
The **Style → Crest backdrop** control drops a faint team crest behind the text
on single-team cards (News, Quote, Player stats). It's **off by default**.

- Crests load on demand from `crests/<team-key>.png` (e.g. `crests/arsenal.png`,
  matching the key in `teams.json`). A team with no file simply shows nothing —
  so you can add crests gradually.
- Use square-ish PNGs with a transparent background. They're shown large in the
  bottom-right at low opacity, so internal light/dark detail reads best.
- The files currently in `crests/` are **generic placeholders** (a shield with
  initials), only there so the effect is visible. Replace them with real crests
  **you have the rights to use** — club/national crests are trademarked, so
  sourcing and licensing them is on you.

On iPhone: open the live link in Safari → Share → **Add to Home Screen** to run
it full-screen like an app.
