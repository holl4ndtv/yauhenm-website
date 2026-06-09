#!/bin/bash
# update-content.sh — pulls latest YouTube + TikTok videos into the LIVE homepage.
#
# Targets ../index.html (the deployed site root, derived from this script's location).
# Rewritten 2026-06-09: the old version patched website/prototypes/ + website/v4-deploy/
# (both gone) and matched pre-WebP markup, so it silently updated nothing.
#
# What it does:
#   1. yt-dlp: latest 2 YouTube videos (@yauhenm) + latest 4 TikToks (@y.massalski)
#   2. Downloads thumbnails -> converts to .webp (cwebp, else ffmpeg, else keeps .jpg)
#   3. Patches the two .video-card and four .tt-card blocks in index.html (backup kept)
#   4. If TikTok scraping fails, YouTube still updates; TT cards stay as they are.
#
# After it runs: review, then  cd .. && git add -A && git commit -m "Refresh videos" && git push
# (push -> Vercel auto-deploys in ~15s)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
HTML="$ROOT/index.html"
ASSETS="$ROOT/_assets"

YT_HANDLE="@yauhenm"
TT_HANDLE="@y.massalski"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# ─── Pre-flight ────────────────────────────────────────────────────────
[ -f "$HTML" ] || { echo "✗ index.html not found at $HTML"; exit 1; }
command -v yt-dlp >/dev/null || { echo "✗ yt-dlp not installed — brew install yt-dlp"; exit 1; }
command -v python3 >/dev/null || { echo "✗ python3 not found"; exit 1; }

# webp converter: cwebp preferred, ffmpeg fallback, else keep jpg
CONVERTER="none"
command -v cwebp >/dev/null && CONVERTER="cwebp"
[ "$CONVERTER" = "none" ] && command -v ffmpeg >/dev/null && CONVERTER="ffmpeg"

to_webp() { # $1 = src jpg, $2 = dest webp ; echoes final path actually written
  local src="$1" dest="$2"
  case "$CONVERTER" in
    cwebp)  cwebp -quiet -q 80 "$src" -o "$dest" >/dev/null 2>&1 && { echo "$dest"; return; } ;;
    ffmpeg) ffmpeg -loglevel error -y -i "$src" -q:v 80 "$dest" >/dev/null 2>&1 && { echo "$dest"; return; } ;;
  esac
  # conversion unavailable/failed -> ship the jpg
  local jpg="${dest%.webp}.jpg"
  cp "$src" "$jpg"
  echo "$jpg"
}

echo "── update-content ─────────────────────────"
echo "  target:  $HTML"
echo "  webp:    $CONVERTER"
echo

# ─── 1. YouTube: latest 2 ──────────────────────────────────────────────
echo "1/3  YouTube ($YT_HANDLE)..."
yt-dlp --flat-playlist --dump-json --playlist-end 2 \
  "https://www.youtube.com/$YT_HANDLE/videos" > "$WORK/yt.jsonl" 2>/dev/null \
  || { echo "✗ YouTube pull failed"; exit 1; }
[ -s "$WORK/yt.jsonl" ] || { echo "✗ YouTube returned no videos"; exit 1; }

# thumbnails: maxresdefault with hqdefault fallback (maxres 404s on some videos)
while IFS= read -r line; do
  id=$(printf '%s' "$line" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')
  code=$(curl -s -o "$WORK/yt_$id.jpg" -w '%{http_code}' "https://i.ytimg.com/vi/$id/maxresdefault.jpg")
  if [ "$code" != "200" ]; then
    curl -s -o "$WORK/yt_$id.jpg" "https://i.ytimg.com/vi/$id/hqdefault.jpg"
  fi
  final=$(to_webp "$WORK/yt_$id.jpg" "$ASSETS/yt_$id.webp")
  echo "    ✓ $id thumb -> $(basename "$final")"
done < "$WORK/yt.jsonl"

# ─── 2. TikTok: latest 4 (tolerated failure) ───────────────────────────
echo "2/3  TikTok ($TT_HANDLE)..."
TT_OK=1
yt-dlp --flat-playlist --dump-json --playlist-end 4 \
  "https://www.tiktok.com/$TT_HANDLE" > "$WORK/tt.jsonl" 2>/dev/null || TT_OK=0
[ -s "$WORK/tt.jsonl" ] || TT_OK=0

if [ "$TT_OK" = "1" ]; then
  : > "$WORK/tt_ready.jsonl"
  while IFS= read -r line; do
    id=$(printf '%s' "$line" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("id",""))')
    [ -n "$id" ] || continue
    thumb=$(printf '%s' "$line" | python3 -c '
import json,sys
d=json.load(sys.stdin)
t=d.get("thumbnail") or (d.get("thumbnails") or [{}])[-1].get("url","")
print(t)')
    if [ -n "$thumb" ] && curl -s -m 20 -o "$WORK/tt_$id.jpg" -H 'User-Agent: Mozilla/5.0' "$thumb" && [ -s "$WORK/tt_$id.jpg" ]; then
      final=$(to_webp "$WORK/tt_$id.jpg" "$ASSETS/tt_$id.webp")
      printf '%s' "$line" | python3 -c "
import json,sys
d=json.load(sys.stdin)
d['_asset']='_assets/$(basename "$final")'
print(json.dumps(d))" >> "$WORK/tt_ready.jsonl"
      echo "    ✓ $id thumb -> $(basename "$final")"
    else
      echo "    ⚠ $id: no thumbnail — card will keep its current slot"
    fi
  done < "$WORK/tt.jsonl"
  [ -s "$WORK/tt_ready.jsonl" ] || TT_OK=0
fi
[ "$TT_OK" = "1" ] || echo "    ⚠ TikTok pull failed — leaving TikTok cards untouched"

# ─── 3. Patch index.html ───────────────────────────────────────────────
echo "3/3  Patching index.html..."
cp "$HTML" "$HTML.bak"

export UC_HTML="$HTML" UC_WORK="$WORK" UC_TT_OK="$TT_OK" UC_TODAY="$(date +%F)"
python3 - <<'PY'
import html as H, json, os, re, sys

p = os.environ["UC_HTML"]
work = os.environ["UC_WORK"]
tt_ok = os.environ["UC_TT_OK"] == "1"
today = os.environ["UC_TODAY"]

src = open(p, encoding="utf-8").read()

def fmt_dur(sec):
    try: sec = int(float(sec))
    except (TypeError, ValueError): return "—"
    return f"{sec // 60}:{sec % 60:02d}"

# --- YouTube cards (markup must mirror index.html exactly) ---
yt = [json.loads(l) for l in open(f"{work}/yt.jsonl", encoding="utf-8") if l.strip()][:2]

YT_PATTERN = re.compile(
    r'<a class="video-card" href="https://www\.youtube\.com/watch\?v=[^"]+"[^>]*>\s*'
    r'<div class="video-card-img">.*?</div>\s*'
    r'<div class="video-card-grade"></div>\s*'
    r'<span class="video-card-meta">[^<]*</span>\s*'
    r'<span class="video-card-play">.*?</span>\s*'
    r'<h3 class="video-card-title">[^<]*</h3>\s*</a>',
    re.S)

def yt_card(v):
    vid, title, dur = v["id"], H.escape(v.get("title") or ""), fmt_dur(v.get("duration"))
    return (f'<a class="video-card" href="https://www.youtube.com/watch?v={vid}" target="_blank" rel="noopener">\n'
            f'        <div class="video-card-img"><img class="ph" loading="lazy" decoding="async" src="_assets/yt_{vid}.webp" alt=""></div>\n'
            f'        <div class="video-card-grade"></div>\n'
            f'        <span class="video-card-meta">{dur} · YouTube</span>\n'
            f'        <span class="video-card-play"><svg viewBox="0 0 24 24"><path d="M5 3l16 9-16 9z"/></svg></span>\n'
            f'        <h3 class="video-card-title">{title}</h3>\n'
            f'      </a>')

found = len(YT_PATTERN.findall(src))
if found < 2:
    sys.exit(f"✗ expected 2 video-card blocks, found {found} — markup drifted, fix YT_PATTERN")
new_yt = [yt_card(v) for v in yt]
i = [0]
def yt_sub(m):
    if i[0] < len(new_yt):
        c = new_yt[i[0]]; i[0] += 1; return c
    return m.group(0)
src = YT_PATTERN.sub(yt_sub, src, count=2)
print(f"  ✓ YouTube: {', '.join(v['id'] for v in yt)}")

# --- TikTok cards ---
if tt_ok:
    tt = [json.loads(l) for l in open(f"{work}/tt_ready.jsonl", encoding="utf-8") if l.strip()][:4]

    TT_PATTERN = re.compile(
        r'<a class="tt-card" href="https://www\.tiktok\.com/@y\.massalski/video/\d+"[^>]*>\s*'
        r'<div class="tt-thumb">.*?</div>\s*'
        r'<div class="tt-cap">.*?</div>\s*'
        r'</a>',
        re.S)

    def tt_title(raw):
        t = re.sub(r"#\w*", "", raw or "")          # \w* also kills a dangling bare "#"
        t = re.sub(r"\s+", " ", t).strip().rstrip(".!?#").strip()
        if not t: return "New drop"
        return t[:70]

    def tt_meta(raw):
        tags = re.findall(r"#(\w+)", raw or "")
        main = tags[0].lower() if tags else "tiktok"
        return f"<b>#{H.escape(main)}</b> · ai · vibecoding"

    def tt_card(v):
        vid, raw = v["id"], v.get("title") or ""
        return (f'<a class="tt-card" href="https://www.tiktok.com/@y.massalski/video/{vid}" target="_blank" rel="noopener">\n'
                f'        <div class="tt-thumb">\n'
                f'          <div class="tt-card-img"><img class="ph" loading="lazy" decoding="async" src="{v["_asset"]}" alt=""></div>\n'
                f'          <div class="tt-card-grade"></div>\n'
                f'          <span class="tt-card-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 3l16 9-16 9z"/></svg></span>\n'
                f'        </div>\n'
                f'        <div class="tt-cap">\n'
                f'          <span class="tt-cap-title">{H.escape(tt_title(raw))}</span>\n'
                f'          <span class="tt-card-meta">{tt_meta(raw)}</span>\n'
                f'        </div>\n'
                f'      </a>')

    found_tt = len(TT_PATTERN.findall(src))
    if found_tt < 1:
        print("  ⚠ no tt-card blocks matched — markup drifted, TikTok left untouched")
    else:
        new_tt = [tt_card(v) for v in tt]
        k = [0]
        def tt_sub(m):
            if k[0] < len(new_tt):
                c = new_tt[k[0]]; k[0] += 1; return c
            return m.group(0)
        src = TT_PATTERN.sub(tt_sub, src, count=min(found_tt, len(new_tt)))
        print(f"  ✓ TikTok: {', '.join(v['id'] for v in tt)}")
else:
    print("  – TikTok skipped")

# refresh the provenance comment
src = re.sub(r"Real videos pulled via yt-dlp from @yauhenm \d{4}-\d{2}-\d{2}",
             f"Real videos pulled via yt-dlp from @yauhenm {today}", src)

# sanity: after patching, the patterns must still match (idempotency guard)
if len(YT_PATTERN.findall(src)) != 2:
    sys.exit("✗ self-check failed: rebuilt YT cards don't match YT_PATTERN")

open(p, "w", encoding="utf-8").write(src)
print("  ✓ wrote index.html")
PY

echo
echo "✓ Done. Review the diff, then ship:"
echo "    cd $ROOT && git diff"
echo "    git add -A && git commit -m 'Refresh videos' && git push   # Vercel auto-deploys"
echo "  Backup: $HTML.bak"
