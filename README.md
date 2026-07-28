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
| `reporters.json` | Reporters behind the one-tap Reporter picker | whenever you follow someone new |
| `fonts.css` | Embedded web fonts (base64) | rarely |
| `html2canvas.min.js`, `htmltoimage.min.js` | Image-export libraries | never |

Edit any file, commit, and push to `main` — GitHub Pages redeploys the live app
automatically within about a minute. The big `fonts.css` and the libraries stay
cached in the browser, so day-to-day edits to `app.js` / `styles.css` load fast.

## Adding teams
Teams live in `teams.json`, split into `clubs` and `nations` — **242 clubs and 92
nations** today. Each entry is:

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

## Reporters
The **Reporter** picker sits in Text, directly above Handle / Outlet /
Reliability: pick a name and all three fill in one tap, with a **Profile ↗**
button that opens that reporter's page in a new tab. The list is
`reporters.json`:

```json
{"name": "David Ornstein", "handle": "@David_Ornstein", "outlet": "The Athletic", "tier": 3}
```

`tier` matches the Reliability control — 3 tier one, 2 reliable, 1 unconfirmed —
and the profile link is built from the handle (`https://x.com/<handle>`). Add
`"url"` to point somewhere else, and leave `handle` empty for an outlet you cite
without naming a person (Gazeta Sporturilor is in there that way). The picker
searches names, outlets **and** handles, so `plettig` finds Florian Plettenberg.

The tiers shipped in the file are a starting guess — they're your editorial call,
so change them. Typing over Handle or Outlet by hand un-picks the reporter, and
if `reporters.json` ever fails to load the picker is simply empty; the three
fields still work as they always did.

## Team crest backdrop
The **Style → Crest backdrop** control drops a faint team crest behind the text.
It's **off by default**; Subtle / Medium / Bold set the opacity. On transfer and
result cards both teams show, each crest placed inside its own colour region.

- Crests load on demand from `crests/<team-key>.png` (e.g. `crests/arsenal.png`,
  matching the key in `teams.json`). A team with no file simply shows nothing.
- **If you replace a crest's artwork, bump `CREST_V` in [app.js](app.js).** The
  filename doesn't change when the picture does, so browsers that already have
  the old one keep showing it; `CREST_V` is appended to the URL and forces the
  new artwork through.
- All 334 teams — 242 clubs and 92 nations — have a real crest, fetched from
  [TheSportsDB](https://www.thesportsdb.com/) (`crests/` is ~35 MB; one file loads per card).
  Club and national crests are trademarks — they're used here as editorial
  artwork, and how you publish them is your call.

### Adding a crest for a new team
Add the team to `teams.json`, then run:

```bash
python3 tools/fetch_crests.py --dry-run --only <your-new-key>
```

Drop `--dry-run` to actually download. The script only fetches keys that don't
already have a real crest, so it's safe to re-run; `--force` re-fetches anyway.
If the team's short name resolves to the wrong club — short names happily match
clubs on other continents — add an entry to `tools/crest-overrides.json`. Which
crest each key came from is recorded in `tools/crest-sources.json`.

Run one fetch at a time: two concurrent runs double the request rate and trip
the API's limit.

### Pulling in whole divisions
`tools/leagues.json` lists the clubs of the first two divisions of the top 5
leagues plus Romania — it has to be hand-listed because TheSportsDB's league
endpoints are capped on the free key (see the comment at the top of the file).

```bash
python3 tools/fetch_crests.py --leagues            # the whole roster
python3 tools/fetch_crests.py --leagues --only rodez,laval
```

This resolves each club and writes `tools/teams-proposed.json` — name, country,
`c1/c2/c3` taken from the API's own `strColour1/2/3`, plus the badge URL. It
touches nothing else: merging into `teams.json` and downloading the crests is a
separate, deliberate step. `--only` re-resolves a few clubs and merges them back
into the proposal, which is how you clear a MISS without repeating the run.

Adopting a reviewed proposal is two deliberate steps, so the teams.json change
can be reverted on its own:

```bash
python3 tools/fetch_crests.py --merge-proposal   # teams.json
python3 tools/fetch_crests.py --fetch-proposal   # crests/*.png
```

**Colours below the top flights are mostly missing from the API** and fall back
to a neutral pair. To list the clubs still carrying a default:

```bash
python3 -c "import json;d=json.load(open('tools/teams-proposed.json'))['clubs'];print('\n'.join(sorted(v['name'] for v in d.values() if v['_source']['colours_missing'])))"
```

On iPhone: open the live link in Safari → Share → **Add to Home Screen** to run
it full-screen like an app.
