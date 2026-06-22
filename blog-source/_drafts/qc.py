#!/usr/bin/env python3
"""Frontier QC pre-scan: flag likely fabrications + structure issues across all drafts.
Prints a compact report. Human/frontier still reads flagged ones."""
import re, pathlib
HERE = pathlib.Path(__file__).parent
ALLOWED_URLS = ["youtube.com/@yauhenm","tiktok.com/@y.massalski","linkedin.com/in/yauhen-massalski","yauhenm.com"]
# the only "real" numbers allowed (from specs): the car-marketplace case + general
SPEC_NUMS = {"431","173","40","11","4","1","44","85","40-75","2026","2025","2024","23","19","90","180","10","15","4","3","5","2"}

for f in sorted(HERE.glob("[0-9]*.md")):
    t = f.read_text()
    flags = []
    # fabricated money
    money = re.findall(r'\$\s?\d[\d,]*\b', t)
    if money: flags.append(f"MONEY:{money}")
    # percentages / big stats (could be invented)
    pcts = re.findall(r'\b\d{2,3}%', t)
    sus_pct = [p for p in pcts if p.rstrip('%') not in SPEC_NUMS]
    if sus_pct: flags.append(f"%?:{sorted(set(sus_pct))}")
    # urls not in allowlist
    urls = re.findall(r'https?://[^\s)\"\']+', t)
    bad = [u for u in urls if not any(a in u for a in ALLOWED_URLS)]
    if bad: flags.append(f"URL?:{sorted(set(bad))[:4]}")
    # structure
    fm = t.lstrip().startswith('---')
    h2 = len(re.findall(r'^## ',t,re.M))
    faq = '?' in t
    table = bool(re.search(r'\|.*\|.*\n\|?\s*:?-',t))
    numlist = bool(re.search(r'^\s*1\. ',t,re.M))
    wc = len(re.sub(r'[#*`|>-]',' ',t).split())
    answerfirst = bool(re.search(r'^\*\*', t.split('---',2)[-1].lstrip()[:300], re.M)) if fm else False
    st = []
    if not fm: st.append("NO-FRONTMATTER")
    if h2 < 3: st.append(f"H2={h2}")
    if not (table or numlist): st.append("NO-TABLE/LIST")
    if not faq: st.append("NO-FAQ")
    if not (650 <= wc <= 1100): st.append(f"WC={wc}")
    print(f"\n{f.name}")
    print(f"  words={wc} h2={h2} table={table} list={numlist} faq={faq} answerfirst={answerfirst}")
    if st: print("  STRUCT:", " ".join(st))
    if flags: print("  CHECK :", " | ".join(flags))
    if not st and not flags: print("  ✓ clean")
