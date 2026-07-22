# Roadmap — Football News Card Generator

Living plan file. Every prompt that changes this repo updates this file in the same commit:
tick items, add newly agreed ones, refresh the date line below. The wording of the items is
the author's own — notes in _italics_ are added by Claude.

_Last updated: 2026-07-22 — **"Next up" is finished** (152/152 real crests, verified on the live
site and through PNG export; B8 closes with it), and the crest placement on the five awkward
split shapes is fixed — bigger crests, better placed, measured to not cross the seam. Also fixed
the reason old placeholder crests kept showing on a device that had already loaded them
(`CREST_V` cache-buster). Next by the stated order is **B3**._

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

  _Open, not fixed — say the word and it becomes its own item:_ **Diagonal (soft) spills** about
  2% of its crest pixels across the seam onto the other team's colour. It predates this change
  and isn't on your list, so I left it rather than alter a shape you're happy with.

---

## Backlog

Items stay in the author's original order. **Execution order is B3 → B5 → B6 → B2 → B7 →
B1**, because B3 is the stated NO1 priority and B5 is the biggest single piece of it.
B4 and B8 aren't work items. One prompt per row; paste the quoted line as the whole prompt.

| # | Item | Prompts | Blocked on |
|---|---|---|---|
| B3 | Fewer fields / faster (NO1) | 2 | — |
| B5 | Reporters picker | 1 | — |
| B6 | Translation (NO2) | 2 | a decision (below) |
| B2 | Auto-pull from X | 1 spike | a decision (below) |
| B7 | Posts vs reels | 0 | — |
| B1 | Use of the online repo | 1 | — |
| B8 | Crest overlay | 0 | Next up |

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
| Free translation | DeepL API Free = **500 k chars/month**, Microsoft = 2 M/month. A card is ~200 chars, so ~2,500 cards/month free. LibreTranslate is free but self-hosted and visibly weaker. |

---

- [ ] Brainstorm ideas based on the fact that we have an online repository now and can expand to multiple files as we use GitHub Sites (syncs?). **(B1)**

  The one that actually pays: Instagram's publishing API refuses anything that isn't at a
  public URL, and GitHub Pages is one. Committing an exported card to the repo turns it into
  a publishable asset — that's the unlock for B7, not a filing tweak.
  Cheap wins in the same area: a `crests/` manifest so the app stops probing for files that
  don't exist, presets versioned in the repo instead of only `localStorage` (export/import
  JSON already exists), `teams.json` as a dataset others can PR.
  > Roadmap B1: add a crests manifest so the app stops probing for missing files, per ROADMAP.md.

- [ ] Can we really pull the info from one text automatically, free of charge? (Get a Twitter/Instagram/Threads post as soon as it's posted and automatically post it to socials.) THIS CHANGES THE WHOLE DYNAMIC **(B2)**

  **Answer: not free — but far cheaper than the old $200/month tier.** With the 24 h
  dedup, cost scales with how many *unique* posts you watch, not how often you poll:

  | Watching | Unique posts/month | Cost |
  |---|---|---|
  | 5 reporters | ~1,200 | **~$6/mo** |
  | 20 reporters | ~6,000 | **~$30/mo** |

  So the real question isn't feasibility, it's whether it's worth ~$6–30/month to you.
  **Decide that before any code is written** — everything else in this file assumes manual.
  Also note the honest limit: pulling a post is easy, but turning free-form text into
  headline / player / fee / reliability is a judgement call, so a human check stays in
  the loop either way.
  > Roadmap B2: spike only, no app code — prove we can pull one named reporter's latest posts and map one to card fields. Report cost per run.

- [ ] If kept manual, even more simplification? (brainstorm how we can use as few fields as possible, as fast as possible. Process should be very quick to keep relevancy). IF KEPT THIS IS NO1 PRIORITY **(B3)**

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

  > Roadmap B3 prompt 2: cut the news and transfer cards down to the fewest fields on first screen, per ROADMAP.md. Don't remove fields, just reorder and collapse.

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

- [ ] Can we automate the translation in anyway? (1st priority Romanian, 2nd Italian/German/Spanish for relevant teams). Should we keep it all in one instagram profile or do multiple based on language? Can maybe bypass this if we use carousels (easy but don't know if it will go well) in Instagram (Add a flag in a corner for the corresponding language used.). NO2 PRIORITY, this would be relevant as the page would be only a copy-paste with a nice design in English. **(B6)**

  **One profile with carousels** — a carousel is one post no matter how many language slides
  it holds, so it costs nothing extra in reach or rate limit, and it avoids running four
  accounts. That answers the profile question.

  Split the work by what's actually hard. The card's fixed labels (`L`, [app.js:49](app.js:49))
  are already centralised and few — **hand-translate those once, free, no API**. Only the
  text you type (headline, sub, quote) would need machine translation, and that's where the
  caveat is: calling DeepL from a static GitHub Pages app would expose the key in the page
  and hit CORS, so it needs a proxy. Given a card is ~200 characters, pasting a translation
  by hand is not obviously worse than building that proxy.
  > Roadmap B6 prompt 1: add a language switch for the card's fixed labels plus a corner flag badge, per ROADMAP.md. No translation API.

  > Roadmap B6 prompt 2 (only if wanted): add machine translation for the typed text, per ROADMAP.md — discuss the key/CORS options first.

- [ ] Should post on instagram in form of: posts or reels of posts? (are these both?) **(B7)**
      — _They're different things: a feed post is the static image, a reel is video. The API
      does both, free. A text card is a still image, so **feed post — and carousel when you
      add languages (B6)**. Reels reach further but need a video template that doesn't exist
      yet; not worth building until the manual flow is fast. Nothing to code here; the
      publishing route itself is B1 + a public URL._

- [ ] Maybe add overlaying crests/logos as background with a dimmer opacity? Big crests, occupying all of the team's card - Ex: Cannon for Arsenal occupies 50%, Spurs chicken 50%. (Transfers and Matches are the affected templates) **(B8)**
      — _**Done 2026-07-22.** `updateWall()` + `WALLPOS` place each team's crest deep inside its own
      colour region for all 8 seam shapes, with a Subtle/Medium/Bold opacity control. Now running on
      real artwork since "Next up" landed, and verified to survive PNG export._
