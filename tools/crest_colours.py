#!/usr/bin/env python3
"""Read a club's colours out of the crest PNG we already have on disk.

B13 shipped 182 clubs, but TheSportsDB only carries strColour1/2/3 above the second
tier: 131 of them landed with at least one fallback colour and 85 with three, so they
render in a neutral pair. This gets the colours from the badge instead -- no API, no
rate limit, no network at all, because crests/ is already complete and a club's badge
is drawn in the club's colours.

    python3 tools/crest_colours.py --check          # score it against known-good clubs
    python3 tools/crest_colours.py --propose        # write tools/teams-colours.json
    python3 tools/crest_colours.py --apply          # merge that into teams.json
    python3 tools/crest_colours.py --check --only arsenal,pisa

--check is the point of the file. It runs the extractor over the clubs whose colours
we already trust (the hand-entered originals, and the ones the API answered for) and
reports how many of those colours it rediscovers, so the thing is measured before it
is let near teams.json. Output is a summary, never a per-club log -- see "Token
discipline" in ROADMAP.md.

No PIL, no ImageMagick, no node on this machine, so the PNG decoder is here: stdlib
zlib plus the five filters from the spec. Every crest is 8-bit and non-interlaced
(331 RGBA, 2 palette, 1 grey+alpha), which is why only those cases are handled.
"""
import argparse
import json
import os
import struct
import sys
import zlib
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRESTS = os.path.join(ROOT, "crests")
TEAMS = os.path.join(ROOT, "teams.json")
PROPOSED = os.path.join(ROOT, "tools", "teams-proposed.json")
OUT = os.path.join(ROOT, "tools", "teams-colours.json")

# The fallback pair B13 wrote when the API had nothing. A club still wearing these
# is one we owe a colour to.
FALLBACK = {"#111111", "#FFFFFF"}


# ---------------------------------------------------------------- PNG decoding

def _unfilter(raw, height, stride, bpp):
    """Undo the per-scanline filters. Rows chain, so none can be skipped."""
    out = bytearray(height * stride)
    prev = bytearray(stride)
    pos = 0
    for y in range(height):
        ft = raw[pos]
        pos += 1
        line = bytearray(raw[pos:pos + stride])
        pos += stride
        if ft == 1:
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i - bpp]) & 255
        elif ft == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif ft == 3:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif ft == 4:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                c = prev[i - bpp] if i >= bpp else 0
                b = prev[i]
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        elif ft != 0:
            raise ValueError("bad filter type %d" % ft)
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return out


def read_png(path):
    """-> (width, height, rgba bytearray). Handles the three encodings in crests/."""
    with open(path, "rb") as f:
        data = f.read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    pos, idat, plte, trns = 8, [], None, None
    width = height = depth = ctype = None
    while pos < len(data):
        ln = struct.unpack(">I", data[pos:pos + 4])[0]
        typ = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + ln]
        if typ == b"IHDR":
            width, height, depth, ctype, _, _, il = struct.unpack(">IIBBBBB", body)
            if depth != 8 or il != 0:
                raise ValueError("only 8-bit non-interlaced (got depth=%d interlace=%d)"
                                 % (depth, il))
        elif typ == b"PLTE":
            plte = body
        elif typ == b"tRNS":
            trns = body
        elif typ == b"IDAT":
            idat.append(body)
        elif typ == b"IEND":
            break
        pos += 12 + ln

    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    stride = width * channels
    flat = _unfilter(zlib.decompress(b"".join(idat)), height, stride, channels)

    if ctype == 6:
        return width, height, flat
    rgba = bytearray(width * height * 4)
    if ctype == 3:
        for i in range(width * height):
            idx = flat[i]
            rgba[i * 4:i * 4 + 3] = plte[idx * 3:idx * 3 + 3]
            rgba[i * 4 + 3] = trns[idx] if trns and idx < len(trns) else 255
    elif ctype == 4:
        for i in range(width * height):
            g, a = flat[i * 2], flat[i * 2 + 1]
            rgba[i * 4:i * 4 + 4] = bytes((g, g, g, a))
    elif ctype == 2:
        for i in range(width * height):
            rgba[i * 4:i * 4 + 3] = flat[i * 3:i * 3 + 3]
            rgba[i * 4 + 3] = 255
    elif ctype == 0:
        for i in range(width * height):
            g = flat[i]
            rgba[i * 4:i * 4 + 4] = bytes((g, g, g, 255))
    return width, height, rgba


# ------------------------------------------------------------------- colour maths

def srgb_to_lab(rgb):
    """CIE Lab under D65. Only used for distances, so the constants are the plain ones."""
    out = []
    for v in rgb:
        v /= 255.0
        out.append(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92)
    r, g, b = out
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722)
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else (7.787 * t) + 16 / 116
    fx, fy, fz = f(x), f(y), f(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def dE(a, b):
    """CIE76. Good enough to answer "is this the same colour", which is all we ask."""
    la, lb = srgb_to_lab(a), srgb_to_lab(b)
    return sum((x - y) ** 2 for x, y in zip(la, lb)) ** 0.5


def chroma(rgb):
    return max(rgb) - min(rgb)


def hex_of(rgb):
    return "#%02X%02X%02X" % tuple(int(round(c)) for c in rgb)


def rgb_of(h):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


# ------------------------------------------------------------------- extraction

# A cluster is "the same colour" as another within this Lab distance. 22 keeps
# Barcelona's claret and blue apart while folding a badge's shading into one.
MERGE_DE = 22.0
# Edge antialiasing invents colours that are in neither the badge nor the kit.
MIN_ALPHA = 240
# A cluster smaller than this share of the badge is detail, not a kit colour.
MIN_SHARE = 0.02


def palette(path, step=2):
    """-> [(hexcolour, share_of_badge), ...] most-used first.

    Two passes on purpose. Clustering is done on 5-bit buckets, which is what makes
    shading and the source badge's compression noise collapse into one colour; but
    the colour finally reported is the most common *exact* pixel in that cluster.
    Badge art is flat colour, so that modal pixel is the real kit colour -- reporting
    the bucket centre instead put Chelsea's blue 40 dE out, a visibly different blue.
    """
    w, h, px = read_png(path)
    exact = defaultdict(int)
    total = 0
    for y in range(0, h, step):
        base = y * w * 4
        for x in range(0, w, step):
            i = base + x * 4
            if px[i + 3] < MIN_ALPHA:
                continue
            exact[(px[i], px[i + 1], px[i + 2])] += 1
            total += 1
    if not total:
        return []

    # bucket -> (count, modal exact colour, that colour's count)
    buckets = {}
    for col, n in exact.items():
        key = (col[0] >> 3, col[1] >> 3, col[2] >> 3)
        b = buckets.get(key)
        if b is None:
            buckets[key] = [n, col, n]
        else:
            b[0] += n
            if n > b[2]:
                b[1], b[2] = col, n

    # Greedy agglomeration, biggest bucket first: each bucket either joins the
    # nearest cluster it is close to, or starts one.
    clusters = []
    for key, (n, modal, mn) in sorted(buckets.items(), key=lambda kv: -kv[1][0]):
        for cl in clusters:
            if dE(modal, cl["c"]) < MERGE_DE:
                cl["n"] += n
                # the representative stays on the single most common exact pixel in
                # the cluster -- a mean of two shades is a colour the badge never uses
                if mn > cl["top"]:
                    cl["top"], cl["c"] = mn, modal
                break
        else:
            clusters.append({"c": modal, "n": n, "top": mn})

    clusters.sort(key=lambda cl: -cl["n"])
    return [(hex_of(cl["c"]), cl["n"] / total) for cl in clusters
            if cl["n"] / total >= MIN_SHARE]


# Picking c1 -- the card's background -- is the one genuinely ambiguous step, so the
# rules are named and --lead switches between them; cmd_check scores all of them at
# once rather than leaving the choice to taste. Every rule gets the same palette.
def _lead_area(pal):
    return pal[0][0]


def _lead_chroma(pal, k=2.0):
    return max(pal, key=lambda hs: hs[1] * (1.0 + k * chroma(rgb_of(hs[0])) / 255.0))[0]


def _lead_ink(pal):
    """The most-used colour that isn't near-white, falling back to the darkest.

    Most badges are drawn on white and outlined in black, and the app already puts
    the readable ink on top -- so white as a *background* is what makes a card look
    generic, the exact thing this is fixing. Juventus is the case that matters: a
    black-and-white badge whose real c1 is black, where any chroma rule is blind.
    """
    def lum(h):
        r, g, b = rgb_of(h)
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    body = [hs for hs in pal if lum(hs[0]) < 235]
    if not body:
        return pal[0][0]
    top = max(body, key=lambda hs: hs[1])
    chromatic = [hs for hs in body if chroma(rgb_of(hs[0])) >= 60]
    if chromatic:
        # a saturated colour holding at least half the leader's area wins: that is
        # Barcelona's claret over its gold, without letting a thin trim colour win
        best = max(chromatic, key=lambda hs: hs[1])
        if best[1] >= 0.5 * top[1]:
            return best[0]
    return top[0]


def _lead_top2(pal):
    """Of the two biggest blocks of colour, the more saturated one."""
    return max(pal[:2], key=lambda hs: chroma(rgb_of(hs[0])))[0]


def _lead_top3(pal):
    return max(pal[:3], key=lambda hs: chroma(rgb_of(hs[0])))[0]


def _lead_sat(pal):
    """Biggest block that is a colour rather than a neutral."""
    body = [hs for hs in pal if chroma(rgb_of(hs[0])) >= 60]
    return (max(body, key=lambda hs: hs[1]) if body else pal[0])[0]


LEADS = {
    "area": _lead_area,
    "chroma": _lead_chroma,
    "ink": _lead_ink,
    "top2": _lead_top2,
    "top3": _lead_top3,
    "sat": _lead_sat,
}


# c3 is the seam colour and c2 the secondary, so the three have to be visibly
# different or a split card loses its seam. Distance, not contrast ratio: Sepsi's
# grey on red is 1.01:1 by luminance and completely obvious to the eye.
MIN_SEP = 25.0


def _readable_on(hexcol):
    """Black or white, whichever reads on that background -- the same fallback the
    app makes at render time (onColor), so a made-up colour is never invented."""
    r, g, b = rgb_of(hexcol)
    return "#000000" if (0.2126 * r + 0.7152 * g + 0.0722 * b) > 140 else "#FFFFFF"


def fill_trio(pal, kept, lead="ink"):
    """Complete a c1/c2/c3 trio from a badge palette.

    `kept` maps slot index -> a colour we already trust and must not touch (the
    API answered that one in B13). Separation is enforced against the *final*
    trio, kept colours included: filling only the empty slots from the badge and
    hoping was what left Levante with c1 and c2 the same red.
    """
    head = LEADS[lead](pal)
    cands = [head] + [h for h, _ in pal if h != head]
    final = [kept.get(i) for i in range(3)]

    def free(c):
        return all(p is None or (c != p and dE(rgb_of(c), rgb_of(p)) >= MIN_SEP)
                   for p in final)

    for i in range(3):
        if final[i] is not None:
            continue
        pick = next((c for c in cands if free(c)), None)
        if pick is None:
            # the badge has nothing left that reads as different: fall back to the
            # pair the app itself would use, rather than repeating a colour and
            # erasing the seam
            base = next((p for p in final if p), "#FFFFFF")
            pick = next((c for c in (_readable_on(base), "#FFFFFF", "#000000")
                         if free(c)), _readable_on(base))
        final[i] = pick
    return final


def trio(path, step=2, lead="ink"):
    """The three colours to write as c1/c2/c3, in the app's own order."""
    pal = palette(path, step)
    if not pal:
        return None
    return fill_trio(pal, {}, lead)


# ------------------------------------------------------------------ the two modes

def load_teams():
    with open(TEAMS, encoding="utf-8") as f:
        return json.load(f)


def crest_path(key):
    return os.path.join(CRESTS, key + ".png")


def owed(clubs, proposed):
    """Keys whose colours are still the B13 fallback, in whole or in part."""
    out = []
    for k, v in clubs.items():
        src = proposed.get(k, {}).get("_source", {})
        miss = src.get("colours_missing") or []
        if miss:
            out.append((k, miss))
    return sorted(out)


def known_good(clubs, proposed):
    """Clubs whose colours we already trust: hand-entered originally, or answered
    in full by the API. These are the yardstick -- the extractor has to rediscover
    these before it is allowed to invent the missing ones."""
    out = []
    for k, v in clubs.items():
        src = proposed.get(k, {}).get("_source")
        if src is None:
            out.append(k)                    # one of the original hand-entered 60
        elif not (src.get("colours_missing") or []):
            out.append(k)                    # API gave all three
    return sorted(out)


def cmd_check(keys, step, lead="ink"):
    teams = load_teams()
    clubs = teams["clubs"]
    with open(PROPOSED, encoding="utf-8") as f:
        proposed = json.load(f)["clubs"]
    pool = keys or known_good(clubs, proposed)
    pool = [k for k in pool if os.path.exists(crest_path(k))]

    hits = defaultdict(int)
    per_slot = defaultdict(lambda: [0, 0])
    lead_hits = defaultdict(int)
    worst = []
    n = 0
    for k in pool:
        try:
            pal = palette(crest_path(k), step)
        except Exception as e:
            print("  ! %-18s %s" % (k, e))
            continue
        if not pal:
            continue
        want = [clubs[k].get(c, "") for c in ("c1", "c2", "c3")]
        want = [w for w in want if w]
        if not want:
            continue
        n += 1

        # does the palette contain each known colour at all? (rule-independent)
        found = 0
        for i, w in enumerate(want):
            close = min(dE(rgb_of(w), rgb_of(h)) for h, _ in pal)
            per_slot["c%d" % (i + 1)][1] += 1
            if close < 25:
                per_slot["c%d" % (i + 1)][0] += 1
                found += 1
        hits[found] += 1

        # and does each rule put the right colour in c1?
        for name, fn in LEADS.items():
            d = dE(rgb_of(want[0]), rgb_of(fn(pal)))
            if d < 25:
                lead_hits[name] += 1
        got = LEADS[lead](pal)
        worst.append((dE(rgb_of(want[0]), rgb_of(got)), k, want[0], got))

    print("checked %d clubs whose colours we already trust" % n)
    if not n:
        return
    print("\nis the colour in the extracted palette at all? (dE<25)")
    for f in sorted(hits, reverse=True):
        print("  %d of 3   %3d clubs  (%4.1f%%)" % (f, hits[f], 100.0 * hits[f] / n))
    for slot in ("c1", "c2", "c3"):
        ok, tot = per_slot[slot]
        if tot:
            print("  %s found  %3d/%3d  %4.1f%%" % (slot, ok, tot, 100.0 * ok / tot))
    print("\nwhich rule puts the club's MAIN colour in c1:")
    for name in sorted(LEADS):
        print("  --lead %-7s %3d/%3d  %4.1f%%%s"
              % (name, lead_hits[name], n, 100.0 * lead_hits[name] / n,
                 "   <- in use" if name == lead else ""))
    worst.sort(reverse=True)
    print("\nfurthest 12 on c1 with --lead %s -- what shipping this gets wrong:" % lead)
    for d, k, w, g in worst[:12]:
        print("  %-18s want %s  got %s   dE %5.1f" % (k, w, g, d))


def cmd_propose(keys, step, lead="ink"):
    teams = load_teams()
    clubs = teams["clubs"]
    with open(PROPOSED, encoding="utf-8") as f:
        proposed = json.load(f)["clubs"]
    debt = owed(clubs, proposed)
    if keys:
        debt = [(k, m) for k, m in debt if k in keys]

    out, skipped = {}, []
    for k, miss in debt:
        p = crest_path(k)
        if not os.path.exists(p):
            skipped.append(k)
            continue
        try:
            pal = palette(p, step)
        except Exception as e:
            skipped.append("%s (%s)" % (k, e))
            continue
        if not pal:
            skipped.append(k)
            continue
        # Only overwrite the slots the API actually failed to answer. A colour that
        # came back real in B13 is better evidence than a badge, so it stays -- and
        # the badge-derived ones are chosen around it.
        kept = {i: clubs[k][s] for i, s in enumerate(("c1", "c2", "c3"))
                if (i + 1) not in miss}
        got = fill_trio(pal, kept, lead)
        rec = {"name": clubs[k].get("name", k), "missing": miss}
        for i, slot in enumerate(("c1", "c2", "c3")):
            rec[slot] = got[i]
            if (i + 1) in miss:
                rec[slot + "_was"] = clubs[k][slot]
        rec["palette"] = [h for h, _ in pal]
        out[k] = rec

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"note": "Colours read off crests/<key>.png by tools/crest_colours.py. "
                           "Review, edit freely, then --apply. Only the slots listed in "
                           "'missing' are changed; '<slot>_was' records the fallback it "
                           "replaces.",
                   "clubs": out}, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("proposed colours for %d clubs -> %s" % (len(out), os.path.relpath(OUT, ROOT)))
    if skipped:
        print("skipped %d: %s" % (len(skipped), ", ".join(skipped[:10])))


def cmd_apply(keys):
    with open(OUT, encoding="utf-8") as f:
        prop = json.load(f)["clubs"]
    teams = load_teams()
    clubs = teams["clubs"]
    changed = 0
    for k, rec in prop.items():
        if keys and k not in keys:
            continue
        if k not in clubs:
            continue
        for slot in ("c1", "c2", "c3"):
            if clubs[k].get(slot) != rec[slot]:
                clubs[k][slot] = rec[slot]
                changed = 1 + changed
    with open(TEAMS, "w", encoding="utf-8") as f:
        json.dump(teams, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("applied: %d colour slots changed across teams.json" % changed)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true",
                    help="score the extractor against clubs whose colours we trust")
    ap.add_argument("--propose", action="store_true",
                    help="write tools/teams-colours.json for the clubs still owed colours")
    ap.add_argument("--apply", action="store_true",
                    help="merge tools/teams-colours.json into teams.json")
    ap.add_argument("--only", default="", help="comma-separated team keys")
    ap.add_argument("--lead", default="ink", choices=sorted(LEADS),
                    help="rule for choosing c1, the card background (default ink)")
    ap.add_argument("--step", type=int, default=2,
                    help="sample every Nth pixel (default 2; 1 is exact and ~4x slower)")
    a = ap.parse_args()
    keys = [k.strip() for k in a.only.split(",") if k.strip()]
    if a.check:
        cmd_check(keys, a.step, a.lead)
    elif a.propose:
        cmd_propose(keys, a.step, a.lead)
    elif a.apply:
        cmd_apply(keys)
    else:
        ap.print_help()
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
