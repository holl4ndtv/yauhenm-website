#!/bin/bash
# update-website — pulls latest content from Yauhen's socials and updates v4-hub.html
# Usage: just run `update-website` (or this script directly) from anywhere.

set -euo pipefail

# ─── Paths ─────────────────────────────────────────────────────────────
PROJECT="$HOME/projects/personal/47-yauhen-brand/website/prototypes"
HTML="$PROJECT/v4-hub.html"
DEPLOY_HTML="$HOME/projects/personal/47-yauhen-brand/website/v4-deploy/index.html"
DEPLOY_ASSETS="$HOME/projects/personal/47-yauhen-brand/website/v4-deploy/_assets"
ASSETS="$PROJECT/_assets"
LOGOS="$ASSETS/logos"

YT_HANDLE="@yauhenm"
YT_CHANNEL_ID="UCy5NUrDYNrfm24n_u9KPNLA"
TT_HANDLE="@y.massalski"

# ─── Pre-flight ────────────────────────────────────────────────────────
if [ ! -f "$HTML" ]; then
  echo "✗ v4-hub.html not found at $HTML"
  exit 1
fi
if ! command -v yt-dlp >/dev/null; then
  echo "✗ yt-dlp not installed — run: brew install yt-dlp"
  exit 1
fi
if ! command -v jq >/dev/null; then
  echo "✗ jq not installed — run: brew install jq"
  exit 1
fi

echo "── update-website ─────────────────────────"
echo "  YouTube: https://www.youtube.com/$YT_HANDLE"
echo "  TikTok:  https://www.tiktok.com/$TT_HANDLE"
echo

# ─── 1. Fetch latest 2 YouTube videos ──────────────────────────────────
echo "1/3  Pulling YouTube videos..."
YT_JSON=$(yt-dlp --flat-playlist --dump-json --playlist-end 2 \
  "https://www.youtube.com/$YT_HANDLE/videos" 2>/dev/null)

YT1_ID=$(echo "$YT_JSON" | jq -r 'select(.).id' | sed -n '1p')
YT1_TITLE=$(echo "$YT_JSON" | jq -r 'select(.).title' | sed -n '1p')
YT1_DUR=$(echo "$YT_JSON" | jq -r 'select(.).duration' | sed -n '1p')
YT2_ID=$(echo "$YT_JSON" | jq -r 'select(.).id' | sed -n '2p')
YT2_TITLE=$(echo "$YT_JSON" | jq -r 'select(.).title' | sed -n '2p')
YT2_DUR=$(echo "$YT_JSON" | jq -r 'select(.).duration' | sed -n '2p')

format_dur(){ printf "%d:%02d" $(($1/60)) $(($1%60)); }

YT1_DUR_FMT=$(format_dur "${YT1_DUR%.*}")
YT2_DUR_FMT=$(format_dur "${YT2_DUR%.*}")

echo "    [1] $YT1_ID · $YT1_DUR_FMT · $YT1_TITLE"
echo "    [2] $YT2_ID · $YT2_DUR_FMT · $YT2_TITLE"

# Pull thumbnails (into both prototype and deploy asset dirs)
curl -s -o "$ASSETS/yt_${YT1_ID}.jpg" "https://i.ytimg.com/vi/${YT1_ID}/maxresdefault.jpg"
curl -s -o "$ASSETS/yt_${YT2_ID}.jpg" "https://i.ytimg.com/vi/${YT2_ID}/maxresdefault.jpg"
[ -d "$DEPLOY_ASSETS" ] && cp "$ASSETS/yt_${YT1_ID}.jpg" "$DEPLOY_ASSETS/" && cp "$ASSETS/yt_${YT2_ID}.jpg" "$DEPLOY_ASSETS/"

# ─── 2. Fetch latest 4 TikTok videos ───────────────────────────────────
echo "2/3  Pulling TikTok videos..."
TT_JSON=$(yt-dlp --flat-playlist --dump-json --playlist-end 4 \
  "https://www.tiktok.com/$TT_HANDLE" 2>/dev/null)

TT_IDS=()
TT_TITLES_RAW=()
while IFS= read -r line; do
  TT_IDS+=("$(echo "$line" | jq -r '.id')")
  TT_TITLES_RAW+=("$(echo "$line" | jq -r '.title')")
done < <(echo "$TT_JSON" | head -n 4)

for i in 0 1 2 3; do
  echo "    [$((i+1))] ${TT_IDS[$i]:-?} · ${TT_TITLES_RAW[$i]:-?}"
done

# ─── 3. Patch v4-hub.html AND v4-deploy/index.html ─────────────────────
echo "3/3  Patching prototype + production HTML..."
cp "$HTML" "$HTML.bak"
[ -f "$DEPLOY_HTML" ] && cp "$DEPLOY_HTML" "$DEPLOY_HTML.bak"

# Use Python for safe HTML mutation — patches both prototype and production HTML
python3 - <<PY
import re, pathlib
import html as _html

# --- inputs from bash ---
yt1_id, yt1_title, yt1_dur = "$YT1_ID", """$YT1_TITLE""".strip(), "$YT1_DUR_FMT"
yt2_id, yt2_title, yt2_dur = "$YT2_ID", """$YT2_TITLE""".strip(), "$YT2_DUR_FMT"
tt_ids = ["${TT_IDS[0]:-}", "${TT_IDS[1]:-}", "${TT_IDS[2]:-}", "${TT_IDS[3]:-}"]
tt_titles_raw = [r"""${TT_TITLES_RAW[0]:-}""", r"""${TT_TITLES_RAW[1]:-}""", r"""${TT_TITLES_RAW[2]:-}""", r"""${TT_TITLES_RAW[3]:-}"""]

# --- YT card pattern + builder ---
YT_PATTERN = re.compile(
    r'<a class="video-card" href="https://www\.youtube\.com/watch\?v=[^"]+"[^>]*>\s*'
    r'<div class="video-card-img" style="background-image:url\(\'_assets/yt_[^.]+\.jpg\'\)"></div>\s*'
    r'<div class="video-card-grade"></div>\s*'
    r'<span class="video-card-meta">[^<]+</span>\s*'
    r'<span class="video-card-play">.*?</span>\s*'
    r'<h3 class="video-card-title">[^<]+</h3>\s*</a>',
    re.S
)
def yt_card(vid_id, title, dur):
    return (f'<a class="video-card" href="https://www.youtube.com/watch?v={vid_id}" target="_blank" rel="noopener">\n'
            f'        <div class="video-card-img" style="background-image:url(\'_assets/yt_{vid_id}.jpg\')"></div>\n'
            f'        <div class="video-card-grade"></div>\n'
            f'        <span class="video-card-meta">{dur} · YouTube</span>\n'
            f'        <span class="video-card-play"><svg viewBox="0 0 24 24"><path d="M5 3l16 9-16 9z"/></svg></span>\n'
            f'        <h3 class="video-card-title">{title}</h3>\n'
            f'      </a>')

# --- TT card pattern + builder ---
TT_PATTERN = re.compile(
    r'<a class="tt-card" href="https://www\.tiktok\.com/@y\.massalski/video/\d+"[^>]*>\s*'
    r'<div class="tt-card-cover">.*?</div>\s*'
    r'<div class="tt-card-grade"></div>\s*'
    r'<span class="tt-card-meta">.*?</span>\s*'
    r'</a>',
    re.S
)
def tt_cover(title):
    if not title:
        return 'New<br><span class="gold">drop.</span>'
    t = re.sub(r'#\w+', '', title).strip().rstrip('.!?').strip()
    if not t:
        return 'New<br><span class="gold">drop.</span>'
    words = t.split()
    out_words, char_count = [], 0
    for w in words:
        if char_count + len(w) > 28: break
        out_words.append(w); char_count += len(w) + 1
    if not out_words: out_words = words[:3]
    if len(out_words) == 1:
        line1, line2 = 'I ran', out_words[0] + '.'
    else:
        mid = max(1, len(out_words) // 2)
        line1 = ' '.join(out_words[:mid])
        line2 = ' '.join(out_words[mid:]) + '.'
    return f'{_html.escape(line1)}<br><span class="gold">{_html.escape(line2)}</span>'
def tt_meta(title):
    tags = re.findall(r'#(\w+)', title or '')
    main = tags[0].lower() if tags else 'tiktok'
    return f'<b>#{main}</b> · ai · vibecoding'
def tt_card(vid_id, title):
    return (f'<a class="tt-card" href="https://www.tiktok.com/@y.massalski/video/{vid_id}" target="_blank" rel="noopener">\n'
            f'        <div class="tt-card-cover"><span class="tt-card-cover-text">{tt_cover(title)}</span></div>\n'
            f'        <div class="tt-card-grade"></div>\n'
            f'        <span class="tt-card-meta">{tt_meta(title)}</span>\n'
            f'      </a>')

# --- patch a single HTML file ---
def patch_file(p):
    html = p.read_text()
    yt_count = len(YT_PATTERN.findall(html))
    new_yt = [yt_card(yt1_id, yt1_title, yt1_dur), yt_card(yt2_id, yt2_title, yt2_dur)]
    i = [0]
    def yt_sub(m):
        if i[0] < len(new_yt):
            c = new_yt[i[0]]; i[0] += 1; return c
        return m.group(0)
    html = YT_PATTERN.sub(yt_sub, html, count=2)

    tt_count = len(TT_PATTERN.findall(html))
    new_tt = [tt_card(tt_ids[k], tt_titles_raw[k]) for k in range(len(tt_ids)) if tt_ids[k]]
    k = [0]
    def tt_sub(m):
        if k[0] < len(new_tt):
            c = new_tt[k[0]]; k[0] += 1; return c
        return m.group(0)
    html = TT_PATTERN.sub(tt_sub, html, count=len(new_tt))

    p.write_text(html)
    print(f"  ✓ {p.name}: {yt_count} YT + {tt_count} TT cards patched")

# --- patch all targets ---
TARGETS = [pathlib.Path("$HTML")]
deploy_path = pathlib.Path("$DEPLOY_HTML")
if deploy_path.exists():
    TARGETS.append(deploy_path)
for p in TARGETS:
    patch_file(p)
PY

echo
echo "✓ Updated both prototype and v4-deploy/index.html"
echo "  Reload http://localhost:4747/v4-hub.html for prototype"
echo "  Run 'cd ~/projects/personal/47-yauhen-brand/website/v4-deploy && vercel --prod --yes' to ship to yauhenm.com"
echo "  Backups: $HTML.bak  +  $DEPLOY_HTML.bak"
