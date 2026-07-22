# Roadmap — Football News Card Generator

Living plan file. Every prompt that changes this repo updates this file in the same commit:
tick items, add newly agreed ones, refresh the date line below. The wording of the items is
the author's own — notes in _italics_ are added by Claude.

_Last updated: 2026-07-22 — roadmap file created from the original notes._

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

- [ ] Now that we use GitHub, maybe we can use Crests (Team Logo) automatically but would need all pngs of the teams. Really depends on how hard is to get all the teams logos in png form (would love to be automatic).

  **Where it stands:** `crests/` holds 152 PNGs — one per team key, exact coverage, zero
  missing and zero orphans — but they are all **generic placeholders** (shield + initials).
  The display side is finished, so the only thing missing is real artwork.

  **Approach when we do it:**
  - `tools/fetch-crests.mjs` — reads `teams.json`, resolves each key against a badge source
    (TheSportsDB `searchteams.php` is free and covers clubs *and* nations; football-data.org
    as fallback), downloads, trims, normalises to a square transparent PNG ≤512 px, writes
    `crests/<key>.png`.
  - `tools/crest-overrides.json` — hand-written map for keys that don't match by name
    (`cfr-cluj`, `athletic`, `brugge`, …) to an explicit ID or URL.
  - The script prints an OK / MISS table so leftovers can be dropped in by hand. A partial
    run is safe to ship: a team with no file simply shows nothing.
  - Size budget: 152 × ~30 KB ≈ 4.5 MB in-repo, loaded one file at a time. Fine for Pages.
  - Club crests are trademarks — sourcing and use are the author's call.

---

## Backlog

- [ ] Brainstorm ideas based on the fact that we have an online repository now and can expand to multiple files as we use GitHub Sites (syncs?).
      — _Candidates: `teams.json` as a shared, PR-able dataset; card presets versioned in the
      repo instead of only `localStorage`; a `crests/` manifest so the app stops probing for
      files that don't exist; a `reporters.json` shared with the item below._
- [ ] Can we really pull the info from one text automatically, free of charge? (Get a Twitter/Instagram/Threads post as soon as it's posted and automatically post it to socials.) THIS CHANGES THE WHOLE DYNAMIC
      — _The blocker is API access, not code: X/Twitter read access is paid at any useful
      volume, and Instagram/Threads have no public read for other people's posts. Needs a
      feasibility + cost spike before a line is written. Everything below assumes manual._
- [ ] If kept manual, even more simplification? (brainstorm how we can use as few fields as possible, as fast as possible. Process should be very quick to keep relevancy). IF KEPT THIS IS NO1 PRIORITY
      — _Target: a finished card in under 30 seconds. Levers already in the code: auto-collapse
      the `<details>` sections the current template doesn't use, remember last-used team and
      source between sessions, extend the one-tap paste buttons (`addPasteButtons`), and cut
      optional fields off the first screen._
- [ ] DON'T BE IDIOTIC WITH PROMPTING AND LIMITS (VERY VERY HARD).
      — _Working agreement, not a feature. Batch related tweaks into one prompt; avoid
      re-uploading the big files._
- [ ] A page/another column to open directly the most commons reporters socials? Maybe something that does that and at a press of a button feeds info into the main page? Would prefer in the same page.
      — _Same page: a small `reporters.json` (handle, outlet, reliability, profile URL) behind
      a picker that fills the Source fields in one tap, with a link out to the profile._
- [ ] Can we automate the translation in anyway? (1st priority Romanian, 2nd Italian/German/Spanish for relevant teams). Should we keep it all in one instagram profile or do multiple based on language? Can maybe bypass this if we use carousels (easy but don't know if it will go well) in Instagram (Add a flag in a corner for the corresponding language used.). NO2 PRIORITY, this would be relevant as the page would be only a copy-paste with a nice design in English.
      — _Decide carousel-vs-per-language-account first; it changes the build. The cheap version
      is a language switch on the card labels plus a flag badge in the corner — the card's own
      strings (`L`) are already centralised, so only the user-typed text needs translating._
- [ ] Should post on instagram in form of: posts or reels of posts? (are these both?)
      — _Publishing strategy, no code. Both exist; reels reach further, static posts suit a
      text card better._
- [ ] Maybe add overlaying crests/logos as background with a dimmer opacity? Big crests, occupying all of the team's card - Ex: Cannon for Arsenal occupies 50%, Spurs chicken 50%. (Transfers and Matches are the affected templates)
      — _**Code is done**: `updateWall()` + `WALLPOS` place each team's crest deep inside its own
      colour region for all 8 seam shapes, with a Subtle/Medium/Bold opacity control. Looks right
      but reads as placeholder art — this ships properly the moment "Next up" lands._
