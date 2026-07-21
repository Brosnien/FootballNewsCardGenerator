# FootballNewsCardGenerator

Generator for football news / transfer / result cards.

**Live app:** https://brosnien.github.io/FootballNewsCardGenerator/generator-ios.html

## How it works
The app is split into cached static files so edits only re-download what changed:

| File | What it is | Changes |
|------|------------|---------|
| `generator-ios.html` | Page structure (the entry point / bookmarked URL) | occasionally |
| `styles.css` | App styling | often |
| `app.js` | App logic + team data | often |
| `fonts.css` | Embedded web fonts (base64) | rarely |
| `html2canvas.min.js`, `htmltoimage.min.js` | Image-export libraries | never |

Edit any file, commit, and push to `main` — GitHub Pages redeploys the live app
automatically within about a minute. The big `fonts.css` and the libraries stay
cached in the browser, so day-to-day edits to `app.js` / `styles.css` load fast.

On iPhone: open the live link in Safari → Share → **Add to Home Screen** to run
it full-screen like an app.
