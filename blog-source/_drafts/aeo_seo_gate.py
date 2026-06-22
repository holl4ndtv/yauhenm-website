#!/usr/bin/env python3
"""AEO/SEO rule gate — runs the seo-audit + ai-seo + brief rules automatically on every post.
Usage: python3 aeo_seo_gate.py [dir]   (default: drafts + ../posts)
Prints PASS/FAIL per rule per file. A post should pass before it ships.
"""
import re, sys, glob, os

ALLOWED_URLS = ["youtube.com/@yauhenm","tiktok.com/@y.massalski","linkedin.com/in/yauhen-massalski","yauhenm.com","schema.org"]

def frontmatter(t):
    m = re.match(r'^---\n(.*?)\n---\n', t, re.S)
    if not m: return {}, t
    fm = {}
    for line in m.group(1).splitlines():
        if ':' in line:
            k,v = line.split(':',1); fm[k.strip()] = v.strip().strip('"')
    return fm, t[m.end():]

def check(path):
    t = open(path).read()
    fm, body = frontmatter(t)
    wc = len(re.sub(r'[#*`|>\-\[\]()]', ' ', body).split())
    h2s = re.findall(r'^##\s+(.+)$', body, re.M)
    faqs = re.findall(r'^###\s+(.+\?)\s*$', body, re.M)
    # answer-first: a **bold** block in the first ~600 chars of body, 30-90 words
    head = body.lstrip()[:700]
    af = re.search(r'\*\*(.+?)\*\*', head, re.S)
    af_words = len(af.group(1).split()) if af else 0
    money = re.findall(r'\$\s?\d', body)
    pcts = re.findall(r'\b\d{2,3}%', body)
    urls = re.findall(r'https?://[^\s)\"\'`]+', body)
    bad_urls = [u for u in urls if not any(a in u for a in ALLOWED_URLS)]
    entity = len(re.findall(r'Yauhen Massalski', body))

    R = []  # (rule, pass, detail)
    R.append(("frontmatter complete", all(k in fm for k in ['title','slug','date','description']), ''))
    R.append(("slug kebab-case", bool(re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', fm.get('slug',''))), fm.get('slug','')))
    R.append(("meta desc 80-200 chars", 80 <= len(fm.get('description','')) <= 200, f"{len(fm.get('description',''))}c"))
    R.append(("freshness date", 'lastUpdated' in fm or 'last updated' in body.lower(), ''))
    R.append(("answer-first 30-90w bold", af is not None and 25 <= af_words <= 95, f"{af_words}w"))
    R.append(("≥3 question H2s", sum(1 for h in h2s if h.strip().endswith('?')) >= 3, f"{sum(1 for h in h2s if h.strip().endswith('?'))}/{len(h2s)}"))
    R.append(("table or numbered list", bool(re.search(r'\n\|.+\|', body)) or bool(re.search(r'^\s*1\.\s', body, re.M)), ''))
    R.append(("FAQ (### Q?) ≥3", len(faqs) >= 3, f"{len(faqs)}"))
    R.append(("internal /work link", '/#work' in body or '(/work' in body, ''))
    R.append(("word count 600-1700", 600 <= wc <= 1700, f"{wc}"))
    R.append(("entity not robotic (≤8x)", entity <= 8, f"{entity}x"))
    # hedge only REQUIRED when the post cites a traffic/session number
    claims_traffic = bool(re.search(r'\b\d{2,4}\s+(sessions|visits|clicks)|sessions from AI|AI-referred', body, re.I))
    has_hedge = bool(re.search(r'not\s+sales|≠|!=|cited.{0,12}click|sessions.{0,15}not|traffic,?\s+not', body, re.I))
    R.append(("cited≠clicks hedge (if claims traffic)", (not claims_traffic) or has_hedge, 'claims traffic' if claims_traffic and not has_hedge else ''))
    R.append(("NO fabricated $", not money, str(money[:3])))
    R.append(("NO stray/foreign URLs", not bad_urls, str(bad_urls[:2])))
    return R, wc

def main():
    targets = sys.argv[1:] or [".", "../posts"]
    files = []
    for d in targets:
        files += sorted(glob.glob(os.path.join(d, "[0-9]*.md"))) if os.path.isdir(d) else []
    # posts use date-prefixed names too
    for d in targets:
        if d.endswith("posts"):
            files += sorted(glob.glob(os.path.join(d, "2026-*.md")))
    files = sorted(set(files))
    for f in files:
        R, wc = check(f)
        fails = [r for r in R if not r[1]]
        status = "✅ PASS" if not fails else f"❌ {len(fails)} FAIL"
        print(f"\n{os.path.basename(f)}  [{status}]")
        for rule, ok, detail in R:
            if not ok:
                print(f"   ✗ {rule}  {('· '+detail) if detail else ''}")
    print(f"\n— gate checks {len(files)} files against the AEO/SEO/brief rules —")

if __name__ == "__main__":
    main()
