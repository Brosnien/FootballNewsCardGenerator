#!/usr/bin/env python3
"""Fetch real team crests from TheSportsDB into crests/<key>.png.

Reads teams.json (never writes it) and tools/crest-overrides.json, resolves each
team key to a TheSportsDB team, and downloads its badge - a 512x512 transparent
PNG - straight to crests/<key>.png. No image tooling required.

The point of the country filter is honesty: short names such as "Inter" or
"Athletic Club" happily match a club on another continent, so a candidate whose
country contradicts teams.json is treated as a MISS, not as a crest.

Output is a counts line plus the problem rows only - never 152 lines of log.

  python3 tools/fetch_crests.py --dry-run              # resolve, write nothing
  python3 tools/fetch_crests.py --group nations        # fetch the clean 92 first
  python3 tools/fetch_crests.py --group clubs
  python3 tools/fetch_crests.py --only psg,inter --force

--leagues is the B13 mode: it reads tools/leagues.json instead of teams.json,
resolves every club in those divisions, and writes a *proposal* to
tools/teams-proposed.json - name, country, c1/c2/c3 taken from the API's
strColour1/2/3, plus the badge URL. It never touches teams.json or crests/.

  python3 tools/fetch_crests.py --leagues
  python3 tools/fetch_crests.py --leagues --country Romania

Once that proposal has been read by a human, prompt 2 adopts it in two steps -
the merge is reversible on its own, the 23 MB of crests is a separate commit:

  python3 tools/fetch_crests.py --merge-proposal    # writes teams.json
  python3 tools/fetch_crests.py --fetch-proposal    # writes crests/*.png
"""

import argparse
import json
import os
import re
import struct
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

API = "https://www.thesportsdb.com/api/v1/json/3"
UA = "FootballNewsCardGenerator/1.0 (crest fetcher)"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEAMS = os.path.join(ROOT, "teams.json")
CRESTS = os.path.join(ROOT, "crests")
OVERRIDES = os.path.join(ROOT, "tools", "crest-overrides.json")
MANIFEST = os.path.join(ROOT, "tools", "crest-sources.json")
LEAGUES = os.path.join(ROOT, "tools", "leagues.json")
PROPOSED = os.path.join(ROOT, "tools", "teams-proposed.json")

# The API is rate limited for real: 152 back-to-back searches fail ~38 times,
# the same teams pass 10/10 at 2 s spacing.
THROTTLE = 2.0
BACKOFF = (5, 15, 40)

# Placeholder crests shipped at 560x560; real badges are 512x512.
PLACEHOLDER_SIZE = (560, 560)

# teams.json country -> API strCountry values we accept for a club.
# Groups that are not a real country ("Rest of Europe") are left out: those
# teams get no country filter but must match the name exactly.
COUNTRY_ALIASES = {
    "England": {"England", "United Kingdom"},
    "Scotland": {"Scotland", "United Kingdom"},
    "France": {"France", "Monaco"},
    "Germany": {"Germany"},
    "Italy": {"Italy"},
    "Netherlands": {"Netherlands", "The Netherlands", "Holland"},
    "Portugal": {"Portugal"},
    "Romania": {"Romania"},
    "Spain": {"Spain"},
    "Turkey": {"Turkey", "Türkiye", "Turkiye"},
}

# Youth / women's / variant sides that must never win a match.
BAD_TOKENS = re.compile(
    r"\b(u1[4-9]|u2[0-3]|under\s?\d{2}|women|womens|ladies|femenino|feminin[ea]?|"
    r"futsal|beach|olympic|amateur|reserves?|academy|youth|ii|b)\b"
)

STRIP_AFFIX = re.compile(
    r"^(fc|afc|cf|sc|ac|as|ss|ssc|us|rc|cd|ud|sv|vfb|vfl|bsc|fk|nk|hnk|pfc|cfr)\s+"
    r"|\s+(fc|afc|cf|sc|ac|fk|sk|bk|if|sad)$"
)


# ---------------------------------------------------------------- utilities

# Letters NFKD does not decompose, so stripping non-ascii would silently delete them:
# "Preußen Münster" became "preuen munster" and stopped matching "Preussen Munster".
LETTER_MAP = str.maketrans({"ß": "ss", "ø": "o", "Ø": "o", "đ": "d", "Đ": "d",
                            "ł": "l", "Ł": "l", "æ": "ae", "Æ": "ae", "œ": "oe"})


def norm(s):
    """Casefold, drop accents and punctuation, collapse whitespace."""
    if not s:
        return ""
    s = s.translate(LETTER_MAP)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def core(s):
    """Normalised name with common club affixes removed."""
    n = norm(s)
    prev = None
    while prev != n:
        prev = n
        n = STRIP_AFFIX.sub(" ", n).strip()
    return re.sub(r"\s+", " ", n)


def depunct(s):
    """'Paris Saint-Germain' -> 'Paris Saint Germain' (a hyphen kills the search)."""
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]+", " ", s, flags=re.UNICODE)).strip()


def png_size(path):
    """(width, height) from the IHDR chunk, or None if it is not a PNG."""
    try:
        with open(path, "rb") as fh:
            head = fh.read(24)
        if head[:8] != b"\x89PNG\r\n\x1a\n":
            return None
        return struct.unpack(">II", head[16:24])
    except OSError:
        return None


def has_real_crest(key, manifest):
    if key in manifest:
        return True
    size = png_size(os.path.join(CRESTS, key + ".png"))
    return bool(size) and size != PLACEHOLDER_SIZE


def load_json(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def save_manifest(manifest):
    """Atomic write - a half-written manifest is worse than none."""
    tmp = MANIFEST + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(dict(sorted(manifest.items())), fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    os.replace(tmp, MANIFEST)


class SingleRun(object):
    """Refuse to start while another fetch is running.

    Two concurrent runs doubled the request rate (rate-limit failures) and
    interleaved their manifest writes into invalid JSON. Once was enough.
    """

    path = os.path.join(ROOT, "tools", ".fetch_crests.lock")

    def __enter__(self):
        try:
            fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except OSError:
            sys.exit("another fetch is already running (%s)\n"
                     "if that is stale, delete it and retry." % self.path)
        os.write(fd, str(os.getpid()).encode())
        os.close(fd)
        return self

    def __exit__(self, *exc):
        try:
            os.unlink(self.path)
        except OSError:
            pass


# ---------------------------------------------------------------- http

_last_call = [0.0]


def get(url, throttle=THROTTLE, binary=False):
    """GET with throttling and backoff. Returns bytes/str, or None on failure."""
    for attempt in range(len(BACKOFF) + 1):
        wait = throttle - (time.time() - _last_call[0])
        if wait > 0:
            time.sleep(wait)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
            _last_call[0] = time.time()
            return data if binary else data.decode("utf-8", "replace")
        except (urllib.error.URLError, OSError) as err:
            _last_call[0] = time.time()
            if attempt == len(BACKOFF):
                return None
            code = getattr(err, "code", None)
            if code and code not in (429, 500, 502, 503, 504):
                return None
            time.sleep(BACKOFF[attempt])
    return None


def api_search(name):
    raw = get("%s/searchteams.php?t=%s" % (API, urllib.parse.quote(name)))
    if not raw:
        return None  # network/rate-limit failure, distinct from "no hits"
    try:
        return json.loads(raw).get("teams") or []
    except ValueError:
        return None


def api_lookup(team_id):
    raw = get("%s/lookupteam.php?id=%s" % (API, urllib.parse.quote(str(team_id))))
    if not raw:
        return None
    try:
        return (json.loads(raw).get("teams") or [None])[0]
    except (ValueError, IndexError):
        return None


# ---------------------------------------------------------------- matching

def allowed_countries(team, override):
    if override.get("country"):
        return {override["country"]}
    country = team.get("country")
    if not country:
        return None                      # nation: no country filter
    return COUNTRY_ALIASES.get(country)  # None => unknown group, name must match


def score(cand, wanted, allowed, is_nation):
    """0 = reject; higher is a better match."""
    if (cand.get("strSport") or "Soccer") != "Soccer":
        return 0
    if not cand.get("strBadge"):
        return 0
    gender = (cand.get("strGender") or "Male").strip()
    if gender and gender != "Male":
        return 0

    name, alt = cand.get("strTeam") or "", cand.get("strTeamAlternate") or ""
    n_name, c_name = norm(name), core(name)
    extra = BAD_TOKENS.search(n_name.replace(norm(wanted), " ").strip())
    if extra:
        return 0

    country_ok = True
    if allowed is not None:
        country_ok = (cand.get("strCountry") or "") in allowed
        if not country_ok:
            return 0

    n_want, c_want = norm(wanted), core(wanted)
    alts = {norm(a) for a in alt.split(",")}

    if n_name == n_want:
        base = 6
    elif c_name and c_name == c_want:
        base = 5
    elif n_want in alts:
        base = 4
    elif allowed and (n_name.startswith(n_want) or n_want in n_name):
        base = 2   # partial names only count when the country vouches for them
    else:
        return 0

    if is_nation and n_name != n_want and c_name != c_want:
        return 0   # national sides must match on the plain name
    return base


def resolve(key, team, override, is_nation):
    """-> (record, reason). record is None when unresolved."""
    if override.get("id"):
        cand = api_lookup(override["id"])
        if cand is None:
            return None, "lookup failed (id %s)" % override["id"]
        if not cand.get("strBadge"):
            return None, "id %s has no badge" % override["id"]
        return cand, "override id"

    queries = []
    raw = override.get("search") or team["name"]
    for q in (raw if isinstance(raw, list) else [raw]):
        for variant in (q, depunct(q)):
            if variant and variant not in queries:
                queries.append(variant)

    allowed = allowed_countries(team, override)
    net_error = False
    seen_wrong_country = None

    for q in queries:
        cands = api_search(q)
        if cands is None:
            net_error = True
            continue
        best, best_score = None, 0
        for cand in cands:
            s = score(cand, q, allowed, is_nation)
            if s > best_score:
                best, best_score = cand, s
            if s == 0 and allowed and (cand.get("strCountry") or "") not in allowed:
                if norm(cand.get("strTeam") or "") == norm(q):
                    seen_wrong_country = cand.get("strCountry") or "?"
        if best:
            return best, "search '%s'" % q

    if net_error:
        return None, "network/rate-limit failure"
    if seen_wrong_country:
        return None, "only hit is in %s, expected %s" % (
            seen_wrong_country, "/".join(sorted(allowed)) if allowed else "?")
    return None, "no soccer hit"


# ---------------------------------------------------------------- leagues (B13)

def slug(name):
    """'Sheff Wed' -> 'sheff-wed'. Accents and punctuation are already gone."""
    return re.sub(r"-+", "-", norm(name).replace(" ", "-")).strip("-")


def hexnorm(c):
    """'#fbffff' -> '#FBFFFF'; anything that is not a 6-digit hex -> ''."""
    c = (c or "").strip()
    if c and not c.startswith("#"):
        c = "#" + c
    return c.upper() if re.match(r"^#[0-9a-fA-F]{6}$", c) else ""


def colours(cand):
    """strColour1/2/3 map straight onto our c1/c2/c3. -> (c1, c2, c3, missing)."""
    got = [hexnorm(cand.get("strColour%d" % i)) for i in (1, 2, 3)]
    missing = [i + 1 for i, v in enumerate(got) if not v]
    c1 = got[0] or "#111111"
    c2 = got[1] or "#FFFFFF"
    c3 = got[2] or (got[1] or "#FFFFFF")
    return c1, c2, c3, missing


def run_leagues(args):
    """Resolve every club in tools/leagues.json and write a reviewable proposal.

    Writes nothing but tools/teams-proposed.json: teams.json and crests/ are
    prompt 2's job, after a human has read the proposal.
    """
    spec = load_json(LEAGUES)
    if not spec:
        sys.exit("missing %s" % LEAGUES)
    existing = load_json(TEAMS)["clubs"]
    manifest = load_json(MANIFEST, {}) or {}
    known_ids = {str(v.get("id")): k for k, v in manifest.items() if v.get("id")}
    # the same overrides the teams.json sweep uses, matched on the proposed key:
    # a club we already had to pin by id ("Rapid" -> Rapid 1923) stays pinned here.
    overrides = {k: v for k, v in (load_json(OVERRIDES, {}) or {}).items()
                 if not k.startswith("_")}

    proposed, rows = {}, []
    misses, collisions, dups, nocolour = [], [], [], []
    seen_ids = {}

    # --only re-resolves a few clubs and merges them back, so fixing three MISS rows
    # costs three requests instead of the whole 229-club run.
    only = {slug(k) for k in args.only.split(",") if k.strip()}
    if only:
        proposed = (load_json(PROPOSED, {}) or {}).get("clubs", {})
        for key in list(proposed):
            if key in only:
                del proposed[key]
        seen_ids = {str(v.get("_source", {}).get("id")): v.get("name")
                    for v in proposed.values()}

    for lg in spec["leagues"]:
        if args.country and norm(args.country) != norm(lg["country"]):
            continue
        label = "%s %s" % (lg["country"], lg["division"])
        n_listed = n_new = n_have = n_miss = n_col = 0
        for i, entry in enumerate(lg["teams"], 1):
            search = entry["name"] if isinstance(entry, dict) else entry
            display = entry.get("as", search) if isinstance(entry, dict) else entry
            key = slug(display)
            if only and key not in only:
                continue
            n_listed += 1
            print("  ... %s %d/%d %s" % (label, i, len(lg["teams"]), display),
                  file=sys.stderr, flush=True)

            # a roster line may name the country the API files the club under:
            # Swansea and Wrexham play in England but are Welsh clubs.
            override = dict(overrides.get(key, {}))
            if isinstance(entry, dict) and entry.get("country"):
                override["country"] = entry["country"]
            cand, reason = resolve(key, {"country": lg["country"],
                                         "name": search}, override, False)
            if not cand:
                misses.append((label, display, reason))
                n_miss += 1
                continue

            tid = str(cand.get("idTeam"))
            if tid in known_ids:
                n_have += 1                       # already a team in teams.json
                continue
            if tid in seen_ids:
                dups.append((label, display, seen_ids[tid]))
                continue
            seen_ids[tid] = display

            if key in existing or key in proposed:
                # same key, different club: teams.json holds someone else under it
                collisions.append((key, display, cand.get("strTeam"),
                                   existing.get(key, {}).get("name", "another new club")))
                key = key + "-" + slug(lg["country"])
            c1, c2, c3, missing = colours(cand)
            if missing:
                nocolour.append((label, display, missing))
            else:
                n_col += 1
            proposed[key] = {
                "country": lg["country"], "name": display,
                "c1": c1, "c2": c2, "c3": c3, "plate": "none", "crest": "",
                "_source": {"id": tid, "team": cand.get("strTeam"),
                            "api_country": cand.get("strCountry"),
                            "league": label, "url": cand.get("strBadge"),
                            "matched_by": reason, "colours_missing": missing},
            }
            n_new += 1
        if n_listed:
            rows.append((label, n_listed, n_new, n_have, n_miss, n_col))

    with open(PROPOSED, "w", encoding="utf-8") as fh:
        json.dump({"clubs": dict(sorted(proposed.items()))}, fh,
                  indent=2, ensure_ascii=False)
        fh.write("\n")

    print("\nLEAGUE SCAN  (proposal written to tools/teams-proposed.json, "
          "nothing else touched)")
    print("\n%-26s %6s %6s %6s %6s %8s" % ("DIVISION", "listed", "new", "have", "MISS",
                                           "colours"))
    for label, listed, n_new, n_have, n_miss, n_col in rows:
        print("%-26s %6d %6d %6d %6d %5d/%-3d" % (label, listed, n_new, n_have, n_miss,
                                                  n_col, n_new))
    tot = [sum(c) for c in zip(*[r[1:] for r in rows])] if rows else [0, 0, 0, 0, 0]
    print("%-26s %6d %6d %6d %6d %5d/%-3d" % ("TOTAL", tot[0], tot[1], tot[2], tot[3],
                                              tot[4], tot[1]))
    print("\nteams.json today: %d clubs  ->  %d after merging the proposal"
          % (len(existing), len(existing) + len(proposed)))

    if misses:
        print("\nMISS - not resolved, decide per row (override id, or drop):")
        print("%-26s %-24s %s" % ("DIVISION", "club", "why"))
        for label, name, reason in misses:
            print("%-26s %-24s %s" % (label, name, reason))
    if collisions:
        print("\nKEY COLLISION - the key was taken, so the new club got a suffixed key.")
        print("%-20s %-18s %-26s %s" % ("KEY", "new club", "resolved to", "teams.json holds"))
        for key, name, api, held in collisions:
            print("%-20s %-18s %-26s %s" % (key, name, api, held))
    if dups:
        print("\nDUPLICATE - two roster lines resolved to the same club:")
        for label, name, first in dups:
            print("  %-24s %-20s already taken by %s" % (label, name, first))
    if nocolour:
        print("\nNO COLOURS from the API for %d of the %d new clubs - they carry a neutral "
              "default and need a hand-picked pair. Full list in the proposal file; "
              "first 15:" % (len(nocolour), sum(r[2] for r in rows)))
        for label, name, missing in nocolour[:15]:
            print("  %-24s %-20s missing c%s" % (label, name,
                                                 ",c".join(str(m) for m in missing)))
    return 1 if misses else 0


def load_proposal():
    prop = (load_json(PROPOSED, {}) or {}).get("clubs")
    if not prop:
        sys.exit("no proposal in %s - run --leagues first" % PROPOSED)
    return prop


def merge_proposal(args):
    """Fold tools/teams-proposed.json into teams.json. Writes teams.json."""
    prop = load_proposal()
    data = load_json(TEAMS)
    clubs = data["clubs"]
    already = [k for k in prop if k in clubs]
    if already and not args.force:
        sys.exit("these keys are already in teams.json: %s\n"
                 "re-run --leagues (it skips clubs we have) or pass --force."
                 % ", ".join(sorted(already)[:10]))

    # Keep the picker readable: each country's existing clubs stay in the
    # author's order, the new ones follow alphabetically behind them.
    order, seen = [], set()
    for key, team in clubs.items():
        if team.get("country") not in seen:
            seen.add(team.get("country"))
            order.append(team.get("country"))
    for key in sorted(prop, key=lambda k: norm(prop[k]["name"])):
        if prop[key]["country"] not in seen:
            seen.add(prop[key]["country"])
            order.append(prop[key]["country"])

    merged = {}
    for country in order:
        for key, team in clubs.items():
            if team.get("country") == country:
                merged[key] = team
        for key in sorted(prop, key=lambda k: norm(prop[k]["name"])):
            if prop[key]["country"] == country:
                merged[key] = {k: v for k, v in prop[key].items()
                               if not k.startswith("_")}

    assert len(merged) == len(clubs) + len(prop) - len(already), "lost a club in the merge"
    data["clubs"] = merged
    tmp = TEAMS + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    os.replace(tmp, TEAMS)

    print("MERGE  teams.json  clubs %d -> %d  (+%d)  nations %d unchanged"
          % (len(clubs), len(merged), len(prop), len(data["nations"])))
    print("crests still missing for the new keys - run --fetch-proposal next.")
    return 0


def fetch_proposal(args):
    """Download the badge each proposed club resolved to. Writes crests/*.png."""
    prop = load_proposal()
    manifest = load_json(MANIFEST, {}) or {}
    todo = [(k, v) for k, v in sorted(prop.items())
            if args.force or not has_real_crest(k, manifest)]
    skipped = len(prop) - len(todo)

    ok, failed = 0, []
    for i, (key, team) in enumerate(todo, 1):
        if i % 20 == 0 or i == len(todo):
            print("  ... %d/%d" % (i, len(todo)), file=sys.stderr, flush=True)
        src = team.get("_source", {})
        url = (src.get("url") or "") + ("/preview" if args.preview else "")
        # the URL comes from the reviewed proposal, so no search is needed: one
        # request per crest instead of a lookup plus a download.
        blob = get(url, throttle=0.3, binary=True) if url else None
        if not blob or blob[:8] != b"\x89PNG\r\n\x1a\n" or len(blob) < 2000:
            failed.append((key, team.get("name"), "badge download failed"))
            continue
        with open(os.path.join(CRESTS, key + ".png"), "wb") as fh:
            fh.write(blob)
        manifest[key] = {"id": src.get("id"), "team": src.get("team"),
                         "country": src.get("api_country"), "url": src.get("url"),
                         "matched_by": "proposal (%s)" % src.get("league", "?"),
                         "bytes": len(blob), "fetched": time.strftime("%Y-%m-%d")}
        save_manifest(manifest)
        ok += 1

    total = sum(os.path.getsize(os.path.join(CRESTS, f))
                for f in os.listdir(CRESTS) if f.endswith(".png"))
    print("\nFETCH proposal  considered=%d  written=%d  failed=%d  skipped(already real)=%d"
          % (len(todo), ok, len(failed), skipped))
    print("crests/ now holds %d files, %.1f MB"
          % (len([f for f in os.listdir(CRESTS) if f.endswith('.png')]),
             total / 1e6))
    if failed:
        print("\n%-20s %-24s %s" % ("KEY", "name", "why"))
        for key, name, why in failed:
            print("%-20s %-24s %s" % (key, name, why))
        print("\nre-run with --fetch-proposal --force after fixing the URLs.")
    return 1 if failed else 0


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description="Fetch real crests from TheSportsDB.")
    ap.add_argument("--dry-run", action="store_true",
                    help="resolve only; write nothing into crests/")
    ap.add_argument("--only", default="", help="comma-separated teams.json keys")
    ap.add_argument("--group", choices=("all", "nations", "clubs"), default="all")
    ap.add_argument("--force", action="store_true",
                    help="re-fetch keys that already have a real crest")
    ap.add_argument("--preview", action="store_true",
                    help="download the 200x200 /preview badge (~46 KB) instead of 512x512")
    ap.add_argument("--leagues", action="store_true",
                    help="B13: scan tools/leagues.json and propose new teams (writes "
                         "tools/teams-proposed.json only)")
    ap.add_argument("--country", default="",
                    help="with --leagues: only this country's divisions")
    ap.add_argument("--merge-proposal", action="store_true",
                    help="fold tools/teams-proposed.json into teams.json")
    ap.add_argument("--fetch-proposal", action="store_true",
                    help="download the badge recorded for every proposed club")
    args = ap.parse_args()

    if args.leagues:
        return run_leagues(args)
    if args.merge_proposal:
        return merge_proposal(args)
    if args.fetch_proposal:
        return fetch_proposal(args)

    data = load_json(TEAMS)
    overrides = {k: v for k, v in (load_json(OVERRIDES, {}) or {}).items()
                 if not k.startswith("_")}
    manifest = load_json(MANIFEST, {}) or {}

    only = {k.strip() for k in args.only.split(",") if k.strip()}
    todo = []
    for group, is_nation in (("nations", True), ("clubs", False)):
        if args.group not in ("all", group):
            continue
        for key, team in data[group].items():
            if only and key not in only:
                continue
            todo.append((key, team, is_nation))

    unknown = only - {k for k, _, _ in todo}
    skipped = []
    if not args.force:
        skipped = [t[0] for t in todo if has_real_crest(t[0], manifest)]
        todo = [t for t in todo if t[0] not in set(skipped)]

    ok, misses, failed_writes = [], [], []
    for i, (key, team, is_nation) in enumerate(todo, 1):
        if i % 10 == 0 or i == len(todo):
            print("  ... %d/%d" % (i, len(todo)), file=sys.stderr, flush=True)
        cand, reason = resolve(key, team, overrides.get(key, {}), is_nation)
        if not cand:
            misses.append((key, team["name"], reason))
            continue

        record = {
            "id": cand.get("idTeam"),
            "team": cand.get("strTeam"),
            "country": cand.get("strCountry"),
            "url": cand.get("strBadge"),
            "matched_by": reason,
        }
        if args.dry_run:
            ok.append((key, record))
            continue

        url = record["url"] + ("/preview" if args.preview else "")
        blob = get(url, throttle=0.3, binary=True)
        if not blob or blob[:8] != b"\x89PNG\r\n\x1a\n" or len(blob) < 2000:
            failed_writes.append((key, team["name"], "badge download failed"))
            continue
        with open(os.path.join(CRESTS, key + ".png"), "wb") as fh:
            fh.write(blob)
        record["bytes"] = len(blob)
        record["fetched"] = time.strftime("%Y-%m-%d")
        manifest[key] = record
        save_manifest(manifest)   # after each crest, so a killed run keeps its work
        ok.append((key, record))

    mode = "DRY RUN" if args.dry_run else "FETCH"
    print("\n%s  group=%s  considered=%d  resolved=%d  MISS=%d  skipped(already real)=%d"
          % (mode, args.group, len(todo), len(ok), len(misses) + len(failed_writes),
             len(skipped)))
    problems = misses + failed_writes
    if problems:
        print("\n%-16s %-24s %s" % ("KEY", "teams.json name", "why"))
        for key, name, reason in problems:
            print("%-16s %-24s %s" % (key, name, reason))
    if unknown:
        print("\nunknown keys in --only: %s" % ", ".join(sorted(unknown)))
    return 1 if problems else 0


if __name__ == "__main__":
    with SingleRun():
        sys.exit(main())
