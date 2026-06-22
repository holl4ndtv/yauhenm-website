#!/usr/bin/env python3
"""Local blog generator. qwen3.6 writes each post from the master brief + its spec.
Uses ollama HTTP API (think off, clean output, length-capped).
Usage: python3 gen.py 1        |  python3 gen.py all  |  python3 gen.py 1 4 7
Drafts land here as NN-slug.md
"""
import re, sys, json, urllib.request, pathlib, time

HERE = pathlib.Path(__file__).parent
BLOG = HERE.parent
BRIEF = (BLOG / "_BLOG-BRIEF.md").read_text()
SPECS = (BLOG / "_BATCH-10-SPECS.md").read_text()
MODEL = "qwen3.6:35b-a3b"
API = "http://localhost:11434/api/generate"

blocks = re.split(r'\n## (\d+)\. ', SPECS)
specs = {}
for i in range(1, len(blocks), 2):
    num = blocks[i]; body = blocks[i+1]
    slug = body.splitlines()[0].strip()
    specs[int(num)] = (slug, "## " + num + ". " + body.split("\n---")[0])

def gen(n):
    slug, spec = specs[n]
    prompt = f"""You are Yauhen Massalski writing a blog post for yauhenm.com. Pro basketball player who ALSO does AI-search/SEO/D2C growth consulting. FIRST PERSON, blunt, short sentences, real lessons, plain English a non-coder founder reads on a phone. No corporate slop, no "leverage/synergy", no generic listicle filler.

Follow this BRIEF exactly:
{BRIEF}

Write THIS post:
{spec}

HARD OUTPUT RULES:
- Output ONLY clean markdown. No preamble, no explanation, no "here is".
- Start with YAML frontmatter (--- ... ---): title, slug: {slug}, date: 2026-06-21, lastUpdated: 2026-06-21, lane: ai-search, description (1 sentence answer), tags: [3-5].
- Then a bold 40-75 word answer-first paragraph that directly answers the target query.
- Then the body: question-style H2s using ## (not ###), ONE markdown table OR numbered list, and a short FAQ (use ### for each FAQ question).
- Use ONLY the firsthand facts in the spec. Anonymize client work exactly as written. Hedge claims (cited != clicks != sales).
- NEVER invent numbers, dollar amounts ($X), client names, quotes, stats, or sources. No fake "a founder lost $40k" specifics. If you need an example, keep it general. Only the spec's facts are real.
- Do NOT write any JSON-LD / schema block — it is added separately.
- Do NOT add image markdown or image URLs — added separately.
- STRICT LENGTH: 650-950 words total. Tight. Cut filler.
"""
    payload = {"model": MODEL, "prompt": prompt, "stream": False, "think": False,
               "options": {"temperature": 0.7, "num_predict": 1500, "top_p": 0.9}}
    out = HERE / f"{n:02d}-{slug}.md"
    t = time.time()
    print(f"[{n}] {slug} -> writing...", flush=True)
    req = urllib.request.Request(API, data=json.dumps(payload).encode(), headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=1200) as r:
        resp = json.loads(r.read())
    text = resp.get("response","").strip()
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.S).strip()
    text = re.sub(r'^```(markdown)?\n?|\n?```$', '', text).strip()
    out.write_text(text)
    wc = len(re.sub(r'[#*`|>-]',' ',text).split())
    print(f"[{n}] done {wc} words, {int(time.time()-t)}s -> {out.name}", flush=True)

args = sys.argv[1:]
targets = list(specs.keys()) if (not args or args[0]=="all") else [int(x) for x in args]
for n in targets:
    try: gen(n)
    except Exception as e: print(f"[{n}] ERROR: {e}", flush=True)
print("ALL DONE")
