# Roadmap — Football News Card Generator

Living plan file. Every prompt that changes this repo updates this file in the same commit:
tick items, add newly agreed ones, refresh the date line below. The wording of the items is
the author's own — notes in _italics_ are added by Claude.

_Last updated: 2026-07-28 — **B13 prompt 1 done**: the fetcher now scans whole divisions
(`--leagues`) and has proposed **182 new clubs** — teams.json would go 60 → 242 — with colours
and badge URLs, written to `tools/teams-proposed.json` and nothing else touched. One correction
to an earlier finding: **colours are not free below the top flights** (51 of 182 complete, 85
with none), so prompt 2 needs a call from you: ship all 182, or only the six top flights.
Also **dropped B1, B2 and B6 (the automation items)** at the author's request, and fixed two
crests that were the wrong clubs entirely (`bayern` was Bayern Hof, `frankfurt` was a club
called Frankfurt)._

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
      — _dots and source are much bigger and moved to the top-left. **Leftover:** the range is still 3 tiers, not 4/5 (`#tier`, `L.tiers`). Say the word and it becomes its own backlog item._
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

---

## Backlog

Items stay in the author's original order, minus the three automation items (**B1, B2, B6**),
dropped on 2026-07-27 at the author's request — see the note under the table. B9–B13 were added
2026-07-27. **Proposed order is now B13 → B5 → B11 → B12.** B13 comes first because the crest
fetcher built for "Next up" already does most of it. B4, B7 and B8 aren't work items. One prompt
per row; paste the quoted line as the whole prompt.

| # | Item | Prompts | Blocked on |
|---|---|---|---|
| B13 | Many more teams (top 5 ×2 + Romania) | 1 left | prompt 2 needs a call on 85 colourless clubs |
| B5 | Reporters picker | 1 | — |
| B11 | Crest size / symmetry on splits | 1 | a look from you (below) |
| B12 | Colour picker for the second team | 1 | — |
| B3 | Fewer fields / faster (NO1) | done | — |
| B9 | Cap hashtags at 5 + both teams | done | — |
| B10 | Sharper exported image | done | a check on your phone |
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

- [ ] A page/another column to open directly the most commons reporters socials? Maybe something that does that and at a press of a button feeds info into the main page? Would prefer in the same page. **(B5)**

  Same page, no new tab. `reporters.json` — handle, outlet, reliability tier, profile URL —
  behind a picker sitting directly above the Source fields: one tap fills handle + outlet +
  tier, with a small link out to the profile. This is the biggest single win for B3, because
  Source is currently a closed section you must open on every card.
  > Roadmap B5: add reporters.json and a one-tap reporter picker above the Source fields, per ROADMAP.md.

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

- [ ] Crest position is off, should be identical size and symmetrical (symmetry based on the diagonal, maybe increase size to be half as big as the news solo team logos) **(B11)**

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

- [ ] Add colors picker for the second team **(B12)**

  Today only the left/active team has editable colours; the right-hand team's colours come
  straight from `teams.json` with no way to override them on the card. Needs three more inputs
  plus their entries in `FIELDS` so they save with the draft and with a preset.

  They belong in **Style & colours** next to the existing three, not at the top of the pane —
  that section was just cleared out in B3, and the same reasoning applies. One caution
  recorded there: don't give the new inputs a `data-for`, or `secUsed()` will auto-collapse
  the whole section on templates that don't use them.
  > Roadmap B12: add second-team colour inputs in Style & colours, saved with the draft, per ROADMAP.md.

- [ ] Add much more teams (cover first two leagues from top 5 + Romania) **(B13)**

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
