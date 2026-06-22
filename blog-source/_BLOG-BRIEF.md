# yauhenm.com — AEO/SEO Blog Brief (the repeatable recipe)

**Use for EVERY post.** Locked from the live audit + two 3-model councils (Jun 2026). Goal of every post: get **cited by ChatGPT/Perplexity/Google AI**, rank in classic search, and make a cold founder think "this guy could fix MY business." Each post also quietly reinforces: Yauhen = pro athlete who ALSO does AI-search/SEO/D2C growth — but through the STORY, not robotic name-drops.

---

## ⚡ QUICKSTART (the 5 lines that matter)
1. **One firsthand artifact or don't publish** — a real screenshot, prompt test, anonymized client moment, real number, or contrarian lesson. If a generic AI could've written it without Yauhen's actual work/life, kill it.
2. **Answer-first** — first 40-75 words directly answer the target query, plain words.
3. **Headings = real questions** people ask AI. Add a table or numbered list.
4. **FAQ + schema at the end. Link to `/work` + one sibling post.**
5. **After publish:** 1 LinkedIn post + 1 third-party seed (Reddit/YouTube/Quora). Look at it on your phone.

---

## 0. Before you write — fill these 5 lines
- **Query type:** definition / how-to / comparison / diagnosis / case study / money-query
- **Target query** (exact thing someone asks AI): _______
- **Fan-out questions** (3-6 related sub-questions to also answer): _______
- **Who it's for:** D2C founder / ecommerce owner / marketer
- **The one action** at the end (read /work, book a call): _______

## 1. Structure — in this order
1. **H1 / title** — human hook (story or curiosity). Put the target query in the SEO title + meta even if the H1 is a story.
2. **`Last updated: <date>`** — visible. (Keep it honest — a fresh date only helps if the content actually changed.)
3. **Answer-first block** — 40-75 words, directly answers the target query in plain words. What AI copies. Non-negotiable.
4. **Hero image** — in the BODY. On-brand: dark `#0E0C0A` + gold `#C9A961`, editorial, no AI-robot clichés. (Test on mobile — don't let it shove the answer block too far down.)
5. **Story hook** — the real first-hand moment. The part AI can't fake + Google rewards.
6. **Question H2s** — every heading a REAL question someone asks AI. One idea per section.
7. **Table or numbered list** — comparison or steps. AI quotes these.
8. **Closing H2 = the money question** → answer YES + link to `/work` (or `/#work`) with explicit anchor text.
9. **FAQ block** — 3-5 Q&As = fan-out questions. Must match the schema text exactly.
10. **JSON-LD** — `BlogPosting` + author `Person` (sameAs) + `FAQPage` always. `Service` only when the post is directly about the offer. (If the blog builder can auto-generate schema from frontmatter/FAQ later, do that instead of hand-writing it.)

## 2. Voice (Yauhen's)
- Blunt, first-person, short sentences. Real quotes. Hard lessons.
- Plain English — non-coder founder, reads on phone. No "leverage/synergy" slop.
- **Don't force "Yauhen Massalski helps…" into the body** — it reads like SEO filler and founders buy the PERSON. Entity clarity comes from the author bio, schema, About/Work links, and natural mentions. Name yourself in 3rd person AT MOST once, where it's natural.
- **Anti-slop = the proof rule** above. The problem isn't the number "7" in "7 tips" — it's generic copycat content. A "7 things I learned losing $X" with real specifics is fine.

## 3. Honesty / claims (he WILL reject violations)
- Cited ≠ clicks ≠ sales. Never imply traffic = revenue.
- Hedge absolutes. No "AI never", no "X days" promises, no unverified ®.
- Result not proven yet → "fixing in public" / "a target, not a guarantee", NOT "I fixed it."
- Soften unverifiable stats or cite a source.

## 4. Private-info stripping
- **Publish:** the method, the lesson, the shape. His OWN products by name (GMMY/YUMM/Second Brain/yauhenm).
- **Anonymize:** real client work → "a D2C brand I worked with", "a specialty eyewear brand". Strip names, logos, raw revenue/traffic/dashboards, account IDs.
- **Default when unsure: anonymize.** Raw numbers/dashboards/full audits stay private → "I'll walk through a real one on a call."

## 5. Internal links (mandatory — clusters beat lonely posts)
- Link to `/work` (or `/#work`).
- Link to ≥1 sibling post.
- When publishing, update ONE older related post to link back to the new one.

## 6. After publish (distribution — ~85% of AI citations are third-party)
- **Always:** 1 LinkedIn post (the story + link).
- **Plus 1 third-party seed**, whichever is easiest to repeat: Reddit answer, YouTube Short/transcript, or Quora-style answer. Keep it small so you actually do it. Full distribution playbook lives separately.

## 7. Publish steps (mechanical) — the gate is mandatory
1. Markdown in `blog-source/posts/YYYY-MM-DD-slug.md` (frontmatter: title, slug, date, lastUpdated, lane, description, tags, image, imageAlt).
2. Hero `<img>` in the BODY; image file in `_assets/blog/`.
3. **AEO/SEO GATE — must PASS, no ❌, before shipping:** `python3 blog-source/_drafts/aeo_seo_gate.py <dir>`. Auto-checks every brief + seo-audit + ai-seo rule: answer-first 30-90w bold, ≥3 question H2s, table/list, ≥3 `### FAQ`, `/#work` link, freshness date, meta 80-200c, entity not-robotic, no fabricated $, no stray URLs, cited≠clicks hedge where traffic is claimed.
4. Schema is automatic — the builder emits BlogPosting + FAQPage + author entity. Do NOT hand-write JSON-LD.
5. `node scripts/build-blog.mjs`
6. QC: serve + LOOK (desktop + phone). Validate JSON-LD parses.
7. `git add -A && commit && push` → auto-deploys Vercel.

## 8. Cadence + measure
- ~1 strong first-hand post/week. Quality > volume.
- **Refresh rule:** update an old post only when something material changes (new example/screenshot/test/recommendation) — then bump the date.
- Re-run `probe_multi.py --brand yauhenm` monthly. Scoreboard = does AI name/describe him right, NOT week-1 traffic. (If posts get cited WITHOUT off-site seeds → distribution can stay light. If not → off-site becomes mandatory.)

## 9. Topic backlog (own the D2C founder queries he's invisible for)
1. ✅ "ChatGPT thought I was only a basketball player" (entity case study) — SHIPPED
2. "Who can help my D2C brand show up in ChatGPT?" (demand capture — do next)
3. "Why ChatGPT doesn't mention your brand"
4. "How to check if your Shopify brand shows up in ChatGPT" (how-to)
5. "How to make AI answers recommend your D2C brand"
6. "AI search audit checklist for ecommerce brands"
7. "ChatGPT vs Perplexity vs Google AI — where D2C brands should measure"
8. PIVOT (not generic "AEO vs SEO" → attracts junior SEOs, not founders): **"Why classic D2C SEO is failing in ChatGPT — and what to do instead"**
- Athlete/operator story = trust fuel INSIDE posts, not a standalone demand topic.

---
**Checklist before publish:** firsthand artifact ✓ · answer-first ✓ · question H2s ✓ · table/list ✓ · FAQ+schema ✓ · /work + sibling link ✓ · claims hedged ✓ · client data stripped ✓ · looked at it on phone ✓ · LinkedIn + 1 third-party seed queued ✓
