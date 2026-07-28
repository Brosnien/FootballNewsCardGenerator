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
{"name": "David Ornstein", "handle": "@David_Ornstein", "outlet": "The Athletic", "tier": 5}
```

`tier` matches the Reliability control — 5 tier one, 4 very reliable, 3 reliable,
2 unconfirmed, 1 speculation — and the profile link is built from the handle
(`https://x.com/<handle>`). The scale used to run 1–3; a card saved on the old one
is carried to the rung with the same word by `TIER_UP` in `app.js`. Add
`"url"` to point somewhere else, and leave `handle` empty for an outlet you cite
without naming a person (Gazeta Sporturilor is in there that way). The picker
searches names, outlets **and** handles, so `plettig` finds Florian Plettenberg.

A tier in the file is a **default for that reporter, not a verdict** — the
Reliability control still moves per card, so drop a good name to 2 or 1 for a
thin story. The 36 sit at 8 / 15 / 11 / 2 across rungs 5–2; **rung 1 is
deliberately empty**, because nobody on a hand-picked list is pure speculation —
it's there for when *a story* is, not a person. They're your editorial call, so
change them. Typing over Handle or Outlet by hand un-picks the reporter, and
if `reporters.json` ever fails to load the picker is simply empty; the three
fields still work as they always did.

## Team crest backdrop
The **Style & colours → Crest backdrop** control drops a faint team crest behind
the text. It ships on at **Medium**; Off / Subtle / Medium / Bold set the opacity.
On transfer and result cards both teams show, each crest placed inside its own
colour region.

It shipped *off* until 2026-07-28, from when `crests/` held placeholder shields —
which read as "the crests are broken" once they were real. A device that used the
app under the old default has its saved draft bumped once (`crestOnByDefault` in
the store); turning it Off by hand after that sticks.

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
- **Size comes from the badge, not from a fixed box.** Every file is a square, but
  the badge inside it isn't: a round crest fills it, a tall shield leaves side
  gaps, a wordmark leaves gaps above and below. So each file is measured once when
  it loads (`measureCrest`) and the two crests on a card are scaled to the same
  visible size — whichever side has less room sets it for both, which is why a
  pair always matches and neither is ever clipped. Nothing to configure.

## Split shapes
The **Split** control on a transfer card is a table in [app.js](app.js), `SPLITS`.
A shape is its seam: an angle, where along that angle the seam falls (`s`, 0.5
being through the middle), and optionally a slice of the card the band covers —
two half-height bands with opposite angles give the chevrons. Everything else is
derived from those numbers, including where each crest goes and how big it can be,
so **adding a shape is a row in that table**, not a round of tuning by eye.

Seams are straight on purpose. The three curved ones (radial gradients) were
dropped on 2026-07-28 — they were the shapes the crests sat worst on, and a curve
can't be reasoned about the way a straight seam can. A card saved on one comes
back on Diagonal (strong).

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
to a neutral pair. To list the clubs the API couldn't colour:

```bash
python3 -c "import json;d=json.load(open('tools/teams-proposed.json'))['clubs'];print('\n'.join(sorted(v['name'] for v in d.values() if v['_source']['colours_missing'])))"
```

### Colours from the crest

Those 131 clubs have had their colours read off their own badge, which is already
on disk — no API, no network. `tools/crest_colours.py` decodes the PNG with stdlib
zlib, clusters the badge into flat colours and writes `c1/c2/c3`:

```bash
python3 tools/crest_colours.py --check      # score it against clubs we already trust
python3 tools/crest_colours.py --propose    # -> tools/teams-colours.json, review it
python3 tools/crest_colours.py --apply      # merge that into teams.json
```

**What it is and isn't good at, measured against 111 clubs whose colours we
already trust:** the club's main colour is somewhere in the extracted palette
**86%** of the time, but the badge only says which colour is the *primary* one
about **54%** of the time — Lyon play in white with a red-and-blue badge. So
expect the right colours in the wrong order on some clubs. `tools/teams-colours.json`
records each club's full badge palette next to the choice, so disagreeing is a
one-line edit; `--only <key>` redoes a single club.

You can also fix a club without touching `teams.json` at all: **Style & colours**
has a set of colour inputs per side of the card — left/single team and right-hand
team — so either club's colours can be corrected on the card and saved with the
draft.

On iPhone: open the live link in Safari → Share → **Add to Home Screen** to run
it full-screen like an app.
