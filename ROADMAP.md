# Roadmap — Football News Card Generator

Living plan file. Every prompt that changes this repo updates this file in the same commit:
tick items, add newly agreed ones, refresh the date line below. The wording of the items is
the author's own — notes in _italics_ are added by Claude.

_Last updated: 2026-07-28 — **B15 and B16**, the two leftovers you picked once the backlog table
ran empty. **B15: reliability is a 5-dot scale**, closing the half of the NO1 PRIORITY item never
delivered ("increase rating range (3 dots -> 4/5 dots)"); the new rungs **Very reliable** and
**Speculation** split the old top and bottom, so a saved card keeps the **word** it had, not the
number. **B16: no club renders on the generic black-on-white any more** — the 131 clubs the API
couldn't colour got their colours **read off their own badge**, which was already on disk, in 42
seconds and with no network. Measured against 111 clubs we already trust: it finds the right
colours **86%** of the time but only picks the right **primary** one **54%** of the time, which is
a ceiling (Lyon play white behind a red-and-blue badge), so expect right-colours-wrong-order on a
few. **13 clubs are worth your eye** and both files say which._

_Previously the same day: **the crests on your phone weren't broken: the Crest backdrop control
ships Off, so nothing was drawing them.** That default dates from when `crests/` held placeholder
shields; every team has its real badge now, so **it ships on at Medium** and a device that used the
app under the old default gets its draft bumped once. Ruled out first: the live files are
byte-identical to what was tested, every crest serves 200, and the canvas measurement B11 added
degrades safely when blocked. It did surface a real bug — **Reset kept your current team's crest
while snapping the name and colours back to Arsenal** — now fixed, along with a returning session
showing the draft's old date until you touched something._

_Previously the same day: **B11 and B14 are done, and with them the backlog is empty.** The
**curves are gone**, replaced by **Chevron ▶ / ◀** and **Vertical 60/40 / 40/60**, and the crests
were rebuilt: you were right that the left one was being cut, but it wasn't the side — the crest
box was 583px wide and a crest layer is only 540px, so any badge that fills its file lost up to
**76px** while a narrow one lost nothing. **Size comes from the badge now, not from a fixed box**,
and both crests on a card are scaled to the same visible size. Measured: 8 shapes × 6 pairs ×
both formats = **96 cases, 0 clipped, 0 spilled in the exported PNG, both crests the same size
every time** — including the soft diagonal's old 2% spill, now zero. The four shapes you kept
render byte-identically. **One trade-off: a round badge is ~15% smaller than it was**
(`CREST_TARGET` is the one number to raise if you want them bigger)._

_Previously the same day: **B12 — the right-hand team has its own colour inputs.**
**Style & colours** carries two labelled rows, left/single team and right team; the right
team keeps its name from [teams.json](teams.json) but takes its colours from the new `d1/d2/d3`
fields, which fill in when you pick it and travel with it through a swap. They save with the
draft and with a preset, and the override is in the exported PNG (sampled, not assumed).
**This is the quick way round B13's colour debt** — fix a club on the card instead of editing
`teams.json` first._

_Previously: **B5 is done: the byline is now one tap.** A **Reporter** picker
sits above Handle / Outlet / Reliability and fills all three from
[reporters.json](reporters.json) (**36 reporters**, with a **Profile ↗** link out); it searches
names, outlets and handles. Verified in the browser down to the phone width, including the
"file is missing" path. **The tiers in the file are my guess — give them one pass.** Next is
**B11 → B12**._

_Previously: **B13 is closed: the app now carries 242 clubs and 92 nations**,
every one with its own real crest (`crests/` 152 → 334 files, 34.6 MB; 0 missing, 0 orphans, no
two teams sharing an image). You said ship all, so all 182 proposed clubs landed — England 10 →
44, Spain and Italy 8 → 40, Germany 7 → 36, France 6 → 36, Romania 6 → 31. **The one thing left
behind: 131 of the new clubs carry at least one fallback colour** (85 carry three), listed in
`tools/teams-proposed.json`; fix them a few at a time for the clubs you actually post about.
Next is **B5 → B11 → B12**._

_Previously: **B13 prompt 1**: the fetcher learned to scan whole divisions
(`--leagues`) and proposed **182 new clubs** with colours and badge URLs. One correction
to an earlier finding: **colours are not free below the top flights** (51 of 182 complete, 85
with none). Also **dropped B1, B2 and B6 (the automation items)** at the author's request, and
fixed two crests that were the wrong clubs entirely (`bayern` was Bayern Hof, `frankfurt` was a
club called Frankfurt)._

_Previously: **B10 done: the card now exports at 2×** (2160 × 2700 instead of
1080 × 1350) on all three capture paths, driven by one `EXPORT_SCALE` constant so a fallback
can't quietly undo it. Costs ~0.3 s. If 2× fails or comes back blank the export retries at 1×,
so the worst case is today's image. **Still to check: one export on your iPhone** — there's no
simulator or device here. Next is **B13 → B5 → B11 → B12**._

_Previously: **B9 done: captions now emit exactly 5 hashtags**, the Instagram
limit, and the build order was turned into a priority order so both teams survive on transfer
and result cards (the second team sits in slot 2; the generic `#football` `#soccer` pair is what
gets cut). Verified in the browser on all five templates and on nations. Also **moved the three
automation items (B2, B6, B1) to the end of the file** — the manual flow comes first. (They were
dropped outright the next prompt; see the Backlog table.)_

_Previously: **five new items added (B9–B13)** from the author's notes, each
costed with a prompt to paste. Two are outright defects: Instagram cut the hashtag cap to 5 in
Dec 2025 and our captions still emit 8 (B9), and the card exports at 1:1 with no pixel headroom,
which is why text goes soft after Instagram re-compresses it (B10). Also found that team colours
can be fetched from the same API as the crests, which makes "add many more teams" (B13) a script
run rather than days of typing._

_Previously: **B3 prompt 2 done, so B3 is closed.** The colour inputs, contrast
readout and Format moved into the (closed) **Style & colours** section: nothing was removed, but
a news card now shows **10 controls instead of 17** and the headline sits 231 px closer to the
top. Also measured and dropped a contrast-warning dot — the app's ink fallback makes a bad
contrast unreachable, so it would have guarded nothing. Next is **B5** (the reporters picker),
the last repetitive typing on every card._

_Previously: **B3 prompt 1 done**: the stale-date bug is fixed (a returning
session now stamps today unless you typed a date yourself), and sections the current template
can't use collapse themselves — a Result card opens with only the Result section, no empty Text
box to scroll past. Then the source moved twice on request: **Handle/Outlet now sit under
Category/Date in the pane, and the source prints bottom-left under the card's rule** instead of
crowding the header._

_Before that: **"Next up" is finished** (152/152 real crests, verified on the live
site and through PNG export; B8 closes with it), and the crest placement on the five awkward
split shapes is fixed — bigger crests, better placed, measured to not cross the seam. Also fixed
the reason old placeholder crests kept showing on a device that had already loaded them
(`CREST_V` cache-buster), and the bug that made a single dropped request kill a crest for the
whole session._

---

## Done

- [x] Transition to claude code and host to GitHub Sites (https://github.com/Brosnien/FootballNewsCardGenerator)
      — _live at https://brosnien.github.io/FootballNewsCardGenerator/generator-ios.html; see [README.md](README.md)._
- [x] Country/Nations toggle
      — _`#tt` club/nation switch; `setTeamType()` in [app.js](app.js)._
- [x] 2 lists, one for country one for teams in it
      — _country picker filters the team picker (`optTeamsIn`, `drawPickers`)._
- [x] Add the nations teams (more than 20 European countries, top 15 for each continent)
      — _92 nations across 6 continents (Europe 30, Africa 15, Asia 15, N. America 12, S. America 10, Oceania 10), plus 60 clubs in 11 countries._
- [x] Make it more compact and visible (next prompt)
- [x] Official has no meaning as a category
      — _"Official" is a transfer **status**, not a category._
- [x] Bigger source (bigger font)
      — _source moved to the header and enlarged (commit `08cc035`)._
- [x] More fonts?
      — _8 serif families in Style → Font, embedded in `fonts.css`._
- [x] Match result templates? With goal scorers
      — _template 04; one line per event, `(R)` marks a red card (`renderGoals`)._
- [x] Stats for player in a match template? (Bukayo Saka vs France for example with mention to the platform (sofa score))
      — _template 05; outfield + goalkeeper stat sets (`STAT_FIELDS`). Empty fields are hidden._
- [x] IS THIS A GOOD IDEA OVERALL? — RESPONSE: Kinda if you don't just copy paste it (and maybe add translation).
      — _translation is still open, see Backlog._
- [x] Database file for teams?? Use a different file for keeping the data (Json). If this is done, work into the optimisation of the teams search (dropdown converted to search with dropdown).
      — _[teams.json](teams.json) loaded at startup; both pickers are searchable comboboxes (`makeCombo`)._
- [x] 50/50 colours are broken and need an update as they are Unusable / Not Working at this point in time.
      — _rebuilt as `buildSplit()` with contrast-aware ink (`inkBoth`, `bodyInk`, `scoreInk`)._
- [x] Think about the compacting the 2nd team category (transfer/match) to be near the first.
      — _second team folded into the main team area (commit `b8ded7c`)._
- [x] Increase font SIZE significantly for the reliability part (dots), also increase rating range (3 dots -> 4/5 dots). MAKE THE REPORTER'S NAME AND PUBLICATION MORE VISIBLE. NO1 PRIORITY
      — _dots and source are much bigger and moved to the top-left. **Leftover closed 2026-07-28
      as B15: the range is 5 rungs now**, not 3 — see the B15 entry at the end of the file._
- [x] Not sure if possible but automatically add the description in instagram? (Or have the text altered in the export page so we can just press copy and paste.)
      — _the export sheet builds a caption + hashtags from the card's fields (`buildCaption`, `buildTags`) with a one-tap Copy._
- [x] More graphical templates for separation (at the moment, vertical and diagonal are pretty neat but the menu needs some diversity)
      — _8 seams: vertical, 3 diagonals, 3 curves (`ANGLES`, `CURVES`)._
- [x] Should the templates be separated in different html files? Or leave it centralized? If so, generate an index page with home settings (Main Menu kinda vibe). Low speed is the deterrent.
      — _answered: stays centralised. Speed came from splitting into cached static files instead (commit `d363388`), so only the small files re-download._
- [x] Remove web/phone selector, keep it on auto
      — _layout toggle removed; `isWeb()` decides automatically._
- [x] Handle and outlet: the fields go under the category and date fields; in the picture they
      go on the left, under the graphical line.
      — _Done 2026-07-22. In the pane they are a row directly beneath Category/Date inside Text,
      so the whole byline is filled in one place (they were in the closed Source section, which
      now holds only Reliability). On the card, `#bSrc` moved out of the top-right header into
      `.foot` under `.rule`, left-aligned — class `srcHead` → `srcFoot`, 22px → 26px
      ([styles.css](styles.css), [generator-ios.html](generator-ios.html)). On a split card it
      still takes `--inkBoth`: forcing a light band pair flips it to black, checked live._

---

## Next up

- [x] Now that we use GitHub, maybe we can use Crests (Team Logo) automatically but would need all pngs of the teams. Really depends on how hard is to get all the teams logos in png form (would love to be automatic).

  **Done 2026-07-22.** `crests/` holds 152 **real** PNGs — one per team key, exact coverage,
  zero missing and zero orphans — fetched automatically from TheSportsDB by
  [tools/fetch_crests.py](tools/fetch_crests.py) and checked in the browser. The answer to
  "how hard is it": **one scripted run**, ~5 minutes, no manual downloads. Re-runnable for
  new teams — add to `teams.json`, run the fetcher, only the new keys are fetched.

### Findings — already tested, don't re-derive

Measured on 2026-07-22 against the real API and this Mac. Trust these; re-testing them is
the main way this task wastes tokens.

| Question | Answer |
|---|---|
| Source | TheSportsDB v1, `searchteams.php?t=<name>`. Free key `3` works, no signup. The path is `/api/v1/json/3/…` — the order `/api/json/v1/3/…` 404s. |
| Badge field | `strBadge` → **already a 512×512 PNG with transparency**, ~127 KB. |
| Image tooling needed | **None.** No resize, no trim, no alpha work. Download and write the bytes. |
| What's installed here | Python 3 + curl only — **no node, no PIL, no ImageMagick**. Script must be Python stdlib. |
| Rate limit | Real. 152 back-to-back requests → 38 failures; the *same* teams pass 10/10 at **2 s spacing**. Throttle 2 s + retry with backoff ⇒ ~5 min run. |
| Naming trap | A hyphen kills the search: `Paris Saint-Germain` → 0 hits, `Paris Saint Germain` → id 133714. Always retry with punctuation stripped. |
| Silent-wrong trap | Short names match foreign clubs: `Athletic Club`→Brazil, `Atlético`→Portugal, `Inter`→El Salvador, `Man United`→Manly United (Australia). **Filter candidates by the `country` already in teams.json** — this is what turns a wrong crest into an honest MISS. |
| Dead end | `lookup_all_teams.php?id=<league>` returns junk on the free key (asked for Ligue 1, got English League One). Don't build the "one call per league" shortcut. |
| Nations | Easy — 92/92 style matches resolve on the plain name. No country filter needed. |
| Size budget | 152 × ~127 KB ≈ **19 MB** in-repo, one file loaded per card. Acceptable; `strBadge + "/preview"` gives 200×200 / 46 KB (≈7 MB) if that ever matters. |

**Dry run result (2026-07-22, after prompt 1): 152 of 152 resolve, 0 misses.** Every case
below is now encoded in [tools/crest-overrides.json](tools/crest-overrides.json), so no
human decision is left. Two that the first dry run couldn't answer:

| Key | teams.json name | Answer |
|---|---|---|
| `rapid` | Rapid | neither `Rapid` nor `Rapid Bucuresti` hit — the club is listed as **Rapid 1923**, id **134017** |
| `jordan` | Jordan | `Jordan` only finds a defunct motorsport team; the national side is id **140145**, found via its alternate name `Jordanien` |

Ten more that the first dry run hadn't spotted, all just shorthand names in `teams.json`:
`czechia`→Czech Republic, `tottenham`→Tottenham Hotspur, `west-ham`→West Ham United,
`milan`→AC Milan, `gladbach`→Borussia Monchengladbach, `lille`→Lille OSC, `psv`→PSV
Eindhoven, `salzburg`→Red Bull Salzburg, `craiova`→Universitatea Craiova, `u-cluj`→
Universitatea Cluj. Plus `ajax`/`feyenoord`, which needed nothing but **"The Netherlands"**
added to the country alias map (the API spells it with the article).

One to eyeball in prompt 3: `craiova` resolves to id 138188, but Romania has two Craiova
clubs (CS U Craiova and FC U Craiova 1948).

### Implementation — three prompts, in order

Each is self-contained and sized to stay small. **Paste the quoted line as the whole prompt**;
don't re-explain the task, this file is the brief.

**Prompt 1 — build the fetcher (no downloads yet).** ✅ **done 2026-07-22**
> Roadmap Next up, prompt 1: write `tools/fetch_crests.py` per ROADMAP.md, then run it with `--dry-run` and show me only the summary table.

Scope: create `tools/fetch_crests.py` + `tools/crest-overrides.json` (seeded from the table
above). Flags: `--dry-run` (resolve only, no writes), `--only <key,key>`, `--force`
(re-fetch keys that already have a real crest). Reads only `teams.json`. Writes nothing
into `crests/` on a dry run. Output is a **counts line plus the problem rows only** — never
a per-team log of 152 lines.

_Landed: [tools/fetch_crests.py](tools/fetch_crests.py) and
[tools/crest-overrides.json](tools/crest-overrides.json). Two extra flags beyond the spec:
`--group nations|clubs|all` (prompt 2 needs it to split the batches) and `--preview`
(200×200 badges if the 19 MB ever bites). A fetch also writes `tools/crest-sources.json`
recording id/name/country/URL per key — that doubles as the "this one is real, skip it"
check, so re-runs cost nothing and `--force` overrides it._

**Prompt 2 — fetch for real, in two batches.** ✅ **done 2026-07-22**
> Roadmap Next up, prompt 2: run the fetcher for nations, then for clubs, and report the counts.

Nations first (92, the clean set) so a rate-limit surprise costs one batch, not the run.
The script writes straight into `crests/<key>.png`. Report = counts + any new MISS.
Commit each batch separately so a bad batch is one `git revert`.

_Result: **152/152 real crests, 0 misses** — 92 nations, 60 clubs, all distinct images,
512×512 bar two (256 and 500). `crests/` grew 3.1 MB → 16 MB. Provenance for every key is in
`tools/crest-sources.json`._

_One lesson worth keeping: the nations run was started twice at once, which doubled the
request rate (three false "rate-limit" misses) and interleaved both runs' manifest writes
into invalid JSON. The PNGs were never at risk, but 22 provenance records were lost and had
to be re-fetched. The script now writes the manifest atomically after each crest and takes a
lockfile, so a second run refuses to start. **Run one batch at a time.**_

**Prompt 3 — eyeball and ship.** ✅ **done 2026-07-22**
> Roadmap Next up, prompt 3: open the app and check the crest backdrop on a few cards, then commit.

Spot-check in the browser: one single-team card, one transfer with a curve split, one
result. Confirm the crest sits inside its own colour block and survives PNG export. Then
tick this item and commit.

_Checked on the live site: News/Arsenal (single), Transfer/Milan→PSG on Curve (deep) **and**
Diagonal (strong), Result/Inter–Athletic. Every crest sat inside its own colour region._

_Export verified without downloading anything: exporting the same card with the crest on and
off and diffing the two PNGs, the crest changes **18,576 sampled pixels** and every changed
pixel falls in one of two clusters — one per team's own region, zero crossover, zero change
in the middle band. PNG 59 KB → 159 KB at 1080×1350._

_Both flagged teams are right: `craiova` is the light-blue CS Universitatea Craiova (lion +
"CRAIOVA"), not FC U Craiova 1948; `monaco` is AS Monaco. Also eyeballed `rapid`, `u-cluj`,
`jordan`, `uae`, `czechia` — all correct._

_Not a bug, worth recording: **Result cards ignore the Split control and are always
vertical** — the control is `data-for="move"` and [app.js:376](app.js:376) hard-codes
`WALLPOS.vert` for result. Diagonal/curve coverage therefore comes from transfer cards._

### Token discipline for this task

- The script does the work; the model reads a **summary**, never per-team output.
- **Never open a crest PNG** to check it — that's an image into context for zero benefit.
  Verify with `sips -g pixelWidth -g hasAlpha` or by looking at the card in the browser.
- Don't paste `teams.json` or API JSON into chat; the script reads them from disk.
- If a run half-fails, re-run with `--only <the failed keys>` instead of starting over.
- Club crests are trademarks — sourcing and use are the author's call.

- [x] In the split dropdown some templates make crests look off, so they would need to be placed
      better and to be increased in size. The templates are: Diagonal strong and reverse, Curve
      soft, deep and reverse.

  **Done 2026-07-22.** All five now carry a crest of the same size as the vertical split
  (583px, 0.54 of the card width) instead of the 0.36–0.52 they had, and each sits at the
  visual centre of its own colour block. Placement is verified, not eyeballed: exporting each
  card with the crest on and off and testing which side of the seam every changed pixel falls
  on gives **0 spilled pixels** on all five, in both Portrait 4:5 and Square 1:1.

  What actually made these hard to tune: `WALLPOS` held CSS `background-position`
  percentages, but each crest layer is only half the card wide, so once the crest is about as
  wide as its layer the percentage divides by nearly zero and a small size change throws the
  crest across the card. It now holds fractions of the card and computes pixels
  ([app.js](app.js), `WALLPOS` + `put`). Vertical and Diagonal-soft were left alone and still
  render within 0.4px of before.

  _Superseded 2026-07-28 (B11 + B14): the three curves are gone, and `WALLPOS` with them —
  giving every crest the same 583px box was the thing that cut the wide badges, because a crest
  layer is only 540px wide. Size is measured off each badge now._

- [x] In the nation tab I can only see Romania's crest. Check for the other nations.

  **Not a missing-crest bug — a caching one.** Checked all 92 nations against the live site:
  every one returns HTTP 200 and every one renders its own crest, none hidden, none falling
  back to another team's. Same for all 60 clubs. The artwork replaced the placeholders under
  the *same filenames*, so any browser holding an old `crests/<key>.png` keeps serving the
  placeholder shield — nothing in the URL told it the picture had changed.

  Fixed at the source: `CREST_V` in [app.js](app.js) is appended to every crest URL, so new
  artwork gets a new URL. Bump it whenever a crest is replaced (noted in [README.md](README.md)).
  Verified after the change: 92/92 nations and 60/60 clubs load, and export still renders the
  crest with the query string in place.

  _If a device still shows old crests after this deploys, it is holding a stale `app.js`;
  closing and reopening the home-screen app clears it._

- [x] Some logos didn't load when testing — Club Brugge for example.

  **A real bug, and one the cache-buster above provoked.** A failed crest probe marked that
  team `"no"` for the rest of the session ([app.js](app.js), `put`), so a *single* dropped
  request meant that crest never appeared again until a reload. Normally rare — but giving all
  152 crests new URLs at once forces 16 MB of re-downloads in a burst, which is exactly when a
  phone drops requests. Hence "some logos", no pattern, only after the last deploy.

  The probe now retries with backoff and only gives up after `CREST_TRIES` (3) real failures.
  Both paths were tested by injecting failures, not by hoping: a crest whose first two probes
  are dropped **recovers on the third and displays**; a crest that always fails stops at
  **exactly 3 attempts** and never retries again. Clean-session sweep after the fix: 152/152
  show their own crest.

  _Nothing was wrong with the artwork — `crests/brugge.png` is a valid 512×512, 84 KB PNG,
  byte-identical in the repo and on the live site, and all 152 decode with real content._

  _Open, not fixed — say the word and it becomes its own item:_ **Diagonal (soft) spills** about
  2% of its crest pixels across the seam onto the other team's colour. It predates this change
  and isn't on your list, so I left it rather than alter a shape you're happy with.

  _**Closed 2026-07-28 by B11**, which replaced the tuned crest table with geometry computed from
  the seam: Diagonal (soft) now measures **0 spilled pixels**, and the shape itself is untouched._

---

## Backlog

Items stay in the author's original order, minus the three automation items (**B1, B2, B6**),
dropped on 2026-07-27 at the author's request — see the note under the table. B9–B13 were added
2026-07-27; B14 was added 2026-07-28. B15 and B16 were added 2026-07-28, when the table ran empty
and you picked the next two out of the leftovers parked in this file. B4, B7 and B8 aren't work
items. One prompt per row; paste the quoted line as the whole prompt.

| # | Item | Prompts | Blocked on |
|---|---|---|---|
| B15 | Reliability range 3 → 5 dots | done | — |
| B16 | Colour debt — the 131 fallback clubs | done | — |
| B14 | Ditch the curve splits, replace them | done | — |
| B11 | Crest size / symmetry on splits | done | — |
| B12 | Colour picker for the second team | done | — |
| B5 | Reporters picker | done | — |
| B3 | Fewer fields / faster (NO1) | done | — |
| B9 | Cap hashtags at 5 + both teams | done | — |
| B10 | Sharper exported image | done | a check on your phone |
| B13 | Many more teams (top 5 ×2 + Romania) | done | — |
| B7 | Posts vs reels | 0 | — |
| B8 | Crest overlay | 0 | done with Next up |
| B1, B2, B6 | Automation — **dropped** 2026-07-27 | — | — |

**Dropped on 2026-07-27, at the author's request:** B1 (use of the online repo), B2 (auto-pull
from X) and B6 (translation). They were the three items that automate the flow rather than speed
up making a card by hand, and none of them was going to be started. The item text is gone from
this file but not from history — `git show 4006a4f:ROADMAP.md` still has all three in full,
research included. Say the word and any of them comes back. The findings below are kept because
they cost real testing and stay true whatever we build next.

### Shared findings — tested 2026-07-22, don't re-derive

| Question | Answer |
|---|---|
| Can we read other people's X posts free? | **No.** X killed the free tier in Feb 2026; new developers are pay-per-use only. |
| What does it actually cost? | **$0.005 per post read**, $0.015 per post created ($0.20 with a link), capped at 2M reads/month. |
| Does polling multiply the cost? | **No** — the same post re-requested inside a 24 h UTC window is charged **once**. Poll as often as you like; only unique posts cost. |
| Instagram / Threads as a *source*? | Dead end — no public read of other people's posts at any price. X is the only viable source. |
| Instagram as a *destination*? | **Free.** The publishing API does single images, carousels and reels; 100 posts/24 h; needs a professional account linked to a Page. |
| Carousel cost | A carousel counts as **one** post — so a multi-language carousel is as cheap as a single post. |
| Instagram media hosting | Media **must sit at a public URL** when publishing. GitHub Pages already gives us one — that's the link between B1 and B7. |
| Instagram hashtag cap | **5 per post and Reel**, a hard limit since Dec 2025 (was 30). Our captions emit exactly 5 since B9. |
| Can team colours be fetched? | **Yes** — TheSportsDB returns `strColour1/2/3` on the same record as the crest, matching our c1/c2/c3 model. Makes B13 scriptable. |
| Free translation | DeepL API Free = **500 k chars/month**, Microsoft = 2 M/month. A card is ~200 chars, so ~2,500 cards/month free. LibreTranslate is free but self-hosted and visibly weaker. |

---

- [x] If kept manual, even more simplification? (brainstorm how we can use as few fields as possible, as fast as possible. Process should be very quick to keep relevancy). IF KEPT THIS IS NO1 PRIORITY **(B3)**
      — _Both planned prompts are done. Ticked for the structural work, not for the stopwatch:
      whether a card really takes under 30 s is yours to judge in real use. If it still drags,
      say so and un-tick it — the next lever is **B5**, which turns handle + outlet + reliability
      into one tap and is the last repetitive typing left on every card._

  Target: a finished card in **under 30 seconds**. What the code already gives us — a draft
  auto-saves every 600 ms and restores on open (`snapshot`/`restore`), open sections are
  remembered, `data-for` already hides fields the current template doesn't use, and paste
  buttons exist (`addPasteButtons`). So persistence isn't the problem; **field count and
  scroll distance are.** 47 fields exist; a news card needs about 7.

  **Bug found while measuring this — fix it first, it's a one-liner.** The date auto-fills
  with today only when the field is empty ([app.js:963](app.js:963)), but the draft restore
  runs *after* it ([app.js:992](app.js:992)) and `date` is a saved field — so every returning
  session silently stamps the **last session's date** on the card. On a news app that's a
  correctness problem, not a nicety.

  Then: auto-collapse sections the current template doesn't use, lift Source out of a
  closed `<details>` (B5 makes it one tap), and push rarely-touched fields below the fold.
  > Roadmap B3 prompt 1: fix the stale-date bug per ROADMAP.md, then auto-collapse the sections the current template doesn't use.

  _Prompt 1 done 2026-07-22 ([app.js](app.js))._

  _**Stale date.** The date is now stamped after the draft restore, not before, and a
  `dateAuto` flag (saved with the draft) records whether you ever typed in the field. So a
  returning session gets today's date, while a date you set by hand survives a reload.
  Both paths tested in the browser: a draft carrying `01.01.2020` restored its headline but
  came up **22.07.2026**; a hand-typed `09.09.2025` came back unchanged._

  _**Auto-collapse.** `autoSections()` runs with the existing `data-for` pass in `render()`.
  A section counts as unused when it is hidden, or when every `data-for` field inside it is
  hidden — sections with no `data-for` fields at all (Style, Saved cards, Source) are always
  used, so nothing you rely on ever disappears. Measured result per template:_

  | Template | Text | Result | Player stats |
  |---|---|---|---|
  | news / transfer / quote | open | hidden | hidden |
  | result | **closed** (it has no fields for result cards) | **open** | hidden |
  | stats | open (Player) | hidden | **open** |

  _Your own open/closed choice still wins and is remembered per section, restored the moment
  that section is relevant again — verified by closing Text, reloading, and switching
  templates: it stayed closed. The pref moved to a new store key `sections2`, because the old
  array recorded the state of hidden sections too and now reads as "you closed it"._

  _Still open from this prompt's list: lifting Source out of its closed `<details>` (waiting
  on B5) and pushing rare fields below the fold — that's prompt 2._

  > Roadmap B3 prompt 2: cut the news and transfer cards down to the fewest fields on first screen, per ROADMAP.md. Don't remove fields, just reorder and collapse.

  _Prompt 2 done 2026-07-22 ([generator-ios.html](generator-ios.html))._

  _**What moved.** Nothing was deleted. The three colour inputs, the contrast readout and
  Format left the top of the pane and now live in the section renamed **Style & colours**,
  which stays closed by default. They sat between the team picker and the headline — the
  fields you always type — on every single card. Colours are per-team data that `teams.json`
  already fills in, and Format is a per-platform choice, so neither belongs above the text._

  | Template | Controls on first screen (before → after) |
  |---|---|
  | news | 17 → **10** |
  | transfer | 23 → **16** |
  | quote | 18 → **11** |
  | result | 16 → **9** |
  | stats | 28 → **21** |

  _Every template drops the same 7 controls, and the headline sits **231 px** closer to the
  top — measured in the browser, form top to `#head`: 557 px → 326 px. Verified across all
  five templates with no console errors, and prompt 1's collapse behaviour still holds: a
  Result card opens Result and closes Text, and a section you open by hand stays open across
  template switches._

  _**Tried and dropped.** Moving the contrast readout behind a closed section looked like it
  would hide a bad colour pair, so it got a warning dot on the summary — then measurement
  showed that state is unreachable. `bodyInk`/`pickInk` fall back to `onColor()` (whichever
  of black/white reads better), so across 18 deliberately awful combinations, including
  mid-grey on mid-grey and every plate setting, the worst contrast was **3.95:1** and the
  `.bad` class never fired. The readout is information, not a warning, so the dot was removed
  rather than shipped as a guard against something that cannot happen. `#splitBox` keeps its
  own `.bad` check — `inkBoth` has no such fallback, so split cards can genuinely go bad._

  _**Don't put `data-for` fields inside Style & colours.** `secUsed()` counts a section as
  unused when every `data-for` field in it is hidden, so a template-only field in there would
  auto-collapse the whole section for other templates and fight the user's open choice. That
  is why Split / Colors per half stayed where they are._

- [ ] DON'T BE IDIOTIC WITH PROMPTING AND LIMITS (VERY VERY HARD). **(B4)**
      — _Not a work item. The rules: one roadmap item per prompt; let a script do bulk work
      and read back a summary, never per-item output; never paste big files into chat, they're
      on disk; re-run the failed subset, not the whole job. Same "Token discipline" list as
      under Next up._

- [x] A page/another column to open directly the most commons reporters socials? Maybe something that does that and at a press of a button feeds info into the main page? Would prefer in the same page. **(B5)**

  Same page, no new tab. `reporters.json` — handle, outlet, reliability tier, profile URL —
  behind a picker sitting directly above the Source fields: one tap fills handle + outlet +
  tier, with a small link out to the profile. This is the biggest single win for B3, because
  Source is currently a closed section you must open on every card.
  > Roadmap B5: add reporters.json and a one-tap reporter picker above the Source fields, per ROADMAP.md.

  **Done 2026-07-28.** A **Reporter** row now sits in Text directly above Handle / Outlet /
  Reliability ([generator-ios.html](generator-ios.html)), and one tap fills all three
  ([app.js](app.js), `optReporters` / `pickReporter`). Beside it, a **Profile ↗** button opens
  that reporter's page in a new tab — same page for the typing, the link only when you ask for
  it. **36 reporters** ship in [reporters.json](reporters.json), covering the leagues the app
  now carries: the transfer regulars, England, Spain, Italy, Germany, France, and Romania
  (including GSP / Digi Sport / Fanatik as outlets with no handle).

  It reuses the team pickers' `makeCombo`, so it is a search box, not a 36-line dropdown. One
  addition to that shared function: an option can carry search-only text (`q`), which is how
  typing a handle finds a name — `plettig` → Florian Plettenberg, matched but never shown in
  the row.

  _Measured in the browser, not assumed:_

  | Check | Result |
  |---|---|
  | One tap fills three fields | `David Ornstein` → handle `@David_Ornstein`, outlet `The Athletic`, tier `3`; card prints `Source: @David_Ornstein · The Athletic`, dots read **Tier one** |
  | Tier really moves | `Gazeta Sporturilor` → tier 2, dots read **Reliable** |
  | Outlet with no handle | handle stays empty, card prints `Source: GSP.ro`, link uses the entry's `url` |
  | Search by handle | `plettig` returns exactly Florian Plettenberg (the name doesn't contain it) |
  | Search by outlet | `athletic` returns Ornstein + Sam Lee |
  | Draft survives a reload | picker comes back showing the name, not a blank box, and the link with it |
  | Reset / presets | `rep` is in `FIELDS`, so it saves with a card and clears on Reset |
  | Hand-editing the byline | typing over Handle or Outlet un-picks the reporter and hides the link |
  | `reporters.json` missing (tested with the file renamed) | app loads, picker reads "— none · type it myself —", the byline still types and prints |
  | Phone width (375px) | picker 234px + button 101px on one line, no horizontal overflow |

  _The tiers in the file are **my starting guess**, not a judgement you signed off on — they're
  the one thing worth a pass. Same for a couple of outlets that move around (Romano is filed
  Sky Sport Italia)._

  _One thing this doesn't fix, and it isn't B5's to fix: on a **Result** card the whole Text
  section auto-collapses (B3's rule — none of its `data-for` fields apply to a result), so the
  byline and now the reporter picker start closed there. Every other template opens with them
  visible. Say the word and Text stops collapsing when the card still uses its byline._

- [ ] Should post on instagram in form of: posts or reels of posts? (are these both?) **(B7)**
      — _They're different things: a feed post is the static image, a reel is video. The API
      does both, free. A text card is a still image, so **feed post**. Reels reach further but
      need a video template that doesn't exist yet; not worth building until the manual flow is
      fast. Nothing to code here — and publishing through the API was part of the automation
      work dropped on 2026-07-27, so today the answer is simply: post the exported PNG by hand._

- [ ] Maybe add overlaying crests/logos as background with a dimmer opacity? Big crests, occupying all of the team's card - Ex: Cannon for Arsenal occupies 50%, Spurs chicken 50%. (Transfers and Matches are the affected templates) **(B8)**
      — _**Done 2026-07-22.** `updateWall()` + `WALLPOS` place each team's crest deep inside its own
      colour region for all 8 seam shapes, with a Subtle/Medium/Bold opacity control. Now running on
      real artwork since "Next up" landed, and verified to survive PNG export._

  _**2026-07-28 — "crests are not loading at all" on the phone: they weren't loading because the
  control ships Off.** Not a bug, a stale default: it was written when `crests/` held placeholder
  shields, and once all 334 were real badges the same default read as broken. **It now ships on at
  Medium**, and a device that used the app under the old default gets its saved draft bumped once
  (`CREST_DEFAULT_KEY`) — otherwise the phone keeps restoring Off and looks broken after the fix.
  Turning it Off by hand still sticks; tested both ways._

  _Two things ruled out first, so this is diagnosis rather than a guess: the live site is
  **byte-identical** to what was tested here (app.js/html/css hashes), every crest PNG serves
  200 `image/png`, and forcing `getImageData` to throw — the one genuinely browser-dependent step
  B11 added — still renders both crests, because it falls back to treating the badge as filling
  its file. There was no iOS rendering problem to find._

  _**And one real bug it surfaced: Reset restored the default name and colours but left you on
  whatever team you were on**, so a reset card read "Arsenal" in Arsenal red with Man City's crest
  on it. Invisible while the backdrop was off. `DEFAULT_TEXT` now carries the team as well, and
  Reset stamps today's date instead of blanking it. Also fixed at the same spot: the boot sequence
  changed the date (and now the backdrop) **after** the restore had already drawn the card, so a
  returning session showed the draft's old date until you touched something._

---

_Added 2026-07-27._

- [x] Max 5 hashtags for generation as instagram does not allow more. Also need the 2nd team to get the hashtag not the first only in the case of transfers. In the case of the result template we can add them both. **(B9)**

  **Done 2026-07-27** ([app.js](app.js), `buildTags`). The cap is now `MAX_TAGS = 5` instead of
  `slice(0,8)`, and the build order was rewritten as a priority order — teams first (both of
  them on transfer and result), then the player, then the category, then the league, the
  template flavour and finally `#football` `#soccer`, which are the ones the knife now takes.
  Measured in the browser, one caption per template — every one lands on exactly 5:

  | Template | Hashtags |
  |---|---|
  | news | `#arsenal #injury #premierleague #footballnews #football` |
  | transfer | `#arsenal #realmadrid #bukayosaka #premierleague #transfers` |
  | quote | `#arsenal #premierleague #footballquotes #football #soccer` |
  | result | `#arsenal #realmadrid #premierleague #matchday #fulltime` |
  | stats | `#arsenal #bukayosaka #premierleague #playerratings #matchstats` |

  Nations work the same way (`#romania #brazil #internationalfootball #matchday #fulltime`),
  and the fallbacks still fill all 5 slots when a field is blank.

  _On "only one team showing": the logic was right and still is, so the cause was the empty
  second-team picker, not truncation — a transfer card with `club2` blank gives
  `#arsenal #premierleague #transfers #transfernews #football`. **Pick the second team and it
  is always in the tag list now**, because it sits in slot 2 where nothing can push it out._

  **You're right, and it's a rule break, not a preference.** Instagram cut the cap from 30 to
  **5 hashtags per post and Reel** in December 2025. `buildTags()` still ends in
  `out.slice(0,8)` ([app.js](app.js)), so every caption we generate is over the limit.

  With only 5 slots the *order* becomes the whole design, because whatever is built last gets
  cut. Current build order is: player → team → other team → league → category → template
  flavour → `#football` `#soccer`. The evergreen pair at the end is what should go first when
  the knife comes out.

  On the second team: the code **already** pushes it for both transfer and result
  (`if(tpl==="move"||tpl==="result") push(other)`), and `other` reads the `club2` picker. So if
  you're only seeing one team, the cause is more likely that the tag is being pushed past
  position 5 and truncated, or `club2` is empty on that card — worth confirming against a real
  transfer card before changing the logic.
  > Roadmap B9: cap the caption at 5 hashtags and fix the priority order so both teams survive on transfer and result cards, per ROADMAP.md.

- [x] Quality of pic is not the best, find a way to make it generate clearer, as when posting to instagram, the text is a bit blurry. **(B10)**

  **Done 2026-07-27** ([app.js](app.js), `capture`). `EXPORT_SCALE = 2` now drives all three
  capture paths from one constant — `html2canvas({scale})` and both `htmlToImage` calls take it,
  so a fallback can no longer silently ship a 1:1 image. A Portrait card exports at
  **2160 × 2700** instead of 1080 × 1350, Square at **2160 × 2160**.

  Measured on the same card, same engine: 1080 × 1350 / 33 KB / 1.74 s → 2160 × 2700 / 120 KB /
  **2.04 s**. Four times the pixels for about **0.3 s** more, because the cost is in laying the
  card out, not in filling it.

  _Two safety nets, both tested by injecting failures rather than by hoping. If 2× fails on all
  three engines the whole chain **retries at 1×**, so the worst case is the old output, not a
  failed export. And a returned blob under 8 KB is treated as a failure — that is how iOS
  reports a canvas it could not allocate: a blank image instead of an exception. A forced 2×
  failure fell through to 1× and produced a card; a forced 8 KB "success" was rejected and also
  fell through to 1×._

  _**The one thing not checked here: a real iPhone.** There is no Xcode/simulator on this Mac
  and no device, so 2× was verified in a desktop browser only. Please export one card on the
  phone. If it ever comes back blank or slow, the fallbacks above make it degrade to today's
  output, and dropping back is a one-word change (`EXPORT_SCALE = 1`)._

  _Environment note for whoever tests next: `html-to-image` (engines 2 and 3) fails on the full
  card in the headless preview browser **at any scale, including 1×** — pre-existing, not the
  scale change. `pixelRatio: 2` was confirmed to double output on a standalone node (100 × 50 →
  200 × 100), and `html2canvas` — the path that actually runs — was verified end-to-end._

  **Found the cause.** The card is a fixed 1080 × 1350 box and all three export paths render it
  at **1:1** — `html2canvas(card,{scale:1})` and both `htmlToImage.toBlob(...,{pixelRatio:1})`
  fallbacks ([app.js](app.js)). So the PNG is exactly 1080 × 1350 with no pixel headroom, and
  Instagram then re-compresses it, which is where serif text goes soft.

  The standard fix is to render at 2× (2160 × 2700) and let Instagram downscale — downsampling
  a larger image produces much cleaner text than compressing one that is already at target
  size. All three paths need the same change or the fallback silently undoes it. Watch memory
  on the phone: 2× is 4× the pixels, and iOS Safari is the tight case, so 2× is the sensible
  ceiling to try first.
  > Roadmap B10: export the card at 2x resolution on all three capture paths, per ROADMAP.md, and check it still works on iPhone.

- [x] Crest position is off, should be identical size and symmetrical (symmetry based on the diagonal, maybe increase size to be half as big as the news solo team logos) **(B11)**

  **Done 2026-07-28, together with "ditch the curves".** You said the left crest was being cut
  on Diagonal strong and reverse while the right one looked fine. It wasn't the side — it was
  the badge: **the crest box was 583px wide but a crest layer is only 540px** (half the card),
  so a box that wide never fitted. A badge that fills its file (Man City) lost up to **76px**
  off the card's edge; a narrow one (Milan) lost nothing, because its transparent margin
  absorbed the overhang. On an Arsenal → Tottenham card that reads exactly as "left cut, right
  fine". The same one-box-for-everyone was why a round badge looked up to 2.4× a tall shield.

  **So size now comes from the badge, not the box** ([app.js](app.js), `measureCrest` /
  `crestRoom` / `crestPlan`). Each file is measured once as it loads — how much of its square
  the artwork actually fills — and both crests on a card are then scaled to the **same visible
  size**, matching the geometric mean of the visible artwork, which is what "identical size" can
  mean when one badge is a circle and the other a tall shield. Whichever side has less room sets
  that size for both, so the pair always matches. The crest is centred in the room its own
  colour block has rather than at a hand-set x, which is where the symmetry now comes from.

  **The tuned `WALLPOS` table is gone.** Placement is computed from the seam: `SPLITS` describes
  each shape as an angle plus where the seam sits along it, `seamAt()` turns that into the seam's
  x at any y, and the crest is fitted inside it. Adding a shape is a row in a table now.

  | Checked | Result |
  |---|---|
  | 8 shapes × 6 team pairs × both formats = **96 cases** | **0 clipped** at the card or layer edge, 0 running off the top, and the two crests the **same visible size in every single case** |
  | Seam clearance | **exactly 24px minimum** across all 96 — it's a constant now (`CREST_GAP`), not an outcome |
  | Exported PNG, all 8 shapes, single and dual colours | **0 spilled pixels** on every one, from 20k–39k crest pixels per card |
  | Diagonal (soft) | that includes the **~2% spill this file recorded as open** — it is 0 now |
  | Bottom bleed | unchanged at 138px, so the crests sit exactly as low as they did |
  | Four kept shapes | gradient CSS **byte-identical** to before, single and dual — the shapes you're happy with did not move |

  _Sizes: a pair now lands at 497px of visible crest on the vertical and the strong/reverse
  diagonals (against 583 for a round badge and 240 for Tottenham before), 397–497 on the soft
  diagonal, 276–481 on the chevrons — the shape's own room decides, and both sides always match._

  _One honest trade-off: **a round badge is now ~15% smaller** than it was (497 against 583) —
  that's the price of it not being cut and of matching whatever is beside it. `CREST_TARGET` in
  [app.js](app.js) is the one number to raise if you want them bigger, and the geometry will
  clamp it back wherever there isn't room._

  _Not touched: the single-team crest on news / quote / stats still bleeds off the bottom-right
  corner at its old size. It's one badge with nothing to match, so it has no symmetry problem —
  say the word if you want it normalised too._

  **Measured, and the numbers say the geometry is already symmetric — so something else is
  making it look wrong.** In `WALLPOS`, every split gives both crests the *same* size
  (`d` = 0.54 of card width = 583 px, 0.52 on soft diagonal), and the two positions are exact
  mirror images through the card centre (x 0.20/0.80, y 0.30/0.70). Your size instinct also
  already matches: the solo crest is `background-size:112%` = 1210 px, and half of that is
  605 px against the 583 px used on splits.

  So the likely culprit is **the artwork, not the placement**. Every file is a uniform
  512 × 512 canvas, but the crest *inside* it isn't: a round badge fills the square, a tall
  shield leaves side gaps, a wide wordmark leaves top and bottom gaps. At an identical box
  size those read as very different sizes. If that's it, the fix is to normalise the source
  images — trim the transparent margin and re-pad each to a consistent square — which is a
  `tools/` job, not a `WALLPOS` one. Note no image library is installed on this Mac
  (no PIL, ImageMagick or node), so that script needs one, unlike the crest fetcher.

  **Before this runs, say which split you were looking at and which two teams** — that pins
  down whether it's the artwork, one specific seam shape, or the seam-edge clipping (on a
  vertical split each crest does lose ~49 px at the centre line, equally on both sides).
  > Roadmap B11: fix crest size/symmetry on split cards, per ROADMAP.md — I was looking at <split> with <team A> vs <team B>.

  ### Measured 2026-07-28 — the artwork theory is confirmed, with one correction

  All 242 club crests and all 92 nation crests were measured in the browser (canvas gives the
  tight box of non-transparent pixels; no image library needed — that idea can be dropped).
  **Position symmetry is not the problem and never was: 0 of 334 crests is off-centre in its
  own file** by more than 2%, and `WALLPOS` mirrors exactly. What varies is **how much of the
  file the badge fills**, and the card draws every crest into the same 583 px box:

  | | fills the box | median | worst |
  |---|---|---|---|
  | height | 208 of 242 fill it | 1.00 | 0.375 (Union Berlin, a wide banner) |
  | width | 90 of 242 | 0.875 | 0.412 (Tottenham) |

  So the visible crest ranges from **240 × 583 px (Tottenham) to 583 × 583 px (Man City)** —
  same box, 2.4× the area. Every badge is trimmed to fill its long axis, which is why one
  looks big and round and the next looks like a thin tall bird.

  **What that does to real pairs** (visible width, and the area ratio between the two):

  | Card | widths | one crest is |
  |---|---|---|
  | Man City vs Tottenham | 583 vs 240 | **2.43×** the other |
  | Arsenal vs Tottenham | 496 vs 240 | 2.06× |
  | Man City vs Liverpool | 583 vs 321 | 1.82× |
  | Barcelona vs Real Madrid | 576 vs 423 | 1.36× |
  | Sunderland vs Pisa | 583 vs 459 | 1.06× |

  The 12 narrowest, i.e. the ones that look shrunken next to anything round: Union Berlin,
  **Tottenham**, Granada, Oviedo, **Liverpool**, Nottm Forest, Celta Vigo, Cordoba, Monaco,
  Las Palmas, Sporting Gijón, Zaragoza. **Nations are much tighter** (median 0.90, worst
  Belgium 0.72), so this is a club problem, and worst on transfer cards.

  **The fix, and its one real trade-off.** Scale each crest's box by its own content, so what
  the eye sees is the same size on both sides: `scale = target / √(w·h)`, measured once per
  crest when the app already probes the file in `put()` (a 160 × 160 canvas read, ~4k pixels —
  no new files, and it keeps working for crests added later). At `target = 0.80`:

  | | now | after |
  |---|---|---|
  | Man City | 583 × 583 | 466 × 466 (0.80×) |
  | Arsenal | 496 × 583 | 430 × 506 (0.87×) |
  | Palermo | 583 × 510 | 499 × 436 (0.86×) |
  | Tottenham | 240 × 583 | 299 × 727 (1.25×) |
  | Liverpool | 321 × 583 | 346 × 629 (1.08×) |

  The trade-off: **223 of 242 get smaller**, which is the opposite of "maybe increase size".
  Growing the narrow ones instead means letting them run **taller** than the 583 box whose
  seam clearance was measured in the earlier crest work — fine on a vertical seam (only width
  reaches the seam) but it needs re-checking on the diagonals and curves, and those crests are
  anchored low so a taller one crops differently at the card's bottom edge. **Which way to go
  is your call**, and it is the same question as "which split and which two teams" — on a
  vertical split with Arsenal vs Tottenham the honest fix is equalise-and-shrink; if it was a
  diagonal, the placement has to move too.

  _Answered the same day: the cut mattered more than the size, and the fix did **both** — see the
  Done note under the item. The narrow ones grow upward from a fixed bottom edge, so nothing crops
  worse than it did; a round badge gives up ~15%._

- [x] Add colors picker for the second team **(B12)**

  Today only the left/active team has editable colours; the right-hand team's colours come
  straight from `teams.json` with no way to override them on the card. Needs three more inputs
  plus their entries in `FIELDS` so they save with the draft and with a preset.

  They belong in **Style & colours** next to the existing three, not at the top of the pane —
  that section was just cleared out in B3, and the same reasoning applies. One caution
  recorded there: don't give the new inputs a `data-for`, or `secUsed()` will auto-collapse
  the whole section on templates that don't use them.
  > Roadmap B12: add second-team colour inputs in Style & colours, saved with the draft, per ROADMAP.md.

  **Done 2026-07-28.** **Style & colours** now holds two labelled colour rows —
  `Team — left / single` (the existing `c1/c2/c3`) and `Team — right (transfer / result)`
  (new `d1/d2/d3`) — each a hex box plus the native picker
  ([generator-ios.html](generator-ios.html), [styles.css](styles.css) `.rowlab`). No
  `data-for` on them, per the caution above. `d1/d2/d3` are in `FIELDS`, so they save with
  the draft and with a preset and clear on Reset.

  **This is also the way to work around B13's colour debt** — the 131 new clubs carrying a
  fallback colour can be fixed on the card, on whichever side they're on, without editing
  `teams.json` first. That's now in the README next to the list-the-debt one-liner.

  How it hangs together ([app.js](app.js)): the right team used to be read straight out of
  `teams.json` on every render (`DB()[club2]`). It now keeps its **name** from there but takes
  its **colours from the inputs**, which `loadClub2()` fills in whenever you pick a right-side
  team — the same contract `loadClub()` has always had on the left. Three shared helpers
  (`TRIO_A`/`TRIO_B`, `setTrio`, `readTrio`) replace the three hand-repeated
  `[["c1","c1p"],…]` lists, so both sides stay wired the same way.

  _The four places the two sides can drift apart, each handled and each tested:_

  | Case | Behaviour |
  |---|---|
  | Pick a right-side team | `loadClub2()` refills the three inputs from `teams.json` — picking Palermo after a green override gives Palermo's own trio back |
  | **Swap teams** | the colours travel **with their team**, so a colour you fixed by hand isn't lost or handed to the other club: Sunderland's hand-set `#F5A9C4` moved to the left with it |
  | The right-side team moves on its own (team type switched, or it collided with the left team) | `drawPickers()` refills the trio only when it had to move that team — Clubs → Nationals lands on Brazil **and** Brazil's colours, not the club's |
  | A draft or preset saved **before** B12 | has no `d1/d2/d3`, so `restore()` takes them from the saved right-side team. A pre-B12 Sunderland → Pisa draft came back with Pisa's real `#111111/#FFFFFF/#FFFFFF`, not the placeholder pair |

  _Measured in the browser, on the local server:_

  | Check | Result |
  |---|---|
  | Override reaches the card | typing `#00A650` into the right Background turns the right band green live; bands readout follows (`#FF0000 · #000000 · #00A650`) |
  | Both halves of a 50/50 split | with Colors per half on, `d1` paints the outer band and `d3` the one by the seam — green outside, Madrid gold inside |
  | **Export carries it** | capturing the card and sampling it: left `#FF0000` / `#FFFFFF`, right `#FEBE10` / **`#00A650`** — the hand-typed colour is in the PNG |
  | Half-typed hex | `#F5A` leaves the card on the team's own colour instead of killing the gradient (`hexOr`) |
  | Draft survives a reload | all three come back, native pickers included |
  | Preset round-trip | saved with `d1/d2/d3`, restored over a changed card |
  | Reset | drops the overrides and refills from the right-side team, not the HTML placeholder |
  | Phone width (375px) | two 3-across rows, fields 109px each, no horizontal overflow |

  _Two small side effects worth knowing. **Reset now also resets the right-side team** (it was
  previously the one field Reset skipped) — it lands on a sensible default and its colours come
  with it. And **picking a right-side team now saves the draft**, which it didn't before, so
  that choice survives a reload on its own._

  _Not changed: the right team's crest still comes from `teams.json` by key
  (`updateWall`), and `--bg2`/`--trim2`/`--nameB`/`scoreInk` all read the overridden
  colours because they were already fed from one `B` object._

- [x] Add much more teams (cover first two leagues from top 5 + Romania) **(B13)**

  Scope is roughly **230 clubs** (two divisions each from England, Spain, Italy, Germany,
  France and Romania) against the 60 in `teams.json` today — about 4×.

  **The expensive part turns out to be free.** TheSportsDB returns `strColour1/2/3` on the same
  record the crest comes from, and for Arsenal they are `#EF0107 / #fbffff / #013373` — the
  c1/c2/c3 model this app already uses, near-identical to the hand-entered values. So colours
  *and* crests can both be scripted from one pass, and `tools/fetch_crests.py` already does
  the team resolution, throttling and override handling. Hand-entering 230 × 3 hex colours was
  the thing that made this look like days of work; it isn't.

  Expect the same traps the crest run hit: hyphens break the search, short names match the
  wrong country's club, and the API needs ~2 s between calls. Two prompts — generate and
  review the data first, commit the crests second — because ~230 new crests is ~29 MB.
  > Roadmap B13 prompt 1: extend the fetcher to emit team name + colours + crest for the first two divisions of the top 5 leagues and Romania, per ROADMAP.md. Dry run, summary table only.

  **Prompt 1 done 2026-07-28.** `--leagues` reads a new [tools/leagues.json](tools/leagues.json)
  (228 clubs), resolves each one and writes [tools/teams-proposed.json](tools/teams-proposed.json)
  — name, country, c1/c2/c3, badge URL — touching neither `teams.json` nor `crests/`.
  **182 new clubs resolved, 45 were already ours, 1 miss.** teams.json goes 60 → **242**.

  | Division | listed | new | already have | MISS | all 3 colours | some | none |
  |---|---|---|---|---|---|---|---|
  | England Premier League | 20 | 10 | 10 | 0 | 5 | 5 | 0 |
  | England Championship | 24 | 24 | 0 | 0 | 9 | 10 | 5 |
  | Spain La Liga | 20 | 12 | 8 | 0 | 5 | 6 | 1 |
  | Spain Segunda | 21 | 20 | 0 | 1 | 3 | 5 | 12 |
  | Italy Serie A | 20 | 12 | 8 | 0 | 6 | 5 | 1 |
  | Italy Serie B | 20 | 20 | 0 | 0 | 4 | 2 | 14 |
  | Germany Bundesliga | 18 | 11 | 7 | 0 | 7 | 4 | 0 |
  | Germany 2. Bundesliga | 18 | 18 | 0 | 0 | 2 | 3 | 13 |
  | France Ligue 1 | 18 | 12 | 6 | 0 | 7 | 4 | 1 |
  | France Ligue 2 | 18 | 18 | 0 | 0 | 3 | 2 | 13 |
  | Romania SuperLiga | 16 | 10 | 6 | 0 | 0 | 0 | 10 |
  | Romania Liga II | 15 | 15 | 0 | 0 | 0 | 0 | 15 |
  | **TOTAL** | **228** | **182** | **45** | **1** | **51** | **46** | **85** |

  **The one thing that did not hold: "colours are free".** It's true for the top flights and
  false below them — **51 of 182** come back with all three, 46 with one or two, and **85 with
  none at all**, Romania being 0 for 25 in both divisions. Every proposed club still carries a
  usable `c1/c2/c3` (missing values fall back to a neutral pair, and the app's ink logic keeps
  text readable), but ~85 clubs will look generic until someone types their real colours. That
  is the actual cost of B13 now, and it is yours to decide before prompt 2: **ship all 182 and
  fix colours as you use them**, or **cut the roster to the divisions where the data is good**
  (the six top flights alone are 67 new clubs, 30 of them fully coloured).

  _The remaining MISS is **Deportivo La Coruña** — only its B team (Deportivo Fabril) and a
  women's side are searchable, under any spelling. It needs an id someone digs up by hand, or
  it gets dropped._

  _Also fixed while checking what B13 would collide with: **`bayern` and `frankfurt` were the
  wrong clubs' crests** — "Bayern" had matched **Bayern Hof** and "Frankfurt" a club simply
  called **Frankfurt**, exactly the short-name trap this file already warns about. Both are now
  pinned by id and re-fetched (`CREST_V` bumped to 2026-07-28). `dortmund` had the same wrong
  match (ASC 09 Dortmund) — that's what your "Adjusted Dortmund Logo" commit was fixing by hand;
  your PNG is untouched, only its provenance record now names the right club._

  ### What prompt 1 taught us — don't re-derive

  | Question | Answer |
  |---|---|
  | Can the API list a league's clubs? | **No, not on the free key.** `lookup_all_teams.php?id=` returns English League 1 for every league id; `search_all_teams.php?l=` caps at 10; `?c=<country>` caps at 10 and returns junk; `lookuptable.php` caps at 5 rows. Hence a hand-listed `tools/leagues.json`. |
  | Are `strColour1/2/3` really there? | Only above the second tier — see the table. Big clubs yes, Serie B / Ligue 2 / Romania mostly empty. |
  | Club not findable by name? | Try `searchevents.php?e=<Team>_vs_<Opponent>` and read `idHomeTeam`. That is how Nottingham Forest was found (133720). |
  | Silent-wrong trap, again | "Nottingham Forest FC" resolves to id 148600 — a **netball** side formed in 2025. The sport filter caught it; without it we'd have shipped a netball badge. |
  | Other data quirks | Saint-Étienne is filed `strGender: Mixed`; Swansea/Wrexham are `Wales`, FC Andorra is `Andorra`; `ß` does not decompose under NFKD, so Preußen Münster only matches after mapping it to `ss` (fixed in `norm()`). |
  | Cost of a full run | ~229 requests at 2 s = **~15 minutes**. `--only <keys>` re-resolves a handful and merges them back into the proposal — use it, don't re-run the lot. |

  > Roadmap B13 prompt 2: merge the reviewed teams into teams.json and fetch their crests, per ROADMAP.md.

  **Prompt 2 done 2026-07-28 — you chose "ship all", so all 182 landed.** Two steps, two
  commits, because the teams.json change is worth being able to revert on its own:
  `--merge-proposal` writes teams.json, `--fetch-proposal` downloads the badge each club
  already resolved to (no second search — the reviewed proposal holds the URL, so it is one
  request per crest and the run takes ~2 minutes instead of ~15).

  **Result: teams.json 60 → 242 clubs, `crests/` 152 → 334 files, 16 MB → 34.6 MB.**
  182 of 182 crests written, 0 failures. Integrity checked, not assumed: every team key has a
  file and every file has a team key (0 missing, 0 orphans), all 334 decode as PNGs, 331 are
  512×512 (one each at 2000, 500, 256), and **no two teams share an image** — that last one is
  what would expose a silent-wrong match.

  | | before | after |
  |---|---|---|
  | England | 10 | **44** |
  | Spain | 8 | **40** |
  | Italy | 8 | **40** |
  | Germany | 7 | **36** |
  | France | 6 | **36** |
  | Romania | 6 | **31** |
  | Portugal / Netherlands / Scotland / Turkey / Rest of Europe | 15 | 15 |

  _Checked in the browser on the merged data: all 242 club crests return 200, the pickers show
  44 English / 31 Romanian clubs and stay searchable, and a Sunderland → Pisa transfer on a
  diagonal split renders both new crests inside their own colour blocks. Twelve crests spread
  across the new leagues were eyeballed as a grid — Wrexham, Sunderland, Leeds, Nottm Forest,
  Oviedo, Sporting Gijón, Pisa, Palermo, Schalke, Saint-Étienne, Steaua, Sepsi — all the right
  clubs, including the Forest badge that had to be pinned by id._

  _**The colour debt, in one place.** 131 of the 182 new clubs carry at least one fallback
  colour and 85 carry three, so they render in a neutral pair until someone types the real
  ones. The exact list is in `tools/teams-proposed.json` (`colours_missing`), and the README has
  the one-liner that prints it. Worth doing a few at a time, for the clubs you actually post
  about — Palermo's badge is also a wide wordmark rather than a round crest, which is the
  artwork issue **B11** is about._

---

_Added 2026-07-28._

- [x] Curve Splits are bad, lets ditch them. Maybe lets find other splits to replace the curve
      ones? **(B14)**

  **Done 2026-07-28.** The three curved seams are out of the Split control, and out of the code
  with them — no more `CURVES`, no radial-gradient branch in `buildSplit` (`git show 7a52ce9:app.js`
  still has them). They were also the shapes the crests sat worst on, and a curve can't be reasoned
  about the way a straight seam can: **B11's placement geometry only works because every seam is now
  a straight line** whose x you can solve for at any y.

  **Four replacements, the two kinds you picked**, both built from straight seams so they export:

  | New | What it is |
  |---|---|
  | **Chevron ▶** | two half-height bands with opposite angles, so the seam runs in to the middle and back out — the left block points right into the other team |
  | **Chevron ◀** | the mirror of it |
  | **Vertical 60/40** | the straight vertical seam moved off centre, so the "from" team gets the bigger block |
  | **Vertical 40/60** | the mirror |

  The chevrons are the only shape here that needed proving rather than reasoning, because they are
  **two background layers instead of one** and `html2canvas` has to render both. It does: exported
  and sampled row by row, the seam sits at **0.372 → 0.507 → 0.646 → 0.506 → 0.372** of the card's
  width down the PNG — a real chevron, symmetric about the middle to within a pixel.

  A shape is now a row in `SPLITS` ([app.js](app.js)) — an angle, where along it the seam falls,
  and optionally which slice of the card the band covers. Both the gradient **and** the crest
  placement are derived from that, so the next shape is numbers, not tuning. The four shapes you
  kept come out **byte-identical** to before, in single and dual colour modes.

  _A card saved on one of the dropped curves comes back on **Diagonal (strong)** — tested by
  restoring a snapshot with `split:"curved"`, since otherwise the select would come back blank._

---

_Added 2026-07-28, when the backlog table ran empty and you picked two of the leftovers this
file had parked._

- [x] Increase the rating range (3 dots -> 4/5 dots) — the leftover from the NO1 PRIORITY
      reliability item **(B15)**

  **Done 2026-07-28.** Reliability runs **1–5** now, five dots on the card, up from three. It
  was the one piece of an item you wrote that had never actually been delivered — the dots got
  bigger back then, the range didn't move.

  | value | label | was |
  |---|---|---|
  | 5 | Tier one | 3 |
  | 4 | **Very reliable** | new |
  | 3 | Reliable | 2 |
  | 2 | Unconfirmed | 1 |
  | 1 | **Speculation** | new |

  **The two new rungs split the old top and bottom rather than being bolted on the end**, so no
  card is silently re-rated: everything that read "Reliable" still reads "Reliable". `TIER_UP`
  ([app.js](app.js)) carries a saved card across, once, keyed on a `_tier5` marker written by
  `snapshot()` — which covers **presets as well as the draft**, since both go through
  `snapshot()`/`restore()`. `TIER_MAX` drives the dot count and `L.tiers` the words, so the only
  thing left to keep in step by hand is the `<option>` list.

  _The new bottom rung is called **Speculation**, not "Rumour", because `L.st.zvon` already
  prints "Rumour" as a transfer **stage** — two different things on the same card should not
  share a word._

  _Measured in the browser, not assumed:_

  | Check | Result |
  |---|---|
  | All five rungs | 5 dots every time, filled count 1→5, labels Speculation / Unconfirmed / Reliable / Very reliable / Tier one |
  | Does it still fit the card? | dots 70px → **122px**, tier row 445px; topline is 904px and the widest case (longest label + longest team name, `Trinidad & Tobago`) leaves **246px spare**. No wrap on any template |
  | Old draft (tier 3, no marker) | comes back **5 / "Tier one"** — the same word, not the same number |
  | Old presets 3 / 2 / 1 | → 5 / 3 / 2, words unchanged |
  | Re-picking one preset 3× | stays on 3 / "Reliable" — the migration writes back into the stored object, so without the marker it would have stepped 1→2→3 |
  | Reporter picker | Romano → 5 Tier one, Ben Jacobs → 3 Reliable, Konur → 2 Unconfirmed |
  | Transfer stage picker | Rumour/Interest → 2, Talks/Agreed → 3, Medical/Official → 5 |
  | Reset | lands on 5 / Tier one, the HTML default |
  | In the exported raster (2×) | at tier 4: four solid 36px dots then **one hollow ring** — two 3px borders around a 12px gap. Five dots reach the PNG |

  _[reporters.json](reporters.json) was carried across the same way — a mechanical remap of the
  36 entries (3→5, 2→3, 1→2), so the words each reporter carried are unchanged. **That means
  nobody currently sits on 4 or 1.** Deliberate: re-rating 36 reporters into five rungs is the
  editorial pass this file has been asking you for since B5, and it isn't mine to make. The new
  rungs are there when you do it._

  _One thing left the same on purpose: the **transfer stages** map onto 2/3/5 only, so Medical
  and Official still share a rung. There is room to separate them now — say the word if picking
  a stage should carry a finer reliability than it used to._

  _The export could not be checked end-to-end here: `capture()` on the full card **hangs** in the
  headless preview browser (it never resolves, no error). That is the pre-existing limit this file
  already records under B10, not something B15 caused — rasterising the `.tier` subtree alone with
  the same engine at the same 2× scale works, which is where the dot measurement above comes from._

- [x] Fix the colour debt — 131 of the new clubs carry at least one fallback colour **(B16)**

  **Done 2026-07-28. Nothing in `teams.json` renders on the generic pair any more** — 131 clubs
  fixed, 231 colour slots, **0 left on `#111111`/`#FFFFFF`** (85 of them had all three).

  **The colours came off the clubs' own badges, not from a second API.** `crests/` has been
  complete since B13 and a badge is drawn in the club's colours, so the data was already on
  disk: no network, no rate limit, no 15-minute run — the whole thing is **42 seconds**.
  [tools/crest_colours.py](tools/crest_colours.py) decodes the PNG with stdlib `zlib` (the
  five scanline filters are in the file; there is still no PIL or ImageMagick on this Mac),
  clusters the badge into flat colours, and writes `c1/c2/c3`.

  **This is measured against clubs we already trust, not asserted.** `--check` runs the
  extractor over the 111 clubs whose colours were hand-entered or answered in full by the API,
  and scores it against them:

  | | |
  |---|---|
  | the club's **c1 is somewhere in the extracted palette** | **86.5%** (c2 94.6%, c3 73.9%) |
  | all three of a club's known colours found | 64% of clubs |
  | the badge picks the **right colour as c1** | **54.1%** |

  **So the honest result is: it finds the right colours and is only about half right about
  which one is primary.** That is a ceiling, not a knob left untuned — six different rules for
  picking c1 were scored in the same pass and they all land between 39% and 54% (`--lead`
  switches them; `ink` won). The failures say why: **Lyon play in white and their badge is red
  and blue**, Spezia play white behind a black badge. No amount of reading badge pixels
  recovers a shirt colour the badge doesn't contain.

  It is still clearly worth shipping, because the thing it replaces is **85 clubs sharing one
  identical black-on-white**. On a spot check of 19 recognisable clubs, ~15 are right —
  Burnley claret, Lens yellow, Metz maroon, Modena yellow, Schalke blue, Portsmouth and
  Millwall navy, Argeș violet, Avellino green, Bastia blue, Auxerre blue. Wrexham (green, they
  play red) and Oviedo (gold, they play blue) are the kind it gets wrong — and in **both cases
  the right colour is in the badge palette**, just not chosen.

  _Three things it does that stop it making the card worse:_

  | | |
  |---|---|
  | **A slot the API answered is never overwritten** — checked: 0 of them changed. Only the fallbacks move |
  | **The three colours must be visibly different** (dE ≥ 25 across the *final* trio, kept colours included). Filling only the empty slots and hoping is what first left Levante with c1 and c2 the same red, and gave Castellón a seam colour identical to its background — measured after: **min dE(c1,c2) 29.1, min dE(c1,c3) 25.4, none under 25** |
  | Distance, **not** contrast ratio — Sepsi's grey on red is 1.01:1 by luminance and completely obvious to the eye. Only Derby and Swansea end up with c2 = c3, and both are genuinely two-colour clubs |

  _Also fixed on the way: the first version reported the 5-bit bucket centre as the colour,
  which put Chelsea's blue **40 dE** out — a visibly different blue. It reports the most common
  **exact** pixel in the cluster now, because badge art is flat colour._

  _Checked in the browser on the merged data: `teams.json` still holds 242 clubs / 92 nations,
  every hex well-formed, every record the same shape. Eight previously-generic clubs render in
  their own colours at 3.73–11.89:1 contrast, and five split pairs come through with both
  crests in their own blocks. **One pair trips the app's own split-contrast warning** — Derby
  (black) against Swansea (white), at 1.29:1 — which is two clubs that genuinely clash, and
  the warning firing is the app telling the truth. Before B16 that card was two identical
  black bands. `teams.json` is fetched `{cache:"no-cache"}`, so nothing needs a version bump._

  **What's left for you, and it's small.** Of the 85 clubs where the badge chose c1, **13 came
  out a neutral** and 9 of those have a saturated colour sitting in their own palette:
  Albacete, Burgos, Ceahlăul, Dunkerque, Elversberg, Hannover, Mirandes, Pau, Pisa. (Amiens,
  Cesena, Derby and Münster are the other four, and their badges really are monochrome.)
  `tools/teams-colours.json` lists every club's full badge palette beside the choice made, so
  disagreeing is a one-line edit — or fix it on the card with B12's colour inputs and never
  touch the file.
  > Roadmap B16: swap c1 for one of the alternatives listed in tools/teams-colours.json for <club>, <club>.
