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

def norm(s):
    """Casefold, drop accents and punctuation, collapse whitespace."""
    if not s:
        return ""
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
    args = ap.parse_args()

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
